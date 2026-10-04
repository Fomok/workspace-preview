const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
cp.execFileSync(process.execPath,['tools/prepare-preview.cjs']);
test('preview storage and deployment are separate from production',()=>{
 const editor=fs.readFileSync('.preview-static/src/editor.js','utf8');assert(editor.includes('"zonebench-svelte-preview-v1"'));assert(!editor.includes('"zonebench-web-v1"'));
 assert(fs.readFileSync('.preview-static/src/patch-notes.js','utf8').includes('zonebench.preview.patchnotes.read'));
 assert(fs.readFileSync('.preview-static/src/intro.js','utf8').includes('zonebench.preview.intro'));
 assert(fs.readFileSync('.github/workflows/pages.yml','utf8').includes("github.repository == 'Fomok/zonebench-preview'"));
});
test('preview blocks all community writes and account changes before any network call',async()=>{
 const ctx=vm.createContext({COMMUNITY_CONFIG:{enabled:true,readOnly:true}});vm.runInContext(fs.readFileSync('.preview-static/src/community-client.js','utf8'),ctx);
 for(const action of ['publish','update','unpublish','republish','remove','block','unblock','select','unselect','saveSiteText','resetSiteText'])await assert.rejects(ctx.Community.request(action),/disabled in the preview/);
 for(const method of ['sendCode','verify','name','signOut'])await assert.rejects(ctx.Community[method]('test'),/disabled in the preview/);
});
