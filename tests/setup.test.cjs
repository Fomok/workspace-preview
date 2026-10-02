const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const script=path.resolve(__dirname,'../tools/setup-community.mjs');
test('setup waits for an unreferenced pending request and reports its failure',()=>{
 const preload=`globalThis.fetch=()=>new Promise(resolve=>{setTimeout(()=>resolve(new Response(JSON.stringify({message:'mock denied'}),{status:401})),50).unref();});`;
 const result=spawnSync(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),script,'--apply'],{encoding:'utf8',timeout:5000,env:{...process.env,APPWRITE_API_KEY:'test-only-placeholder'}});
 assert.ifError(result.error);
 assert.equal(result.status,1,result.stderr);
 assert.match(result.stderr,/Setup failed: GET \/tablesdb\/zonebench: mock denied/);
});

test('runtime discovery omits the key while private setup requests retain it',()=>{
 const preload=`globalThis.fetch=async(url,options)=>{
  const route=new URL(url).pathname.slice(3);
  const publicLookup=route==='/functions/runtimes';
  if(publicLookup && options.headers['X-Appwrite-Key'])throw Error('Secret sent to public runtime lookup');
  if(!publicLookup && options.headers['X-Appwrite-Key']!=='test-only-placeholder')throw Error('Private request lost authentication');
  let data={};let status=200;
  if(route.endsWith('/columns'))data={columns:[{status:'available'}]};
  if(publicLookup){console.log('PUBLIC_RUNTIME_OK');data={runtimes:[{$id:'node-22'}]};}
  if(route==='/functions/zonebench-community'){status=403;data={message:'TEST_STOP_AFTER_RUNTIME'};}
  return new Response(JSON.stringify(data),{status});
 };`;
 const result=spawnSync(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),script,'--apply'],{encoding:'utf8',timeout:5000,env:{...process.env,APPWRITE_API_KEY:'test-only-placeholder'}});
 assert.ifError(result.error);
 assert.equal(result.status,1,result.stderr);
 assert.match(result.stdout,/PUBLIC_RUNTIME_OK/);
 assert.match(result.stderr,/TEST_STOP_AFTER_RUNTIME/);
});
