import {createService,Problem,limits} from './service.mjs';
import {appwriteRepository} from './repository.mjs';
export default async ({req,res,error})=>{
 try{
  if(Buffer.byteLength(req.bodyText||'')>limits.bytes+20000)throw new Problem(413,'Request too large.');
  const endpoint=process.env.APPWRITE_FUNCTION_API_ENDPOINT||'https://fra.cloud.appwrite.io/v1';
  const project=process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const key=req.headers['x-appwrite-key'];
  if(!key||!project)throw new Problem(503,'Community backend is not configured.');
  let user=null;
  const jwt=req.headers['x-appwrite-user-jwt'];
  if(jwt){
   const check=await fetch(endpoint+'/account',{headers:{'X-Appwrite-Project':project,'X-Appwrite-JWT':jwt},signal:AbortSignal.timeout(10000)});
   if(!check.ok)throw new Problem(401,'Your session expired. Sign in again.');user=await check.json();
  }
  const repo=appwriteRepository({endpoint,project,key});
  const adminIds=(process.env.ZONEBENCH_ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
  const result=await createService(repo,{adminIds})(req.bodyJson,user);
  return res.json(result,200,{'Cache-Control':'no-store'});
 }catch(e){
  const status=e instanceof Problem?e.status:500;
  if(status>=500)error('Community request failed: '+(e.name||'Error'));
  return res.json({error:status>=500?'Community service is unavailable. Please retry.':e.message},status,{'Cache-Control':'no-store'});
 }
};
