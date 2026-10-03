const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const mod=import('../backend/community/src/service.mjs');
function pack(){const c=vm.createContext({});vm.runInContext(fs.readFileSync('web/data/baseline.js','utf8'),c);return JSON.parse(vm.runInContext('JSON.stringify({bench:"zonebench-items",version:1,from:SEED.modVersion,items:[{kind:"boxes",item:SEED.boxes[0]}]})',c));}
async function fixture(){
 const {createService,Problem}=await mod;const tables=new Map(),files=new Map();let time=Date.now();
 const table=t=>{if(!tables.has(t))tables.set(t,new Map());return tables.get(t);};
 const repo={
  async get(t,id){const r=table(t).get(id);if(!r)throw new Problem(404,'Not found');return structuredClone(r);},
  async optional(t,id){return table(t).has(id)?this.get(t,id):null;},
  async create(t,id,data){if(table(t).has(id))throw new Problem(409,'Already exists');const r={$id:id,$updatedAt:new Date(time).toISOString(),...structuredClone(data)};table(t).set(id,r);return structuredClone(r);},
  async update(t,id,data){const r={...await this.get(t,id),...structuredClone(data),$updatedAt:new Date(time).toISOString()};table(t).set(id,r);return structuredClone(r);},
  async remove(t,id){table(t).delete(id);},
  async list(t,filters={},options={}){const rows=[...table(t).values()].filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));return {total:rows.length,rows:structuredClone(rows.slice(options.offset||0,(options.offset||0)+(options.limit||24)))};},
  async writePack(id,p){files.set(id,structuredClone(p));},async readPack(id){if(!files.has(id))throw new Problem(404,'Missing pack');return structuredClone(files.get(id));},async deletePack(id){files.delete(id);}
 };
 const user={$id:'creator',emailVerification:true,name:'Maker'},other={$id:'other',emailVerification:true},admin={$id:'maintainer',emailVerification:true};
 const service=createService(repo,{adminIds:['maintainer'],now:()=>time});
 const publish=()=>service({action:'publish',name:'Test pouch',description:'A useful test item pack.',author:'Maker',version:'1.0',pack:pack(),owner:'forged'},user);
 return {repo,files,service,user,other,admin,publish,tick:()=>time+=11000};
}
test('guest browsing works but publication requires verified sign-in',async()=>{const f=await fixture();assert.equal((await f.service({action:'list'})).total,0);await assert.rejects(f.service({action:'publish'}),e=>e.status===401);await assert.rejects(f.service({action:'publish'},{...f.user,emailVerification:false}),e=>e.status===401);});
test('publishes immediately with server-owned identity and one permanent listing',async()=>{const f=await fixture(),first=await f.publish();const id=first.listing.id;assert.equal(first.listing.status,'published');assert.equal((await f.repo.get('addons',id)).owner,'creator');assert.equal((await f.service({action:'list'})).total,1);f.tick();const result=await f.service({action:'update',id,expectedRevision:1,name:'Updated pouch',description:'Updated item description.',version:'1.1',author:'Maker'},f.user);assert.equal(result.listing.id,id);assert.equal(result.listing.revision,2);assert.equal((await f.service({action:'list'})).total,1);});
test('other users cannot edit, unpublish, remove, select or block',async()=>{const f=await fixture(),{listing}=await f.publish();for(const action of ['update','unpublish','remove','select','block'])await assert.rejects(f.service({action,id:listing.id,expectedRevision:1,name:'Forged pack',description:'Not owned by this user.',author:'Other',version:'2'},f.other),e=>e.status===403);});
test('owner unpublish hides contents from guests but preserves owner access',async()=>{const f=await fixture(),{listing}=await f.publish();await f.service({action:'unpublish',id:listing.id,expectedRevision:1},f.user);assert.equal((await f.service({action:'list'})).total,0);await assert.rejects(f.service({action:'pack',id:listing.id}),e=>e.status===404);assert((await f.service({action:'pack',id:listing.id},f.user)).pack);});
test('moderator removal cannot be reversed by creator',async()=>{const f=await fixture(),{listing}=await f.publish();await f.service({action:'remove',id:listing.id,expectedRevision:1},f.admin);f.tick();await assert.rejects(f.service({action:'republish',id:listing.id,expectedRevision:2},f.user),e=>e.status===403);});
test('blocking prevents new publishing and updates, while owner unpublishing remains possible',async()=>{const f=await fixture(),{listing}=await f.publish();await f.service({action:'block',id:listing.id},f.admin);f.tick();await assert.rejects(f.publish(),e=>e.status===403);await f.service({action:'unpublish',id:listing.id,expectedRevision:1},f.user);});
test('next-update selection keeps an exact private snapshot after creator updates',async()=>{const f=await fixture(),{listing}=await f.publish();await f.service({action:'select',id:listing.id,expectedRevision:1},f.admin);f.tick();const next=pack();next.items[0].item.name='Different content';await f.service({action:'update',id:listing.id,expectedRevision:1,name:'Updated pouch',description:'Changed after selection.',version:'2',author:'Maker',pack:next},f.user);const saved=await f.service({action:'selectedPack',id:listing.id},f.admin);assert.equal(saved.listing.version,'1.0');assert.notEqual(saved.pack.items[0].item.name,'Different content');await assert.rejects(f.service({action:'selectedPack',id:listing.id},f.user),e=>e.status===403);});
test('rejects stale revision instead of overwriting a newer update',async()=>{const f=await fixture(),{listing}=await f.publish();await f.service({action:'unpublish',id:listing.id,expectedRevision:1},f.user);await assert.rejects(f.service({action:'republish',id:listing.id,expectedRevision:1},f.user),e=>e.status===409);});
test('rejects unsafe pictures and duplicate items before writing',async()=>{const {cleanPack}=await mod;const bad=pack();bad.items[0].item.icon='data:image/svg+xml;base64,AAAA';assert.throws(()=>cleanPack(bad));const duplicate=pack();duplicate.items.push(structuredClone(duplicate.items[0]));assert.throws(()=>cleanPack(duplicate));});
test('shared browser/server validation stays identical',()=>assert.equal(fs.readFileSync('web/src/compatibility.js','utf8'),fs.readFileSync('backend/community/shared/compatibility.cjs','utf8')));

test('site text requires verified admin; guests can read published copy',async()=>{
 const f=await fixture();const input={action:'saveSiteText',source:'Home',value:'Welcome',expectedRevision:0};
 await assert.rejects(f.service(input),e=>e.status===401);
 await assert.rejects(f.service(input,f.user),e=>e.status===403);
 await assert.rejects(f.service(input,{...f.admin,emailVerification:false}),e=>e.status===401);
 assert.deepEqual((await f.service({action:'siteText'})).entries,[]);
 assert.equal((await f.service(input,f.admin)).entry.revision,1);
 assert.equal((await f.service({action:'siteText'})).entries[0].value,'Welcome');
 await assert.rejects(f.service({...input,value:'Stale'},f.admin),e=>e.status===409);
 await assert.rejects(f.service({...input,action:'resetSiteText',expectedRevision:1},f.user),e=>e.status===403);
 await f.service({...input,action:'resetSiteText',expectedRevision:1},f.admin);
 assert.deepEqual((await f.service({action:'siteText'})).entries,[]);
});
test('site copy validates text and canonicalizes whitespace without changing addon data',async()=>{
 const f=await fixture();for(const value of ['', 'x'.repeat(6001), '\x00bad'])await assert.rejects(f.service({action:'saveSiteText',source:'Hello',value,expectedRevision:0},f.admin),e=>e.status===400);
 await f.service({action:'saveSiteText',source:'Hello   world',value:'<img src=x onerror=alert(1)>',expectedRevision:0},f.admin);
 assert.equal((await f.service({action:'siteText'})).entries[0].source,'Hello world');
 assert.equal((await f.service({action:'list'})).total,0);
});
