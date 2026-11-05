import { json, supabaseReady, supabaseRequest, telegramJson } from '../_utils.js';
import { safeError } from '../_security.js';
import { requireAdmin } from '../admin-auth.js';

function requiredEnvMissing(){
  return ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','BOT_TOKEN','ORDER_GROUP_ID','ADMIN_IDS','ORDER_RECEIPTS_BUCKET','ORDER_ACCESS_SECRET','ADMIN_SESSION_SECRET']
    .filter(k=>!process.env[k]);
}

async function readPaymentConfigured(){
  const fallback = {ok:false, detail:'not configured'};
  if(!supabaseReady()) return fallback;
  const rows = await supabaseRequest('settings?key=eq.payment_settings&select=value&limit=1').catch(()=>[]);
  const raw = rows?.[0]?.value;
  if(!raw) return {ok:true, detail:'using defaults'};
  const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const insta = p?.instapay || {};
  const wallet = p?.wallet || {};
  const ok = Boolean((insta.user && insta.link) || (wallet.phone && wallet.name));
  return {ok, detail: ok ? 'ready' : 'missing payment fields'};
}

async function readErrorLogs(){
  if(!supabaseReady()) return [];
  const rows = await supabaseRequest('settings?key=eq.client_error_logs&select=value&limit=1').catch(()=>[]);
  const raw = rows?.[0]?.value;
  try{
    const logs = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(logs) ? logs.slice(-50).reverse() : [];
  }catch{return [];}
}

export default async function handler(req,res){
  try{ requireAdmin(req); }catch(e){ return safeError(res,e,e.statusCode||401); }
  if(req.method !== 'GET') return json(res,405,{ok:false,error:'Method not allowed'});
  try{
    const missing = requiredEnvMissing();
    const checks = {
      supabaseReachable:false,
      telegramConfigured:Boolean(process.env.BOT_TOKEN),
      telegramReachable:false,
      storageReady:false,
      paymentConfigured:false,
      paymentDetail:'not configured'
    };
    if(supabaseReady()){
      await supabaseRequest('orders?select=id&limit=1');
      checks.supabaseReachable = true;
      if(process.env.ORDER_RECEIPTS_BUCKET){
        const storage=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/storage/v1/bucket/'+encodeURIComponent(process.env.ORDER_RECEIPTS_BUCKET),{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY}});
        if(storage.ok){const bucket=await storage.json();checks.storageReady=bucket.public===false;}
      }
      const pay = await readPaymentConfigured();
      checks.paymentConfigured = pay.ok;
      checks.paymentDetail = pay.detail;
    }
    if(process.env.BOT_TOKEN){
      const me = await telegramJson('getMe',{}).catch(()=>null);
      checks.telegramReachable = Boolean(me?.ok);
    }
    return json(res,200,{ok:true,checks,requiredEnvMissing:missing,errorLogs:await readErrorLogs()});
  }catch(e){ return safeError(res,e,500); }
}
