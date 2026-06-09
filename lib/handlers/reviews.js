import { rateLimit, safeError } from '../_security.js';
import { requireAdmin } from '../admin-auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res,status,obj){res.status(status).json(obj);}
function cleanText(v,max=260){return String(v||'').trim().replace(/\s+/g,' ').slice(0,max);}
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
  try{ rateLimit(req,'reviews',40,60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  try{
    if(req.method === 'GET'){
      if(String(req.query.admin||'') === '1'){
        requireAdmin(req);
        const rows = await supa('reviews?select=*&order=created_at.desc&limit=120');
        return json(res,200,{ok:true,reviews:rows||[]});
      }
      const rows = await supa('reviews?is_approved=eq.true&select=id,customer_name,rating,review_text,store_reply,created_at&order=created_at.desc&limit=12');
      return json(res,200,{ok:true,reviews:rows||[]});
    }
    if(req.method === 'POST'){
      const body=req.body || {};
      const customer_name=cleanText(body.customer_name,32);
      const review_text=cleanText(body.review_text,260);
      const rating=Math.max(1,Math.min(5,Number(body.rating||5)));
      if(customer_name.length<2) return json(res,400,{ok:false,error:'اكتب اسمك'});
      if(review_text.length<4) return json(res,400,{ok:false,error:'اكتب رأيك بشكل واضح'});
      const row={customer_name,rating,review_text,is_approved:false,verified_customer:false,created_at:new Date().toISOString()};
      const inserted=await supa('reviews',{method:'POST',body:JSON.stringify(row)});
      return json(res,200,{ok:true,review:inserted && inserted[0]});
    }
    if(req.method === 'PATCH'){
      requireAdmin(req);
      const body=req.body || {};
      const id=Number(body.id||0);
      if(!id) return json(res,400,{ok:false,error:'Review id missing'});
      const action=String(body.action||'reply');
      const patch={store_reply:cleanText(body.store_reply,260)};
      if(action==='approve') patch.is_approved=true;
      if(action==='reject') patch.is_approved=false;
      const updated=await supa(`reviews?id=eq.${id}`,{method:'PATCH',body:JSON.stringify(patch)});
      return json(res,200,{ok:true,review:updated && updated[0]});
    }
    return json(res,405,{ok:false,error:'Method not allowed'});
  }catch(e){
    return json(res,e.statusCode||400,{ok:false,error:String(e.message||e)});
  }
}
