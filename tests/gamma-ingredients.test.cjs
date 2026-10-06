const {test}=require('node:test');
const assert=require('node:assert/strict');
test('GAMMA ingredient names resolve translations and search uses names and categories',async()=>{
 const {normalizeIngredients,searchIngredients}=await import('../svelte/lib/gamma-ingredients.mjs');
 const items=normalizeIngredients([{id:'sewing_thread',name:'st_thread',category:'Materials'},{id:'sewing_thread',name:'duplicate'},{id:'dummy',name:"don't spawn, dummy"},{id:'../unsafe',name:'Unsafe'}],{en:{st_thread:'Sewing Thread'}});
 assert.equal(items.length,1);assert.equal(items[0].name,'Sewing Thread');assert.equal(searchIngredients(items,'sewing','Materials').length,1);assert.equal(searchIngredients(items,'sewing','Ammo').length,0);
 assert.equal(items[0].icon,'https://stalker-gamma-db.com/img/icons/sewing_thread.png');
});
test('unavailable database falls back to saved ingredient list',async()=>{
 const {loadIngredients}=await import('../svelte/lib/gamma-ingredients.mjs?offline');
 const items=[{id:'sewing_thread',name:'Sewing Thread'}];
 const result=await loadIngredients({fetcher:async()=>{throw Error('offline');},storage:{getItem:()=>JSON.stringify({saved:0,items})}});
 assert.equal(result.offline,true);assert.deepEqual(result.items,items);
});
test('database errors allow retry and do not replace saved data',async()=>{
 const {loadIngredients}=await import('../svelte/lib/gamma-ingredients.mjs?retry');let writes=0;
 const storage={getItem:()=>null,setItem:()=>writes++};
 await assert.rejects(loadIngredients({fetcher:async()=>({ok:false}),storage}));assert.equal(writes,0);
 const result=await loadIngredients({fetcher:async url=>({ok:true,json:async()=>url.endsWith('index.json')?[{id:'thread',name:'st_thread'}]:{en:{st_thread:'Thread'}}}),storage});
 assert.equal(result.items[0].name,'Thread');assert.equal(writes,1);
});
