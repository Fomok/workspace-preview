<script>
 import { onMount } from 'svelte';
 let title;const releases=window.Releases.load();
 onMount(()=>{window.OpeningIntro?.play(title);});
 const features=[{n:'01',title:'Make every cell count.',text:'Place, rotate and organize. Your inventory remembers where everything belongs.',image:'rotation.png',alt:'Rotated ammunition being placed in the inventory grid'},{n:'02',title:'Keep essentials ready.',text:'Build a loadout around your rig. Add pouches for the things you reach for first.',image:'rig-pouches.png',alt:'Equipped rig with magazines and expansion pouches'},{n:'03',title:'Give everything a place.',text:'Pack supplies into containers. Open them, organize them and carry them with you.',image:'container.png',alt:'An open food container with separate storage compartments'}];
</script>
<div class="field-home">
 <section class="field-hero" aria-labelledby="home-title">
  <div class="hero-copy">
   <p class="field-eyebrow"><span class="status-dot"></span> INVENTORY MOD FOR <span class="stalker">STALKER</span> <span class="gamma">G.A.M.M.A.</span></p>
   <h1 id="home-title" bind:this={title}>SQUARED AWAY</h1>
   <p class="hero-tagline">Ultimate inventory cancer is HERE.</p>
   <p class="hero-description">A place for every piece of gear.<br> And a reason to think about what you carry.</p>
   <div class="field-actions"><a class="field-button primary" href="#downloads"><span aria-hidden="true">↓</span> Download the mod</a><a class="field-button quiet" href="#introduction">See how it works <span aria-hidden="true">↗</span></a></div>
   <div class="hero-footnote"><span>RIGS</span><span>CONTAINERS</span><span>SAVED LAYOUTS</span></div>
  </div>
  <figure class="inventory-frame">
   <div class="frame-bar"><span><i aria-hidden="true"></i> IN THE FIELD</span><span>ACTUAL GAMEPLAY</span></div>
   <div class="inventory-image"><img src="assets/gameplay/inventory.png" alt="Squared Away in-game inventory showing equipment, an equipped rig and organized backpack storage" width="1207" height="1079"></div>
   <figcaption><span>Everything you carry. At a glance.</span><span class="frame-plus" aria-hidden="true">+</span></figcaption>
  </figure>
 </section>
 <section class="release-strip" aria-label="Latest release">
  {#await releases}<p class="muted">Checking the latest release…</p>{:then data}{#if data.items[0]}{@const release=data.items[0]}<div class="release-label"><span class="field-eyebrow">{release.preview?'LATEST PREVIEW':'LATEST RELEASE'}</span><strong>{release.name}</strong></div><p class="release-caption">Get the mod and its matching engine.<br><a href="#patch-notes">Read what changed <span aria-hidden="true">↗</span></a></p><div class="release-links"><a class="field-button secondary" href={release.mod.browser_download_url}>Mod ZIP <span aria-hidden="true">↓</span></a><a class="field-button secondary" href={release.engine.browser_download_url}>Engine <span aria-hidden="true">↓</span></a></div>{#if release.bodycam}<a class="bodycam-link" href={release.bodycam.browser_download_url}>Bodycam engine <span>OPTIONAL · DX11-AVX</span></a>{/if}{:else}<p>Downloads are being prepared. <a href="#downloads">View releases</a></p>{/if}{:catch error}<p class="muted">{error.message} <a href="#downloads">Open Downloads</a></p>{/await}
 </section>
 <section class="mechanics" aria-labelledby="mechanics-heading">
  <div class="section-heading"><div><p class="field-eyebrow">BUILT AROUND YOUR GEAR</p><h2 id="mechanics-heading">Less digging. More doing.</h2></div><a class="text-link" href="#introduction">Explore the mechanics <span aria-hidden="true">↗</span></a></div>
  <div class="feature-grid">{#each features as feature}<article class="feature-card"><div class="feature-top"><span>{feature.n}</span><span aria-hidden="true">+</span></div><div class="feature-image"><img src={'assets/gameplay/'+feature.image} alt={feature.alt} loading="lazy"></div><div class="feature-copy"><h3>{feature.title}</h3><p>{feature.text}</p></div></article>{/each}</div>
 </section>
 <section class="workbench-callout" aria-labelledby="workbench-heading"><div class="workbench-mark" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><div class="workbench-copy"><p class="field-eyebrow">THE ZONEBENCH EDITOR</p><h2 id="workbench-heading">Make room for your ideas.</h2><p>Adjust layouts, prices and crafting. Build your own rigs, containers and pouches, then export them for your game.</p></div><div class="workbench-actions"><a class="field-button primary" href="#editor/rigs">Open the editor <span aria-hidden="true">↗</span></a><a class="text-link" href="#community">Browse community add-ons →</a></div></section>
 <footer class="field-footer"><div><strong>ZONEBENCH</strong><span>A community project by Fomok</span></div><nav aria-label="Footer"><a href="#help">Installation & help</a><a href="#patch-notes">Patch notes</a><a href="#community">Community</a></nav><span class="footer-tag">PACK WITH PURPOSE.</span></footer>
</div>
<style>
 :global(body.home-page){--bg:#101923;--panel:#1c2a36;--panel2:#253846;--line:#304450;--ink:#e8ece8;--dim:#a1b2bc;--faint:#889da9;--hot:#75b7ad;--hot2:#d5be92;background:var(--bg)}
 :global(body.home-page .site-header){background:#101923;border-color:#293c48}
 :global(body.home-page .brand){color:#e8ece8}
 :global(body.home-page .brand small){color:#889da9}
 :global(body.home-page #site-nav a){color:#a1b2bc}
 :global(body.home-page #site-nav a.active),:global(body.home-page #site-nav a:hover){color:#8ecfc3}
 :global(body.home-page #site-nav a.active){border-bottom-color:#75b7ad}
 :global(body.home-page #site-nav a.has-update){background:#21333c;border-color:#3e5960;color:#d5be92}
 :global(body.home-page .patch-new){background:#d5be92;color:#101923;margin-left:7px}
 :global(body.home-page .preview-notice){background:#162630;border-color:#2b414b;color:#97abb5}
 :global(body.home-page .preview-notice a){color:#a4cfc7}
 :global(body.home-page #pane){background:#101923;padding:0}
 .field-home{max-width:1600px;margin:auto;padding:0 4.2%;color:#e8ece8;font-family:'Segoe UI',sans-serif}
 .field-home a{text-decoration:none}.field-home a:focus-visible{outline:2px solid #d5be92;outline-offset:5px}
 .field-hero{display:grid;grid-template-columns:1fr 1.08fr;gap:6%;align-items:center;padding:54px 0 44px;min-height:580px}
 .field-eyebrow{font-size:10px;font-weight:600;letter-spacing:.15em;color:#d5be92;line-height:1.8;margin:0 0 20px;display:block}
 .hero-copy>.field-eyebrow{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:9px;letter-spacing:.1em}
 .status-dot{width:6px;height:6px;background:#75b7ad;border-radius:50%;display:inline-block;margin-right:4px}.stalker{color:#e8ece8}.gamma{color:#75b7ad}
 h1{font-family:'Bahnschrift','Arial Narrow',sans-serif!important;font-stretch:condensed;font-size:clamp(37px,4.3vw,72px)!important;letter-spacing:-.05em!important;line-height:1.05!important;margin:0 0 22px!important;white-space:nowrap;color:#e8ece8}
 .hero-tagline{font-size:clamp(18px,1.7vw,26px);font-weight:550;line-height:1.4;margin:0 0 20px;color:#c9d9dc}
 .hero-description{font-size:16px;line-height:1.8;color:#a1b2bc;margin:0 0 28px;max-width:460px}
 .field-actions{display:flex;gap:12px;flex-wrap:wrap}.field-button{display:inline-flex;align-items:center;justify-content:center;gap:18px;min-height:46px;padding:12px 20px;border:1px solid transparent;border-radius:5px;font-size:13px;font-weight:600;transition:background .15s,border-color .15s}
 .field-button.primary{background:#75b7ad;color:#102322}.field-button.primary:hover{background:#92cabe}.field-button.quiet{color:#dce5e5;background:transparent;border-color:#3a515e}.field-button.quiet:hover,.field-button.secondary:hover{background:#2b414c;border-color:#75b7ad}.field-button.secondary{background:#233541;color:#e8ece8;border-color:#39515e}
 .hero-footnote{display:flex;gap:20px;color:#879ca8;font-size:9px;letter-spacing:.15em;margin-top:34px}.hero-footnote span+span{border-left:1px solid #3a4f5b;padding-left:20px}
 .inventory-frame{margin:0;background:#182630;border:1px solid #3b515b;border-radius:8px;overflow:hidden;box-shadow:0 20px 60px #060d143d;transform:rotate(.6deg)}
 .frame-bar{padding:13px 17px;display:flex;justify-content:space-between;color:#91a7b2;font-size:9px;letter-spacing:.13em;border-bottom:1px solid #344b57}.frame-bar>span:first-child{color:#b6d7d0}.frame-bar i{display:inline-block;background:#75b7ad;width:5px;height:5px;margin-right:7px}
 .inventory-image{background:#0d141b;padding:10px;line-height:0}.inventory-image img{display:block;width:100%;height:auto;max-height:510px;object-fit:contain}
 figcaption{display:flex;justify-content:space-between;align-items:center;padding:10px 17px;font-size:11px;color:#a1b2bc}.frame-plus{color:#d5be92;font-size:18px}
 .release-strip{display:flex;align-items:center;gap:28px;flex-wrap:wrap;border:1px solid #304752;background:#1b2b36;padding:24px 28px;border-radius:7px}
 .release-label{min-width:190px}.release-label .field-eyebrow{margin:0 0 5px;font-size:9px;color:#86bdb4}.release-label strong{font-size:18px;letter-spacing:-.03em}.release-caption{color:#a1b2bc;font-size:12px;line-height:1.8;margin:0;flex:1}.release-caption a{color:#d5be92}.release-links{display:flex;gap:10px}.release-links .field-button{min-height:40px;padding:9px 16px;font-size:12px}.bodycam-link{border-left:1px solid #3a515b;padding-left:24px;color:#b5d9d3;font-size:12px}.bodycam-link span{display:block;font-size:8px;color:#91a7b2;letter-spacing:.1em;margin-top:6px}.muted{color:#a1b2bc}
 .mechanics{padding:64px 0}.section-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:26px;gap:20px}.section-heading .field-eyebrow{margin-bottom:10px;font-size:9px}h2{font-size:30px;letter-spacing:-.025em;margin:0;color:#e8ece8;font-weight:600}.text-link{font-size:12px;color:#9bcac1}.text-link:hover{color:#d5be92}
 .feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.feature-card{background:#172530;border:1px solid #2d4350;border-radius:7px;overflow:hidden}.feature-top{display:flex;justify-content:space-between;padding:15px 20px;color:#8faab5;font-size:10px;letter-spacing:.12em}.feature-top span:last-child{color:#d5be92}
 .feature-image{height:155px;margin:0 18px;background:#0f1a22;display:flex;align-items:center;justify-content:center;border:1px solid #2a3c46;border-radius:3px;overflow:hidden}.feature-image img{max-width:94%;max-height:90%;object-fit:contain}.feature-copy{padding:22px}.feature-copy h3{font-size:17px;color:#e8ece8;margin:0 0 10px;font-weight:600}.feature-copy p{font-size:13px;line-height:1.8;color:#9eafb9;margin:0}
 .workbench-callout{display:flex;align-items:center;gap:28px;padding:34px;background:#21343d;border:1px solid #3c575d;border-radius:7px}.workbench-copy{flex:1}.workbench-copy .field-eyebrow{margin-bottom:9px;font-size:9px}.workbench-copy h2{font-size:26px}.workbench-copy p:last-child{max-width:550px;font-size:13px;line-height:1.8;color:#b1c2c8;margin:14px 0 0}.workbench-actions{display:flex;flex-direction:column;gap:17px;text-align:center}
 .workbench-mark{width:76px;min-width:76px;height:88px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:4px;transform:rotate(-5deg)}.workbench-mark span{border:1px solid #75b7ad;background:#75b7ad15;border-radius:2px}.workbench-mark span:first-child{grid-column:span 2}.workbench-mark span:nth-child(2){grid-row:span 2}.workbench-mark span:nth-child(3){grid-row:span 2}.workbench-mark span:nth-child(5){grid-column:span 2;background:#75b7ad35}
 .field-footer{display:flex;justify-content:space-between;gap:25px;align-items:center;margin-top:56px;padding:25px 0 32px;border-top:1px solid #293d49;color:#839aa7;font-size:10px}.field-footer>div{display:flex;flex-direction:column;gap:6px}.field-footer strong{color:#cad8dc;font-size:11px;letter-spacing:.2em}.field-footer nav{gap:22px;margin:0}.field-footer a{color:#9cb3bd}.footer-tag{color:#d5be92;font-size:8px;letter-spacing:.18em}
 @media(min-width:1600px){.field-hero{gap:8%;padding:70px 0}.inventory-image img{max-height:560px}}
 @media(max-width:1000px){.field-hero{gap:4%;min-height:0;padding-top:38px}.hero-copy>.field-eyebrow{font-size:8px}.field-actions{gap:8px}.field-button{padding:11px 14px;gap:10px}.hero-description{font-size:14px}.hero-footnote{gap:10px;font-size:8px}.hero-footnote span+span{padding-left:10px}.release-strip{gap:18px;padding:20px}.bodycam-link{border-left:0;padding-left:0}.workbench-mark{display:none}.feature-grid{gap:12px}.feature-copy{padding:18px}.feature-copy h3{font-size:16px}.feature-image{height:120px;margin:0 12px}.footer-tag{display:none}}
 @media(max-width:700px){.field-home{padding:0 20px}.field-hero{grid-template-columns:1fr;gap:32px;padding:35px 0}.hero-copy{padding:0}.hero-copy>.field-eyebrow{font-size:8px}h1{font-size:clamp(32px,8vw,53px)!important}.hero-description br{display:none}.hero-footnote{margin-top:25px}.inventory-frame{transform:none}.inventory-image img{max-height:460px}.release-strip{align-items:flex-start}.release-label{width:100%}.release-caption{min-width:180px}.release-links{width:100%}.release-links a{flex:1}.section-heading{align-items:flex-start;flex-direction:column}.mechanics{padding:40px 0}.feature-grid{grid-template-columns:1fr}.feature-image{height:175px}.feature-copy{padding:20px}.feature-copy h3{font-size:18px}.workbench-callout{align-items:stretch;flex-direction:column;padding:24px}.workbench-actions{align-items:flex-start}.field-footer{align-items:flex-start;flex-direction:column}.field-footer nav{flex-wrap:wrap;gap:18px}h2{font-size:27px}}
 @media(prefers-reduced-motion:reduce){.field-button{transition:none}}
</style>

