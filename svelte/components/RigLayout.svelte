<script>
 import {dimensions,fits,movedPocket,slotCounts,pocketShapes} from '../lib/builder-layout.mjs';
 let {item,changed}=$props();
 let shape=$state('2x2'),selected=$state(-1),grid,drag=$state(null),message=$state(''),skipClick=false;
 function commit(pins){item.pins=pins;item.slots=slotCounts(pins);changed();message='';}
 function place(col,row){if(selected>=0){const pins=movedPocket(item.pins,selected,col,row,item.band,item.rows||6);if(pins){commit(pins);selected=-1;}else message='That position overlaps another pocket or extends beyond the layout.';return;}if(fits(item.pins,shape,col,row,item.band,item.rows||6))commit([...item.pins,{kind:shape,col,row}]);else message='There is not enough free space for that pocket.';}
 function start(e,i){if(e.button!==0)return;const rect=grid.getBoundingClientRect();drag={index:i,x:e.clientX,y:e.clientY,col:item.pins[i].col,row:item.pins[i].row,left:rect.left+9,top:rect.top+9,offsetX:Math.floor((e.clientX-rect.left-9)/35)-item.pins[i].col+1,offsetY:Math.floor((e.clientY-rect.top-9)/35)-item.pins[i].row+1,moved:false};selected=i;}
 function move(e){if(!drag)return;drag={...drag,moved:drag.moved||Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>5,col:Math.floor((e.clientX-drag.left)/35)+1-drag.offsetX,row:Math.floor((e.clientY-drag.top)/35)+1-drag.offsetY};}
 function end(){if(!drag)return;if(drag.moved){const pins=movedPocket(item.pins,drag.index,drag.col,drag.row,item.band,item.rows||6);if(pins)commit(pins);else message='Pocket kept in place: the destination is occupied or outside the layout.';skipClick=true;}drag=null;}
 function key(e,i){const offset={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!offset)return;e.preventDefault();const p=item.pins[i],pins=movedPocket(item.pins,i,p.col+offset[0],p.row+offset[1],item.band,item.rows||6);if(pins)commit(pins);}
 function resize(e,axis){const min=Math.max(1,...item.pins.map(p=>p[axis==='band'?'col':'row']+dimensions(p.kind)[axis==='band'?'w':'h']-1));item[axis]=Math.max(min,Math.min(axis==='band'?16:20,Number(e.currentTarget.value)||min));changed();}
</script>
<svelte:window onpointermove={move} onpointerup={end} onpointercancel={()=>drag=null}/>
<p>Drag pockets to move them. You can also select a pocket and click its new position, or use the arrow keys. Select a shape to add another pocket.</p>
<div class="two-fields"><label>Layout width<input type="number" min="1" max="16" value={item.band} onchange={e=>resize(e,'band')}/></label><label>Layout height<input type="number" min="1" max="20" value={item.rows||6} onchange={e=>resize(e,'rows')}/></label></div>
<div class="pocket-palette">{#each pocketShapes as s}<button class:selected={shape===s&&selected<0} onclick={()=>{shape=s;selected=-1;}}>{dimensions(s).w} × {dimensions(s).h}</button>{/each}</div>
<div class="layout-scroll"><div bind:this={grid} class="builder-grid" style:grid-template-columns={`repeat(${item.band},32px)`}>
{#each Array.from({length:(item.rows||6)*item.band}) as _,i}{@const col=i%item.band+1}{@const row=Math.floor(i/item.band)+1}<button class="empty-cell" style:grid-column={col} style:grid-row={row} aria-label={`Column ${col}, row ${row}`} onclick={()=>place(col,row)}></button>{/each}
{#each item.pins as p,i}{@const d=dimensions(p.kind)}<button class={`storage-pocket pocket-tone-${i%6}`} class:pocket-selected={selected===i} style:grid-column={`${p.col} / span ${d.w}`} style:grid-row={`${p.row} / span ${d.h}`} aria-label={`Pocket ${i+1}, ${d.w} by ${d.h}, column ${p.col}, row ${p.row}`} onpointerdown={e=>start(e,i)} onkeydown={e=>key(e,i)} onclick={()=>{if(skipClick){skipClick=false;return;}selected=i;}}><span class="pocket-number">{i+1}</span><span>{d.w}×{d.h}</span></button>{/each}
{#if drag?.moved}{@const d=dimensions(item.pins[drag.index].kind)}<div class="pocket-destination" class:invalid={!fits(item.pins,item.pins[drag.index].kind,drag.col,drag.row,item.band,item.rows||6,drag.index)} style:left={`${8+(drag.col-1)*35}px`} style:top={`${8+(drag.row-1)*35}px`} style:width={`${d.w*35-3}px`} style:height={`${d.h*35-3}px`}></div>{/if}
</div></div>
{#if selected>=0}<div class="pocket-tools"><span>Pocket {selected+1} selected</span><button onclick={()=>{commit(item.pins.filter((_,i)=>i!==selected));selected=-1;}}>Remove pocket</button><button onclick={()=>selected=-1}>Deselect</button></div>{/if}
{#if message}<p class="builder-error" role="status">{message}</p>{/if}
