<script>
 let {entries=[],title='Add-on preview'}=$props();
</script>
<div class="gear-cover" class:single={entries.length===1} aria-label={title}>{#each entries.slice(0,4) as entry}<div>{#if entry.item.icon}<img src={entry.item.icon} alt={entry.item.name||'Item'} loading="lazy"/>{:else}<span>◇</span>{/if}</div>{/each}{#if !entries.length}<span class="gear-placeholder">◇</span>{/if}</div>
