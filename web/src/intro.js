/* Session-only opening. No project data, network requests or loading percentages. */
(function(){
'use strict';
const key='zonebench-opening-seen';
try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch(_){}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const overlay=document.createElement('div');overlay.className='opening-intro';
overlay.setAttribute('aria-label','Squared Away introduction');
const label=document.createElement('span');label.className='intro-label';label.textContent='SQUARED AWAY';
const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
const skip=document.createElement('button');skip.type='button';skip.textContent='Skip intro';
overlay.append(canvas,label,skip);document.body.appendChild(overlay);
let frame=0,closed=false,app=null,ready=document.readyState!=='loading';
const start=performance.now();
function remove(){overlay.remove();}
function finish(){
 if(closed)return;closed=true;cancelAnimationFrame(frame);clearTimeout(failsafe);
 document.removeEventListener('keydown',escape);window.removeEventListener('resize',resize);
 if(app)app.inert=false;
 if(overlay.contains(document.activeElement))document.querySelector('.brand')?.focus({preventScroll:true});
 overlay.classList.add('is-leaving');setTimeout(remove,reduced?0:680);
}
function escape(e){if(e.key==='Escape'){e.preventDefault();finish();}}
skip.onclick=finish;document.addEventListener('keydown',escape);
// A stalled resource or script must never trap the visitor behind the title.
const failsafe=setTimeout(finish,5500);
function loaded(){ready=true;app=document.getElementById('app');if(app&&!closed)app.inert=true;}
if(ready)loaded();else document.addEventListener('DOMContentLoaded',loaded,{once:true});
const ctx=canvas.getContext('2d');if(!ctx){finish();return;}
const glyphs={
 S:['11111','10000','10000','11111','00001','00001','11111'],
 Q:['01110','11011','10001','10001','10101','11010','01101'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 A:['01110','11011','10001','11111','10001','10001','10001'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 W:['10001','10001','10001','10101','10101','11011','10001'],
 Y:['10001','10001','01010','00100','00100','00100','00100']
};
const cells=[];let column=0;
for(const char of 'SQUARED AWAY'){
 if(char===' '){column+=3;continue;}
 glyphs[char].forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')cells.push({x:column+x,y,index:cells.length});}));column+=6;
}
const cols=column-1;let width=0,height=0,unit=0,left=0,top=0;
function resize(){
 width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 unit=Math.min(14,(width-48)/cols);left=(width-cols*unit)/2;top=(height-7*unit)/2;
}
resize();window.addEventListener('resize',resize);
const ease=t=>1-Math.pow(1-t,3);
function draw(now){
 if(closed)return;
 const elapsed=now-start;ctx.clearRect(0,0,width,height);
 // Every piece travels along grid axes, then locks into the letter grid.
 for(const c of cells){
  const seed=(c.index*37+11)%101;
  const delay=100+seed*5;
  const t=reduced?1:Math.min(1,Math.max(0,(elapsed-delay)/900));
  if(t===0)continue;
  const dx=((c.index%2)?1:-1)*(3+seed%9)*unit;
  const dy=((c.index%3)?1:-1)*(3+seed%6)*unit;
  const x=left+c.x*unit+dx*(1-ease(Math.min(1,t*2)));
  const y=top+c.y*unit+dy*(1-ease(Math.max(0,t*2-1)));
  ctx.globalAlpha=Math.min(1,t*4);
  ctx.fillStyle=t<.9?'#b6a27b':'#e9e7de';
  const gap=Math.max(.7,unit*.085);
  ctx.fillRect(x+gap/2,y+gap/2,unit-gap,unit-gap);
 }
 ctx.globalAlpha=1;
 if(ready&&elapsed>=(reduced?150:2100)){finish();return;}
 frame=requestAnimationFrame(draw);
}
frame=requestAnimationFrame(draw);
window.addEventListener('pagehide',()=>{finish();remove();},{once:true});
})();
