import { requireInternalSecret, rateLimit, safeError } from '../lib/_security.js';
// moba-v40-security

const BOT_TOKEN = process.env.BOT_TOKEN;
const ORDER_GROUP_ID = process.env.ORDER_GROUP_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res,status,obj){res.status(status).json(obj);}
async function tg(method,payload){
  if(!BOT_TOKEN || !ORDER_GROUP_ID) return null;
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  return r.json().catch(()=>null);
}
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
function minutesAgo(date){
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}
export default async function handler(req,res){
  try{ rateLimit(req,'check-late',20,60_000); if(process.env.INTERNAL_API_SECRET || process.env.SETUP_SECRET) requireInternalSecret(req); }catch(e){ return safeError(res,e,e.statusCode||401); }
  try{
    const cutoff = new Date(Date.now() - 30*60*1000).toISOString();
    const rows = await supa(`orders?created_at=lte.${encodeURIComponent(cutoff)}&status=in.(pending,claimed,processing,on_hold,needs_fix)&late_alerted_at=is.null&select=*&order=created_at.asc&limit=10`);
    let sent = 0;
    for(const o of rows || []){
      const mins = minutesAgo(o.created_at);
      await tg('sendMessage',{
        chat_id: ORDER_GROUP_ID,
        text:`⏰ طلب متأخر\n━━━━━━━━━━━━━━\n🧾 الطلب: ${o.order_code || o.id}\n📱 الرقم: ${o.phone || '-'}\n📌 الحالة: ${o.status || '-'}\n⏱️ مفتوح من: ${mins} دقيقة\n\nاستخدم /open ${o.order_code || o.id} لفتح الطلب`
      });
      await supa(`orders?id=eq.${encodeURIComponent(o.id)}`,{
        method:'PATCH',
        body:JSON.stringify({late_alerted_at:new Date().toISOString()})
      });
      sent++;
    }
    return json(res,200,{ok:true,checked:(rows||[]).length,sent});
  }catch(e){
    return safeError(res,e,e.statusCode||500);
  }
}
