<script>
 import {onMount} from 'svelte';
 import {downloadedAddons} from '../lib/addon-downloads.mjs';
 let {item,kind,flow,changed}=$props();
 let user=$state(null),checking=$state(true),problem=$state(''),addons=$state([]),query=$state('');
 let count=$derived((item.craft||flow.recipe(kind,item)).parts.length);
 async function refresh(){checking=true;problem='';try{user=await window.Community.refresh();addons=downloadedAddons(user);}catch{user=null;addons=[];problem='Could not check your account. Try again when connected.';}finally{checking=false;}}
 onMount(()=>{refresh();const update=()=>{user=window.Community.user;addons=downloadedAddons(user);};window.addEventListener('zonebench-downloads-changed',update);window.addEventListener('zonebench-account-changed',update);return()=>{window.removeEventListener('zonebench-downloads-changed',update);window.removeEventListener('zonebench-account-changed',update);};});
 function add(addon,ingredient){if(!user||window.Community.user?.id!==user.id)return;const recipe=item.craft||flow.recipe(kind,item),parts=recipe.parts.map(x=>[...x]),existing=parts.find(x=>x[0]===ingredient.id);if(existing)existing[1]=Math.min(999,Number(existing[1])+1);else if(parts.length<4)parts.push([ingredient.id,1]);else return;item.craft={...recipe,cat:2,parts};item.recipeDependencies={...(item.recipeDependencies||{}),[ingredient.id]:{id:addon.id,name:addon.name,version:addon.version,itemName:ingredient.name}};changed();}
</script>
<section class="addon-ingredients" aria-labelledby="addon-ingredient-title">
 <span class="fabric-label">YOUR ADD-ONS</span><h3 id="addon-ingredient-title">Craft with your other gear.</h3>
 {#if checking}<p role="status">Checking your account…</p>
 {:else if problem}<p>{problem}</p><button class="flow-link" onclick={refresh}>Retry</button>
 {:else if !user}<p>Sign in or create an account to use items from your other ZoneBench add-ons as recipe ingredients.</p><button class="builder-main-action" onclick={()=>window.Site.go('account')}>Sign in / Create account</button><small>Your add-on downloads will be remembered for your account in this browser.</small>
 {:else if !addons.length}<p>No add-on downloads recorded yet.</p><small>Items from add-ons you download through ZoneBench will appear here. Browse add-ons and download an independent add-on ZIP while signed in.</small>
 {:else}<p>Choose an item from your recorded downloads. Its add-on must also be enabled in your game.</p><label>Find an add-on item<input type="search" placeholder="Search your add-ons…" bind:value={query}/></label>
 {#each addons as addon}{@const matches=addon.items.filter(x=>x.id!==item.id&&(x.name+' '+addon.name).toLowerCase().includes(query.toLowerCase()))}{#if matches.length}<div class="downloaded-addon"><h4>{addon.name} <small>{addon.version}</small></h4>{#each matches as ingredient}<button disabled={count>=4&&!item.craft?.parts.some(x=>x[0]===ingredient.id)} onclick={()=>add(addon,ingredient)}><span>{ingredient.name}</span><span>+</span></button>{/each}</div>{/if}{/each}
 <small>Recorded downloads in this browser; ZoneBench cannot check your MO2 installation.</small>
 {/if}
</section>
