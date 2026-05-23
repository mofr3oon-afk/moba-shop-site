
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res,status,obj){res.status(status).json(obj);}
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
function publicOrder(o){
  if(!o) return null;
  return {
    id:o.id,
    order_code:o.order_code,
    phone:o.phone,
    payment_method:o.payment_method,
    total:o.total,
    items:o.items || [],
    status:o.status,
    status_text:o.status_text,
    status_label:o.customer_status_text || o.status_text || o.status,
    note:o.note,
    created_at:o.created_at,
    updated_at:o.updated_at,
    status_history:o.status_history || []
  };
}
export default async function handler(req,res){
  try{
    if(req.method !== 'GET') return json(res,405,{ok:false,error:'Method not allowed'});
    const phone=String(req.query.phone || '').trim();
    const history=String(req.query.history || '') === '1';
    if(!/^01\d{9}$/.test(phone)) return json(res,400,{ok:false,error:'اكتب رقم موبايل صحيح'});
    const rows=await supa(`orders?phone=eq.${encodeURIComponent(phone)}&select=*&order=created_at.desc&limit=${history?50:1}`);
    if(!rows || !rows.length) return json(res,404,{ok:false,error:'مفيش طلبات على الرقم ده'});
    if(history) return json(res,200,{ok:true,orders:rows.map(publicOrder)});
    return json(res,200,{ok:true,order:publicOrder(rows[0])});
  }catch(e){
    return json(res,500,{ok:false,error:String(e.message||e)});
  }
}
