const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.preview-static');
fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'web'),out,{recursive:true});fs.rmSync(path.join(out,'index.html'));
// Pixel-identical, losslessly compressed assets used only by the preview.
fs.cpSync(path.join(root,'preview-assets'),out,{recursive:true});
function edit(file,fn){const p=path.join(out,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('src/editor.js',s=>s.replace('"zonebench-web-v1"','"zonebench-svelte-preview-v1"'));
edit('src/patch-notes.js',s=>s.replace("'zonebench.patchnotes.read'","'zonebench.preview.patchnotes.read'"));
edit('src/intro.js',s=>s.replace(/const key=([^;]+);/,"const key='zonebench.preview.intro';"));
edit('src/community-config.js',s=>s.replace('enabled:true,','enabled:true, readOnly:true,'));
edit('src/community-client.js',s=>{
 s=s.replace('async function request(action,data={}){',`async function request(action,data={}){
 if(COMMUNITY_CONFIG.readOnly && !['me','list','pack','siteText','selections'].includes(action))throw new Error('Publishing and account changes are disabled in the preview. Use the live website.');`);
 for(const method of ['sendCode(email)','verify(code)','name(name)','signOut()'])s=s.replace('async '+method+'{','async '+method+"{if(COMMUNITY_CONFIG.readOnly)throw new Error('Account changes are disabled in the preview. Use the live website.');");
 return s;
});
console.log('Preview assets prepared with isolated editor storage and read-only community access.');
