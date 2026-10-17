import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createApp} from '../topup/server.js';
import {Vault,signEnvelope,verifyEnvelope} from '../topup/security.js';
import {forwardTopupUpdate} from '../lib/topup-bridge.js';
import {backupVault,encryptedBackup,restoreBackup} from '../topup/backup.js';
import {Store} from '../topup/store.js';

const secret='bridge-secret-for-local-tests-'.repeat(2);
const smsSecret='different-sms-test-secret-'.repeat(2);
const key=Buffer.alloc(32,9).toString('base64');
async function appFor(t){
  const dir=mkdtempSync(join(tmpdir(),'moba-http-'));const sent=[];
  const app=createApp({dbPath:join(dir,'data.sqlite'),vault:new Vault({keys:{v1:key},fingerprintKey:'fingerprint-test-key-'.repeat(3)}),adminIds:['111'],
    bridgeSecret:secret,smsSecret,receiverWallet:'01000000000',send:async(method,payload)=>sent.push({method,payload})});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{
    await app.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep)&&basename(dir).startsWith('moba-http-'));
    rmSync(dir,{recursive:true,force:true});
  });
  const url=`http://127.0.0.1:${app.server.address().port}`;
  async function post(path,value,{timestamp=String(Date.now()),nonce=randomBytes(18).toString('hex'),signingKey=path==='/telegram'?secret:smsSecret}={}){
    const body=JSON.stringify(value);const headers={'Content-Type':'application/json','x-shop-timestamp':timestamp,'x-shop-nonce':nonce,
      'x-shop-signature':signEnvelope(signingKey,'POST',path,timestamp,nonce,body)};
    return fetch(url+path,{method:'POST',headers,body});
  }
  return {...app,dir,url,post,sent};
}
test('actual HTTP server authenticates, persists updates, and rejects replays',async t=>{
  const app=await appFor(t);const update={update_id:50,message:{text:'/start',from:{id:42},chat:{id:42,type:'private'}}};
  const nonce=randomBytes(18).toString('hex');
  assert.equal((await app.post('/telegram',update,{nonce})).status,202);
  assert.equal((await app.post('/telegram',update,{nonce})).status,409);
  assert.equal((await app.post('/telegram',update,{signingKey:'wrong-secret'.repeat(4)})).status,401);
  assert.equal((await app.post('/telegram',update,{timestamp:String(Date.now()-600001)})).status,401);
  assert.equal(app.store.get('SELECT count(*) AS n FROM inbox').n,1);
  await app.tick();assert.equal(app.store.get('SELECT state FROM inbox').state,'done');
  assert.equal(app.sent[0].payload.reply_markup.keyboard[0][0].text,'🔎 فحص PUBG ID');
  const health=await (await fetch(app.url+'/health')).json();assert.equal(health.liveRedemption,false);
});
test('SMS route needs a distinct secret, never stores raw OTP and never creates a fulfillment',async t=>{
  const app=await appFor(t);
  const event={event_id:'event-98765',observed_sender:'VF-CASH',recipient:'01000000000',sender_phone:'01012345678',amount_minor:5000,currency:'EGP',occurred_at:new Date().toISOString(),reference:'REF-98765'};
  assert.equal((await app.post('/hooks/sms',event,{signingKey:secret})).status,401);
  const r=await app.post('/hooks/sms',event);assert.equal(r.status,200);assert.equal((await r.json()).trusted,false);
  const bad=await app.post('/hooks/sms',{...event,message:'OTP_PRIVATE_123456'});assert.equal(bad.status,400);
  assert.equal(app.store.get('SELECT count(*) AS n FROM jobs').n,0);
  assert.ok(!JSON.stringify(app.store.all('SELECT * FROM audit')).includes('OTP_PRIVATE'));
  assert.ok(!readFileSync(join(app.dir,'data.sqlite')).includes(Buffer.from('OTP_PRIVATE')));
});
test('gateway is opt-in, signed, redirects disabled, and fails closed',async()=>{
  assert.equal(await forwardTopupUpdate({},{env:{}}),false);
  const env={TOPUP_ENABLED:'true',TOPUP_SERVICE_URL:'https://service.example',TOPUP_BRIDGE_SECRET:secret};
  let captured;
  assert.equal(await forwardTopupUpdate({update_id:1},{env,fetchImpl:async(url,opts)=>{
    captured={url,opts};return new Response('{"handled":true}');
  }}),true);
  assert.equal(captured.opts.redirect,'error');
  verifyEnvelope(secret,{method:'POST',path:'/telegram',headers:captured.opts.headers,body:captured.opts.body});
  await assert.rejects(forwardTopupUpdate({},{env,fetchImpl:async()=>new Response('{}',{status:503})}),/TOPUP_SERVICE_UNAVAILABLE/);
  assert.equal(await forwardTopupUpdate({message:{text:'/pubg 5285527481'}},{env,fetchImpl:async()=>{throw new Error('offline');}}),false);
  await assert.rejects(forwardTopupUpdate({},{env:{...env,TOPUP_SERVICE_URL:'http://insecure.example'}}),/TOPUP_CONFIGURATION_INVALID/);
});
test('encrypted SQLite snapshot restores cleanly without overwriting an existing database',async t=>{
  const app=await appFor(t);app.shop.importCodes('111',[{code:'SIM-BACKUP-CODE',cost:3000}]);
  const vault=backupVault(Buffer.alloc(32,5).toString('base64'));const path=join(app.dir,'backup.bak');
  await encryptedBackup(app.store,vault,path);assert.ok(!readFileSync(path).includes(Buffer.from('SIM-BACKUP-CODE')));
  const restoredPath=join(app.dir,'restored.sqlite');await restoreBackup(vault,path,restoredPath);
  const restored=new Store(restoredPath);assert.equal(restored.get('SELECT count(*) AS n FROM stock').n,1);restored.close();
  await assert.rejects(restoreBackup(vault,path,restoredPath),/EEXIST/);
});
test('key rotation can read old records only while the old key is retained',()=>{
  const old=new Vault({keys:{v1:key},fingerprintKey:secret});const value=old.seal('SIM-KEY-ROTATION','code');
  const rotated=new Vault({keys:{v1:key,v2:Buffer.alloc(32,2).toString('base64')},currentKeyId:'v2',fingerprintKey:secret});
  assert.equal(rotated.open(value,'code'),'SIM-KEY-ROTATION');assert.equal(rotated.hash('same-code'),old.hash('same-code'));
  assert.throws(()=>new Vault({keys:{v2:Buffer.alloc(32,2).toString('base64')},currentKeyId:'v2',fingerprintKey:secret}).open(value,'code'),/DECRYPTION_FAILED/);
});
