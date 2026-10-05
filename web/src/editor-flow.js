(function(root){
const kinds=['rigs','boxes','pouches','packs'];
let selected=null;
function select(kind,id){selected=kinds.includes(kind)?{kind,id}:null;}
function current(){if(!selected)return null;const item=(DB[selected.kind]||[]).find(x=>x.addonItemId===selected.id);return item?{kind:selected.kind,item:JSON.parse(JSON.stringify(item))}:null;}
function drafts(){return kinds.flatMap(kind=>(DB[kind]||[]).filter(x=>x.new&&!x.adopt&&x.addonItemId).map(x=>({kind,id:x.addonItemId,name:x.name||'Untitled item',icon:x.icon})));}
function create(kind){if(!kinds.includes(kind))return;const item=addItem(false,kind,false);if(kind==='rigs'){item.slots={'2x2':1,'3x1':0,'2x1':0,'1x1':0};item.pins=[{kind:'2x2',col:1,row:1}];}item.builderAddonId=crypto.randomUUID();item.builderStep=0;select(kind,item.addonItemId);touch();Site.go('builder');}
function open(kind,id){select(kind,id);Site.go('builder');}
function save(data){const found=current();if(!found)return;const target=DB[found.kind].find(x=>x.addonItemId===selected.id);const copy=JSON.parse(JSON.stringify(data));delete copy.id;delete copy.addonItemId;Object.assign(target,copy);touch();}
function project(){const found=current();if(!found)throw Error('This item is no longer in the current project.');const copy=JSON.parse(JSON.stringify(DB));if(found.item.builderAddonId)copy.independentAddon.id=found.item.builderAddonId;copy.independentAddon.name=found.item.name||'My item';copy.independentAddon.excluded=AddonExport.custom(copy,SEED).filter(x=>x.addonItemId!==selected.id).map(x=>x.addonItemId);return copy;}
function review(){try{const p=AddonExport.plan(project(),SEED);return {ok:true,count:p.manifest.files.length,files:p.manifest.files,width:p.width,height:p.height};}catch(e){return {ok:false,error:e.message};}}
async function download(){await flushKeep();return AddonExport.build(project(),SEED);}
function advanced(){const found=current();if(found){SEL[found.kind]=found.item.id;Site.go(found.kind);}}
function pictures(){return Object.fromEntries(kinds.map(kind=>[kind,(SEED[kind]||DB[kind]||[]).find(x=>x.icon)?.icon||null]));}
function rules(){return Object.keys(DB.families||{}).filter(x=>x!=='any').map(id=>({id,name:id.replaceAll('_',' ')}));}
root.EditorFlow={select,current,drafts,create,open,save,review,download,advanced,pictures,rules,route:()=>selected?'#editor/new/'+selected.kind+'/'+selected.id:'#editor/create'};
})(globalThis);
