const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){
 const c=vm.createContext({console,crypto,TextEncoder,TextDecoder,Uint8Array,Uint32Array,Blob});
 for(const f of ['emit','archive','compatibility'])vm.runInContext(fs.readFileSync('web/src/'+f+'.js','utf8'),c);
 vm.runInContext(fs.readFileSync('web/data/baseline.js','utf8'),c);
 vm.runInContext(fs.readFileSync('web/src/independent-addon.js','utf8'),c);
 vm.runInContext(`var DB=JSON.parse(JSON.stringify(SEED)),SEL={},Site={go:()=>{}},render=()=>{},flushKeep=async()=>{};DB.packs=[];function touch(){AddonExport.ensure(DB,SEED);}function uniqueId(prefix){return prefix+crypto.randomUUID().replaceAll('-','');}`,c);
 const source=fs.readFileSync('web/src/editor.js','utf8'),start=source.indexOf('function addItem('),end=source.indexOf('\nfunction ',start+1);
 vm.runInContext(source.slice(start,end),c);
 vm.runInContext(fs.readFileSync('web/src/editor-flow.js','utf8'),c);
 return c;
}
test('guided builder creates all four types with separate persistent export identities',()=>{
 const c=setup(),files=[];
 for(const kind of ['rigs','boxes','pouches','packs']){
  c.EditorFlow.create(kind);const draft=c.EditorFlow.current();
  draft.item.icon=vm.runInContext('SEED.rigs[0].icon',c);draft.item.name='Test '+kind;
  c.EditorFlow.save(draft.item);const result=c.EditorFlow.review();assert(result.ok,result.error);
  assert(!result.files.some(f=>files.includes(f)));files.push(...result.files);
  const original=draft.item.addonItemId;c.EditorFlow.save({...draft.item,id:'unsafe',addonItemId:crypto.randomUUID()});
  assert.equal(c.EditorFlow.current().item.addonItemId,original);
  c.EditorFlow.open(kind,original);assert.deepEqual(c.EditorFlow.review().files,result.files);
 }
 assert.equal(c.EditorFlow.drafts().length,4);
});
test('missing drafts fail clearly and empty descriptions remain exportable',()=>{
 const c=setup();c.EditorFlow.select('rigs',crypto.randomUUID());assert.equal(c.EditorFlow.current(),null);assert.equal(c.EditorFlow.review().ok,false);
 c.EditorFlow.create('boxes');const d=c.EditorFlow.current();d.item.icon=vm.runInContext('SEED.boxes[0].icon',c);d.item.descr='';c.EditorFlow.save(d.item);assert.equal(c.EditorFlow.review().ok,true);
});
test('recipes selected in the builder export exact ingredient IDs and quantities for every type',()=>{
 for(const kind of ['rigs','pouches','boxes','packs']){
  const c=setup();c.EditorFlow.create(kind);const draft=c.EditorFlow.current();
  draft.item.icon=vm.runInContext('SEED.rigs[0].icon',c);
  draft.item.craft={kit:2,book:'recipe_basic_1',cat:2,parts:[['sewing_thread',7],['prt_i_plastic',3]]};
  c.EditorFlow.save(draft.item);
  const plan=vm.runInContext('AddonExport.plan(DB,SEED)',c);
  const file=plan.files.find(x=>x.name.includes('/mod_craft_'));
  assert.match(new TextDecoder().decode(file.bytes),/2, recipe_basic_1,sewing_thread,7,prt_i_plastic,3/);
  draft.item.craft.parts.push(['duct_tape',1],['prt_i_buckles',2],['leather_part',1]);c.EditorFlow.save(draft.item);
  assert.equal(c.EditorFlow.review().ok,false);
 }
});

