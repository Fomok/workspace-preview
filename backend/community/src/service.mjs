import '../shared/compatibility.cjs';
import {randomUUID,createHash} from 'node:crypto';
export class Problem extends Error { constructor(status,message){super(message);this.status=status;} }
const fail=(status,message)=>{throw new Problem(status,message);};
const kinds=['rigs','boxes','pouches','packs','items'];
export const limits={bytes:2*1024*1024,items:20,listings:25,iconBytes:512*1024,cooldown:10000};
export function text(value,max,label,min=0){if(typeof value!=='string'||value.trim().length<min||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))fail(400,'Invalid '+label+'.');return value.trim();}
export function id(value){if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,35}$/.test(value))fail(400,'Invalid listing ID.');return value;}
export function cleanPack(pack){
 if(Buffer.byteLength(JSON.stringify(pack)||'')>limits.bytes)fail(413,'Pack is larger than 2 MB. Use smaller icons or fewer items.');
 try{globalThis.ZB.validateAddon(pack);}catch(e){fail(400,e.message);}
 if(!pack.items.length||pack.items.length>limits.items)fail(400,'Select 1–20 items.');
 const unique=new Set();
 for(const entry of pack.items){
  if(!kinds.includes(entry.kind)||unique.has(entry.item.id))fail(400,'Duplicate or invalid item.');unique.add(entry.item.id);
  text(entry.item.name,120,'item name',1);text(entry.item.descr||'',6000,'item description');
  if(entry.item.icon){
   const match=/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(entry.item.icon);
   if(!match)fail(400,'Public icons must be embedded PNG images.');
   const bytes=Buffer.from(match[1],'base64');
   if(bytes.length>limits.iconBytes||bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')fail(400,'Invalid PNG icon or icon larger than 512 KB.');
   const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
   if(!width||!height||width>2048||height>2048)fail(400,'Icons must be at most 2048 × 2048 pixels.');
  }
 }
 const checkFields=(value,key='')=>{
  if(typeof value==='string' && !['name','descr','description','notes','icon'].includes(key) && /[\r\n\x00]/.test(value))fail(400,'Configuration values must stay on one line.');
  if(value && typeof value==='object')for(const [field,child] of Object.entries(value)){
   if(['files','uibase','__proto__','prototype','constructor'].includes(field))fail(400,'Unsupported pack field.');
   checkFields(child,field);
  }
 };
 checkFields(pack);
 const copy=JSON.parse(JSON.stringify({bench:'zonebench-items',version:1,from:pack.from||null,families:pack.families||{},items:pack.items}));
 // Provenance belongs to the importing project, not a creator-supplied pack.
 for(const entry of copy.items){delete entry.item.communitySource;delete entry.item.files;delete entry.item.uibase;}
 return copy;
}
export function metadata(input){return {name:text(input.name,100,'pack name',3),description:text(input.description,2000,'description',10),version:text(input.version,32,'version',1),dependencies:text(input.dependencies||'',500,'dependencies'),author:text(input.author,60,'public author name',2)};}
export function publicEntry(row,user,admin){return {id:row.$id,name:row.name,description:row.description,version:row.version,dependencies:row.dependencies,author:row.author,revision:row.revision,itemCount:row.itemCount,updatedAt:row.$updatedAt,status:row.status,canEdit:!!user&&row.owner===user.$id,canModerate:admin};}
export function createService(repo,{adminIds=[],now=()=>Date.now(),uuid=()=>randomUUID().replaceAll('-','')}={}){
 const isAdmin=u=>!!u&&adminIds.includes(u.$id);
 const requireUser=u=>{if(!u||!u.emailVerification)fail(401,'Sign in with an email code first.');};
 const requireAdmin=u=>{requireUser(u);if(!isAdmin(u))fail(403,'Moderator access required.');};
 const lock=async(owner,fn)=>{
  try{await repo.create('locks',owner,{stamp:new Date(now()).toISOString()});}catch(e){if(e.status===409)fail(409,'Another change is in progress. Please retry.');throw e;}
  try{return await fn();}finally{await repo.remove('locks',owner);}
 };
 const writable=async(user)=>{
  const profile=await repo.optional('profiles',user.$id);
  if(profile?.blocked)fail(403,'Publishing is disabled for this account.');
  if(profile?.lastWrite && now()-Date.parse(profile.lastWrite)<limits.cooldown)fail(429,'Please wait a few seconds before publishing again.');
  const state={blocked:false,lastWrite:new Date(now()).toISOString()};
  if(profile)await repo.update('profiles',user.$id,state);else await repo.create('profiles',user.$id,state);
 };
 const exact=async(input)=>{const row=await repo.get('addons',id(input.id));if(input.expectedRevision!==row.revision)fail(409,'This listing changed. Refresh it before saving.');return row;};
 const ownerLocked=async(input,user,fn)=>{requireUser(user);const first=await repo.get('addons',id(input.id));if(first.owner!==user.$id&&!isAdmin(user))fail(403,'You do not own this add-on.');return lock(first.owner,async()=>fn(await exact(input)));};
 return async function handle(input,user=null){
  if(!input||typeof input!=='object')fail(400,'Invalid request.');const admin=isAdmin(user);
  switch(input.action){
   case 'siteText':{
    const rows=[];
    for(let offset=0;offset<1000;offset+=100){const page=await repo.list('sitecopy',{}, {limit:100,offset});rows.push(...page.rows);if(rows.length>=page.total)break;}
    return {entries:rows.map(r=>({source:r.source,value:r.value,revision:r.revision}))};
   }
   case 'saveSiteText':case 'resetSiteText':{
    requireAdmin(user);
    const source=text(input.source,6000,'original text',1).replace(/\s+/g,' ');
    const key=createHash('sha256').update(source).digest('hex').slice(0,32);
    if(!Number.isInteger(input.expectedRevision)||input.expectedRevision<0)fail(400,'Invalid text revision.');
    const value=input.action==='saveSiteText'?text(input.value,6000,'replacement text',1):null;
    return lock('site-copy-edit',async()=>{
     const previous=await repo.optional('sitecopy',key);
     if(previous && previous.source!==source)fail(409,'Text identity conflict.');
     if(input.expectedRevision!==(previous?.revision||0))fail(409,'This text changed in another session. Close and reopen the text editor before saving.');
     if(value===null){if(previous)await repo.remove('sitecopy',key);return {entry:{source,value:source,revision:0}};}
     if(!previous && (await repo.list('sitecopy',{}, {limit:1})).total>=1000)fail(400,'The site supports 1,000 text overrides. Restore an unused override first.');
     const data={source,value,revision:(previous?.revision||0)+1};
     if(previous)await repo.update('sitecopy',key,data);else await repo.create('sitecopy',key,data);
     return {entry:data};
    });
   }
   case 'me':return {user:user?{id:user.$id,name:user.name||'',moderator:admin,blocked:!!(await repo.optional('profiles',user.$id))?.blocked}:null};
   case 'list':{
    const mode=input.mode||'public';if(!['public','mine','moderation'].includes(mode))fail(400,'Invalid list.');if(mode==='mine')requireUser(user);if(mode==='moderation')requireAdmin(user);
    const offset=Number.isInteger(input.offset)&&input.offset>=0?Math.min(input.offset,10000):0;
    const result=await repo.list('addons',{...(mode==='public'?{status:'published'}:mode==='mine'?{owner:user.$id}:{})},{offset,limit:24,order:'$updatedAt'});
    return {items:result.rows.map(r=>publicEntry(r,user,admin)),total:result.total,offset};
   }
   case 'pack':{
    const row=await repo.get('addons',id(input.id));if(row.status!=='published'&&row.owner!==user?.$id&&!admin)fail(404,'This add-on is no longer public.');
    const pack=await repo.readPack(row.fileId);return {listing:publicEntry(row,user,admin),pack};
   }
   case 'publish':{
    requireUser(user);const meta=metadata(input);const pack=cleanPack(input.pack);
    return lock(user.$id,async()=>{
     await writable(user);if((await repo.list('addons',{owner:user.$id},{limit:1})).total>=limits.listings)fail(400,'You have reached the 25-listing limit. Update an existing pack.');
     const fileId=uuid();await repo.writePack(fileId,pack);
     try{const row=await repo.create('addons',uuid(),{...meta,owner:user.$id,status:'published',revision:1,itemCount:pack.items.length,fileId});return {listing:publicEntry(row,user,admin)};}
     catch(e){await repo.deletePack(fileId);throw e;}
    });
   }
   case 'update':{
    requireUser(user);const meta=metadata(input);const pack=input.pack?cleanPack(input.pack):null;
    return ownerLocked(input,user,async row=>{
     if(row.owner!==user.$id)fail(403,'Only the creator can edit this pack.');if(row.status==='removed')fail(403,'This listing was removed by a moderator.');await writable(user);
     const fileId=pack?uuid():row.fileId;if(pack)await repo.writePack(fileId,pack);
     let updated;try{updated=await repo.update('addons',row.$id,{...meta,fileId,itemCount:pack?pack.items.length:row.itemCount,revision:row.revision+1});}catch(e){if(pack)await repo.deletePack(fileId);throw e;}
     if(pack)await repo.deletePack(row.fileId).catch(()=>{});
     return {listing:publicEntry(updated,user,admin)};
    });
   }
   case 'unpublish':case 'republish':return ownerLocked(input,user,async row=>{
    if(row.owner!==user.$id)fail(403,'Only the creator can change publication status.');if(row.status==='removed')fail(403,'This listing was removed by a moderator.');
    if(input.action==='republish')await writable(user);
    return {listing:publicEntry(await repo.update('addons',row.$id,{status:input.action==='unpublish'?'unpublished':'published',revision:row.revision+1}),user,admin)};
   });
   case 'remove':requireAdmin(user);return ownerLocked(input,user,async row=>({listing:publicEntry(await repo.update('addons',row.$id,{status:'removed',revision:row.revision+1}),user,admin)}));
   case 'block':case 'unblock':{
    requireAdmin(user);const row=await repo.get('addons',id(input.id));if(adminIds.includes(row.owner))fail(400,'Cannot block a maintainer.');
    return lock(row.owner,async()=>{const profile=await repo.optional('profiles',row.owner);const data={blocked:input.action==='block',lastWrite:profile?.lastWrite||new Date(0).toISOString()};if(profile)await repo.update('profiles',row.owner,data);else await repo.create('profiles',row.owner,data);return {ok:true};});
   }
   case 'select':{
    requireAdmin(user);return ownerLocked(input,user,async row=>{
     const pack=await repo.readPack(row.fileId);const fileId=uuid();await repo.writePack(fileId,pack);
     const previous=await repo.optional('selections',row.$id);
     const selection={name:row.name,version:row.version,revision:row.revision,fileId,author:row.author,dependencies:row.dependencies,selectedBy:user.$id};
     try{if(previous)await repo.update('selections',row.$id,selection);else await repo.create('selections',row.$id,selection);}catch(e){await repo.deletePack(fileId);throw e;}
     if(previous)await repo.deletePack(previous.fileId).catch(()=>{});return {ok:true};
    });
   }
   case 'selections':{requireAdmin(user);const result=await repo.list('selections',{}, {limit:24,offset:Math.max(0,Number(input.offset)||0),order:'$updatedAt'});return {items:result.rows.map(r=>({id:r.$id,name:r.name,version:r.version,revision:r.revision,author:r.author,dependencies:r.dependencies})),total:result.total};}
   case 'selectedPack':{requireAdmin(user);const row=await repo.get('selections',id(input.id));return {pack:await repo.readPack(row.fileId),listing:{id:row.$id,revision:row.revision,name:row.name,version:row.version}};}
   case 'unselect':{requireAdmin(user);const addon=await repo.get('addons',id(input.id));return lock(addon.owner,async()=>{const row=await repo.get('selections',addon.$id);await repo.remove('selections',row.$id);await repo.deletePack(row.fileId).catch(()=>{});return {ok:true};});}
   default:fail(400,'Unknown operation.');
  }
 };
}
