function drawModel(P,it){
 const card=el('div','card model-card');card.appendChild(el('h2',null,'Dropped world model'));
 const select=document.createElement('select');select.setAttribute('aria-label','Dropped world model');
 for(const [value,label] of [['rig','Shared chest rig'],['box','Shared storage case'],['original','Keep the item\'s original model'],['custom','Custom game model']]){
  const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);
 }
 select.value=it.model||(TAB==='rigs'?'rig':'box');
 select.onchange=()=>{it.model=select.value;touch();renderPane();};card.appendChild(select);
 if(select.value==='custom'){
  const path=document.createElement('input');path.placeholder='folder\\model_name';path.value=it.modelPath||'';path.setAttribute('aria-label','Custom model path');
  path.oninput=()=>{it.modelPath=path.value;touch();};card.appendChild(path);
  card.appendChild(el('p','hint','Path under gamedata/meshes, without .ogf. The model and its textures must be installed separately.'));
 }else card.appendChild(el('p','hint','Shared models and their textures are included in the exported ZIP. This changes the dropped item, not its inventory icon.'));
 P.appendChild(card);
}
let CATALOG=null;
async function drawCatalog(P){
 if(Community.enabled)return drawCommunityCatalog(P);
 P.appendChild(el('h1',null,'Public add-ons'));
 P.appendChild(el('p','hint','Discover curated item packs and bring selected items into your project. Nothing is installed until you export.'));
 const status=el('p','hint','Loading catalog…');P.appendChild(status);
 try{
  if(!CATALOG){const r=await fetch('catalog/index.json',{cache:'no-cache'});if(!r.ok)throw new Error('Catalog could not be loaded.');CATALOG=await r.json();}
  if(!P.contains(status))return;status.remove();
  if(!CATALOG.addons.length){
   const card=el('div','empty-catalog','<h2>The community library is in preview.</h2><p>Browse published add-ons, inspect their items, or sign in to share your own creations.</p>');
   const url=new URL(location.href);url.searchParams.set('community-preview','1');url.hash='community';
   const link=document.createElement('a');link.className='tool primary';link.href=url.href;link.textContent='Open community preview';card.appendChild(link);P.appendChild(card);return;
  }
  const records=CATALOG.addons.map(entry=>({listing:entry,load:CatalogBrowser.once(async()=>{
    if(!/^[a-z0-9_-]+\.json$/.test(entry.file))throw new Error('Invalid catalog file.');
    const response=await fetch('catalog/'+entry.file);if(!response.ok)throw new Error('Could not download this pack.');
    return {listing:entry,pack:ZB.validateAddon(await response.json())};
  })}));
  CatalogBrowser.mount(P,records,(record,grid)=>{
   const entry=record.listing,row=el('article','card addon-listing'),card=el('div','addon-listing-content');row.appendChild(card);card.appendChild(el('h2',null,esc(entry.name)));card.appendChild(el('p','hint',esc(entry.author)+' · '+esc(entry.version)));card.appendChild(el('p',null,esc(entry.description)));grid.appendChild(row);
   const show=AddonPreview.card(card,entry,record.load,({pack})=>{INCOMING={from:pack.from,families:pack.families||{},items:pack.items.map(x=>({kind:x.kind,item:x.item,take:true,how:'rename'}))};TAB='share';render();});
   const button=el('button','tool primary','View items');button.onclick=show;card.appendChild(button);
  });
 }catch(error){status.textContent=error.message+' Your project is still available. Reopen this tab to retry.';CATALOG=null;}
}
