import {escapeText as esc} from './interface-utils.js';
import {readOrderAccess,forgetOrderAccess} from './store.js';
import {trackingLink,validOrderAccess} from './tracking-links.js';

export function mountTrackingActions(host,id,access,{showOpen=true}={}){
  if(!host||!validOrderAccess(id,access))return;
  host.innerHTML='<div class="success-actions"><button type="button" class="primary" data-open-order>متابعة طلبي الآن</button><button type="button" class="ghost-btn" data-copy-order>نسخ رابط المتابعة الخاص</button></div><p class="small-note">الرابط خاص بطلبك؛ أي شخص معاه الرابط يقدر يتابعه. احتفظ به ولا تنشره.</p><div role="status" aria-live="polite" data-copy-status></div>';
  const openButton=host.querySelector('[data-open-order]');
  openButton.hidden=!showOpen;
  openButton.onclick=()=>{
    history.pushState({},'',`/track?order=${encodeURIComponent(id)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  host.querySelector('[data-copy-order]').onclick=async()=>{
    const link=trackingLink(location.origin,id,access),status=host.querySelector('[data-copy-status]');
    let copied=false;try{await navigator.clipboard.writeText(link);copied=true;}catch{}
    status.innerHTML=`<p>${copied?'تم نسخ الرابط الخاص.':'تعذر النسخ التلقائي؛ انسخ الرابط يدويًا.'}</p><details ${copied?'':'open'}><summary>نسخ يدوي للرابط الخاص</summary><input readonly dir="ltr" aria-label="رابط المتابعة الخاص"></details>`;
    const input=status.querySelector('input');input.value=link;input.onclick=()=>input.select();if(!copied)input.select();
  };
}

export function renderTrackingPage(page,openOrder,imported){
  const entries=Object.entries(readOrderAccess()).reverse();
  const wanted=new URLSearchParams(location.search).get('order')||imported?.id;
  const selected=entries.find(([id])=>id===wanted)||(!wanted?entries[0]:null);
  page(`<section class="section orders-workspace"><header class="orders-heading"><h1>طلباتي</h1><p>اعرف حالة طلبك وكلم الدعم بخصوصه.</p></header>
    <div class="orders-picker">${entries.length?`<label for="savedOrderPicker">الطلب المحفوظ</label><select id="savedOrderPicker">${wanted&&!selected?'<option value="">اختار طلب</option>':''}${entries.map(([id,o])=>`<option value="${esc(id)}">${esc(o.orderCode||id)}</option>`).join('')}</select><button type="button" class="forget-order" data-forget-selected hidden>مسح من الجهاز</button>`:'<p>افتح رابط المتابعة الخاص بطلبك أو افتحه برقم ومفتاح.</p>'}</div>
    <div id="trackResult" aria-live="polite"></div><div data-tracking-actions></div>
    <details class="tracking-manual" ${!entries.length&&!imported?'open':''}><summary>فتح طلب برقم ومفتاح</summary><form id="trackForm" class="fields-grid">
    <div class="field"><label for="trackId">رقم الطلب الكامل</label><input id="trackId" name="orderId" required autocomplete="off"></div>
    <div class="field"><label for="trackPhone">رقم الموبايل المسجل في الطلب</label><input id="trackPhone" name="phone" inputmode="tel" placeholder="اختياري لطلبات الشات"></div>
    <div class="field"><label for="trackKey">مفتاح المتابعة الخاص</label><input id="trackKey" name="trackingToken" required type="password" autocomplete="off"></div><button class="primary">عرض الطلب</button></form></details>
    <p class="small-note">فقدت الرابط أو بتستخدم جهازًا مشتركًا؟ تواصل مع الدعم للتحقق من طلبك واستعادة الوصول. رقم الهاتف وحده لا يفتح بيانات الطلب.</p></section>`);
  const form=document.querySelector('#trackForm');
  const picker=document.querySelector('#savedOrderPicker');
  const forget=document.querySelector('[data-forget-selected]');
  const open=(id,access)=>{
    form.elements.orderId.value=id;form.elements.phone.value=access.phone;form.elements.trackingToken.value=access.token;
    if(picker)picker.value=id;
    if(forget)forget.hidden=false;
    document.querySelector('[data-tracking-actions]').replaceChildren();
    openOrder(access.phone);
  };
  if(picker)picker.onchange=()=>{
    const access=readOrderAccess()[picker.value];
    if(access)open(picker.value,access);
  };
  if(forget)forget.onclick=()=>{
    const removed=forgetOrderAccess(picker.value);
    history.replaceState({},'','/track');
    renderTrackingPage(page,openOrder,null);
    if(!removed){const notice=document.createElement('p');notice.className='message err';notice.setAttribute('role','alert');notice.textContent='المتصفح منع حذف البيانات المحفوظة. الطلب مخفي في الجلسة الحالية فقط؛ امسح بيانات الموقع من إعدادات المتصفح لو الجهاز مشترك.';document.querySelector('.orders-picker').before(notice);}
  };
  if(selected)open(...selected);
}
