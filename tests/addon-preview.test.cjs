const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync('web/src/addon-preview.js','utf8'),context);
const preview=context.AddonPreview;
test('cover shows at most four actual pack entries without changing their order or contents',()=>{
 const pack={items:Array.from({length:6},(_,i)=>({kind:i<2?'rigs':'boxes',item:{id:'item_'+i,name:'Item '+i}}))};
 const before=JSON.stringify(pack);assert.deepEqual(preview.coverItems(pack),pack.items.slice(0,4));assert.equal(JSON.stringify(pack),before);
 assert.equal(preview.coverItems({items:pack.items.slice(0,1)}).length,1);
});
test('rig preview follows one-based pins and height-first legacy shape names',()=>{
 const entry={kind:'rigs',item:{pins:[{kind:'3x1',col:2,row:1},{kind:'2x2',col:4,row:2}]}};
 const before=JSON.stringify(entry);const g=JSON.parse(JSON.stringify(preview.geometry(entry)));
 assert.deepEqual(g.rects,[{x:1,y:0,w:1,h:3},{x:3,y:1,w:2,h:2}]);assert.equal(g.width,5);assert.equal(g.height,3);assert.equal(g.automatic,false);assert.equal(JSON.stringify(entry),before);
});
test('container preview preserves separated pockets and rectangular storage',()=>{
 const g=preview.geometry({kind:'boxes',item:{inw:5,inh:3,slots:[{c:1,r:1,w:1,h:2},{c:3,r:2,w:3,h:2}]}});
 assert.equal(g.width,5);assert.equal(g.height,3);assert.equal(g.rects[1].x,2);assert.equal(g.rects[1].y,1);
 const rectangle=preview.geometry({kind:'boxes',item:{inw:4,inh:3,slots:[]}});assert.equal(rectangle.rects.length,1);assert.equal(rectangle.rects[0].w,4);
});
test('automatic rig and pouch layouts are marked as illustrative and malformed boxes are bounded',()=>{
 const g=preview.geometry({kind:'pouches',item:{grants:{'3x1':2,'2x2':1}}});assert.equal(g.automatic,true);assert.equal(g.rects.length,3);assert.equal(g.rects[0].h,3);assert.equal(g.rects[0].w,1);
 const invalid=preview.geometry({kind:'boxes',item:{slots:[{c:1,r:1,w:1e9,h:1},{c:'bad',r:1,w:2,h:2}]}});assert.equal(invalid.rects.length,0);
});
