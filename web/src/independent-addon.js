/* Preview test: additive new-rig packages. No baseline files are exported. */
(function(root){
'use strict';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const clone=x=>JSON.parse(JSON.stringify(x));
function freshId(){if(!root.crypto?.randomUUID)throw Error('A secure browser connection is required to create an add-on ID.');return root.crypto.randomUUID();}
function custom(db,seed){const stock=new Set(seed.rigs.map(r=>r.id));return db.rigs.filter(r=>!stock.has(r.id)&&!r.adopt&&!r.borrowed);}
function ensure(db,seed){
 if(!db.independentAddon)db.independentAddon={id:freshId(),name:'My rig add-on',version:'1.0',excluded:[]};
 const a=db.independentAddon;if(!uuid.test(a.id))throw Error('Invalid saved add-on ID.');
 a.excluded=a.excluded||[];const seen=new Set();
 for(const r of custom(db,seed)){if(!uuid.test(r.addonItemId||'')||seen.has(r.addonItemId))r.addonItemId=freshId();seen.add(r.addonItemId);}
 return a;
}
function sectionId(a,r){return 'zb_'+a.id.replaceAll('-','')+'_r'+r.addonItemId.replaceAll('-','');}
function upsert(text,id,key,value){if(EMIT.hasKey(text,id,key))return EMIT.setKey(text,id,key,value);return text.trimEnd()+'\r\n'+key+' = '+value+'\r\n';}
function plan(db,seed){
 const a=ensure(db,seed),chosen=custom(db,seed).filter(r=>!a.excluded.includes(r.addonItemId));
 if(!chosen.length)throw Error('Create and select at least one new rig. Existing items are not exported by this test.');
 if(chosen.length>20)throw Error('Select at most 20 new rigs per test add-on.');
 const map=Object.fromEntries(chosen.map(r=>[r.id,sectionId(a,r)]));
 const rigs=chosen.map(source=>{const r=clone(source);r.id=map[source.id];
  if(!r.icon)throw Error((r.name||source.id)+': add an icon before exporting.');
  for(const k of ['cellw','cellh'])if((r[k]|| (k==='cellw'?2:3))>20)throw Error('Rig icons can be at most 20 cells wide or tall.');
  if(!EMIT.cellsOf(r.slots))throw Error((r.name||source.id)+': add at least one storage slot.');
  if(r.pins?.length){const occupied=new Set(),counts=Object.fromEntries(EMIT.KINDS.map(k=>[k,0]));
   for(const p of r.pins){counts[p.kind]++;const [h,w]=p.kind.split('x').map(Number);if(p.col+w-1>r.band)throw Error('A rig pocket extends beyond its layout width.');for(let y=p.row;y<p.row+h;y++)for(let x=p.col;x<p.col+w;x++){const key=x+','+y;if(occupied.has(key))throw Error('Rig pockets overlap.');occupied.add(key);}}
   for(const k of EMIT.KINDS)if(counts[k]!==Number(r.slots[k]||0))throw Error('Rig layout and slot counts disagree. Recheck the layout.');
  }
  if(r.craft?.parts)r.craft.parts=r.craft.parts.map(([id,n])=>[map[id]||id,n]);
  for(const k of ['parts','yield'])if(Array.isArray(r[k]))r[k]=r[k].map(id=>map[id]||id);
  return r;});
 const mini={rigs,boxes:[],pouches:[],packs:[],items:[],families:{},removed:[]};ZB.validate(mini);
 for(const r of rigs)if(EMIT.craftFields(r)>10)throw Error((r.name||r.id)+': crafting supports at most four ingredients.');
 const allCustom=new Set(custom(db,seed).map(r=>r.id));
 for(const r of chosen)for(const id of [...(r.craft?.parts||[]).map(p=>p[0]),...(r.parts||[]),...(r.yield||[])])if(allCustom.has(id)&&!map[id])throw Error('Select the custom rig used by a recipe or parts list: '+id);
 const suffix='zba_'+a.id.replaceAll('-',''),sheet='ui\\zonebench\\'+suffix;
 const packed=BUILD.rigSheetPlan(mini,{});if(packed.overflow.length)throw Error('Selected rig icons do not fit on one texture sheet.');
 const files=[];const put=(path,text)=>files.push({name:'gamedata/'+path,bytes:BUILD.utf8(text)});
 let system='; Independent ZoneBench new rigs. Requires Squared Away Add-on Test 1.\r\n';
 for(const r of rigs){let text=EMIT.cloneSection(seed.files['configs/mod_system_amp_rigs.ltx'],seed.rigs[0].id,r.id);if(!text)throw Error('Rig template unavailable.');
  text=EMIT.rigSystem({...mini,rigs:[r]},text,packed.rects);
  const visual=r.model==='custom'?r.modelPath.replaceAll('/','\\'):r.model==='box'?ZB.models.box.visual:ZB.models.rig.visual;
  for(const [k,v] of Object.entries({class:'II_CONTR',slot:15,restore_slot_from_config:'true',dont_stack:'true',icons_texture:sheet,inv_grid_scale:2,visual,inv_name:'st_'+r.id+'_name',inv_name_short:'st_'+r.id+'_name',description:'st_'+r.id+'_descr'}))text=upsert(text,r.id,k,v);
  system+=text+'\r\n';
 }
 put('configs/mod_system_'+suffix+'.ltx',system);
 put('configs/mod_sqa_addons_'+suffix+'.ltx','![rigs]\r\n'+rigs.map(r=>r.id+' = true').join('\r\n')+'\r\n');
 put('configs/items/settings/mod_craft_'+suffix+'.ltx','![2]\r\n'+rigs.map(EMIT.craftLine).join('\r\n')+'\r\n');
 put('configs/items/settings/mod_parts_'+suffix+'.ltx',EMIT.parts(mini,'![con_parts_list]\r\n\r\n![nor_parts_list]\r\n'));
 put('configs/items/settings/mod_death_items_'+suffix+'.ltx','![keep_items]\r\n'+rigs.map(r=>r.id+' = true').join('\r\n')+'\r\n');
 put('configs/items/settings/mod_grok_items_tier_'+suffix+'.ltx',rigs.map(r=>'['+r.id+']\r\ntier = '+(r.stash==='none'?5:EMIT.tierOf(r.slots))).join('\r\n\r\n')+'\r\n');
 const stash=rigs.filter(r=>r.stash!=='none'&&EMIT.tierOf(r.slots)<5);
 if(stash.length)put('configs/items/settings/mod_grok_treasure_manager_'+suffix+'.ltx','![possible_items]\r\n'+stash.map(r=>r.id).join('\r\n')+'\r\n');
 put('configs/mod_sortingplus_'+suffix+'.ltx','![kind_overrides]\r\n'+rigs.map(r=>r.id+' = o_light').join('\r\n')+'\r\n');
 for(const [shelf,traders] of Object.entries(EMIT.SHELF_FILES)){
  const stocked=rigs.filter(r=>r.shelves?.[shelf]?.count>0&&r.shelves[shelf].chance>0);
  if(stocked.length)for(const trader of traders)put('configs/items/trade/mod_'+trader+'_'+suffix+'.ltx','![supplies_1]\r\n'+stocked.map(r=>r.id+' = '+r.shelves[shelf].count+', '+r.shelves[shelf].chance/100).join('\r\n')+'\r\n');
 }
 for(const lang of ['eng','rus','spa','ukr']){const template='<?xml version="1.0" encoding="utf-8"?>\n<string_table>\n</string_table>\n';
  const text=EMIT.textFile(mini,template,{},[]);files.push({name:'gamedata/configs/text/'+lang+'/'+suffix+'.xml',bytes:BUILD.stringTable(text,lang)});
 }
 const entries=rigs.map(r=>({icon:r.icon,fit:r.fit,rect:packed.rects[r.id]}));
 const pow=n=>2**Math.ceil(Math.log2(Math.max(4,n)));
 const width=pow(Math.max(...entries.map(e=>(e.rect.x+e.rect.w)*50))),height=pow(Math.max(...entries.map(e=>(e.rect.y+e.rect.h)*50)));
 const texture='gamedata/textures/ui/zonebench/'+suffix+'.dds';
 const manifest={format:'zonebench-independent-addon',version:1,id:a.id,name:a.name,addonVersion:a.version,requires:'Squared Away 2.0.3 + Independent Add-ons Test 1',items:chosen.map((r,i)=>({sourceId:r.id,id:rigs[i].id,name:r.name,kind:'rigs'})),texture:{path:texture,width,height},files:[...files.map(f=>f.name),texture]};
 return {files,entries,width,height,texture,manifest};
}
async function build(db,seed){const p=plan(db,seed),canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;const ctx=canvas.getContext('2d');
 for(const e of p.entries){const r=e.rect,img=await BUILD.fitPicture(e.icon,r.w*50,r.h*50,e.fit,false);ctx.putImageData(img,r.x*50,r.y*50);}
 p.files.push({name:p.texture,bytes:BUILD.ddsFrom(ctx.getImageData(0,0,p.width,p.height))});
 p.files.push({name:'addon.json',bytes:BUILD.utf8(JSON.stringify(p.manifest,null,2))});
 p.files.push({name:'INSTALL.txt',bytes:BUILD.utf8('INDEPENDENT RIG ADD-ON - TEST 1\nInstall below Squared Away Independent Add-ons Test 1 in MO2. Multiple independent add-ons may be enabled together. Keep the Squared Away 2.0.3 engine.\nReplace this add-on to update it; keep its ID. Save your ZoneBench project before making another add-on.\nThis test exports selected NEW rigs only, not existing-item changes or other item types. Models are supplied by Squared Away. Custom model paths require their own assets.\nTest on a separate save. Do not remove a rig add-on while that save still contains its items.\n')});
 return {blob:BUILD.zip(p.files),manifest:p.manifest};
}
function render(P,db,seed,save,legacy){
 const a=ensure(db,seed),node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 P.appendChild(node('h1','Export independent add-on'));
 P.appendChild(node('p','Test 1: export selected new rigs with their own files. Requires the separate Squared Away add-on test package. Existing-item edits, containers, pouches and global settings are not included.'));
 const card=node('section');card.className='card';P.appendChild(card);
 for(const [key,label] of [['name','Add-on name'],['version','Version']]){const wrap=node('label',label+' '),input=node('input');input.type='text';input.value=a[key];input.maxLength=80;input.setAttribute('aria-label',label);input.onchange=()=>{a[key]=input.value.trim()|| (key==='name'?'My rig add-on':'1.0');save();};wrap.appendChild(input);card.appendChild(wrap);}
 card.appendChild(node('p','Permanent ID: '+a.id));
 const candidates=custom(db,seed);card.appendChild(node('h2','New rigs to include'));
 if(!candidates.length)card.appendChild(node('p','Create or duplicate a rig in the editor first. Base-mod rigs are never included.'));
 for(const r of candidates){const label=node('label'),check=node('input');check.type='checkbox';check.checked=!a.excluded.includes(r.addonItemId);check.onchange=()=>{a.excluded=a.excluded.filter(id=>id!==r.addonItemId);if(!check.checked)a.excluded.push(r.addonItemId);save();preview();};label.style.display='block';label.append(check,node('span',' '+(r.name||r.id)));card.appendChild(label);}
 const info=node('details');info.appendChild(node('summary','Files in this add-on'));const listing=node('pre');listing.style.whiteSpace='pre-wrap';listing.style.overflowWrap='anywhere';info.appendChild(listing);P.appendChild(info);
 const status=node('p');status.setAttribute('role','status');P.appendChild(status);
 const button=node('button','Download independent add-on ZIP');button.className='tool primary';P.appendChild(button);
 function preview(){try{const p=plan(db,seed);listing.textContent=p.manifest.files.join('\n')+'\naddon.json\nINSTALL.txt';status.textContent=p.manifest.items.length+' rig(s); texture '+p.width+' × '+p.height+' px. No base-mod files are replaced.';button.disabled=false;}catch(e){listing.textContent='';status.textContent=e.message;button.disabled=true;}}
 button.onclick=async()=>{button.disabled=true;try{await save();const result=await build(db,seed);const blob=await result.blob,link=node('a');link.href=URL.createObjectURL(blob);link.download='ZoneBench-'+a.id+'.zip';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),8000);status.textContent='Downloaded. Install this ZIP below the test mod in MO2.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};
 const duplicate=node('button','Start a separate add-on ID');duplicate.className='tool';duplicate.onclick=async()=>{if(!confirm('Save your project first if you want to update this add-on later. Start a separate add-on using the current items and a new ID?'))return;a.id=freshId();await save();renderPane();};P.appendChild(duplicate);
 const old=node('details');old.appendChild(node('summary','Legacy full-project export'));old.appendChild(node('p','The older exporter replaces shared files and cannot be stacked with other full-project exports. It is not used for this test.'));const b=node('button','Open legacy exporter');b.className='tool';b.onclick=()=>{P.replaceChildren();legacy(P);};old.appendChild(b);P.appendChild(old);preview();
}
root.AddonExport={ensure,custom,plan,build,render,sectionId};
})(globalThis);
