import { rateLimit, safeError } from '../lib/_security.js';
// moba-v40-security

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res,status,obj){res.status(status).json(obj);}
async function supa(path,opts={}){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
    ...opts,
    headers:{
      apikey:SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'return=representation',
      ...(opts.headers||{})
    }
  });
  const text = await r.text();
  let data; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
function parseCart(raw){
  if(!raw) return [];
  try{
    const decoded = decodeURIComponent(String(raw));
    return JSON.parse(decoded);
  }catch(e){
    try{return JSON.parse(String(raw));}catch(_){return [];}
  }
}
function itemQty(item){ return Math.max(1, Number(item.qty || 1)); }
function itemLineTotal(item){ return Number(item.price || 0) * itemQty(item); }
function normalizeProduct(p){ return String(p || '').toLowerCase().replace(/\s+/g,' ').trim(); }
function scopeMatches(item, productScopes){
  if(!productScopes || !Array.isArray(productScopes) || !productScopes.length) return true;
  const product = normalizeProduct(item.product);
  return productScopes.some(scope => {
    const s = normalizeProduct(scope);
    return s && (product.includes(s) || s.includes(product));
  });
}
function calcDiscount(coupon,total,cart){
  const scopes = Array.isArray(coupon.product_scopes) ? coupon.product_scopes : [];
  const eligibleItems = (cart && cart.length ? cart : []).filter(item => scopeMatches(item, scopes));
  const eligibleTotal = cart && cart.length ? eligibleItems.reduce((s,item)=>s+itemLineTotal(item),0) : total;
  if(eligibleTotal <= 0 && scopes.length) throw new Error(`الكوبون ده مش مناسب للمنتجات الموجودة في السلة حاليًا${scopes.length ? ' — ينفع على: ' + scopes.join(' / ') : ''}`);
  const base = scopes.length ? eligibleTotal : total;
  let discount = 0;
  if(coupon.discount_type === 'percent'){
    discount = Math.floor(base * Number(coupon.discount_value || 0) / 100);
    if(Number(coupon.max_discount_amount || 0) > 0) discount = Math.min(discount, Number(coupon.max_discount_amount));
  }else{
    discount = Number(coupon.discount_amount || coupon.discount_value || 0);
  }
  discount = Math.min(discount, base, total);
  if(discount <= 0) throw new Error('قيمة الخصم غير صحيحة');
  return {discount, eligibleTotal, scopes};
}

async function readCouponRuleFromSettings(code){
  try{
    const rows = await supa('settings?key=eq.coupon_rules&select=value&limit=1');
    const raw = rows && rows[0] && rows[0].value;
    const list = raw ? JSON.parse(raw) : [];
    const found = Array.isArray(list) ? list.find(x=>String(x.code||'').trim().toUpperCase()===code) : null;
    if(!found) return null;
    return {
      code: String(found.code||'').trim().toUpperCase(),
      is_active: found.active !== false,
      discount_type: found.type === 'percent' ? 'percent' : 'fixed',
      discount_value: Number(found.value||0),
      discount_amount: Number(found.value||0),
      min_order_amount: Number(found.min||0),
      product_scopes: Array.isArray(found.products) ? found.products : [],
      expires_at: found.expires_at || null
    };
  }catch(e){ return null; }
}
export default async function handler(req,res){
  try{
    rateLimit(req,'coupon',40,60_000);
    if(req.method !== 'GET') return json(res,405,{ok:false,error:'Method not allowed'});
    const code = String(req.query.code || '').trim().toUpperCase();
    const total = Number(req.query.total || 0);
    const cart = parseCart(req.query.cart || '');
    if(!code) return json(res,400,{ok:false,error:'اكتب كود الخصم'});
    if(total <= 0) return json(res,400,{ok:false,error:'السلة فاضية'});
    const rows = await supa(`coupons?code=eq.${encodeURIComponent(code)}&select=*&limit=1`).catch(()=>[]);
    let c = rows && rows[0];
    if(!c) c = await readCouponRuleFromSettings(code);
    if(!c) return json(res,404,{ok:false,error:'الكود ده غير موجود. راجع الكتابة أو جرّب كود تاني'});
    if(!c.is_active) return json(res,400,{ok:false,error:'الكوبون ده متوقف حاليًا'});
    if(c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return json(res,400,{ok:false,error:'صلاحية الكوبون انتهت'});
    if(Number(c.min_order_amount || 0) > total) return json(res,400,{ok:false,error:`الكوبون يحتاج طلب بقيمة ${c.min_order_amount} جنيه على الأقل`});
    const result = calcDiscount(c,total,cart);
    return json(res,200,{ok:true,coupon:{
      code:c.code,
      discount_amount:result.discount,
      discount_type:c.discount_type || 'fixed',
      discount_value:Number(c.discount_value || c.discount_amount || 0),
      product_scopes:result.scopes,
      product_scope_text:result.scopes.length ? result.scopes.join(' / ') : 'كل المنتجات'
    }});
  }catch(e){
    return safeError(res,e,e.statusCode||500);
  }
}
