const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../web');
for(const file of fs.readdirSync(path.join(root,'src'))){if(file.endsWith('.js')){const r=cp.spawnSync(process.execPath,['--check',path.join(root,'src',file)],{stdio:'inherit'});if(r.status)process.exit(r.status);}}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog/index.json'),'utf8').replace(/^\uFEFF/,''));
if(catalog.version!==1||!Array.isArray(catalog.addons))throw new Error('Invalid catalog');
for(const addon of catalog.addons){if(!/^[a-z0-9_-]+\.json$/.test(addon.file)||!fs.existsSync(path.join(root,'catalog',addon.file)))throw new Error('Missing catalog pack');}
console.log('Static site ready in web/. No bundler or production dependencies.');

for(const file of ['backend/community/src/main.mjs','backend/community/src/service.mjs','backend/community/src/repository.mjs','tools/setup-community.mjs']){const result=cp.spawnSync(process.execPath,['--check',path.resolve(__dirname,'..',file)],{stdio:'inherit'});if(result.status)process.exit(result.status);}
