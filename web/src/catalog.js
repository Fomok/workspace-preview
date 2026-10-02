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
  if(!CATALOG.addons.length){P.appendChild(el('div','empty-catalog','<h2>Room for your next idea.</h2><p>No public packs have been published yet. The catalog is ready for reviewed rigs, containers and pouches.</p><p>You can already create a pack in <b>Share items</b>. Public submissions and bug reporting are not enabled in this version.</p>'));return;}
  const grid=el('div','catalog-grid');P.appendChild(grid);
  for(const entry of CATALOG.addons){
   const card=el('article','card');card.appendChild(el('h2',null,esc(entry.name)));card.appendChild(el('p','hint',esc(entry.author)+' · '+esc(entry.version)));card.appendChild(el('p',null,esc(entry.description)));
   const button=el('button','tool primary','Preview items');card.appendChild(button);grid.appendChild(card);
   button.onclick=async()=>{
    button.disabled=true;
    try{
     if(!/^[a-z0-9_-]+\.json$/.test(entry.file))throw new Error('Invalid catalog file.');
     const r=await fetch('catalog/'+entry.file);if(!r.ok)throw new Error('Could not download this pack.');
     const pack=ZB.validateAddon(await r.json());
     INCOMING={from:pack.from,families:pack.families||{},items:pack.items.map(x=>({kind:x.kind,item:x.item,take:true,how:'rename'}))};
     TAB='share';render();
    }catch(error){alert(error.message);button.disabled=false;}
   };
  }
 }catch(error){status.textContent=error.message+' Your project is still available. Reopen this tab to retry.';CATALOG=null;}
}
