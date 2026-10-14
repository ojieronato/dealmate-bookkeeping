import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const dir of ['src','demo','scripts','test'])for(const name of await readdir(path.join(root,dir))){if(name.endsWith('.mjs')){const result=spawnSync(process.execPath,['--check',path.join(root,dir,name)],{stdio:'inherit'});if(result.status)process.exit(result.status);}}
const ui=await readFile(path.join(root,'src/finance-element.mjs'),'utf8');
if(!ui.includes('attachShadow')||ui.includes('document.body.innerHTML'))throw new Error('UI isolation check failed.');
console.log('Syntax and UI isolation checks passed.');
