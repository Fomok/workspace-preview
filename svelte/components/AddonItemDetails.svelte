<script>
 import {onMount,untrack} from 'svelte';
 import AddonCover from './AddonCover.svelte';
 import {loadIngredients} from '../lib/gamma-ingredients.mjs';
 let {entry,pack,closed}=$props();
 const item=untrack(()=>entry.item);
 let names=$state([]);
 const recipe=untrack(()=>item.craft?.parts?.length?item.craft:entry.kind==='rigs'?window.EMIT.rigRecipe(item):entry.kind==='pouches'?window.EMIT.pouchCraftOf(item):null);
 const labels={rigs:'Chest rig',boxes:'Container',pouches:'Expansion pouch',packs:'Backpack',items:'Item'};
 function name(id){return names.find(x=>x.id===id)?.name||pack.items.find(x=>x.item.id===id)?.item.name||id.replaceAll('_',' ');}
 function modal(node){node.showModal();return {destroy(){node.close();}};}
 function layout(node){node.appendChild(window.AddonPreview.layoutView(entry));}
 onMount(()=>{loadIngredients().then(data=>names=data.items).catch(()=>{});});
 const settings=Object.fromEntries(Object.entries(item).filter(([k])=>!['icon','fit','builderAddonId','builderStep','builderStage','addonItemId','communitySource'].includes(k)));
</script>
<dialog class="gear-detail gear-item-detail" aria-label={item.name} use:modal oncancel={closed}><header><span>ITEM DETAILS / {labels[entry.kind]}</span><button onclick={closed}>← Back to add-on</button></header><div class="gear-detail-body"><div class="gear-detail-title"><AddonCover entries={[entry]}/><div><h2>{item.name||item.id}</h2><p>{item.descr||'No description supplied.'}</p><div class="gear-facts"><span><small>PRICE</small>{Number(item.cost||0).toLocaleString()} RU</span><span><small>WEIGHT</small>{item.weight??'—'} kg</span><span><small>ITEM SIZE</small>{item.cellw||1} × {item.cellh||1}</span></div></div></div>
{#if ['rigs','boxes','pouches'].includes(entry.kind)}<div class="gear-layout-preview" use:layout></div>{:else if entry.kind==='packs'}<h3>Backpack storage</h3><p>{item.size?.split('x').reverse().join(' × ')} cells</p>{/if}
{#if item.takes}<h3>Allowed contents</h3><p class="gear-muted">{item.takes.replaceAll('_',' ')}{item.kg?` · Up to ${item.kg} kg`:''}</p>{/if}
<h3>Crafting</h3>{#if recipe}<p class="gear-muted">{['','Basic toolkit','Advanced toolkit','Expert toolkit'][recipe.kit]||'Toolkit'} · {name(recipe.book)}</p><div class="gear-recipe">{#each recipe.parts as [id,count]}<div><span>{name(id)}</span><strong>× {count}</strong></div>{/each}</div>{:else}<p class="gear-muted">No crafting recipe supplied.</p>{/if}
{#if item.shelves&&Object.keys(item.shelves).length}<h3>Sold by</h3><div class="gear-recipe">{#each Object.entries(item.shelves) as [id,stock]}<div><span>{{general:'Sidorovich & faction traders',medic:'Medics',mechanic:'Mechanics',ecolog:'Ecologists',food:'Barmen & butcher'}[id]||id}</span><span>{stock.count} in stock · {stock.chance}% chance</span></div>{/each}</div>{/if}
{#if item.parts?.length}<h3>Replaceable armour components</h3><p class="gear-muted">{item.parts.map(name).join(' · ')}</p>{/if}
<details class="gear-technical"><summary>All supplied settings</summary><pre>{JSON.stringify(settings,null,2)}</pre></details></div></dialog>
