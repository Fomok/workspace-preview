// Request classic scripts together; async=false preserves their dependency order.
export function loadScripts(files,base,document=globalThis.document,version="dev"){
 return Promise.all(files.map(file=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.async=false;
  script.src=base+file+'?v='+encodeURIComponent(version);
  script.onload=resolve;
  script.onerror=()=>reject(Error('Could not load '+file));
  document.head.appendChild(script);
 })));
}

