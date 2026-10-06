/* Build community downloads in an isolated project with stable identities. */
(function(root){
const kinds=['rigs','boxes','pouches','packs'];
function eligibility(pack,seed){
 ZB.validateAddon(pack);
 const reason=pack.items.find(({kind,item})=>!kinds.includes(kind)||item.adopt||item.borrowed||(seed[kind]||[]).some(x=>x.id===item.id));
 return reason?{ok:false,reason:'This pack changes existing mod items. Open it in the editor to review and combine those changes.'}:{ok:true};
}
async function identity(text){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('zonebench-community-v1:'+text)));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes.slice(0,16),x=>x.toString(16).padStart(2,'0')).join('');return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');}
async function project(result,seed){
 const eligible=eligibility(result.pack,seed);if(!eligible.ok)throw Error(eligible.reason);
 const db=JSON.parse(JSON.stringify(seed));for(const kind of kinds)db[kind]=[];db.items=[];db.removed=[];db.families={...db.families,...result.pack.families};
 db.independentAddon={id:await identity(result.listing.id),name:result.listing.name,version:result.listing.version,excluded:[]};
 for(const {kind,item} of result.pack.items){const copy=JSON.parse(JSON.stringify(item));copy.new=true;copy.addonItemId=await identity(result.listing.id+'/'+kind+'/'+item.id);if(kind==='packs'){copy.newItem=true;copy.parent=copy.parent||'equ_military_pack';copy.own={...copy.own,size:true,look:true,price:true};}db[kind].push(copy);}
 return db;
}
root.CommunityDownload={eligibility:pack=>eligibility(pack,SEED),identity,project,async build(result){const db=await project(result,SEED);return AddonExport.build(db,SEED);}};
})(globalThis);
