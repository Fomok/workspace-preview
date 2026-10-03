/* Screenshot-based field guide. Native scroll snapping; no wheel interception. */
(function(root){
'use strict';
let observer=null;
const chapters=[
 {id:'overview',label:'Your loadout',title:'A place for every item.',copy:'Your equipment, rig and backpack share one inventory. Arrange your gear by hand and keep the things you need within reach.',image:'inventory',alt:'Full Squared Away inventory, showing equipment on the left and rig and backpack storage on the right',note:''},
 {id:'grid',label:'The grid',title:'Turn it. Make it fit.',copy:'Every item takes up space. Drag it into an empty spot, or rotate it to fit a narrow gap. Green means the placement fits; red means it is blocked.',image:'rotation',alt:'A two-cell item rotated horizontally over a green placement highlight',note:'Use your configured rotate key while dragging. Incoming items can auto-rotate when needed, if enabled in MCM.'},
 {id:'containers',label:'Containers',title:'More room inside.',copy:'Boxes give you storage inside your inventory. Open one to move items in or out. Its contents stay with it when you drop it or leave it in a stash.',image:'container',alt:'An open Small Food Container containing water, food and a canteen',note:'Each container has its own layout and accepted item types.'},
 {id:'rigs',label:'Rigs',title:'Wear your ready gear.',copy:'Equip a rig to access its pockets above your backpack. Its slots can hold any item that fits. Unequip it and the contents stay inside, just like a container.',image:'rig-pouches',alt:'An equipped rig with magazines, medicine and expansion pouches',note:'Rigs have different layouts. Looted rigs can arrive damaged, and combat can wear them down.'},
 {id:'quick-access',label:'Quick access',title:'Keep essentials on your chest.',copy:'Keep spare magazines in your equipped rig for reloading, medicine there for quick use, and loose ammo there for weapons that reload without magazines.',image:'rig-pouches',alt:'Magazines and medicine stored in an equipped rig for quick access',note:'These are the default rig rules. You can adjust the medicine and loose-ammo restrictions in MCM.'},
 {id:'pouches',label:'Expansion pouches',title:'A little extra space.',copy:'Fit expansion pouches into the two slots below your rig. They add storage to the rig layout. Amber borders show which spaces come from the pouches.',image:'rig-pouches',alt:'Two pouches below the equipped rig and the amber-bordered storage they add on the right',note:'Ready to customize? ZoneBench lets you edit rigs, containers, pouches and more.'}
];
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function cleanup(){if(observer){observer.disconnect();observer=null;}}
// The illustration sits outside the scrolling text: chapters 04-06 share one image node.
const pictures={inventory:[1205,1079],rotation:[172,137],container:[429,174],'rig-pouches':[595,245]};
// Regions use original screenshot pixels, so outlines follow the image at every size.
const pointers=[
 [['Equipped rig',[[507,161,100,153]]],['Backpack storage',[[611,422,363,467]]]],
 [['Rotate to fit',[[50,69,105,48]]],['Green: valid placement',[[54,60,105,53]]]],
 [['Open container',[[109,5,312,31]]],['Storage inside',[[117,46,292,112]]]],
 [['Equipped rig',[[2,15,102,153]]],['Rig pockets',[[113,20,369,154]]]],
 [['Medicine for quick use',[[270,20,104,50]]],['Magazines for reloading',[[218,72,156,102],[113,20,101,102],[378,20,104,102]]]],
 [['Expansion pouch slots',[[2,172,102,52]]],['Added storage',[[486,20,102,205]]]]
];
function render(P){
 cleanup();const shell=el('div','intro-shell');P.appendChild(shell);
 const nav=el('nav','intro-nav');nav.setAttribute('aria-label','Introduction sections');shell.appendChild(nav);
 const reader=el('div','intro-reader');shell.appendChild(reader);
 const view=el('div','intro-viewport');view.tabIndex=0;view.setAttribute('role','region');view.setAttribute('aria-label','Squared Away introduction. Scroll or use the section buttons.');reader.appendChild(view);
 const stage=el('figure','intro-stage');reader.appendChild(stage);
 const ns='http://www.w3.org/2000/svg';
 function svgEl(tag,attrs){const node=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,v);return node;}
 const art=svgEl('svg',{role:'img',class:'intro-annotated'});stage.appendChild(art);
 const title=svgEl('title');art.appendChild(title);
 const shot=svgEl('image',{x:60,y:100,width:880});art.appendChild(shot);
 const marks=svgEl('g',{'aria-hidden':'true'});art.appendChild(marks);
 const enlarge=el('a','intro-enlarge','View full screenshot');enlarge.target='_blank';enlarge.rel='noopener';stage.appendChild(enlarge);
 let shownImage='';
 function illustrate(index){
  const c=chapters[index],dims=pictures[c.image],h=880*dims[1]/dims[0];
  if(shownImage!==c.image){shownImage=c.image;shot.setAttribute('href','assets/gameplay/'+c.image+'.png');shot.setAttribute('height',h);art.setAttribute('viewBox','0 0 1000 '+(h+200));enlarge.href='assets/gameplay/'+c.image+'.png';}
  title.textContent=c.alt+'. '+pointers[index].map(p=>p[0]).join('. ');marks.replaceChildren();
  pointers[index].forEach(([label,regions],i)=>{
   const scale=880/dims[0],bw=410,bx=i===0?30:560,by=i===0?12:h+132;
   const [rx,ry,rw,rh]=regions[0];
   const edgeX=60+(i===0?rx:rx+rw)*scale,edgeY=100+(ry+rh/2)*scale;
   // Route through the outer gutter and meet the outline, never a point inside it.
   const laneY=i===0?82:h+118,gutterX=i===0?40:960;
   marks.appendChild(svgEl('path',{d:`M ${bx+bw/2} ${i===0?by+52:by} V ${laneY} H ${gutterX} V ${edgeY} H ${edgeX}`,class:'intro-pointer-line'}));
   regions.forEach(([x,y,w,height])=>marks.appendChild(svgEl('rect',{x:60+x*scale,y:100+y*scale,width:w*scale,height:height*scale,class:'intro-region-outline'})));
   marks.appendChild(svgEl('rect',{x:bx,y:by,width:bw,height:52,rx:3,class:'intro-pointer-box'}));
   const t=svgEl('text',{x:bx+bw/2,y:by+33,'text-anchor':'middle',class:'intro-pointer-label'});t.textContent=label;marks.appendChild(t);
  });
 }
 const sections=[],buttons=[];const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function select(index){view.scrollTo({top:sections[index].offsetTop,behavior:reduce()?'instant':'smooth'});}
 chapters.forEach((c,i)=>{
  const b=el('button','intro-nav-button',String(i+1).padStart(2,'0')+' / '+c.label);b.onclick=()=>select(i);nav.appendChild(b);buttons.push(b);
  const section=el('section','intro-section');section.id='intro-'+c.id;section.setAttribute('aria-labelledby','intro-title-'+c.id);sections.push(section);view.appendChild(section);
  const body=el('div','intro-copy');section.appendChild(body);body.appendChild(el('p','eyebrow','INTRODUCTION / '+String(i+1).padStart(2,'0')));
  const h=el(i===0?'h1':'h2',null,c.title);h.id='intro-title-'+c.id;body.appendChild(h);body.appendChild(el('p','intro-description',c.copy));if(c.note)body.appendChild(el('p','intro-note',c.note));
  const steps=el('div','intro-actions');body.appendChild(steps);
  if(i>0){const prev=el('button','tool','Previous');prev.onclick=()=>select(i-1);steps.appendChild(prev);}
  const next=el('button','tool primary',i===chapters.length-1?'Open the editor':'Next: '+chapters[i+1].label);next.onclick=()=>i===chapters.length-1?Site.go('rigs'):select(i+1);steps.appendChild(next);
  body.appendChild(el('p','intro-scroll-hint','Scroll to explore · '+(i+1)+' / '+chapters.length));
 });
 let current=-1;
 function active(index){if(current===index)return;current=index;sections.forEach((s,i)=>s.classList.toggle('is-current',i===index));buttons.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});illustrate(index);}
 active(0);
 // Nearest section works even when a short screen cannot show half a tall chapter.
 view.addEventListener('scroll',()=>{const focus=view.scrollTop+view.clientHeight*.4;let index=0;sections.forEach((s,i)=>{if(s.offsetTop<=focus)index=i;});active(index);},{passive:true});
}
root.Introduction={render,cleanup};
})(globalThis);
