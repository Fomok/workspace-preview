import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const hash=createHash('sha256');
function digest(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,entry.name);if(entry.isDirectory())digest(p);else{hash.update(p);hash.update(fs.readFileSync(p));}}}
for(const dir of ['svelte','.preview-static'])digest(dir);
const buildId=hash.digest('hex').slice(0,16);
export default defineConfig({plugins:[svelte(),{name:'version-static-assets',transformIndexHtml(html){return html.replace(/(href="\/zonebench-preview\/[^"?]+\.css)(?:\?[^" ]*)?"/g,'$1?v='+buildId+'"');},generateBundle(){this.emitFile({type:'asset',fileName:'build.json',source:JSON.stringify({id:buildId})});}}],define:{__SITE_BUILD__:JSON.stringify(buildId)},base:'/zonebench-preview/',publicDir:'.preview-static',build:{outDir:'dist'}});
