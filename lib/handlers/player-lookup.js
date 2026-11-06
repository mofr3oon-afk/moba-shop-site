import {lookupPubgPlayer,normalizePubgId,InvalidPubgId} from '../pubg-lookup.js';
import {rateLimit,persistentRateLimit,json} from '../_security.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return json(res,405,{ok:false,error:'استخدم طلب POST'});
  try{
    const id=normalizePubgId(req.body?.id);
    rateLimit(req,'web-pubg-lookup',6,60_000);
    await persistentRateLimit(req,'web-pubg-lookup',6,60_000);
    const player=await lookupPubgPlayer(id);
    return json(res,200,{ok:true,id:player.id,nickname:player.nickname});
  }catch(error){
    if(error instanceof InvalidPubgId)return json(res,400,{ok:false,code:'invalid_id',error:'راجع PUBG ID؛ لم يتم العثور على حساب صالح.'});
    if(error.statusCode===429)return json(res,429,{ok:false,code:'rate_limited',error:'محاولات كتير. انتظر دقيقة قبل المحاولة تاني.'});
    return json(res,503,{ok:false,code:'unavailable',error:'تعذر التحقق من اسم اللاعب حاليًا. اكتب الاسم يدويًا وراجع الـID.'});
  }
}
