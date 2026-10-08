const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(kind,own={}){const c=vm.createContext({console,TextEncoder,TextDecoder,Uint8Array,Uint32Array,Blob,crypto});for(const f of ['src/emit.js','src/archive.js','data/baseline.js','src/compatibility.js','src/independent-addon.js','src/adaptation-export.js'])vm.runInContext(fs.readFileSync('web/'+f,'utf8'),c);const seed=vm.runInContext('SEED',c),db=JSON.parse(JSON.stringify(seed));let item=JSON.parse(JSON.stringify(kind==='packs'?{size:'10x7',cellw:2,cellh:3}:seed[kind][0]));Object.assign(item,{id:'external_item',name:'External gear',adopt:true,own});delete item.newItem;db[kind]=[item];return {c,seed,db,item,plan:()=>c.AdaptationExport.plan(db,seed,kind,item)};}
const texts=p=>p.files.map(f=>new TextDecoder().decode(f.bytes)).join('\n');
test('adapted rigs keep original identity and picture while adding current engine storage',()=>{const a=setup('rigs'),p=a.plan(),s=texts(p);assert.match(s,/!\[external_item\]/);assert.match(s,/class = II_CONTR/);assert.match(s,/slot = 15/);assert(!s.includes('icons_texture'));assert(!s.includes('inv_name'));assert(!p.files.some(f=>f.name.includes('mod_sqa_addons')));assert.equal(p.manifest.sourceSection,'external_item');assert.deepEqual(a.plan().manifest.files,p.manifest.files);});
test('NPC drop registration is explicit, isolated and supports rigs and pouches',()=>{for(const kind of ['rigs','pouches']){const a=setup(kind,{drops:true}),p=a.plan();assert(p.files.some(f=>f.name.includes('mod_sqa_addons')));assert.match(texts(p),new RegExp('!\\['+kind+'\\]'));const b=setup(kind,{drops:true}).plan();assert(!p.files.some(f=>b.files.some(g=>f.name===g.name)));}});
test('container compartments are exported as container geometry, never mistaken for rig slots',()=>{const a=setup('boxes');Object.assign(a.item,{slots:[{c:1,r:1,w:2,h:2}],inw:3,inh:3,takes:'any'});const s=texts(a.plan());assert.match(s,/amp_box_slots = 1,1,2,2/);assert.match(s,/amp_rig = false/);assert.match(s,/class = II_CONTR/);assert(!s.includes('amp_slot_'));assert.match(s,/unrestricted/);});
test('backpack adoption only overrides chosen capacity and leaves its class and icon intact',()=>{const a=setup('packs',{size:true}),p=a.plan();assert.equal(p.files.length,1);assert.match(texts(p),/external_item = 10x7/);assert(!texts(p).includes('class'));});
test('owned name, price, crafting and repair produce explicit separate overrides',()=>{const a=setup('rigs',{name:true,price:true,craft:true,repair:true});a.item.descr='Adapted rig';const p=a.plan(),s=texts(p);assert.match(s,/inv_name = st_external_item_name/);assert.match(s,/cost =/);assert(p.files.some(f=>f.name.includes('mod_craft')));assert(p.files.some(f=>f.name.includes('mod_parts')));assert.equal(p.files.filter(f=>f.name.endsWith('.xml')).length,4);});
test('invalid IDs and overlapping layouts are rejected before download',()=>{const a=setup('rigs');a.item.id='bad]\n[section';assert.throws(a.plan,/section ID/);a.item.id='external_item';a.item.band=3;a.item.slots={'2x2':2};a.item.pins=[{kind:'2x2',col:1,row:1},{kind:'2x2',col:1,row:1}];assert.throws(a.plan,/overlap/);});

test('mixed adaptation package preserves IDs and combines isolated files for all four types',async()=>{
 const a=setup('rigs',{drops:true}),selected=[{kind:'rigs',item:a.item}];
 for(const kind of ['boxes','pouches','packs']){const b=setup(kind,kind==='packs'?{size:true}:{});b.item.id='external_'+kind;a.db[kind]=[b.item];selected.push({kind,item:b.item});}
 const p=a.c.AdaptationExport.packagePlan(a.db,a.seed,selected,{name:'ZONA gear',version:'1.2'});
 assert.equal(p.manifest.items.length,4);assert.equal(new Set(p.manifest.files).size,p.manifest.files.length);
 assert.deepEqual(Array.from(p.manifest.items,x=>x.sourceSection),selected.map(x=>x.item.id));
 const built=await a.c.AdaptationExport.buildPackage(a.db,a.seed,selected,{name:'ZONA gear',version:'1.2'});
 assert((await built.blob).size>0);assert.equal(built.manifest.name,'ZONA gear');
 const subset=a.c.AdaptationExport.packagePlan(a.db,a.seed,[selected[3]],{name:'Packs only',version:'1'});assert.equal(subset.manifest.items.length,1);assert(subset.manifest.files.every(x=>x.includes('grid_packs')));
});
test('package rejects empty selection, duplicate entries and colliding adaptation identities',()=>{
 const a=setup('rigs'),entry={kind:'rigs',item:a.item},opts={name:'Gear',version:'1'};
 assert.throws(()=>a.c.AdaptationExport.packagePlan(a.db,a.seed,[],opts),/Select/);
 assert.throws(()=>a.c.AdaptationExport.packagePlan(a.db,a.seed,[entry,entry],opts),/same source/);
 const b=setup('pouches');b.item.id='other_pouch';b.item.adaptationId=a.item.adaptationId;a.db.pouches=[b.item];
 assert.throws(()=>a.c.AdaptationExport.packagePlan(a.db,a.seed,[entry,{kind:'pouches',item:b.item}],opts),/same file identity/);
});
test('focused review and validation stay in dialogs and package control is available',()=>{
 const view=fs.readFileSync('web/src/editor-view.js','utf8'),library=fs.readFileSync('web/src/editor-library.js','utf8');
 assert(view.includes('EditorLibrary.inspect(tab)'));assert(!view.includes('button.onclick=()=>Site.go(tab)'));
 assert(view.includes('EditorLibrary.packageDialog()'));assert(library.includes("d.showModal()"));
});
