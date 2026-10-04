(function(root){
'use strict';
const repo='Fomok/xray-monolith-inventory-edits';
function pick(release){
 if(!release||release.draft||!Array.isArray(release.assets))return null;
 const mod=release.assets.filter(a=>/^Squared[-_ .]*Away[-_ .]+(?:\d|FOMOD)/i.test(a.name)&&/\.zip$/i.test(a.name)&&!/engine|source|model[-_ .]*test|for[-_ .]*developers|all[-_ .]*dx|dx(?:8|9|10|11)/i.test(a.name));
 const engine=release.assets.filter(a=>/\.zip$/i.test(a.name)&&(/Squared[-_ .]*Away.*(?:DX11.*AVX|All[-_ .]*DX)/i.test(a.name)||/STALKER-Anomaly-modded-exes.*SquaredAway/i.test(a.name)));
 if(mod.length!==1||engine.length!==1)return null;
 const safe=a=>{try{const u=new URL(a.browser_download_url);return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.startsWith('/'+repo+'/releases/download/');}catch{return false;}};
 if(!safe(mod[0])||!safe(engine[0]))return null;
 return {tag:release.tag_name,name:release.name||release.tag_name,preview:!!release.prerelease,date:release.published_at,notes:release.body||'',url:'https://github.com/'+repo+'/releases/tag/'+encodeURIComponent(release.tag_name),mod:mod[0],engine:engine[0]};
}
// Display-only announcement: no draft asset URLs or downloadable files.
function withAnnouncement(items){
 if(items.some(r=>r.tag==='v2.0-update'))return items;
 return [{tag:'v2.0-update',name:'Squared Away - 2.0 Update',unavailable:true,
  notes:'Saved inventory layouts, persistent rigs and boxes, direct gear transfers, and the new Field Kit interface.\n\nStart a new game when upgrading from the previous public version. Install the mod and its matching engine together when downloads become available.',
  mod:{name:'Squared Away - 2.0 Update.zip'},engine:{name:'Squared Away - 2.0 Engine - All DX.zip'}},...items];
}
let pending;
async function load(){
 if(!pending)pending=(async()=>{
  try{const response=await fetch('https://api.github.com/repos/'+repo+'/releases?per_page=20',{signal:AbortSignal.timeout(10000),headers:{Accept:'application/vnd.github+json'}});if(!response.ok)throw Error('Release lookup unavailable');const raw=await response.json();if(!Array.isArray(raw))throw Error('Invalid release response');return {items:withAnnouncement(raw.map(pick).filter(Boolean).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))),cached:false};}
  catch{const response=await fetch('data/releases.json');if(!response.ok)throw Error('Downloads are temporarily unavailable. Please retry.');const raw=await response.json();return {items:withAnnouncement(raw.map(pick).filter(Boolean).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))),cached:true};}
 })();return pending;
}
root.Releases={pick,load,withAnnouncement};
})(globalThis);
