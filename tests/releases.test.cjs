const {test}=require('node:test');const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({URL});vm.runInContext(fs.readFileSync('web/src/releases.js','utf8'),c);const base='https://github.com/Fomok/xray-monolith-inventory-edits/releases/download/';
const fixture=(tag,preview,mod,engine)=>({tag_name:tag,name:tag,draft:false,prerelease:preview,assets:[mod,engine].map(name=>({name,browser_download_url:base+tag+'/'+name}))});
const releases=[fixture('v3.49.2-native-preview',true,'SquaredAway_3.49.2.zip','SquaredAway-DX11-AVX-75cbdbc.zip'),fixture('2026.9.12',false,'SquaredAway_3.48.0.zip','STALKER-Anomaly-modded-exes-MT-TEST_2026.9.12-SquaredAway.zip')];
test('release selection pairs the native rebuild with its exact engine',()=>{const r=c.Releases.pick(releases.find(x=>x.tag_name==='v3.49.2-native-preview'));assert.equal(r.preview,true);assert.equal(r.mod.name,'SquaredAway_3.49.2.zip');assert.equal(r.engine.name,'SquaredAway-DX11-AVX-75cbdbc.zip');assert(r.mod.browser_download_url.includes('/v3.49.2-native-preview/'));assert(r.engine.browser_download_url.includes('/v3.49.2-native-preview/'));});
test('old stable remains separate from current preview',()=>{const r=c.Releases.pick(releases.find(x=>x.tag_name==='2026.9.12'));assert.equal(r.preview,false);assert.equal(r.mod.name,'SquaredAway_3.48.0.zip');});
test('downloads never combine incomplete releases or choose among ambiguous assets',()=>{const r=structuredClone(releases[0]);r.assets=r.assets.filter(a=>!a.name.includes('DX11'));assert.equal(c.Releases.pick(r),null);const duplicate=structuredClone(releases[0]);duplicate.assets.push({...duplicate.assets.find(x=>x.name==='SquaredAway_3.49.2.zip'),name:'SquaredAway_3.49.3.zip'});assert.equal(c.Releases.pick(duplicate),null);});
test('drafts and untrusted download hosts are rejected',()=>{const r=structuredClone(releases[0]);r.draft=true;assert.equal(c.Releases.pick(r),null);r.draft=false;r.assets.find(x=>x.name==='SquaredAway_3.49.2.zip').browser_download_url='https://untrusted.example/mod.zip';assert.equal(c.Releases.pick(r),null);});

test('website fallback never includes draft releases',()=>{const rows=JSON.parse(fs.readFileSync('web/data/releases.json','utf8'));assert(rows.every(x=>!x.draft));});

test('2.0 all-DX package is paired with the mod and excludes developer sources',()=>{const r=fixture('v2.0',false,'Squared-Away-2.0.zip','Squared-Away-2.0-All-DX.zip');r.assets.push({name:'Squared-Away-2.0-For-Developers.zip',browser_download_url:base+'v2.0/Squared-Away-2.0-For-Developers.zip'});const picked=c.Releases.pick(r);assert.equal(picked.mod.name,'Squared-Away-2.0.zip');assert.equal(picked.engine.name,'Squared-Away-2.0-All-DX.zip');r.draft=true;assert.equal(c.Releases.pick(r),null);});

test('clean 2.0 filenames pair correctly and never leak draft downloads',()=>{
 for(const separator of [' ','.']){
  const names=['Squared Away - 2.0 Update.zip','Squared Away - 2.0 Engine - All DX.zip','Squared Away - 2.0 For Developers.zip'].map(x=>x.replaceAll(' ',separator));
  const r=fixture('v2.0',false,names[0],names[1]);r.assets.push({name:names[2],browser_download_url:base+'v2.0/'+names[2]});
  const picked=c.Releases.pick(r);assert.equal(picked.mod.name,names[0]);assert.equal(picked.engine.name,names[1]);r.draft=true;assert.equal(c.Releases.pick(r),null);
 }
});

test('published 2.0 exposes both download links',()=>{
 const release=c.Releases.pick(fixture('v2.0-update',false,'Squared.Away.-.2.0.Update.zip','Squared.Away.-.2.0.Engine.-.All.DX.zip'));
 assert(release.mod.browser_download_url);assert(release.engine.browser_download_url);assert(!release.unavailable);assert(!release.preview);
});

test('2.0.2 pairs the new mod and engine while excluding its merge kit',()=>{
 const r=fixture('v2.0.2',false,'Squared.Away.-.2.0.2.zip','Squared.Away.-.2.0.2.Engine.-.All.DX.zip');
 r.assets.push({name:'Squared.Away.-.2.0.2.For.Developers.zip',browser_download_url:base+'v2.0.2/Squared.Away.-.2.0.2.For.Developers.zip'});
 const selected=c.Releases.pick(r);assert.equal(selected.tag,'v2.0.2');assert.equal(selected.mod.name,r.assets[0].name);assert.equal(selected.engine.name,r.assets[1].name);
});
