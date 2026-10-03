/* Screenshot-based field guide. Native scroll snapping; no wheel interception. */
(function(root){
'use strict';
let observer=null;
const chapters=[
 {id:'overview',label:'Your loadout',title:'A place for every item.',copy:'Your equipment, rig and backpack share one inventory. Arrange your gear by hand and keep the things you need within reach.',image:'inventory',alt:'Full Squared Away inventory, showing equipment on the left and rig and backpack storage on the right',note:'Actual in-game screenshots supplied by Fomok.'},
 {id:'grid',label:'The grid',title:'Turn it. Make it fit.',copy:'Every item takes up space. Drag it into an empty spot, or rotate it to fit a narrow gap. Green means the placement fits; red means it is blocked.',image:'rotation',alt:'A two-cell item rotated horizontally over a green placement highlight',note:'Use your configured rotate key while dragging. Incoming items can auto-rotate when needed, if enabled in MCM.'},
 {id:'containers',label:'Containers',title:'More room inside.',copy:'Boxes give you storage inside your inventory. Open one to move items in or out. Its contents stay with it when you drop it or leave it in a stash.',image:'container',alt:'An open Small Food Container containing water, food and a canteen',note:'Each container has its own layout and accepted item types.'},
 {id:'rigs',label:'Rigs',title:'Wear your ready gear.',copy:'Equip a rig to access its pockets above your backpack. Its slots can hold any item that fits. Unequip it and the contents stay inside, just like a container.',image:'rig-pouches',alt:'An equipped rig with magazines, medicine and expansion pouches',note:'Rigs have different layouts. Looted rigs can arrive damaged, and combat can wear them down.'},
 {id:'quick-access',label:'Quick access',title:'Keep essentials on your chest.',copy:'Keep spare magazines in your equipped rig for reloading, medicine there for quick use, and loose ammo there for weapons that reload without magazines.',image:'rig-pouches',alt:'Magazines and medicine stored in an equipped rig for quick access',note:'These are the default rig rules. You can adjust the medicine and loose-ammo restrictions in MCM.'},
 {id:'pouches',label:'Expansion pouches',title:'A little extra space.',copy:'Fit expansion pouches into the two slots below your rig. They add storage to the rig layout. Amber borders show which spaces come from the pouches.',image:'rig-pouches',alt:'Two pouches below the equipped rig and the amber-bordered storage they add on the right',note:'Ready to customize? ZoneBench lets you edit rigs, containers, pouches and more.'}
];
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function cleanup(){if(observer){observer.disconnect();observer=null;}}
function render(P){
 cleanup();const shell=el('div','intro-shell');P.appendChild(shell);
 const nav=el('nav','intro-nav');nav.setAttribute('aria-label','Introduction sections');shell.appendChild(nav);
 const view=el('div','intro-viewport');view.tabIndex=0;view.setAttribute('role','region');view.setAttribute('aria-label','Squared Away introduction. Scroll or use the section buttons.');shell.appendChild(view);
 const sections=[],buttons=[];const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function select(index){sections[index].scrollIntoView({behavior:reduce()?'instant':'smooth',block:'start'});}
 chapters.forEach((c,i)=>{
  const b=el('button','intro-nav-button',String(i+1).padStart(2,'0')+' / '+c.label);b.onclick=()=>select(i);nav.appendChild(b);buttons.push(b);
  const section=el('section','intro-section');section.id='intro-'+c.id;section.setAttribute('aria-labelledby','intro-title-'+c.id);sections.push(section);view.appendChild(section);
  const body=el('div','intro-copy');section.appendChild(body);body.appendChild(el('p','eyebrow','INTRODUCTION / '+String(i+1).padStart(2,'0')));
  const h=el(i===0?'h1':'h2',null,c.title);h.id='intro-title-'+c.id;body.appendChild(h);body.appendChild(el('p','intro-description',c.copy));body.appendChild(el('p','intro-note',c.note));
  const steps=el('div','intro-actions');body.appendChild(steps);
  if(i>0){const prev=el('button','tool','Previous');prev.onclick=()=>select(i-1);steps.appendChild(prev);}
  const next=el('button','tool primary',i===chapters.length-1?'Open the editor':'Next: '+chapters[i+1].label);next.onclick=()=>i===chapters.length-1?Site.go('rigs'):select(i+1);steps.appendChild(next);
  body.appendChild(el('p','intro-scroll-hint','Scroll to explore · '+(i+1)+' / '+chapters.length));
  const figure=el('figure','intro-figure intro-image-'+c.image);const a=el('a');a.href='assets/gameplay/'+c.image+'.png';a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','View full screenshot: '+c.label);
  const img=el('img');img.src=a.href;img.alt=c.alt;img.decoding='async';a.appendChild(img);figure.appendChild(a);figure.appendChild(el('figcaption',null,'IN-GAME / '+c.label.toUpperCase()+' · Click to enlarge'));section.appendChild(figure);
 });
 function active(index){sections.forEach((s,i)=>s.classList.toggle('is-current',i===index));buttons.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
 active(0);
 if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting&&e.intersectionRatio>=.5).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible[0])active(sections.indexOf(visible[0].target));},{root:view,threshold:[.5,.65]});sections.forEach(s=>observer.observe(s));}
}
root.Introduction={render,cleanup};
})(globalThis);
