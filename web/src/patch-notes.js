/* Change the entry id when publishing a new set of notes: this re-arms the New badge. */
(function(root){
'use strict';
const entries=[{
 id:'squared-away-preview40-rebuild-v1',
 title:'Squared Away: the inventory rebuild',
 version:'3.49.2 / Preview 40',
 status:'Preview • Mod download not yet published',
 summary:'The same pack-your-own inventory, rebuilt around a dedicated game engine, with a cleaner interface and fewer awkward workarounds.',
 sections:[
  {title:'Before you install',items:[
   'This rebuild requires the matching custom engine and DB0. Start a new game when moving from the old public version.',
   'Already testing Preview 39? Preview 40 uses the same engine and does not require another new game.',
   'These notes compare the original mod with the rebuild. They leave out temporary problems introduced and fixed during development.'
  ]},
  {title:'Packing and carrying',items:[
   'The engine now handles inventory space, item placement and saved layouts. Your chosen positions and rotations stay with your inventory.',
   'Picked-up items can turn automatically to fit an available gap when auto-rotation is enabled.',
   'Crafting and NPC item hand-ins can use items inside carried boxes and spare rigs. You do not have to unpack them first.',
   'Rigs use a dedicated equipment slot. Equipped rig items use normal inventory icons, including supported dynamic icons and magazine ammo counters.'
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
   'ZoneBench is now a website: edit items, preview layouts and export your own add-on. Its bundled data matches Preview 40.',
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
 for(const entry of entries){
  const article=el('article','patch-entry');article.appendChild(el('p','patch-version',entry.version));article.appendChild(el('h2',null,entry.title));article.appendChild(el('p','patch-status',entry.status));article.appendChild(el('p','page-lead',entry.summary));
  for(const group of entry.sections){const section=el('section','patch-group');section.appendChild(el('h3',null,group.title));const list=el('ul');for(const item of group.items)list.appendChild(el('li',null,item));section.appendChild(list);article.appendChild(section);}
  P.appendChild(article);
 }
 const help=el('button','tool primary','Installation guide');help.onclick=()=>Site.go('help');P.appendChild(help);markRead();
}
root.addEventListener?.('storage',event=>{if(event.key===key||event.key===null){try{readId=root.localStorage.getItem(key);}catch(_){}refreshBadge();}});
root.PatchNotes={entries,unread,markRead,decorate,render};
})(globalThis);
