import { mount, unmount } from 'svelte';
import {loadScripts} from './lib/load-scripts.mjs';
import {addonFilename} from './lib/guided-install.mjs';
import Addons from './pages/Addons.svelte';
import Home from './pages/Home.svelte';
import Account from './pages/Account.svelte';
import Downloads from './pages/Downloads.svelte';
import Help from './pages/Help.svelte';
import Notes from './pages/Notes.svelte';
import EditorChoices from './pages/EditorChoices.svelte';
import ItemBuilder from './pages/ItemBuilder.svelte';
import {recordDownload,downloadedAddons} from './lib/addon-downloads.mjs';
let page;
const native={account:Account,home:Home,downloads:Downloads,help:Help,patchnotes:Notes};
export async function start(sync){
 window.ZonebenchShell=sync;
 window.ZonebenchAddonFilename=addonFilename;
 window.ZonebenchDownloads={list:()=>downloadedAddons(window.Community?.user),recordCompletedDownload(manifest,options){const result=recordDownload(window.Community?.user,manifest,options);window.dispatchEvent(new Event('zonebench-downloads-changed'));return result;}};
 window.ZonebenchPages={clear(){if(page){unmount(page);page=null;}},render(target,tab){if(tab==='catalog'&&['#addons','#community',''].includes(location.hash)){page=mount(Addons,{target});return true;}if(['editor','create','builder'].includes(tab)){page=mount(tab==='builder'?ItemBuilder:EditorChoices,{target,props:{flow:window.EditorFlow,create:tab==='create'}});return true;}if(!native[tab])return false;page=mount(native[tab],{target});return true;}};
 const files=['src/intro.js','src/emit.js','src/archive.js','data/baseline.js','src/compatibility.js','src/independent-addon.js','src/community-download.js','vendor/appwrite-28.1.0.js','src/community-config.js','src/community-client.js','src/addon-preview.js','src/catalog-browser.js','src/community-updates.js','src/community-ui.js','src/releases.js','src/patch-notes.js','src/workbench.js','src/installation-guide.js','src/site.js','src/introduction.js','src/catalog.js','src/editor-view.js','src/editor-flow.js','src/editor.js','src/site-copy.js'];
 await loadScripts(files,import.meta.env.BASE_URL);
}
export function go(tab){window.Site.go(tab);}
