import crypto from 'node:crypto';
import { supabaseRequest } from './_utils.js';

export function orderIdentity(key,kind){
  if(!/^[a-f0-9-]{36}$/i.test(String(key||''))){const e=new Error('حدّث الصفحة وحاول تاني. معرف المحاولة غير صالح.');e.statusCode=400;throw e;}
  const secret=process.env.ORDER_ACCESS_SECRET||process.env.ADMIN_SESSION_SECRET;
  if(!secret)throw new Error('ORDER_ACCESS_SECRET missing');
  const suffix=crypto.createHmac('sha256',secret).update(`identity:${kind}:${key}`).digest('hex').slice(0,32);
  const id=`MOBA-${kind}-${suffix}`;
  const token=crypto.createHmac('sha256',secret).update(`customer-access:${id}`).digest('hex');
  return {id,order_code:id,token,hash:crypto.createHash('sha256').update(token).digest('hex')};
}
export function fingerprint(value){return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');}
export async function readExistingOrder(id){
  const rows=await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows?.[0]||null;
}
export function replayResponse(order,identity,requestHash){
  if(order.raw_data?.requestHash!==requestHash){const e=new Error('المحاولة السابقة تخص سلة مختلفة. ابدأ طلبًا جديدًا.');e.statusCode=409;throw e;}
  return {ok:true,replayed:true,orderId:order.id,orderCode:order.order_code,total:order.total,phone:order.phone,
    trackingToken:identity.token,status:order.status,telegramOk:!!order.telegram_message_id,statusTracking:true};
}
