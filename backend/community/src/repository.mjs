import {Problem} from './service.mjs';
export function appwriteRepository({endpoint,project,key,fetchImpl=fetch}){
 const headers={'X-Appwrite-Project':project,'X-Appwrite-Key':key};
 async function call(path,method='GET',body){
  const response=await fetchImpl(endpoint+path,{method,headers:{...headers,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body==null?undefined:body instanceof FormData?body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
  if(!response.ok){let err;try{err=await response.json();}catch{}throw new Problem(response.status,err?.message||'Storage request failed.');}
  if(response.status===204)return null;return response.json();
 }
 const rows=table=>'/tablesdb/zonebench/tables/'+table+'/rows';
 const files='/storage/buckets/zonebench-packs/files';
 return {
  get:(table,id)=>call(rows(table)+'/'+encodeURIComponent(id)),
  optional:async(table,id)=>{try{return await call(rows(table)+'/'+encodeURIComponent(id));}catch(e){if(e.status===404)return null;throw e;}},
  create:(table,id,data)=>call(rows(table),'POST',{rowId:id,data,permissions:[]}),
  update:(table,id,data)=>call(rows(table)+'/'+encodeURIComponent(id),'PATCH',{data}),
  remove:(table,id)=>call(rows(table)+'/'+encodeURIComponent(id),'DELETE'),
  list:(table,filters={},options={})=>{
   const q=[];for(const [attribute,value] of Object.entries(filters))q.push({method:'equal',attribute,values:[value]});
   q.push({method:'limit',values:[options.limit||24]},{method:'offset',values:[options.offset||0]});
   if(options.order)q.push({method:'orderDesc',attribute:options.order});
   const search=new URLSearchParams();for(const query of q)search.append('queries[]',JSON.stringify(query));return call(rows(table)+'?'+search);
  },
  writePack:(id,pack)=>{const form=new FormData();form.append('fileId',id);form.append('file',new Blob([JSON.stringify(pack)],{type:'application/json'}),id+'.json');return call(files,'POST',form);},
  readPack:id=>call(files+'/'+encodeURIComponent(id)+'/download'),
  deletePack:id=>call(files+'/'+encodeURIComponent(id),'DELETE')
 };
}
