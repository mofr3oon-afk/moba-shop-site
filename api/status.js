import { json, supabaseRequest, STATUS_LABELS } from './_utils.js';
function money(n){return `${Number(n||0).toLocaleString('ar-EG')} جنيه`;}
export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{ok:false,error:'Method not allowed'});
  try{
    const phone=String(req.query.phone||'').trim();
    if(!/^01\d{9}$/.test(phone)) return json(res,400,{ok:false,error:'اكتب رقم موبايل صحيح'});
    const select='id,order_code,phone,customer_name,total,status,handler,items,note,created_at,updated_at,status_history,customer_status_text';
    const rows=await supabaseRequest(`orders?phone=eq.${encodeURIComponent(phone)}&select=${select}&order=created_at.desc&limit=3`);
    if(!rows||!rows.length) return json(res,404,{ok:false,error:'مفيش طلبات مسجلة على الرقم ده'});
    const order=rows[0];
    return json(res,200,{ok:true,order:{...order,status_label:order.customer_status_text||STATUS_LABELS[order.status]||order.status},recent:rows.slice(1).map(o=>({status:o.status,status_label:o.customer_status_text||STATUS_LABELS[o.status]||o.status,total:o.total,created_at:o.created_at}))});
  }catch(error){return json(res,500,{ok:false,error:error.message||'Server error'});}
}
