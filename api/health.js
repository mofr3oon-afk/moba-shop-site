import { rateLimit, safeError, json } from '../lib/_security.js';
import { requireAdmin } from '../lib/admin-auth.js';
import { supabaseReady } from '../lib/_utils.js';

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BOT_TOKEN',
  'ORDER_GROUP_ID',
  'ADMIN_IDS',
  'ADMIN_PANEL_SECRET',
  'ADMIN_SESSION_SECRET',
  'TELEGRAM_WEBHOOK_SECRET',
  'INTERNAL_API_SECRET',
  'CRON_SECRET'
];

function envStatus(){
  return REQUIRED_ENV.map(key => ({key, ok:Boolean(process.env[key])}));
}

export default async function handler(req,res){
  try{
    rateLimit(req,'health',20,60_000);
    requireAdmin(req);
    if(req.method !== 'GET') return json(res,405,{ok:false,error:'Method not allowed'});
    const env = envStatus();
    const missing = env.filter(x=>!x.ok).map(x=>x.key);
    return json(res,200,{
      ok: missing.length === 0 && supabaseReady(),
      supabase: supabaseReady(),
      env,
      missing,
      advice: missing.length ? 'راجع متغيرات Vercel الناقصة قبل استقبال طلبات حقيقية.' : 'الفحص الأساسي سليم.'
    });
  }catch(e){
    return safeError(res,e,e.statusCode||500);
  }
}
