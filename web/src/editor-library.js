/* Item library and focused editing. Public add-ons are copied locally, never updated here. */
(function(root){
const kinds=['rigs','boxes','pouches','packs','items'];
let scope='mod',focused=null;const filters={};
const clone=x=>JSON.parse(JSON.stringify(x));
function label(item){const names={itm_backpack:'Starter backpack',equ_small_pack:'Small backpack',equ_small_military_pack:'Small military backpack',equ_military_pack:'Military backpack',equ_tourist_pack:'Tourist backpack'};return (!item.name||item.name===item.id)?names[item.id]||item.id:item.name;}
function token(item){return item.addonItemId||item.id;}
function entries(source=scope){return kinds.flatMap(kind=>(DB[kind]||[]).filter(item=>{
 const baseline=Workbench.isBaseline?Workbench.isBaseline(kind,item.id):(SEED[kind]||[]).some(x=>x.id===item.id);
 return source==='mod'?baseline:!baseline||!!item.communitySource;
}).map(item=>({kind,id:item.id,key:token(item),item,local:true,source:item.communitySource?.name||item.communitySource?.id||(source==='mod'?'Squared Away':'My creations'),status:Workbench.status(kind,item)})));}
function adapt(kind,id,name,drops=false){
 if(!['rigs','boxes','pouches','packs'].includes(kind))throw Error('Choose an item type.');
 id=String(id||'').trim();if(!/^[a-z][a-z0-9_]*$/.test(id))throw Error('Enter the exact item section ID, using lowercase letters, numbers and underscores.');
 if(kinds.some(k=>(DB[k]||[]).some(x=>x.id===id)))throw Error('This item is already in your project. Open it from the item library.');
 Workbench.record();const item=addItem(true,kind,false);item.id=id;item.name=String(name||'').trim()||id;item.addonItemId=crypto.randomUUID();item.adaptationId=crypto.randomUUID();item.own={...(item.own||{}),drops:!!drops&&['rigs','pouches'].includes(kind)};
 if(kind==='rigs'){item.slots={'2x2':1,'3x1':0,'2x1':0,'1x1':0};item.pins=[{kind:'2x2',col:1,row:1}];}
 touch();open({kind,item},'addons');return item;
}
function choose(source){scope=source==='addons'?'addons':'mod';focused=null;Site.go('itemlibrary');}
function select(source,kind,key){scope=source==='addons'?'addons':'mod';focused=kinds.includes(kind)?{kind,key}:null;}
function resolve(){if(!focused)return null;const item=(DB[focused.kind]||[]).find(x=>token(x)===focused.key);if(item)SEL[focused.kind]=item.id;return item;}
function open(entry,source=scope){select(source,entry.kind,entry.key||token(entry.item));resolve();Site.go(entry.kind);}
function route(){return focused?'#editor/edit/'+scope+'/'+focused.kind+'/'+encodeURIComponent(focused.key):'#editor/library/'+scope;}
async function importPack(result,kind,id){
 ZB.validateAddon(result.pack);
 const selected=result.pack.items.find(x=>x.kind===kind&&x.item.id===id);if(!selected)throw Error('This item is no longer available in the add-on.');
 const existing=DB[kind]?.find(x=>x.communitySource?.id===result.listing.id&&x.communitySource.originalId===id);
 if(existing){open({kind,item:existing},'addons');return;}
 const used=new Set(kinds.flatMap(k=>(DB[k]||[]).map(x=>x.id))),mapping=new Map(),incoming=[];
 for(const entry of result.pack.items){
  const old=DB[entry.kind]?.find(x=>x.communitySource?.id===result.listing.id&&x.communitySource.originalId===entry.item.id);
  let next=old?.id||entry.item.id,n=2;while(!old&&used.has(next))next=entry.item.id+'_'+n++;
  used.add(next);mapping.set(entry.item.id,next);if(old)continue;
  const item=clone(entry.item);item.id=next;item.new=true;item.addonItemId=await CommunityDownload.identity(result.listing.id+'/'+entry.kind+'/'+entry.item.id);
  item.communitySource={id:result.listing.id,name:result.listing.name,version:result.listing.version,revision:result.listing.revision,originalId:entry.item.id};
  incoming.push({kind:entry.kind,item});
 }
 // Resolve every incoming reference before touching the project.
 const families=clone(DB.families||{}),familyMap=new Map();
 for(const [name,value] of Object.entries(result.pack.families||{})){
  let next=name,n=2;while(families[next]&&JSON.stringify(families[next])!==JSON.stringify(value))next=name+'_'+n++;
  families[next]=clone(value);familyMap.set(name,next);
 }
 for(const entry of incoming){const item=entry.item;if(item.craft?.parts)item.craft.parts=item.craft.parts.map(([part,count])=>[mapping.get(part)||part,count]);if(familyMap.has(item.takes))item.takes=familyMap.get(item.takes);}
 Workbench.record();DB.families=families;for(const entry of incoming)(DB[entry.kind]||(DB[entry.kind]=[])).push(entry.item);
 touch();const item=DB[kind].find(x=>x.id===mapping.get(id));open({kind,item},'addons');
}
async function exportFocused(){
 const item=resolve();if(!item)throw Error('Select an item first.');
 if(item.adopt){await AdaptationExport.download(DB,SEED,focused.kind,item);return;}
 if(scope==='mod'){Site.go('build');return;}
 if(!item.communitySource?.id&&!item.builderAddonId){Site.go('addonexport');return;}
 const project=clone(DB),source=item.communitySource;
 const addonId=source?await CommunityDownload.identity(source.id):item.builderAddonId;
 project.independentAddon={...project.independentAddon,id:addonId,name:source?.name||item.name,version:source?.version||'1.0',excluded:[]};
 project.independentAddon.excluded=AddonExport.custom(project,SEED).filter(x=>source?x.communitySource?.id!==source.id:x.builderAddonId!==item.builderAddonId).map(x=>x.addonItemId);
 const result=await AddonExport.build(project,SEED),blob=await result.blob,url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=root.ZonebenchAddonFilename(project.independentAddon.name,project.independentAddon.version);document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
root.EditorLibrary={adapt,label,exportFocused,getFilters:source=>filters[source]||{},saveFilters:(source,value)=>filters[source]=value,entries,choose,select,resolve,open,importPack,route,get scope(){return scope;},get focused(){return focused;},clear(){focused=null;},isFocused:kind=>!!focused&&focused.kind===kind};
})(globalThis);
