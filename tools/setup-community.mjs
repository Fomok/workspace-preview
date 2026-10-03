import {readFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const endpoint='https://fra.cloud.appwrite.io/v1',project='6abfefea000040e18b74',functionId='zonebench-community';
const strings=(definitions)=>Object.entries(definitions).map(([key,size])=>({type:'string',key,size,required:true}));
export const schema={
 addons:[...strings({owner:36,name:100,description:2000,version:32,dependencies:500,author:60,status:16,fileId:36}),{type:'integer',key:'revision',required:true,min:1},{type:'integer',key:'itemCount',required:true,min:1,max:20}],
 profiles:[{type:'boolean',key:'blocked',required:true},{type:'datetime',key:'lastWrite',required:true}],
 locks:[{type:'datetime',key:'stamp',required:true}],
 sitecopy:[...strings({source:6000,value:6000}),{type:'integer',key:'revision',required:true,min:1}],
 selections:[...strings({name:100,version:32,fileId:36,author:60,dependencies:500,selectedBy:36}),{type:'integer',key:'revision',required:true,min:1}]
};
const scopes=['rows.read','rows.write','files.read','files.write'];
async function main(){
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({project,endpoint,database:'zonebench (serverless)',tables:Object.keys(schema),privateBucket:'zonebench-packs',function:functionId,functionScopes:scopes,changes:'Create missing resources and deploy code. No public table or storage permissions. No paid database specification.'},null,2));console.log('Review docs/community-setup.md. Use --apply only with a temporary project API key in APPWRITE_API_KEY.');return;}
 const key=process.env.APPWRITE_API_KEY;if(!key)throw Error('APPWRITE_API_KEY is missing. Do not paste it into source files or chat.');
 async function api(route,method='GET',body){
  // A referenced timer keeps Node alive even when the pending network request does not.
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(new Error('Request timed out: '+method+' '+route)),30000);
  try{
   const r=await fetch(endpoint+route,{method,headers:{'X-Appwrite-Project':project,...(route==='/functions/runtimes' && method==='GET'?{}:{'X-Appwrite-Key':key}),...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body==null?undefined:body instanceof FormData?body:JSON.stringify(body),signal:controller.signal});
   const data=r.status===204?null:await r.json();
   if(!r.ok){const e=new Error(method+' '+route+': '+(data?.message||r.status));e.status=r.status;throw e;}
   return data;
  }finally{clearTimeout(timeout);}
 }
 const ensure=async(get,post,data)=>{try{return await api(get);}catch(e){if(e.status!==404)throw e;console.log('Creating '+get);return api(post,'POST',data);}};
 await ensure('/tablesdb/zonebench','/tablesdb',{databaseId:'zonebench',name:'ZoneBench community',specification:'serverless'});
 for(const [table,columns] of Object.entries(schema)){
  const base='/tablesdb/zonebench/tables/'+table;
  const existing=await ensure(base,'/tablesdb/zonebench/tables',{tableId:table,name:table,permissions:[],rowSecurity:true,enabled:true});
  if(existing.$permissions?.length||existing.permissions?.length)throw Error('Unexpected table permissions on '+table+'. Stop and review before continuing.');
  for(const column of columns){const {type,...data}=column;await ensure(base+'/columns/'+data.key,base+'/columns/'+type,data);}
  console.log('Waiting for columns: '+table);
  let ready=false;for(let attempt=0;attempt<20;attempt++){const result=await api(base+'/columns');if(result.columns.every(x=>x.status==='available')){ready=true;break;}if(result.columns.some(x=>x.status==='failed'))throw Error('Column creation failed for '+table);await new Promise(r=>setTimeout(r,1500));}
  if(!ready)throw Error('Columns still processing. Run setup again later.');
 }
 for(const column of ['status','owner'])await ensure('/tablesdb/zonebench/tables/addons/indexes/by_'+column,'/tablesdb/zonebench/tables/addons/indexes',{key:'by_'+column,type:'key',columns:[column]});
 const bucket=await ensure('/storage/buckets/zonebench-packs','/storage/buckets',{bucketId:'zonebench-packs',name:'Private community packs',permissions:[],fileSecurity:true,enabled:true,maximumFileSize:2*1024*1024,allowedFileExtensions:['json'],compression:'gzip',encryption:true,antivirus:true});
 if(bucket.$permissions?.length||bucket.permissions?.length)throw Error('Unexpected bucket permissions. Review before continuing.');
 const runtimes=await api('/functions/runtimes');const runtime=['node-22','node-24'].find(id=>runtimes.runtimes.some(r=>r.$id===id||r.id===id||r.key===id||r.name===id));
 if(!runtime)throw Error('No supported Node 22/24 runtime found. Inspect available runtimes before deploying.');
 const config={name:'ZoneBench community library',runtime,execute:['any'],enabled:true,logging:true,timeout:60,entrypoint:'src/main.mjs',commands:'',scopes};
 let existing;try{existing=await api('/functions/'+functionId);}catch(e){if(e.status!==404)throw e;}
 if(existing)await api('/functions/'+functionId,'PUT',config);else await api('/functions','POST',{functionId,...config});
 if(process.env.ZONEBENCH_ADMIN_IDS){
  const ids=process.env.ZONEBENCH_ADMIN_IDS.split(',').map(x=>x.trim());if(ids.some(x=>!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,35}$/.test(x)))throw Error('Invalid moderator account IDs.');
  const base='/functions/'+functionId+'/variables';const vars=await api(base);const present=vars.variables.find(v=>v.key==='ZONEBENCH_ADMIN_IDS');
  await api(present?base+'/'+present.$id:base,present?'PUT':'POST',{key:'ZONEBENCH_ADMIN_IDS',value:ids.join(',')});
 }
 copyFileSync(path.join(root,'web/src/compatibility.js'),path.join(root,'backend/community/shared/compatibility.cjs'));
 mkdirSync(path.join(root,'artifacts'),{recursive:true});const archive=path.join(root,'artifacts/community-backend.tar.gz');
 const tar=spawnSync('tar',['-czf',archive,'-C',path.join(root,'backend/community'),'package.json','src','shared'],{encoding:'utf8'});if(tar.status)throw Error('Could not package backend: '+tar.stderr);
 const form=new FormData();form.append('entrypoint','src/main.mjs');form.append('commands','');form.append('activate','true');form.append('code',new Blob([readFileSync(archive)],{type:'application/gzip'}),'community-backend.tar.gz');
 const deployment=await api('/functions/'+functionId+'/deployments','POST',form);console.log(JSON.stringify({deployment:deployment.$id,status:deployment.status}));
 console.log('Backend submitted. Keep frontend community enabled:false until live email, guest access, ownership and moderation tests pass. Revoke the temporary setup key afterward.');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{await main();}catch(e){console.error('Setup failed: '+e.message);process.exitCode=1;}
}
