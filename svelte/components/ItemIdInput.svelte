<script>
 import {validItemId} from '../lib/item-id.mjs';
 let {value='',label='Item ID',commit,add=false,disabled=false}=$props();
 let draft=$state(''),error=$state('');
 $effect(()=>{draft=value;error='';});
 function save(){const id=draft.trim();if(!validItemId(id)){error='Use a lowercase item section ID starting with a letter, followed by letters, numbers or underscores.';return;}const result=commit(id);if(result===false){error='This ID is already used here or cannot be added.';return;}error='';if(add)draft='';}
</script>
<div class="manual-id"><label>{label}<input aria-invalid={!!error} spellcheck="false" {disabled} bind:value={draft} placeholder="e.g. sewing_thread" onkeydown={e=>{if(e.key==='Enter'){e.preventDefault();save();}}} onblur={()=>{if(!add&&draft!==value)save();}}/></label>{#if add}<button type="button" {disabled} onclick={save}>Add ID</button>{/if}</div>
{#if error}<p class="builder-error" role="alert">{error}</p>{/if}
<style>.manual-id{display:flex;gap:12px;align-items:end;min-width:0}.manual-id label{flex:1;min-width:0}.manual-id input{width:100%;min-height:42px;box-sizing:border-box}.manual-id button{min-height:42px;white-space:nowrap}</style>
