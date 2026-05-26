import { requireSetupSecret, rateLimit, safeError } from '../lib/_security.js';
// moba-v40-security
import { json } from '../lib/_utils.js';
export default async function handler(req,res){
  try{ rateLimit(req,'setup',5,60_000); requireSetupSecret(req); }catch(e){ return safeError(res,e,e.statusCode||401); }
  try{
    if(String(req.query.key||'') !== String(process.env.SETUP_SECRET||'')) return json(res,403,{ok:false,error:'wrong setup key'});
    const host=req.headers['x-forwarded-host'] || req.headers.host;
    const proto=req.headers['x-forwarded-proto'] || 'https';
    const baseUrl=process.env.BASE_URL || `${proto}://${host}`;
    const secret=process.env.TELEGRAM_WEBHOOK_SECRET || '';
    const webhookUrl=`${baseUrl.replace(/\/$/,'')}/api/telegram${secret?`?secret=${encodeURIComponent(secret)}`:''}`;
    const r=await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:webhookUrl,allowed_updates:['message','callback_query']})});
    const data=await r.json().catch(()=>({}));
    return json(res,200,{ok:Boolean(data.ok),webhookUrl,telegram:data});
  }catch(e){return json(res,500,{ok:false,error:e.message});}
}
