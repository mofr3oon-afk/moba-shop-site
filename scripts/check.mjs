import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
let count=0;
for(const dir of ['api','lib','js','tests','scripts']){
  for(const name of fs.readdirSync(path.join(root,dir),{recursive:true})){
    const file=path.join(root,dir,name);if(!/\.(js|mjs)$/.test(file)||!fs.statSync(file).isFile())continue;
    const bytes=fs.readFileSync(file);if(bytes.includes(0))throw new Error('Invalid null bytes: '+file);
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(result.status!==0){process.stderr.write(result.stderr);process.exit(1);}count++;
  }
}
JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
const frontendFiles=['index.html','admin.html','sw.js',...['js','styles'].flatMap(dir=>fs.readdirSync(path.join(root,dir),{recursive:true}).map(name=>dir+'/'+name).filter(name=>fs.statSync(path.join(root,name)).isFile()))];
for(const file of frontendFiles){
  if(!fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(root,'public',file))))throw new Error('Public copy out of sync: '+file);
}
console.log(`Syntax checked ${count} files; Vercel config and public copies checked.`);
