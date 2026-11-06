import { escapeText as esc, normalizeDigits } from './interface-utils.js';

export function imageSource(value){
  let s=String(value||'').trim();
  const refreshed={'/assets/game-covers/pubg-new.webp':'/assets/catalog-studio/pubg.png','/assets/game-covers/freefire-new.webp':'/assets/catalog-studio/freefire.webp','/assets/game-covers/mobile_legends.svg':'/assets/catalog-studio/mobile-legends.jpg'};
  s=refreshed[s]||s;
  return /^\/assets\/[\w./-]+$/.test(s)||/^https:\/\/[^\s<>"']+$/i.test(s)||/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(s)?s:'/assets/moba-shop-logo-256.png';
}
export function mergeCatalogRows(base,extra,key='id'){
  const rows=new Map(base.map(row=>[row[key],{...row}]));
  for(const row of extra||[])if(row?.[key])rows.set(row[key],{...rows.get(row[key]),...row});
  return [...rows.values()].sort((a,b)=>(Number(a.order)||99)-(Number(b.order)||99));
}
const amount=value=>{const n=Number(normalizeDigits(value??''));return Number.isFinite(n)?n:0;};
export function catalogPrice(p){return amount(p.salePrice??p.sale_price)>0?amount(p.salePrice??p.sale_price):amount(p.price);}
export function validateCatalogDraft(kind,raw){
  const draft={...raw};
  if(!String(draft.name||'').trim())throw new Error('اكتب اسمًا واضحًا.');
  draft.name=String(draft.name).trim();
  for(const key of ['price','salePrice','order','cost'])if(key in draft){
    if(key==='cost'&&String(draft[key]).trim()===''){draft[key]=null;continue;}
    const n=Number(normalizeDigits(draft[key]));
    if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100))||(key==='order'&&!Number.isInteger(n)))throw new Error('راجع الأسعار والترتيب؛ استخدم أرقامًا صحيحة وغير سالبة.');
    draft[key]=n;
  }
  if(kind==='product'&&draft.price<=0)throw new Error('السعر الأساسي لازم يكون أكبر من صفر.');
  if(kind==='product'&&draft.salePrice>=draft.price)throw new Error('سعر العرض لازم يكون أقل من السعر الأساسي، أو صفر لإلغائه.');
  return draft;
}
const statusText={available:'متاح',soon:'قريبًا',disabled:'موقوف',hidden:'مخفي'};
export function gameAccent(g){return /^#[0-9a-f]{6}$/i.test(g.accent||'')?g.accent:({pubg:'#f6c96e',freefire:'#ff8e72','blood-strike':'#fa758f','mobile-legends':'#94aaff','yalla-ludo':'#7de4c5'}[g.slug]||'#94aaff');}
export function gameTile(g,{attribute='data-game',editor=false,count,startingPrice}={}){
  const theme=['pubg','freefire','blood-strike','mobile-legends','yalla-ludo'].includes(g.slug)?g.slug:'custom';
  return `<button type="button" class="catalog-game-tile" data-theme="${theme}" style="--tile-accent:${gameAccent(g)}" ${attribute}="${esc(g.slug)}"><span class="tile-art"><span class="tile-orbit" aria-hidden="true"></span><img src="${esc(imageSource(g.cover))}" alt="" loading="lazy" decoding="async"><span class="tile-monogram" aria-hidden="true">${esc(g.name.slice(0,2).toUpperCase())}</span></span><span class="tile-copy"><strong>${esc(g.name)}</strong><span>${esc(g.subtitle||'باقات الشحن')}</span>${startingPrice!=null?`<small class="tile-starting">تبدأ من <b>${new Intl.NumberFormat('ar-EG').format(startingPrice)} ج.م</b></small>`:count==null?'':`<small>${count} باقة</small>`}</span><span class="tile-state ${g.status==='available'?'':'unavailable'}">${esc(statusText[g.status]||'متاح')}</span><span class="tile-arrow" aria-hidden="true">${editor?'✎':'←'}</span></button>`;
}
export function productFace(p,{game,attribute='data-visual-product',editor=false}={}){
  const price=catalogPrice(p),sale=amount(p.salePrice??p.sale_price)>0;
  const figure=p.image?`<img src="${esc(imageSource(p.image))}" alt="" loading="lazy">`:`<span class="package-symbol" aria-hidden="true">◇</span>`;
  return `<button type="button" class="catalog-package-face" ${attribute}="${esc(p.id)}"><span class="package-art">${figure}<small>${esc(game?.name||p.unit||'باقة شحن')}</small></span><span class="package-name">${esc(p.name)}</span><span class="package-price">${new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(price)} <small>ج.م</small>${sale?`<del>${new Intl.NumberFormat('ar-EG').format(amount(p.price))}</del>`:''}</span><span class="package-caption">${editor?`✎ تعديل · ${esc(statusText[p.status]||'متاح')}`:'اختيار الباقة ←'}</span></button>`;
}
