const prefix='zonebench.preview.downloads.v1.';
const validId=x=>typeof x==='string'&&/^[a-z0-9_-]+$/i.test(x);
export function downloadedAddons(user,storage=globalThis.localStorage){
 if(!user?.id)return [];
 try{const rows=JSON.parse(storage.getItem(prefix+encodeURIComponent(user.id))||'[]');return Array.isArray(rows)?rows.filter(x=>x&&validId(x.id)&&Array.isArray(x.items)):[];}catch{return [];}
}
// Called by the future browser download flow only after a successful ZIP download.
// Manifest IDs are the exported game section IDs, never editor/source IDs.
export function recordDownload(user,manifest,{listingId=null}={},storage=globalThis.localStorage){
 if(!user?.id)throw Error('Sign in to remember add-on downloads.');
 if(manifest?.format!=='zonebench-independent-addon'||!validId(manifest.id)||!Array.isArray(manifest.items)||!manifest.items.length)throw Error('A completed independent add-on export is required.');
 const items=manifest.items.map(x=>{if(!validId(x.id)||!['rigs','boxes','pouches','packs'].includes(x.kind))throw Error('Invalid downloaded item.');return {id:x.id,name:String(x.name||x.id),kind:x.kind};});
 const record={id:manifest.id,listingId,name:String(manifest.name||'Add-on'),version:String(manifest.addonVersion||'1.0'),downloadedAt:Date.now(),items};
 const rows=downloadedAddons(user,storage).filter(x=>x.id!==record.id);rows.push(record);storage.setItem(prefix+encodeURIComponent(user.id),JSON.stringify(rows));return record;
}
export function downloadedIngredient(user,id,storage=globalThis.localStorage){for(const addon of downloadedAddons(user,storage)){const item=addon.items.find(x=>x.id===id);if(item)return {...item,addon};}return null;}
