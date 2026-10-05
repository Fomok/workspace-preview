/* Change the entry id when publishing a new set of notes: this re-arms the New badge. */
(function(root){
'use strict';
const entries=[{
 id:'squared-away-2-0-3-ammo',
 date:'2026-10-05',
 title:'Squared Away — 2.0.3 Ammo Hotfix',
 version:'2.0.3',
 status:'Available now • Update both the mod and engine • Keep your 2.0 saves',
 summary:'Reload magazines without loose ammunition being consumed and recreated in your inventory.',
 sections:[
  {title:'Magazine reload fix',items:[
   'Stops magazine-fed weapon reloads from taking loose ammunition and returning it to your inventory.',
   'Includes compatibility with Dynamic Reload Speeds, while keeping its reload speed and sound changes.',
   'Normal loose-ammo weapons, grenade launchers and loading rounds into magazines keep their usual behavior.'
  ]},
  {title:'Installing the hotfix',items:[
   'Replace the full mod in MO2 and install the matching 2.0.3 engine, including bin and db/mods. Standard and Bodycam engine downloads are both updated.',
   'Select the optional Mags Reloaded ammo fix in the installer. It requires Mags Reloaded Fork by Priler UPDATE 6 and its Dynamic Reload Speeds dependency. Let Squared Away win their file conflicts in MO2.',
   'Existing 2.0, 2.0.1 and 2.0.2 saves are supported. Your ZoneBench item customizations are preserved.'
  ]}
 ]
},{
 id:'squared-away-2-0-2-bodycam',
 date:'2026-10-05',
 title:'Squared Away — Optional Bodycam Support',
 version:'2.0.2 · Bodycam',
 status:'Available now • Optional engine download • DX11-AVX only',
 summary:'Use Squared Away together with Bodycam’s camera and shooting changes.',
 sections:[
  {title:'Optional Bodycam engine',items:[
   'A combined engine is now available for Squared Away 2.0.2 and Bodycam, based on Bodycam’s August 4 release.',
   'Choose Download Bodycam engine in Downloads instead of the standard engine package. Install both bin and db/mods from its ZIP.',
   'Keep the Squared Away 2.0.2 mod installed. Only DX11-AVX is included.',
   'For PiP scopes, use the matching external 3DSS PiP compatibility content required by Bodycam. The engine ZIP does not include that external patch.',
   'If you do not use Bodycam, keep the standard engine. No update is needed.'
  ]}
 ]
},{
 id:'squared-away-2-0-2-looting',
 date:'2026-10-04',
 title:'Squared Away — 2.0.2',
 version:'2.0.2',
 status:'Available now • Update both the mod and engine • Keep your 2.0 saves',
 summary:'Equip loot straight from bodies, with a refreshed optional corpse inventory.',
 sections:[
  {title:'Equip straight from a body',items:[
   'Drag weapons from a dead body directly into your equipment slots, even when your backpack is full.',
   'Swap with an equipped weapon directly; the replaced weapon goes back to the body.',
   'These transfers work with standard corpse looting. The Tarkov-like looting patch is not required.'
  ]},
  {title:'Optional Tarkov-like looting',items:[
   'A Field Kit equipment section now shows helmet, outfit, knife or pistol, and one main weapon slot above the body’s scattered loot.',
   'A framed Pockets bar separates equipment from loose items. Grid lines follow item shapes.',
   'Item positions and rotations are remembered, and looted equipment slots stay empty instead of being filled by a spare item.',
   'Looting Takes Time Redux still controls item discovery. Keep its Pre-sort items on grid option turned off.'
  ]},
  {title:'Installing 2.0.2',items:[
   'Replace the full mod in MO2 and install the matching 2.0.2 engine package into your Anomaly folder, including bin and db/mods.',
   'Existing 2.0 and 2.0.1 saves are supported. A new game is required only when upgrading from a pre-2.0 version.',
   'ZoneBench now targets 2.0.2. Your item customizations are preserved.'
  ]}
 ]
},{
 id:'squared-away-2-0-1-localization',
 date:'2026-10-04',
 title:'Squared Away — Localization Hotfix',
 version:'2.0.1',
 status:'Available now • Replace the mod ZIP; keep your 2.0 engine',
 summary:'Clearer settings and item descriptions, with updated translations throughout the mod.',
 sections:[
  {title:'Language updates',items:[
   'Updated English text to match the current rig, pouch and inventory mechanics.',
   'Completed Russian, Spanish and Ukrainian translations for settings, item descriptions, gameplay messages and optional patches.',
   'Fixed unreadable Cyrillic text and missing translated settings. Rig messages now describe the current rules instead of the old medicine-pocket system.'
  ]},
  {title:'ZoneBench',items:[
   'The editor now uses the hotfix item text and preserves the correct language encoding in exported files.',
   'Previous patch notes remain here, below the latest update, so you can catch up whenever you return.'
  ]},
  {title:'Installation',items:[
   'Download the full mod ZIP again and replace your Squared Away installation in MO2, selecting the same optional patches.',
   'Existing 2.0 saves and the 2.0 engine package are supported. No new game or engine download is needed for this hotfix.'
  ]}
 ]
},{
 id:'squared-away-2-0-published',
 date:'2026-10-04',
 title:'Squared Away — 2.0 Update',
 version:'2.0 Update',
 status:'Available now • Download the mod and matching engine',
 summary:'Your inventory, rebuilt. The 2.0 Update brings smarter packing, a cleaner interface and easier customization.',
 sections:[
  {title:'Before you install',items:[
   'Start a new game when upgrading to 2.0. Saves from the previous public version are not supported.',
   'Install the matching custom engine package, including its DB0 game-data file, alongside the mod. See the installation guide for setup and optional patches.'
  ]},
  {title:'Packing and carrying',items:[
   'The engine now handles inventory space, item placement and saved layouts. Your chosen positions and rotations stay with your inventory.',
   'Picked-up items can turn automatically to fit an available gap when auto-rotation is enabled.',
   'Crafting and NPC item hand-ins can use items inside carried boxes and spare rigs. You do not have to unpack them first.',
   'Rigs use a dedicated equipment slot. Equipped rig items use normal inventory icons, including supported dynamic icons and magazine ammo counters.'
  ]},
  {title:'Move gear directly',items:[
   'Equip gear straight from rigs, boxes and stashes, or put equipped gear directly into storage without clearing backpack space first.',
   'Swap equipped weapons with stored ones, and move items between boxes, rigs and stashes without unpacking them into your bag.',
   'Rotate and arrange items inside opened rigs and boxes. Placement highlights help you see where your gear will fit.'
  ]},
  {title:'Less inventory frustration',items:[
   'Carrying items inside a spare rig no longer makes unrelated items drop when there is still room in your inventory.',
   'Unequipping a rig uses a free space instead of forcing it back into an old position and shifting your other items. It tries the normal orientation first, then rotates if needed.',
   'Leftovers created by used items, such as medkit scraps, drop to the ground when the bag is full instead of crashing the game.'
  ]},
  {title:'A clearer inventory',items:[
   'A new metallic Field Kit look covers equipment, inventory, trade controls and container windows.',
   'SOTA UI is optional. Keep either the Tarkov-like or Anomaly-default layout, with the backpack and rig slots scrolling alongside your inventory.',
   'Smaller inventory cells make wide rigs easier to use. Expansion pouches sit below the rig, and amber borders identify the extra storage they add.',
   'The backpack grid outlines occupied item spaces, keeping grid lines out of the middle of your gear.',
   'Settings are reorganized into clearer MCM categories. Adjust background opacity and use the updated white-key control prompts.',
   'Dropped rigs and boxes have recognizable shared 3D models instead of looking like armor plates.'
  ]},
  {title:'Installation and customization',items:[
   'The installer offers optional SOTA UI, Wearable Devices and Looting Takes Time Redux patches. Enable only the patches for mods you use.',
   'Box and rig context-menu actions work in plain Anomaly as well as GAMMA. Magazine content and other gameplay dependencies still need to be installed separately.',
   'ZoneBench is now a website: edit items, preview layouts and export your own add-on. Its bundled data is ready for the 2.0 Update.',
   'Browse community add-ons with real item previews. Creators can update or remove their listings, and unwanted listings can be moderated.'
  ]},
  {title:'Still Squared Away',items:[
   'Rigs, boxes, rotation, limited carrying space, pouch upgrades, rig wear and the rig-based reload and quick-use rules remain part of the mod. These are returning features, not new additions.'
  ]}
 ]
}];
const key='zonebench.patchnotes.read';let readId=null;
try{readId=root.localStorage.getItem(key);}catch(_){}
function unread(){return readId!==entries[0].id;}
function markRead(){readId=entries[0].id;try{root.localStorage.setItem(key,readId);}catch(_){}refreshBadge();}
function refreshBadge(){const a=root.document?.querySelector('[data-patch-notes-link]');if(!a)return;const fresh=unread();a.classList.toggle('has-update',fresh);a.querySelector('.patch-new').hidden=!fresh;a.setAttribute('aria-label',fresh?'Patch Notes, new update':'Patch Notes');}
function decorate(a){a.dataset.patchNotesLink='';const badge=document.createElement('span');badge.className='patch-new';badge.textContent='New';badge.hidden=!unread();a.appendChild(badge);a.classList.toggle('has-update',unread());a.setAttribute('aria-label',unread()?'Patch Notes, new update':'Patch Notes');}
function render(P){
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 P.classList.add('patch-notes-page');
 P.appendChild(el('p','eyebrow','SQUARED AWAY / WHAT CHANGED'));P.appendChild(el('h1',null,'Patch Notes'));
 function articleFor(entry){
  const article=el('article','patch-entry');article.appendChild(el('p','patch-version',entry.version + (entry.date ? ' • ' + entry.date : '')));article.appendChild(el('h2',null,entry.title));article.appendChild(el('p','patch-status',entry.status));article.appendChild(el('p','page-lead',entry.summary));
  for(const group of entry.sections){const section=el('section','patch-group');section.appendChild(el('h3',null,group.title));const list=el('ul');for(const item of group.items)list.appendChild(el('li',null,item));section.appendChild(list);article.appendChild(section);}
  return article;
 }
 P.appendChild(articleFor(entries[0]));
 if(entries.length>1){
  const history=el('section','patch-history');history.appendChild(el('h2',null,'Previous updates'));
  history.appendChild(el('p','hint','Choose an update to read its patch notes.'));
  const tiles=el('div','patch-history-tiles'),detail=el('div','patch-history-detail');
  detail.id='patch-history-detail';detail.hidden=true;
  let selected=null;const buttons=[];
  function close(){selected=null;detail.replaceChildren();detail.hidden=true;for(const b of buttons)b.setAttribute('aria-expanded','false');}
  for(const entry of entries.slice(1)){
   const button=el('button','patch-history-tile');button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',detail.id);
   button.appendChild(el('span','patch-version',entry.version));
   button.appendChild(el('strong',null,entry.title));
   if(entry.date)button.appendChild(el('span','hint',entry.date));
   button.onclick=()=>{
    if(selected===entry.id){close();return;}
    close();selected=entry.id;button.setAttribute('aria-expanded','true');detail.hidden=false;
    const back=el('button','tool','Close older notes');back.onclick=()=>{close();button.focus();};detail.appendChild(back);
    const article=articleFor(entry);article.tabIndex=-1;detail.appendChild(article);article.focus({preventScroll:true});
    detail.scrollIntoView({block:'start',behavior:'auto'});
   };
   buttons.push(button);tiles.appendChild(button);
  }
  history.appendChild(tiles);history.appendChild(detail);P.appendChild(history);
 }
 const help=el('button','tool primary','Installation guide');help.onclick=()=>Site.go('help');P.appendChild(help);markRead();
}
root.addEventListener?.('storage',event=>{if(event.key===key||event.key===null){try{readId=root.localStorage.getItem(key);}catch(_){}refreshBadge();}});
root.PatchNotes={entries,unread,markRead,decorate,render};
})(globalThis);
