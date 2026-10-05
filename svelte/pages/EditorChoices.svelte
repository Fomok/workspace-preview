<script>
 import {untrack} from 'svelte';
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
   <div class="path-art edit-art" aria-hidden="true"><div class="art-grid"></div>{#if pictures.rigs}<img src={pictures.rigs} alt=""/>{/if}<span class="art-tool">✎</span><span class="art-coordinate">02 × 03</span></div>
   <div class="path-copy"><span class="fabric-label">CUSTOMIZE</span><h2>Edit existing items</h2><p>Adjust layouts, prices, recipes and textures in your current mod setup.</p><span class="path-action">Open item editor <span>↗</span></span></div>
  </button>
  <button class="path-card creation" onclick={()=>window.Site.go('create')}>
   <div class="path-art new-art" aria-hidden="true"><div class="art-grid"></div><div class="empty-shape"><span>+</span></div><span class="art-coordinate">YOUR NEXT ADDITION</span></div>
   <div class="path-copy"><span class="fabric-label">CREATE</span><h2>Create a new item</h2><p>Build a rig, container, pouch or backpack. Export it as its own add-on.</p><span class="path-action">Choose an item type <span>↗</span></span></div>
  </button>
 </div>
 {:else}
 <div class="item-type-cards">{#each types as [kind,title,tagline,description]}
  <button class="type-card" onclick={()=>flow.create(kind)}><div class="type-art" aria-hidden="true">{#if pictures[kind]}<img src={pictures[kind]} alt=""/>{:else}<svg viewBox="0 0 100 110"><path d="M34 25V15h32v10M23 35q0-12 12-12h30q12 0 12 12v55q0 10-10 10H33q-10 0-10-10zM23 51h54M32 64h36v25H32zM15 42v42M85 42v42" fill="none" stroke="currentColor" stroke-width="3"/></svg>{/if}</div><span class="fabric-label">{title}</span><h2>{tagline}</h2><p>{description}</p><span class="path-action">Create {title.toLowerCase()} <span>↗</span></span></button>
 {/each}</div>
 {/if}
 {#if drafts.length}<section class="draft-section"><div><h2>Continue a new item</h2><p>Your unfinished work stays in this browser.</p></div><div class="draft-items">{#each drafts as draft}<button onclick={()=>flow.open(draft.kind,draft.id)}>{#if draft.icon}<img src={draft.icon} alt=""/>{:else}<span class="draft-placeholder">+</span>{/if}<span><strong>{draft.name}</strong><small>{types.find(x=>x[0]===draft.kind)?.[1]}</small></span><span>→</span></button>{/each}</div><button class="flow-link" onclick={()=>window.Site.go('addonexport')}>Export selected new items together →</button></section>{/if}
 <p class="flow-footnote">Your edits are saved in this browser. Use <strong>Save project</strong> inside the editor to keep a backup.</p>
</section>
