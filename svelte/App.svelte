<script>
 import { onMount } from 'svelte';
 import { start, go } from './bootstrap.js';
 let view=$state({tab:'home',editor:false,version:'2.0.2',tabs:[],unread:false});let error=$state('');let ready=$state(false);
 const links=[['patchnotes','Patch Notes'],['home','Home'],['introduction','Introduction'],['rigs','Editor'],['catalog','Community'],['downloads','Downloads'],['help','Help'],['account','Account']];
 const hashes={patchnotes:'patch-notes',catalog:'community',rigs:'editor/rigs'};
 onMount(()=>{start(next=>{view=next;ready=true;}).catch(e=>error=e.message);});
 function navigate(e,tab){if(!ready||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();go(tab);}
</script>
<div id="app">
 <header class="site-header">
  <button class="brand" type="button" onclick={()=>ready&&go('home')}>ZONEBENCH<small>SQUARED AWAY {view.version}</small></button>
  <nav id="site-nav" aria-label="Main navigation">
   {#each links as [tab,label]}<a href={'#'+(hashes[tab]||tab)} class:active={tab==='rigs'?view.editor:view.tab===tab} class:has-update={tab==='patchnotes'&&view.unread} aria-current={(tab==='rigs'?view.editor:view.tab===tab)?'page':undefined} onclick={e=>navigate(e,tab)}>{label}{#if tab==='patchnotes'&&view.unread}<span class="patch-new">New</span>{/if}</a>{/each}
  </nav>
 </header>
 <div id="project-tools" class="project-toolbar" hidden={!view.editor}><span class="project-caption">YOUR WORKBENCH</span><span id="dirty"></span><div class="spacer"></div><button hidden class="tool" id="btnMod">Update the mod</button><button class="tool" id="btnLoad">Open project</button><button class="tool primary" id="btnSave">Save project</button></div>
 <input type="file" id="modIn" accept=".zip,application/zip" hidden><input type="file" id="shareIn" accept=".json,application/json" hidden><input type="file" id="fileIn" accept=".json,application/json" hidden><input type="file" id="imgIn" accept="image/*" hidden>
 <nav id="nav" aria-label="Editor sections" hidden={!view.editor}>{#each view.tabs as item}<button class:on={item.key===view.tab} onclick={()=>go(item.key)}>{item.label}{#if item.count}<span class="cnt"> {item.count}</span>{/if}</button>{/each}</nav>
 <main><div id="list"></div><div id="pane"></div></main>
 {#if error}<div role="alert" class="startup-error">{error} <a href="https://fomok.github.io/zonebench/">Open the live website</a></div>{/if}
</div>
<style>
 :global(#svelte-root){height:100%} :global(#app){grid-template-rows:auto auto auto minmax(0,1fr)}
 .startup-error{position:fixed;inset:30% 15% auto;background:#211a1a;padding:30px;z-index:1000}
</style>


