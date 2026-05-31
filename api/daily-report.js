import { json, supabaseReady, supabaseRequest } from '../lib/_utils.js';
import { rateLimit, safeError } from '../lib/_security.js';
import { requireAdmin } from '../lib/admin-auth.js';

function todayCairo(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function addDays(day,n){
  const d=new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate()+n);
  return d.toISOString().slice(0,10);
}
function period(q={}){
  const range=String(q.range||q.period||'day').toLowerCase();
  const day=String(q.date||q.day||todayCairo()).slice(0,10);
  if(q.from&&q.to)return {range:'custom',from:String(q.from).slice(0,10),to:String(q.to).slice(0,10)};
  if(range==='week'){
    const d=new Date(`${day}T12:00:00Z`);
    const weekDay=(d.getUTCDay()+6)%7;
    const from=addDays(day,-weekDay);
    return {range,from,to:addDays(from,6)};
  }
  if(range==='month'){
    const from=day.slice(0,7)+'-01';
    const d=new Date(`${from}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth()+1);
    d.setUTCDate(0);
    return {range,from,to:d.toISOString().slice(0,10)};
  }
  return {range:'day',from:day,to:day};
}
function inc(obj,key,n=1){obj[key||'غير محدد']=(obj[key||'غير محدد']||0)+n}
function num(v){return Math.round(Number(v||0))}

export default async function handler(req,res){
  try{rateLimit(req,'admin-daily-report',40,60_000);requireAdmin(req);}
  catch(e){return safeError(res,e,e.statusCode||401)}
  try{
    if(!supabaseReady())return json(res,200,{ok:false,error:'Supabase غير مفعل'});
    const p=period(req.query||{});
    const rows=await supabaseRequest(`orders?order_date=gte.${encodeURIComponent(p.from)}&order_date=lte.${encodeURIComponent(p.to)}&select=*&order=created_at.asc&limit=1000`).catch(()=>[]);
    const byStatus={},byPayment={},products={},byDay={};
    let total=0,discounts=0,deliveredTotal=0,deliveredCount=0,needsReview=0;
    const phones=new Set(),gameIds=new Set();
    for(const o of rows||[]){
      const amount=num(o.total);
      total+=amount;
      inc(byStatus,o.status||'unknown');
      inc(byPayment,o.payment_method||o.raw_data?.paymentMethod||'unknown');
      inc(byDay,o.order_date||String(o.created_at||'').slice(0,10));
      if(o.phone)phones.add(String(o.phone));
      if(['pending','claimed','processing','needs_fix','on_hold'].includes(String(o.status)))needsReview++;
      if(o.status==='delivered'){deliveredCount++;deliveredTotal+=amount}
      discounts+=num(o.coupon_discount||o.raw_data?.coupon_discount||0);
      for(const it of (Array.isArray(o.items)?o.items:[])){
        inc(products,it.product||it.name||'منتج',Number(it.qty||1));
        if(it.pubgId)gameIds.add(String(it.pubgId));
      }
    }
    const count=(rows||[]).length;
    const topProducts=Object.entries(products).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,count])=>({name,count}));
    return json(res,200,{ok:true,range:p.range,day:p.from===p.to?p.from:`${p.from} إلى ${p.to}`,from:p.from,to:p.to,count,total,averageOrder:count?Math.round(total/count):0,deliveredCount,deliveredTotal,needsReview,uniquePhones:phones.size,uniqueGameIds:gameIds.size,discounts,byStatus,byPayment,byDay,topProducts});
  }catch(e){return safeError(res,e,e.statusCode||500)}
}
