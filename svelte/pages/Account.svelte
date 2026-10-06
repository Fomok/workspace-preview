<script>
 import {onMount} from 'svelte';
 import {addonLink,downloadStatus} from '../lib/addon-requirements.mjs';
 import {loadLibrary} from '../lib/addon-browser.mjs';
 let listings=$state([]),checked=$state(false),updateError=$state('');
 import {downloadedAddons} from '../lib/addon-downloads.mjs';
 let user=$state(null),loading=$state(true),error=$state(''),downloads=$state([]);
 let stopped=false;
 const live='https://fomok.github.io/zonebench/#account';
 function sync(){user=window.Community.user;downloads=downloadedAddons(user).sort((a,b)=>b.downloadedAt-a.downloadedAt);}
 async function refresh(){loading=true;error='';try{await window.Community.refresh();if(!stopped){sync();checked=false;updateError='';if(user)try{const rows=await loadLibrary(window.Community,()=>{},{get aborted(){return stopped;}});if(!stopped){listings=rows.map(r=>r.listing);checked=true;}}catch{if(!stopped)updateError='Could not check for updates. Your saved download history is still available.';}}}catch(e){if(!stopped)error=e.message;}finally{if(!stopped)loading=false;}}
 onMount(()=>{refresh();window.addEventListener('zonebench-account-changed',sync);window.addEventListener('zonebench-downloads-changed',sync);return()=>{stopped=true;window.removeEventListener('zonebench-account-changed',sync);window.removeEventListener('zonebench-downloads-changed',sync);};});
 function resetPanel(node){window.ZonebenchAccount.mountReset(node);}
</script>

<div class="account-page">
 <header class="account-heading"><p class="eyebrow">YOUR WORKBENCH</p><h1>Account</h1></header>
 <div class="account-layout">
  <aside class="account-profile account-panel">
   <h2>Profile</h2>
   {#if loading}<p role="status">Checking sign-in…</p>{:else if error}<p role="alert">Could not load your account. {error}</p><button class="tool" onclick={refresh}>Try again</button>{:else if user}
    <div class="account-avatar" aria-hidden="true">{(user.name||'?').slice(0,1).toUpperCase()}</div>
    <h3>{user.name||'Your account'}</h3><span class="account-badge">{user.moderator?'Maintainer':'Creator'}</span>
    {#if user.blocked}<p class="account-warning">Publishing is disabled for this account. You can still remove your own listings from public browsing.</p>{/if}
    <p>Your display name appears on your public add-ons.</p>
    <a class="tool" href={live} target="_blank" rel="noreferrer">Manage profile / sign out ↗</a>
    <details class="account-id"><summary>Account details</summary><p>Account ID</p><code>{user.id}</code></details>
   {:else}
    <div class="account-avatar" aria-hidden="true">Z</div><h3>Make it yours.</h3><p>Sign in to publish add-ons, manage your listings and remember your downloads.</p><a class="tool primary" href={live} target="_blank" rel="noreferrer">Sign in / create account ↗</a><p class="account-small">Your email is private and is used only for sign-in.</p>
   {/if}
   <p class="account-small">Account changes are handled on the live site while this redesign is in preview. Refresh your account here after signing in or making changes.</p><button class="account-link" onclick={refresh} disabled={loading}>Refresh account ↻</button>
  </aside>
  <div class="account-content">
   <section class="account-panel"><h2>My add-ons</h2><div class="account-section-body"><h3>Give your gear a home.</h3><p>Create something new, or update a published add-on without posting another copy.</p><div class="account-actions"><a class="tool primary" href="#editor/create">Create an item →</a>{#if user}<button class="tool" onclick={()=>window.Site.addons('mine')}>Manage my add-ons →</button>{:else}<a class="tool" href={live} target="_blank" rel="noreferrer">Sign in to manage add-ons ↗</a>{/if}</div></div></section>
   <section class="account-panel"><h2>My downloads <span>{downloads.length}</span></h2><div class="account-section-body">
    {#if !user}<h3>Keep your finds together.</h3><p>Download add-ons while signed in to remember them here and use their items in your crafting recipes.</p>{:else if !downloads.length}<h3>No downloads yet.</h3><p>Add-ons you download while signed in will appear here.</p>{:else}<ul class="account-downloads">{#each downloads as addon}{@const status=downloadStatus(addon,listings,checked)}<li><div><strong>{addon.name}</strong><small>Version {addon.version} · {addon.items.length} items · {new Date(addon.downloadedAt).toLocaleDateString()}</small></div><span class="download-status" class:account-warning={status.kind==='update'}>{status.label}</span>{#if addonLink(addon.listingId)}<a class="tool" href={addonLink(addon.listingId)}>{status.kind==='update'?'View update →':'View add-on →'}</a>{/if}<details><summary>Included items</summary><ul>{#each addon.items as item}<li>{item.name}</li>{/each}</ul></details></li>{/each}</ul>{/if}
    {#if updateError}<p role="status">{updateError}</p>{/if}<a class="tool" href="#addons">Browse add-ons →</a><p class="account-small">Saved for your account in this browser. This list does not detect what is installed in MO2 or sync between devices.</p>
   </div></section>
   {#if user?.moderator}<section class="account-panel account-admin"><h2>Administration <span>Maintainer only</span></h2><div class="account-section-body"><p>Review public add-ons, manage unwanted content and select additions for a future mod update.</p><div class="account-actions"><button class="tool" onclick={()=>window.Site.addons('moderation')}>Manage public add-ons</button><button class="tool" onclick={()=>window.Site.addons('selections')}>Next mod update</button><button class="tool" onclick={()=>window.ZonebenchAccount.editText()}>Edit site text</button></div><p class="account-small">Publishing and moderation changes remain disabled in this preview. Use the live site to apply changes.</p></div></section>{/if}
   <section class="account-reset" aria-label="Reset item customizations" use:resetPanel></section>
  </div>
 </div>
</div>

<style>
 .account-page{max-width:1180px;margin:0 auto;padding:32px 24px 70px;color:#d8d5cb}.account-heading{display:block;position:static;background:none;border:0;padding:0;box-shadow:none;margin-bottom:30px}.account-heading h1{margin:6px 0 10px;font-size:clamp(32px,4vw,48px)}.account-heading>p:last-child{color:#a7ada6}.account-layout{display:grid;grid-template-columns:290px minmax(0,1fr);gap:24px;align-items:start}.account-panel{background:linear-gradient(135deg,#191d19,#111412);border:1px solid #56594f;box-shadow:inset 0 0 0 3px #242722,0 5px 18px #0004}.account-panel h2{font-size:16px;margin:5px;padding:16px 20px;color:#e3cfac;background:#30372b url('/zonebench-preview/assets/field-kit/olive-seamless.svg');border:1px solid #4b5341;display:flex;align-items:center;justify-content:space-between;gap:10px}.account-panel h2 span{font:12px system-ui;color:#b6c2aa}.account-content{display:grid;gap:24px}.account-profile{padding-bottom:24px}.account-profile>p,.account-profile>h3,.account-profile>.tool,.account-profile>.account-link,.account-profile>details{margin-left:24px;margin-right:24px}.account-profile h3{font-size:24px;overflow-wrap:anywhere;margin-bottom:12px}.account-avatar{width:60px;height:60px;margin:25px 24px 16px;border:1px solid #65745b;display:grid;place-items:center;background:#2a3529;font-size:30px;color:#dbc09a}.account-badge{display:inline-block;margin:0 24px;border:1px solid #506747;background:#243323;color:#b7cba9;padding:4px 9px;font-size:12px}.account-page p{line-height:1.6}.account-page h3{font-size:21px}.account-section-body{padding:14px 25px 22px}.account-section-body h3{margin-top:5px}.account-actions{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 4px}.account-page :global(.tool){display:inline-flex;align-items:center;justify-content:center;min-height:42px;white-space:normal;line-height:1.4;text-decoration:none;padding:10px 15px}.account-small{font-size:12px;color:#9aa296!important}.account-link{background:none;border:0;color:#dcb88e;padding:6px 0;cursor:pointer}.account-link:disabled{opacity:.5}.account-id{font-size:12px;margin-top:25px}.account-id code{overflow-wrap:anywhere;color:#a8afa3}.account-downloads{list-style:none;padding:0;margin:0 0 20px}.account-downloads>li{padding:16px 0;border-bottom:1px solid #343c31;display:grid;gap:10px}.account-downloads small{display:block;margin-top:5px;color:#a0a99a}.account-downloads summary{font-size:12px;color:#dcb88e;cursor:pointer}.account-downloads details ul{font-size:13px;line-height:1.8}.account-warning{color:#d68d9e}.account-reset :global(.card){margin:0;background:#191719;border:1px solid #63434b;padding:24px;box-shadow:none}.account-reset :global(h2){font-size:18px;margin-top:0;color:#d3a0ab}.account-reset :global(p){font-size:13px;line-height:1.6;color:#aba3a5}.account-reset :global(button){min-height:42px;margin-top:8px}.account-reset :global(.danger){color:#edc8d1;border:1px solid #9b5769;background:#40272f;padding:10px 15px;cursor:pointer}.account-page button:focus-visible,.account-page a:focus-visible{outline:2px solid #dcb88e;outline-offset:3px}@media(max-width:760px){.account-layout{grid-template-columns:1fr}.account-page{padding:20px 12px 45px}.account-profile{position:static}.account-section-body{padding:15px}.account-panel h2{padding:14px}.account-reset :global(button){margin-left:0!important;margin-right:8px}}
</style>
