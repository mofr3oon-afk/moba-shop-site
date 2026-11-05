// Compatibility endpoint: totals always come from the server catalog.
import quote from './quote.js';
export default async function handler(req,res){
 let cart;try{cart=JSON.parse(String(req.query.cart||'[]'));}catch{cart=[];}
 return quote({method:'POST',headers:req.headers,body:{cart,coupon_code:req.query.code}},res);
}
