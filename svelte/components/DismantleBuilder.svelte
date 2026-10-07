<script>
 import ItemIdInput from './ItemIdInput.svelte';
 let manual=$state(false);
 import {onMount} from 'svelte';
 import {DATABASE,loadIngredients,searchIngredients} from '../lib/gamma-ingredients.mjs';
 let {item,changed}=$props();
 let catalog=$state([]),loading=$state(true),error=$state(''),query=$state('');
 let parts=$derived(item.yield?.length?item.yield:window.EMIT.yieldDefault(item.slots));
 let results=$derived(searchIngredients(catalog,query));
 function info(id){return catalog.find(x=>x.id===id)||{name:id.replaceAll('_',' '),icon:null};}
 function replaceId(i,id){if(parts.some((p,n)=>n!==i&&p===id))return false;item.yield=parts.map((p,n)=>n===i?id:p);changed();}
 function add(id){if(parts.includes(id))return false;item.yield=[...parts,id];changed();}
 function remove(index){if(parts.length<=1)return;item.yield=parts.filter((_,i)=>i!==index);changed();}
 async function load(){loading=true;error='';try{catalog=(await loadIngredients()).items.filter(x=>window.EMIT.KNOWN_PARTS.includes(x.id));}catch{error='The GAMMA database could not be reached. Your dismantling returns are kept.';}finally{loading=false;}}
 onMount(load);
</script>
<label class="inline-check"><input type="checkbox" bind:checked={manual}/>Enter item IDs manually</label>
{#if manual}<p class="builder-notice">Use exact section IDs from your modpack. GAMMA database names and recommendations may not apply to ZONA. IDs are checked for format only; confirm the items exist in your game.</p>{/if}
<h2>Choose what dismantling returns.</h2>
<p class="builder-notice">Each listed part is returned once. Search armour components and materials such as fasteners, plastic and scrap. Keep at least one part.</p>
<div class="recipe-selected">{#each parts as id,i}{@const part=info(id)}<div class="recipe-row"><div class="recipe-icon">{#if part.icon}<img src={part.icon} alt="" onerror={e=>e.currentTarget.style.visibility='hidden'}/>{:else}<span aria-hidden="true">◇</span>{/if}</div>{#if manual}<ItemIdInput value={id} label="Dismantling item ID" commit={value=>replaceId(i,value)}/>{:else}<span class="recipe-name">{part.name}</span>{/if}<span>× 1</span><button class="recipe-remove" aria-label={`Remove dismantling return ${part.name}`} disabled={parts.length<=1} onclick={()=>remove(i)}>×</button></div>{/each}</div>
{#if item.yield?.length}<button class="flow-link" onclick={()=>{item.yield=null;changed();}}>Restore recommended dismantling returns</button>{/if}
{#if manual}<ItemIdInput add label="Add dismantling item ID" commit={add}/>{:else}<label>Find a dismantling part<input type="search" placeholder="Search fabric, fasteners, plastic…" value={query} oninput={e=>query=e.currentTarget.value}/></label>
{#if loading}<p role="status">Loading GAMMA parts…</p>{:else if error}<p class="builder-error" role="status">{error}</p><button onclick={load}>Retry database</button>{:else}
<p class="builder-notice">{results.length} matching parts</p>
<div class="ingredient-results">{#each results as part}<button disabled={parts.includes(part.id)} onclick={()=>add(part.id)}><span class="recipe-icon"><img src={part.icon} alt="" loading="lazy" onerror={e=>e.currentTarget.style.visibility='hidden'}/></span><span><strong>{part.name}</strong><small>{part.category}</small></span><span class="ingredient-add">{parts.includes(part.id)?'Added':'Add'}</span></button>{/each}</div>
{/if}
<p class="recipe-credit">Names and icons from <a href={DATABASE} target="_blank" rel="noreferrer">GAMMA Database</a>.</p>{/if}
