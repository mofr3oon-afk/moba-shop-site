import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {Worker} from 'node:worker_threads';
import {spawnSync} from 'node:child_process';
import {Store} from '../topup/store.js';
import {Vault} from '../topup/security.js';
import {Shop} from '../topup/engine.js';
import {parseStockFile} from '../topup/import.js';
import {receiptFieldsOnDevice} from '../topup/sms-edge.js';
import {TelegramShop,BUY_BUTTON} from '../topup/telegram.js';

const keys={v1:Buffer.alloc(32,7).toString('base64')};
const fingerprintKey='test-fingerprint-key-'.repeat(3);
function setup(t,extra={}){
  const dir=mkdtempSync(join(tmpdir(),'moba-topup-'));const path=join(dir,'db.sqlite');
  const store=new Store(path);const vault=new Vault({keys,fingerprintKey});
  const config={store,vault,adminIds:['111'],...extra};const shop=new Shop(config);
  shop.configure('111',{enabled:true,price:5000});
  const connections=[store];
  t.after(()=>{
    for(const connection of connections){try{connection.close();}catch{}}
    assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep)&&basename(dir).startsWith('moba-topup-'));
    rmSync(dir,{recursive:true,force:true});
  });
  return {shop,store,vault,path,dir,connections};
}
function order(shop,buyer='42',idempotencyKey){
  const o=shop.createOrder({buyer,chat:buyer,playerId:'5285527481',nickname:'MOĪFR3OON',idempotencyKey});
  shop.confirmPlayer(o.id,buyer);return shop.setSender(o.id,buyer,'01012345678');
}
function pay(shop,o,ref=`SIM-${o.id}`){return shop.confirmPayment('111',o.id,{reference:ref,amount:o.price,sender:'01012345678',source:'simulation'});}
function stock(shop,n){shop.importCodes('111',Array.from({length:n},(_,i)=>({code:`SIM-TEST-CODE-${i}`,cost:4000})));}

test('five full simulated purchases succeed with separate codes and correct gross profit',async t=>{
  const {shop,store,path}=setup(t);stock(shop,5);const results=[];
  for(let i=0;i<5;i++){const o=order(shop,String(100+i));pay(shop,o);results.push(await shop.fulfillOne());}
  assert.deepEqual(results.map(x=>x.state),Array(5).fill('completed'));
  assert.equal(new Set(results.map(x=>x.code_id)).size,5);
  assert.equal(shop.stockCounts().used,5);
  const report=shop.report('111')[0];assert.equal(report.revenue,25000);assert.equal(report.cost,20000);assert.equal(report.gross_profit,5000);
  assert.equal(store.get('SELECT count(*) AS n FROM payments').n,5);
  assert.ok(!JSON.stringify(store.all('SELECT * FROM audit')).includes('SIM-TEST-CODE-'));
  assert.ok(!readFileSync(path).includes(Buffer.from('SIM-TEST-CODE-')));
});
test('incorrect amount and different sender cannot reserve or consume a code',t=>{
  const {shop}=setup(t);stock(shop,1);const o=order(shop);
  const proof={reference:'TRANSFER-123',amount:5000,sender:'01012345678',source:'simulation'};
  assert.throws(()=>shop.confirmPayment('111',o.id,{...proof,amount:4900}),/PAYMENT_AMOUNT_MISMATCH/);
  assert.throws(()=>shop.confirmPayment('111',o.id,{...proof,sender:'01112345678'}),/PAYMENT_SENDER_MISMATCH/);
  assert.equal(shop.order(o.id,'42').state,'awaiting_payment');assert.equal(shop.stockCounts().available,1);
});
test('one transfer cannot pay for two orders; repeated same confirmation is idempotent',t=>{
  const {shop,store}=setup(t);stock(shop,2);const a=order(shop,'42');const b=order(shop,'43');
  pay(shop,a,'REF-ONCE');pay(shop,a,'REF-ONCE');
  assert.throws(()=>pay(shop,b,'REF-ONCE'),/TRANSFER_ALREADY_USED/);
  assert.equal(store.get('SELECT count(*) AS n FROM jobs').n,1);assert.equal(shop.stockCounts().available,1);
});
test('verified unused failure returns code; ambiguous or timed-out redemption never retries',async t=>{
  for(const outcome of ['failure','unknown','timeout']){
    await t.test(outcome,async t=>{
      const {shop,store}=setup(t);stock(shop,1);const o=order(shop);pay(shop,o);shop.setSimulationOutcome('111',o.id,outcome);
      const result=await shop.fulfillOne();assert.equal(result.state,outcome==='failure'?'fulfillment_failed':'unknown');
      assert.equal(await shop.fulfillOne(),null);
      assert.equal(outcome==='failure'?shop.stockCounts().available:shop.stockCounts().quarantined,1);
      assert.equal(store.get('SELECT count(*) AS n FROM jobs').n,1);
      if(outcome!=='failure'){assert.throws(()=>shop.requeueOutOfStock('111',o.id),/INVALID_ORDER_STATE/);shop.resolveSimulation('111',o.id,false);assert.equal(shop.stockCounts().available,1);}
    });
  }
});
test('empty inventory keeps paid order pending and can be queued once after restock',async t=>{
  const {shop}=setup(t);const o=order(shop);pay(shop,o);assert.equal(shop.order(o.id,'42').state,'paid_out_of_stock');
  assert.equal(await shop.fulfillOne(),null);stock(shop,1);shop.requeueOutOfStock('111',o.id);assert.equal((await shop.fulfillOne()).state,'completed');
});
test('actual process exit at submission boundary survives restart and quarantines the code',t=>{
  const {shop,store,path,connections}=setup(t);stock(shop,1);const o=order(shop);pay(shop,o);store.close();
  const data={path,keys,fingerprintKey,storeUrl:new URL('../topup/store.js',import.meta.url).href,
    engineUrl:new URL('../topup/engine.js',import.meta.url).href,securityUrl:new URL('../topup/security.js',import.meta.url).href};
  const script=`(async()=>{const d=JSON.parse(process.argv[1]);const {Store}=await import(d.storeUrl);const {Shop}=await import(d.engineUrl);const {Vault}=await import(d.securityUrl);const s=new Store(d.path);const shop=new Shop({store:s,vault:new Vault({keys:d.keys,fingerprintKey:d.fingerprintKey}),adminIds:['111']});await shop.fulfillOne({afterClaim:()=>process.exit(77)});})();`;
  const child=spawnSync(process.execPath,['-e',script,JSON.stringify(data)],{encoding:'utf8'});assert.equal(child.status,77,child.stderr);
  const restored=new Store(path);connections.push(restored);const next=new Shop({store:restored,vault:new Vault({keys,fingerprintKey}),adminIds:['111']});
  next.recover();assert.equal(next.order(o.id,'42').state,'unknown');assert.equal(next.stockCounts().quarantined,1);
  assert.equal(restored.get("SELECT count(*) AS n FROM jobs WHERE state='queued'").n,0);
});
test('two genuine database connections racing for one code cannot double allocate',async t=>{
  const {shop,store,path}=setup(t);stock(shop,1);const a=order(shop,'42');const b=order(shop,'43');
  const workerCode=`const {parentPort,workerData:d}=require('node:worker_threads');(async()=>{const {Store}=await import(d.storeUrl);const {Shop}=await import(d.engineUrl);const {Vault}=await import(d.securityUrl);const s=new Store(d.path);const shop=new Shop({store:s,vault:new Vault({keys:d.keys,fingerprintKey:d.fingerprintKey}),adminIds:['111']});const result=shop.confirmPayment('111',d.id,{reference:d.id,amount:5000,sender:'01012345678',source:'simulation'});parentPort.postMessage(result.state);s.close();})().catch(e=>{parentPort.postMessage({error:e.code||e.message});});`;
  const race=id=>new Promise((resolve,reject)=>{
    const worker=new Worker(workerCode,{eval:true,workerData:{path,id,keys,fingerprintKey,
      storeUrl:new URL('../topup/store.js',import.meta.url).href,engineUrl:new URL('../topup/engine.js',import.meta.url).href,securityUrl:new URL('../topup/security.js',import.meta.url).href}});
    worker.once('message',resolve);worker.once('error',reject);
  });
  const result=await Promise.all([race(a.id),race(b.id)]);
  assert.deepEqual(result.sort(),['paid_out_of_stock','queued']);assert.equal(store.get('SELECT count(*) AS n FROM jobs').n,1);
});
test('code import supports batches, CSV quotes, deduplication and authenticated encryption',t=>{
  const {shop,vault,store}=setup(t);
  const rows=parseStockFile('code,cost_egp\r\n"SIM-ONE",40.25\r\n"SIM-TWO",39\r\n','codes.csv');
  assert.deepEqual(shop.importCodes('111',rows),{added:2,duplicates:0});
  assert.deepEqual(shop.importCodes('111',rows),{added:0,duplicates:2});
  assert.equal(shop.importCodes('111',Array.from({length:500},(_,i)=>({code:`SIM-BULK-${i}`}))).added,500);
  const c=store.get('SELECT * FROM stock LIMIT 1');const aad=`stock:simulation:pubg-60:${c.fingerprint}`;
  assert.equal(vault.open(c.box,aad),'SIM-ONE');assert.throws(()=>vault.open(c.box,`${aad}-tampered`),/DECRYPTION_FAILED/);
  assert.throws(()=>shop.importCodes('111',[{code:'REAL-SECRET'}]),/SIMULATION_CODES_ONLY/);
  assert.throws(()=>shop.importCodes('222',rows),/ADMIN_ONLY/);
  assert.throws(()=>parseStockFile('code\n"SIM-BAD','codes.csv'),/INVALID_CSV/);
});
test('SMS is review-only, mismatches and ambiguity do not fulfill, raw fields are rejected',t=>{
  const {shop,store}=setup(t,{allowManualPayment:true,receiverWallet:'01000000000'});shop.configure('111',{mode:'live'});
  const a=order(shop,'42');
  const event={event_id:'sms-event-0001',observed_sender:'VF-CASH',recipient:'01000000000',sender_phone:'01012345678',amount_minor:5000,currency:'EGP',occurred_at:new Date().toISOString(),reference:'BANK-1234'};
  assert.equal(shop.ingestSms(event).status,'review');assert.equal(shop.order(a.id,'42').state,'payment_review');
  assert.equal(shop.ingestSms({...event,event_id:'sms-event-0002'}).status,'duplicate');
  assert.equal(shop.ingestSms({...event,event_id:'sms-event-0003',reference:'BANK-5678',amount_minor:4900}).status,'unmatched');
  assert.throws(()=>shop.ingestSms({...event,message:'OTP 123456'}),/SMS_FIELDS_NOT_ALLOWED/);
  assert.throws(()=>shop.ingestSms({...event,recipient:'01100000000'}),/WRONG_RECIPIENT/);
  order(shop,'43');assert.equal(shop.ingestSms({...event,event_id:'sms-event-0004',reference:'BANK-8888'}).status,'ambiguous');
  assert.equal(store.get('SELECT count(*) AS n FROM jobs').n,0);
  assert.throws(()=>shop.confirmPayment('111',a.id,{reference:'BANK-1234',amount:5000,sender:'01012345678',source:'sms'}),/TRUSTED_PAYMENT_REQUIRED/);
});
test('phone-side filter rejects PIN, OTP, personal and unknown SMS templates',()=>{
  const base={sender:'VF-CASH',eventId:'event-12345',occurredAt:new Date().toISOString(),recipient:'01000000000'};
  assert.equal(receiptFieldsOnDevice({...base,text:'OTP 123456'}),null);
  assert.equal(receiptFieldsOnDevice({...base,text:'رسالة شخصية'}),null);
  const parsed=receiptFieldsOnDevice({...base,text:'تم استلام مبلغ ٥٠.٥٠ جنيه من رقم ٠١٠١٢٣٤٥٦٧٨ رقم العملية BANK-1234'});
  assert.equal(parsed.amount_minor,5050);assert.equal(parsed.reference,'BANK-1234');assert.equal(parsed.text,undefined);
});
test('durable inbox deduplicates customer flow, confirms name, snapshots price, and isolates administration',async t=>{
  const {shop,store}=setup(t);let lookups=0;
  const bot=new TelegramShop({shop,lookup:async()=>{lookups++;return {id:'5285527481',nickname:'MOĪFR3OON'};}});
  const m=(update_id,text,user=42)=>({update_id,message:{text,from:{id:user},chat:{id:user,type:'private'}}});
  bot.accept(m(1,BUY_BUTTON));await bot.processOne();bot.accept(m(2,'5285527481'));bot.accept(m(2,'5285527481'));await bot.processOne();
  assert.equal(lookups,1);const o=store.get('SELECT * FROM orders LIMIT 1');
  shop.configure('111',{price:6000});assert.equal(shop.order(o.id,'42').price,5000);
  bot.accept({update_id:3,callback_query:{id:'cb',data:`shop:confirm:${o.id}`,from:{id:42},message:{chat:{id:42,type:'private'}}}});await bot.processOne();
  bot.accept(m(4,'01012345678'));await bot.processOne();assert.equal(shop.order(o.id,'42').state,'awaiting_payment');
  bot.accept(m(5,'/shopadmin'));await bot.processOne();assert.ok(store.all('SELECT payload FROM outbox').some(x=>x.payload.includes('ADMIN_ONLY')));
  bot.accept(m(6,'/shopadmin',111));await bot.processOne();assert.equal(shop.mode(),'simulation');
  assert.equal(bot.accept(m(7,'🔎 فحص PUBG ID')),false);assert.equal(bot.accept(m(8,'5285527481')),false);
});
test('real activation is manual-only and live mode is closed by default',async t=>{
  const {shop}=setup(t);assert.throws(()=>shop.configure('111',{mode:'live'}),/LIVE_MODE_NOT_APPROVED/);
  assert.throws(()=>shop.importCodes('111',[{code:'REAL-12345'}],{mode:'live'}),/REAL_STOCK_IMPORT_DISABLED/);
  const approved=setup(t,{allowManualPayment:true,allowRealStock:true,receiverWallet:'01000000000'}).shop;
  approved.configure('111',{mode:'live'});approved.importCodes('111',[{code:'TESTONLY-NOT-A-VALID-MIDAS-CODE',cost:4000}]);const o=order(approved);
  approved.confirmPayment('111',o.id,{reference:'TEST-STATEMENT',amount:5000,sender:'01012345678',source:'manual_verified_statement'});
  assert.equal((await approved.fulfillOne()).state,'manual_review');assert.equal(approved.stockCounts('live').reserved,1);
});
test('TXT/CSV document upload is restricted to the configured administrator',async t=>{
  const {shop,store}=setup(t);let downloads=0;
  const bot=new TelegramShop({shop,downloadFile:async()=>{downloads++;return 'code,cost_egp\nSIM-UPLOAD-1,39.50\nSIM-UPLOAD-2,40\n';}});
  const cb=(update_id,user)=>({update_id,callback_query:{id:'c',data:'shop:import',from:{id:user},message:{chat:{id:user,type:'private'}}}});
  bot.accept(cb(21,42));await bot.processOne();assert.equal(shop.session('42'),null);
  bot.accept(cb(22,111));await bot.processOne();
  bot.accept({update_id:23,message:{from:{id:111},chat:{id:111,type:'private'},document:{file_id:'fake-file',file_name:'codes.csv',file_size:90}}});await bot.processOne();
  assert.equal(downloads,1);assert.equal(shop.stockCounts().available,2);
  assert.ok(store.all('SELECT box FROM inbox').every(x=>!x.box.includes('SIM-UPLOAD')));
});
test('payment and reservation deadlines fail closed',async t=>{
  let now=Date.now();const {shop}=setup(t,{now:()=>now});stock(shop,1);const o=order(shop);pay(shop,o);
  now+=16*60000;assert.equal(await shop.fulfillOne(),null);
  assert.equal(shop.order(o.id,'42').state,'manual_review');assert.equal(shop.stockCounts().reserved,1);
  const expired=order(shop,'99');now+=31*60000;
  assert.throws(()=>pay(shop,expired),/PAYMENT_TIME_MISMATCH/);
});
test('nonce history survives reopening the durable database',t=>{
  const {shop,store,path,vault,connections}=setup(t);const nonce='replay-test-nonce-1234';
  shop.acceptNonce('sms',nonce,Date.now()+600000);store.close();
  const restored=new Store(path);connections.push(restored);const reopened=new Shop({store:restored,vault,adminIds:['111']});
  assert.throws(()=>reopened.acceptNonce('sms',nonce,Date.now()+600000),/REPLAY_DETECTED/);
});
