<script>
 import EquipmentDoodle from '../components/EquipmentDoodle.svelte';
 import {untrack,onMount} from 'svelte';
 import {loadIngredients} from '../lib/gamma-ingredients.mjs';
 onMount(()=>{loadIngredients().catch(()=>{});});
 let {create=false,flow}=$props();
 const pictures=untrack(()=>flow.pictures());
 let drafts=$state(untrack(()=>flow.drafts())),removedName=$state('');
 function removeDraft(draft){if(flow.removeDraft(draft.kind,draft.id)){removedName=draft.name;drafts=flow.drafts();}}
 const types=[['rigs','Chest rig','Keep essentials close.','Arrange pockets for your equipped loadout.'],['boxes','Container','Give supplies a home.','Choose its storage space and what goes inside.'],['pouches','Expansion pouch','Make a little more room.','Add extra pockets to an equipped rig.'],['packs','Backpack','Carry a different load.','Choose how much inventory space it provides.']];
</script>
<section class="editor-hub">
 <div class="flow-breadcrumb"><button onclick={()=>window.Site.go(create?'editor':'home')}>← {create?'Editor':'Home'}</button><span>WORKBENCH / {create?'CREATE':'START HERE'}</span></div>
 <div class="flow-heading"><p class="flow-kicker">YOUR EQUIPMENT. YOUR CHOICE.</p><h1>{create?'What are you making?':'Make it your own.'}</h1><p>{create?'Choose an item type. We’ll walk you through the rest.':'Tune the equipment you already use, or build something of your own.'}</p></div>
 {#if !create}
 <div class="editor-paths">
  <button class="path-card" onclick={()=>window.Site.go('editchoice')}>
   <div class="path-art edit-art" aria-hidden="true"><div class="art-grid"></div>{#if pictures.rigs}<img src={pictures.rigs} alt=""/>{/if}<svg class="cut-guide" viewBox="0 0 240 145"><rect class="cut-line" x="64" y="7" width="106" height="128" rx="9" transform="rotate(-8 117 71)"/><g class="cut-scissors" transform="translate(173 92) rotate(-98) translate(-15 -16)"><circle cx="0" cy="7" r="6"/><circle cx="0" cy="25" r="6"/><path d="M5 10L36 31M5 22L36 1"/><circle cx="15" cy="16" r="2"/></g></svg><span class="art-coordinate">02 × 03</span></div>
   <div class="path-copy"><span class="fabric-label">CUSTOMIZE</span><h2>Edit existing items</h2><p>Adjust layouts, prices, recipes and textures in your current mod setup.</p><span class="path-action">Open item editor <span>↗</span></span></div>
  </button>
  <button class="path-card creation" onclick={()=>window.Site.go('create')}>
   <div class="path-art new-art" aria-hidden="true"><div class="art-grid"></div><div class="creation-doodle"><EquipmentDoodle kind="rigs"/><svg class="doodle-pencil" viewBox="0 0 35 95"><path d="M10 8Q17 4 24 9L22 65L15 85L7 66ZM9 18L23 19M8 65L22 66M15 21L14 61M12 77L15 85L18 77"/></svg></div><span class="art-coordinate">YOUR NEXT ADDITION</span></div>
   <div class="path-copy"><span class="fabric-label">CREATE</span><h2>Create a new item</h2><p>Build a rig, container, pouch or backpack. Export it as its own add-on.</p><span class="path-action">Choose an item type <span>↗</span></span></div>
  </button>
 </div>
 {:else}
 <div class="item-type-cards">{#each types as [kind,title,tagline,description]}
  <button class="type-card" onclick={()=>flow.create(kind)}><div class="type-art" aria-hidden="true"><EquipmentDoodle {kind}/></div><span class="fabric-label">{title}</span><h2>{tagline}</h2><p>{description}</p><span class="path-action">Create {title.toLowerCase()} <span>↗</span></span></button>
 {/each}</div>
 {/if}
 {#if drafts.length}<section class="draft-section"><div><h2>Continue a new item</h2><p>Your unfinished work stays in this browser.</p></div><div class="draft-items">{#each drafts as draft}<div class="draft-card"><button class="draft-open" onclick={()=>flow.open(draft.kind,draft.id)}>{#if draft.icon}<img src={draft.icon} alt=""/>{:else}<span class="draft-placeholder">+</span>{/if}<span><strong>{draft.name}</strong><small>{types.find(x=>x[0]===draft.kind)?.[1]}</small></span><span>→</span></button><button class="draft-remove" aria-label={`Remove draft ${draft.name}`} onclick={()=>removeDraft(draft)}>Remove</button></div>{/each}</div><button class="flow-link" onclick={()=>window.Site.go('addonexport')}>Export selected new items together →</button></section>{/if}
 {#if removedName}<div class="draft-removal" role="status"><span>Removed “{removedName}” from this project.</span><button class="flow-link" onclick={()=>flow.undoRemoval()}>Undo</button></div>{/if}
 <p class="flow-footnote">Your edits are saved in this browser. Use <strong>Save project</strong> inside the editor to keep a backup.</p>
</section>
