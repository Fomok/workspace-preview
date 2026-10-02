/* Presentation only: move existing controls without replacing their handlers. */
(function(root){
const selected=new Map(),queries=new Map();
const groups=[['overview','Overview'],['layout','Storage layout'],['craft','Craft & repair'],['availability','Availability'],['advanced','Advanced']];
function group(text){
 if(/pockets|fits inside|compartments|will fit|fitting it adds|room it gives|rule$/i.test(text))return 'layout';
 if(/mended|made of|breaks down|costs to build/i.test(text))return 'craft';
 if(/turns up|sells it|state it is in/i.test(text))return 'availability';
 if(/take.*over/i.test(text))return 'advanced';
 return 'overview';
}
function organize(P,it){
 const nodes=[...P.children],panels=new Map();let current='overview',started=false;const prefix=TAB+'-'+it.id;
 const bar=document.createElement('div');bar.className='item-sections';bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Item settings');
 const container=document.createElement('div');container.className='item-settings';
 function panel(key){if(!panels.has(key)){const p=document.createElement('section');p.className='item-settings-panel';p.id=prefix+'-'+key;p.setAttribute('role','tabpanel');panels.set(key,p);}return panels.get(key);}
 for(const node of nodes){
  if(node.classList.contains('sect')){current=group(node.textContent);started=true;}
  if(!started)continue;
  let target=node.classList.contains('danger')?'advanced':node.classList.contains('model-card')?'overview':current;
  panel(target).appendChild(node);
 }
 if(!panels.size)return;
 P.appendChild(bar);P.appendChild(container);P.classList.add('item-editor');
 const buttons=new Map();
 function activate(key,focus=false){selected.set(prefix,key);for(const [id,p] of panels){p.hidden=id!==key;const b=buttons.get(id);b.setAttribute('aria-selected',String(id===key));b.tabIndex=id===key?0:-1;}if(focus)buttons.get(key).focus();}
 for(const [key,label] of groups){if(!panels.has(key))continue;const b=document.createElement('button');b.textContent=label;b.type='button';b.setAttribute('role','tab');b.id=prefix+'-tab-'+key;b.setAttribute('aria-controls',panels.get(key).id);panels.get(key).setAttribute('aria-labelledby',b.id);b.onclick=()=>activate(key);buttons.set(key,b);bar.appendChild(b);container.appendChild(panels.get(key));}
 bar.onkeydown=e=>{const keys=[...buttons.keys()];const at=keys.indexOf(selected.get(prefix));let next;if(e.key==='ArrowRight')next=keys[(at+1)%keys.length];if(e.key==='ArrowLeft')next=keys[(at+keys.length-1)%keys.length];if(e.key==='Home')next=keys[0];if(e.key==='End')next=keys.at(-1);if(next){e.preventDefault();activate(next,true);}};
 activate(panels.has(selected.get(prefix))?selected.get(prefix):'overview');
}
function list(L){
 const toolbar=document.createElement('div');toolbar.className='item-library-tools';
 const title=document.createElement('strong');title.textContent='YOUR '+({rigs:'RIGS',boxes:'CONTAINERS',pouches:'POUCHES',packs:'BACKPACKS'}[TAB]||'ITEMS');toolbar.appendChild(title);
 const input=document.createElement('input');input.type='search';input.placeholder='Search items…';input.setAttribute('aria-label','Search items');input.value=queries.get(TAB)||'';toolbar.appendChild(input);
 const count=document.createElement('span');count.className='hint';toolbar.appendChild(count);L.prepend(toolbar);
 const rows=[...L.querySelectorAll('.row')];const empty=document.createElement('p');empty.className='hint';empty.textContent='No matching items.';toolbar.after(empty);
 const filter=()=>{queries.set(TAB,input.value);const q=input.value.trim().toLowerCase();let found=0;for(const row of rows){row.hidden=!row.textContent.toLowerCase().includes(q);if(!row.hidden)found++;}count.textContent=found+' of '+rows.length+' items';empty.hidden=found>0;};input.oninput=filter;filter();
}
root.EditorView={organize,list};
})(globalThis);
