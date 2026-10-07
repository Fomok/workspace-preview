<script>
 import HeaderTexture from './HeaderTexture.svelte';
 let {active=false,ready=false}=$props();
 let trigger,panel;let expanded=$state(false);
 const entries=[
  ['addons','Browse add-ons','Find rigs, containers and pouches.'],
  ['editor/create','Create an add-on','Build items in your current project.'],
  ['editor/share','Publish an add-on','Choose the items you want to share.'],
  ['addons/mine','My add-ons','Edit, update or unpublish your listings.']
 ];
 function toggle(){
  if(expanded){panel.hidePopover();return;}
  const rect=trigger.getBoundingClientRect();
  panel.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-340))+'px';
  panel.style.top=(rect.bottom+7)+'px';
  panel.style.maxHeight=Math.max(140,window.innerHeight-rect.bottom-24)+'px';
  panel.showPopover();
 }
 function close(){if(expanded)panel.hidePopover();}
 function choose(e,path){
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  e.preventDefault();close();
  if(path.startsWith('addons'))window.Site.addons(path.endsWith('/mine')?'mine':'public');
  else window.Site.go(path.slice(7));
 }
</script>
<svelte:window onresize={close} onhashchange={close}/>
<button bind:this={trigger} type="button" class="addons-trigger" class:active aria-expanded={expanded} aria-controls="addons-shortcuts" disabled={!ready} onclick={toggle}>
 <HeaderTexture selected={active||expanded}/><span>Add-ons</span>
</button>
<div id="addons-shortcuts" bind:this={panel} popover="auto" ontoggle={e=>expanded=e.newState==='open'}>
 <p class="menu-title">THE COMMUNITY WORKBENCH</p>
 <nav aria-label="Add-on shortcuts">
  {#each entries as [path,label,description]}
   <a href={'#'+path} onclick={e=>choose(e,path)}><strong>{label}</strong><small>{description}</small><span aria-hidden="true">→</span></a>
  {/each}
 </nav>
</div>
<style>
 :global(body .site-header #site-nav .addons-trigger){position:relative;display:flex;align-items:center;justify-content:center;flex:1 0 auto;min-height:48px;padding:10px 15px;border:0;border-radius:0;background:none;box-shadow:none;color:var(--dim);font:inherit;font-size:13px;white-space:nowrap;cursor:pointer}
 .addons-trigger>span{position:relative;z-index:1}
 :global(body .site-header #site-nav .addons-trigger.active){color:var(--hot)}
 .addons-trigger:hover{filter:brightness(1.18)}.addons-trigger:focus-visible{outline:2px solid var(--hot);outline-offset:-5px}
 #addons-shortcuts{position:fixed;inset:auto;margin:0;padding:7px;width:328px;max-width:calc(100vw - 24px);box-sizing:border-box;overflow:auto;color:var(--ink);border:5px solid transparent;border-image:url('/zonebench-preview/assets/field-kit/frame.svg') 12 / 5px / 0 stretch;background:#161918 url('/zonebench-preview/assets/field-kit/panel-metal.svg');box-shadow:0 15px 45px #000a}
 #addons-shortcuts:popover-open{animation:arrive .16s ease-out}
 .menu-title{padding:12px 10px;margin:0 0 4px;font-size:9px;letter-spacing:.16em;color:var(--detail);border-bottom:1px solid #43483e}
 nav{display:grid;gap:3px}:global(body .site-header #site-nav #addons-shortcuts a){position:relative;display:grid;justify-content:stretch;align-items:start;gap:6px;padding:13px 28px 13px 10px;margin:0;min-height:0;color:var(--ink);text-decoration:none;border:1px solid transparent;border-radius:2px;background:none;box-shadow:none;white-space:normal}
 :global(body .site-header #site-nav #addons-shortcuts a:hover),:global(body .site-header #site-nav #addons-shortcuts a:focus-visible){background:#30372b;border-color:#6c745d;outline:none}
 :global(body .site-header #site-nav #addons-shortcuts a::before){display:none}
 strong{font-size:14px;font-weight:500}small{font-size:11px;line-height:1.5;color:var(--dim)}a>span{position:absolute;right:10px;top:15px;color:var(--hot)}
 @keyframes arrive{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
 @media(prefers-reduced-motion:reduce){#addons-shortcuts:popover-open{animation:none}}
</style>

