import crypto from 'node:crypto';
import { signEnvelope } from '../topup/security.js';

export async function forwardTopupUpdate(update,{fetchImpl=fetch,env=process.env}={}){
  if(env.TOPUP_ENABLED!=='true') return false;
  const url=new URL(env.TOPUP_SERVICE_URL);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash) throw new Error('TOPUP_CONFIGURATION_INVALID');
  const secret=env.TOPUP_BRIDGE_SECRET;
  if(!secret||secret.length<32) throw new Error('TOPUP_CONFIGURATION_INVALID');
  const body=JSON.stringify(update);const timestamp=String(Date.now());const nonce=crypto.randomBytes(18).toString('hex');
  const text=String(update.message?.text||'').trim();
  const freeLookup=text==='🔎 فحص PUBG ID'||text==='🔎 معرفة اسم لاعب PUBG'||/^\/pubg(?:@\w+)?(?:\s|$)/.test(text);
  url.pathname='/telegram';
  let response;
  try{
    response=await fetchImpl(url,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8000),
      headers:{'Content-Type':'application/json','x-shop-timestamp':timestamp,'x-shop-nonce':nonce,
        'x-shop-signature':signEnvelope(secret,'POST','/telegram',timestamp,nonce,body)},body
    });
  }catch{if(freeLookup) return false;throw new Error('TOPUP_SERVICE_UNAVAILABLE');}
  if(!response.ok){if(freeLookup) return false;throw new Error('TOPUP_SERVICE_UNAVAILABLE');}
  const data=await response.json();
  if(typeof data.handled!=='boolean') throw new Error('TOPUP_RESPONSE_INVALID');
  return data.handled;
}
