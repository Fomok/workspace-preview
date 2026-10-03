const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const routes={'/':'tests/site-copy-browser.html','/styles.css':'web/styles.css','/armory.css':'web/armory.css','/src/site-copy.js':'web/src/site-copy.js'};
http.createServer((req,res)=>{const f=routes[req.url];if(!f){res.writeHead(404);return res.end();}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(__dirname,'..',f)));}).listen(8771,'127.0.0.1',()=>console.log('Copy UI fixture: http://127.0.0.1:8771'));
