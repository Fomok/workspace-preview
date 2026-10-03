/* Browse actual pack contents; filters never import or modify project data. */
(function(root){
'use strict';
function matches(listing,query){const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);const text=[listing.name,listing.description,listing.author,listing.dependencies].filter(Boolean).join(' ').toLowerCase();return words.every(word=>text.includes(word));}
function hasKind(pack,kind){return !kind||pack.items.some(entry=>entry.kind===kind);}
function once(load){let pending;return ()=>pending||(pending=Promise.resolve().then(load).catch(error=>{pending=null;throw error;}));}
function mount(parent,records,renderRow){
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 const tools=node('div','catalog-browser-tools'),search=node('input'),kind=node('select');search.type='search';search.placeholder='Search add-ons, creators or requirements';search.setAttribute('aria-label','Search community add-ons');kind.setAttribute('aria-label','Filter by item type');
 for(const [value,label] of [['','All item types'],['rigs','Rigs'],['boxes','Containers'],['pouches','Pouches'],['packs','Backpacks'],['items','Other items']]){const o=node('option',null,label);o.value=value;kind.appendChild(o);}tools.append(search,kind);parent.appendChild(tools);
 const status=node('p','hint');status.setAttribute('role','status');parent.appendChild(status);const grid=node('div','catalog-grid');parent.appendChild(grid);
 const more=node('button','tool','Load more add-ons');more.type='button';parent.appendChild(more);
 let generation=0,visible=24,timer;const packs=new Map();
 async function apply(){
  const token=++generation;const candidates=records.filter(r=>matches(r.listing,search.value));let found=candidates,failed=0;
  grid.replaceChildren();more.hidden=true;
  if(kind.value){
   const wanted=kind.value;let next=0,checked=0;found=[];
   async function worker(){while(next<candidates.length&&token===generation&&parent.contains(grid)){const r=candidates[next++];try{let pack=packs.get(r);if(!pack){pack=(await r.load()).pack;ZB.validateAddon(pack);packs.set(r,pack);}if(hasKind(pack,wanted))found.push(r);}catch{failed++;}checked++;if(token===generation)status.textContent='Checking item types: '+checked+' of '+candidates.length+' add-ons…';}}
   status.textContent='Checking item types…';await Promise.all([worker(),worker()]);
   // Keep the original newest-first order despite different response times.
   const matched=new Set(found);found=candidates.filter(r=>matched.has(r));
  }
  if(token!==generation||!parent.contains(grid))return;
  for(const r of found.slice(0,visible))renderRow(r,grid);
  status.textContent=found.length+' matching add-on'+(found.length===1?'':'s')+' · showing '+Math.min(visible,found.length)+(failed?' · '+failed+' could not be checked; change the filter to retry.':'');
  if(!found.length)grid.appendChild(node('p','hint',records.length?'No matching add-ons. Try a different search or item type.':'No add-ons here yet.'));
  more.hidden=visible>=found.length;
 }
 search.oninput=()=>{clearTimeout(timer);generation++;visible=24;timer=setTimeout(apply,180);};kind.onchange=()=>{clearTimeout(timer);visible=24;apply();};more.onclick=()=>{visible+=24;apply();};apply();
}
root.CatalogBrowser={matches,hasKind,once,mount};
})(globalThis);
