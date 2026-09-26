import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.ttf':'font/ttf','.glb':'model/gltf-binary','.png':'image/png','.webm':'video/webm','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}const actual=path===root?resolve(root,'index.html'):path;const data=await readFile(actual);res.writeHead(200,{'Content-Type':mime[extname(actual)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});server.listen(Number(process.env.PORT||4175),'127.0.0.1',()=>console.log(`Farm presentation: http://127.0.0.1:${server.address().port}`));
