import { json, supabaseReady, supabaseRequest } from '../lib/_utils.js';
import { rateLimit, safeError } from '../lib/_security.js';
import { requireAdmin } from '../lib/admin-auth.js';

function cairoDateParts(date = new Date()){
  const parts = new Intl.DateTimeFormat('en-CA',{
    timeZone:'Africa/Cairo',
    year:'numeric',
    month:'2-digit',
    day:'2-digit'
  }).formatToParts(date);
  const get = type => parts.find(p=>p.type===type)?.value || '';
  return {year:get('year'), month:get('month'), day:get('day')};
}
function isoDay(date = new Date()){
  const p = cairoDateParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}
function addDays(day, diff){
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate()+diff);
  return d.toISOString().slice(0,10);
}
function periodFromQuery(q = {}){
  const range = String(q.range || q.period || 'day').toLowerCase();
  const day = String(q.date || q.day || isoDay()).slice(0,10);
  if(q.from && q.to) return {range:'custom', from:String(q.from).slice(0,10), to:String(q.to).slice(0,10)};
  if(range === 'week'){
    const d = new Date(`${day}T12:00:00Z`);
    const weekDay = (d.getUTCDay()+6)%7;
    const from = addDays(day,-weekDay);
    return {range, from, to:addDays(from,6)};
  }
  if(range === 'month'){
    const from = day.slice(0,7)+'-01';
    const d = new Date(`${from}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth()+1);
    d.setUTCDate(0);
    return {range, from, to:d.toISOString().slice(0,10)};
  }
  return {range:'day', from:day, to:day};
}
function money(n){ return Math.round(Number(n||0)); }
function inc(map,key,n=1){ map[key || 'غير محدد'] = (map[key || 'غير محدد'] || 0) + n; }
function avg(total,count){ return count ? Math.round(total/count) : 0; }

export default async function handler(req,res){
  try{
    rateLimit(req,'admin-daily-report',40,60_000);
    requireAdmin(req);
  }catch(e){
    return safeError(res,e,e.statusCode||401);
  }
  try{
    if(!supabaseReady()) return json(res,200,{ok:false,error:'Supabase غير مفعل'});
    const period = periodFromQuery(req.query || {});
    const path = `orders?order_date=gte.${encodeURIComponent(period.from)}&order_date=lte.${encodeURIComponent(period.to)}&select=*&order=created_at.asc&limit=1000`;
    const rows = await supabaseRequest(path).catch(()=>[]);
    const byStatus = {};
    const byPayment = {};
    const products = {};
    const days = {};
    const hours = {};
    const phones = new Set();
    const ids = new Set();
    let total = 0;
    let discounts = 0;
    let deliveredTotal = 0;
    let deliveredCount = 0;
    let needsReview = 0;

    for(const o of rows || []){
      const amount = money(o.total);
      total += amount;
      inc(byStatus,o.status || 'unknown');
      inc(byPayment,o.payment_method || o.raw_data?.paymentMethod || 'unknown');
      inc(days,o.order_date || String(o.created_at || '').slice(0,10));
      const hour = String(new Date(o.created_at || Date.now()).getHours()).padStart(2,'0') + ':00';
      inc(hours,hour);
      if(o.phone) phones.add(String(o.phone));
      if(['needs_fix','on_hold','pending','claimed','processing'].includes(String(o.status))) needsReview++;
      if(o.status === 'delivered'){ deliveredTotal += amount; deliveredCount++; }
      discounts += money(o.coupon_discount || o.raw_data?.coupon_discount || 0);
      for(const it of (Array.isArray(o.items) ? o.items : [])){
        inc(products,it.product || it.name || 'منتج', Number(it.qty || 1));
        if(it.pubgId) ids.add(String(it.pubgId));
      }
    }
    const count = (rows || []).length;
    const topProducts = Object.entries(products).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,count])=>({name,count}));
    return json(res,200,{
      ok:true,
      range:period.range,
      day:period.from === period.to ? period.from : `${period.from} إلى ${period.to}`,
      from:period.from,
      to:period.to,
      count,
      total,
      averageOrder:avg(total,count),
      deliveredCount,
      deliveredTotal,
      needsReview,
      uniquePhones:phones.size,
      uniqueGameIds:ids.size,
      discounts,
      byStatus,
      byPayment,
      byDay:days,
      byHour:hours,
      topProducts
    });
  }catch(e){
    return safeError(res,e,e.statusCode||500);
  }
}
