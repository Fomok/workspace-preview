<script>
 import {grantedPockets,dimensions} from '../lib/builder-layout.mjs';
 let {item,changed}=$props();
 const shapes=['2x1','2x2','3x1'];
 function count(kind,delta){item.grants={...item.grants,[kind]:Math.max(0,Math.min(20,(Number(item.grants[kind])||0)+delta))};changed();}
</script>
<p>Choose how many of each pocket the pouch adds. The narrow pockets are vertical, just as they appear on a rig.</p>
<div class="grant-cards">{#each shapes as shape}{@const d=dimensions(shape)}<div class="grant-card"><div class="grant-shape" style:width={`${d.w*30}px`} style:height={`${d.h*30}px`} style:grid-template-columns={`repeat(${d.w},1fr)`}>{#each Array.from({length:d.w*d.h}) as _}<span></span>{/each}</div><strong>{shape.replace('x',' × ')}</strong><small>{d.w} wide · {d.h} tall</small><div class="count-controls"><button aria-label={`Fewer ${shape} pockets`} disabled={!item.grants[shape]} onclick={()=>count(shape,-1)}>−</button><output>{item.grants[shape]||0}</output><button aria-label={`More ${shape} pockets`} disabled={item.grants[shape]>=20} onclick={()=>count(shape,1)}>+</button></div></div>{/each}</div>
{#if item.grants['1x1']}<p class="builder-notice">This older draft also has {item.grants['1x1']} single-cell pockets. <button class="flow-link" onclick={()=>{item.grants['1x1']=0;changed();}}>Remove single-cell pockets</button></p>{/if}
<p class="builder-notice">{grantedPockets(item.grants).length} pockets added in total.</p>
