const test=require('node:test');
const assert=require('node:assert/strict');
test('startup requests all scripts immediately while retaining classic execution order',async()=>{
 const {loadScripts}=await import('../svelte/lib/load-scripts.mjs');
 const scripts=[];
 const document={createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
 let done=false;
 const loading=loadScripts(['dependency.js','consumer.js'],'/preview/',document).then(()=>done=true);
 assert.equal(scripts.length,2);
 assert.ok(scripts.every(s=>s.async===false));
 assert.deepEqual(scripts.map(s=>s.src),['/preview/dependency.js?v=editor-flow-1','/preview/consumer.js?v=editor-flow-1']);
 scripts[1].onload();await Promise.resolve();assert.equal(done,false);
 scripts[0].onload();await loading;assert.equal(done,true);
});
test('startup reports the failed script rather than silently leaving an empty page',async()=>{
 const {loadScripts}=await import('../svelte/lib/load-scripts.mjs');
 const scripts=[];
 const loading=loadScripts(['broken.js'],'/',{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}});
 scripts[0].onerror();await assert.rejects(loading,/Could not load broken.js/);
});
