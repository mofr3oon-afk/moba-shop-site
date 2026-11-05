import { rateLimit, safeError } from '../_security.js';
import { requireOrderAccess, publicOrder as safePublicOrder } from '../customer-access.js';
// moba-v40-security

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
export default async function handler(req,res){
  try{ rateLimit(req,'status.js',40,60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  try{
    if(!['GET','POST'].includes(req.method)) return json(res,405,{ok:false,error:'Method not allowed'});
    const input=req.method==='POST'?req.body||{}:req.query;
    const phone=String(input.phone || '').trim();
    const history=String(input.history || '') === '1';
    const id=String(input.orderId||'').trim();
    if(!id||!req.headers['x-order-token'])return json(res,401,{ok:false,error:'رقم الطلب ومفتاح المتابعة مطلوبان. الطلبات القديمة عبر الدعم.'});
    if(phone&&!/^01\d{9}$/.test(phone)) return json(res,400,{ok:false,error:'اكتب رقم موبايل صحيح'});
    const rows=await supa(`orders?id=eq.${encodeURIComponent(id)}&phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`);
    if(!rows || !rows.length) return json(res,404,{ok:false,error:'مفيش طلبات على الرقم ده'});
    requireOrderAccess(rows[0],req.headers['x-order-token']);
    res.setHeader('Cache-Control','no-store');
    if(history) return json(res,200,{ok:true,orders:rows.map(safePublicOrder)});
    return json(res,200,{ok:true,order:safePublicOrder(rows[0])});
  }catch(e){
    return safeError(res,e,e.statusCode||500);
  }
}
