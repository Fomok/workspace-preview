<script>
 import {untrack} from 'svelte';
 let {flow}=$props();
 const initial=untrack(()=>flow.current());
 const kind=initial?.kind;
 let item=$state(initial?.item),step=$state(initial?.item.builderStep||0),error=$state(''),busy=$state(false),report=$state(initial?.item.builderStep===3?untrack(()=>flow.review()):null);
 let pocket=$state('2x2');
 const titles={rigs:'Chest rig',boxes:'Container',pouches:'Expansion pouch',packs:'Backpack'};
 const shapes=['1x1','2x1','3x1','2x2'];
 const rules=untrack(()=>flow.rules());
 function save(){flow.save($state.snapshot(item));error='';}
 function next(n){step=n;item.builderStep=n;save();if(n===3)report=flow.review();}
 function number(event,key,min=0,max=999999){item[key]=Math.max(min,Math.min(max,Number(event.currentTarget.value)||min));save();}
 async function image(event){const file=event.currentTarget.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4000000){error='Choose a PNG, JPEG or WebP image smaller than 4 MB.';return;}const reader=new FileReader();reader.onload=()=>{item.icon=reader.result;delete item.fit;save();};reader.onerror=()=>error='The image could not be read.';reader.readAsDataURL(file);}
 function cell(w,h){item.cellw=Math.max(1,Math.min(20,Number(w)||1));item.cellh=Math.max(1,Math.min(20,Number(h)||1));save();}
 function owner(col,row){return item.pins?.find(p=>{const [h,w]=p.kind.split('x').map(Number);return col>=p.col&&col<p.col+w&&row>=p.row&&row<p.row+h;});}
 function place(col,row){const old=owner(col,row);if(old)item.pins=item.pins.filter(p=>p!==old);else{const [h,w]=pocket.split('x').map(Number);if(col+w-1>item.band||row+h-1>(item.rows||6)){error='That pocket extends beyond the layout.';return;}for(let y=row;y<row+h;y++)for(let x=col;x<col+w;x++)if(owner(x,y)){error='Pockets cannot overlap.';return;}item.pins=[...(item.pins||[]),{kind:pocket,col,row}];}item.slots=Object.fromEntries(shapes.map(k=>[k,item.pins.filter(p=>p.kind===k).length]));save();}
 function size(event,axis){const [h,w]=(item.size||'10x7').split('x').map(Number);const value=Math.max(1,Math.min(30,Number(event.currentTarget.value)||1));item.size=axis==='w'?`${h}x${value}`:`${value}x${w}`;save();}
 async function download(){busy=true;error='';try{save();const result=await flow.download();const blob=await result.blob;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(item.name||'New item').replace(/[^a-z0-9 _-]/gi,'').trim()+' - Add-on.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){error=e.message;}finally{busy=false;}}
</script>
<section class="item-builder">
 <div class="flow-breadcrumb"><button onclick={()=>window.Site.go('create')}>← Item types</button><span>WORKBENCH / CREATE</span></div>
 {#if !item}<h1>Draft not found</h1><p>Open a saved project or start a new item.</p>
 {:else}
 <div class="flow-heading"><p class="flow-kicker">NEW {titles[kind]?.toUpperCase()}</p><h1>{item.name||'Your new item'}</h1><p>A few choices, a live preview, and your own add-on.</p></div>
 <nav class="builder-steps" aria-label="Item builder steps">{#each ['Appearance','Storage','Details','Review & download'] as title,i}<button aria-current={step===i?'step':undefined} onclick={()=>next(i)}><span>0{i+1}</span>{title}</button>{/each}</nav>
 <div class="builder-columns"><div class="builder-panel">
 {#if step===0}
 <h2>Give it an identity.</h2><p>Choose how your item looks and how much space it occupies in an inventory.</p>
 <label>Item name<input bind:value={item.name} oninput={save} maxlength="100"/></label>
 <label>Description <span class="builder-notice">Optional — a simple description is supplied if left empty.</span><textarea bind:value={item.descr} oninput={save}></textarea></label>
 <label>Item image<input type="file" accept="image/png,image/jpeg,image/webp" onchange={image}/></label>
 <div class="two-fields"><label>Icon width (cells)<input type="number" min="1" max="20" value={item.cellw} onchange={e=>cell(e.currentTarget.value,item.cellh)}/></label><label>Icon height (cells)<input type="number" min="1" max="20" value={item.cellh} onchange={e=>cell(item.cellw,e.currentTarget.value)}/></label></div>
 {:else if step===1}
 <h2>Make room for your gear.</h2>
 {#if kind==='rigs'}
 <p>Select a pocket shape and click an empty cell to place it. Click an existing pocket to remove it.</p>
 <div class="two-fields"><label>Layout width<input type="number" min="1" max="16" value={item.band} onchange={e=>number(e,'band',Math.max(1,...item.pins.map(p=>p.col+Number(p.kind.split('x')[1])-1)),16)}/></label><label>Layout height<input type="number" min="1" max="20" value={item.rows||6} onchange={e=>number(e,'rows',Math.max(1,...item.pins.map(p=>p.row+Number(p.kind.split('x')[0])-1)),20)}/></label></div>
 <div class="pocket-palette">{#each shapes as shape}<button class:selected={pocket===shape} onclick={()=>pocket=shape}>{shape.split('x').reverse().join(' × ')}</button>{/each}</div>
 <div class="builder-grid" style:grid-template-columns={`repeat(${item.band},32px)`}>{#each Array.from({length:(item.rows||6)*item.band}) as _,i}{@const col=i%item.band+1}{@const row=Math.floor(i/item.band)+1}{@const p=owner(col,row)}<button class:filled={!!p} aria-label={`Column ${col}, row ${row}${p?', remove pocket':', place pocket'}`} onclick={()=>place(col,row)}>{p&&p.col===col&&p.row===row?p.kind.split('x').reverse().join('×'):''}</button>{/each}</div>
 {:else if kind==='boxes'}
 <p>Set the inner storage space and choose which supplies belong inside.</p>
 <div class="two-fields"><label>Storage width<input type="number" min="1" max="20" value={item.inw} onchange={e=>number(e,'inw',1,20)}/></label><label>Storage height<input type="number" min="1" max="20" value={item.inh} onchange={e=>number(e,'inh',1,20)}/></label></div>
 <label>Allowed items<select bind:value={item.takes} onchange={save}><option value="any">Any item</option>{#each rules as rule}<option value={rule.id}>{rule.name}</option>{/each}</select></label>
 <label>Weight limit (kg)<input type="number" min="0" step="0.1" value={item.kg} onchange={e=>number(e,'kg')}/></label>
 <p class="builder-notice">For separate compartments or custom item rules, use the advanced editor below.</p>
 {:else if kind==='pouches'}
 <p>Choose how many extra pockets this pouch adds to an equipped rig. Dimensions are width × height.</p>
 <div class="two-fields">{#each shapes as shape}<label>{shape.split('x').reverse().join(' × ')} pockets<input type="number" min="0" max="20" value={item.grants[shape]||0} onchange={e=>{item.grants[shape]=Math.max(0,Math.min(20,Number(e.currentTarget.value)||0));save();}}/></label>{/each}</div>
 {:else}
 <p>Choose the size of the inventory grid this backpack provides.</p>
 <div class="two-fields"><label>Storage width<input type="number" min="1" max="30" value={item.size.split('x')[1]} onchange={e=>size(e,'w')}/></label><label>Storage height<input type="number" min="1" max="30" value={item.size.split('x')[0]} onchange={e=>size(e,'h')}/></label></div>
 {/if}
 {:else if step===2}
 <h2>Set the essentials.</h2><p>Choose a price and weight. Existing default crafting and availability settings are kept unless you change them in the advanced editor.</p>
 <div class="two-fields"><label>Price (RU)<input type="number" min="0" value={item.cost} onchange={e=>number(e,'cost')}/></label><label>Weight (kg)<input type="number" min="0" step="0.01" value={item.weight} onchange={e=>number(e,'weight')}/></label></div>
 {#if kind==='pouches'}<label>Loot tier<select bind:value={item.tier} onchange={save}>{#each [1,2,3,4,5] as tier}<option value={tier}>Tier {tier}</option>{/each}</select></label>{/if}
 {:else}
 <h2>Ready for the Zone?</h2><p>Your ZIP contains this item and its own texture. Install it below Squared Away in MO2 using the version with independent add-on support.</p>
 <dl class="builder-summary"><div><dt>Item</dt><dd>{item.name}</dd></div><div><dt>Type</dt><dd>{titles[kind]}</dd></div><div><dt>Inventory footprint</dt><dd>{item.cellw} × {item.cellh}</dd></div><div><dt>Price / weight</dt><dd>{item.cost} RU / {item.weight} kg</dd></div></dl>
 {#if report?.ok}<p class="builder-notice">Export checks passed. Your existing mod files are left intact.</p><button class="builder-main-action" disabled={busy} onclick={download}>{busy?'Preparing ZIP…':'Download item add-on'}</button><details><summary>Files included</summary><pre>{report.files.join('\n')}</pre></details>{:else}<p class="builder-error">{report?.error||'Complete the previous steps to prepare the export.'}</p>{/if}
 {/if}
 {#if error}<p class="builder-error" role="alert">{error}</p>{/if}
 <div class="builder-actions"><button onclick={()=>step?next(step-1):window.Site.go('create')}>{step?'Back':'Item types'}</button>{#if step<3}<button class="primary" onclick={()=>next(step+1)}>Continue →</button>{:else}<button onclick={()=>window.Site.go('create')}>Create another item</button>{/if}</div>
 <details><summary>Need more control?</summary><p>Fine-tune image fitting, crafting, trader availability, repair settings and custom layouts in the full editor. Return through Editor to resume this draft.</p><button class="flow-link" onclick={()=>flow.advanced()}>Open advanced editor →</button></details>
 </div><aside class="builder-preview"><span class="fabric-label">LIVE PREVIEW</span><h3>{item.name||'Untitled item'}</h3><div class="preview-footprint" style:width={`${Math.min(220,item.cellw*40)}px`} style:height={`${Math.min(280,item.cellh*40)}px`}>{#if item.icon}<img src={item.icon} alt={item.name||'Item image'}/>{:else}<span>Add an item image</span>{/if}</div><small>{item.cellw} wide · {item.cellh} tall</small><dl><div><dt>Type</dt><dd>{titles[kind]}</dd></div><div><dt>Price</dt><dd>{item.cost} RU</dd></div><div><dt>Weight</dt><dd>{item.weight} kg</dd></div></dl><small>Draft saved in this browser.</small></aside></div>
 {/if}
</section>
