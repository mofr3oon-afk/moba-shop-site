export const STATUS_LABELS = {
  pending: '⏳ تم استلام الطلب',
  claimed: '🙋 تم استلام الطلب من المسؤول',
  processing: '🔄 جاري التنفيذ',
  delivered: '✅ تم الشحن بنجاح',
  on_hold: '⏸ الطلب معلق',
  needs_fix: '⚠️ الطلب محتاج مراجعة',
  rejected: '❌ تم رفض الطلب',
  cancelled: '🗑 تم إلغاء الطلب'
};
export const OPEN_STATUSES = ['pending','claimed','processing','on_hold','needs_fix'];
export function json(res, status, data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
export function escapeHtml(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
export function supabaseReady(){return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);}
export async function supabaseRequest(path, options={}){
  if(!supabaseReady()) throw new Error('Supabase Environment Variables missing');
  const url = `${process.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${path}`;
  const response = await fetch(url,{...options,headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',...(options.headers||{})}});
  if(!response.ok){const text=await response.text().catch(()=>'');throw new Error(`Supabase error: ${text || response.status}`)}
  return response.json().catch(()=>null);
}
export async function telegramJson(method, payload){
  const token=process.env.BOT_TOKEN; if(!token) throw new Error('BOT_TOKEN missing');
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const d=await r.json().catch(()=>({})); if(!r.ok || d.ok===false) throw new Error(d.description || `Telegram ${method} failed`); return d;
}
export async function telegramForm(method, body){
  const token=process.env.BOT_TOKEN; if(!token) throw new Error('BOT_TOKEN missing');
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',body});
  const d=await r.json().catch(()=>({})); if(!r.ok || d.ok===false) throw new Error(d.description || `Telegram ${method} failed`); return d;
}
export function cairoDateKey(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
}
export function nowCairoText(){
  return new Intl.DateTimeFormat('ar-EG',{timeZone:'Africa/Cairo',dateStyle:'short',timeStyle:'short'}).format(new Date());
}
export function isAdmin(userId){return String(process.env.ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(Boolean).includes(String(userId));}
export function adminName(from={}){return from.first_name || from.username || 'Admin';}
export function telegramKeyboard(orderId,status='pending'){
  return {inline_keyboard:[
    [{text: status==='claimed'?'🙋 مستلم بالفعل':'🙋 استلمت | Claim',callback_data:`web_claim_${orderId}`},{text:status==='processing'?'🔄 جاري التنفيذ':'🔄 بدأ التنفيذ',callback_data:`web_processing_${orderId}`}],
    [{text:'✅ تم الشحن',callback_data:`web_delivered_${orderId}`},{text:status==='on_hold'?'⏸ معلق':'⏸ تعليق',callback_data:`web_hold_${orderId}`}],
    [{text:'📸 سكرين غير واضح',callback_data:`web_badshot_${orderId}`},{text:'🆔 ID غلط',callback_data:`web_badid_${orderId}`}],
    [{text:status==='needs_fix'?'⚠️ فيه مشكلة':'⚠️ مشكلة',callback_data:`web_fix_${orderId}`},{text:status==='rejected'?'❌ مرفوض':'❌ رفض',callback_data:`web_reject_${orderId}`}],
    [{text:'📊 سجل العميل',callback_data:`web_history_${orderId}`},{text:'📋 البيانات | Data',callback_data:`web_data_${orderId}`}]
  ]};
}
export function buildTelegramText(order){
  const cart=Array.isArray(order.items)?order.items:[];
  const itemLines=cart.map((item,i)=>`${i+1}) ${escapeHtml(item.product)}\n   ID: <code>${escapeHtml(item.pubgId)}</code>\n   السعر: ${escapeHtml(item.price)} جنيه`).join('\n\n');
  return `🚨 <b>طلب جديد من موقع MOBA SHOP</b>\n`+
  `━━━━━━━━━━━━━━\n`+
  `🧾 رقم الطلب: <code>${escapeHtml(order.order_code || order.id)}</code>\n`+
  `📌 الحالة: <b>${escapeHtml(STATUS_LABELS[order.status] || order.status)}</b>\n`+
  (order.handler?`👨‍💻 المسؤول: ${escapeHtml(order.handler)}\n`:``)+
  `👤 الاسم: ${escapeHtml(order.customer_name || 'غير محدد')}\n`+
  `📱 رقم العميل: <code>${escapeHtml(order.phone || order.customer_phone || '')}</code>\n`+
  `💳 الدفع: ${escapeHtml(order.payment_method || '')}\n`+
  `💰 الإجمالي: <b>${escapeHtml(order.total || 0)} جنيه</b>\n\n`+
  `🛒 <b>سلة الطلبات | Cart</b>\n${itemLines || 'لا يوجد'}\n\n`+
  (order.note?`📝 ملاحظة: ${escapeHtml(order.note)}\n\n`:``)+
  `📸 السكرين مرفق تحت الرسالة`;
}
