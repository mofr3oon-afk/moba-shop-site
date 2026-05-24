import { requireInternalSecret, rateLimit, safeError } from './_security.js';
// moba-v40-security

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
function json(res,status,obj){res.status(status).json(obj);}
async function supa(path,opts={}){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
    ...opts,
    headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation',...(opts.headers||{})}
  });
  const text=await r.text(); let data; try{data=text?JSON.parse(text):null;}catch{data=text}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
export default async function handler(req,res){
  try{ rateLimit(req,'debug',10,60_000); requireInternalSecret(req); }catch(e){ return safeError(res,e,e.statusCode||401); }
  try{
    const key=String(req.query.key||'').trim();
    const phone=String(req.query.phone||'').trim();
    let rows=[];
    if(key){
      rows = await supa(`orders?id=eq.${encodeURIComponent(key)}&select=id,order_code,daily_number,phone,status,created_at&limit=5`);
      if(!rows.length) rows = await supa(`orders?order_code=eq.${encodeURIComponent(key)}&select=id,order_code,daily_number,phone,status,created_at&limit=5`);
    }else if(phone){
      rows = await supa(`orders?phone=eq.${encodeURIComponent(phone)}&select=id,order_code,daily_number,phone,status,created_at&order=created_at.desc&limit=10`);
    }else{
      rows = await supa(`orders?select=id,order_code,daily_number,phone,status,created_at&order=created_at.desc&limit=10`);
    }
    return json(res,200,{ok:true,rows});
  }catch(e){return safeError(res,e,e.statusCode||500);}
}
