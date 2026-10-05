const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
function setup(){
 const c=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Uint32Array,Blob,crypto});
 for(const f of ['src/emit.js','src/archive.js','data/baseline.js','src/compatibility.js','src/independent-addon.js'])vm.runInContext(fs.readFileSync('web/'+f,'utf8'),c);
 const seed=vm.runInContext('SEED',c),db=JSON.parse(JSON.stringify(seed));
 const r={...JSON.parse(JSON.stringify(seed.rigs[0])),id:'my_new_rig',new:true,name:'Test rig',descr:'One test rig',stash:'none'};
 db.rigs.push(r);return {...c,seed,db,r};
}
const text=f=>new TextDecoder().decode(f.bytes);
test('two offline projects have no overlapping game files or item IDs',()=>{
 const a=setup(),b=setup(),pa=a.AddonExport.plan(a.db,a.seed),pb=b.AddonExport.plan(b.db,b.seed);
 assert.equal(pa.manifest.items.length,1);assert.equal(pa.entries.length,1);
 assert(!pa.manifest.files.some(f=>pb.manifest.files.includes(f)));
 assert.notEqual(pa.manifest.items[0].id,pb.manifest.items[0].id);
 assert(pa.width<2048&&pa.height<2048);
 assert(!pa.files.some(f=>/\.script$|\/ui\//.test(f.name)));
 const system=text(pa.files.find(f=>f.name.includes('/mod_system_')));
 assert.match(system,/slot\s*=\s*15/);assert.match(system,/icons_texture\s*=\s*ui\\zonebench\\zba_/);
 assert(!system.includes('[amprig_bandolier]'));assert(system.includes('['+pa.manifest.items[0].id+']'));
 for(const r of a.seed.rigs)assert(!system.includes('['+r.id+']'));
});
test('save/reload, item rename and version updates preserve identity; duplicates get a new item ID',()=>{
 const a=setup(),p=a.AddonExport.plan(a.db,a.seed),db=JSON.parse(JSON.stringify(a.db));
 const r=db.rigs.at(-1);r.name='Renamed';r.id='renamed_source';db.independentAddon.version='1.1';
 const q=a.AddonExport.plan(db,a.seed);assert.equal(p.manifest.items[0].id,q.manifest.items[0].id);assert.equal(p.texture,q.texture);
 db.rigs.push({...r,id:'another_rig'});a.AddonExport.ensure(db,a.seed);
 assert.notEqual(r.addonItemId,db.rigs.at(-1).addonItemId);
});
test('crafting and dismantling references between new rigs are namespaced',()=>{
 const a=setup();a.db.rigs.push({...a.r,id:'second_new_rig',craft:{kit:1,book:'recipe_basic_1',parts:[['my_new_rig',1]]},parts:['my_new_rig']});
 const p=a.AddonExport.plan(a.db,a.seed),id=p.manifest.items[0].id;
 const craft=text(p.files.find(f=>f.name.includes('/mod_craft_')));
 assert(craft.includes(id));assert(!craft.includes('my_new_rig'));
 const parts=text(p.files.find(f=>f.name.includes('/mod_parts_')));assert(parts.includes(id));assert(!parts.includes('my_new_rig'));
 a.db.independentAddon.excluded=[a.r.addonItemId];assert.throws(()=>a.AddonExport.plan(a.db,a.seed),/Select the custom rig/);
});
test('existing-item edits alone cannot produce an independent add-on',()=>{
 const a=setup();a.db.rigs.pop();a.db.rigs[0].cost=999;assert.throws(()=>a.AddonExport.plan(a.db,a.seed),/at least one new rig/);
});
test('new localized text and selected traders contain only the new item',()=>{
 const a=setup();a.r.name='Rig & test';const shelf=Object.keys(a.EMIT.SHELF_FILES)[0];a.r.shelves={[shelf]:{count:2,chance:50}};
 const p=a.AddonExport.plan(a.db,a.seed),id=p.manifest.items[0].id;
 for(const f of p.files.filter(f=>f.name.endsWith('.xml'))){const xml=a.BUILD.decodeStringTable(f.bytes);assert(xml.includes('Rig &amp; test'));assert(xml.includes('st_'+id+'_name'));assert(!xml.includes('st_amprig_bandolier_name'));}
 const trader=p.files.find(f=>f.name.includes('/trade/'));assert(text(trader).includes(id+' = 2, 0.5'));
});
