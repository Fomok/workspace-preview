<script>
 import { onMount } from 'svelte';
 let title;const releases=window.Releases.load();
 onMount(()=>{window.OpeningIntro?.play(title);});
</script>
<div class="inventory-home">
 <section class="kit-hero" aria-label="Squared Away">
  <div class="kit-frame kit-copy hero-copy">
   <p class="eyebrow hero-game-label"><span class="game-label-prefix">INVENTORY MOD FOR</span> <span class="game-label-stalker">STALKER</span> <span class="game-label-gamma">G.A.M.M.A.</span></p>
   <h1 bind:this={title}>SQUARED AWAY</h1><h2>Ultimate inventory cancer is HERE.</h2>
   <p class="hero-description">A grid inventory. Rigs that carry your essentials. Containers that save you some space.</p>
   <div class="site-actions"><a class="tool primary" href="#downloads">↓ Download Squared Away</a><a class="tool" href="#introduction">Explore the mechanics →</a></div>
  </div>
  <figure class="kit-frame kit-gameplay"><img src="assets/gameplay/inventory.png" alt="Squared Away inventory with equipped rig and backpack storage" width="1207" height="1079"></figure>
 </section>
 <section class="kit-frame kit-release" aria-label="Latest release">
  {#await releases}<p class="hint">Checking the latest release…</p>{:then data}{#if data.items[0]}{@const release=data.items[0]}
   <span class="kit-label">{release.preview?'LATEST PREVIEW':'LATEST RELEASE'}</span><h2>{release.name}</h2>
   <div class="site-actions"><a class="tool" href={release.mod.browser_download_url}>↓ Mod ZIP</a><a class="tool" href={release.engine.browser_download_url}>↓ Engine ZIP</a><a class="kit-release-more" href="#downloads">All downloads & details →</a></div>
  {:else}<a href="#downloads">View downloads</a>{/if}{:catch error}<p role="alert">{error.message} <a href="#downloads">View downloads</a></p>{/await}
 </section>
 <section class="kit-features" aria-label="Features">{#each [['Every cell counts','Place and rotate items to make the most of your inventory.'],['Keep essentials close','Rigs and expansion pouches give your loadout room to work.'],['Make it your own','Build layouts, change textures and export your own add-ons.']] as [heading,text]}<article class="kit-frame"><h3>{heading}</h3><p>{text}</p></article>{/each}</section>
 <section class="kit-frame kit-workbench"><div><h2>Build your loadout.</h2><p>Customize rigs, containers and pouches. Browse community add-ons and export your own setup.</p></div><div class="site-actions"><a class="tool primary" href="#editor/rigs">Open Editor</a><a class="tool" href="#community">Browse add-ons</a></div></section>
 <footer class="site-footer"><span>ZONEBENCH / SQUARED AWAY</span><a href="#help">Installation & help</a><span>A community project by Fomok</span></footer>
</div>
