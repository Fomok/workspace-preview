/* Presentation only: move existing controls without replacing their handlers. */
(function(root){
const selected=new Map(),queries=new Map();
const groups=[['appearance','Appearance'],['storage','Storage'],['economy','Economy'],['craft','Crafting & repair']];
function group(text){
 if(/pockets|fits inside|compartments|will fit|fitting it adds|room it gives|rule$/i.test(text))return 'storage';
 if(/mended|made of|breaks down|costs to build/i.test(text))return 'craft';
 if(/turns up|sells it|state it is in|worth/i.test(text))return 'economy';
 if(/take.*over|nobody has listed|whole kind/i.test(text))return 'advanced';
 return 'appearance';
}
function organize(P,it){
 const nodes=[...P.children],panels=new Map();let current='appearance',started=false;const prefix=TAB+'-'+it.id;
 const bar=document.createElement('div');bar.className='item-sections';bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Item settings');
 const container=document.createElement('div');container.className='item-settings';
 function panel(key){if(!panels.has(key)){const p=document.createElement('section');p.className='item-settings-panel';p.id=prefix+'-'+key;panels.set(key,p);}return panels.get(key);}
 for(const node of nodes){
  if(node.classList.contains('sect')){current=group(node.textContent);started=true;}
  if(!started)continue;
  const target=node.classList.contains('danger')?'advanced':node.classList.contains('model-card')?'appearance':current;
  panel(target).appendChild(node);
 }
 if(!panels.size)return;
 // Move live controls rather than cloning them: their input handlers keep the same data.
 for(const footprint of [...panels.values()].flatMap(section=>[...section.querySelectorAll('.bag-size-settings')])){const card=document.createElement('div');card.className='card';const h=document.createElement('h2');h.textContent='Size in inventory';card.append(h,footprint);panel('storage').prepend(card);}
 for(const section of [...panels.values()])for(const card of [...section.querySelectorAll('[data-settings-group]')])panel(card.dataset.settingsGroup).appendChild(card);
 const priceCard=document.createElement('div');priceCard.className='card editor-economy-fields';
 const technical=document.createElement('div');technical.className='card';
 for(const section of panels.values())for(const field of [...section.querySelectorAll('label.f')]){
  const label=field.dataset.fieldLabel;
  if(['Price','Weight','Stash tier'].includes(label))priceCard.appendChild(field);
  else if(['Section id','Section','Built from'].includes(label))technical.appendChild(field);
 }
 if(priceCard.children.length)panel('economy').prepend(priceCard);
 if(technical.children.length)panel('advanced').prepend(technical);
 const workspace=document.createElement('div');workspace.className='editor-workspace';
 const controls=document.createElement('div');controls.className='editor-controls';controls.append(bar,container);workspace.appendChild(controls);
 const aside=document.createElement('aside');aside.className='editor-preview card';aside.setAttribute('aria-label','Item preview');aside.setAttribute('data-no-site-copy','');workspace.appendChild(aside);
 function paint(){
  aside.replaceChildren();const title=document.createElement('h2');title.textContent=root.EditorLibrary?.label(it)||it.name||it.id;aside.appendChild(title);
  const label=document.createElement('p');label.className='eyebrow';label.textContent='INVENTORY PREVIEW';aside.appendChild(label);
  aside.appendChild(fitPreview(it,220,190));
  const footprint=document.createElement('p');footprint.className='hint';footprint.textContent=it.adopt&&!it.own?.look?'Original item artwork and inventory size are preserved.':(it.cellw||2)+' × '+(it.cellh||2)+' cells in inventory';aside.appendChild(footprint);
  if(['rigs','boxes','pouches'].includes(TAB))aside.appendChild(AddonPreview.layoutView({kind:TAB,item:it}));
  Workbench.efficiency(aside,TAB,it);
  if(TAB==='packs'){const shape=EMIT.packSize(it.size)||EMIT.packSize(DB.packDefault);if(shape)aside.appendChild(packPreview(shape));}
 }
 if(P._previewPaint){P.removeEventListener('input',P._previewPaint);P.removeEventListener('change',P._previewPaint);}P._previewPaint=paint;
 paint();ICOPAINT.push(paint);P.addEventListener('input',paint);P.addEventListener('change',paint);
 P.appendChild(workspace);P.classList.add('item-editor');
 const buttons=new Map();
 function activate(key,focus=false){selected.set(prefix,key);for(const [id,b] of buttons){panels.get(id).hidden=id!==key;b.setAttribute('aria-selected',String(id===key));b.tabIndex=id===key?0:-1;}if(focus)buttons.get(key).focus();}
 for(const [key,label] of groups){if(!panels.has(key))continue;const b=document.createElement('button');b.textContent=label;b.type='button';b.setAttribute('role','tab');b.id=prefix+'-tab-'+key;b.setAttribute('aria-controls',panels.get(key).id);panels.get(key).setAttribute('role','tabpanel');panels.get(key).setAttribute('aria-labelledby',b.id);b.onclick=()=>activate(key);buttons.set(key,b);bar.appendChild(b);container.appendChild(panels.get(key));}
 if(panels.has('advanced')){const more=document.createElement('details');more.className='editor-advanced';const summary=document.createElement('summary');summary.textContent='Advanced settings';more.append(summary,panels.get('advanced'));controls.appendChild(more);}
 bar.onkeydown=e=>{const keys=[...buttons.keys()];const at=keys.indexOf(selected.get(prefix));let next;if(e.key==='ArrowRight')next=keys[(at+1)%keys.length];if(e.key==='ArrowLeft')next=keys[(at+keys.length-1)%keys.length];if(e.key==='Home')next=keys[0];if(e.key==='End')next=keys.at(-1);if(next){e.preventDefault();activate(next,true);}};
 activate(buttons.has(selected.get(prefix))?selected.get(prefix):buttons.keys().next().value);
}
function list(L){
 const toolbar=document.createElement('div');toolbar.className='item-library-tools';
 const title=document.createElement('strong');title.textContent='YOUR '+({rigs:'RIGS',boxes:'CONTAINERS',pouches:'POUCHES',packs:'BACKPACKS'}[TAB]||'ITEMS');toolbar.appendChild(title);
 const input=document.createElement('input');input.type='search';input.placeholder='Search items…';input.setAttribute('aria-label','Search items');input.value=queries.get(TAB)||'';toolbar.appendChild(input);
 const count=document.createElement('span');count.className='hint';toolbar.appendChild(count);L.prepend(toolbar);
 const rows=[...L.querySelectorAll('.row')];const empty=document.createElement('p');empty.className='hint';empty.textContent='No matching items.';toolbar.after(empty);
 const filter=()=>{queries.set(TAB,input.value);const q=input.value.trim().toLowerCase();let found=0;for(const row of rows){row.hidden=!row.textContent.toLowerCase().includes(q);if(!row.hidden)found++;}count.textContent=found+' of '+rows.length+' items';empty.hidden=found>0;};input.oninput=filter;filter();
}
function focused(P,it){
 if(!root.EditorLibrary?.isFocused(TAB))return;
 const breadcrumb=document.createElement('div');breadcrumb.className='focused-breadcrumb';
 const back=document.createElement('button');back.className='tool';back.textContent='← '+(EditorLibrary.scope==='mod'?'Mod items':EditorLibrary.scope==='adaptations'?'Adapted items library':'Optional add-ons');back.onclick=()=>EditorLibrary.choose(EditorLibrary.scope);
 const label=document.createElement('span');label.textContent='ADVANCED ITEM EDITOR / '+({rigs:'RIG',boxes:'CONTAINER',pouches:'POUCH',packs:'BACKPACK',items:'ITEM'}[TAB]);breadcrumb.append(back,label);
 const header=document.createElement('div');header.className='focused-heading';
 const title=P.querySelector('h1'),tools=P.querySelector('.item-change-tools');
 if(title){title.textContent=EditorLibrary.label(it);header.appendChild(title);}if(tools)header.appendChild(tools);
 const actions=document.createElement('div');actions.className='focused-actions';
 for(const [text,tab] of [['Review changes','changes'],[EditorLibrary.scope==='adaptations'?'Check adaptation':'Check project','check']]){const button=document.createElement('button');button.className='tool';button.textContent=text;button.onclick=()=>EditorLibrary.inspect(tab);actions.appendChild(button);}
 const download=document.createElement('button');download.className='tool primary';download.textContent=EditorLibrary.scope==='mod'?'Add to optional add-ons library':it.optionalLibrarySaved?'Create an add-on package':it.adopt?'Download compatibility patch':'Export';download.onclick=async()=>{download.disabled=true;try{await EditorLibrary.exportFocused();}catch(error){let message=header.querySelector('[role=alert]');if(!message){message=document.createElement('p');message.setAttribute('role','alert');header.appendChild(message);}message.textContent=error.message;}finally{download.disabled=false;}};actions.appendChild(download);
 if(EditorLibrary.scope==='adaptations'){const save=document.createElement('button');save.className='tool';save.textContent=it.adaptationSaved===false?'Add to adapted items library':'Save to adapted items library';save.onclick=()=>{try{EditorLibrary.saveAdaptation();}catch(error){let message=header.querySelector('[role=alert]');if(!message){message=document.createElement('p');message.setAttribute('role','alert');header.appendChild(message);}message.textContent=error.message;}};actions.appendChild(save);}
 if(typeof COMMUNITY_EDIT!=='undefined'&&COMMUNITY_EDIT){const backUpdate=document.createElement('button');backUpdate.className='tool';backUpdate.textContent='Back to add-on update';backUpdate.onclick=()=>Site.go('catalog');actions.prepend(backUpdate);}
 header.appendChild(actions);P.prepend(breadcrumb,header);
}
root.EditorView={organize,list,focused};
})(globalThis);

