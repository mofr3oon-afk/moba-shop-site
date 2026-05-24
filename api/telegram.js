import { requireTelegramSecret, rateLimit, safeError } from './_security.js';
// moba-v40-security

const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_IDS = String(process.env.ADMIN_IDS || '').split(',').map(x=>x.trim()).filter(Boolean);
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

function json(res,status,obj){res.status(status).json(obj);}
function displayOrderCode(order){ return order?.order_code || order?.id || ''; }
function realOrderId(order){ return order?.id || order?.order_code || ''; }
function escapeHtml(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function isAdmin(id){return ADMIN_IDS.includes(String(id));}
function adminPublic(){return 'مسؤول الطلب';}
function itemQty(item){return Math.max(1, Number(item?.qty || 1));}
function itemLineTotal(item){return Number(item?.price || 0) * itemQty(item);}
function extractUc(productName){const m=String(productName||'').match(/(\d+)\s*UC/i);return m?Number(m[1]):0;}
function itemUcTotal(item){return extractUc(item?.product)*itemQty(item);}
function statusLabel(status){
  return ({
    pending:'تم استلام الطلب',
    claimed:'تم استلام الطلب بواسطة مسؤول',
    processing:'جاري التنفيذ',
    delivered:'تم الشحن بنجاح',
    on_hold:'الطلب معلق مؤقتا',
    needs_fix:'الطلب محتاج تعديل',
    rejected:'تم رفض الطلب',
    cancelled:'تم إلغاء الطلب',
    archived:'تمت الأرشفة'
  })[status] || status || 'غير محدد';
}
function orderKeyboard(orderId){
  return {
    inline_keyboard:[
      [{text:'🙋 استلمت',callback_data:`claim:${orderId}`},{text:'🔄 بدأ التنفيذ',callback_data:`processing:${orderId}`}],
      [{text:'✅ تم الشحن',callback_data:`delivered:${orderId}`},{text:'⏸ تعليق',callback_data:`hold:${orderId}`}],
      [{text:'⚠️ ID غلط',callback_data:`bad_id:${orderId}`},{text:'📸 سكرين غير واضح',callback_data:`bad_screen:${orderId}`}],
      [{text:'📱 رقم غلط',callback_data:`bad_phone:${orderId}`},{text:'❌ رفض',callback_data:`reject:${orderId}`}],
      [{text:'📊 سجل العميل',callback_data:`customer_history:${orderId}`},{text:'📋 البيانات',callback_data:`data:${orderId}`}],
      [{text:'📌 مهم',callback_data:`pin:${orderId}`},{text:'👁 فتح الطلب',callback_data:`open:${orderId}`}],
      [{text:'🗑 حذف الطلب',callback_data:`delete_ask:${orderId}`}]
    ]
  };
}
function confirmDeleteKeyboard(orderId){
  return {inline_keyboard:[
    [{text:'✅ نعم احذف الطلب',callback_data:`delete_confirm:${orderId}`},{text:'❌ إلغاء',callback_data:`noop:${orderId}`}]
  ]};
}
function confirmClearKeyboard(kind,count){
  return {inline_keyboard:[
    [{text:`✅ تأكيد ${count} طلب`,callback_data:`clear_confirm:${kind}`},{text:'❌ إلغاء',callback_data:`noop_clear:${kind}`}]
  ]};
}
async function tg(method,payload){
  const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  const data=await r.json().catch(()=>({ok:false}));
  return data;
}
async function supa(path,opts={}){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
    ...opts,
    headers:{
      apikey:SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'return=representation',
      ...(opts.headers||{})
    }
  });
  const text=await r.text();
  let data; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
async function getOrder(id){
  const key = String(id || '').trim();
  if(!key) return null;

  let rows = await supa(`orders?id=eq.${encodeURIComponent(key)}&select=*&limit=1`);
  if(rows && rows[0]) return rows[0];

  rows = await supa(`orders?order_code=eq.${encodeURIComponent(key)}&select=*&order=created_at.desc&limit=1`);
  if(rows && rows[0]) return rows[0];

  const compact = key.replace(/\s+/g,' ').trim();
  if(compact !== key){
    rows = await supa(`orders?order_code=eq.${encodeURIComponent(compact)}&select=*&order=created_at.desc&limit=1`);
    if(rows && rows[0]) return rows[0];
  }

  const m = compact.match(/MOBA\s*(\d+)/i);
  if(m){
    const n = Number(m[1]);
    rows = await supa(`orders?daily_number=eq.${n}&select=*&order=created_at.desc&limit=1`);
    if(rows && rows[0]) return rows[0];
  }

  return null;
}
async function updateOrder(id,patch){
  patch.updated_at=new Date().toISOString();
  const rows=await supa(`orders?id=eq.${encodeURIComponent(id)}`,{
    method:'PATCH',body:JSON.stringify(patch)
  });
  return rows && rows[0];
}
async function deleteOrder(id){
  await supa(`orders?id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});
}
function orderItems(order){
  return Array.isArray(order?.items)?order.items:[];
}
function itemSummary(items=[]){
  return (Array.isArray(items)?items:[]).map((x,i)=>`${i+1}) ${x.product}
ID: ${x.pubgId}
Name: ${x.pubgName || '-'}
Qty: ${itemQty(x)}
UC Total: ${itemUcTotal(x)} UC
Total: ${itemLineTotal(x)} جنيه`).join('\n\n') || 'لا يوجد';
}
function orderText(order, title='📦 تفاصيل الطلب'){
  return `${title}
━━━━━━━━━━━━━━
🧾 رقم الطلب: <b>${escapeHtml(displayOrderCode(order))}</b>
📱 رقم العميل: <code>${escapeHtml(order.phone || order.customer_phone || '')}</code>
💳 الدفع: ${escapeHtml(order.payment_method || '')}
🔐 تأكيد التحويل: ${escapeHtml(order.transfer_confirm || order.transfer_info || order.transfer_last3 || 'غير محدد')}
💰 الإجمالي: <b>${escapeHtml(order.total || 0)} جنيه</b>
📌 الحالة: <b>${escapeHtml(statusLabel(order.status))}</b>
👨‍💻 المسؤول: ${adminPublic()}

🎮 المنتجات:
${escapeHtml(itemSummary(orderItems(order)))}

📝 ملاحظة:
${escapeHtml(order.note || 'لا يوجد')}`;
}
async function sendOrderCard(chatId,order,replyTo){
  return tg('sendMessage',{
    chat_id:chatId,
    text:orderText(order,'👁 فتح الطلب'),
    parse_mode:'HTML',
    reply_to_message_id:replyTo,
    reply_markup:orderKeyboard(realOrderId(order))
  });
}
function statusHistory(order,status,label,adminId){
  const h=Array.isArray(order.status_history)?order.status_history:[];
  h.push({at:new Date().toISOString(),status,label,by:'مسؤول'});
  return h.slice(-20);
}
async function setStatus(order,status,label,adminId,extra={}){
  const patch={
    status,
    status_text:label,
    customer_status_text:label,
    admin_status_text:label,
    handler:adminPublic(),
    handler_id:String(adminId||''),
    admin_id:String(adminId||''),
    admin_name:adminPublic(),
    last_status_by:adminPublic(),
    last_status_at:new Date().toISOString(),
    status_history:statusHistory(order,status,label,adminId),
    ...extra
  };
  return updateOrder(order.id,patch);
}
async function customerHistoryText(phone){
  if(!phone) return 'لا يوجد رقم للعميل.';
  const rows=await supa(`orders?phone=eq.${encodeURIComponent(phone)}&select=*&order=created_at.desc&limit=10`);
  const delivered=rows.filter(o=>o.status==='delivered').length;
  const totalValue=rows.reduce((s,o)=>s+Number(o.total||0),0);
  const lines=rows.map((o,i)=>{
    const first=(orderItems(o)[0]||{}).product || 'طلب';
    const d=o.created_at?new Date(o.created_at).toLocaleString('ar-EG'):'';
    return `${i+1}) ${o.id} | ${statusLabel(o.status)} | ${first} | ${o.total||0}ج | ${d}`;
  }).join('\n');
  return `📊 سجل العميل
━━━━━━━━━━━━━━
📱 الرقم: ${phone}
📦 عدد الطلبات المعروضة: ${rows.length}
✅ تم شحنها ضمن المعروض: ${delivered}
💰 إجمالي قيمة المعروض: ${totalValue} جنيه

آخر الطلبات:
${lines || 'لا يوجد'}`;
}
async function reportText(days=1,title='تقرير'){
  const since=new Date(Date.now()-days*24*60*60*1000).toISOString();
  const rows=await supa(`orders?created_at=gte.${encodeURIComponent(since)}&select=*&order=created_at.desc&limit=1000`);
  const counts={};
  const payments={};
  const products={};
  let total=0;
  for(const o of rows){
    counts[o.status||'unknown']=(counts[o.status||'unknown']||0)+1;
    payments[o.payment_method||'غير محدد']=(payments[o.payment_method||'غير محدد']||0)+1;
    total+=Number(o.total||0);
    for(const it of orderItems(o)){
      products[it.product]=(products[it.product]||0)+itemQty(it);
    }
  }
  const c=(s)=>counts[s]||0;
  const prodLines=Object.entries(products).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>`• ${k}: ${v}`).join('\n')||'لا يوجد';
  const payLines=Object.entries(payments).map(([k,v])=>`• ${k}: ${v}`).join('\n')||'لا يوجد';
  return `📊 ${title}
━━━━━━━━━━━━━━
📦 إجمالي الطلبات: ${rows.length}
⏳ مستلمة: ${c('pending')}
🙋 مستلمة من مسؤول: ${c('claimed')}
🔄 جاري التنفيذ: ${c('processing')}
⚠️ محتاجة تعديل: ${c('needs_fix')}
⏸ معلقة: ${c('on_hold')}
✅ تم الشحن: ${c('delivered')}
❌ مرفوضة/ملغية: ${c('rejected')+c('cancelled')}

💰 إجمالي قيمة الطلبات: ${total} جنيه

🎮 المنتجات:
${prodLines}

💳 طرق الدفع:
${payLines}`;
}
async function pendingList(chatId,replyTo){
  const rows=await supa(`orders?status=in.(pending,claimed,processing,on_hold,needs_fix)&select=*&order=created_at.desc&limit=20`);
  if(!rows.length){
    return tg('sendMessage',{chat_id:chatId,text:'✅ لا يوجد طلبات معلقة حاليا.',reply_to_message_id:replyTo});
  }
  await tg('sendMessage',{chat_id:chatId,text:`📌 الطلبات المعلقة: ${rows.length}\nاضغط فتح على أي طلب عشان يظهرلك تفاصيله وأزراره.`});
  for(const o of rows.slice(0,10)){
    const first=(orderItems(o)[0]||{}).product || 'طلب';
    await tg('sendMessage',{
      chat_id:chatId,
      text:`📌 ${o.id}\n📱 ${o.phone||''}\n🎮 ${first}\n📌 ${statusLabel(o.status)}`,
      reply_markup:{inline_keyboard:[[{text:'👁 فتح الطلب',callback_data:`open:${realOrderId(o)}`},{text:'🗑 حذف',callback_data:`delete_ask:${realOrderId(o)}`}]]}
    });
  }
}
async function lateList(chatId,replyTo){
  const since=new Date(Date.now()-30*60*1000).toISOString();
  const rows=await supa(`orders?created_at=lte.${encodeURIComponent(since)}&status=in.(pending,claimed,processing,on_hold,needs_fix)&select=*&order=created_at.asc&limit=20`);
  if(!rows.length) return tg('sendMessage',{chat_id:chatId,text:'✅ لا يوجد طلبات متأخرة أكتر من 30 دقيقة.',reply_to_message_id:replyTo});
  await tg('sendMessage',{chat_id:chatId,text:`⏰ طلبات متأخرة: ${rows.length}`});
  for(const o of rows.slice(0,10)){
    await tg('sendMessage',{chat_id:chatId,text:`⏰ ${o.id}\n📱 ${o.phone||''}\n📌 ${statusLabel(o.status)}`,reply_markup:{inline_keyboard:[[{text:'👁 فتح الطلب',callback_data:`open:${realOrderId(o)}`}]]}});
  }
}
async function findByPubgId(chatId,id,replyTo){
  const rows=await supa(`orders?items=cs.${encodeURIComponent(JSON.stringify([{pubgId:id}]))}&select=*&order=created_at.desc&limit=10`).catch(()=>[]);
  // Fallback broad filter in JS if json contains not supported exactly
  let results=rows;
  if(!results.length){
    const all=await supa(`orders?select=*&order=created_at.desc&limit=200`);
    results=all.filter(o=>orderItems(o).some(it=>String(it.pubgId)===String(id))).slice(0,10);
  }
  if(!results.length) return tg('sendMessage',{chat_id:chatId,text:'لا يوجد طلبات للـ ID ده.',reply_to_message_id:replyTo});
  await tg('sendMessage',{chat_id:chatId,text:`🔎 نتائج PUBG ID: ${id}`});
  for(const o of results){
    await tg('sendMessage',{chat_id:chatId,text:`${o.id}\n📱 ${o.phone||''}\n📌 ${statusLabel(o.status)}`,reply_markup:{inline_keyboard:[[{text:'👁 فتح الطلب',callback_data:`open:${realOrderId(o)}`}]]}});
  }
}

async function setSetting(key,value){
  const rows = await supa(`settings?key=eq.${encodeURIComponent(key)}&select=*`);
  if(rows && rows[0]){
    await supa(`settings?key=eq.${encodeURIComponent(key)}`,{method:'PATCH',body:JSON.stringify({value:String(value),updated_at:new Date().toISOString()})});
  }else{
    await supa('settings',{method:'POST',body:JSON.stringify({key,value:String(value),updated_at:new Date().toISOString()})});
  }
}

async function handleCommand(msg){
  const chatId=msg.chat.id;
  const adminId=msg.from.id;
  if(!isAdmin(adminId)) return;
  const text=String(msg.text||'').trim();
  const parts=text.split(/\s+/);
  const rawCmd=parts.shift() || '';
  const cmd=rawCmd.split('@')[0].trim();
  const arg=parts.join(' ').trim();
  if(cmd==='/admin' || cmd==='/help'){
    return tg('sendMessage',{chat_id:chatId,text:`🛠 أوامر MOBA SHOP

📌 الطلبات:
/pending - عرض الطلبات المعلقة
/late - الطلبات المتأخرة
/delete_order MOBA 1001 - حذف طلب
/clear_pending - حذف كل المعلقات بتأكيد
/clear_all_orders - حذف كل الأوردرات بتأكيد
/new_month - بداية شهر جديد وحذف كل الأوردرات بتأكيد
/archive_done - أرشفة الطلبات المنفذة

🔎 البحث:
/customer 010xxxx - سجل عميل
/orders 010xxxx - طلبات رقم
/find_id PUBGID - بحث بالـ ID
/open MOBA 1001 - فتح طلب
/today_pending - طلبات النهارده المفتوحة
/done_today - طلبات اتشحنت النهارده
/stats - إحصائيات بدون أرباح
/available - تشغيل حالة متاح الآن
/busy [رسالة] - تشغيل حالة الضغط
/closed [رسالة] - تشغيل حالة مغلق حاليا
/status_now - عرض الحالة الحالية
/normal - نفس available
/check_late - فحص الطلبات المتأخرة يدويًا
/coupon CODE fixed 10 - كوبون خصم بالجنيه
/coupon CODE percent 10 - كوبون خصم بنسبة
/coupon CODE fixed 10 product:325 - كوبون على منتج معين
/coupon_off CODE - إيقاف كوبون
/coupons - عرض الكوبونات
/review_reply ID الرد - رد المتجر على تقييم
/reviews - تقييمات العملاء الجديدة
/pinned - الطلبات المهمة

📊 التقارير:
/today - تقرير اليوم
/week - تقرير الأسبوع
/month - تقرير الشهر`});
  }



  if(cmd==='/coupon'){
    const parts = arg.split(/\s+/).filter(Boolean);
    const code = String(parts[0] || '').trim().toUpperCase();
    const type = String(parts[1] || '').trim().toLowerCase();
    const value = Number(parts[2] || 0);
    let minAmount = 0;
    let maxDiscount = 0;
    let products = [];

    if(!code || !type || !value || !['fixed','percent','جنيه','نسبة'].includes(type)){
      return tg('sendMessage',{chat_id:chatId,text:
`استخدم الأمر كده:

خصم بالجنيه:
/coupon MOBA10 fixed 10

خصم بنسبة:
/coupon SALE10 percent 10

على منتج معين:
/coupon UC325 fixed 15 product:325
/coupon UC percent 5 product:660,325

حد أدنى:
/coupon MOBA10 fixed 10 min:100

حد أقصى لخصم النسبة:
/coupon SALE10 percent 10 max:50`,reply_to_message_id:msg.message_id});
    }

    for(const p of parts.slice(3)){
      if(p.startsWith('min:')) minAmount = Number(p.replace('min:','') || 0);
      else if(p.startsWith('max:')) maxDiscount = Number(p.replace('max:','') || 0);
      else if(p.startsWith('product:')) products = p.replace('product:','').split(',').map(x=>x.trim()).filter(Boolean);
    }

    const discountType = (type === 'percent' || type === 'نسبة') ? 'percent' : 'fixed';
    const row = {
      code,
      discount_type: discountType,
      discount_value: value,
      discount_amount: discountType === 'fixed' ? value : 0,
      max_discount_amount: maxDiscount,
      min_order_amount: minAmount,
      product_scopes: products,
      is_active:true,
      updated_at:new Date().toISOString()
    };

    const exists = await supa(`coupons?code=eq.${encodeURIComponent(code)}&select=*`);
    if(exists && exists[0]){
      await supa(`coupons?code=eq.${encodeURIComponent(code)}`,{method:'PATCH',body:JSON.stringify(row)});
    }else{
      await supa('coupons',{method:'POST',body:JSON.stringify({...row,created_at:new Date().toISOString()})});
    }

    const typeText = discountType === 'percent' ? `${value}%` : `${value} جنيه`;
    return tg('sendMessage',{chat_id:chatId,text:
`🎟️ تم حفظ الكوبون
الكود: ${code}
الخصم: ${typeText}
المنتجات: ${products.length ? products.join(' / ') : 'كل المنتجات'}
الحد الأدنى: ${minAmount || 'لا يوجد'}
حد أقصى للنسبة: ${maxDiscount || 'لا يوجد'}
الحالة: شغال ✅`});
  }
  if(cmd==='/coupon_off'){
    const code = String(arg || '').trim().toUpperCase();
    if(!code) return tg('sendMessage',{chat_id:chatId,text:'اكتب الكود بعد الأمر\nمثال: /coupon_off MOBA10',reply_to_message_id:msg.message_id});
    await supa(`coupons?code=eq.${encodeURIComponent(code)}`,{method:'PATCH',body:JSON.stringify({is_active:false,updated_at:new Date().toISOString()})});
    return tg('sendMessage',{chat_id:chatId,text:`⛔ تم إيقاف الكوبون: ${code}`});
  }
  if(cmd==='/coupon_on'){
    const code = String(arg || '').trim().toUpperCase();
    if(!code) return tg('sendMessage',{chat_id:chatId,text:'اكتب الكود بعد الأمر\nمثال: /coupon_on MOBA10',reply_to_message_id:msg.message_id});
    await supa(`coupons?code=eq.${encodeURIComponent(code)}`,{method:'PATCH',body:JSON.stringify({is_active:true,updated_at:new Date().toISOString()})});
    return tg('sendMessage',{chat_id:chatId,text:`✅ تم تشغيل الكوبون: ${code}`});
  }

  if(cmd==='/review_reply'){
    const parts = arg.split(/\s+/);
    const id = parts.shift();
    const reply = parts.join(' ').trim();
    if(!id || !reply) return tg('sendMessage',{chat_id:chatId,text:'استخدم الأمر كده:\n/review_reply REVIEW_ID شكرا لتقييمك',reply_to_message_id:msg.message_id});
    await supa(`reviews?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({store_reply:reply})});
    return tg('sendMessage',{chat_id:chatId,text:'✅ تم إضافة رد المتجر على التقييم'});
  }

  if(cmd==='/coupons'){
    const rows = await supa(`coupons?select=*&order=created_at.desc&limit=20`);
    if(!rows.length) return tg('sendMessage',{chat_id:chatId,text:'لا يوجد كوبونات حاليا.'});
    return tg('sendMessage',{chat_id:chatId,text:'🎟️ الكوبونات:\n' + rows.map(c=>{
      const typeText = c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_amount || c.discount_value}ج`;
      const products = Array.isArray(c.product_scopes) && c.product_scopes.length ? c.product_scopes.join('/') : 'كل المنتجات';
      return `${c.is_active?'✅':'⛔'} ${c.code} | ${typeText} | ${products} | حد أدنى ${c.min_order_amount||0}ج`;
    }).join('\n')});
  }


  if(cmd==='/available' || cmd==='/normal'){
    const msgTxt = arg || 'التنفيذ شغال حاليا بشكل طبيعي.';
    await setSetting('store_status','available');
    await setSetting('store_status_message',msgTxt);
    await setSetting('busy_mode','false');
    await setSetting('busy_message','');
    return tg('sendMessage',{chat_id:chatId,text:`🟢 تم تفعيل حالة: متاح الآن
${msgTxt}`});
  }
  if(cmd==='/busy'){
    const msgTxt = arg || 'تقدر تعمل الأوردر عادي لكن التنفيذ ممكن يتأخر شوية.';
    await setSetting('store_status','busy');
    await setSetting('store_status_message',msgTxt);
    await setSetting('busy_mode','true');
    await setSetting('busy_message',msgTxt);
    return tg('sendMessage',{chat_id:chatId,text:`🟡 تم تفعيل حالة: متاح ولكن فيه ضغط
${msgTxt}`});
  }
  if(cmd==='/closed'){
    const msgTxt = arg || 'ينفع تعمل طلبك عادي دلوقتي ✅ طلبك هيتسجل، وأول ما مواعيد العمل تبدأ هيكون من أوائل الطلبات اللي يتم تنفيذها.';
    await setSetting('store_status','closed');
    await setSetting('store_status_message',msgTxt);
    await setSetting('busy_mode','false');
    await setSetting('busy_message','');
    return tg('sendMessage',{chat_id:chatId,text:`🔴 تم تفعيل حالة: خارج مواعيد التنفيذ
${msgTxt}`});
  }
  if(cmd==='/status_now'){
    const rows = await supa('settings?select=key,value&key=in.(store_status,store_status_message,busy_mode,busy_message)');
    const m={}; (rows||[]).forEach(r=>m[r.key]=r.value);
    const mode = String(m.store_status || (String(m.busy_mode)==='true' ? 'busy' : 'available'));
    const msgTxt = m.store_status_message || m.busy_message || '';
    const label = mode==='closed' ? '🔴 مغلق حاليا' : mode==='busy' ? '🟡 متاح ولكن فيه ضغط' : '🟢 متاح الآن';
    return tg('sendMessage',{chat_id:chatId,text:`حالة الموقع الحالية:
${label}
${msgTxt || '-'}`});
  }

  if(cmd==='/today') return tg('sendMessage',{chat_id:chatId,text:await reportText(1,'تقرير اليوم')});
  if(cmd==='/week') return tg('sendMessage',{chat_id:chatId,text:await reportText(7,'تقرير الأسبوع')});
  if(cmd==='/month') return tg('sendMessage',{chat_id:chatId,text:await reportText(30,'تقرير الشهر')});
  if(cmd==='/reports') return tg('sendMessage',{chat_id:chatId,text:'استخدم /today أو /week أو /month'});
  if(cmd==='/pending') return pendingList(chatId,msg.message_id);
  if(cmd==='/late') return lateList(chatId,msg.message_id);
  if(cmd==='/customer' || cmd==='/orders'){
    if(!arg) return tg('sendMessage',{chat_id:chatId,text:'اكتب الرقم بعد الأمر\nمثال: /customer 010xxxxxxxx',reply_to_message_id:msg.message_id});
    return tg('sendMessage',{chat_id:chatId,text:await customerHistoryText(arg)});
  }
  if(cmd==='/find_id'){
    if(!arg) return tg('sendMessage',{chat_id:chatId,text:'اكتب PUBG ID بعد الأمر\nمثال: /find_id 123456789',reply_to_message_id:msg.message_id});
    return findByPubgId(chatId,arg,msg.message_id);
  }

  if(cmd==='/open'){
    if(!arg) return tg('sendMessage',{chat_id:chatId,text:'اكتب رقم الطلب بعد الأمر\nمثال: /open MOBA 1001',reply_to_message_id:msg.message_id});
    const o=await getOrder(arg);
    if(!o) return tg('sendMessage',{chat_id:chatId,text:'الطلب غير موجود.',reply_to_message_id:msg.message_id});
    return sendOrderCard(chatId,o,msg.message_id);
  }
  if(cmd==='/today_pending'){
    const start=new Date(); start.setHours(0,0,0,0);
    const rows=await supa(`orders?created_at=gte.${encodeURIComponent(start.toISOString())}&status=in.(pending,claimed,processing,on_hold,needs_fix)&select=*&order=created_at.desc&limit=30`);
    if(!rows.length) return tg('sendMessage',{chat_id:chatId,text:'✅ لا يوجد طلبات مفتوحة النهارده.',reply_to_message_id:msg.message_id});
    await tg('sendMessage',{chat_id:chatId,text:`📌 طلبات النهارده المفتوحة: ${rows.length}`});
    for(const o of rows.slice(0,12)) await tg('sendMessage',{chat_id:chatId,text:`${o.order_code||o.id}\n📱 ${o.phone||''}\n📌 ${statusLabel(o.status)}`,reply_markup:{inline_keyboard:[[{text:'👁 فتح الطلب',callback_data:`open:${o.id}`}]]}});
    return;
  }
  if(cmd==='/done_today'){
    const start=new Date(); start.setHours(0,0,0,0);
    const rows=await supa(`orders?created_at=gte.${encodeURIComponent(start.toISOString())}&status=eq.delivered&select=*&order=created_at.desc&limit=30`);
    if(!rows.length) return tg('sendMessage',{chat_id:chatId,text:'لسه مفيش طلبات مكتملة النهارده.',reply_to_message_id:msg.message_id});
    return tg('sendMessage',{chat_id:chatId,text:`✅ الطلبات المكتملة النهارده: ${rows.length}\n`+rows.slice(0,20).map(o=>`${o.order_code||o.id} | ${o.phone||''} | ${o.total||0}ج`).join('\n')});
  }
  if(cmd==='/stats'){
    const start=new Date(); start.setHours(0,0,0,0);
    const rows=await supa(`orders?created_at=gte.${encodeURIComponent(start.toISOString())}&select=*&order=created_at.desc&limit=1000`);
    const count=s=>rows.filter(o=>o.status===s).length;
    const products={}; const pay={};
    for(const o of rows){ pay[o.payment_method||'غير محدد']=(pay[o.payment_method||'غير محدد']||0)+1; for(const it of orderItems(o)){products[it.product]=(products[it.product]||0)+itemQty(it)}}
    const top=Object.entries(products).sort((a,b)=>b[1]-a[1])[0];
    return tg('sendMessage',{chat_id:chatId,text:`📊 إحصائيات اليوم\n━━━━━━━━━━━━━━\nطلبات اليوم: ${rows.length}\nتم الشحن: ${count('delivered')}\nمعلق: ${rows.filter(o=>['pending','claimed','processing','on_hold'].includes(o.status)).length}\nمحتاج تعديل: ${count('needs_fix')}\nأكثر باقة: ${top?top[0]+' × '+top[1]:'لا يوجد'}\nطرق الدفع:\n${Object.entries(pay).map(([k,v])=>`• ${k}: ${v}`).join('\n')||'لا يوجد'}`});
  }
  if(cmd==='/pinned'){
    const rows=await supa(`orders?pinned=eq.true&select=*&order=created_at.desc&limit=20`);
    if(!rows.length) return tg('sendMessage',{chat_id:chatId,text:'لا يوجد طلبات مهمة.',reply_to_message_id:msg.message_id});
    for(const o of rows) await tg('sendMessage',{chat_id:chatId,text:`📌 ${o.order_code||o.id}\n📱 ${o.phone||''}\n${statusLabel(o.status)}`,reply_markup:{inline_keyboard:[[{text:'👁 فتح',callback_data:`open:${o.id}`}]]}});
    return;
  }
  if(cmd==='/reviews'){
    const rows=await supa(`reviews?is_approved=eq.false&select=*&order=created_at.desc&limit=10`);
    if(!rows.length) return tg('sendMessage',{chat_id:chatId,text:'لا يوجد تقييمات جديدة للمراجعة.',reply_to_message_id:msg.message_id});
    for(const r of rows) await tg('sendMessage',{chat_id:chatId,text:`⭐ تقييم جديد\nالاسم: ${r.customer_name}\nالتقييم: ${r.rating}/5\nالرأي: ${r.review_text}`,reply_markup:{inline_keyboard:[[{text:'✅ موافقة',callback_data:`review_ok:${r.id}`},{text:'🗑 حذف',callback_data:`review_del:${r.id}`}]]}});
    return;
  }

  if(cmd==='/delete_order'){
    if(!arg) return tg('sendMessage',{chat_id:chatId,text:'اكتب رقم الطلب\nمثال: /delete_order MOBA 1001',reply_to_message_id:msg.message_id});
    const o=await getOrder(arg);
    if(!o) return tg('sendMessage',{chat_id:chatId,text:'الطلب غير موجود.',reply_to_message_id:msg.message_id});
    return tg('sendMessage',{chat_id:chatId,text:`⚠️ متأكد تحذف الطلب ${o.order_code || o.id}?`,reply_markup:confirmDeleteKeyboard(o.id)});
  }
  if(cmd==='/clear_pending'){
    const rows=await supa(`orders?status=in.(pending,claimed,processing,on_hold,needs_fix)&select=id`);
    return tg('sendMessage',{chat_id:chatId,text:`⚠️ هيتم حذف كل الطلبات المعلقة.\nالعدد: ${rows.length}`,reply_markup:confirmClearKeyboard('pending',rows.length)});
  }

  if(cmd==='/clear_all_orders' || cmd==='/new_month'){
    const rows=await supa(`orders?select=id`);
    return tg('sendMessage',{chat_id:chatId,text:`⚠️ هيتم حذف كل الأوردرات من الموقع.\nالعدد: ${rows.length}\nاستخدم ده في بداية الشهر فقط.`,reply_markup:confirmClearKeyboard('all',rows.length)});
  }

  if(cmd==='/archive_done'){
    const rows=await supa(`orders?status=eq.delivered&select=id`);
    for(const r of rows) await updateOrder(r.id,{status:'archived',status_text:'تمت الأرشفة',customer_status_text:'تم الشحن بنجاح'});
    return tg('sendMessage',{chat_id:chatId,text:`✅ تمت أرشفة ${rows.length} طلب منفذ.`});
  }
  if(cmd.startsWith('/')){
    return tg('sendMessage',{chat_id:chatId,text:`الأمر غير معروف: ${cmd}\nاكتب /admin لعرض الأوامر.`,reply_to_message_id:msg.message_id});
  }
}
async function handleCallback(cb){
  const adminId=cb.from.id;
  const chatId=cb.message.chat.id;
  const msgId=cb.message.message_id;
  if(!isAdmin(adminId)){
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'مش مصرح لك',show_alert:true});
    return;
  }
  let [action,...rest]=String(cb.data||'').split(':');
  let id=rest.join(':');

  // Support old buttons created by earlier versions: web_claim_ORDERID
  const legacyWebMap = {
    web_claim_: 'claim',
    web_processing_: 'processing',
    web_delivered_: 'delivered',
    web_hold_: 'hold',
    web_badshot_: 'bad_screen',
    web_badid_: 'bad_id',
    web_badphone_: 'bad_phone',
    web_reject_: 'reject',
    web_history_: 'customer_history',
    web_data_: 'data'
  };
  if(!id){
    const raw = String(cb.data || '');
    for(const prefix of Object.keys(legacyWebMap)){
      if(raw.startsWith(prefix)){
        action = legacyWebMap[prefix];
        id = raw.slice(prefix.length);
        break;
      }
    }
  }
  if(action==='noop' || action==='noop_clear'){
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'تم الإلغاء'});
    return;
  }
  if(action==='clear_confirm'){

    if(id==='all'){
      const rows=await supa(`orders?select=id`);
      for(const r of rows) await deleteOrder(r.id);
      await tg('answerCallbackQuery',{callback_query_id:cb.id,text:`تم حذف ${rows.length} طلب`});
      return tg('sendMessage',{chat_id:chatId,text:`🗑 تم حذف كل الأوردرات.\nالعدد: ${rows.length}`,reply_to_message_id:msgId});
    }

    if(id==='pending'){
      const rows=await supa(`orders?status=in.(pending,claimed,processing,on_hold,needs_fix)&select=id`);
      for(const r of rows) await deleteOrder(r.id);
      await tg('answerCallbackQuery',{callback_query_id:cb.id,text:`تم حذف ${rows.length} طلب`});
      return tg('sendMessage',{chat_id:chatId,text:`🗑 تم حذف ${rows.length} طلب معلق.`,reply_to_message_id:msgId});
    }
  }

  if(action==='review_ok' || action==='review_del'){
    if(action==='review_ok'){
      await supa(`reviews?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({is_approved:true})});
      await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'تم نشر التقييم'});
      return tg('sendMessage',{chat_id:chatId,text:'✅ تم نشر التقييم على الموقع',reply_to_message_id:msgId});
    }else{
      await supa(`reviews?id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});
      await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'تم حذف التقييم'});
      return tg('sendMessage',{chat_id:chatId,text:'🗑 تم حذف التقييم',reply_to_message_id:msgId});
    }
  }

  const order=await getOrder(id);
  if(!order){
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:`الطلب غير موجود: ${id}`,show_alert:true});
    return;
  }

  if(action==='pin'){
    const next=!order.pinned;
    await updateOrder(order.id,{pinned:next});
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:next?'تم تثبيت الطلب':'تم إلغاء التثبيت'});
    return tg('sendMessage',{chat_id:chatId,text:next?'📌 تم تمييز الطلب كمهم':'تم إلغاء تمييز الطلب',reply_to_message_id:msgId});
  }

  if(action==='delete_ask'){
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'تأكيد الحذف'});
    return tg('sendMessage',{chat_id:chatId,text:`⚠️ متأكد تحذف الطلب ${order.order_code || order.id}?`,reply_to_message_id:msgId,reply_markup:confirmDeleteKeyboard(realOrderId(order))});
  }
  if(action==='delete_confirm'){
    await deleteOrder(order.id);
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'تم حذف الطلب'});
    return tg('sendMessage',{chat_id:chatId,text:`🗑 تم حذف الطلب ${order.order_code || order.id}`,reply_to_message_id:msgId});
  }
  if(action==='open'){
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'فتح الطلب'});
    return sendOrderCard(chatId,order,msgId);
  }
  if(action==='data'){
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:itemSummary(orderItems(order)).slice(0,190),show_alert:true});
    return;
  }
  if(action==='customer_history'){
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:'جاري عرض سجل العميل'});
    return tg('sendMessage',{chat_id:chatId,text:await customerHistoryText(order.phone),reply_to_message_id:msgId});
  }
  const map={
    claim:['claimed','تم استلام الطلب بواسطة مسؤول'],
    processing:['processing','جاري تنفيذ الطلب'],
    delivered:['delivered','تم الشحن بنجاح'],
    hold:['on_hold','الطلب معلق مؤقتا'],
    bad_id:['needs_fix','ID غير صحيح - مطلوب تعديل من العميل',{fix_type:'bad_id',fix_count:Number(order.fix_count||0)}],
    bad_screen:['needs_fix','السكرين غير واضح - مطلوب رفع سكرين جديد من العميل',{fix_type:'bad_screen',fix_count:Number(order.fix_count||0)}],
    bad_phone:['needs_fix','رقم المتابعة غير صحيح - مطلوب تعديل من العميل',{fix_type:'bad_phone',fix_count:Number(order.fix_count||0)}],
    reject:['rejected','تم رفض الطلب - برجاء التواصل مع الدعم']
  };
  if(map[action]){
    const [status,label,extra={}] = map[action];
    const updated=await setStatus(order,status,label,adminId,extra);
    await tg('answerCallbackQuery',{callback_query_id:cb.id,text:label});
    await tg('sendMessage',{chat_id:chatId,text:`✅ تم تحديث حالة الطلب:\n${label}\n👨‍💻 بواسطة: ${adminPublic()}`,reply_to_message_id:msgId});
    try{
      await tg('editMessageReplyMarkup',{chat_id:chatId,message_id:msgId,reply_markup:orderKeyboard(realOrderId(order))});
    }catch(e){}
    return;
  }
}
export default async function handler(req,res){
  try{ rateLimit(req,'telegram',120,60_000); requireTelegramSecret(req); }catch(e){ return safeError(res,e,e.statusCode||401); }
  try{
    if(req.method!=='POST') return json(res,200,{ok:true});
    const qSecret=req.query?.secret || '';
    if(WEBHOOK_SECRET && qSecret !== WEBHOOK_SECRET) return json(res,403,{ok:false,error:'bad secret'});
    const update=req.body || {};
    if(update.message && update.message.text) await handleCommand(update.message);
    if(update.callback_query) await handleCallback(update.callback_query);
    return json(res,200,{ok:true});
  }catch(e){
    try{
      if(req.body?.callback_query?.id) await tg('answerCallbackQuery',{callback_query_id:req.body.callback_query.id,text:'Error: '+String(e.message).slice(0,120),show_alert:true});
    }catch(_){}
    return safeError(res,e,e.statusCode||500);
  }
}
