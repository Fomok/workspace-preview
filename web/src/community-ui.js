let COMMUNITY_MODE='public',COMMUNITY_OFFSET=0,COMMUNITY_EDIT=null;
function communityMessage(P,message,kind='hint'){const node=el('p',kind);node.textContent=message;P.appendChild(node);return node;}
function communityButton(parent,label,fn,primary=false){const b=el('button',primary?'tool primary':'tool');b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){communityMessage(parent,e.message,'warn');}finally{b.disabled=false;}};parent.appendChild(b);return b;}
function communityField(parent,label,value='',type='text'){
 const wrap=document.createElement('label');wrap.className='community-field';const title=document.createElement('span');title.textContent=label;wrap.appendChild(title);
 const input=document.createElement(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value;input.setAttribute('aria-label',label);wrap.appendChild(input);parent.appendChild(wrap);return input;
}
async function drawCommunityAccount(P){
 P.appendChild(el('h1',null,'Your account'));
 if(!Community.enabled){communityMessage(P,'Community accounts will open after backend setup is complete. The editor and local project files are available now.');return;}
 const status=communityMessage(P,'Checking sign-in…');
 let user;try{user=await Community.refresh();}catch(e){status.textContent=e.message;return;}if(!P.contains(status))return;status.remove();
 const card=el('div','card');P.appendChild(card);
 if(user){
  communityMessage(card,'Signed in as '+(user.name||'a new creator')+(user.moderator?' · Maintainer':''));
  if(user.blocked)communityMessage(card,'Publishing is disabled for this account. You can still unpublish your own listings.','warn');
  const name=communityField(card,'Public display name',user.name);name.maxLength=60;
  communityButton(card,'Save display name',async()=>{if(name.value.trim().length<2)throw new Error('Enter at least two characters.');await Community.name(name.value.trim());communityMessage(card,'Display name saved.');});
  communityButton(card,'My add-ons',async()=>{COMMUNITY_MODE='mine';COMMUNITY_OFFSET=0;TAB='catalog';render();});
  communityButton(card,'Sign out',async()=>{await Community.signOut();renderPane();});
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Account details';details.appendChild(summary);communityMessage(details,'Account ID: '+user.id);card.appendChild(details);
  return;
 }
 communityMessage(card,'Sign in to publish and manage your add-ons. Browsing and importing do not need an account. Your email is used for sign-in and is not shown on listings.');
 const email=communityField(card,'Email address','','email');email.autocomplete='email';
 const send=communityButton(card,'Send sign-in code',async()=>{
  if(!email.validity.valid||!email.value.trim())throw new Error('Enter a valid email address.');
  const phrase=await Community.sendCode(email.value.trim());send.hidden=true;email.disabled=true;
  communityMessage(card,'Enter the code from your email.'+(phrase?' Check that the email contains this phrase: '+phrase:''));
  const code=communityField(card,'Sign-in code');code.autocomplete='one-time-code';code.inputMode='numeric';
  communityButton(card,'Sign in',async()=>{await Community.verify(code.value.trim());renderPane();},true);
  communityButton(card,'Use a different email',async()=>renderPane());code.focus();
 },true);
}
async function drawCommunityCatalog(P){
 P.appendChild(el('h1',null,'Public add-ons'));
 communityMessage(P,'Optional packs made by the community. Import only what you want; updates never overwrite your project automatically.');
 const controls=el('div','community-actions');P.appendChild(controls);
 const status=communityMessage(P,'Loading community library…');
 try{
  const user=await Community.refresh();if(!P.contains(status))return;
  for(const [mode,label] of [['public','Browse add-ons'],...(user?[['mine','My add-ons']]:[]),...(user?.moderator?[['moderation','Moderate'],['selections','Next mod update']]:[])])communityButton(controls,label,async()=>{COMMUNITY_MODE=mode;COMMUNITY_OFFSET=0;COMMUNITY_EDIT=null;renderPane();},COMMUNITY_MODE===mode);
  communityButton(controls,user?'Account':'Sign in',async()=>{TAB='account';render();});
  if(!user&&COMMUNITY_MODE!=='public')COMMUNITY_MODE='public';
  if(COMMUNITY_EDIT&&user){status.remove();drawCommunityPublish(P,COMMUNITY_EDIT);return;}
  const selected=COMMUNITY_MODE==='selections';
  const result=await Community.request(selected?'selections':'list',{mode:COMMUNITY_MODE,offset:COMMUNITY_OFFSET});if(!P.contains(status))return;status.remove();
  if(COMMUNITY_MODE==='mine')communityButton(P,'Publish a new add-on',async()=>{TAB='share';render();},true);
  if(!result.items.length)communityMessage(P,selected?'No versions selected for the next mod update.':'No add-ons here yet. Create items in the editor, then publish them from Share items.');
  const grid=el('div','catalog-grid');P.appendChild(grid);
  for(const listing of result.items){
   const card=el('article','card');grid.appendChild(card);const title=el('h2');title.textContent=listing.name;card.appendChild(title);
   communityMessage(card,listing.author+' · '+listing.version+(listing.status&&listing.status!=='published'?' · '+listing.status:''));
   if(listing.description)communityMessage(card,listing.description);
   if(listing.dependencies)communityMessage(card,'Requires: '+listing.dependencies);
   const imports=['rigs','boxes','pouches','packs','items'].flatMap(k=>DB[k]||[]).filter(x=>x.communitySource?.id===listing.id);
   if(imports.length)communityMessage(card,imports.some(x=>x.communitySource.revision<listing.revision)?'Update available — your imported version stays unchanged until you choose to import.':'Items from this version are in your project.');
   communityButton(card,selected?'Preview saved version':'Preview and import',async()=>Community.preview(await Community.request(selected?'selectedPack':'pack',{id:listing.id})),true);
   if(listing.canEdit){
    communityButton(card,'Edit / update',async()=>{COMMUNITY_EDIT=listing;renderPane();});
    if(listing.status!=='removed')communityButton(card,listing.status==='published'?'Unpublish':'Publish again',async()=>{
     if(!confirm(listing.status==='published'?'Remove this listing from public browsing? Existing imports remain in people’s projects.':'Make this listing public again?'))return;
     await Community.request(listing.status==='published'?'unpublish':'republish',{id:listing.id,expectedRevision:listing.revision});renderPane();
    });
   }
   if(user?.moderator){
    if(selected)communityButton(card,'Remove from next update',async()=>{await Community.request('unselect',{id:listing.id});renderPane();});
    else{
     communityButton(card,'Select for next mod update',async()=>{await Community.request('select',{id:listing.id,expectedRevision:listing.revision});communityMessage(card,'A private copy of version '+listing.version+' is saved for the next update.');});
     if(listing.status!=='removed')communityButton(card,'Remove listing',async()=>{if(!confirm('Remove this public listing? Its creator will not be able to republish it.'))return;await Community.request('remove',{id:listing.id,expectedRevision:listing.revision});renderPane();});
     communityButton(card,'Block creator publishing',async()=>{if(!confirm('Block further publishing and updates by this creator? Remove unwanted listings separately.'))return;await Community.request('block',{id:listing.id});communityMessage(card,'Creator publishing blocked.');});
     communityButton(card,'Unblock creator',async()=>{await Community.request('unblock',{id:listing.id});communityMessage(card,'Creator publishing restored.');});
    }
   }
  }
  const pages=el('div','community-actions');P.appendChild(pages);
  if(COMMUNITY_OFFSET>0)communityButton(pages,'Previous page',async()=>{COMMUNITY_OFFSET=Math.max(0,COMMUNITY_OFFSET-24);renderPane();});
  if(COMMUNITY_OFFSET+24<result.total)communityButton(pages,'Next page',async()=>{COMMUNITY_OFFSET+=24;renderPane();});
 }catch(e){status.textContent=e.message+' Your local project is unchanged.';}
}
function drawCommunityPublish(P,listing=null){
 const card=el('div','card');P.appendChild(card);card.appendChild(el('h2',null,listing?'Update this listing':'Publish to the community'));
 if(!Community.enabled){communityMessage(card,'Community publishing is awaiting backend setup.');return;}
 if(!Community.user){communityButton(card,'Sign in to publish',async()=>{TAB='account';render();},true);return;}
 const pack=Community.packSelection();
 communityMessage(card,listing?'Updating keeps the same listing. Select items in Share items first to replace its contents.':'The selected items and their inventory icons will become public immediately.');
 const name=communityField(card,'Pack name',listing?.name||'');name.maxLength=100;
 const author=communityField(card,'Author display name',listing?.author||Community.user.name||'');author.maxLength=60;
 const version=communityField(card,'Pack version',listing?.version||'1.0');version.maxLength=32;
 const description=communityField(card,'Pack description',listing?.description||'','textarea');description.maxLength=2000;
 const dependencies=communityField(card,'Required mods',listing?.dependencies||'');dependencies.maxLength=500;
 let replace=null;if(listing){const label=el('label','tick');replace=document.createElement('input');replace.type='checkbox';replace.disabled=!pack.items.length;label.appendChild(replace);const span=document.createElement('span');span.textContent='Replace contents with '+pack.items.length+' selected items from Share items';label.appendChild(span);card.appendChild(label);}
 communityMessage(card,'Up to 20 items / 2 MB per pack. PNG icons only, up to 512 KB each. Publish only artwork you have permission to share; no adult imagery. Custom 3D models must be supplied by a required mod.');
 const label=el('label','tick');const agree=document.createElement('input');agree.type='checkbox';label.appendChild(agree);const consent=document.createElement('span');consent.textContent='I agree to make this pack public and allow people to import it into their ZoneBench projects.';label.appendChild(consent);card.appendChild(label);
 communityButton(card,listing?'Save update':'Publish selected items',async()=>{
  if(!agree.checked)throw new Error('Confirm public sharing first.');if(!listing&&!pack.items.length)throw new Error('Select items to publish.');
  const data={name:name.value,author:author.value,version:version.value,description:description.value,dependencies:dependencies.value};
  if(listing){data.id=listing.id;data.expectedRevision=listing.revision;if(replace.checked)data.pack=pack;}else data.pack=pack;
  await Community.request(listing?'update':'publish',data);COMMUNITY_EDIT=null;COMMUNITY_MODE='mine';COMMUNITY_OFFSET=0;TAB='catalog';render();
 },true);
 if(listing)communityButton(card,'Cancel editing',async()=>{COMMUNITY_EDIT=null;renderPane();});
}
