import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const live=process.env.ZONEBENCH_TARGET==='live',base=live?'/zonebench/':'/zonebench-preview/';
const hash=createHash('sha256');
function digest(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,entry.name);if(entry.isDirectory())digest(p);else{hash.update(p);hash.update(fs.readFileSync(p));}}}
for(const dir of ['svelte','.preview-static'])digest(dir);
hash.update(base);
const buildId=hash.digest('hex').slice(0,16);
export default defineConfig({plugins:[{name:'live-paths',enforce:'pre',transform(code,id){if(live&&/\.(svelte|css|js|mjs)$/.test(id)&&!id.includes('node_modules'))return code.replaceAll('/zonebench-preview/','/zonebench/');}},svelte(),{name:'version-static-assets',transformIndexHtml(html){return (live?html.replaceAll('/zonebench-preview/','/zonebench/').replace('<meta name="robots" content="noindex">','').replace('ZoneBench Svelte Preview','ZoneBench'):html).replace(/(href="\/zonebench(?:-preview)?\/[^"?]+\.css)(?:\?[^" ]*)?"/g,'$1?v='+buildId+'"');},generateBundle(){this.emitFile({type:'asset',fileName:'build.json',source:JSON.stringify({id:buildId})});}}],define:{__SITE_BUILD__:JSON.stringify(buildId)},base,publicDir:'.preview-static',build:{outDir:'dist'}});
