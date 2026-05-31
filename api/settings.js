import { rateLimit, safeError } from '../lib/_security.js';
import { requireAdmin, requireRole, logAdminEvent } from '../lib/admin-auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_KEYS = ['store_status','store_message','store_status_message','work_status','work_status_message','product_overrides','dynamic_products','dynamic_sections','exclusive_offer','game_settings','policy_text','maintenance_mode','payment_settings'];
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

function textKey(v){
  return String(v||'').trim().toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/\s+/g,' ');
}

function digitNormalize(v){
  const ar='٠١٢٣٤٥٦٧٨٩'; const fa='۰۱۲۳۴۵۶۷۸۹';
  return String(v||'').replace(/[٠-٩]/g,d=>String(ar.indexOf(d))).replace(/[۰-۹]/g,d=>String(fa.indexOf(d)));
}
function sectionDedupeKey(raw){
  const game=String(raw&&raw.game||'pubg').trim()||'pubg';
  let title=textKey(digitNormalize(raw&& (raw.title||raw.name||raw.key) || ''));
  title=title.replace(/\b(عرض|عروض|العروض|offer|offers)\b/gi,'').replace(/\s+/g,' ').trim();
  // عروض شهر 6 كانت بتتسجل بأكتر من صيغة، فنثبت مفتاح واحد لها
  if(/شهر\s*6/.test(title) || /month\s*6/i.test(title)) title='month_6_offer';
  return game+'|'+title;
}

function keyify(v,fallback='section'){
  let k=String(v||'').trim().toLowerCase()
    .replace(/[\s\-]+/g,'_')
    .replace(/[^a-z0-9_\u0600-\u06FF]/g,'')
    .replace(/_+/g,'_').replace(/^_|_$/g,'');
  return k || (fallback+'_'+Date.now().toString(36).slice(-4));
}
function cleanCatalogInput(input){
  if(Array.isArray(input.dynamic_sections)){
    const byKey=new Map();
    const byTitle=new Map();
    for(const raw of input.dynamic_sections){
      if(!raw || typeof raw!=='object') continue;
      const title=String(raw.title||raw.name||raw.key||'').trim();
      if(!title) continue;
      const game=String(raw.game||'pubg').trim() || 'pubg';
      const key=keyify(raw.key||title,'section');
      const sec={
        ...raw,
        key,
        title,
        game,
        location: raw.location || 'game',
        status: raw.status || 'available',
        sort_order: Number(raw.sort_order||0),
        active: raw.active !== false,
        image: String(raw.image||'').trim(),
        subtitle: String(raw.subtitle||'').trim(),
        layout: raw.layout || 'cards',
        badge: String(raw.badge||'').trim()
      };
      const k=game+'|'+key;
      const t=sectionDedupeKey(sec);
      if(byTitle.has(t)){
        // نفس القسم/العرض لنفس اللعبة حتى لو الاسم اتكتب بصيغة مختلفة: نحدث القديم بدل التكرار
        const oldKey=byTitle.get(t);
        const old=byKey.get(oldKey)||{};
        byKey.set(oldKey,{...old,...sec,key:old.key||sec.key,title:sec.title||old.title,origin:old.origin||sec.origin||'admin_deduped'});
        continue;
      }
      byTitle.set(t,k);
      byKey.set(k,{...(byKey.get(k)||{}),...sec});
    }
    input.dynamic_sections=[...byKey.values()].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.title).localeCompare(String(b.title),'ar'));
  }
  if(Array.isArray(input.dynamic_products)){
    const sections=Array.isArray(input.dynamic_sections)?input.dynamic_sections:[];
    const validSections=new Set(sections.map(s=>String(s.game||'pubg')+'|'+String(s.key||'')));
    const firstByGame={};
    sections.forEach(s=>{const g=String(s.game||'pubg'); if(!firstByGame[g]) firstByGame[g]=s.key;});
    const byProduct=new Map();
    for(const raw of input.dynamic_products){
      if(!raw || typeof raw!=='object') continue;
      const name=String(raw.name||'').trim();
      if(!name) continue;
      let game=String(raw.game||'pubg').trim() || 'pubg';
      let cat=keyify(raw.cat||firstByGame[game]||'uc','cat');
      if(validSections.size && !validSections.has(game+'|'+cat)){
        const fallback=sections.find(s=>String(s.game||'pubg')===game) || sections[0];
        if(fallback){ game=String(fallback.game||game); cat=String(fallback.key||cat); }
      }
      const prod={
        ...raw,
        id: raw.id || ('prod_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6)),
        name,
        game,
        cat,
        price: Number(raw.price||0),
        sale_price: Number(raw.sale_price||raw.discount_price||0),
        cost: Number(raw.cost||0),
        uc: Number(raw.uc||0),
        sort_order: Number(raw.sort_order||0),
        status: raw.status || 'available',
        image: String(raw.image||'').trim(),
        type: String(raw.type||'').trim(),
        warning: String(raw.warning||'').trim(),
        hidden: !!raw.hidden,
        hot: !!raw.hot,
        featured: !!raw.featured,
        noQty: !!raw.noQty
      };
      const k=game+'|'+cat+'|'+textKey(name);
      byProduct.set(k,{...(byProduct.get(k)||{}),...prod});
    }
    input.dynamic_products=[...byProduct.values()].sort((a,b)=>String(a.game).localeCompare(String(b.game))||String(a.cat).localeCompare(String(b.cat))||Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.name).localeCompare(String(b.name),'ar'));
  }
  if(input.exclusive_offer && typeof input.exclusive_offer==='object'){
    const o=input.exclusive_offer;
    if(Array.isArray(o.products)){
      const seen=new Set();
      o.products=o.products.map(x=>String(x||'').trim()).filter(x=>{const k=textKey(x); if(!k||seen.has(k))return false; seen.add(k); return true;});
    }
    o.image=String(o.image||'').trim();
    o.title=String(o.title||'عروض حصرية').trim() || 'عروض حصرية';
  }
  return input;
}

async function readSettings(all=false){
  const rows = await supa('settings?select=key,value');
  const settings = {};
  for(const r of rows || []){
    if(!all && !PUBLIC_KEYS.includes(r.key)) continue;
    settings[r.key] = normalizeValue(r.value);
  }
  return settings;
}

async function sendAdminTelegram(text){
  const token=process.env.BOT_TOKEN;
  const ids=String(process.env.ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!token || !ids.length) return;
  for(const chat_id of ids){
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id,text,parse_mode:'HTML'})
    }).catch(()=>null);
  }
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
      let input = body.settings && typeof body.settings === 'object' ? body.settings : {};
      input = cleanCatalogInput(input);
      const allowed = ['store_status','store_message','work_status','work_status_message','blacklist_phones','blacklist_ips','blacklist_device_ids','blacklist_pubg_ids','trusted_admin_devices','trusted_admin_ips','product_overrides','dynamic_products','dynamic_sections','exclusive_offer','game_settings','coupon_rules','maintenance_mode','payment_settings','policy_text','store_status_message','vip_phones','customer_notes','staff_settings','sla_minutes','admin_notifications','payment_settings','payment_history','trusted_admin_device_meta','blacklist_entries','client_error_logs'];
      const rows = Object.entries(input).filter(([k])=>allowed.includes(k)).map(([key,value])=>({key,value:serializeValue(value),updated_at:new Date().toISOString()}));
      if(!rows.length) return json(res,400,{ok:false,error:'لا يوجد إعدادات للحفظ'});
      const previousSettings = input.payment_settings ? await readSettings(true).catch(()=>({})) : {};
      await supa('settings',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(rows)});
      const settings = await readSettings(true);
      await logAdminEvent('settings_update', req, {keys:Object.keys(input)}).catch(()=>null);
      if(input.payment_settings){
        const p=input.payment_settings || {};
        const oldPay=previousSettings.payment_settings || {};
        await logAdminEvent('payment_settings_update', req, {old:oldPay,new:p}).catch(()=>null);
        await sendAdminTelegram(`🔐 <b>MOBA SHOP Admin</b>
تم تغيير بيانات الدفع من لوحة الأدمن.

Wallet: <code>${String(p.wallet?.phone||'-')}</code>
InstaPay: <code>${String(p.instapay?.user||'-')}</code>
Status: ${String(p.wallet?.status||'-')} / ${String(p.instapay?.status||'-')}`).catch(()=>null);
      }
      return json(res,200,{ok:true,settings});
    }
    return json(res,405,{ok:false,error:'Method not allowed'});
  }catch(e){ return safeError(res,e,e.statusCode||500); }
}
