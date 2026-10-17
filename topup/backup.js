import { backup } from 'node:sqlite';
import { mkdir,readFile,writeFile,unlink } from 'node:fs/promises';
import { dirname,resolve,sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Store } from './store.js';
import { Vault,insist } from './security.js';

export async function encryptedBackup(store,vault,destination){
  const parent=resolve(dirname(destination));await mkdir(parent,{recursive:true,mode:0o700});
  const temporary=resolve(parent,`.snapshot-${randomUUID()}.sqlite`);
  insist(temporary.startsWith(parent+sep),'BACKUP_PATH_INVALID');
  try{
    await backup(store.db,temporary);
    const data=await readFile(temporary);
    await writeFile(destination,vault.seal(data.toString('base64'),'moba-topup-backup-v1'),{flag:'wx',mode:0o600});
  }finally{await unlink(temporary).catch(()=>{});}
}
export async function restoreBackup(vault,source,newDatabasePath){
  const data=vault.open(await readFile(source,'utf8'),'moba-topup-backup-v1');
  await mkdir(dirname(newDatabasePath),{recursive:true,mode:0o700});
  await writeFile(newDatabasePath,Buffer.from(data,'base64'),{flag:'wx',mode:0o600});
  const restored=new Store(newDatabasePath);
  try{insist(restored.get('PRAGMA integrity_check').integrity_check==='ok','BACKUP_INTEGRITY_FAILED',500);}
  finally{restored.close();}
}
export function backupVault(key){return new Vault({keys:{backup:key},currentKeyId:'backup',fingerprintKey:'unused-backup-fingerprint-key-000000'});}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const [, ,action,source,destination]=process.argv;
    const vault=backupVault(process.env.BACKUP_KEY_BASE64);
    if(action==='restore'){insist(source&&destination,'BACKUP_ARGUMENTS_REQUIRED');await restoreBackup(vault,source,destination);}
    else if(action==='create'){
      insist(process.env.TOPUP_DB_PATH&&source,'BACKUP_ARGUMENTS_REQUIRED');
      const store=new Store(process.env.TOPUP_DB_PATH);try{await encryptedBackup(store,vault,source);}finally{store.close();}
    }else throw new Error();
    console.log('Backup operation completed.');
  }catch{console.error('Backup operation failed. Existing destinations are never overwritten.');process.exitCode=1;}
}
