import { supabaseReady, json } from '../_utils.js';
import { rateLimit, safeError } from '../_security.js';
import { getServerProducts, pricedCart, cartAmount } from '../server-catalog.js';
import { validateCouponServer } from '../coupons.js';
export default async function handler(req,res){
  try{
    rateLimit(req,'quote',40,60_000);
    if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
    if(!supabaseReady())throw new Error('Supabase missing');
    const body=req.body||{};
    const method=body.method==='manual'?'manual':'direct';
    const items=pricedCart(body.cart,await getServerProducts(),{method});
    const subtotal=cartAmount(items);
    const coupon=body.coupon_code?await validateCouponServer(body.coupon_code,subtotal,items,String(body.phone||'')):null;
    const total=Math.round((subtotal-Number(coupon?.discount_amount||0))*100)/100;
    return json(res,200,{ok:true,items,subtotal,total,coupon});
  }catch(e){if(e.statusCode&&e.statusCode<500)return json(res,e.statusCode,{ok:false,error:e.message});return safeError(res,e,e.statusCode||500);}
}
