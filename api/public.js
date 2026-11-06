import statusHandler from '../lib/handlers/status.js';
import reviewsHandler from '../lib/handlers/reviews.js';
import clientLogHandler from '../lib/handlers/client-log.js';
import couponHandler from '../lib/handlers/coupon.js';
import fixOrderHandler from '../lib/handlers/fix-order.js';
import { json } from '../lib/_utils.js';
import { readJsonBody } from '../lib/request-body.js';
import quoteHandler from '../lib/handlers/quote.js';
import playerLookupHandler from '../lib/handlers/player-lookup.js';

export const config = { api: { bodyParser: false } };

async function attachJsonBody(req){
  if(req.body || !/application\/json/i.test(String(req.headers['content-type']||''))) return;
  req.body = await readJsonBody(req);
}

export default async function handler(req,res){
  try{
  const action = String(req.query?.action || '').trim();
  if(action==='player-lookup'){await attachJsonBody(req);return playerLookupHandler(req,res);}
  if(action==='quote'){await attachJsonBody(req);return quoteHandler(req,res);}
  if(action === 'status'){if(req.method==='POST')await attachJsonBody(req);return statusHandler(req,res);}
  if(action === 'reviews'){ await attachJsonBody(req); return reviewsHandler(req,res); }
  if(action === 'client-log'){ await attachJsonBody(req); return clientLogHandler(req,res); }
  if(action === 'coupon') return couponHandler(req,res);
  if(action === 'fix-order') return fixOrderHandler(req,res);
  return json(res,404,{ok:false,error:'Unknown public action'});
  }catch(e){return json(res,e.statusCode||500,{ok:false,error:'بيانات الطلب غير صالحة أو حجمه كبير'});}
}
