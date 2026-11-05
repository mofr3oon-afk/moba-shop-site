import { supabaseRequest, supabaseReady } from './_utils.js';
const supa=supabaseRequest;
function invalid(message){const e=new Error(message);e.statusCode=400;return e;}
function normalizeCouponProduct(p){ return String(p || '').toLowerCase().replace(/\s+/g,' ').trim(); }
function couponItemQty(item){ return Math.max(1, Number(item.qty || 1)); }
function couponItemLineTotal(item){ return Number(item.price || 0) * couponItemQty(item); }
function couponScopeMatches(item, productScopes){
  if(!productScopes || !Array.isArray(productScopes) || !productScopes.length) return true;
  const product = normalizeCouponProduct(item.product);
  return productScopes.some(scope => {
    const s = normalizeCouponProduct(scope);
    return s && (String(item.productId||'').toLowerCase()===s || product.includes(s) || s.includes(product));
  });
}
async function readCouponRuleFromSettings(code){
  try{
    const rows = await supa('settings?key=eq.coupon_rules&select=value&limit=1');
    const raw = rows && rows[0] && rows[0].value;
    const list = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
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
      expires_at: found.expires_at || null,
      first_order_only: found.firstOrderOnly === true || found.first_order_only === true
    };
  }catch(e){ return null; }
}
export async function validateCouponServer(code,total,cart=[],phone=''){
  code = String(code || '').trim().toUpperCase();
  if(!code) return null;
  const settingsCoupon = await readCouponRuleFromSettings(code);
  let c = settingsCoupon;
  if(!c) throw invalid('الكود ده غير موجود. راجع الكتابة أو جرّب كود تاني');
  if(c.is_active === false || c.active === false) throw invalid('كود الخصم متوقف حاليا');
  if(c.expires_at && new Date(c.expires_at).getTime() < Date.now()) throw invalid('كود الخصم منتهي');
  if(c.first_order_only && phone && supabaseReady()){
    const used = await supabaseRequest(`orders?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`);
    if(used?.[0]) throw invalid('الكوبون ده لأول طلب فقط، ورقم الموبايل استخدم قبل كده');
  }
  if(Number(c.min_order_amount || 0) > total) throw invalid(`الكوبون يحتاج طلب بقيمة ${c.min_order_amount} جنيه على الأقل`);
  const scopes = Array.isArray(c.product_scopes) ? c.product_scopes : [];
  const eligibleItems = (Array.isArray(cart) ? cart : []).filter(item => couponScopeMatches(item, scopes));
  const eligibleTotal = Array.isArray(cart) && cart.length ? eligibleItems.reduce((s,item)=>s+couponItemLineTotal(item),0) : total;
  if(scopes.length && eligibleTotal <= 0) throw invalid(`الكوبون ده مش مناسب للمنتجات الموجودة في السلة حاليًا${scopes.length ? ' — ينفع على: ' + scopes.join(' / ') : ''}`);
  const base = scopes.length ? eligibleTotal : total;
  let discount = 0;
  if(c.discount_type === 'percent'){
    discount = Math.floor(base * Number(c.discount_value || 0) / 100);
    if(Number(c.max_discount_amount || 0) > 0) discount = Math.min(discount, Number(c.max_discount_amount));
  }else{
    discount = Number(c.discount_amount || c.discount_value || 0);
  }
  discount = Math.min(discount, base, total);
  if(!Number.isFinite(discount)||discount <= 0) throw invalid('قيمة الخصم غير صحيحة');
  return {code:c.code,discount_amount:discount,discount_type:c.discount_type||'fixed',discount_value:Number(c.discount_value||c.discount_amount||0),first_order_only:!!c.first_order_only,product_scopes:scopes,product_scope_text:scopes.length?scopes.join(' / '):'كل المنتجات'};
}
