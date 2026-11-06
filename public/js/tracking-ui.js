import {escapeText as esc} from './interface-utils.js';
import {readOrderAccess,forgetOrderAccess} from './store.js';
import {trackingLink,validOrderAccess} from './tracking-links.js';

export function mountTrackingActions(host,id,access){
  if(!host||!validOrderAccess(id,access))return;
  host.innerHTML='<div class="success-actions"><button type="button" class="primary" data-open-order>متابعة طلبي الآن</button><button type="button" class="ghost-btn" data-copy-order>نسخ رابط المتابعة الخاص</button></div><p class="small-note">الرابط خاص بطلبك؛ أي شخص معاه الرابط يقدر يتابعه. احتفظ به ولا تنشره.</p><div role="status" aria-live="polite" data-copy-status></div>';
  host.querySelector('[data-open-order]').onclick=()=>{
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
  const selected=entries.find(([id])=>id===wanted)||(entries.length===1?entries[0]:null);
  page(`<section class="section"><div class="page-title"><div><h1>طلباتي</h1><p>اختار طلبك المحفوظ لعرض حالته مباشرة. على جهاز تاني؟ افتح رابط المتابعة الخاص.</p></div></div></section>
    <section class="section"><div class="saved-orders">${entries.length?entries.map(([id,o])=>`<article><button type="button" class="saved-order ghost-btn" data-saved-order="${esc(id)}"><strong>${esc(o.orderCode||id)}</strong><span>عرض حالة الطلب ←</span></button><button type="button" class="forget-order" data-forget-order="${esc(id)}">نسيان الطلب على الجهاز ده</button></article>`).join(''):'<p>مفيش طلبات محفوظة على المتصفح ده. افتح رابط طلبك، أو استخدم بيانات المتابعة القديمة أدناه.</p>'}</div>
    <div data-tracking-actions></div><div id="trackResult" aria-live="polite"></div>
    <details class="tracking-manual" ${!entries.length&&!imported?'open':''}><summary>معاك رقم طلب ومفتاح متابعة قديم؟</summary><form id="trackForm" class="fields-grid">
    <div class="field"><label for="trackId">رقم الطلب الكامل</label><input id="trackId" name="orderId" required autocomplete="off"></div>
    <div class="field"><label for="trackPhone">رقم الموبايل المسجل في الطلب</label><input id="trackPhone" name="phone" inputmode="tel" placeholder="اختياري لطلبات الشات"></div>
    <div class="field"><label for="trackKey">مفتاح المتابعة الخاص</label><input id="trackKey" name="trackingToken" required type="password" autocomplete="off"></div><button class="primary">عرض الطلب</button></form></details>
    <p class="small-note">فقدت الرابط أو بتستخدم جهازًا مشتركًا؟ تواصل مع الدعم للتحقق من طلبك واستعادة الوصول. رقم الهاتف وحده لا يفتح بيانات الطلب.</p></section>`);
  const form=document.querySelector('#trackForm');
  const open=(id,access)=>{
    form.elements.orderId.value=id;form.elements.phone.value=access.phone;form.elements.trackingToken.value=access.token;
    document.querySelectorAll('[data-saved-order]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.savedOrder===id)));
    mountTrackingActions(document.querySelector('[data-tracking-actions]'),id,access);
    openOrder(access.phone);
  };
  document.querySelectorAll('[data-saved-order]').forEach(button=>button.onclick=()=>{const access=readOrderAccess()[button.dataset.savedOrder];if(access)open(button.dataset.savedOrder,access);});
  document.querySelectorAll('[data-forget-order]').forEach(button=>button.onclick=()=>{
    const removed=forgetOrderAccess(button.dataset.forgetOrder);history.replaceState({},'','/track');renderTrackingPage(page,openOrder,null);
    if(!removed){const notice=document.createElement('p');notice.className='message err';notice.setAttribute('role','alert');notice.textContent='المتصفح منع حذف البيانات المحفوظة. الطلب مخفي في الجلسة الحالية فقط؛ امسح بيانات الموقع من إعدادات المتصفح لو الجهاز مشترك.';document.querySelector('.saved-orders').before(notice);}
  });
  if(selected)open(...selected);
}
