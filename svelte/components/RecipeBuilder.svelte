<script>
 import ItemIdInput from './ItemIdInput.svelte';
 let manual=$state(false);
 import {onMount} from 'svelte';
 import {DATABASE,loadIngredients,searchIngredients} from '../lib/gamma-ingredients.mjs';
 let {item,kind,flow,changed}=$props();
 let catalog=$state([]),loading=$state(true),loadError=$state(''),query=$state(''),category=$state(''),offline=$state(false);
 let automatic=$derived(kind==='rigs'||kind==='pouches');
 let recipe=$derived(item.craft||flow.recipe(kind,item));
 let enabled=$derived(automatic||!!item.craft);
 let results=$derived(searchIngredients(catalog,query,category));
 let categories=$derived([...new Set(catalog.map(x=>x.category))].sort());
 function info(id){if(item.recipeDependencies?.[id])return {id,name:item.recipeDependencies[id].itemName,icon:null};return catalog.find(x=>x.id===id)||flow.ingredient(id)||{id,name:id.replaceAll('_',' '),icon:null};}
 function commit(value){item.craft=value;changed();}
 function update(key,value){commit({...recipe,cat:recipe.cat??2,parts:recipe.parts.map(x=>[...x]),[key]:value});}
 function replaceId(i,id){if(id===item.id||recipe.parts.some((p,n)=>n!==i&&p[0]===id))return false;const parts=recipe.parts.map(x=>[...x]);const old=parts[i][0];parts[i][0]=id;if(item.recipeDependencies){item.recipeDependencies={...item.recipeDependencies};delete item.recipeDependencies[old];}update('parts',parts);}
 function add(id){if(id===item.id)return false;const parts=recipe.parts.map(x=>[...x]),existing=parts.find(x=>x[0]===id);if(existing)existing[1]=Math.min(999,Number(existing[1])+1);else if(parts.length<4)parts.push([id,1]);update('parts',parts);}
 function count(i,value){const parts=recipe.parts.map(x=>[...x]);parts[i][1]=Math.max(1,Math.min(999,Math.round(Number(value)||1)));update('parts',parts);}
 function remove(i){if(automatic&&recipe.parts.length===1)return;update('parts',recipe.parts.filter((_,n)=>n!==i));}
 async function load(){loading=true;loadError='';try{const data=await loadIngredients();catalog=data.items;offline=!!data.offline;}catch{loadError='The GAMMA database could not be reached. Your recipe is kept. Retry when you are online.';}finally{loading=false;}}
 onMount(load);
</script>
<label class="inline-check"><input type="checkbox" bind:checked={manual}/>Enter item IDs manually</label>
{#if manual}<p class="builder-notice">Use exact section IDs from your modpack. GAMMA database names and recommendations may not apply to ZONA. IDs are checked for format only; confirm the items exist in your game.</p>{/if}
<h2>Choose what it takes to craft.</h2>
<p class="builder-notice">Pick ingredients by name, then set their quantities. Up to four different ingredients are supported.</p>
{#if !automatic}<label class="inline-check"><input type="checkbox" checked={enabled} onchange={e=>commit(e.currentTarget.checked?{kit:1,book:'recipe_basic_0',cat:recipe.cat??2,parts:[['sewing_thread',4]]}:null)}/>Make this item craftable</label>{/if}
{#if enabled}
 <div class="two-fields"><label>Required toolkit<select value={String(recipe.kit)} onchange={e=>update('kit',Number(e.currentTarget.value))}><option value="1">Basic toolkit</option><option value="2">Advanced toolkit</option><option value="3">Expert toolkit</option></select></label>{#if manual}<ItemIdInput value={recipe.book} label="Recipe book ID" commit={id=>update('book',id)}/>{:else}<label>Required recipe book<select value={recipe.book} onchange={e=>update('book',e.currentTarget.value)}>{#if !['recipe_basic_0','recipe_basic_1','recipe_advanced_1'].includes(recipe.book)}<option value={recipe.book}>{recipe.book}</option>{/if}{#each ['recipe_basic_0','recipe_basic_1','recipe_advanced_1'] as id,i}<option value={id}>{catalog.find(x=>x.id===id)?.name||['Basic recipes — first book','Basic recipes — second book','Advanced recipes'][i]}</option>{/each}</select></label>{/if}</div>
 <div class="recipe-heading"><h3>Ingredients</h3><span>{recipe.parts.length} / 4</span></div>
 <div class="recipe-selected">{#each recipe.parts as [id,quantity],i}{@const part=info(id)}<div class="recipe-row"><div class="recipe-icon">{#if part.icon}<img src={part.icon} alt="" onerror={e=>e.currentTarget.style.visibility='hidden'}/>{:else}<span aria-hidden="true">◇</span>{/if}</div>{#if manual}<ItemIdInput value={id} label="Ingredient ID" commit={value=>replaceId(i,value)}/>{:else}<span class="recipe-name">{part.name}</span>{/if}<label>Quantity<input aria-label={`Quantity of ${part.name}`} type="number" min="1" max="999" value={quantity} oninput={e=>count(i,e.currentTarget.value)}/></label><button class="recipe-remove" aria-label={`Remove ${part.name}`} disabled={automatic&&recipe.parts.length===1} onclick={()=>remove(i)}>×</button></div>{/each}</div>
 {#if automatic}<p class="builder-notice">{item.craft?'Custom recipe.':'Recommended recipe based on your item.'} Keep at least one ingredient.</p>{#if item.craft}<button class="flow-link" onclick={()=>commit(null)}>Restore recommended recipe</button>{/if}{:else if !recipe.parts.length}<p class="builder-notice">Add an ingredient to include a crafting recipe.</p>{/if}
 {#if manual}<ItemIdInput add label="Add ingredient ID" disabled={recipe.parts.length>=4} commit={add}/>{:else}
 <div class="recipe-search"><label>Find an ingredient<input type="search" placeholder="Search thread, fabric, pouch…" value={query} oninput={e=>query=e.currentTarget.value}/></label><label>Category<select value={category} onchange={e=>category=e.currentTarget.value}><option value="">All categories</option>{#each categories as c}<option value={c}>{c}</option>{/each}</select></label></div>
 {#if loading}<p class="builder-notice" role="status">Loading GAMMA database…</p>{:else if loadError}<p class="builder-error" role="status">{loadError}</p><button class="flow-link" onclick={load}>Retry database</button>{:else}
 <p class="builder-notice">{results.length} matches{results.length>40?' · Showing the first 40. Narrow your search.':''}{recipe.parts.length===4?' · Remove an ingredient to choose a different one.':''}</p>
 <div class="ingredient-results">{#each results.slice(0,40) as part}<button disabled={part.id===item.id||(recipe.parts.length>=4&&!recipe.parts.some(x=>x[0]===part.id))} onclick={()=>add(part.id)}><span class="recipe-icon"><img src={part.icon} alt="" loading="lazy" onerror={e=>e.currentTarget.style.visibility='hidden'}/></span><span><strong>{part.name}</strong><small>{part.category}</small></span><span class="ingredient-add">{recipe.parts.some(x=>x[0]===part.id)?'+1':'Add'}</span></button>{/each}</div>
 {/if}
 {/if}
{/if}
{#if !manual}<p class="recipe-credit">Item names and icons from <a href={DATABASE} target="_blank" rel="noreferrer">GAMMA Database</a> · GAMMA 0.9.5{offline?' · Using the saved item list':''}.</p>{/if}
