const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../web');
for(const file of fs.readdirSync(path.join(root,'src'))){if(file.endsWith('.js')){const r=cp.spawnSync(process.execPath,['--check',path.join(root,'src',file)],{stdio:'inherit'});if(r.status)process.exit(r.status);}}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog/index.json'),'utf8').replace(/^\uFEFF/,''));
if(catalog.version!==1||!Array.isArray(catalog.addons))throw new Error('Invalid catalog');
for(const addon of catalog.addons){if(!/^[a-z0-9_-]+\.json$/.test(addon.file)||!fs.existsSync(path.join(root,'catalog',addon.file)))throw new Error('Missing catalog pack');}
console.log('Static site ready in web/. No bundler or production dependencies.');

for(const file of ['backend/community/src/main.mjs','backend/community/src/service.mjs','backend/community/src/repository.mjs','tools/setup-community.mjs']){const result=cp.spawnSync(process.execPath,['--check',path.resolve(__dirname,'..',file)],{stdio:'inherit'});if(result.status)process.exit(result.status);}

// Changed assets must receive new URLs so returning visitors do not reuse stale code.
const crypto=require('node:crypto');
const indexPath=path.join(root,'index.html');
const index=fs.readFileSync(indexPath,'utf8');
const versioned=index.replace(/(\b(?:src|href)=")([^"?#]+\.(?:js|css))(?:\?[^"#]*)?(")/g, (match,prefix,file,suffix)=>{
  if (/^(?:[a-z]+:|\/\/)/i.test(file)) return match;
  const asset=path.resolve(root,file);
  if(!asset.startsWith(root+path.sep)||!fs.existsSync(asset))throw new Error('Missing local asset: '+file);
  const hash=crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0,12);
  return prefix+file+'?v='+hash+suffix;
});
if(versioned!==index)fs.writeFileSync(indexPath,versioned);
console.log('Script and stylesheet URLs match their current contents.');
