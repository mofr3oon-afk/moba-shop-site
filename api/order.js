import { rateLimit, persistentRateLimit, safeError, getClientIp } from '../lib/_security.js';
// moba-v40-security
export const config = { api: { bodyParser: false } };
import crypto from 'node:crypto';
import { json, escapeHtml, supabaseReady, supabaseRequest, telegramForm, telegramKeyboard, buildTelegramText, cairoDateKey, STATUS_LABELS, OPEN_STATUSES } from '../lib/_utils.js';

async function supa(path, opts={}){ return await supabaseRequest(path, opts); }

function wait(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

async function telegramFormWithRetry(method, formFactory, attempts=3){
  let lastError;
  for(let i=0;i<attempts;i++){
    try{
      return await telegramForm(method, formFactory());
    }catch(error){
      lastError = error;
      if(i < attempts - 1) await wait(450 * (i + 1));
    }
  }
  throw lastError;
}

function fail(status, message){
  const err = new Error(message);
  err.statusCode = status;
  return err;
}

function publicOrderError(res, error){
  const msg = String(error?.message || '');
  const status = Number(error?.statusCode || 0);
  if(status >= 400 && status < 500) return json(res,status,{ok:false,error:msg || 'راجع بيانات الطلب'});
  const internal = /missing|supabase|telegram|fetch|network|service_role|bot_token|order_group_id|unexpected|syntax|json/i.test(msg);
  if(internal) return safeError(res,error,500);
  return json(res,400,{ok:false,error:msg || 'راجع بيانات الطلب وحاول تاني'});
}

function missingColumnFromSupabaseError(err){
  const msg=String(err?.message||err||'');
  const m=msg.match(/Could not find the '([^']+)' column/i) || msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+.*does not exist/i);
  return m ? m[1] : '';
}
async function supabaseWriteWithSchemaFallback(path, payload, options={}){
  const clean={...(payload||{})};
  const removed=[];
  for(let i=0;i<12;i++){
    try{
      return await supabaseRequest(path,{...options,body:JSON.stringify(clean)});
    }catch(err){
      const col=missingColumnFromSupabaseError(err);
      if(col && Object.prototype.hasOwnProperty.call(clean,col)){
        removed.push(col);
        delete clean[col];
        if(clean.raw_data && typeof clean.raw_data==='object') clean.raw_data.schemaFallbackRemoved=removed;
        continue;
      }
      throw err;
    }
  }
  return await supabaseRequest(path,{...options,body:JSON.stringify(clean)});
}


function itemQty(item){ return Math.max(1, Number(item.qty || 1)); }
function itemLineTotal(item){ return Number(item.price||0) * itemQty(item); }

function looksFakeDigits(value, kind='number'){
  const v=String(value||'').replace(/\D/g,'');
  if(!v) return true;
  if(/^(\d)\1+$/.test(v)) return true;
  if(/0123456789|123456789|234567890|987654321|0987654321/.test(v)) return true;
  if(kind==='phone'){
    if(['01000000000','01111111111','01234567890','01010101010','01111111110','01012345678'].includes(v)) return true;
    const tail=v.slice(3);
    if(/^(\d)\1{5,}$/.test(tail)) return true;
  }
  if(kind==='id'){
    if(v.length<5 || v.length>15) return true;
    if(new Set(v.split('')).size <= 2 && v.length >= 7) return true;
  }
  return false;
}

function envList(name){
  return String(process.env[name] || '').split(',').map(x=>x.trim()).filter(Boolean);
}
function inBlacklist(value, list){
  const v=String(value||'').trim().toLowerCase();
  return list.some(x=>v && v===String(x).trim().toLowerCase());
}

async function getDynamicBlacklist(){
  if(!supabaseReady()) return {};
  const keys=['blacklist_phones','blacklist_ips','blacklist_device_ids','blacklist_pubg_ids'];
  const rows=await supabaseRequest(`settings?key=in.(${keys.join(',')})&select=key,value`).catch(()=>[]);
  const out={};
  for(const r of rows||[]){
    let v=r.value;
    if(typeof v==='string'){
      const t=v.trim();
      if(t.startsWith('[')){ try{v=JSON.parse(t)}catch{} }
      else v=t.split(',').map(x=>x.trim()).filter(Boolean);
    }
    out[r.key]=Array.isArray(v)?v:[];
  }
  return out;
}

async function getStoreSettings(){
  const fallback={store_status:'available',store_message:'',maintenance_mode:false};
  if(!supabaseReady()) return fallback;
  const rows=await supabaseRequest('settings?key=in.(store_status,store_message,store_status_message,maintenance_mode)&select=key,value').catch(()=>[]);
  const out={...fallback};
  for(const r of rows||[]){
    let v=r.value;
    if(v==='true') v=true; if(v==='false') v=false;
    out[r.key]=v;
  }
  return out;
}
function enforceStoreOpen(st){
  const mode=String(st.store_status||'available');
  if(st.maintenance_mode===true || mode==='maintenance') throw new Error(st.store_status_message || st.store_message || 'الموقع تحت صيانة مؤقتا. جرب بعد شوية');
  if(mode==='closed' && String(process.env.ALLOW_CLOSED_ORDERS||'true')!=='true') throw new Error(st.store_status_message || st.store_message || 'خارج مواعيد التنفيذ حاليا. جرب وقت مواعيد العمل');
}

async function getPaymentSettings(){
  const fallback={
    wallet:{enabled:true,status:'available',phone:'01061707294',name:'مؤمن',message:'Vodafone / Orange / Etisalat / WE'},
    instapay:{enabled:true,status:'available',user:'mofr3oon1',phone:'01061707294',name:'مؤمن',link:'https://ipn.eg/S/mofr3oon1/instapay/3ALZfx',message:'حوّل على InstaPay وبعدها ارفع السكرين'},
    updated_at:null
  };
  if(!supabaseReady()) return fallback;
  const rows=await supabaseRequest('settings?key=eq.payment_settings&select=value&limit=1').catch(()=>[]);
  const raw=rows?.[0]?.value;
  if(!raw) return fallback;
  try{
    const parsed=typeof raw==='string'?JSON.parse(raw):raw;
    return {...fallback,...parsed,wallet:{...fallback.wallet,...(parsed.wallet||{})},instapay:{...fallback.instapay,...(parsed.instapay||{})}};
  }catch{return fallback;}
}
function validatePaymentSettingsForOrder(paymentMethod,pay){
  const key = /insta/i.test(paymentMethod) ? 'instapay' : 'wallet';
  const data = pay[key] || {};
  if(data.enabled === false || data.status === 'disabled') throw new Error(`${paymentMethod} متوقف مؤقتا. اختار طريقة دفع تانية أو كلم الدعم`);
  if(data.status === 'maintenance') throw new Error(`${paymentMethod} تحت صيانة مؤقتا. اختار طريقة دفع تانية`);
  const dest = key === 'instapay' ? `InstaPay: ${data.user||'-'} | Phone: ${data.phone||'-'} | Name: ${data.name||'-'}` : `Wallet Phone: ${data.phone||'-'} | Name: ${data.name||'-'}`;
  return {key,dest,data};
}
async function enforceBlacklist({phone,clientIp,deviceId,cart}){
  const dyn = await getDynamicBlacklist();
  const phones = envList('BLACKLIST_PHONES').concat(dyn.blacklist_phones || []);
  const ips = envList('BLACKLIST_IPS').concat(dyn.blacklist_ips || []);
  const devices = envList('BLACKLIST_DEVICE_IDS').concat(dyn.blacklist_device_ids || []);
  const blockedIds = envList('BLACKLIST_PUBG_IDS').concat(dyn.blacklist_pubg_ids || []);
  if(inBlacklist(phone, phones)) throw new Error('لا يمكن تنفيذ طلب من رقم المتابعة ده حاليا. تواصل مع الدعم');
  if(inBlacklist(clientIp, ips)) throw new Error('لا يمكن تنفيذ طلب من الجهاز ده حاليا. تواصل مع الدعم');
  if(inBlacklist(deviceId, devices)) throw new Error('لا يمكن تنفيذ طلب من الجهاز ده حاليا. تواصل مع الدعم');
  if(blockedIds.length){
    const ids=(Array.isArray(cart)?cart:[]).map(x=>String(x.pubgId||'').trim());
    if(ids.some(id=>inBlacklist(id, blockedIds))) throw new Error('لا يمكن تنفيذ طلب على الـ ID ده حاليا. تواصل مع الدعم');
  }
}

function validateScreenshotFile(file){
  if(!file || !file.buffer || file.buffer.length < 2000) throw new Error('ارفع سكرين تحويل واضح بحجم مناسب');
  const type=String(file.contentType||'').toLowerCase();
  const name=String(file.filename||'').toLowerCase();
  const okType=['image/jpeg','image/png','image/webp','image/jpg'].includes(type);
  const okExt=['.jpg','.jpeg','.png','.webp'].some(ext=>name.endsWith(ext));
  if(!okType || !okExt) throw new Error('السكرين لازم يكون صورة فقط JPG أو PNG أو WEBP');
  const max=Number(process.env.MAX_SCREENSHOT_SIZE || 5*1024*1024);
  if(file.buffer.length > max) throw new Error('حجم السكرين كبير. ارفع صورة أقل من 5MB');
}
function screenshotHash(file){
  return file?.buffer ? crypto.createHash('sha256').update(file.buffer).digest('hex') : '';
}
async function recentOrdersForSpamCheck(){
  if(!supabaseReady()) return [];
  return await supabaseRequest('orders?select=id,order_code,phone,status,items,created_at,raw_data&order=created_at.desc&limit=80').catch(()=>[]);
}
function isRecent(ts, mins){
  const t=new Date(ts||0).getTime();
  return Number.isFinite(t) && Date.now()-t < mins*60*1000;
}
function enforceSpamRules(rows,{clientIp,deviceId,phone,cart,shotHash}){
  const recent=(Array.isArray(rows)?rows:[]).filter(o=>isRecent(o.created_at,60));
  const ip15=recent.filter(o=>isRecent(o.created_at,15) && o.raw_data?.clientIp && o.raw_data.clientIp===clientIp).length;
  if(clientIp && ip15>=4) throw new Error('تم إيقاف الطلبات مؤقتا من نفس الجهاز بسبب تكرار المحاولات. جرب بعد شوية أو تواصل مع الدعم');
  const device15=recent.filter(o=>isRecent(o.created_at,15) && deviceId && o.raw_data?.deviceId===deviceId).length;
  if(deviceId && device15>=3) throw new Error('تم إيقاف الطلبات مؤقتا من نفس الجهاز بسبب تكرار المحاولات. جرب بعد شوية');
  const phone60=recent.filter(o=>o.phone===phone).length;
  if(phone60>=5) throw new Error('في محاولات كتير من نفس رقم الموبايل. استنى شوية أو تواصل مع الدعم');
  const ids=new Set(cart.map(x=>String(x.pubgId||'')));
  const openSameId=recent.find(o=>OPEN_STATUSES.includes(String(o.status||'')) && (Array.isArray(o.items)?o.items:[]).some(it=>ids.has(String(it.pubgId||''))));
  if(openSameId) throw new Error('في طلب مفتوح بالفعل لنفس PUBG ID. تابع الطلب القديم الأول أو كلم الدعم');
  if(shotHash){
    const dup=recent.find(o=>isRecent(o.created_at,30) && o.raw_data?.screenshotHash===shotHash);
    if(dup) throw new Error('نفس السكرين مستخدم في طلب قريب. ارفع سكرين التحويل الصحيح أو تواصل مع الدعم');
  }
}

function readRawBody(req){return new Promise((resolve,reject)=>{const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject);});}
function parseMultipart(buffer,contentType){
  const m=/boundary=(?:(?:"([^"]+)")|([^;]+))/i.exec(contentType||''); if(!m) return {fields:{},files:{}};
  const boundary=m[1]||m[2], bb=Buffer.from(`--${boundary}`); const fields={}, files={}; let start=buffer.indexOf(bb);
  while(start!==-1){start+=bb.length; if(buffer[start]===45&&buffer[start+1]===45) break; if(buffer[start]===13&&buffer[start+1]===10) start+=2;
    const he=buffer.indexOf(Buffer.from('\r\n\r\n'),start); if(he===-1) break; const ht=buffer.slice(start,he).toString('utf8'); const ps=he+4; let nb=buffer.indexOf(bb,ps); if(nb===-1) break; let pe=nb; if(buffer[pe-2]===13&&buffer[pe-1]===10) pe-=2; const content=buffer.slice(ps,pe);
    const nm=/name="([^"]+)"/i.exec(ht), fm=/filename="([^"]*)"/i.exec(ht), tm=/Content-Type:\s*([^\r\n]+)/i.exec(ht);
    if(nm){const name=nm[1]; if(fm&&fm[1]) files[name]={filename:fm[1],contentType:tm?tm[1].trim():'application/octet-stream',buffer:content}; else fields[name]=content.toString('utf8');}
    start=nb;
  }
  return {fields,files};
}
async function nextDailyIdentity(){
  const orderDate=cairoDateKey(); let dailyNumber=1001;
  if(supabaseReady()){
    const rows=await supabaseRequest(`orders?order_date=eq.${encodeURIComponent(orderDate)}&select=daily_number&order=daily_number.desc&limit=1`).catch(()=>[]);
    const last=Number(rows?.[0]?.daily_number || 1000); dailyNumber=Number.isFinite(last)?last+1:1001;
  } else dailyNumber=1000+Number(String(Date.now()).slice(-3));
  return { id:`MOBA-${orderDate.replaceAll('-','')}-${dailyNumber}`, order_code:`MOBA ${dailyNumber}`, order_date:orderDate, daily_number:dailyNumber };
}
async function findOpenOrderByPhone(phone){
  if(!supabaseReady()) return null;
  const rows=await supabaseRequest(`orders?phone=eq.${encodeURIComponent(phone)}&status=in.(${OPEN_STATUSES.join(',')})&select=id,order_code,status,created_at&order=created_at.desc&limit=1`).catch(()=>[]);
  return rows?.[0] || null;
}
async function findOpenOrderByPubgId(cart){
  if(!supabaseReady()) return null;
  const rows=await supabaseRequest(`orders?status=in.(${OPEN_STATUSES.join(',')})&select=id,order_code,phone,status,items,created_at&order=created_at.desc&limit=50`).catch(()=>[]);
  const ids=new Set(cart.map(x=>String(x.pubgId)));
  return (rows||[]).find(o=>(Array.isArray(o.items)?o.items:[]).some(it=>ids.has(String(it.pubgId)))) || null;
}



function normalizeCouponProduct(p){ return String(p || '').toLowerCase().replace(/\s+/g,' ').trim(); }
function couponItemQty(item){ return Math.max(1, Number(item.qty || 1)); }
function couponItemLineTotal(item){ return Number(item.price || 0) * couponItemQty(item); }
function couponScopeMatches(item, productScopes){
  if(!productScopes || !Array.isArray(productScopes) || !productScopes.length) return true;
  const product = normalizeCouponProduct(item.product);
  return productScopes.some(scope => {
    const s = normalizeCouponProduct(scope);
    return s && (product.includes(s) || s.includes(product));
  });
}
async function validateCouponServer(code,total,cart=[]){
  code = String(code || '').trim().toUpperCase();
  if(!code) return null;
  const rows = await supa(`coupons?code=eq.${encodeURIComponent(code)}&select=*&limit=1`);
  const c = rows && rows[0];
  if(!c) throw new Error('الكود ده غير موجود. راجع الكتابة أو جرّب كود تاني');
  if(!c.is_active) throw new Error('كود الخصم متوقف حاليا');
  if(c.expires_at && new Date(c.expires_at).getTime() < Date.now()) throw new Error('كود الخصم منتهي');
  if(Number(c.min_order_amount || 0) > total) throw new Error(`الكوبون يحتاج طلب بقيمة ${c.min_order_amount} جنيه على الأقل`);
  const scopes = Array.isArray(c.product_scopes) ? c.product_scopes : [];
  const eligibleItems = (Array.isArray(cart) ? cart : []).filter(item => couponScopeMatches(item, scopes));
  const eligibleTotal = Array.isArray(cart) && cart.length ? eligibleItems.reduce((s,item)=>s+couponItemLineTotal(item),0) : total;
  if(scopes.length && eligibleTotal <= 0) throw new Error(`الكوبون ده مش مناسب للمنتجات الموجودة في السلة حاليًا${scopes.length ? ' — ينفع على: ' + scopes.join(' / ') : ''}`);
  const base = scopes.length ? eligibleTotal : total;
  let discount = 0;
  if(c.discount_type === 'percent'){
    discount = Math.floor(base * Number(c.discount_value || 0) / 100);
    if(Number(c.max_discount_amount || 0) > 0) discount = Math.min(discount, Number(c.max_discount_amount));
  }else{
    discount = Number(c.discount_amount || c.discount_value || 0);
  }
  discount = Math.min(discount, base, total);
  if(discount <= 0) throw new Error('قيمة الخصم غير صحيحة');
  return {code:c.code, discount_amount:discount};
}



async function hasOpenOrderForPhone(phone){
  if(!phone) return false;
  const rows = await supa(`orders?phone=eq.${encodeURIComponent(phone)}&status=in.(pending,claimed,processing,on_hold,needs_fix)&select=id,order_code,status&limit=1`);
  return rows && rows[0] ? rows[0] : null;
}

export default async function handler(req,res){
  try{ rateLimit(req,'order',5,10*60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  if(req.method!=='POST') return json(res,405,{ok:false,error:'Method not allowed'});
  try{
    await persistentRateLimit(req,'order-persistent',8,10*60_000);
    const groupId=process.env.ORDER_GROUP_ID; if(!groupId) throw fail(500,'ORDER_GROUP_ID missing');
    const raw=await readRawBody(req); const {fields,files}=parseMultipart(raw,req.headers['content-type']);
    const clientIp=getClientIp(req) || 'unknown';
    const deviceId=String(fields.deviceId||'').trim().slice(0,80);
    const cart=JSON.parse(fields.cart||'[]');
    const customerPhone=String(fields.customerPhone||'').trim();
    const paymentMethod=String(fields.paymentMethod||'').trim();
    const customerName='غير محدد';
    const note=String(fields.note||'').trim();
    const transferMode=String(fields.transferMode||'').trim(); // same | other
    const transferLast3=String(fields.transferLast3||'').trim();
    let total=0;
    if(!/^01\d{9}$/.test(customerPhone) || looksFakeDigits(customerPhone,'phone')) return json(res,400,{ok:false,error:'رقم الموبايل غير صحيح أو شكله عشوائي'});
    if(!paymentMethod) return json(res,400,{ok:false,error:'اختار طريقة الدفع'});
    const storeSettings = await getStoreSettings();
    enforceStoreOpen(storeSettings);
    const paymentSettings = await getPaymentSettings();
    const paymentSnapshot = validatePaymentSettingsForOrder(paymentMethod, paymentSettings);
    if(!['same','other'].includes(transferMode)) return json(res,400,{ok:false,error:'حدد هل التحويل من نفس رقم المتابعة ولا من رقم/محل تاني'});
    if(transferMode==='other' && !/^\d{3}$/.test(transferLast3)) return json(res,400,{ok:false,error:'اكتب آخر 3 أرقام من رقم التحويل عشان نقدر نراجع الدفع'});

    if(!Array.isArray(cart)||!cart.length) return json(res,400,{ok:false,error:'سلة الطلبات فاضية'});
    for(const item of cart){
      item.qty = itemQty(item);
      const id=String(item.pubgId||'').trim();
      const name=String(item.pubgName || item.name || item.playerName || '').trim();
      item.pubgName = name;
      item.name = name;
      if(!item.product || !/^\d{5,15}$/.test(id) || looksFakeDigits(id,'id') || name.length<2) return json(res,400,{ok:false,error:'راجع المنتج و PUBG ID واسم الحساب في السلة'});
      if(item.qty>20) return json(res,400,{ok:false,error:'الكمية كبيرة جدا. راجع السلة أو كلم الدعم'});
    }
    total = cart.reduce((s,item)=>s+itemLineTotal(item),0);
    if(total<=0) return json(res,400,{ok:false,error:'إجمالي الطلب غير صحيح'});
    const coupon_code = String(fields.coupon_code || '').trim().toUpperCase();
    let coupon_discount = 0;
    if(coupon_code){
      const validCoupon = await validateCouponServer(coupon_code,total,cart);
      coupon_discount = Number(validCoupon.discount_amount || 0);
      total = Math.max(0, total - coupon_discount);
    }
    validateScreenshotFile(files.screenshot);
    const shotHash=screenshotHash(files.screenshot);
    await enforceBlacklist({phone:customerPhone,clientIp,deviceId,cart});
    const recentRows=await recentOrdersForSpamCheck();
    enforceSpamRules(recentRows,{clientIp,deviceId,phone:customerPhone,cart,shotHash});

    const openPhone=await findOpenOrderByPhone(customerPhone);
    if(openPhone) return json(res,409,{ok:false,error:'عندك طلب مفتوح بالفعل. تابع حالته برقم الموبايل أو كلم الدعم لو محتاج تعديل.'});
    const openPubgId=await findOpenOrderByPubgId(cart);
    if(openPubgId) return json(res,409,{ok:false,error:'في طلب مفتوح بالفعل لنفس PUBG ID. تابع الطلب القديم الأول أو كلم الدعم'});

    const identity=await nextDailyIdentity();
    const order={
      id:identity.id, order_code:identity.order_code, order_date:identity.order_date, daily_number:identity.daily_number,
      phone:customerPhone, customer_phone:customerPhone, customer_name:customerName, payment_method:paymentMethod, payment_destination:paymentSnapshot.dest, payment_settings_snapshot:paymentSnapshot.data, total,
      coupon_code,
      coupon_discount,
      status:'pending', status_text:STATUS_LABELS.pending, customer_status_text:STATUS_LABELS.pending, admin_status_text:STATUS_LABELS.pending,
      handler:null, items:cart, note, transfer_mode:transferMode, transfer_last3:transferMode==='other'?transferLast3:'', transfer_confirm_text:transferMode==='same'?'نفس رقم المتابعة':`آخر 3 أرقام: ${transferLast3}`, telegram_chat_id:String(groupId), source:'website', order_type:'cart',
      raw_data:{userAgent:req.headers['user-agent']||'',clientIp,deviceId,screenshotHash:shotHash,antiSpam:'v118',paymentKey:paymentSnapshot.key,paymentDestination:paymentSnapshot.dest}, status_history:[{status:'pending',label:STATUS_LABELS.pending,at:new Date().toISOString(),by:'website'}]
    };
    const message=buildTelegramText(order); order.telegram_text=message; order.order_summary=`${identity.order_code} | ${customerPhone} | ${total}`;
    if(supabaseReady()) await supabaseWriteWithSchemaFallback('orders', order, {method:'POST',headers:{Prefer:'return=minimal'}});

    let telegramOk = false;
    try{
    const msgForm=new FormData(); msgForm.append('chat_id',groupId); msgForm.append('text',message); msgForm.append('parse_mode','HTML'); msgForm.append('reply_markup',JSON.stringify(telegramKeyboard(order.id,'pending')));
    const msgData=await telegramFormWithRetry('sendMessage',()=>msgForm,3);
    const messageId=msgData?.result?.message_id || null;
    if(supabaseReady()) await supabaseWriteWithSchemaFallback(`orders?id=eq.${encodeURIComponent(order.id)}`, {telegram_message_id:messageId,admin_message_id:String(messageId||''),message_id:String(messageId||''),updated_at:new Date().toISOString()}, {method:'PATCH',headers:{Prefer:'return=minimal'}});

    const photoForm=new FormData(); photoForm.append('chat_id',groupId); if(messageId) photoForm.append('reply_to_message_id',String(messageId)); photoForm.append('caption',`📸 Screenshot for ${order.order_code}`); photoForm.append('photo',new Blob([files.screenshot.buffer],{type:files.screenshot.contentType}),files.screenshot.filename||'screenshot.jpg');
    const photoData=await telegramFormWithRetry('sendPhoto',()=>photoForm,3);
    if(supabaseReady()) await supabaseWriteWithSchemaFallback(`orders?id=eq.${encodeURIComponent(order.id)}`, {telegram_photo_file_id:photoData?.result?.photo?.slice(-1)?.[0]?.file_id||null,screenshot_file_name:files.screenshot.filename||'screenshot.jpg',updated_at:new Date().toISOString(),raw_data:{...(order.raw_data||{}),telegram_photo_file_id:photoData?.result?.photo?.slice(-1)?.[0]?.file_id||null,screenshot_file_name:files.screenshot.filename||'screenshot.jpg'}}, {method:'PATCH',headers:{Prefer:'return=minimal'}});
    telegramOk = true;
    }catch(telegramError){
      console.error('[TELEGRAM_DELIVERY_FAILED]', telegramError);
      if(supabaseReady()) await supabaseWriteWithSchemaFallback(`orders?id=eq.${encodeURIComponent(order.id)}`, {updated_at:new Date().toISOString(),raw_data:{...(order.raw_data||{}),telegramOk:false,telegramPending:true,telegramError:String(telegramError?.message||telegramError).slice(0,220),screenshot_file_name:files.screenshot.filename||'screenshot.jpg'}}, {method:'PATCH',headers:{Prefer:'return=minimal'}}).catch(()=>null);
    }

    return json(res,200,{ok:true,telegramOk,statusTracking:supabaseReady(),orderCode:order.order_code,orderId:order.id,total:order.total,phone:order.phone});
  }catch(error){return publicOrderError(res,error);}
}
