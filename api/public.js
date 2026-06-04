import statusHandler from '../lib/handlers/status.js';
import reviewsHandler from '../lib/handlers/reviews.js';
import clientLogHandler from '../lib/handlers/client-log.js';
import couponHandler from '../lib/handlers/coupon.js';
import fixOrderHandler from '../lib/handlers/fix-order.js';
import { json } from '../lib/_utils.js';

export const config = { api: { bodyParser: false } };

async function attachJsonBody(req){
  if(req.body || !/application\/json/i.test(String(req.headers['content-type']||''))) return;
  const raw = await new Promise((resolve,reject)=>{
    let s='';
    req.on('data',c=>s+=c);
    req.on('end',()=>resolve(s));
    req.on('error',reject);
  });
  try{ req.body = raw ? JSON.parse(raw) : {}; }
  catch{ req.body = {}; }
}

export default async function handler(req,res){
  const action = String(req.query?.action || '').trim();
  if(action === 'status') return statusHandler(req,res);
  if(action === 'reviews'){ await attachJsonBody(req); return reviewsHandler(req,res); }
  if(action === 'client-log'){ await attachJsonBody(req); return clientLogHandler(req,res); }
  if(action === 'coupon') return couponHandler(req,res);
  if(action === 'fix-order') return fixOrderHandler(req,res);
  return json(res,404,{ok:false,error:'Unknown public action'});
}
