import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
for(const name of ['index.html','admin.html','sw.js','js','styles']){
  fs.cpSync(path.join(root,name),path.join(root,'public',name),{recursive:true});
}
console.log('Synchronized public HTML, JS and CSS copies.');
