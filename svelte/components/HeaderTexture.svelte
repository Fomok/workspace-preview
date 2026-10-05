<script>
 let {kind='tab',selected=false}=$props();
 const image=import.meta.env.BASE_URL+'assets/field-kit/header-atlas.png';
 const rects={name:[48,110,1158,207],version:[50,388,1155,177],tab:[52,636,1151,214],selected:[52,915,1151,208]};
 let rect=$derived(rects[kind==='tab'&&selected?'selected':kind]);
 let slices=$derived.by(()=>{const [x,y,w,h]=rect;const xs=[x,x+32,x+w-32],ys=[y,y+32,y+h-32],ws=[32,w-64,32],hs=[32,h-64,32];return ys.flatMap((v,j)=>xs.map((u,i)=>[u,v,ws[i],hs[j]].join(' ')));});
</script>
{#if kind==='tab'}<span class="texture sliced" aria-hidden="true">{#each slices as view}<svg viewBox={view} preserveAspectRatio="none"><image href={image} width="1254" height="1254"/></svg>{/each}</span>
{:else}<svg class="texture" aria-hidden="true" viewBox={rect.join(' ')} preserveAspectRatio="none"><image href={image} width="1254" height="1254"/></svg>{/if}
<style>
 .texture{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
 .sliced{display:grid;grid-template-columns:6px minmax(0,1fr) 6px;grid-template-rows:6px minmax(0,1fr) 6px}
 .sliced svg{display:block;width:100%;height:100%;min-width:0;min-height:0}
</style>
