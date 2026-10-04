/* Site navigation and read-only home/download pages. The editor keeps its own project. */
(function(root){
'use strict';
const editing=['rigs','boxes','pouches','packs','items','drops','changes','check','share','build'];
const routes={patchnotes:'patch-notes',home:'home',introduction:'introduction',catalog:'community',downloads:'downloads',help:'help',account:'account'};
const n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function route(tab){return '#'+(routes[tab]||'editor/'+tab);}
function tabFromHash(){const value=location.hash.slice(1);return Object.keys(routes).find(k=>routes[k]===value)||(value.startsWith('editor/')&&editing.includes(value.slice(7))?value.slice(7):'home');}
function go(tab){if(TAB!==tab)history.pushState({},'',route(tab));TAB=tab;render();document.querySelector('#pane').scrollTop=0;}
function action(text,tab,primary=false){const b=n('button','tool'+(primary?' primary':''),text);b.onclick=()=>go(tab);return b;}
function link(text,url,primary=false){const a=n('a','tool'+(primary?' primary':''),text);a.href=url;return a;}
function shell(){
 root.OpeningIntro?.cancel();
 const isEditor=editing.includes(TAB);document.body.classList.toggle('site-page',!isEditor);document.body.classList.toggle('home-page',TAB==='home');document.body.classList.toggle('introduction-page',TAB==='introduction');
 document.querySelector('#nav').hidden=!isEditor;document.querySelector('#project-tools').hidden=!isEditor;
 const top=document.querySelector('#site-nav');top.replaceChildren();
 for(const [tab,label] of [['patchnotes','Patch Notes'],['home','Home'],['introduction','Introduction'],['rigs','Editor'],['catalog','Community'],['downloads','Downloads'],['help','Help'],['account','Account']]){
  const a=n('a',(tab==='rigs'?isEditor:TAB===tab)?'active':'',label);a.href=route(tab);if(tab==='patchnotes')PatchNotes.decorate(a);if(a.classList.contains('active'))a.setAttribute('aria-current','page');a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();go(tab);};top.appendChild(a);
 }
 CommunityUpdates.paintBadge();
 document.querySelector('.brand').onclick=()=>go('home');
 if(location.hash!==route(TAB))history.replaceState({},'',route(TAB));
 document.title=(TAB==='home'?'Squared Away':(editing.includes(TAB)?'Editor':Object.entries(routes).find(([k])=>k===TAB)?.[1]||'ZoneBench'))+' | ZoneBench';
}
function heading(parent,kicker,title,copy){parent.appendChild(n('p','eyebrow',kicker));parent.appendChild(n('h1',null,title));if(copy)parent.appendChild(n('p','page-lead',copy));}
function size(bytes){return bytes?Math.round(bytes/1024/1024)+' MB':'';}
function currentRelease(release){return release.mod.name.includes('3.49.2') || /^Squared[-_ .]*Away[-_ .]+(?:FOMOD[-_ .]+)?2[._-]0(?:[-_ .]|$)/i.test(release.mod.name);}
function releaseBlock(parent,release,compact=false){
 const panel=n('section','release-panel'+(compact?' compact':''));parent.appendChild(panel);
 const about=n('div','release-about');about.appendChild(n('p','eyebrow',release.unavailable?'COMING SOON':release.preview?'CURRENT PREVIEW':'LATEST STABLE RELEASE'));about.appendChild(n('h2',null,release.name));if(release.date)about.appendChild(n('p','hint','Published '+new Date(release.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})));panel.appendChild(about);
 const buttons=n('div','site-actions');
 for(const [label,asset,primary] of [['Download mod',release.mod,true],['Required engine',release.engine,false]]){
  if(release.unavailable){const button=n('button','tool'+(primary?' primary':''),label);button.disabled=true;button.title='Downloads are not available yet';buttons.appendChild(button);}
  else buttons.appendChild(link(label+(compact?'':' · '+size(asset.size)),asset.browser_download_url,primary));
 }
 buttons.appendChild(action('Installation guide','help'));panel.appendChild(buttons);
 if(release.unavailable)panel.appendChild(n('p','release-note','Downloads coming soon. Read the 2.0 patch notes while we finish preparing the release.'));

 if(currentRelease(release))panel.appendChild(n('p','release-note','Includes localization hotfix 2.0.1. Already on 2.0? Replace only the mod; keep your engine and saves.'));
 if(release.preview)panel.appendChild(n('p','release-note','Preview release · Start a new game when upgrading from the previous Squared Away release. Install both the mod and its matching engine.'));
 if(!currentRelease(release))panel.appendChild(n('p','release-note','The editor targets the Squared Away 2.0 Update. Its exports are not intended for the older release shown here.'));
 if(!compact){const details=n('details','release-notes');details.appendChild(n('summary',null,'Release notes'));details.appendChild(n('div','release-notes-text',release.notes||'No release notes supplied.'));panel.appendChild(details);}
 return panel;
}
async function home(P){
 P.classList.add('site-content');
 const hero=n('section','armory-hero');const copy=n('div','hero-copy');hero.appendChild(copy);
 const gameLabel=n('p','eyebrow hero-game-label');gameLabel.append(n('span','game-label-prefix','INVENTORY MOD FOR'),document.createTextNode(' '),n('span','game-label-stalker','STALKER'),document.createTextNode(' '),n('span','game-label-gamma','G.A.M.M.A.'));copy.appendChild(gameLabel);copy.appendChild(n('h1',null,'SQUARED AWAY'));copy.appendChild(n('h2',null,'Ultimate inventory cancer is HERE.'));copy.appendChild(n('p','hero-description','A grid inventory. Rigs that carry your essentials. Containers that save you some space.'));
 const actions=n('div','site-actions');actions.appendChild(action('↓  Download Squared Away','downloads',true));actions.appendChild(action('Explore the mechanics  →','introduction'));copy.appendChild(actions);const shot=n('figure','hero-gameplay');const img=n('img');img.src='assets/gameplay/inventory.png';img.alt='Squared Away in-game inventory with equipment, an equipped rig and backpack storage';img.width=1207;img.height=1079;shot.appendChild(img);shot.appendChild(n('figcaption',null,'IN-GAME CAPTURE / SQUARED AWAY'));hero.appendChild(shot);P.appendChild(hero);root.OpeningIntro?.play(copy.querySelector('h1'));
 const content=n('div','home-sections');P.appendChild(content);
 const release=n('div');release.appendChild(n('p','hint','Checking the latest release…'));content.appendChild(release);
 Releases.load().then(result=>{if(!release.isConnected)return;release.replaceChildren();if(result.items[0])releaseBlock(release,result.items[0],true);else release.appendChild(n('p','hint','A complete release package has not been published yet.'));if(result.cached)release.appendChild(n('p','hint','Showing the last verified release. Live release lookup is unavailable.'));}).catch(e=>{if(release.isConnected)release.textContent=e.message;});
 const features=n('div','home-features');for(const [title,desc] of [['Every cell counts','Place and rotate items to make the most of your inventory.'],['Keep essentials close','Rigs and expansion pouches give your loadout room to work.'],['Make it your own','Build layouts, change textures and export your own add-ons.']]){const card=n('article');card.appendChild(n('h3',null,title));card.appendChild(n('p',null,desc));features.appendChild(card);}content.appendChild(features);
 const head=n('div','section-heading');const titles=n('div');titles.appendChild(n('h2',null,'Community add-ons'));titles.appendChild(n('p','eyebrow','MADE BY STALKERS. CHOSEN BY YOU.'));head.appendChild(titles);head.appendChild(action('Browse all add-ons  →','catalog'));content.appendChild(head);
 const library=n('div','home-community catalog-grid');content.appendChild(library);
 if(Community.enabled){
  library.appendChild(n('p','hint','Loading the community library…'));
  Community.request('list').then(result=>{if(!library.isConnected)return;library.replaceChildren();if(!result.items.length){library.appendChild(n('p','hint','No add-ons published yet. Create something in the editor and share it with the community.'));return;}
   for(const listing of result.items.slice(0,3)){const row=n('article','card addon-listing');const body=n('div','addon-listing-content');row.appendChild(body);body.appendChild(n('h3',null,listing.name));body.appendChild(n('p','hint',listing.author+' · '+listing.version));library.appendChild(row);const show=AddonPreview.card(body,listing,()=>Community.request('pack',{id:listing.id}),r=>Community.preview(r));const b=n('button','tool','View items');b.onclick=show;body.appendChild(b);}
  }).catch(()=>{if(library.isConnected)library.textContent='The community library is temporarily unavailable. Your editor is still available.';});
 }else{const card=n('article','card community-invitation');card.appendChild(n('h3',null,'Explore community add-ons'));card.appendChild(n('p','hint','Browse player-made rigs, containers and pouches. Inspect every item before importing it.'));const url=new URL(location.href);url.hash='community';card.appendChild(link('Open Community',url.href));library.appendChild(card);}
 const start=n('section','home-workbench');start.appendChild(n('p','eyebrow','THE WORKBENCH'));start.appendChild(n('h2',null,'Your next loadout starts here.'));start.appendChild(n('p','page-lead','Design a rig, give a container more room, or build an entire collection. Preview every change and export an add-on for your game.'));start.appendChild(action('Start creating  →','rigs',true));content.appendChild(start);
 const foot=n('footer','site-footer');foot.appendChild(n('span',null,'ZONEBENCH / SQUARED AWAY'));foot.appendChild(n('span',null,'A community project by Fomok'));content.appendChild(foot);
}
async function downloads(P){
 heading(P,'SQUARED AWAY','Downloads','The mod and its matching engine, together in one place.');
 InstallationGuide.render(P);
 const status=n('p','hint','Checking published releases…');P.appendChild(status);
 try{const result=await Releases.load();if(!status.isConnected)return;status.remove();if(result.cached)P.appendChild(n('p','warn','Live release lookup is unavailable. Showing the last verified downloads.'));
  if(!result.items.length){P.appendChild(n('p','hint','No complete release package is available yet.'));return;}
  releaseBlock(P,result.items[0]);
  P.appendChild(n('h2','download-help-title','Install the pair'));
  const help=n('div','download-steps');for(const [title,desc] of [['01 / Mod','Install the mod ZIP through MO2 and choose only the optional patches for mods you use.'],['02 / Engine','Close the game. Back up your existing engine files, then extract the matching engine package into the Anomaly folder.'],['03 / Play','Read the release notes before loading a save. Moving from the old release to the native rebuild requires a new game.']]){const c=n('article','card');c.appendChild(n('h3',null,title));c.appendChild(n('p','hint',desc));help.appendChild(c);}P.appendChild(help);
  if(result.items.length>1){const older=n('details','older-releases');older.appendChild(n('summary',null,'Older releases'));for(const item of result.items.slice(1))releaseBlock(older,item);P.appendChild(older);}
 }catch(e){status.textContent=e.message;}
}
function help(P){
 heading(P,'FIELD GUIDE','Get squared away.','Installation, compatibility and the ZoneBench editor.');
 InstallationGuide.render(P);
 const blocks=[
  [
    "Squared Away 2.0 Update",
    "ZoneBench includes the 2.0.1 localization hotfix. Replace the mod in MO2; existing 2.0 saves and engine files are supported. Home introduces the mod, Introduction explains its mechanics, and Patch Notes covers what changed. The 2.0 Update is available in Downloads. Install both the mod and its matching engine. Downloads only lists published packages. An older download is not the version this editor targets."
  ],
  [
    "Install the mod",
    "Use Anomaly 1.5.3 or your GAMMA installation. Install the full Squared Away ZIP through Mod Organizer 2 (MO2). Its FOMOD installer lets you choose optional patches. Replace an older Squared Away installation instead of merging files, and disable old copies and hotfixes. Select only patches for mods you actually have."
  ],
  [
    "Install the matching engine",
    "The 2.0 Update requires the Squared Away custom engine and its matching DB0 file. Close the game and back up your existing engine files, then extract the engine ZIP into your Anomaly game folder. The bin folder contains the executables and PDB files; db/mods contains the DB0. Preserve that folder structure. Install this package in Anomaly itself, not as an MO2 mod. Stock Anomaly and unmodified Monolith executables are not supported."
  ],
  [
    "Engine choices and developer files",
    "The all-DX engine package includes DX8, DX9, DX10 and DX11 executables, each with AVX and non-AVX versions. Choose a renderer supported by your setup, and use AVX only if your CPU supports it. The separate For Developers ZIP is for engine authors merging changes; players do not need it. Always use the engine paired with your mod release in Downloads."
  ],
  [
    "Start a new game",
    "Updating from 2.0 to the 2.0.1 localization hotfix does not require a new game. Upgrading from the old public version (before 2.0) to 2.0 requires a new game. Do not continue an old playthrough with the rewrite. Back up saves before changing custom item configurations, and test add-ons on a separate save."
  ],
  [
    "SOTA UI and HD Inventory Icons",
    "SOTA UI is optional. Select SOTA UI compatibility in the installer only if SOTA and its usual requirements are installed. If you use HD Inventory Icons Framework, choose its SOTA-patched version with SOTA, or its non-SOTA version without it. Never enable both. Place Squared Away below those UI mods in the MO2 left pane so its files win conflicts. Both UI choices use the Field Kit artwork and support the Tarkov-like and Anomaly default layouts."
  ],
  [
    "Wearable Devices support",
    "Select Wearable Devices support in the installer only with the separate Wearable Devices pack installed. It adds device controls below the backpack, keeps worn devices out of the bag grid, and adds the relevant settings to Squared Away in MCM."
  ],
  [
    "Tarkov-like corpse looting",
    "This installer option requires Looting Takes Time Redux by Priler. In that mod’s MCM settings, turn OFF Pre-sort items on grid so it does not compete with Squared Away for item placement. The patch changes corpse looting; stashes and living NPCs keep their normal behavior."
  ],
  [
    "Magazine support",
    "The baseline is Mags Reloaded Fork by Priler UPDATE 6. Install it separately for magazine support and the three stock expansion pouches. The direct download message is linked below. GAMMA recipes and trader integrations also need their corresponding GAMMA content; plain Anomaly does not include those dependencies automatically."
  ],
  [
    "Inventory, rigs and containers",
    "Drag and rotate items to fit the grid. Equipped rigs provide accessible storage above the backpack; spare rigs and boxes keep their contents inside when dropped or stored. Expansion pouches attach below the equipped rig, and amber borders mark the extra storage they provide. See Introduction for the illustrated guide."
  ],
  [
    "Reloading, quick use and crafting",
    "By default, keep magazines in the equipped rig to reload, medicine there for quick use, and loose ammunition there for weapons that reload without magazines. Medicine and loose-ammo restrictions can be adjusted in MCM. Crafting and NPC item hand-ins can use items inside carried containers without unpacking them first. A non-empty rig cannot be disassembled."
  ],
  [
    "Appearance and controls",
    "Open Squared Away in MCM to choose your inventory layout, adjust background opacity, and configure controls, rig rules and drops. The backpack and rig equipment slots scroll with the inventory. White key prompts show available actions. The Swap toggle is beside the weight display. Box and rig context-menu actions are included for Anomaly and GAMMA; they do not need a separate installer patch."
  ],
  [
    "Create and install your own add-on",
    "In Editor, choose Rigs, Containers, Pouches, Backpacks or Drops and make your changes. Save project downloads a backup. Undo and Redo recover recent edits within the current tab (history resets on refresh); Changes lists customized items and available Community updates. Compare with default lets you inspect or reset one item. Export mod guides you through Review, Fix issues and Download. Resolve blocking errors before downloading your ZIP. Install that ZIP as a separate MO2 mod below Squared Away and its optional patches. Keep only one ZoneBench export enabled: combine everything you want in one project before exporting. Exports contain item configuration and selected assets, not the inventory scripts or engine. Saved MCM settings take priority over exported drop and condition defaults."
  ],
  [
    "Browse Community add-ons",
    "Community lets you browse optional player-made add-ons. Open View items to inspect their icons, storage layouts, descriptions, prices and crafting details before importing. Choose what to bring into your project, then export the combined result. Imports do not install anything into your game, and creator updates do not automatically overwrite your project."
  ],
  [
    "Publish and update your add-ons",
    "Sign in through Account using a code sent to your email. Your email is not shown on listings. Use Share items in Editor to select customizations and publish an add-on. In My add-ons, use Edit / update to revise the same listing instead of publishing duplicate versions, or Unpublish to remove it from public browsing. Other users keep items they already imported."
  ],
  [
    "Keep your work",
    "Item editing and exports happen in your browser. Use Save project regularly and Open project to restore a downloaded backup. Account → Reset item customizations clears local item edits and imported items only. It does not delete your account, sign you out, or remove published add-ons or installed game files."
  ],
  [
    "Administrator controls",
    "Your admin account has Manage public add-ons for removing unwanted listings and blocking abusive publishers. Next mod update keeps selected add-ons for later review. Account → Edit site text lets you change website wording: navigate to a page, select Refresh list, choose text, and Save for everyone. Identical phrases share the edit. Restore original returns to the current built-in wording. These controls are restricted to the administrator; website text edits do not change item configurations."
  ]
];
 const tools=n('div','help-tools');const search=n('input');search.type='search';search.placeholder='Search installation, controls, exporting…';search.setAttribute('aria-label','Search Help');tools.appendChild(search);P.appendChild(tools);
 const categories=[['Install & setup',[0,1,2,3,4]],['Compatibility',[5,6,7,8]],['Playing the mod',[9,10,11]],['Editor & add-ons',[12,13,14]],['Account & administration',[15,16]]];
 const nav=n('nav','help-topics');nav.setAttribute('aria-label','Help topics');tools.appendChild(nav);const entries=[],sections=[];
 for(const [name,indices] of categories){const section=n('section','help-group');section.appendChild(n('h2',null,name));P.appendChild(section);sections.push(section);
  const jump=n('button','tool',name);jump.onclick=()=>{search.value='';filter();section.scrollIntoView({block:'start',behavior:'smooth'});};nav.appendChild(jump);
  for(const index of indices){const [title,copy]=blocks[index],c=n('details','help-topic');c.open=title==='Install the mod';const summary=n('summary',null,title);c.appendChild(summary);c.appendChild(n('p',null,copy));
   if(title==='Magazine support'){const a=link('Download Mags Reloaded Fork by Priler UPDATE 6','https://discord.com/channels/912320241713958912/1322655858240262304/1524208180135989459',true);a.target='_blank';a.rel='noopener noreferrer';c.appendChild(a);}
   section.appendChild(c);entries.push({node:c,text:(title+' '+copy).toLowerCase()});
  }
 }
 const empty=n('p','hint','No matching help topics. Try a different word.');empty.hidden=true;P.appendChild(empty);
 let searching=false;
 function filter(){const q=search.value.trim().toLowerCase();for(const e of entries){if(q&&!searching)e.beforeSearch=e.node.open;e.node.hidden=!!q&&!e.text.includes(q);if(q)e.node.open=!e.node.hidden;else if(searching)e.node.open=e.beforeSearch;}searching=!!q;for(const section of sections)section.hidden=![...section.querySelectorAll('details')].some(x=>!x.hidden);empty.hidden=entries.some(e=>!e.node.hidden);}
 search.oninput=filter;
 const actions=n('div','site-actions');const communityURL=new URL(location.href);communityURL.hash='community';actions.appendChild(link('Open Community',communityURL.href));actions.appendChild(action('Go to downloads','downloads',true));P.appendChild(actions);

}
root.Site={shell,go,tabFromHash,home,downloads,help};
window.addEventListener('popstate',()=>{TAB=tabFromHash();render();});
window.addEventListener('hashchange',()=>{const next=tabFromHash();if(TAB!==next){TAB=next;render();}});
})(globalThis);
