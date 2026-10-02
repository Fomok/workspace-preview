/* Site navigation and read-only home/download pages. The editor keeps its own project. */
(function(root){
'use strict';
const editing=['rigs','boxes','pouches','packs','drops','check','notes','share','build'];
const routes={home:'home',catalog:'community',downloads:'downloads',help:'help',account:'account'};
const n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function route(tab){return '#'+(routes[tab]||'editor/'+tab);}
function tabFromHash(){const value=location.hash.slice(1);return Object.keys(routes).find(k=>routes[k]===value)||(value.startsWith('editor/')&&editing.includes(value.slice(7))?value.slice(7):'home');}
function go(tab){if(TAB!==tab)history.pushState({},'',route(tab));TAB=tab;render();document.querySelector('#pane').scrollTop=0;}
function action(text,tab,primary=false){const b=n('button','tool'+(primary?' primary':''),text);b.onclick=()=>go(tab);return b;}
function link(text,url,primary=false){const a=n('a','tool'+(primary?' primary':''),text);a.href=url;return a;}
function shell(){
 const isEditor=editing.includes(TAB);document.body.classList.toggle('site-page',!isEditor);document.body.classList.toggle('home-page',TAB==='home');
 document.querySelector('#nav').hidden=!isEditor;document.querySelector('#project-tools').hidden=!isEditor;
 const top=document.querySelector('#site-nav');top.replaceChildren();
 for(const [tab,label] of [['home','Home'],['rigs','Editor'],['catalog','Community'],['downloads','Downloads'],['help','Help'],['account','Account']]){
  const a=n('a',(tab==='rigs'?isEditor:TAB===tab)?'active':'',label);a.href=route(tab);if(a.className)a.setAttribute('aria-current','page');a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();go(tab);};top.appendChild(a);
 }
 document.querySelector('.brand').onclick=()=>go('home');
 if(location.hash!==route(TAB))history.replaceState({},'',route(TAB));
 document.title=(TAB==='home'?'Squared Away':(editing.includes(TAB)?'Editor':Object.entries(routes).find(([k])=>k===TAB)?.[1]||'ZoneBench'))+' | ZoneBench';
}
function heading(parent,kicker,title,copy){parent.appendChild(n('p','eyebrow',kicker));parent.appendChild(n('h1',null,title));if(copy)parent.appendChild(n('p','page-lead',copy));}
function size(bytes){return bytes?Math.round(bytes/1024/1024)+' MB':'';}
function upcoming(parent,items){if(items.some(x=>x.mod.name.includes('3.49.2')))return;const card=n('section','upcoming-release');card.appendChild(n('p','eyebrow','NEXT RELEASE'));card.appendChild(n('h2',null,'The native rebuild is on its way.'));card.appendChild(n('p','hint','Squared Away 3.49.2 is being prepared for release. Its download will appear here when it is published. The older public version is listed below.'));parent.appendChild(card);}
function releaseBlock(parent,release,compact=false){
 const panel=n('section','release-panel'+(compact?' compact':''));parent.appendChild(panel);
 const about=n('div','release-about');about.appendChild(n('p','eyebrow',release.preview?'CURRENT PREVIEW':'LATEST STABLE RELEASE'));about.appendChild(n('h2',null,release.name));if(release.date)about.appendChild(n('p','hint','Published '+new Date(release.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})));panel.appendChild(about);
 const buttons=n('div','site-actions');buttons.appendChild(link('Download mod'+(compact?'':' · '+size(release.mod.size)),release.mod.browser_download_url,true));buttons.appendChild(link('Required engine'+(compact?'':' · '+size(release.engine.size)),release.engine.browser_download_url));buttons.appendChild(action('Installation guide', 'help'));panel.appendChild(buttons);
 if(release.preview)panel.appendChild(n('p','release-note','Preview release · Start a new game when moving from the old Squared Away. Install both the mod and its matching engine.'));
 if(!release.mod.name.includes('3.49.2'))panel.appendChild(n('p','release-note','The editor targets the 3.49.2 native rebuild. Check compatibility before using editor exports with another release.'));
 if(!compact){const details=n('details','release-notes');details.appendChild(n('summary',null,'Release notes'));details.appendChild(n('div','release-notes-text',release.notes||'No release notes supplied.'));panel.appendChild(details);}
 return panel;
}
async function home(P){
 P.classList.add('site-content');
 const hero=n('section','armory-hero');const copy=n('div','hero-copy');hero.appendChild(copy);
 copy.appendChild(n('p','eyebrow','INVENTORY MOD FOR S.T.A.L.K.E.R. ANOMALY'));copy.appendChild(n('h1',null,'SQUARED AWAY'));copy.appendChild(n('h2',null,'Make room for the Zone.'));copy.appendChild(n('p','hero-description','A grid inventory. Rigs that carry your essentials. Containers that keep your gear together.'));
 const actions=n('div','site-actions');actions.appendChild(action('↓  Download Squared Away','downloads',true));actions.appendChild(action('Open editor  →','rigs'));copy.appendChild(actions);copy.appendChild(n('p','hero-footnote','YOUR GEAR. YOUR LAYOUT.'));P.appendChild(hero);
 const content=n('div','home-sections');P.appendChild(content);
 const release=n('div');release.appendChild(n('p','hint','Checking the latest release…'));content.appendChild(release);
 Releases.load().then(result=>{if(!release.isConnected)return;release.replaceChildren();upcoming(release,result.items);if(result.items[0])releaseBlock(release,result.items[0],true);else release.appendChild(n('p','hint','A complete release package has not been published yet.'));if(result.cached)release.appendChild(n('p','hint','Showing the last verified release. Live release lookup is unavailable.'));}).catch(e=>{if(release.isConnected)release.textContent=e.message;});
 const features=n('div','home-features');for(const [title,desc] of [['Every cell counts','Place and rotate items to make the most of your inventory.'],['Keep essentials close','Rigs and expansion pouches give your loadout room to work.'],['Make it your own','Build layouts, change textures and export your own add-ons.']]){const card=n('article');card.appendChild(n('h3',null,title));card.appendChild(n('p',null,desc));features.appendChild(card);}content.appendChild(features);
 const head=n('div','section-heading');const titles=n('div');titles.appendChild(n('h2',null,'Community add-ons'));titles.appendChild(n('p','eyebrow','MADE BY STALKERS. CHOSEN BY YOU.'));head.appendChild(titles);head.appendChild(action('Browse all add-ons  →','catalog'));content.appendChild(head);
 const library=n('div','home-community catalog-grid');content.appendChild(library);
 if(Community.enabled){
  library.appendChild(n('p','hint','Loading the community library…'));
  Community.request('list').then(result=>{if(!library.isConnected)return;library.replaceChildren();if(!result.items.length){library.appendChild(n('p','hint','No add-ons published yet. Create something in the editor and share it with the community.'));return;}
   for(const listing of result.items.slice(0,3)){const row=n('article','card addon-listing');const body=n('div','addon-listing-content');row.appendChild(body);body.appendChild(n('h3',null,listing.name));body.appendChild(n('p','hint',listing.author+' · '+listing.version));library.appendChild(row);const show=AddonPreview.card(body,listing,()=>Community.request('pack',{id:listing.id}),r=>Community.preview(r));const b=n('button','tool','View items');b.onclick=show;body.appendChild(b);}
  }).catch(()=>{if(library.isConnected)library.textContent='The community library is temporarily unavailable. Your editor is still available.';});
 }else{const card=n('article','card community-invitation');card.appendChild(n('h3',null,'Explore the community preview'));card.appendChild(n('p','hint','Browse player-made rigs, containers and pouches. Inspect every item before importing it.'));const url=new URL(location.href);url.searchParams.set('community-preview','1');url.hash='community';card.appendChild(link('Open community preview',url.href));library.appendChild(card);}
 const start=n('section','home-workbench');start.appendChild(n('p','eyebrow','THE WORKBENCH'));start.appendChild(n('h2',null,'Your next loadout starts here.'));start.appendChild(n('p','page-lead','Design a rig, give a container more room, or build an entire collection. Preview every change and export an add-on for your game.'));start.appendChild(action('Start creating  →','rigs',true));content.appendChild(start);
 const foot=n('footer','site-footer');foot.appendChild(n('span',null,'ZONEBENCH / SQUARED AWAY'));foot.appendChild(n('span',null,'A community project by Fomok'));content.appendChild(foot);
}
async function downloads(P){
 heading(P,'SQUARED AWAY','Downloads','The mod and its matching engine, together in one place.');
 const status=n('p','hint','Checking published releases…');P.appendChild(status);
 try{const result=await Releases.load();if(!status.isConnected)return;status.remove();if(result.cached)P.appendChild(n('p','warn','Live release lookup is unavailable. Showing the last verified downloads.'));
  if(!result.items.length){P.appendChild(n('p','hint','No complete release package is available yet.'));return;}
  upcoming(P,result.items);releaseBlock(P,result.items[0]);
  P.appendChild(n('h2','download-help-title','Install the pair'));
  const help=n('div','download-steps');for(const [title,desc] of [['01 / Mod','Install the mod ZIP through MO2 and choose only the optional patches for mods you use.'],['02 / Engine','Close the game. Back up your existing engine files, then extract the matching engine package into the Anomaly folder.'],['03 / Play','Read the release notes before loading a save. Moving from the old release to the native rebuild requires a new game.']]){const c=n('article','card');c.appendChild(n('h3',null,title));c.appendChild(n('p','hint',desc));help.appendChild(c);}P.appendChild(help);
  if(result.items.length>1){const older=n('details','older-releases');older.appendChild(n('summary',null,'Older releases'));for(const item of result.items.slice(1))releaseBlock(older,item);P.appendChild(older);}
 }catch(e){status.textContent=e.message;}
}
function help(P){
 heading(P,'FIELD GUIDE','Get squared away.','Installation, compatibility and the ZoneBench editor.');
 const blocks=[['Install Squared Away','Download the mod and engine from the same release. Install the mod ZIP with MO2. With the game closed, back up your engine files and extract the engine archive into your Anomaly folder, keeping its bin and db/mods paths. Start a new game when upgrading from the old mod to the native rebuild.'],['Choose the right patches','The FOMOD offers SOTA UI, Wearable Devices and Looting Takes Time Redux support. Select a patch only if its required mod is installed. SOTA is optional; Squared Away must win the relevant UI file conflicts. Use the HD Icons variant that matches your SOTA choice.'],['Magazine support','Keep the magazine mod used by your setup: its stock expansion pouches are part of the editor baseline. Vanilla Anomaly does not gain magazines simply by installing Squared Away. Read the release requirements before combining additional mods.'],['Create an add-on','Open Editor, choose a rig, container or pouch, then adjust its appearance, layout and settings. Check validates your project. Export mod produces a separate MO2 add-on to install after Squared Away and its patches. Combine your edits into one export.'],['Browse and publish','Community listings show real item textures and layouts. Preview a pack, choose the items to import, then review replace-or-rename choices. Share items lets signed-in users publish and manage their own add-ons. Community publishing is currently available through the preview link.'],['Keep your work','Editing and exports happen in your browser. Save project downloads a portable backup. Your local project is only shared when you explicitly publish an add-on. Email sign-in and community listings use Appwrite. No analytics or bug-report uploads are included.']];
 for(const [title,copy] of blocks){const c=n('section','card help-card');c.appendChild(n('h2',null,title));c.appendChild(n('p',null,copy));P.appendChild(c);}P.appendChild(action('Go to downloads','downloads',true));
}
root.Site={shell,go,tabFromHash,home,downloads,help};
window.addEventListener('popstate',()=>{TAB=tabFromHash();render();});
window.addEventListener('hashchange',()=>{const next=tabFromHash();if(TAB!==next){TAB=next;render();}});
})(globalThis);
