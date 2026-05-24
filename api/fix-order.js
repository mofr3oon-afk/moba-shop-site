import { rateLimit, safeError, validateSingleImageFromForm, validatePhone, validatePubgId } from './_security.js';
// moba-v40-security

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ORDER_GROUP_ID = process.env.ORDER_GROUP_ID;

function json(res,status,obj){res.status(status).json(obj);}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
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
async function tg(method,payload){
  if(!BOT_TOKEN) return null;
  const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  return r.json().catch(()=>null);
}
async function getOrder(id,phone){
  let rows=await supa(`orders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  if(rows && rows[0]) return rows[0];
  rows=await supa(`orders?order_code=eq.${encodeURIComponent(id)}&phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`);
  return rows && rows[0];
}
function history(order,label){
  const h=Array.isArray(order.status_history)?order.status_history:[];
  h.push({at:new Date().toISOString(),status:'pending',label,by:'customer'});
  return h.slice(-20);
}
export default async function handler(req,res){
  try{ rateLimit(req,'fix-order',20,60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  try{
    if(req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    const form = await req.formData();
    if(String(form.get('fixType')||'')==='bad_screen') validateSingleImageFromForm(form);
    const orderId = String(form.get('orderId')||'').trim();
    const phone = String(form.get('phone')||'').trim();
    const fixValue = String(form.get('fixValue')||'').trim();
    const fixFile = form.get('fixFile');
    if(!orderId) return json(res,400,{ok:false,error:'رقم الطلب غير موجود'});
    if(!phone) return json(res,400,{ok:false,error:'رقم الموبايل غير موجود'});
    const order = await getOrder(orderId,phone);
    if(!order) return json(res,404,{ok:false,error:'الطلب غير موجود'});
    if(order.status !== 'needs_fix') return json(res,400,{ok:false,error:'الطلب لا يحتاج تعديل حاليا'});
    const count = Number(order.fix_count||0);
    if(count >= 2) return json(res,403,{ok:false,error:'تم استخدام فرص التعديل برجاء التواصل مع الدعم'});
    const fixType = order.fix_type || 'general';
    if(fixType === 'bad_screen' && (!fixFile || !fixFile.name)) return json(res,400,{ok:false,error:'ارفع صورة السكرين الجديدة'});
    // V16 server validation
    // V40 fix validation
    if(fixType === 'bad_phone' && !/^01[0-9]{9}$/.test(fixValue)) return json(res,400,{ok:false,error:'رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01'});
    if(fixType === 'bad_id' && !/ID:\s*[0-9]{5,15}\s*-\s*Name:\s*.{2,}/i.test(fixValue)) return json(res,400,{ok:false,error:'اكتب ID صحيح واسم الحساب'});
    if(fixType !== 'bad_screen' && fixValue.length < 2) return json(res,400,{ok:false,error:'اكتب التعديل المطلوب'});
    let fileName = '';
    if(fixFile && fixFile.name) fileName = fixFile.name;
    const noteAppend = `
[تعديل العميل ${count+1}/2 - ${new Date().toLocaleString('en-GB')}]
${fixType === 'bad_screen' ? 'تم رفع سكرين جديد: '+fileName : fixValue}`;
    const patch = {
      status:'pending',
      status_text:'تم إرسال تعديل من العميل للمراجعة',
      customer_status_text:'تم إرسال التعديل للمراجعة',
      admin_status_text:'العميل أرسل تعديل جديد',
      fix_count:count+1,
      customer_fix_note:fixValue || fileName,
      last_status_by:'العميل',
      last_status_at:new Date().toISOString(),
      note:String(order.note||'') + '\n' + noteAppend,
      status_history:history(order,'العميل أرسل تعديل جديد'),
      updated_at:new Date().toISOString()
    };
    const rows=await supa(`orders?id=eq.${encodeURIComponent(order.id)}`,{method:'PATCH',body:JSON.stringify(patch)});
    const updated=rows && rows[0];
    if(ORDER_GROUP_ID){
      await tg('sendMessage',{
        chat_id:ORDER_GROUP_ID,
        text:`🔔 تعديل جديد من العميل
━━━━━━━━━━━━━━
🧾 الطلب: ${escapeHtml(order.order_code || order.id)}
📱 الرقم: ${escapeHtml(order.phone || phone)}
📌 نوع المشكلة: ${escapeHtml(fixType)}
🔢 فرصة التعديل: ${count+1}/2

${escapeHtml(fixType === 'bad_screen' ? 'تم رفع سكرين جديد: '+fileName : fixValue)}`,
        parse_mode:'HTML'
      });
    }
    return json(res,200,{ok:true,order:updated});
  }catch(e){
    return json(res,e.statusCode||400,{ok:false,error:String(e.message||e)});
  }
}
