
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res,status,obj){res.status(status).json(obj);}
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
export default async function handler(req,res){
  try{
    if(req.method !== 'GET') return json(res,405,{ok:false,error:'Method not allowed'});
    const code = String(req.query.code || '').trim().toUpperCase();
    const total = Number(req.query.total || 0);
    if(!code) return json(res,400,{ok:false,error:'اكتب كود الخصم'});
    if(total <= 0) return json(res,400,{ok:false,error:'السلة فاضية'});
    const rows = await supa(`coupons?code=eq.${encodeURIComponent(code)}&select=*&limit=1`);
    const c = rows && rows[0];
    if(!c) return json(res,404,{ok:false,error:'الكوبون غير موجود'});
    if(!c.is_active) return json(res,400,{ok:false,error:'الكوبون متوقف حاليا'});
    if(c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return json(res,400,{ok:false,error:'الكوبون منتهي'});
    if(Number(c.min_order_amount || 0) > total) return json(res,400,{ok:false,error:`الكوبون يحتاج طلب بقيمة ${c.min_order_amount} جنيه على الأقل`});
    const discount = Math.min(Number(c.discount_amount || 0), total);
    if(discount <= 0) return json(res,400,{ok:false,error:'قيمة الخصم غير صحيحة'});
    return json(res,200,{ok:true,coupon:{code:c.code,discount_amount:discount}});
  }catch(e){
    return json(res,500,{ok:false,error:String(e.message||e)});
  }
}
