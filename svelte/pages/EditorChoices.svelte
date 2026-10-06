<script>
 import {untrack,onMount} from 'svelte';
 import {loadIngredients} from '../lib/gamma-ingredients.mjs';
 onMount(()=>{loadIngredients().catch(()=>{});});
 let {create=false,flow}=$props();
 const pictures=untrack(()=>flow.pictures()),drafts=untrack(()=>flow.drafts());
 const types=[['rigs','Chest rig','Keep essentials close.','Arrange pockets for your equipped loadout.'],['boxes','Container','Give supplies a home.','Choose its storage space and what goes inside.'],['pouches','Expansion pouch','Make a little more room.','Add extra pockets to an equipped rig.'],['packs','Backpack','Carry a different load.','Choose how much inventory space it provides.']];
</script>
<section class="editor-hub">
 <div class="flow-breadcrumb"><button onclick={()=>window.Site.go(create?'editor':'home')}>← {create?'Editor':'Home'}</button><span>WORKBENCH / {create?'CREATE':'START HERE'}</span></div>
 <div class="flow-heading"><p class="flow-kicker">YOUR EQUIPMENT. YOUR CHOICE.</p><h1>{create?'What are you making?':'Make it your own.'}</h1><p>{create?'Choose an item type. We’ll walk you through the rest.':'Tune the equipment you already use, or build something of your own.'}</p></div>
 {#if !create}
 <div class="editor-paths">
  <button class="path-card" onclick={()=>window.Site.go('rigs')}>
   <div class="path-art edit-art" aria-hidden="true"><div class="art-grid"></div>{#if pictures.rigs}<img src={pictures.rigs} alt=""/>{/if}<svg class="cut-guide" viewBox="0 0 240 145"><rect class="cut-line" x="64" y="7" width="106" height="128" rx="9" transform="rotate(-8 117 71)"/><g class="cut-scissors" transform="translate(167 90) rotate(-22)"><circle cx="0" cy="7" r="6"/><circle cx="0" cy="25" r="6"/><path d="M5 10L36 31M5 22L36 1"/><circle cx="15" cy="16" r="2"/></g></svg><span class="art-coordinate">02 × 03</span></div>
   <div class="path-copy"><span class="fabric-label">CUSTOMIZE</span><h2>Edit existing items</h2><p>Adjust layouts, prices, recipes and textures in your current mod setup.</p><span class="path-action">Open item editor <span>↗</span></span></div>
  </button>
  <button class="path-card creation" onclick={()=>window.Site.go('create')}>
   <div class="path-art new-art" aria-hidden="true"><div class="art-grid"></div><svg class="creation-drawing" viewBox="0 0 280 145" aria-hidden="true">
 <g class="draft-guides"><path d="M67 17v112M201 17v112M57 120h154M78 8h112"/><path d="M62 24h10M62 106h10M85 115v10M184 115v10"/></g>
 <g class="draft-gear"><path d="M101 48L93 15l15-5 17 36M162 46l17-36 15 6-12 32M87 48q48-13 96 0l5 59q-51 17-106 0z"/><path d="M91 55l4 41h23l2-43M128 51v47h24V51M160 53l1 43h20l-2-41M94 68h24M129 65h22M162 68h17"/><path class="draft-stitch" d="M88 103q48 13 94 0M98 18l14 28M184 18l-16 29"/></g>
 <g class="draft-pencil" transform="translate(205 65) rotate(32)"><path d="M0 0h10v44L5 57 0 44z"/><path d="M0 8h10M0 44h10M5 9v34"/><path d="M3 51l2 6 2-6"/></g>
 </svg><span class="art-coordinate">YOUR NEXT ADDITION</span></div>
   <div class="path-copy"><span class="fabric-label">CREATE</span><h2>Create a new item</h2><p>Build a rig, container, pouch or backpack. Export it as its own add-on.</p><span class="path-action">Choose an item type <span>↗</span></span></div>
  </button>
 </div>
 {:else}
 <div class="item-type-cards">{#each types as [kind,title,tagline,description]}
  <button class="type-card" onclick={()=>flow.create(kind)}><div class="type-art" aria-hidden="true"><svg class="item-sketch" viewBox="0 0 130 130">
 <g class="sketch-guides"><path d="M12 15v100M118 15v100M8 112h114M23 10h84"/><path d="M8 25h8M8 99h8M27 108v8M103 108v8"/></g>
 <g class="sketch-outline">
 {#if kind==='rigs'}
 <path d="M34 48L26 18l13-5 15 32M78 45l15-32 13 5-9 30M25 49q39-12 78 0l4 52q-41 15-85 0z"/>
 <path d="M30 55l3 34h18l2-36M59 52v39h19V52M85 54v36h16l-2-35M32 67h20M59 65h19M85 67h15"/>
 <path class="sketch-seam" d="M29 99q35 10 71 0M32 21l12 24M99 21L87 45"/>
 {:else if kind==='boxes'}
 <path d="M17 49l24-19h62l12 15v50l-25 15H23zM17 49h73l25-4M90 49v61M23 60h66M96 57l13-6M46 30v-9h29v9M50 29v-5h21v5"/>
 <path d="M34 53h11v15H34zM69 53h11v15H69zM38 58h3M73 58h3M46 84h25v13H46z"/>
 <path class="sketch-seam" d="M28 75v25h9M79 99h5V75M97 67v29l10-6"/>
 {:else if kind==='pouches'}
 <path d="M39 36V23h15v13M76 36V23h15v13M29 40q36-8 72 0v59q-36 10-72 0zM29 40l10 26h52l10-26M57 62h16v20H57zM62 67h6v10h-6z"/>
 <path class="sketch-seam" d="M35 74v20q30 7 60 0V74M39 48h51M44 27v8M81 27v8"/>
 {:else}
 <path d="M49 27v-9h32v9M36 38q0-12 13-12h32q13 0 13 12v61q0 10-11 10H47q-11 0-11-10zM36 49q29 8 58 0M43 64h44v34H43zM27 55h9v42h-9zM94 55h9v42h-9zM45 33q20-5 40 0"/>
 <path d="M44 71h42M76 71v9M50 40v11M80 40v11"/>
 <path class="sketch-seam" d="M48 84v9h33V84M42 58v-4M88 58v-4M42 102h46"/>
 {/if}
 </g></svg></div><span class="fabric-label">{title}</span><h2>{tagline}</h2><p>{description}</p><span class="path-action">Create {title.toLowerCase()} <span>↗</span></span></button>
 {/each}</div>
 {/if}
 {#if drafts.length}<section class="draft-section"><div><h2>Continue a new item</h2><p>Your unfinished work stays in this browser.</p></div><div class="draft-items">{#each drafts as draft}<button onclick={()=>flow.open(draft.kind,draft.id)}>{#if draft.icon}<img src={draft.icon} alt=""/>{:else}<span class="draft-placeholder">+</span>{/if}<span><strong>{draft.name}</strong><small>{types.find(x=>x[0]===draft.kind)?.[1]}</small></span><span>→</span></button>{/each}</div><button class="flow-link" onclick={()=>window.Site.go('addonexport')}>Export selected new items together →</button></section>{/if}
 <p class="flow-footnote">Your edits are saved in this browser. Use <strong>Save project</strong> inside the editor to keep a backup.</p>
</section>
