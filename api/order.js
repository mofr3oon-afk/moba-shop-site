import { validateCouponServer } from '../lib/coupons.js';
import { rateLimit, persistentRateLimit, safeError, getClientIp } from '../lib/_security.js';
// moba-v40-security
export const config = { api: { bodyParser: false } };
import crypto from 'node:crypto';
import { json, escapeHtml, supabaseReady, supabaseRequest, telegramForm, telegramKeyboard, buildTelegramText, cairoDateKey, STATUS_LABELS, OPEN_STATUSES } from '../lib/_utils.js';
import { getServerProducts as loadServerProducts, pricedCart, cartAmount } from '../lib/server-catalog.js';
import { readRawBody as boundedBody, validateImageBytes, parseForm } from '../lib/request-body.js';
import { orderIdentity, fingerprint, readExistingOrder, replayResponse } from '../lib/idempotency.js';
import { saveReceipt } from '../lib/receipts.js';

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
  if(status>=500)return safeError(res,error,status);
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
      if(col && col!=='raw_data' && Object.prototype.hasOwnProperty.call(clean,col)){
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
function validGameAccountId(value){
  const id = String(value || '').trim();
  if(!id) return false;
  if(/^\d+$/.test(id)) return id.length >= 4 && id.length <= 18 && !looksFakeDigits(id,'id');
  return /^[\p{L}\p{N}_.@-]{3,40}$/u.test(id);
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
  const fallback={store_status:'available',store_message:'',work_hours:'',maintenance_mode:false};
  if(!supabaseReady()) return fallback;
  const rows=await supabaseRequest('settings?key=in.(store_status,store_message,store_status_message,work_hours,maintenance_mode)&select=key,value').catch(()=>[]);
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
  if(key === 'instapay' && (!String(data.user||'').trim() || !String(data.link||'').trim())) throw new Error('بيانات InstaPay ناقصة حاليا. اختار طريقة دفع تانية أو تواصل مع الدعم');
  if(key === 'wallet' && (!String(data.phone||'').trim() || !String(data.name||'').trim())) throw new Error('بيانات المحفظة ناقصة حاليا. اختار طريقة دفع تانية أو تواصل مع الدعم');
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
  validateImageBytes(file);
  if(!file || !file.buffer || file.buffer.length < 2000) throw new Error('ارفع سكرين تحويل واضح بحجم مناسب');
  const type=String(file.contentType||'').toLowerCase();
  const name=String(file.filename||'').toLowerCase();
  const okType=['image/jpeg','image/png','image/webp','image/jpg'].includes(type);
  const okExt=['.jpg','.jpeg','.png','.webp'].some(ext=>name.endsWith(ext));
  if(!okType || !okExt) throw new Error('السكرين لازم يكون صورة فقط JPG أو PNG أو WEBP');
  const max=Number(process.env.MAX_SCREENSHOT_SIZE || 5*1024*1024);
  if(file.buffer.length > max) throw new Error('حجم السكرين كبير. ارفع صورة أقل من 3MB');
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
  if(openSameId) throw new Error('في طلب مفتوح بالفعل لنفس ID الحساب. تابع الطلب القديم الأول أو كلم الدعم');
  if(shotHash){
    const dup=recent.find(o=>isRecent(o.created_at,30) && o.raw_data?.screenshotHash===shotHash);
    if(dup) throw new Error('نفس السكرين مستخدم في طلب قريب. ارفع سكرين التحويل الصحيح أو تواصل مع الدعم');
  }
}

async function nextDailyIdentity(){
  const orderDate=cairoDateKey(); let dailyNumber=1001;
  if(supabaseReady()){
    const rows=await supabaseRequest(`orders?order_date=eq.${encodeURIComponent(orderDate)}&select=daily_number&order=daily_number.desc&limit=1`).catch(()=>[]);
    const last=Number(rows?.[0]?.daily_number || 1000); dailyNumber=Number.isFinite(last)?last+1:1001;
  } else dailyNumber=1000+Number(String(Date.now()).slice(-3));
  return { id:`MOBA-${orderDate.replaceAll('-','')}-${dailyNumber}`, order_code:`MOBA ${dailyNumber}`, order_date:orderDate, daily_number:dailyNumber };
}
function isDailyNumberDuplicateError(err){
  const msg=String(err?.message || err || '').toLowerCase();
  return msg.includes('duplicate') || msg.includes('23505') || msg.includes('orders_daily_unique_idx') || msg.includes('orders_order_date_daily_number_key');
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



export default async function handler(req,res){
  try{ rateLimit(req,'order',5,10*60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  if(req.method!=='POST') return json(res,405,{ok:false,error:'Method not allowed'});
  try{
    await persistentRateLimit(req,'order-persistent',8,10*60_000);
    if(!supabaseReady())throw fail(503,'تسجيل الطلبات متوقف مؤقتا. تواصل مع الدعم.');
    const groupId=process.env.ORDER_GROUP_ID; if(!groupId) throw fail(500,'ORDER_GROUP_ID missing');
    const raw=await boundedBody(req); const {fields,files}=await parseForm(raw,req.headers['content-type']);
    const access=orderIdentity(req.headers['idempotency-key'],'WEB');
    const requestHash=fingerprint({fields,screenshotHash:screenshotHash(files.screenshot)});
    const existing=await readExistingOrder(access.id);
    if(existing)return json(res,200,replayResponse(existing,access,requestHash));
    const clientIp=getClientIp(req) || 'unknown';
    const deviceId=String(fields.deviceId||'').trim().slice(0,80);
    let cart=JSON.parse(fields.cart||'[]');
    const testOrder = false; // Public clients cannot label real orders as disposable test data.
    const customerPhone=String(fields.customerPhone||'').trim();
    const paymentMethod=String(fields.paymentMethod||'').trim();
    const customerName='غير محدد';
    const note=String(fields.note||'').trim();
    const transferMode=String(fields.transferMode||'').trim(); // same | other
    const transferLast3=String(fields.transferLast3||'').trim();
    let total=0;
    if(!/^01\d{9}$/.test(customerPhone) || looksFakeDigits(customerPhone,'phone')) return json(res,400,{ok:false,error:'رقم الموبايل غير صحيح أو شكله عشوائي'});
    if(!['Wallet','InstaPay'].includes(paymentMethod)) return json(res,400,{ok:false,error:'اختار طريقة دفع صحيحة'});
    if(String(fields.termsAccepted||'')!=='true') return json(res,400,{ok:false,error:'لازم توافق على شروط الشحن وسياسة الاسترجاع قبل تنفيذ الطلب'});
    const storeSettings = await getStoreSettings();
    enforceStoreOpen(storeSettings);
    const paymentSettings = await getPaymentSettings();
    const paymentSnapshot = validatePaymentSettingsForOrder(paymentMethod, paymentSettings);
    if(!['same','other'].includes(transferMode)) return json(res,400,{ok:false,error:'حدد هل التحويل من نفس رقم المتابعة ولا من رقم/محل تاني'});
    if(transferMode==='other' && !/^\d{3}$/.test(transferLast3)) return json(res,400,{ok:false,error:'اكتب آخر 3 أرقام من رقم التحويل عشان نقدر نراجع الدفع'});

    if(!Array.isArray(cart)||!cart.length) return json(res,400,{ok:false,error:'سلة الطلبات فاضية'});
    const serverProducts=await loadServerProducts();
    cart=pricedCart(cart,serverProducts);
    for(const item of cart){
      const productId=String(item.productId||'').trim();
      const serverProduct=serverProducts.get(productId);
      if(!productId || !serverProduct || !serverProduct.enabled) return json(res,400,{ok:false,error:'منتج غير موجود أو غير متاح. حدث الصفحة وجرب تاني'});
      item.qty = itemQty(item);
      if(serverProduct.noQty) item.qty = 1;
      item.productId = serverProduct.id;
      item.product = serverProduct.name;
      item.game = item.game || serverProduct.game || '';
      item.price = serverProduct.price;
      item.unit = serverProduct.unit;
      item.amount = serverProduct.amount;
      const id=String(item.pubgId||'').trim();
      const name=String(item.pubgName || item.name || item.playerName || '').trim();
      item.pubgName = name;
      item.name = name;
      if(!item.product || !validGameAccountId(id) || name.length<2) return json(res,400,{ok:false,error:'راجع المنتج و ID الحساب واسم الحساب في السلة'});
      if(item.qty>20) return json(res,400,{ok:false,error:'الكمية كبيرة جدا. راجع السلة أو كلم الدعم'});
    }
    total = cartAmount(cart);
    if(!Number.isFinite(total)||total<=0||!Number.isSafeInteger(Math.round(total*100))) return json(res,400,{ok:false,error:'إجمالي الطلب غير صحيح'});
    const coupon_code = String(fields.coupon_code || '').trim().toUpperCase();
    let coupon_discount = 0;
    if(coupon_code){
      const validCoupon = await validateCouponServer(coupon_code,total,cart,customerPhone);
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
    if(openPubgId) return json(res,409,{ok:false,error:'في طلب مفتوح بالفعل لنفس ID الحساب. تابع الطلب القديم الأول أو كلم الدعم'});

    const dailyIdentity=await nextDailyIdentity();
    const identity={...dailyIdentity,id:access.id};
    const receiptPath=await saveReceipt(identity.id,files.screenshot);
    const order={
      id:identity.id, order_code:identity.order_code, order_date:identity.order_date, daily_number:identity.daily_number,
      phone:customerPhone, customer_phone:customerPhone, customer_name:customerName, payment_method:paymentMethod, payment_destination:paymentSnapshot.dest, payment_settings_snapshot:paymentSnapshot.data, total,
      coupon_code,
      coupon_discount,
      terms_accepted:true,
      status:'pending', status_text:STATUS_LABELS.pending, customer_status_text:STATUS_LABELS.pending, admin_status_text:STATUS_LABELS.pending,
      handler:null, items:cart, note, transfer_mode:transferMode, transfer_last3:transferMode==='other'?transferLast3:'', transfer_confirm_text:transferMode==='same'?'نفس رقم المتابعة':`آخر 3 أرقام: ${transferLast3}`, telegram_chat_id:String(groupId), source:'website', order_type:testOrder?'test':'cart',
      raw_data:{userAgent:req.headers['user-agent']||'',clientIp,deviceId,screenshotHash:shotHash,antiSpam:'v118',termsAccepted:true,paymentKey:paymentSnapshot.key,paymentDestination:paymentSnapshot.dest,storeStatus:storeSettings.store_status||'available',storeMessage:storeSettings.store_message||storeSettings.store_status_message||'',testOrder}, status_history:[{status:'pending',label:STATUS_LABELS.pending,at:new Date().toISOString(),by:'website'}]
    };
    const message=buildTelegramText(order); order.telegram_text=message; order.order_summary=`${identity.order_code} | ${customerPhone} | ${total}`;
    order.raw_data.trackingTokenHash=access.hash;
    order.raw_data.requestHash=requestHash;
    order.raw_data.receiptPath=receiptPath;
    order.raw_data.paymentVerified=false;
    order.raw_data.checkoutMethod='direct';
    order.raw_data.costTotal=cart.every(i=>Number.isFinite(serverProducts.get(i.productId)?.cost))?cart.reduce((s,i)=>s+serverProducts.get(i.productId).cost*i.qty,0):null;
    if(supabaseReady()){
      let saved=false;
      for(let attempt=0; attempt<4 && !saved; attempt++){
        try{
          await supabaseWriteWithSchemaFallback('orders', order, {method:'POST',headers:{Prefer:'return=minimal'}});
          saved=true;
        }catch(saveErr){
          const concurrent=await readExistingOrder(access.id);
          if(concurrent)return json(res,200,replayResponse(concurrent,access,requestHash));
          if(attempt>=3 || !isDailyNumberDuplicateError(saveErr)) throw saveErr;
          const next=await nextDailyIdentity();
          order.id=access.id;
          order.order_code=next.order_code;
          order.order_date=next.order_date;
          order.daily_number=next.daily_number;
          order.status_history=[{status:'pending',label:STATUS_LABELS.pending,at:new Date().toISOString(),by:'website'}];
          order.telegram_text=buildTelegramText(order);
          order.order_summary=`${order.order_code} | ${customerPhone} | ${total}`;
        }
      }
    }

    let telegramOk = false;
    try{
    const msgForm=new FormData(); msgForm.append('chat_id',groupId); msgForm.append('text',order.telegram_text || message); msgForm.append('parse_mode','HTML'); msgForm.append('reply_markup',JSON.stringify(telegramKeyboard(order.id,'pending')));
    const msgData=await telegramFormWithRetry('sendMessage',()=>msgForm,3);
    const messageId=msgData?.result?.message_id || null;
    if(supabaseReady()) await supabaseWriteWithSchemaFallback(`orders?id=eq.${encodeURIComponent(order.id)}`, {telegram_message_id:messageId,admin_message_id:String(messageId||''),message_id:String(messageId||''),updated_at:new Date().toISOString()}, {method:'PATCH',headers:{Prefer:'return=minimal'}});

    const photoForm=new FormData(); photoForm.append('chat_id',groupId); if(messageId) photoForm.append('reply_to_message_id',String(messageId)); photoForm.append('caption',`📸 Screenshot for ${order.order_code}`); photoForm.append('photo',new Blob([files.screenshot.buffer],{type:files.screenshot.contentType}),files.screenshot.filename||'screenshot.jpg');
    const photoData=await telegramFormWithRetry('sendPhoto',()=>photoForm,3);
    if(supabaseReady()) await supabaseWriteWithSchemaFallback(`orders?id=eq.${encodeURIComponent(order.id)}`, {telegram_photo_file_id:photoData?.result?.photo?.slice(-1)?.[0]?.file_id||null,screenshot_file_name:files.screenshot.filename||'screenshot.jpg',updated_at:new Date().toISOString()}, {method:'PATCH',headers:{Prefer:'return=minimal'}});
    telegramOk = true;
    }catch(telegramError){
      console.error('[TELEGRAM_DELIVERY_FAILED]', telegramError);
      if(supabaseReady()) await supabaseWriteWithSchemaFallback(`orders?id=eq.${encodeURIComponent(order.id)}`, {updated_at:new Date().toISOString(),security_note:'تعذر تسليم إشعار Telegram بالكامل. إثبات التحويل محفوظ في التخزين الخاص.'}, {method:'PATCH',headers:{Prefer:'return=minimal'}}).catch(()=>null);
    }

    res.setHeader('Cache-Control','no-store');
    return json(res,200,{ok:true,telegramOk,statusTracking:supabaseReady(),orderCode:order.order_code,orderId:order.id,total:order.total,phone:order.phone,trackingToken:access.token});
  }catch(error){return publicOrderError(res,error);}
}
