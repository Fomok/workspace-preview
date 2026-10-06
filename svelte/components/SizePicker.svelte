<script>
 let {width=2,height=2,changed}=$props();
</script>
<div class="size-picker">
 <div class="size-width"><button aria-label="Decrease item width" disabled={width<=1} onclick={()=>changed(width-1,height)}>←</button><output aria-label="Item width">{width}</output><button aria-label="Increase item width" disabled={width>=20} onclick={()=>changed(width+1,height)}>→</button><small>wide</small></div>
 <div class="size-height"><button aria-label="Increase item height" disabled={height>=20} onclick={()=>changed(width,height+1)}>↑</button><output aria-label="Item height">{height}</output><button aria-label="Decrease item height" disabled={height<=1} onclick={()=>changed(width,height-1)}>↓</button><small>tall</small></div>
 <div class="size-grid" style:grid-template-columns={`repeat(${width},minmax(0,1fr))`} style:width={`${Math.min(320,width*36)}px`} style:aspect-ratio={`${width}/${height}`} aria-label={`Item occupies ${width} columns and ${height} rows`}>{#each Array.from({length:width*height}) as _}<span></span>{/each}</div>
</div>
