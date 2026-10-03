/* Plain-text presentation overrides. Never modifies project data, HTML or link targets. */
(function(root){
'use strict';
const overrides=new Map(), originals=new WeakMap();
const excluded='script,style,noscript,textarea,code,pre,[contenteditable],.site-copy-panel,[data-no-site-copy],#list,#dirty,.addon-listing h3,.addon-listing .hint,.addon-detail h2';
const attrs=['placeholder','title','aria-label','alt'];
const normalize=s=>s.replace(/\s+/g,' ').trim();
let panel=null,selected=null,loaded=false;
function permitted(e){return e && !e.closest(excluded);}
function fields(node){
 if(node.nodeType===3)return permitted(node.parentElement)?[['text',node.data]]:[];
 if(node.nodeType!==1 || !permitted(node))return [];
 return attrs.filter(a=>node.hasAttribute(a)).map(a=>[a,node.getAttribute(a)]);
}
function records(node){
 let saved=originals.get(node);if(!saved){saved=new Map();originals.set(node,saved);}
 const result=[];
 for(const [field,current] of fields(node)){
  let state=saved.get(field);
  if(!state||state.output!==current){state={raw:current,source:normalize(current),output:current};saved.set(field,state);}
  if(!state.source||state.source.length>6000||!/[A-Za-z]/.test(state.source))continue;
  result.push({node,field,state});
 }
 return result;
}
function walk(start,fn){
 if(!start)return;
 for(const rec of records(start))fn(rec);
 const walker=document.createTreeWalker(start,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let node;while((node=walker.nextNode()))for(const rec of records(node))fn(rec);
}
function apply(rec){
 const {node,field,state}=rec,entry=overrides.get(state.source);
 const value=entry?state.raw.match(/^\s*/)[0]+entry.value+state.raw.match(/\s*$/)[0]:state.raw;
 if(value===state.output)return;
 // An option without an explicit value would otherwise change the editor's data.
 if(field==='text'&&node.parentElement?.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.value=node.parentElement.value;
 state.output=value;
 if(field==='text')node.data=value;else node.setAttribute(field,value);
}
function refresh(){walk(document.body,apply);}
async function load(){
 const response=await Community.request('siteText');
 if(!Array.isArray(response.entries))throw new Error('Website text storage is not ready.');
 overrides.clear();for(const entry of response.entries)overrides.set(entry.source,entry);
 loaded=true;refresh();
}
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function button(parent,label,fn){const b=element('button',label,'tool');b.type='button';b.onclick=fn;parent.appendChild(b);return b;}
function close(){panel?.remove();panel=null;selected=null;document.body.classList.remove('site-copy-active');}
function editor(source){
 selected=source;const form=panel.querySelector('.site-copy-form');form.replaceChildren();
 const previous=overrides.get(source),revision=previous?.revision||0;
 form.appendChild(element('h3','Edit wording'));
 form.appendChild(element('p','Original','eyebrow'));form.appendChild(element('p',source,'site-copy-original'));
 const label=element('label','Replacement text');const area=element('textarea');area.value=previous?.value||source;area.maxLength=6000;area.rows=5;label.appendChild(area);form.appendChild(label);
 const message=element('p','','hint');message.setAttribute('role','status');
 const actions=element('div',undefined,'site-copy-actions');form.appendChild(actions);form.appendChild(message);
 async function submit(reset){
  for(const b of actions.children)b.disabled=true;
  message.textContent='Saving…';
  try{
   const {entry}=await Community.request(reset?'resetSiteText':'saveSiteText',{source,value:area.value,expectedRevision:revision});
   if(entry.revision)overrides.set(source,entry);else overrides.delete(source);
   refresh();editor(source);panel.querySelector('.site-copy-form [role=status]').textContent=reset?'Original wording restored for everyone.':'Published. Visitors see this wording when they open or reload the site.';
  }catch(e){message.textContent=e.message;for(const b of actions.children)b.disabled=false;}
 }
 button(actions,'Save for everyone',()=>submit(false)).classList.add('primary');
 button(actions,'Restore original',()=>submit(true)).disabled=!previous;
 button(actions,'Cancel',()=>{selected=null;form.replaceChildren();});
 area.focus();
}
function list(){
 if(!panel)return;
 const query=normalize(panel.querySelector('input').value).toLowerCase();
 const saved=panel.querySelector('select').value==='saved';
 const entries=new Set();
 if(saved){for(const source of overrides.keys())entries.add(source);}
 else walk(document.body,({node,state})=>{
  const owner=node.nodeType===3?node.parentElement:node;
  const e=owner.tagName==='OPTION'?owner.closest('select'):owner;
  if(e && e.getClientRects().length && !e.closest('[hidden]'))entries.add(state.source);
 });
 const target=panel.querySelector('.site-copy-list');target.replaceChildren();
 let count=0;
 for(const source of entries){
  const value=overrides.get(source)?.value||source;
  if(query && !(source+' '+value).toLowerCase().includes(query))continue;
  count++;
  const b=button(target,value,()=>editor(source));b.title=source;
  if(overrides.has(source))b.classList.add('site-copy-changed');
 }
 if(!count)target.appendChild(element('p','No matching text. Navigate to another page and select Refresh list.','hint'));
}
async function open(){
 if(!(await Community.refresh())?.moderator)throw new Error('Admin access required.');
 await load();close();
 panel=element('aside',undefined,'site-copy-panel');panel.setAttribute('aria-label','Website text editor');panel.setAttribute('data-no-site-copy','');document.body.appendChild(panel);document.body.classList.add('site-copy-active');
 const head=element('div',undefined,'site-copy-actions');head.appendChild(element('h2','Website text'));button(head,'Close',close);panel.appendChild(head);
 panel.appendChild(element('p','Navigate to a page, refresh the list, then choose text to edit. Identical wording changes everywhere. Changes are plain text; links, controls and item data stay intact.','hint'));
 const filter=element('input');filter.type='search';filter.placeholder='Find text…';filter.setAttribute('aria-label','Find site text');filter.oninput=list;panel.appendChild(filter);
 const controls=element('div',undefined,'site-copy-actions');const mode=element('select');mode.setAttribute('aria-label','Text list');for(const [value,label] of [['page','Texts on this page'],['saved','Saved edits']]){const o=element('option',label);o.value=value;mode.appendChild(o);}mode.onchange=list;controls.appendChild(mode);button(controls,'Refresh list',list);panel.appendChild(controls);
 panel.appendChild(element('div',undefined,'site-copy-list'));panel.appendChild(element('div',undefined,'site-copy-form'));list();
}
const observer=new MutationObserver(changes=>{
 for(const change of changes){
  if(change.type==='childList')for(const node of change.addedNodes)walk(node,apply);
  else for(const rec of records(change.target))apply(rec);
 }
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attrs});
root.SiteCopy={open,close,refresh,get loaded(){return loaded;}};
load().catch(()=>{}); // Default copy remains usable during an outage or before backend deployment.
})(globalThis);
