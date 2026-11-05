import { supabaseRequest } from './_utils.js';

export async function adminReport(from,to){
  const start=new Date(from),end=new Date(to);
  if(!Number.isFinite(+start)||!Number.isFinite(+end)||end<start||end-start>366*86400000){const e=new Error('فترة التقرير غير صالحة أو أكبر من سنة');e.statusCode=400;throw e;}
  let orders=[],truncated=false;
  for(let offset=0;offset<10000;offset+=1000){
    const page=await supabaseRequest(`orders?created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lte.${encodeURIComponent(end.toISOString())}&select=id,status,total,raw_data,order_type&order=created_at.desc,id.asc&limit=1000&offset=${offset}`);
    orders.push(...(page||[]));if(!page||page.length<1000)break;if(offset===9000)truncated=true;
  }
  orders=orders.filter(o=>o.order_type!=='test'&&o.raw_data?.testOrder!==true);
  const delivered=orders.filter(o=>o.status==='delivered');
  const known=delivered.filter(o=>Number.isFinite(o.raw_data?.costTotal));
  return {count:orders.length,deliveredCount:delivered.length,revenue:delivered.reduce((s,o)=>s+Number(o.total||0),0),
    knownCostOrders:known.length,unknownCostOrders:delivered.length-known.length,
    knownCostProfit:known.reduce((s,o)=>s+Number(o.total||0)-o.raw_data.costTotal,0),
    statuses:orders.reduce((out,o)=>{out[o.status]=(out[o.status]||0)+1;return out;},{}),truncated};
}
