<script>
 import ItemIdInput from './ItemIdInput.svelte';
 let manual=$state(false);
 import {onMount} from 'svelte';
 import {loadIngredients,DATABASE,searchIngredients} from '../lib/gamma-ingredients.mjs';
 import {armourComponents} from '../lib/builder-layout.mjs';
 let {item,flow,changed}=$props();
 let catalog=$state([]),loading=$state(true),error=$state(''),query=$state('');
 let parts=$derived(item.parts?.length?item.parts:flow.repairDefaults(item).parts);
 let results=$derived(searchIngredients(catalog,query));
 const types=[['outfit_novice','Novice armour'],['outfit_light','Light armour'],['outfit_medium','Medium armour'],['outfit_heavy','Heavy armour'],['outfit_exo','Exoskeleton']];
 function replaceId(i,id){if(parts.some((p,n)=>n!==i&&p===id))return false;item.parts=parts.map((p,n)=>n===i?id:p);changed();}
 function add(id){if(parts.length>=6||parts.includes(id))return false;item.parts=[...parts,id];changed();}
 function remove(id){if(parts.length<=1)return;item.parts=parts.filter(x=>x!==id);changed();}
 async function load(){loading=true;error='';try{catalog=armourComponents((await loadIngredients()).items);}catch{error='The GAMMA database could not be reached. Existing repair settings are kept.';}finally{loading=false;}}
 onMount(load);
</script>
<label class="inline-check"><input type="checkbox" bind:checked={manual}/>Enter item IDs manually</label>
{#if manual}<p class="builder-notice">Use exact section IDs from your modpack. GAMMA database names and recommendations may not apply to ZONA. IDs are checked for format only; confirm the items exist in your game.</p>{/if}
<h2>Choose how the rig is repaired.</h2><p>Pick the armour components players can replace at a workbench. These are repair parts, separate from the crafting recipe.</p>
<div class="two-fields">{#if manual}<ItemIdInput value={item.repair||'outfit_light'} label="Repair kit type ID" commit={id=>{item.repair=id;changed();}}/>{:else}<label>Compatible armour repair kits<select value={item.repair||'outfit_light'} onchange={e=>{item.repair=e.currentTarget.value;changed();}}>{#if item.repair&&!types.some(t=>t[0]===item.repair)}<option value={item.repair}>{item.repair}</option>{/if}{#each types as [id,name]}<option value={id}>{name}</option>{/each}</select></label>{/if}<label>Condition restored per part (%)<input type="number" min="0" max="100" value={Math.round((item.repairBonus??flow.repairDefaults(item).bonus)*100)} oninput={e=>{item.repairBonus=Math.max(0,Math.min(100,Number(e.currentTarget.value)||0))/100;changed();}}/></label></div>
<p class="builder-notice">The repair kit's own restrictions still apply. Light armour is the standard choice for Squared Away rigs.</p>
<div class="recipe-heading"><h3>Replaceable components</h3><span>{parts.length} / 6</span></div>
<div class="recipe-selected">{#each parts as id,i}{@const part=catalog.find(x=>x.id===id)}<div class="recipe-row"><div class="recipe-icon">{#if part}<img src={part.icon} alt=""/>{/if}</div>{#if manual}<ItemIdInput value={id} label="Repair part ID" commit={value=>replaceId(i,value)}/>{:else}<span class="recipe-name">{part?.name||id.replaceAll('_',' ')}</span>{/if}<button class="recipe-remove" aria-label={`Remove repair part ${part?.name||id}`} disabled={parts.length<=1} onclick={()=>remove(id)}>×</button></div>{/each}</div>
<p class="builder-notice">One of each component, up to six different parts. Keep at least one.</p>
{#if item.parts?.length}<button class="flow-link" onclick={()=>{item.parts=null;changed();}}>Restore recommended components</button>{/if}
{#if manual}<ItemIdInput add label="Add repair part ID" disabled={parts.length>=6} commit={add}/>{:else}<label>Find an armour component<input type="search" placeholder="Search fabric, plate…" value={query} oninput={e=>query=e.currentTarget.value}/></label>
{#if loading}<p role="status">Loading GAMMA armour components…</p>{:else if error}<p class="builder-error">{error}</p><button onclick={load}>Retry database</button>{:else}<div class="ingredient-results">{#each results as part}<button disabled={parts.includes(part.id)||parts.length>=6} onclick={()=>add(part.id)}><span class="recipe-icon"><img src={part.icon} alt="" loading="lazy"/></span><span><strong>{part.name}</strong><small>Armour component</small></span><span class="ingredient-add">{parts.includes(part.id)?'Added':'Add'}</span></button>{/each}</div>{/if}
<p class="recipe-credit">Armour components from <a href={DATABASE} target="_blank" rel="noreferrer">GAMMA Database</a>. Add-on items are not offered in this step.</p>{/if}
