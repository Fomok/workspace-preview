const {test}=require('node:test');
const assert=require('node:assert/strict');
test('moving a pocket preserves its shape, permits its old cells, and rejects overlaps and edges',async()=>{
 const {movedPocket,slotCounts}=await import('../svelte/lib/builder-layout.mjs');
 const pins=[{kind:'2x2',col:1,row:1},{kind:'3x1',col:4,row:1}];
 const moved=movedPocket(pins,0,2,2,5,6);
 assert.deepEqual(moved[0],{kind:'2x2',col:2,row:2});assert.deepEqual(slotCounts(moved),slotCounts(pins));
 assert.equal(movedPocket(pins,0,3,1,5,6),null);assert.equal(movedPocket(pins,0,5,1,5,6),null);assert.equal(movedPocket(pins,0,0,1,5,6),null);
 assert.equal(pins[0].col,1);
});
test('pouch preview expands every count with the game height-first orientation',async()=>{
 const {grantedPockets}=await import('../svelte/lib/builder-layout.mjs');
 const pockets=grantedPockets({'2x1':2,'2x2':1,'3x1':3});assert.equal(pockets.length,6);assert.equal(pockets.reduce((n,p)=>n+p.w*p.h,0),17);assert.deepEqual(pockets.find(p=>p.kind==='3x1'),{kind:'3x1',w:1,h:3});
});
test('repair selection excludes weapons, generic materials and external addon components',async()=>{
 const {armourComponents}=await import('../svelte/lib/builder-layout.mjs');
 const items=[{id:'prt_o_fabrics_2',category:'Outfit Parts'},{id:'prt_o_ballistic_20',category:'Outfit Parts'},{id:'prt_o_fake',category:'Outfit Parts'},{id:'sewing_thread',category:'Misc'},{id:'prt_w_barrel_1',category:'Weapon Parts'}];
 assert.deepEqual(armourComponents(items).map(p=>p.id),['prt_o_fabrics_2','prt_o_ballistic_20']);
});
