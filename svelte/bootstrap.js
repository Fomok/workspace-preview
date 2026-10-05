import { mount, unmount } from 'svelte';
import Home from './pages/Home.svelte';
import Downloads from './pages/Downloads.svelte';
import Help from './pages/Help.svelte';
import Notes from './pages/Notes.svelte';
import EditorChoices from './pages/EditorChoices.svelte';
import ItemBuilder from './pages/ItemBuilder.svelte';
let page;
const native={home:Home,downloads:Downloads,help:Help,patchnotes:Notes};
export async function start(sync){
 window.ZonebenchShell=sync;
 window.ZonebenchPages={clear(){if(page){unmount(page);page=null;}},render(target,tab){if(['editor','create','builder'].includes(tab)){page=mount(tab==='builder'?ItemBuilder:EditorChoices,{target,props:{flow:window.EditorFlow,create:tab==='create'}});return true;}if(!native[tab])return false;page=mount(native[tab],{target});return true;}};
 const files=['src/intro.js','src/emit.js','src/archive.js','data/baseline.js','src/compatibility.js','src/independent-addon.js','vendor/appwrite-28.1.0.js','src/community-config.js','src/community-client.js','src/addon-preview.js','src/catalog-browser.js','src/community-updates.js','src/community-ui.js','src/releases.js','src/patch-notes.js','src/workbench.js','src/installation-guide.js','src/site.js','src/introduction.js','src/catalog.js','src/editor-view.js','src/editor-flow.js','src/editor.js','src/site-copy.js'];
 for(const file of files)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=import.meta.env.BASE_URL+file+'?v=editor-flow-1';s.onload=resolve;s.onerror=()=>reject(Error('Could not load '+file));document.head.appendChild(s);});
}
export function go(tab){window.Site.go(tab);}
