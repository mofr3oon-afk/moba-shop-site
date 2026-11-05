export function escapeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function normalizeDigits(value){const arabic='٠١٢٣٤٥٦٧٨٩',persian='۰۱۲۳۴۵۶۷۸۹';return String(value??'').replace(/[٠-٩]/g,d=>String(arabic.indexOf(d))).replace(/[۰-۹]/g,d=>String(persian.indexOf(d)));}
export const ORDER_STATUS_TEXT={pending:'جديد',claimed:'تم الاستلام',processing:'قيد التنفيذ',delivered:'مكتمل',needs_fix:'يحتاج تعديلًا',on_hold:'معلق',rejected:'مرفوض',cancelled:'ملغي',archived:'مؤرشف'};
export function searchText(value){return String(value||'').toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/\s+/g,' ').trim();}
const aliases={pubg:'ببجي شدات',freefire:'فري فاير الماس','blood-strike':'بلود سترايك بلد سترايك','mobile-legends':'موبايل ليجندز','yalla-ludo':'يلا لودو',roblox:'روبلوكس روبوكس'};
export function matchesGame(game,query){return searchText(`${game.name} ${game.subtitle||''} ${game.slug} ${aliases[game.slug]||''}`).includes(searchText(query));}
export function productIsAvailable(product,now=Date.now()){
  const start=product.startsAt||product.starts_at,end=product.endsAt||product.ends_at;
  return !product.hidden&&(product.status||'available')==='available'&&(!start||(Number.isFinite(Date.parse(start))&&now>=Date.parse(start)))&&(!end||(Number.isFinite(Date.parse(end))&&now<=Date.parse(end)));
}
