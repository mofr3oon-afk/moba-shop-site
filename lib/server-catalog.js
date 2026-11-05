import { DEFAULT_CATALOG } from '../js/catalog.js';
import { supabaseReady, supabaseRequest } from './_utils.js';

export async function getServerProducts(){
  let settings={};
  if(supabaseReady()){
    const rows=await supabaseRequest('settings?key=in.(dynamic_products,dynamic_sections,game_settings)&select=key,value');
    for(const row of rows||[])settings[row.key]=typeof row.value==='string'?JSON.parse(row.value):row.value;
  }
  const products=Array.isArray(settings.dynamic_products)?settings.dynamic_products:[];
  const sections=Array.isArray(settings.dynamic_sections)?settings.dynamic_sections:[];
  const games=settings.game_settings||{};
  const map=new Map();
  for(const p of [...DEFAULT_CATALOG.products,...products]){
    const section=p.section||p.cat;
    const sec=sections.find(s=>s.game===p.game&&(s.slug||s.key)===section);
    const game=games[p.game];
    const baseGame=DEFAULT_CATALOG.games.find(g=>g.slug===p.game)||{};
    const fields=p.custom_fields||p.fields||sec?.custom_fields||sec?.fields||game?.custom_fields||game?.fields||baseGame.fields||[];
    const parseDate=value=>value?new Date(value).getTime():null;
    const starts=parseDate(p.startsAt||p.starts_at||sec?.startsAt||sec?.starts_at);
    const ends=parseDate(p.endsAt||p.ends_at||sec?.endsAt||sec?.ends_at);
    const now=Date.now();
    const enabled=!p.hidden&&(p.status||'available')==='available'&&(!sec||(!sec.hidden&&(sec.status||'available')==='available'))&&(!game||(game.status||'available')==='available')&&
      (starts===null||(Number.isFinite(starts)&&now>=starts))&&(ends===null||(Number.isFinite(ends)&&now<=ends));
    const sale=Number(p.salePrice??p.sale_price??0);
    const cost=p.cost==null||p.cost===''?null:Number(p.cost);
    map.set(String(p.id),{...p,id:String(p.id),section,price:sale>0?sale:Number(p.price),cost:Number.isFinite(cost)&&cost>=0?cost:null,
      noQty:!!(p.noQty||p.no_qty),unit:p.unit||p.type||'',amount:Number(p.amount||p.uc||0),enabled,
      custom_fields:fields,checkoutMethod:p.checkoutMethod||p.checkout_method||'direct'});
  }
  return map;
}
export function pricedCart(input,products,{method='direct'}={}){
  if(!Array.isArray(input)||!input.length||input.length>30)throw invalid('السلة غير صالحة أو عدد المنتجات كبير');
  const quantities=new Map();
  return input.map(item=>{
    const p=products.get(String(item?.productId||''));
    if(!p?.enabled||!Number.isFinite(p.price)||p.price<=0||!Number.isSafeInteger(Math.round(p.price*100)))throw invalid('منتج غير متاح حاليا. حدّث السلة.');
    if(p.checkoutMethod!==method)throw invalid('اختار طريقة إتمام الطلب المناسبة للمنتج وافصل منتجات الشات عن الطلب المباشر.');
    const qty=Number(item.qty??1);
    if(!Number.isSafeInteger(qty)||qty<1||qty>20||(p.noQty&&qty!==1))throw invalid('الكمية لازم تكون عدد صحيح من 1 إلى 20.');
    const count=(quantities.get(p.id)||0)+qty;quantities.set(p.id,count);
    if(count>(p.noQty?1:20))throw invalid('إجمالي كمية المنتج أكبر من المسموح.');
    return {productId:p.id,product:p.name,game:p.game,price:p.price,qty,unit:p.unit,amount:p.amount,noQty:p.noQty,checkoutMethod:p.checkoutMethod,
      pubgId:String(item.pubgId||'').trim().slice(0,100),pubgName:String(item.pubgName||item.name||item.playerName||'').trim().slice(0,100),
      extraFields:cleanExtraFields(item.extraFields,p)};
  });
}
function cleanExtraFields(input,product){
  const fields=product.custom_fields||product.fields||[];const out={};
  for(const field of fields){
    const key=String(field.key||'');if(!key||/pass(word)?|كلمة.*مرور/i.test(key+' '+field.label))continue;
    const value=String(input?.[key]||'').trim().slice(0,200);
    if(value&&field.type==='number'&&!/^\d{1,20}$/.test(value))throw invalid('راجع الحقل الرقمي المطلوب للمنتج.');
    if(field.required&&!value)throw invalid('راجع بيانات المنتج المطلوبة.');out[key]=value;
  }
  return out;
}
export function invalid(message){const error=new Error(message);error.statusCode=400;return error;}
export function cartAmount(items){
  const cents=items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.qty,0);
  if(!Number.isSafeInteger(cents)||cents<=0)throw invalid('إجمالي الطلب غير صالح');
  return cents/100;
}
