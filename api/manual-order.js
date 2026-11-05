import { json, supabaseReady, supabaseRequest, telegramJson, escapeHtml, telegramKeyboard, cairoDateKey } from '../lib/_utils.js';
import { rateLimit, persistentRateLimit, safeError } from '../lib/_security.js';
import { readJsonBody } from '../lib/request-body.js';
import { getServerProducts, pricedCart, invalid, cartAmount } from '../lib/server-catalog.js';
import { orderIdentity, fingerprint, readExistingOrder, replayResponse } from '../lib/idempotency.js';

export const config={api:{bodyParser:false}};
export function handoffDetails(order,contact){
  const lines=[`طلب ${order.order_code}`,...order.items.map(i=>`${i.product} × ${i.qty} — ${i.price*i.qty} جنيه`),`الإجمالي: ${order.total} جنيه`,'أريد إتمام الشحن يدويًا. الدفع لم تتم مراجعته بعد.'];
  const message=lines.join('\n');
  return {message,whatsappUrl:contact.whatsapp?`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`:null,
    telegramUrl:contact.telegram?`https://t.me/${contact.telegram}`:null};
}
async function contacts(){
  const rows=await supabaseRequest('settings?key=in.(support_phone,brand_settings,store_status,maintenance_mode)&select=key,value');
  const out={};for(const r of rows||[])out[r.key]=typeof r.value==='string'&&/^[{[]/.test(r.value)?JSON.parse(r.value):r.value;
  if(out.store_status==='maintenance'||out.maintenance_mode===true||out.maintenance_mode==='true'){
    const e=new Error('المتجر تحت صيانة مؤقتا');e.statusCode=503;throw e;
  }
  const phone=String(out.support_phone||'201061707294').replace(/\D/g,'');
  const raw=String(out.brand_settings?.telegram||out.brand_settings?.telegramUrl||process.env.SUPPORT_URL||'https://t.me/MOFR3OON');
  const match=/^(?:https:\/\/t\.me\/|@)([a-zA-Z][a-zA-Z0-9_]{4,31})\/?$/.exec(raw);
  return {whatsapp:/^\d{10,15}$/.test(phone)?phone:null,telegram:match?.[1]||null};
}
export default async function handler(req,res){
  try{
    res.setHeader('Cache-Control','no-store');
    if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
    rateLimit(req,'manual-order',8,10*60_000);await persistentRateLimit(req,'manual-order-persistent',12,10*60_000);
    if(!supabaseReady())throw new Error('Supabase missing');
    const body=await readJsonBody(req);
    if(!['whatsapp','telegram'].includes(body.channel))throw invalid('اختار واتساب أو تليجرام');
    if(body.termsAccepted!==true)throw invalid('وافق على شروط الشحن قبل إرسال الطلب');
    if(body.coupon_code)throw invalid('الكوبونات للطلب المباشر حاليا. اتفق مع الدعم على أي خصم للشحن اليدوي.');
    const phone=String(body.phone||'').trim();
    if(phone&&!/^01\d{9}$/.test(phone))throw invalid('رقم الموبايل غير صحيح');
    const identity=orderIdentity(req.headers['idempotency-key'],'CHAT');
    const requestHash=fingerprint({cart:body.cart,channel:body.channel,phone});
    const contact=await contacts();
    if(!contact[body.channel])throw invalid('وسيلة التواصل غير متاحة حاليا');
    const existing=await readExistingOrder(identity.id);
    if(existing)return json(res,200,{...replayResponse(existing,identity,requestHash),...handoffDetails(existing,contact)});
    const products=await getServerProducts();
    const items=pricedCart(body.cart,products,{method:'manual'});
    const total=cartAmount(items);
    if(!Number.isFinite(total)||total<=0)throw invalid('الإجمالي غير صالح');
    const order={id:identity.id,order_code:identity.order_code,order_date:cairoDateKey(),phone,items,total,payment_method:'manual_chat',
      status:'pending',status_text:'بانتظار التواصل ومراجعة الإدارة',source:'website',order_type:'manual_chat',
      raw_data:{trackingTokenHash:identity.hash,requestHash,checkoutMethod:'manual',channel:body.channel,handoffStatus:'awaiting_contact',paymentVerified:false},
      status_history:[{status:'pending',label:'تم حفظ الطلب — إرسال الرسالة والدفع غير مؤكدين',at:new Date().toISOString(),by:'website'}]};
    order.raw_data.costTotal=items.every(i=>Number.isFinite(products.get(i.productId)?.cost))?items.reduce((s,i)=>s+products.get(i.productId).cost*i.qty,0):null;
    try{await supabaseRequest('orders',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(order)});}
    catch(e){const saved=await readExistingOrder(identity.id);if(saved)return json(res,200,{...replayResponse(saved,identity,requestHash),...handoffDetails(saved,contact)});throw e;}
    let telegramOk=false;
    if(process.env.BOT_TOKEN&&process.env.ORDER_GROUP_ID){
      const summary=handoffDetails(order,contact).message;
      try{
        const sent=await telegramJson('sendMessage',{chat_id:process.env.ORDER_GROUP_ID,text:`🛒 طلب شات محفوظ — التواصل والدفع غير مؤكدين\n${escapeHtml(summary)}`,parse_mode:'HTML',reply_markup:telegramKeyboard(order.id)});
        await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}`,{method:'PATCH',body:JSON.stringify({telegram_message_id:sent.result?.message_id})});
        telegramOk=true;
      }catch{ /* Saved order remains visible in admin even when notification fails. */ }
    }
    return json(res,200,{ok:true,orderId:order.id,orderCode:order.order_code,total,phone,trackingToken:identity.token,status:'pending',telegramOk,...handoffDetails(order,contact)});
  }catch(e){
    if(e.statusCode&&e.statusCode<500)return json(res,e.statusCode,{ok:false,error:e.message});
    return safeError(res,e,e.statusCode||500);
  }
}
