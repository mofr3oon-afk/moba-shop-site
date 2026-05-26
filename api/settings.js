import { rateLimit, safeError } from '../lib/_security.js';
import { requireAdmin, requireRole, logAdminEvent } from '../lib/admin-auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_KEYS = ['store_status','store_message','work_status','work_status_message'];
function json(res,status,obj){res.status(status).json(obj);}
function isReady(){return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)}
async function supa(path,opts={}){
  if(!isReady()) throw new Error('Supabase غير مفعل');
  const r = await fetch(`${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`,{
    ...opts,
    headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation',...(opts.headers||{})}
  });
  const text = await r.text();
  let data; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
function normalizeValue(v){
  if(v === 'true') return true;
  if(v === 'false') return false;
  if(typeof v === 'string'){
    const t=v.trim();
    if((t.startsWith('[')&&t.endsWith(']'))||(t.startsWith('{')&&t.endsWith('}'))){ try{return JSON.parse(t)}catch{} }
  }
  return v;
}
function serializeValue(v){ return Array.isArray(v) || (v && typeof v==='object') ? JSON.stringify(v) : String(v ?? ''); }
async function readSettings(all=false){
  const rows = await supa('settings?select=key,value');
  const settings = {};
  for(const r of rows || []){
    if(!all && !PUBLIC_KEYS.includes(r.key)) continue;
    settings[r.key] = normalizeValue(r.value);
  }
  return settings;
}
export default async function handler(req,res){
  try{ rateLimit(req,'settings',80,60_000); }
  catch(e){ return safeError(res,e,e.statusCode||429); }
  try{
    if(req.method === 'GET'){
      const wantsAdmin = String(req.query?.admin||'') === '1';
      if(wantsAdmin) requireAdmin(req);
      const settings = await readSettings(wantsAdmin);
      return json(res,200,{ok:true,settings});
    }
    if(req.method === 'POST'){
      const admin = requireAdmin(req);
      requireRole(admin, ['owner']);
      if(!isReady()) return json(res,200,{ok:false,error:'Supabase غير مفعل'});
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const input = body.settings && typeof body.settings === 'object' ? body.settings : {};
      const allowed = ['store_status','store_message','work_status','work_status_message','blacklist_phones','blacklist_ips','blacklist_device_ids','blacklist_pubg_ids','trusted_admin_devices','trusted_admin_ips','product_overrides','coupon_rules','maintenance_mode','policy_text','vip_phones','customer_notes','staff_settings','sla_minutes','admin_notifications'];
      const rows = Object.entries(input).filter(([k])=>allowed.includes(k)).map(([key,value])=>({key,value:serializeValue(value),updated_at:new Date().toISOString()}));
      if(!rows.length) return json(res,400,{ok:false,error:'لا يوجد إعدادات للحفظ'});
      await supa('settings',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(rows)});
      const settings = await readSettings(true);
      await logAdminEvent('settings_update', req, {keys:Object.keys(input)}).catch(()=>null);
      return json(res,200,{ok:true,settings});
    }
    return json(res,405,{ok:false,error:'Method not allowed'});
  }catch(e){ return safeError(res,e,e.statusCode||500); }
}
