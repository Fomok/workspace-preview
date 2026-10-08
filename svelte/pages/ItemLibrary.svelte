<script>
 import {onMount,onDestroy,untrack} from 'svelte';
 import EquipmentDoodle from '../components/EquipmentDoodle.svelte';
 import {downloadedAddons} from '../lib/addon-downloads.mjs';
 let {choose=false,library}=$props();
 const scope=untrack(()=>library.scope);const previous=untrack(()=>library.getFilters(scope));
 let rows=$state(untrack(()=>choose?[]:library.entries(scope))),query=$state(previous.query||''),kind=$state(previous.kind||''),source=$state(previous.source||''),status=$state(previous.status||''),sort=$state(previous.sort||'name'),loading=$state(false),busy=$state(''),error=$state(''),notice=$state('');
 let stopped=false;let adapting=$state(false),adaptKind=$state('rigs'),adaptId=$state(''),adaptName=$state(''),adaptDrops=$state(false);
 function adapt(){error='';try{library.adapt(adaptKind,adaptId,adaptName,adaptDrops);}catch(e){error=e.message;}}
 const labels={rigs:'Rigs',boxes:'Containers',pouches:'Pouches',packs:'Backpacks',items:'Other items'};
 let sources=$derived([...new Set(rows.map(r=>r.source))].sort());
 let filtered=$derived(rows.filter(r=>!kind||r.kind===kind).filter(r=>!source||r.source===source).filter(r=>!status||r.status===status).filter(r=>query.toLowerCase().trim().split(/\s+/).every(word=>[library.label(r.item),r.item.id,r.item.descr,r.source,labels[r.kind]].join(' ').toLowerCase().includes(word))).sort((a,b)=>sort==='price'?(a.item.cost||0)-(b.item.cost||0):sort==='type'?a.kind.localeCompare(b.kind)||library.label(a.item).localeCompare(library.label(b.item)):library.label(a.item).localeCompare(library.label(b.item))));
 async function loadAddons(){
  loading=true;error='';
  try{
   const user=await window.Community.refresh();if(stopped)return;
   if(!user){notice='Sign in to include add-ons you downloaded or published. Your local creations and imports are shown below.';return;}
   const downloads=downloadedAddons(user),listings=new Map(downloads.filter(d=>d.listingId).map(d=>[d.listingId,{name:d.name,download:d}]));
   try{let offset=0,total=Infinity;while(offset<total&&!stopped){const result=await window.Community.request('list',{mode:'mine',offset});for(const listing of result.items)listings.set(listing.id,{...listings.get(listing.id),name:listing.name});offset+=result.items.length;total=result.total;if(!result.items.length)break;}}catch{notice='Published add-ons could not be checked. Local items and remembered downloads are still available.';}
   for(const [id,info] of listings){
    if(stopped)return;
    try{const result=await window.Community.request('pack',{id});window.ZB.validateAddon(result.pack);if(stopped)return;
     const remote=result.pack.items.filter(entry=>!rows.some(r=>r.local&&r.item.communitySource?.id===id&&r.item.communitySource.originalId===entry.item.id)).map(entry=>({...entry,id:entry.item.id,key:id+'/'+entry.kind+'/'+entry.item.id,source:result.listing.name,local:false,result,status:info.download&&info.download.revision<result.listing.revision?'Newer published version':'Published add-on'}));
     rows=[...rows,...remote];
    }catch{if(!stopped){notice='Some add-ons are unavailable online. Local working copies remain editable.';for(const item of info.download?.items||[])rows=[...rows,{kind:item.kind,id:item.id,key:id+'/'+item.id,item,source:info.name,status:'Unavailable',local:false}];}}
   }
  }catch(e){if(!stopped)error=e.message;}finally{if(!stopped)loading=false;}
 }
 onDestroy(()=>{if(!choose)library.saveFilters(scope,{query,kind,source,status,sort});});
 onMount(()=>{if(!choose&&scope==='addons')loadAddons();return()=>stopped=true;});
 async function edit(row){busy=row.key;error='';try{if(row.local)library.open(row,scope);else await library.importPack(row.result,row.kind,row.id);}catch(e){error=e.message;}finally{busy='';}}
</script>

<section class="item-library-page">
 <div class="flow-breadcrumb"><button onclick={()=>window.Site.go(choose?'editor':'editchoice')}>← {choose?'Editor':'Choose item source'}</button><span>WORKBENCH / EDIT EXISTING ITEMS</span></div>
 {#if choose}
  <div class="flow-heading"><p class="flow-kicker">CHOOSE YOUR STARTING POINT</p><h1>What would you like to edit?</h1><p>Choose an item, then work on its settings in a focused editor.</p></div>
  <div class="editor-paths">
   <button class="path-card library-choice" onclick={()=>library.choose('mod')}><div class="library-choice-art"><EquipmentDoodle kind="rigs"/><EquipmentDoodle kind="packs"/></div><div class="path-copy"><span class="fabric-label">SQUARED AWAY</span><h2>Edit mod items</h2><p>Browse the equipment included with the mod and customize your setup.</p><span class="path-action">Browse mod items →</span></div></button>
   <button class="path-card library-choice" onclick={()=>library.choose('addons')}><div class="library-choice-art"><EquipmentDoodle kind="boxes"/><EquipmentDoodle kind="pouches"/></div><div class="path-copy"><span class="fabric-label">YOUR COLLECTION</span><h2>Edit optional add-ons</h2><p>Your creations, imported items, and add-ons you have downloaded or published.</p><span class="path-action">Browse add-on items →</span></div></button>
   <button class="path-card library-choice" onclick={()=>adapting=!adapting}><div class="library-choice-art"><EquipmentDoodle kind="rigs"/><EquipmentDoodle kind="boxes"/></div><div class="path-copy"><span class="fabric-label">COMPATIBILITY PATCH</span><h2>Adapt a game or mod item</h2><p>Use an existing item's ID and artwork with Squared Away storage. Choose which other properties to replace.</p><span class="path-action">Adapt existing equipment →</span></div></button>
  </div>
  {#if adapting}<section class="card adaptation-form"><h2>Which item do you want to adapt?</h2><p>The original item must be installed. This creates a separate compatibility patch; it keeps the original ID, name, texture, price and model unless you choose to replace them.</p><div class="library-search"><label>Use it as<select bind:value={adaptKind}><option value="rigs">Chest rig</option><option value="boxes">Container</option><option value="pouches">Expansion pouch</option><option value="packs">Backpack capacity</option></select></label><label>Existing item ID<input bind:value={adaptId} placeholder="Exact section ID from the item's .ltx" spellcheck="false"/></label><label>Label in this editor<input bind:value={adaptName} placeholder="Optional recognizable name"/></label></div>{#if adaptKind==='packs'}<p class="hint">Choose an item that is already an equippable backpack. This adapter changes its inventory capacity; it does not turn arbitrary objects into backpacks.</p>{:else}<p class="hint">Use equipment items intended for conversion. The patch replaces their storage class and primary use action. Other mods' scripts may need a separate compatibility fix. Test converted rigs/containers with newly spawned items on a separate save.</p>{/if}{#if ['rigs','pouches'].includes(adaptKind)}<label><input type="checkbox" bind:checked={adaptDrops}/> Include in Squared Away NPC drops</label><p class="hint">Uses the existing rank/tier drop settings. Leave off to keep only the original mod's distribution.</p>{/if}<p class="hint">After opening the editor, use Advanced settings to choose what to take over. Use Download compatibility patch for one item, or Download adaptation package to combine several adapted items. Enable the patch below Squared Away and the source mod. Patches changing the same item still conflict.</p>{#if error}<p role="alert">{error}</p>{/if}<button class="tool primary" onclick={adapt}>Open adaptation editor</button></section>{/if}
 {:else}
  <div class="flow-heading"><p class="flow-kicker">{scope==='mod'?'SQUARED AWAY EQUIPMENT':'YOUR COLLECTION'}</p><h1>{scope==='mod'?'Edit mod items':'Edit optional add-ons'}</h1><p>{scope==='mod'?'Pick an item to change its appearance, storage, crafting or price.':'Downloaded and published add-ons open as local working copies. Your edits do not change their public listings.'}</p></div>
  {#if scope==='addons'}<button class="tool" onclick={()=>library.packageDialog()}>Download adaptation package</button>{/if}
  <div class="library-search"><label>Find an item<input type="search" bind:value={query} placeholder="Search name, description or item ID…"/></label><label>Sort by<select bind:value={sort}><option value="name">Name A–Z</option><option value="type">Item type</option><option value="price">Price: low to high</option></select></label></div>
  <div class="library-filters"><nav aria-label="Item types"><button class:chosen={!kind} onclick={()=>kind=''}>All items</button>{#each Object.entries(labels) as [id,label]}<button class:chosen={kind===id} onclick={()=>kind=id}>{label}</button>{/each}</nav><div><label>Source<select bind:value={source}><option value="">All sources</option>{#each sources as name}<option value={name}>{name}</option>{/each}</select></label><label>Changes<select bind:value={status}><option value="">All items</option>{#each [...new Set(rows.map(r=>r.status))] as value}<option>{value}</option>{/each}</select></label></div></div>
  <div class="library-count"><p role="status">{filtered.length} of {rows.length} items{loading?' · Loading your add-ons…':''}</p>{#if query||kind||source||status}<button class="flow-link" onclick={()=>{query='';kind='';source='';status='';}}>Clear filters</button>{/if}</div>
  {#if notice}<p class="library-notice">{notice}</p>{/if}{#if error}<p class="library-notice" role="alert">{error}</p>{/if}
  <div class="library-tiles">{#each filtered as row (row.kind+'/'+row.key)}<button class="library-tile" disabled={!!busy||(!row.local&&!row.result)} onclick={()=>edit(row)} aria-label={'Edit '+library.label(row.item)}><div class="library-tile-icon">{#if row.item.icon}<img src={row.item.icon} alt="" loading="lazy"/>{:else}<EquipmentDoodle kind={row.kind}/>{/if}<span>{labels[row.kind]}</span></div><div class="library-tile-copy"><strong>{library.label(row.item)}</strong><small>{row.source}</small><div><span class:customized={row.status==='Customized'}>{row.status}</span><span>{busy===row.key?'Opening…':'↗'}</span></div></div></button>{/each}</div>
  {#if !filtered.length&&!loading}<div class="library-empty"><h2>{rows.length?'No matching items.':'No add-on items here yet.'}</h2><p>{rows.length?'Try a different search or clear your filters.':'Create an item or download an add-on while signed in to include it here.'}</p>{#if !rows.length}<a class="tool" href="#addons">Browse add-ons →</a>{/if}</div>{/if}
 {/if}
</section>
