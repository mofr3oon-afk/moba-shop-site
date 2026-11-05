import crypto from 'node:crypto';

export function newOrderAccess(){
  const token=crypto.randomBytes(32).toString('hex');
  return {token,hash:crypto.createHash('sha256').update(token).digest('hex')};
}
export function requireOrderAccess(order,token){
  const stored=String(order?.raw_data?.trackingTokenHash||'');
  const value=String(token||'');
  const actual=crypto.createHash('sha256').update(value).digest('hex');
  if(!/^[a-f0-9]{64}$/.test(value)||stored.length!==64||!crypto.timingSafeEqual(Buffer.from(stored),Buffer.from(actual))){
    const error=new Error('بيانات المتابعة غير صحيحة. استخدم مفتاح الطلب أو تواصل مع الدعم.');error.statusCode=401;throw error;
  }
}
export function publicOrder(order){
  return {
    id:order.id,order_code:order.order_code,phone:order.phone,total:order.total,
    payment_method:order.payment_method,status:order.status,
    status_text:order.customer_status_text||order.status_text||order.status,
    status_label:order.customer_status_text||order.status_text||order.status,
    created_at:order.created_at,updated_at:order.updated_at,
    items:(Array.isArray(order.items)?order.items:[]).map(i=>({product:i.product,pubgId:i.pubgId,pubgName:i.pubgName,qty:i.qty,price:i.price})),
    status_history:(Array.isArray(order.status_history)?order.status_history:[]).map(h=>({status:h.status,at:h.at})),
    fix_type:order.fix_type,fix_count:order.fix_count
  };
}
