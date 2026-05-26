import { json, supabaseReady, supabaseRequest } from '../lib/_utils.js';
import { rateLimit, safeError } from '../lib/_security.js';
import { requireAdmin } from '../lib/admin-auth.js';

function startOfDayCairo(){
  const now=new Date();
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const d=`${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
  return d;
}
export default async function handler(req,res){
  try{ rateLimit(req,'admin-daily-report',30,60_000); requireAdmin(req); }
  catch(e){ return safeError(res,e,e.statusCode||401); }
  try{
    if(!supabaseReady()) return json(res,200,{ok:false,error:'Supabase غير مفعل'});
    const day=String(req.query?.day||startOfDayCairo());
    const rows=await supabaseRequest(`orders?order_date=eq.${encodeURIComponent(day)}&select=*&order=created_at.asc`).catch(()=>[]);
    const total=(rows||[]).reduce((s,o)=>s+Number(o.total||0),0);
    const byStatus={};
    const byPayment={};
    const products={};
    for(const o of rows||[]){
      byStatus[o.status||'unknown']=(byStatus[o.status||'unknown']||0)+1;
      byPayment[o.payment_method||'unknown']=(byPayment[o.payment_method||'unknown']||0)+1;
      for(const it of (Array.isArray(o.items)?o.items:[])){
        products[it.product]=(products[it.product]||0)+Number(it.qty||1);
      }
    }
    const topProducts=Object.entries(products).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>({name,count}));
    return json(res,200,{ok:true,day,count:(rows||[]).length,total,byStatus,byPayment,topProducts});
  }catch(e){ return json(res,500,{ok:false,error:String(e.message||e)}); }
}
