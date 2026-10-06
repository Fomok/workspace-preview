<script>
 let {item,changed}=$props();
 const sellers=[['general','Sidorovich & faction traders'],['medic','Medics'],['ecolog','Sakharov & Hermann'],['mechanic','Mechanics'],['food','Barmen & the butcher']];
 function toggle(key,on){const shelves={...item.shelves};if(on)shelves[key]={count:1,chance:100};else delete shelves[key];item.shelves=shelves;changed();}
 function value(key,field,n){item.shelves[key][field]=Math.max(field==='count'?1:0,Math.min(field==='count'?999:100,Math.round(Number(n)||0)));changed();}
</script>
<h2>Choose where it is sold.</h2><p>Enable the trader groups that should stock this item. Leave them all off for an item that cannot be bought from traders.</p>
<div class="trader-cards">{#each sellers as [id,name]}<div class="trader-card"><label class="inline-check"><input type="checkbox" checked={!!item.shelves?.[id]} onchange={e=>toggle(id,e.currentTarget.checked)}/>{name}</label>{#if item.shelves?.[id]}<div class="two-fields"><label>Stock quantity<input aria-label={`${name} stock quantity`} type="number" min="1" max="999" value={item.shelves[id].count} oninput={e=>value(id,'count',e.currentTarget.value)}/></label><label>Restock chance (%)<input aria-label={`${name} restock chance`} type="number" min="0" max="100" value={item.shelves[id].chance} oninput={e=>value(id,'chance',e.currentTarget.value)}/></label></div>{/if}</div>{/each}</div>
<p class="builder-notice">Availability follows the trader's restock cycle. Your item price is set in Details.</p>
