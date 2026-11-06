import {mountTrackingActions} from './tracking-ui.js';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function checkoutAttempt(cart,channel='direct'){
  const signature=JSON.stringify({cart,channel});
  let current;try{current=JSON.parse(sessionStorage.getItem('moba_checkout_attempt')||'null');}catch{}
  if(!current||current.signature!==signature)current={signature,key:crypto.randomUUID()};
  sessionStorage.setItem('moba_checkout_attempt',JSON.stringify(current));return current.key;
}
export function renderManualCheckout({page,cart,rememberOrder,clearCart,money}){
  page(`<section class="section"><div class="invoice-card"><span class="badge">شحن يدوي بدون حساب</span><h1>إتمام الطلب في الشات</h1>
  <p>نحفظ طلبك أولًا بسعر محسوب على الخادم. بعد التواصل ومراجعة وصول المبلغ نكمل خطوات الشحن الفعلية معك. لا ترسل كلمة مرور حسابك.</p>
  ${cart.map(i=>`<p>${esc(i.product)} × ${esc(i.qty)} — ${money(i.price*i.qty)} (تقديري)</p>`).join('')}
  <form id="manualCheckoutForm"><div class="field"><label>رقم موبايل للمتابعة (اختياري)</label><input name="phone" inputmode="tel" autocomplete="tel"></div>
  <label class="terms-check"><input name="terms" type="checkbox" required> أوافق على <a href="/policies" data-link>شروط الشحن والاسترجاع</a></label>
  <div class="support-actions"><button class="primary" type="submit" value="whatsapp">إتمام الطلب عبر واتساب</button><button class="ghost-btn" type="submit" value="telegram">إتمام الطلب عبر تليجرام</button></div></form><div id="manualCheckoutResult" aria-live="polite"></div></div></section>`);
  const form=document.querySelector('#manualCheckoutForm');let busy=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const channel=event.submitter?.value||'whatsapp';
    const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
    busy=true;form.querySelectorAll('button').forEach(b=>b.disabled=true);
    const result=document.querySelector('#manualCheckoutResult');result.textContent='جاري تسجيل الطلب...';
    try{
      const response=await fetch('/api/manual-order',{method:'POST',headers:{'Content-Type':'application/json','idempotency-key':checkoutAttempt(cart,channel)},body:JSON.stringify({cart,channel,phone:form.elements.phone.value.trim(),termsAccepted:form.elements.terms.checked})});
      const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'تعذر تسجيل الطلب');
      rememberOrder(data);clearCart();form.hidden=true;
      const target=channel==='whatsapp'?data.whatsappUrl:data.telegramUrl;
      result.innerHTML=`<div class="message ok">تم حفظ الطلب. فتح الشات لا يؤكد إرسال الرسالة أو الدفع أو الشحن.</div><h2>${esc(data.orderCode)}</h2><p>الإجمالي النهائي: ${money(data.total)}</p>
      <div class="field"><label>تفاصيل الطلب — انسخها وأرسلها في الشات</label><textarea id="handoffText" readonly rows="7">${esc(data.message)}</textarea></div><button class="ghost-btn" id="copyHandoff" type="button">نسخ الرسالة</button>
      <a class="primary" href="${esc(target)}" target="_blank" rel="noopener">فتح ${channel==='whatsapp'?'واتساب':'تليجرام'}</a>
      <p>${channel==='telegram'?'تليجرام: انسخ التفاصيل ثم أرسلها في المحادثة المفتوحة.':''}</p>
      <div data-tracking-actions></div>`;
      mountTrackingActions(result.querySelector('[data-tracking-actions]'),data.orderId,{token:data.trackingToken,phone:data.phone||''});
      document.querySelector('#copyHandoff').onclick=async()=>{
        try{await navigator.clipboard.writeText(data.message);document.querySelector('#copyHandoff').textContent='تم النسخ';}
        catch{document.querySelector('#handoffText').select();}
      };
      if(popup&&target)popup.location.href=target;else popup?.close();
    }catch(error){popup?.close();result.textContent=error.message;busy=false;form.querySelectorAll('button').forEach(b=>b.disabled=false);}
  });
}
