import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
  try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/')pathname='/demo/index.html';const resolved=path.resolve(root,`.${pathname}`);if(!resolved.startsWith(root)||!['demo','src'].includes(path.relative(root,resolved).split(path.sep)[0])){res.writeHead(403);res.end('Forbidden');return;}const content=await readFile(resolved);res.writeHead(200,{'Content-Type':mime[path.extname(resolved)]||'text/plain','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
