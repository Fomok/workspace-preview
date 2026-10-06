export const DATABASE='https://stalker-gamma-db.com';
const KEY='zonebench-gamma-ingredients-095-v1';
let pending;
export function normalizeIngredients(index,translations){
 if(!Array.isArray(index)||!translations?.en)throw Error('The GAMMA database returned an unsupported format.');
 const seen=new Set();
 return index.filter(x=>x&&/^[a-z0-9_]+$/i.test(x.id)&&!seen.has(x.id)&&(seen.add(x.id),true))
 .map(x=>({id:x.id,name:translations.en[x.name]||translations.en[x.displayName]||x.displayName||x.name||x.id,category:String(x.category||'Other'),icon:DATABASE+'/img/icons/'+encodeURIComponent(x.id)+'.png'}))
 .filter(x=>typeof x.name==='string'&&!/dummy|don't spawn|tch_upgr/i.test(x.name)).sort((a,b)=>a.name.localeCompare(b.name));
}
export function searchIngredients(items,query='',category=''){
 const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 return items.filter(x=>(!category||x.category===category)&&words.every(w=>(x.name+' '+x.id).toLowerCase().includes(w)));
}
export function loadIngredients({fetcher=globalThis.fetch,storage=globalThis.localStorage}={}){
 if(pending)return pending;
 pending=(async()=>{
  let cached;try{cached=JSON.parse(storage.getItem(KEY)||'null');}catch{}
  if(cached?.items?.length&&Date.now()-cached.saved<86400000)return {items:cached.items,cached:true};
  try{
   const urls=['index.json','translations.json'].map(f=>DATABASE+'/data/gamma-0.9.5/'+f);
   const data=await Promise.all(urls.map(async url=>{const r=await fetcher(url,{signal:AbortSignal.timeout(15000),credentials:'omit'});if(!r.ok)throw Error('GAMMA database request failed.');return r.json();}));
   const items=normalizeIngredients(...data);if(!items.length)throw Error('The GAMMA database item list is empty.');
   try{storage.setItem(KEY,JSON.stringify({saved:Date.now(),items}));}catch{}
   return {items,cached:false};
  }catch(e){if(cached?.items?.length)return {items:cached.items,cached:true,offline:true};throw e;}
 })().catch(e=>{pending=null;throw e;});
 return pending;
}
