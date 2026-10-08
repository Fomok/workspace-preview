const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){
 const c=vm.createContext({console,crypto,TextEncoder,TextDecoder,Blob,Uint8Array,Uint32Array});
 for(const file of ['emit','archive'])vm.runInContext(fs.readFileSync('web/src/'+file+'.js','utf8'),c);
 vm.runInContext(fs.readFileSync('web/data/baseline.js','utf8'),c);
 for(const file of ['compatibility','independent-addon','adaptation-export'])vm.runInContext(fs.readFileSync('web/src/'+file+'.js','utf8'),c);
 const seed=vm.runInContext('SEED',c),db=JSON.parse(JSON.stringify(seed));db.packs=[];db.items=[];
 Object.assign(c,{DB:db,SEL:{},touch(){},Site:{go(){}},Workbench:{status:()=> 'Custom',record(){},isBaseline:(kind,id)=>(seed[kind]||[]).some(x=>x.id===id),baseline:(kind,id)=>JSON.parse(JSON.stringify((seed[kind]||[]).find(x=>x.id===id)||{})),differences:(a,b)=>Object.keys(b).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).map(key=>({key,before:a[key],after:b[key]}))}});
 c.AddonExport.ensure(db,seed);
 for(const file of ['editor-library','library-workflow'])vm.runInContext(fs.readFileSync('web/src/'+file+'.js','utf8'),c);
 function rig(id){const item=JSON.parse(JSON.stringify(seed.rigs[0]));Object.assign(item,{id,new:true,adopt:true,adaptationId:crypto.randomUUID(),adaptationSaved:false,own:{},libraryDraft:true});db.rigs.push(item);return {kind:'rigs',item,local:true,key:id};}
 return {c,db,seed,w:c.LibraryWorkflow,l:c.EditorLibrary,rig};
}
test('drafts must be saved; edits require saving again without being lost',()=>{
 const {w,rig}=setup(),row=rig('zona_test'),opts=w.options('adaptations');
 assert.equal(w.state(row),'Draft');assert.throws(()=>w.review([row],opts),/Save/);
 w.save(row,false);assert.equal(w.state(row),'Saved');assert(w.review([row],opts).files.length);
 row.item.cost+=1;assert.equal(w.state(row),'Unsaved changes');assert.throws(()=>w.review([row],opts),/Save/);
 w.save(row,false);assert.equal(w.state(row),'Saved');
});
test('saved packages retain identity and report changed or missing selected items',()=>{
 const {w,rig,db}=setup(),row=rig('zona_one');w.save(row,false);let p=w.savePackage([row],w.options('adaptations'));
 p.exported={[row.kind+'/'+row.key]:w.signature(row.item)};p.exportedVersion=p.version;p.exportedName=p.name;assert.equal(w.packageStatus(p),'Up to date');
 row.item.weight+=1;assert.equal(w.packageStatus(p),'Items changed');w.save(row,false);
 const id=p.id;p=w.savePackage([row],{...p,version:'1.1'});assert.equal(p.id,id);assert.equal(db.savedLibraryPackages.length,1);
 w.remove(row);assert.equal(w.packageStatus(p),'Missing items');w.undoRemoval();assert.notEqual(w.packageStatus(p),'Missing items');
});
test('removing a saved mod edit restores baseline, makes package missing, and Undo restores only that edit',()=>{
 const {w,db}=setup(),row={kind:'rigs',item:db.rigs[0],local:true};const original=row.item.cost;row.item.cost+=100;w.save(row,false);
 const p=w.savePackage([row],w.options('addons'));w.remove(row);assert.equal(db.rigs[0].cost,original);assert.equal(w.packageStatus(p),'Missing items');
 db.rigs[1].cost+=50;const unrelated=db.rigs[1].cost;w.undoRemoval();assert.equal(db.rigs[0].cost,original+100);assert.equal(db.rigs[1].cost,unrelated);
});
test('review is scoped to selection and accepts detached UI row wrappers',async()=>{
 const {w,rig,db}=setup(),good=rig('zona_good'),bad=rig('zona_bad');w.save(good,false);bad.item.id='invalid section';
 const wrapped=JSON.parse(JSON.stringify(good)),rows=await w.prepare([wrapped]);assert.equal(rows[0].item,good.item);assert(w.review([wrapped],w.options('adaptations')).files.length);
 assert.equal(db.savedLibraryPackages,undefined);
});
test('dependency warning finds custom recipes without removing their references',()=>{
 const {w,rig,db}=setup(),row=rig('recipe_source');db.rigs[0].craft={parts:[[row.item.id,2]]};
 assert(w.dependencies(row).includes(db.rigs[0].name));w.remove(row);assert.equal(db.rigs[0].craft.parts[0][0],'recipe_source');
});

test('previous package name, selection and namespace migrate into saved packages',()=>{
 const {w,rig,db}=setup(),row=rig('migrated_rig');w.save(row,false);db.adaptationPackage={name:'Previous patch',version:'1.3',excluded:[]};
 const packages=w.packages();assert.equal(packages.length,1);assert.equal(packages[0].name,'Previous patch');assert.equal(packages[0].items[0].key,'migrated_rig');const id=packages[0].id;assert.equal(w.packages()[0].id,id);
});
