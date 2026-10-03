/* Decorative Home intro. It never blocks navigation or touches project data. */
(function(root){
'use strict';
const key='zonebench-cursor-opening-seen';
let available=!location.hash||location.hash==='#home',cancelActive=()=>{};
try{if(sessionStorage.getItem(key))available=false;}catch(_){}
if(matchMedia('(prefers-reduced-motion: reduce)').matches)available=false;
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
function play(title){
 if(!available||!title.isConnected||title.textContent!=='SQUARED AWAY')return;
 available=false;try{sessionStorage.setItem(key,'1');}catch(_){}
 const text=title.textContent,letter=document.createElement('span');letter.textContent='W';letter.className='intro-letter-gap';
 title.setAttribute('data-no-site-copy','');title.setAttribute('aria-label',text);
 const before=document.createElement('span'),after=document.createElement('span');before.textContent='SQUARED A';after.textContent='AY';
 for(const part of [before,letter,after])part.setAttribute('aria-hidden','true');
 title.replaceChildren(before,letter,after);
 const flight=document.createElement('div');flight.className='cursor-opening';flight.setAttribute('aria-hidden','true');flight.setAttribute('data-no-site-copy','');
 const glyph=document.createElement('span');glyph.textContent='W';glyph.className='intro-dragged-letter';
 const cursor=document.createElement('span');cursor.className='intro-anomaly-cursor';flight.append(glyph,cursor);document.body.appendChild(flight);
 const s=getComputedStyle(title);for(const prop of ['fontFamily','fontSize','fontWeight','fontStretch','fontStyle','letterSpacing','lineHeight','color'])glyph.style[prop]=s[prop];
 const r=letter.getBoundingClientRect();
 const scale=Math.min(1,parseFloat(s.fontSize)/74.24);
 glyph.style.width=r.width+'px';glyph.style.height=r.height+'px';
 let frame=0,closed=false,start=null;
 function finish(){
  if(closed)return;closed=true;cancelAnimationFrame(frame);clearTimeout(timeout);flight.remove();
  letter.classList.remove('intro-letter-gap');
  if(title.textContent===text)title.textContent=text;
  title.removeAttribute('data-no-site-copy');title.removeAttribute('aria-label');
  for(const event of ['resize','pagehide','blur'])window.removeEventListener(event,finish);
  document.removeEventListener('keydown',onKey,true);
  cancelActive=()=>{};
 }
 function onKey(event){if(event.key==='Escape')finish();}
 cancelActive=finish;
 for(const event of ['resize','pagehide','blur'])window.addEventListener(event,finish,{once:true});
 document.addEventListener('keydown',onKey,true);
 const timeout=setTimeout(finish,4500);
 function draw(now){
  if(closed)return;if(!title.isConnected){finish();return;}
  if(start===null)start=now;const t=(now-start)/1000,q=ease((t-.20)/2.15);
  // Track the slot through wheel, touch, scrollbar and keyboard scrolling.
  const current=letter.getBoundingClientRect(),cx=current.x+current.width/2,cy=current.y+current.height/2;
  const x=(1-q)**3*(-70)+3*(1-q)**2*q*Math.min(120,cx*.4)+3*(1-q)*q*q*(cx-38*scale)+q**3*cx;
  const y=(1-q)**3*(cy-100*scale)+3*(1-q)**2*q*(cy-135*scale)+3*(1-q)*q*q*(cy-65*scale)+q**3*cy;
  const angle=180-90*ease((t-.75)/.22)-90*ease((t-1.78)/.23);
  glyph.style.transform=`translate(${x-r.width/2}px,${y-r.height/2}px) rotate(${-angle}deg)`;
  if(t>=2.35){glyph.style.visibility='hidden';letter.classList.remove('intro-letter-gap');}
  let px=x+6*scale,py=y+10*scale;
  if(t>2.45){const exit=ease((t-2.45)/.70);px=cx+6*scale+99*scale*exit;py=cy+10*scale+100*scale*exit;}
  cursor.style.transform=`translate(${px}px,${py}px)`;
  cursor.style.backgroundPosition=`${-(Math.floor(t*12)%8)*64}px 0`;
  cursor.style.opacity=t<.20?'0':String(1-ease((t-2.82)/.33));
  if(t>=3.15){finish();return;}frame=requestAnimationFrame(draw);
 }
 frame=requestAnimationFrame(draw);
}
root.OpeningIntro={play,cancel:()=>cancelActive()};
})(window);
