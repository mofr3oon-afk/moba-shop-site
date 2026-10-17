import http from 'node:http';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Store } from './store.js';
import { Vault, verifyEnvelope, ShopError, insist } from './security.js';
import { Shop } from './engine.js';
import { TelegramShop } from './telegram.js';
import { encryptedBackup,backupVault } from './backup.js';
import { join,dirname } from 'node:path';

export function loadConfig(env=process.env){
  insist(env.TOPUP_DB_PATH&&env.STOCK_KEYS_JSON&&env.STOCK_FINGERPRINT_KEY,'STORAGE_CONFIGURATION_REQUIRED',503);
  insist(env.TOPUP_BRIDGE_SECRET?.length>=32&&env.SMS_WEBHOOK_SECRET?.length>=32,'WEBHOOK_SECRETS_REQUIRED',503);
  const keys=JSON.parse(env.STOCK_KEYS_JSON);
  insist(env.BACKUP_KEY_BASE64,'BACKUP_KEY_REQUIRED',503);
  return {dbPath:env.TOPUP_DB_PATH,vault:new Vault({keys,currentKeyId:env.STOCK_ACTIVE_KEY_ID||'v1',fingerprintKey:env.STOCK_FINGERPRINT_KEY}),
    adminIds:String(env.TOPUP_ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(Boolean),
    bridgeSecret:env.TOPUP_BRIDGE_SECRET,smsSecret:env.SMS_WEBHOOK_SECRET,botToken:env.BOT_TOKEN,
    backupVault:backupVault(env.BACKUP_KEY_BASE64),backupDirectory:env.BACKUP_DIRECTORY||join(dirname(env.TOPUP_DB_PATH),'backups'),
    receiverWallet:env.VODAFONE_RECEIVER_WALLET||null,
    allowManualPayment:env.ALLOW_MANUAL_VERIFIED_PAYMENTS==='true',allowRealStock:env.ALLOW_REAL_STOCK_IMPORT==='true'};
}
export function telegramTransport(token,{fetchImpl=fetch}={}){
  return async (method,payload)=>{
    insist(token,'BOT_TOKEN_REQUIRED',503);
    let response;
    try{
      response=await fetchImpl(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},
        signal:AbortSignal.timeout(10000),body:JSON.stringify(payload)});
      const result=await response.json();if(!response.ok||result.ok!==true) throw new Error();return result.result;
    }catch{throw new ShopError('TELEGRAM_UNAVAILABLE',503);}
  };
}
export function telegramDownload(token,{fetchImpl=fetch}={}){
  const send=telegramTransport(token,{fetchImpl});
  return async fileId=>{
    const file=await send('getFile',{file_id:fileId});
    insist(file?.file_path&&(file.file_size??0)<=256*1024&&/^[A-Za-z0-9_./-]+$/.test(file.file_path)&&!file.file_path.includes('..'),'INVALID_TELEGRAM_FILE');
    try{
      const r=await fetchImpl(`https://api.telegram.org/file/bot${token}/${file.file_path}`,{signal:AbortSignal.timeout(10000),redirect:'error'});
      insist(r.ok,'FILE_DOWNLOAD_FAILED',503);
      let total=0;const chunks=[];
      for await(const chunk of r.body){total+=chunk.length;insist(total<=256*1024,'IMPORT_TOO_LARGE');chunks.push(chunk);}
      return Buffer.concat(chunks).toString('utf8');
    }catch{throw new ShopError('FILE_DOWNLOAD_FAILED',503);}
  };
}
export function createApp(config){
  const store=new Store(config.dbPath);
  const shop=new Shop({store,...config});shop.recover();
  const bot=new TelegramShop({shop,lookup:config.lookup,downloadFile:config.downloadFile||telegramDownload(config.botToken)});
  const send=config.send||telegramTransport(config.botToken);
  const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  const server=http.createServer(async(req,res)=>{
    try{
      const path=new URL(req.url,'http://local').pathname;
      if(path==='/health'&&req.method==='GET') return json(res,200,{ok:true,mode:shop.mode(),liveRedemption:false});
      insist(req.method==='POST'&&['/telegram','/hooks/sms'].includes(path),'NOT_FOUND',404);
      let size=0;const chunks=[];
      for await(const chunk of req){size+=chunk.length;insist(size<=300*1024,'REQUEST_TOO_LARGE',413);chunks.push(chunk);}
      const raw=Buffer.concat(chunks).toString('utf8');
      const envelope=verifyEnvelope(path==='/telegram'?config.bridgeSecret:config.smsSecret,{method:req.method,path,headers:req.headers,body:raw,now:shop.now()});
      shop.acceptNonce(path,envelope.nonce,envelope.expires);
      let body;try{body=JSON.parse(raw);}catch{throw new ShopError('INVALID_JSON');}
      if(path==='/hooks/sms') return json(res,200,shop.ingestSms(body));
      const handled=bot.accept(body);
      if(handled&&body.callback_query?.id){
        store.run('INSERT OR IGNORE INTO outbox VALUES(?,?,?,?,?,0)',`ack:${body.update_id}`,
          String(body.callback_query.message.chat.id),JSON.stringify({method:'answerCallbackQuery',expiresAt:shop.now()+60000,callback_query_id:body.callback_query.id}),'pending',shop.now());
      }
      return json(res,handled?202:200,{handled});
    }catch(error){
      // Deliberately exclude exception messages/stacks/requests from logs and responses.
      const code=error instanceof ShopError?error.code:'INTERNAL_ERROR';
      if(!res.headersSent) json(res,error instanceof ShopError?error.status:500,{ok:false,error:code});
      else res.end();
    }
  });
  server.requestTimeout=15000;server.headersTimeout=15000;
  let busy=false,timer,backingUp=false,backupTimer;
  async function backupTick(){
    if(!config.backupVault||backingUp||shop.now()-store.setting('backup_last',0)<86400000) return;
    backingUp=true;
    try{
      await encryptedBackup(store,config.backupVault,join(config.backupDirectory,`topup-${shop.now()}-${crypto.randomUUID()}.bak`));
      store.set('backup_last',shop.now());
    }catch{shop.notifyAdmins(`backup-failed:${Math.floor(shop.now()/86400000)}`,'⚠️ فشل النسخ الاحتياطي. راجع المساحة والإعدادات.');}
    finally{backingUp=false;}
  }
  async function tick(){
    if(busy) return;busy=true;
    try{
      await bot.processOne();await shop.fulfillOne();
      for(let i=0;i<10;i++){
        const item=store.get("SELECT * FROM outbox WHERE state='pending' AND updated<=? ORDER BY rowid LIMIT 1",shop.now());
        if(!item) break;
        store.run("UPDATE outbox SET state='sending' WHERE id=?",item.id);
        try{
          const {method='sendMessage',expiresAt,...payload}=JSON.parse(item.payload);
          if(method==='answerCallbackQuery'&&shop.now()>expiresAt){store.run("UPDATE outbox SET state='sent' WHERE id=?",item.id);continue;}
          await send(method,payload);
          store.run("UPDATE outbox SET state='sent',updated=? WHERE id=?",shop.now(),item.id);
        }catch{
          store.run("UPDATE outbox SET state='pending',attempts=attempts+1,updated=? WHERE id=?",shop.now()+Math.min(300000,2000*2**Math.min(item.attempts,7)),item.id);
        }
      }
    }catch{shop.audit('worker','action_error','worker',{code:'WORKER_TICK_FAILED'});}
    finally{busy=false;}
  }
  return {server,store,shop,bot,tick,
    startWorker(){timer=setInterval(tick,500);timer.unref();backupTimer=setInterval(backupTick,300000);backupTimer.unref();void backupTick();},
    async close(){clearInterval(timer);clearInterval(backupTimer);await new Promise(resolve=>server.listening?server.close(resolve):resolve());while(busy||backingUp) await new Promise(r=>setTimeout(r,10));store.close();}
  };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const app=createApp(loadConfig());app.server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Topup service ready (live redemption disabled).'));
    app.startWorker();
    let stopping=false;const stop=async()=>{if(stopping)return;stopping=true;await app.close();process.exit(0);};
    process.on('SIGTERM',stop);process.on('SIGINT',stop);
  }catch{console.error('Topup startup failed: check required environment variables.');process.exitCode=1;}
}
