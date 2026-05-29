/* moba-v17-ops-upgrade */
(function(){
  let pendingCheckoutForm = null;
  function toast(msg){
    const t=document.getElementById('mobaToast');
    if(!t) return;
    t.textContent=msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),1800);
  }
  window.mobaToast = toast;

  // Better copy feedback
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-copy], .copy-btn');
    if(btn){
      setTimeout(()=>toast('تم النسخ ✅'),60);
    }
  });

  // Popular product jump
  document.addEventListener('click', function(e){
    const card = e.target.closest('[data-jump-product]');
    if(card){
      const wanted = card.dataset.jumpProduct;
      const products = Array.from(document.querySelectorAll('.product'));
      const found = products.find(p => (p.textContent||'').includes(wanted + ' UC') || (p.textContent||'').includes(wanted + 'UC'));
      if(found){
        found.scrollIntoView({behavior:'smooth',block:'center'});
        found.style.boxShadow='0 0 0 3px rgba(39,216,255,.25),0 0 28px rgba(39,216,255,.25)';
        setTimeout(()=>found.style.boxShadow='',1300);
      }else{
        document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth'});
      }
    }
  });

  // Use last ID button inside product cards
  function addLastIdButtons(){
    document.querySelectorAll('.product').forEach(card=>{
      const keep = card.querySelector('.use-last-id-inline-btn,[data-last-id]');
      card.querySelectorAll('.last-id-btn,.moba-v104-use-last,.pharaoh-product-helper [data-v65-fill-last]').forEach(btn=>{
        if(!keep || btn!==keep) btn.remove();
      });
    });
  }
  const oldRenderProducts = window.renderProducts;
  if(typeof oldRenderProducts === 'function'){
    window.renderProducts = function(){
      oldRenderProducts.apply(this,arguments);
      setTimeout(addLastIdButtons,0);
    };
  }
  setTimeout(addLastIdButtons,800);

  // Checkout confirmation before real submit
  function getCheckoutCartItems(){
    let fromStorage = [];
    try{ fromStorage = JSON.parse(localStorage.getItem('moba_cart') || '[]'); }catch(e){ fromStorage = []; }
    if(Array.isArray(fromStorage) && fromStorage.length) return fromStorage;
    if(Array.isArray(window.cart) && window.cart.length) return window.cart;
    return [];
  }
  function getItemQty(x){
    return Math.max(1, Number(x?.qty || x?.qtyTotal || 1));
  }
  function getItemUc(x){
    const qty = getItemQty(x);
    const direct = Number(x?.ucTotal || 0);
    if(direct) return direct;
    const base = Number(x?.uc || 0);
    if(base) return base * qty;
    const txt = String(x?.product || x?.name || '');
    const m = txt.match(/(\d+)\s*UC/i) || txt.match(/UC\s*(\d+)/i);
    return (m ? Number(m[1]) : 0) * qty;
  }
  function cartSummary(){
    const items = getCheckoutCartItems();
    const count = items.reduce((s,x)=>s+getItemQty(x),0);
    const total = items.reduce((s,x)=>s+(Number(x.price||0)*getItemQty(x)),0);
    const uc = items.reduce((s,x)=>s+getItemUc(x),0);
    return {items,count,total,uc};
  }
  function openConfirm(form){
    const box = document.getElementById('checkoutConfirm');
    const sum = document.getElementById('checkoutConfirmSummary');
    const s = cartSummary();
    const method = form.querySelector('[name="paymentMethod"]')?.value || 'غير محدد';
    const cpn = window.mobaCouponFinalTotal ? window.mobaCouponFinalTotal() : {discount:0, final:s.total, code:''};
    sum.innerHTML = `
      <div>🛒 عدد المنتجات: <b>${s.count}</b></div>
      <div>🎮 إجمالي الشدات: <b>${s.uc} UC</b></div>
      <div>💳 طريقة الدفع: <b>${method}</b></div>
      ${cpn.discount ? `<div>🎟️ الكوبون: <b>${cpn.code}</b> - خصم ${cpn.discount} جنيه</div>` : ''}
      <div>💰 الإجمالي: <b>${cpn.final} جنيه</b></div>
    `;
    pendingCheckoutForm = form;
    box.classList.add('show');
  }
  document.addEventListener('submit', function(e){
    const form = e.target;
    if(form && (form.id==='orderForm' || form.classList.contains('checkout-form')) && !form.dataset.confirmed){
      e.preventDefault();
      e.stopPropagation();
      openConfirm(form);
    }
  }, true);
  async function submitConfirmedCheckout(form){
    if(!form || form.dataset.sending === '1') return;
    const items = getCheckoutCartItems();
    const statusBox = document.getElementById('status');
    function show(msg,type){
      if(statusBox){
        statusBox.textContent = msg;
        statusBox.className = 'status ' + (type || 'err');
        try{statusBox.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}
      }else alert(msg);
    }
    if(!items.length){ show('سلة الطلبات فاضية','err'); return; }
    const fd = new FormData(form);
    const transferMode = fd.get('transferMode');
    if(!transferMode){ show('حدد هل التحويل من نفس رقم المتابعة ولا من رقم/محل تاني','err'); return; }
    if(transferMode === 'other' && !/^\d{3}$/.test(String(fd.get('transferLast3')||''))){
      show('لازم تكتب آخر 3 أرقام من رقم التحويل','err'); return;
    }
    const shot = form.querySelector('[name="screenshot"]');
    if(shot && shot.required && (!shot.files || !shot.files[0])){
      show('لازم ترفع سكرين التحويل','err'); return;
    }
    fd.set('cart', JSON.stringify(items));
    const checkoutBtn = form.querySelector('button[type="submit"]');
    const confirmBtn = document.getElementById('confirmSendOrder');
    const oldCheckoutText = checkoutBtn ? checkoutBtn.textContent : '';
    const oldConfirmText = confirmBtn ? confirmBtn.textContent : '';
    form.dataset.sending = '1';
    if(checkoutBtn){ checkoutBtn.disabled = true; checkoutBtn.textContent = '⏳ جاري ارسال الطلب...'; }
    if(confirmBtn){ confirmBtn.disabled = true; confirmBtn.textContent = '⏳ جاري الإرسال...'; }
    try{
      const res = await fetch('/api/order',{method:'POST',body:fd});
      const data = await res.json().catch(()=>({ok:false,error:'رد السيرفر غير واضح'}));
      if(!data.ok) throw new Error(data.error || 'حصل خطأ');
      localStorage.removeItem('moba_cart');
      window.cart = [];
      try{ if(typeof cart !== 'undefined') cart = []; }catch(e){}
      try{ if(typeof window.renderCart === 'function') window.renderCart(); }catch(e){}
      try{ if(typeof renderCart === 'function') renderCart(); }catch(e){}
      try{ if(typeof window.updateSticky === 'function') window.updateSticky(); }catch(e){}
      document.getElementById('checkoutConfirm')?.classList.remove('show');
      const trackingNote = data.statusTracking ? 'تقدر تتابع الحالة من سجل الطلبات برقم الموبايل.' : 'تم تسجيل الطلب بنجاح.';
      show('✅ تم إرسال الطلب بنجاح\n' + trackingNote,'ok');
      form.reset();
      pendingCheckoutForm = null;
    }catch(err){
      show('⚠️ ' + (err.message || 'حصل خطأ أثناء إرسال الطلب'),'err');
    }finally{
      delete form.dataset.sending;
      if(checkoutBtn){ checkoutBtn.disabled = false; checkoutBtn.textContent = oldCheckoutText || '✅ تنفيذ الشراء | Checkout'; }
      if(confirmBtn){ confirmBtn.disabled = false; confirmBtn.textContent = oldConfirmText || '✅ تأكيد الطلب'; }
    }
  }
  document.getElementById('confirmSendOrder')?.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    const box=document.getElementById('checkoutConfirm');
    box?.classList.remove('show');
    if(pendingCheckoutForm){
      pendingCheckoutForm.dataset.confirmed='1';
      submitConfirmedCheckout(pendingCheckoutForm);
      setTimeout(()=>delete pendingCheckoutForm.dataset.confirmed,1000);
    }
  });
  document.getElementById('cancelSendOrder')?.addEventListener('click', function(){
    document.getElementById('checkoutConfirm')?.classList.remove('show');
    pendingCheckoutForm=null;
  });

  // Review button after delivered order in details
  const oldOpen = window.openOrderDetailsByIndex;
  if(typeof oldOpen === 'function'){
    window.openOrderDetailsByIndex = function(orderId){
      oldOpen.apply(this,arguments);
      setTimeout(()=>{
        const order=(window.allHistoryOrders||[]).find(o=>String(o.id)===String(orderId));
        const content=document.getElementById('orderDetailsContent');
        if(order && content && ['delivered','archived'].includes(order.status) && !content.querySelector('.leave-review-btn')){
          content.insertAdjacentHTML('beforeend', `<button class="fix-submit leave-review-btn" type="button" onclick="document.getElementById('customerReviews')?.scrollIntoView({behavior:'smooth'});closeOrderDetails&&closeOrderDetails();">⭐ اكتب تقييمك للتجربة</button>`);
        }
      },120);
    };
  }
})();


/* moba-v31-coupons */
(function(){
  window.appliedCoupon = null;

  function money(n){
    try{return Number(n||0).toLocaleString('en-US');}catch(e){return n||0;}
  }
  function cartTotal(){
    const items = window.cart || [];
    return items.reduce((s,x)=>s+(Number(x.price||0)*Number(x.qty||1)),0);
  }
  function showCouponStatus(type,msg){
    const st = document.getElementById('couponStatus');
    if(!st) return;
    st.className = 'coupon-status show ' + type;
    st.innerHTML = msg;
  }
  function normalizeCouponError(msg){
    const t = String(msg || '').trim();
    if(!t) return '⚠️ الكوبون غير صالح دلوقتي. راجع الكود أو جرّب كود تاني.';
    if(/غير موجود|not found/i.test(t)) return '⚠️ الكود ده غير موجود. راجع الكتابة كويس أو جرّب كود تاني.';
    if(/متوقف/i.test(t)) return '⚠️ الكوبون ده متوقف حاليًا. جرّب كود تاني.';
    if(/منتهي/i.test(t)) return '⚠️ صلاحية الكوبون انتهت. جرّب كود تاني.';
    if(/السلة فاضية/i.test(t)) return '🛒 لسه السلة فاضية. ضيف منتج الأول وبعدها طبّق الكوبون.';
    if(/لا ينطبق|المنتجات الموجودة/i.test(t)) return '⚠️ الكوبون ده مش مناسب للمنتجات اللي في السلة حاليًا. راجع شروطه أو اختر المنتج المناسب.';
    if(/على الأقل/i.test(t)) return '⚠️ ' + t;
    return '⚠️ ' + t;
  }
  function refreshCouponInCart(){
    const old = document.getElementById('couponAppliedView');
    if(old) old.remove();
    const box = document.getElementById('couponBox');
    if(!box || !window.appliedCoupon) return;
    const total = cartTotal();
    const discount = Math.min(Number(window.appliedCoupon.discount_amount||0), total);
    const finalTotal = Math.max(0, total - discount);
    const div = document.createElement('div');
    div.id = 'couponAppliedView';
    div.innerHTML = `<span class="coupon-applied-pill">✅ ${window.appliedCoupon.code} خصم ${money(discount)} جنيه <button class="coupon-remove" type="button" id="removeCouponBtn">×</button></span>
    <div class="fix-small">الإجمالي بعد الخصم: <b>${money(finalTotal)} جنيه</b></div>`;
    box.appendChild(div);
    const rm = document.getElementById('removeCouponBtn');
    if(rm) rm.onclick = function(){
      window.appliedCoupon = null;
      localStorage.removeItem('moba_coupon');
      document.getElementById('couponInput').value = '';
      div.remove();
      showCouponStatus('err','تم حذف الكوبون');
      if(typeof window.renderCart === 'function') window.renderCart();
    };
  }
  async function applyCoupon(){
    const input = document.getElementById('couponInput');
    const code = String(input?.value || '').trim().toUpperCase();
    if(!code) return showCouponStatus('err','اكتب كود الخصم الأول');
    const total = cartTotal();
    if(total <= 0) return showCouponStatus('err','🛒 لسه السلة فاضية. ضيف المنتج الأول وبعدها جرّب الكوبون.');
    try{
      const res = await fetch('/api/coupon?code=' + encodeURIComponent(code) + '&total=' + encodeURIComponent(total) + '&cart=' + encodeURIComponent(JSON.stringify(window.cart || [])));
      const data = await res.json();
      if(!data.ok) throw new Error(data.error || 'الكوبون غير صالح');
      window.appliedCoupon = data.coupon;
      localStorage.setItem('moba_coupon', JSON.stringify(window.appliedCoupon));
      showCouponStatus('ok',`✅ تم تطبيق الكوبون <b>${data.coupon.code}</b> — خصم ${money(data.coupon.discount_amount)} جنيه`);
      refreshCouponInCart();
      if(typeof window.renderCart === 'function') window.renderCart();
    }catch(e){
      window.appliedCoupon = null;
      localStorage.removeItem('moba_coupon');
      refreshCouponInCart();
      showCouponStatus('err', normalizeCouponError(e && e.message));
    }
  }

  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'applyCouponBtn') applyCoupon();
  });
  document.addEventListener('keydown', function(e){
    if(e.target && e.target.id === 'couponInput' && e.key === 'Enter'){
      e.preventDefault(); applyCoupon();
    }
  });

  // Restore coupon
  setTimeout(()=>{
    try{
      const saved = JSON.parse(localStorage.getItem('moba_coupon') || 'null');
      if(saved && saved.code){
        window.appliedCoupon = saved;
        const input = document.getElementById('couponInput');
        if(input) input.value = saved.code;
        refreshCouponInCart();
      }
    }catch(e){}
  },700);

  // Patch checkout submit payload by adding coupon hidden fields
  document.addEventListener('submit', function(e){
    const form = e.target;
    if(!form || !(form.id === 'orderForm' || form.classList.contains('checkout-form'))) return;
    form.querySelectorAll('[data-coupon-hidden]').forEach(x=>x.remove());
    if(window.appliedCoupon){
      const code = document.createElement('input');
      code.type = 'hidden'; code.name = 'coupon_code'; code.value = window.appliedCoupon.code; code.dataset.couponHidden = '1';
      const discount = document.createElement('input');
      discount.type = 'hidden'; discount.name = 'coupon_discount'; discount.value = window.appliedCoupon.discount_amount; discount.dataset.couponHidden = '1';
      form.appendChild(code); form.appendChild(discount);
    }
  }, true);

  // Patch confirmation summary if exists
  const oldFetch = window.fetch;
  window.mobaCouponFinalTotal = function(){
    const total = cartTotal();
    const disc = window.appliedCoupon ? Math.min(Number(window.appliedCoupon.discount_amount||0), total) : 0;
    return {total, discount:disc, final:Math.max(0,total-disc), code:window.appliedCoupon?.code||''};
  };
})();


/* moba-v34-advanced-coupon-ui */
(function(){
  function patchCouponDisplay(){
    const oldApply = window.applyAdvancedCouponPatched;
    if(oldApply) return;
    window.applyAdvancedCouponPatched = true;

    const observer = new MutationObserver(()=>{
      const applied = window.appliedCoupon;
      const view = document.getElementById('couponAppliedView');
      if(applied && view && !view.dataset.v34){
        view.dataset.v34 = '1';
        const type = applied.discount_type === 'percent' ? `${applied.discount_value}%` : `${applied.discount_amount} جنيه`;
        const scope = applied.product_scope_text ? `<div class="fix-small">ينطبق على: ${applied.product_scope_text}</div>` : '';
        view.insertAdjacentHTML('beforeend', scope);
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  patchCouponDisplay();
})();


/* moba-v78-cart-coupon-collapse */
(function(){
  function setupCoupon(){
    const box=document.getElementById('couponBox');
    if(!box || box.dataset.v78Ready)return;
    box.dataset.v78Ready='1';
    const oldTitle=box.querySelector('b');
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='coupon-toggle-v78';
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span>كوبون خصم</span><span class="arrow">⌄</span>';
    box.insertBefore(btn,box.firstChild);
    if(oldTitle) oldTitle.textContent='كوبون خصم';
    btn.addEventListener('click',function(){
      const open=box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded',open?'true':'false');
      if(open){
        const input=document.getElementById('couponInput');
        setTimeout(function(){try{input && input.focus({preventScroll:true});}catch(e){}},80);
      }
    });
  }
  setupCoupon();
  document.addEventListener('DOMContentLoaded',setupCoupon);
  setTimeout(setupCoupon,150);
})();


/* moba-v81-safe-coupon-and-position */
(function(){
  function cartTotal(){
    return (window.cart||[]).reduce(function(s,x){
      return s + (Number(x.price||0) * Math.max(1,Number(x.qty||1)));
    },0);
  }
  function money(n){
    try{return Number(n||0).toLocaleString('en-US') + ' جنيه';}catch(e){return (n||0) + ' جنيه';}
  }
  function status(type,msg){
    const st=document.getElementById('couponStatus');
    if(!st)return;
    st.className='coupon-status show ' + type;
    st.textContent=msg;
  }
  function moveCoupon(){
    const box=document.getElementById('couponBox');
    const total=document.querySelector('#cartSection .total');
    if(box && total && total.previousElementSibling!==box){
      total.parentNode.insertBefore(box,total);
    }
  }
  async function safeApplyCoupon(e){
    const btn=e.target && e.target.closest && e.target.closest('#applyCouponBtn');
    const inputTarget=e.target && e.target.id==='couponInput' && e.key==='Enter';
    if(!btn && !inputTarget)return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    const input=document.getElementById('couponInput');
    const code=String(input && input.value || '').trim().toUpperCase();
    if(!code){status('err','اكتب كود الخصم الأول.');return false;}
    const total=cartTotal();
    if(total<=0){status('err','ضيف منتج للسلة الأول وبعدها جرّب الكوبون.');return false;}
    try{
      const res=await fetch('/api/coupon?code='+encodeURIComponent(code)+'&total='+encodeURIComponent(total)+'&cart='+encodeURIComponent(JSON.stringify(window.cart||[])),{headers:{Accept:'application/json'}});
      const text=await res.text();
      let data=null;
      try{data=JSON.parse(text);}catch(parseErr){throw new Error('SERVICE_UNAVAILABLE');}
      if(!res.ok || !data || !data.ok) throw new Error((data && data.error) || 'INVALID_COUPON');
      window.appliedCoupon=data.coupon;
      try{localStorage.setItem('moba_coupon',JSON.stringify(window.appliedCoupon));}catch(e){}
      const discount=Math.min(Number(data.coupon.discount_amount||0),total);
      status('ok','تم تطبيق الكوبون: خصم ' + money(discount));
      if(typeof window.renderCart==='function')window.renderCart();
      moveCoupon();
    }catch(err){
      window.appliedCoupon=null;
      try{localStorage.removeItem('moba_coupon');}catch(e){}
      const msg=String(err && err.message || '');
      if(/not found|غير موجود|INVALID/i.test(msg)) status('err','الكوبون غير صحيح أو غير مناسب للسلة.');
      else status('err','الكوبون غير متاح حاليًا. جرّب كود تاني أو كمل الطلب بدون كوبون.');
    }
    return false;
  }
  moveCoupon();
  document.addEventListener('DOMContentLoaded',moveCoupon);
  document.addEventListener('click',safeApplyCoupon,true);
  document.addEventListener('keydown',safeApplyCoupon,true);
  const cart=document.getElementById('cartSection');
  if(cart && 'MutationObserver' in window){
    new MutationObserver(moveCoupon).observe(cart,{childList:true,subtree:true});
  }
})();


/* moba-v103-system-cleanup */
(function(){
  if(window.__mobaV103Cleanup)return;
  window.__mobaV103Cleanup=true;
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function money(n){return Number(n||0).toLocaleString('ar-EG')+' جنيه'}
  function qty(x){return Math.max(1,Number(x&&x.qty||1))}
  function items(){return Array.isArray(window.cart)?window.cart:[]}
  function coupon(){
    if(window.appliedCoupon&&window.appliedCoupon.code)return window.appliedCoupon;
    try{
      const saved=JSON.parse(localStorage.getItem('moba_coupon')||'null');
      if(saved&&saved.code){window.appliedCoupon=saved;return saved}
    }catch(e){}
    return null;
  }
  function totals(){
    const subtotal=items().reduce((s,x)=>s+Number(x.price||0)*qty(x),0);
    const cp=coupon();
    const discount=cp?Math.min(Number(cp.discount_amount||0),subtotal):0;
    const final=Math.max(0,subtotal-discount);
    const count=items().reduce((s,x)=>s+qty(x),0);
    return {subtotal,discount,final,count,products:items().length,coupon:cp};
  }
  window.MobaCartCore={items,qty,totals,money};
  window.mobaCouponFinalTotal=function(){
    const t=totals();
    return {total:t.subtotal,discount:t.discount,final:t.final,code:t.coupon?.code||''};
  };
  function ensureTotalCard(){
    const cart=qs('#cartSection'); if(!cart)return;
    const totalRow=qs('.total',cart);
    let card=qs('#mobaV103Totals',cart);
    if(!card){
      card=document.createElement('div');
      card.id='mobaV103Totals';
      card.className='moba-v103-total-card';
      if(totalRow)totalRow.insertAdjacentElement('beforebegin',card);
      else (qs('#couponBox',cart)||cart).insertAdjacentElement('afterend',card);
    }
    const t=totals();
    card.innerHTML=[
      '<div class="row"><span>الإجمالي قبل الخصم</span><b>'+money(t.subtotal)+'</b></div>',
      t.coupon?'<div class="row discount"><span>كوبون '+esc(t.coupon.code)+'</span><b>- '+money(t.discount)+'</b></div>':'<div class="row"><span>الكوبون</span><b>لا يوجد خصم مطبق</b></div>',
      '<div class="row final"><span>الإجمالي النهائي</span><b>'+money(t.final)+'</b></div>'
    ].join('');
    const totalEl=qs('#total');
    if(totalEl)totalEl.textContent=money(t.final);
    const sticky=qs('#stickyCart');
    if(sticky)sticky.textContent='السلة '+t.count+' منتجات | '+money(t.final);
    const summary=qs('#cartV71Summary');
    if(summary){
      summary.innerHTML='<div><b>'+t.products.toLocaleString('ar-EG')+'</b><span>منتجات</span></div><div><b>'+t.count.toLocaleString('ar-EG')+'</b><span>كمية</span></div><div><b>'+money(t.final)+'</b><span>الإجمالي النهائي</span></div>';
    }
  }
  function refreshCouponView(){
    const st=qs('#couponStatus');
    const t=totals();
    if(st&&t.coupon){
      st.className='coupon-status show ok';
      st.innerHTML='تم تطبيق <b>'+esc(t.coupon.code)+'</b> | الخصم '+money(t.discount)+' | النهائي '+money(t.final);
    }
    ensureTotalCard();
  }
  const oldRender=window.renderCart;
  if(typeof oldRender==='function'){
    window.renderCart=function(){
      const r=oldRender.apply(this,arguments);
      setTimeout(()=>{ensureTotalCard();refreshCouponView()},0);
      return r;
    };
  }
  function snapshotForm(form){
    const fd=new FormData(form);
    const t=totals();
    return {
      phone:String(fd.get('customerPhone')||''),
      payment:String(fd.get('paymentMethod')||''),
      transferMode:String(fd.get('transferMode')||''),
      last3:String(fd.get('transferLast3')||''),
      hasShot:!!(qs('input[type="file"]',form)?.files?.[0]),
      shot:qs('input[type="file"]',form)?.files?.[0]||null,
      notes:String(fd.get('notes')||''),
      totals:t,
      cart:items().map(x=>({...x}))
    };
  }
  function validateOrder(s){
    if(!s.cart.length)return 'السلة فاضية.';
    if(!/^01\d{9}$/.test(s.phone))return 'اكتب رقم متابعة صحيح يبدأ بـ 01.';
    if(!s.payment)return 'اختار طريقة الدفع.';
    if(!s.transferMode)return 'حدد التحويل من نفس رقم المتابعة ولا رقم تاني.';
    if(s.transferMode==='other'&&!/^\d{3}$/.test(s.last3))return 'اكتب آخر 3 أرقام من رقم التحويل.';
    if(!s.hasShot)return 'ارفع سكرين التحويل عشان الطلب يتراجع.';
    if(s.shot){
      if(!/^image\//.test(s.shot.type||''))return 'ملف السكرين لازم يكون صورة.';
      if(s.shot.size<12*1024)return 'الصورة صغيرة جدًا. ارفع سكرين أوضح.';
    }
    return '';
  }
  function ensureReviewModal(){
    let modal=qs('#mobaV103ReviewModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='mobaV103ReviewModal';
    modal.className='moba-v103-review-modal';
    modal.innerHTML='<div class="moba-v103-review-card"><h3>راجع طلبك قبل الإرسال</h3><div id="mobaV103ReviewBody"></div><div class="moba-v103-review-actions"><button class="moba-v103-confirm" type="button" id="mobaV103Confirm">تأكيد وإرسال الطلب</button><button class="moba-v103-cancel" type="button" id="mobaV103Cancel">رجوع للتعديل</button></div></div>';
    document.body.appendChild(modal);
    qs('#mobaV103Cancel',modal).onclick=()=>modal.classList.remove('show');
    return modal;
  }
  function showReview(form,s){
    const modal=ensureReviewModal();
    const body=qs('#mobaV103ReviewBody',modal);
    body.innerHTML='<div class="moba-v103-review-list">'+
      '<div><b>المنتجات</b><br>'+s.cart.map((x,i)=>(i+1)+') '+esc(x.product)+' | ID: '+esc(x.pubgId)+' | الاسم: '+esc(x.pubgName||'-')).join('<br>')+'</div>'+
      '<div><b>رقم المتابعة</b><br>'+esc(s.phone)+'</div>'+
      '<div><b>الدفع</b><br>'+esc(s.payment)+' | '+(s.transferMode==='same'?'التحويل من نفس رقم المتابعة':'رقم تحويل مختلف: آخر 3 = '+esc(s.last3))+'</div>'+
      '<div><b>السكرين</b><br>'+(s.hasShot?'مرفوع وجاهز للمراجعة':'غير مرفوع')+'</div>'+
      '<div><b>الإجمالي</b><br>قبل الخصم: '+money(s.totals.subtotal)+'<br>الخصم: '+money(s.totals.discount)+'<br><b>النهائي: '+money(s.totals.final)+'</b></div>'+
      '<div>طلبك بيتراجع يدويًا قبل التنفيذ لضمان صحة البيانات.</div>'+
      '</div>';
    qs('#mobaV103Confirm',modal).onclick=function(){
      modal.classList.remove('show');
      form.dataset.v103Confirmed='1';
      form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    };
    modal.classList.add('show');
  }
  function addHiddenTotals(form){
    const t=totals();
    form.querySelectorAll('[data-v103-hidden]').forEach(x=>x.remove());
    const add=(name,value)=>{const i=document.createElement('input');i.type='hidden';i.name=name;i.value=String(value??'');i.dataset.v103Hidden='1';form.appendChild(i)};
    add('total_before_discount',t.subtotal);
    add('coupon_discount',t.discount);
    add('total_after_discount',t.final);
    if(t.coupon)add('coupon_code',t.coupon.code);
  }
  document.addEventListener('submit',function(e){
    const form=e.target;
    if(!form||form.id!=='orderForm')return;
    addHiddenTotals(form);
    if(form.dataset.v103Confirmed==='1'){
      form.dataset.v103Confirmed='';
      return;
    }
    const s=snapshotForm(form);
    const err=validateOrder(s);
    if(err){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      if(typeof window.showStatus==='function')window.showStatus(err,'err');
      else alert(err);
      return false;
    }
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    showReview(form,s);
    return false;
  },true);
  const oldFetch=window.fetch;
  window.fetch=async function(input,init){
    const isOrder=String(input&&input.url||input||'').includes('/api/order');
    let orderSnap=null;
    if(isOrder&&init&&init.body instanceof FormData){
      const t=totals();
      orderSnap={phone:String(init.body.get('customerPhone')||''),total:t.final,subtotal:t.subtotal,discount:t.discount,coupon:t.coupon?.code||''};
    }
    const res=await oldFetch.apply(this,arguments);
    if(isOrder){
      try{
        const clone=res.clone();
        clone.json().then(data=>{
          if(data&&data.ok)setTimeout(()=>showSuccess(data,orderSnap),120);
        }).catch(()=>{});
      }catch(e){}
    }
    return res;
  };
  function showSuccess(data,snap){
    const st=qs('#status')||qs('.status');
    if(!st)return;
    const rawId=data.orderId||data.id||data.order_id||data.order?.id||Date.now().toString().slice(-6);
    const id=String(rawId).startsWith('MOBA')?String(rawId):'MOBA '+String(rawId).replace(/\D/g,'').slice(-6);
    st.className='status ok';
    st.innerHTML='<div class="moba-v103-success"><b>تم استلام طلبك بنجاح</b><br>رقم الطلب: <b>'+esc(id)+'</b><br>رقم المتابعة: '+esc(snap?.phone||'')+'<br>الإجمالي النهائي: <b>'+money(snap?.total||0)+'</b><br>الحالة الحالية: تحت المراجعة الآن<div class="actions"><button type="button" data-v103-track="'+esc(snap?.phone||'')+'">متابعة الطلب</button><button type="button" class="secondary" data-v103-home>الرجوع للرئيسية</button></div></div>';
  }
  document.addEventListener('click',function(e){
    const track=e.target.closest('[data-v103-track]');
    if(track){
      const phone=track.getAttribute('data-v103-track')||'';
      if(typeof window.mobaShowView==='function')window.mobaShowView('orders');
      const inp=qs('#trackPhone'); if(inp){inp.value=phone; setTimeout(()=>inp.focus(),80)}
      const form=qs('#trackForm'); if(form&&phone)setTimeout(()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})),120);
    }
    if(e.target.closest('[data-v103-home]')&&typeof window.mobaShowView==='function')window.mobaShowView('home');
  },true);
  function enhanceTrack(){
    const box=qs('#trackResult');
    const order=window.__currentOrder;
    if(!box||!box.classList.contains('show')||!order||qs('.moba-v103-timeline',box))return;
    const states=['pending','claimed','processing','delivered','needs_fix'];
    const labels={pending:'استلام الطلب',claimed:'تحت المراجعة',processing:'جاري التنفيذ',delivered:'تم الشحن',needs_fix:'محتاج تعديل'};
    const current=String(order.status||'pending');
    let currentIndex=states.indexOf(current);
    if(currentIndex<0)currentIndex=current==='rejected'||current==='cancelled'?4:1;
    const tl=document.createElement('div');
    tl.className='moba-v103-timeline';
    tl.innerHTML=states.map((s,i)=>'<div class="moba-v103-step '+(i<currentIndex?'done':i===currentIndex?'active':'')+'">'+labels[s]+'</div>').join('');
    box.insertBefore(tl,box.firstChild);
  }
  setInterval(()=>{ensureTotalCard();enhanceTrack()},5000);
  document.addEventListener('DOMContentLoaded',()=>{ensureTotalCard();refreshCouponView()});
  setTimeout(()=>{ensureTotalCard();refreshCouponView()},700);
})();
