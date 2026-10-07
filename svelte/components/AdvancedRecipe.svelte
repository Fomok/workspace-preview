<script>
 import {untrack} from 'svelte';
 import RecipeBuilder from './RecipeBuilder.svelte';
 import DismantleBuilder from './DismantleBuilder.svelte';
 import RepairBuilder from './RepairBuilder.svelte';
 let {source,kind,mode,changed}=$props();
 let item=$state(untrack(()=>JSON.parse(JSON.stringify(source))));
 const fields=untrack(()=>mode==='repair'?['parts','repair','repairBonus']:mode==='yield'?['yield']:['craft','recipeDependencies']);
 function save(){const snapshot=$state.snapshot(item);for(const key of fields){if(key in snapshot)source[key]=snapshot[key];else delete source[key];}changed();}
</script>
<div class="advanced-recipe builder-panel">
 {#if mode==='repair'}<RepairBuilder {item} flow={window.EditorFlow} changed={save}/>
 {:else if mode==='yield'}<DismantleBuilder {item} changed={save}/>
 {:else}<RecipeBuilder {item} {kind} flow={window.EditorFlow} changed={save}/>{/if}
</div>


