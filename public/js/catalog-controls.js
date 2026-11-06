import { normalizeDigits, searchText, productIsAvailable } from './interface-utils.js';
import { catalogPrice } from './catalog-presentation.js';

const states=new Map();
export function selectCatalogItems(items,{query='',filter='all',sort='store',available=productIsAvailable}={}){
  const needle=searchText(normalizeDigits(query));
  const result=items.filter(p=>{
    const text=searchText(normalizeDigits(`${p.name||''} ${p.id||''} ${p.amount||''} ${p.unit||''} ${p.description||''}`));
    return text.includes(needle)&&(filter!=='available'||available(p))&&(filter!=='hidden'||p.hidden||p.status==='hidden')&&(filter!=='disabled'||p.status==='disabled'||p.status==='soon')&&(filter!=='sale'||(Number(p.salePrice??p.sale_price)>0&&catalogPrice(p)<Number(p.price)));
  });
  if(sort==='low'||sort==='high')result.sort((a,b)=>(sort==='low'?1:-1)*(catalogPrice(a)-catalogPrice(b)));
  return result;
}
export function savingsPercent(p){const price=Number(p.price),sale=Number(p.salePrice??p.sale_price);return price>0&&sale>0&&sale<price?Math.floor((price-sale)/price*100):0;}

export function mountCatalogControls({host,grid,items,selector,key,editor=false,available}){
  if(!host||!grid)return;
  const state=states.get(key)||{query:'',filter:'all',sort:'store'};states.set(key,state);
  host.className='catalog-tools';
  host.innerHTML=`<div class="catalog-tools-fields"><label class="catalog-tool-search"><span>ابحث عن باقة</span><input type="search" placeholder="الاسم أو عدد الشدات / الجواهر…" autocomplete="off" aria-label="ابحث عن باقة"></label><label><span>عرض</span><select aria-label="تصفية الباقات"><option value="all">كل الباقات</option><option value="available">المتاحة الآن</option><option value="sale">العروض فقط</option>${editor?'<option value="hidden">المخفية</option><option value="disabled">الموقوفة وقريبًا</option>':''}</select></label><label><span>الترتيب</span><select aria-label="ترتيب الباقات"><option value="store">ترتيب المتجر</option><option value="low">الأقل سعرًا</option><option value="high">الأعلى سعرًا</option></select></label></div><div class="catalog-tools-meta"><span role="status" aria-live="polite" data-result-count></span><button type="button" class="catalog-clear">مسح الفلاتر</button></div>`;
  const input=host.querySelector('input'),[filter,sort]=host.querySelectorAll('select'),clear=host.querySelector('button'),counter=host.querySelector('[data-result-count]');
  input.value=state.query;filter.value=state.filter;sort.value=state.sort;
  const nodes=new Map([...grid.querySelectorAll(selector)].map(node=>[node.dataset.product||node.dataset.visualProduct,node]));
  const empty=document.createElement('div');empty.className='catalog-empty';empty.hidden=true;empty.setAttribute('role','status');empty.innerHTML='<strong>مفيش باقات مطابقة</strong><p>جرّب رقمًا أو اسمًا مختلفًا، أو امسح الفلاتر لعرض الكل.</p>';grid.after(empty);
  const apply=()=>{
    state.query=input.value;state.filter=filter.value;state.sort=sort.value;
    const selected=selectCatalogItems(items,{...state,available}),ids=new Set(selected.map(p=>p.id));
    for(const [id,node]of nodes)node.hidden=!ids.has(id);
    for(const p of selected){const node=nodes.get(p.id);if(node)grid.append(node);}
    counter.textContent=`${selected.length} من ${items.length} باقة`;
    const active=!!state.query||state.filter!=='all'||state.sort!=='store';clear.hidden=!active;empty.hidden=selected.length>0;grid.hidden=selected.length===0;
  };
  input.addEventListener('input',apply);filter.addEventListener('change',apply);sort.addEventListener('change',apply);
  clear.addEventListener('click',()=>{input.value='';filter.value='all';sort.value='store';apply();input.focus();});apply();
}
