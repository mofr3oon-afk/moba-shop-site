/* inline-script-1 */
const products={uc:[{name:'60 UC',type:'شحن بالايدي | ID',price:50},{name:'325 UC',type:'شحن بالايدي | ID',price:235,hot:true},{name:'660 UC',type:'شحن بالايدي | ID',price:435},{name:'1800 UC',type:'شحن بالايدي | ID',price:1120},{name:'3850 UC',type:'شحن بالايدي | ID',price:2170},{name:'8100 UC',type:'شحن بالايدي | ID',price:4350}],growth:[{name:'ازدهار 1',type:'Growth Pack ID',price:55,warning:'الازدهار بيتشحن مرة واحدة فقط على الاكونت في العمر كله. اتأكد من اللعبة قبل الطلب.'},{name:'ازدهار 2',type:'Growth Pack ID',price:150,warning:'الازدهار بيتشحن مرة واحدة فقط على الاكونت في العمر كله. اتأكد من اللعبة قبل الطلب.'},{name:'ازدهار 3',type:'Growth Pack ID',price:250,warning:'الازدهار بيتشحن مرة واحدة فقط على الاكونت في العمر كله. اتأكد من اللعبة قبل الطلب.'},{name:'الكريستالة الميثك',type:'Mythic Crystal ID',price:150,warning:'الكريستالة غالبا واحدة او اتنين في الاسبوع وبتتجدد يوم الاثنين. اتأكد انها متاحة عندك في اللعبة.'}],prime:[{name:'Prime',type:'150 UC Total',price:55},{name:'Prime Plus',type:'900 UC Total',price:445},{name:'Prime + Prime Plus',type:'1050 UC Total',price:500}]};
    const instapayLink='https://ipn.eg/S/mofr3oon1/instapay/3ALZfx'; let activeCat='uc'; let cart=JSON.parse(localStorage.getItem('moba_cart')||'[]'); window.cart = cart; window.activeCat = activeCat;
    const productList=document.getElementById('productList'),cartBox=document.getElementById('cartBox'),totalEl=document.getElementById('total'),statusEl=document.getElementById('status'),modal=document.getElementById('modal'),modalText=document.getElementById('modalText'),stickyCart=document.getElementById('stickyCart');
    function saveCart(){window.cart = cart; localStorage.setItem('moba_cart',JSON.stringify(cart));} 
    function extractUc(productName){
      const m = String(productName||'').match(/(\d+)\s*UC/i);
      return m ? Number(m[1]) : 0;
    }
    function canUseQty(item){
      const p = String(item.product||'');
      return !/ازدهار|Growth|كريستالة|Crystal|Prime/i.test(p);
    }
    function itemQty(item){ return Math.max(1, Number(item.qty || 1)); }
    function itemLineTotal(item){ return Number(item.price||0) * itemQty(item); }
    function itemUcTotal(item){ return extractUc(item.product) * itemQty(item); }

    function money(n){return `${Number(n||0).toLocaleString('ar-EG')} جنيه`;} function escapeText(t){return String(t).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
    async function copyText(text){try{await navigator.clipboard.writeText(text);showStatus('✅ تم النسخ','ok')}catch{showStatus('انسخ يدويا: '+text,'ok')}} window.copyText=copyText;
    function renderProducts(){productList.innerHTML=products[activeCat].map((p,i)=>`<div class="product">${p.hot?'<span class="hot">🔥 الاكثر طلبا</span>':''}<b>${escapeText(p.name)}</b>${p.type?`<div class="type">${escapeText(p.type)}</div>`:''}<div class="price">💰 ${money(p.price)}</div>${p.warning?`<div class="warn">⚠️ ${escapeText(p.warning)}</div>`:''}<input class="id-input" id="id_${i}" inputmode="numeric" placeholder="PUBG ID" /><input class="id-input" id="name_${i}" placeholder="اسم الحساب داخل اللعبة" /><button class="btn add" onclick="addToCart(${i})">➕ إضافة للسلة</button></div>`).join('');}
    function renderCart(){if(!cart.length) cartBox.innerHTML='<div class="cart-empty">السلة فاضية<br>اختار منتج واكتب ID واضغط إضافة للسلة</div>'; else cartBox.innerHTML=cart.map((item,i)=>`<div class="cart-item"><button class="remove" onclick="removeItem(${i})">حذف</button><b>${i+1}) ${escapeText(item.product)}</b><br>🆔 ID: ${escapeText(item.pubgId)}<br>👤 Name: ${escapeText(item.pubgName||'-')}<br>💰 ${money(item.price)}</div>`).join(''); const total=cart.reduce((s,x)=>s+itemLineTotal(x),0); totalEl.textContent=money(total); stickyCart.textContent=`السلة ${cart.length} منتجات | ${money(total)}`;}
    function renderPaymentDetails(){const v=document.getElementById('paymentMethod').value, box=document.getElementById('paymentDetails'); if(!v){box.className='payment-details';box.innerHTML='';return;} if(v==='InstaPay'){box.className='payment-details show';box.innerHTML=`<b>🟢 بيانات InstaPay</b><div class="pay-row"><span>User: mofr3oon1</span><button type="button" class="copy" onclick="copyText('mofr3oon1')">نسخ</button></div><div class="pay-row"><span>Phone: 01061707294</span><button type="button" class="copy" onclick="copyText('01061707294')">نسخ</button></div><div class="pay-row"><span>Name: مؤمن</span><button type="button" class="copy" onclick="copyText('مؤمن')">نسخ</button></div><a class="pay-link" href="${instapayLink}" target="_blank" rel="noopener">🔗 فتح لينك InstaPay</a><div class="notice">حوّل الاول على البيانات دي وبعدها ارفع السكرين.</div>`;} else {box.className='payment-details show';box.innerHTML=`<b>📱 بيانات المحفظة</b><div class="pay-row"><span>Phone: 01061707294</span><button type="button" class="copy" onclick="copyText('01061707294')">نسخ</button></div><div class="pay-row"><span>Name: مؤمن</span><button type="button" class="copy" onclick="copyText('مؤمن')">نسخ</button></div><div class="notice">Vodafone / Orange / Etisalat / WE<br>حوّل الاول وبعدها ارفع السكرين.</div>`;}}
    function addToCart(i){
      const p=products[activeCat][i];
      const pubgId=document.getElementById(`id_${i}`).value.trim();
      const pubgName=document.getElementById(`name_${i}`).value.trim();
      if(!/^\d{5,15}$/.test(pubgId)){showStatus('اكتب PUBG ID صحيح ارقام فقط','err');return;}
      if(pubgName.length<2){showStatus('اكتب اسم حسابك داخل اللعبة عشان نراجع الطلب صح','err');return;}
      const newItem={product:p.name,price:p.price,pubgId,pubgName,qty:1};
      const existingIndex = cart.findIndex(x => canUseQty(newItem) && x.product===newItem.product && x.pubgId===newItem.pubgId && String(x.pubgName||'').trim()===pubgName);
      if(existingIndex >= 0){
        cart[existingIndex].qty = itemQty(cart[existingIndex]) + 1;
      } else {
        cart.push(newItem);
      }
      saveCart();renderCart();localStorage.setItem('moba_last_pubg',JSON.stringify({pubgId,pubgName}));
      const activeItem = existingIndex>=0 ? cart[existingIndex] : newItem;
      const qtyText = canUseQty(activeItem) ? `<br>🔢 الكمية الآن: ${itemQty(activeItem)}<br>🎮 إجمالي الشدات لهذا ID: ${itemUcTotal(activeItem).toLocaleString('ar-EG')} UC` : '';
      modalText.innerHTML=`🎮 ${escapeText(p.name)}<br>🆔 ${escapeText(pubgId)}<br>👤 ${escapeText(pubgName)}${qtyText}<br>💰 ${money(p.price)}<br><br>تحب تضيف حاجة تاني ولا نكمل الشراء؟`;
      modal.classList.add('show');
      document.getElementById(`id_${i}`).value='';
      document.getElementById(`name_${i}`).value='';
    }
    function removeItem(i){cart.splice(i,1);saveCart();renderCart();} function showStatus(msg,type){statusEl.textContent=msg;statusEl.className=`status ${type}`;} function hideStatus(){statusEl.className='status';statusEl.textContent='';}
    document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{activeCat=btn.dataset.cat;document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderProducts();hideStatus();})); document.getElementById('paymentMethod').addEventListener('change',renderPaymentDetails);
    document.querySelectorAll('input[name="transferMode"]').forEach(r=>r.addEventListener('change',()=>{
      const other=document.querySelector('input[name="transferMode"]:checked')?.value==='other';
      document.getElementById('last3Box').classList.toggle('hide',!other);
      document.getElementById('transferLast3').required=other;
    }));
    document.getElementById('addMore').onclick=()=>modal.classList.remove('show'); document.getElementById('showCartBtn').onclick=()=>{modal.classList.remove('show');document.getElementById('cartPanel').scrollIntoView({behavior:'smooth'});}; document.getElementById('goCheckout').onclick=document.getElementById('showCartBtn').onclick; document.getElementById('clearCart').onclick=()=>{cart=[];saveCart();renderCart();hideStatus();}; stickyCart.onclick=()=>document.getElementById('cartPanel').scrollIntoView({behavior:'smooth'});
    document.getElementById('orderForm').addEventListener('submit',async e=>{e.preventDefault();hideStatus(); if(!cart.length){showStatus('سلة الطلبات فاضية','err');return;} const form=e.currentTarget,fd=new FormData(form);
      const transferMode=fd.get('transferMode');
      if(!transferMode){showStatus('حدد هل التحويل من نفس رقم المتابعة ولا من رقم/محل تاني','err');return;}
      if(transferMode==='other' && !/^\d{3}$/.test(String(fd.get('transferLast3')||''))){showStatus('لازم تكتب آخر 3 أرقام من رقم التحويل','err');return;}fd.append('cart',JSON.stringify(cart)); const btn=form.querySelector('button[type="submit"]'); btn.disabled=true;btn.textContent='⏳ جاري ارسال الطلب...'; try{const res=await fetch('/api/order',{method:'POST',body:fd});const data=await res.json();if(!data.ok) throw new Error(data.error||'حصل خطأ'); const trackingNote=data.statusTracking?'تقدر تتابع الحالة من تحت برقم الموبايل.':'متابعة الحالة محتاجة تفعيل Supabase.'; showStatus(`✅ تم استلام طلبك بنجاح.\nرقم الطلب: ${data.orderCode || data.orderId || 'MOBA'}\nالإجمالي: ${data.total ? Number(data.total).toLocaleString('ar-EG')+' جنيه' : 'تم التسجيل'}\n${trackingNote}`,'ok'); document.getElementById('trackPhone').value=fd.get('customerPhone')||''; if(data.statusTracking) loadOrderStatus(fd.get('customerPhone')); cart=[];saveCart();renderCart();form.reset();renderPaymentDetails();}catch(err){showStatus(err.message||'حصل خطأ اثناء ارسال الطلب','err');}finally{btn.disabled=false;btn.textContent='✅ تنفيذ الشراء | Checkout';}});
    function statusIcon(s){return s==='delivered'?'✅':(s==='rejected'||s==='cancelled')?'❌':s==='needs_fix'?'⚠️':s==='on_hold'?'⏸':s==='processing'?'🔄':s==='claimed'?'🙋':'⏳';}
    function renderFixBox(order){
      if(order.status!=='needs_fix') return '';
      if(Number(order.fix_attempts||0)>=1) return `<div class="fix-box"><div class="fix-title">⚠️ تم استخدام فرصة التعديل</div><div>لو لسه في مشكلة تواصل مع الدعم مباشرة.</div><a class="support-link" target="_blank" href="${escapeText(window.__supportUrl||'https://t.me/MOFR3OON')}">📞 التواصل مع الدعم</a></div>`;
      const t=order.fix_type||'';
      let body='';
      if(t==='badshot') body=`<input type="file" class="file" id="fixScreenshot" accept="image/*" required />`;
      else if(t==='badid') body=`<textarea class="textarea" id="fixNewIdData" placeholder="اكتب ID واسم الحساب الصحيح لكل باقة" required></textarea>`;
      else if(t==='badphone') body=`<input class="input" id="fixNewPhone" inputmode="numeric" placeholder="اكتب رقم المتابعة الصحيح" required />`;
      else body=`<textarea class="textarea" id="fixNote" placeholder="اكتب التعديل المطلوب" required></textarea>`;
      return `<div class="fix-box"><div class="fix-title">🔧 ابعت تعديل مرة واحدة</div><div class="notice">مسموح بتعديل واحد فقط. بعده لو المشكلة لسه موجودة الطلب ممكن يترفض ويظهرلك زر الدعم.</div><form id="fixForm">${body}<button class="btn checkout" type="submit">✅ إرسال التعديل</button></form></div>`;
    }
    function renderTrack(order,recent=[]){const box=document.getElementById('trackResult'),items=Array.isArray(order.items)?order.items:[],history=Array.isArray(order.status_history)?order.status_history:[];window.__currentOrder=order;box.className='track-result show';const support=(order.status==='rejected'||order.status==='cancelled')?`<a class="support-link" target="_blank" href="${escapeText(window.__supportUrl||'https://t.me/MOFR3OON')}">📞 التواصل مع الدعم</a>`:'';box.innerHTML=`<span class="latest-label">آخر طلب على الرقم ده</span><br><b>${statusIcon(order.status)} حالة الطلب: ${escapeText(order.status_label||order.status)}</b><br>${order.handler?`👨‍💻 المسؤول: ${escapeText(order.handler)}<br>`:''}💰 الإجمالي: ${money(order.total)}<div class="mini-list">${items.map((x,i)=>`<div>${i+1}) ${escapeText(x.product)}<br>🆔 ${escapeText(x.pubgId)}<br>👤 ${escapeText(x.pubgName||'-')}<br>🔢 الكمية: ${itemQty(x)}<br>🎮 الشدات: ${itemUcTotal(x).toLocaleString('ar-EG')} UC<br>💰 ${money(itemLineTotal(x))}</div>`).join('')}</div>${history.length?`<div class="timeline"><b>آخر التحديثات:</b>${history.slice(-4).map(h=>`<div>${escapeText(h.label||h.status)} ${h.by?' - '+escapeText(h.by):''}</div>`).join('')}</div>`:''}${renderFixBox(order)}${support}${recent&&recent.length?`<div class="timeline"><b>طلبات سابقة على نفس الرقم:</b>${recent.map(r=>`<div>${escapeText(r.status_label)} - ${money(r.total)}</div>`).join('')}</div>`:''}`;
      const fixForm=document.getElementById('fixForm'); if(fixForm) fixForm.addEventListener('submit',submitFix);
    }
    async function submitFix(e){
      e.preventDefault(); const order=window.__currentOrder; if(!order) return; const fd=new FormData(); fd.append('phone',order.phone); fd.append('fixType',order.fix_type||'');
      if(order.fix_type==='badshot'){const f=document.getElementById('fixScreenshot')?.files?.[0]; if(!f){alert('ارفع سكرين واضح');return;} fd.append('screenshot',f);}
      else if(order.fix_type==='badid') fd.append('newIdData',document.getElementById('fixNewIdData').value.trim());
      else if(order.fix_type==='badphone') fd.append('newPhone',document.getElementById('fixNewPhone').value.trim());
      else fd.append('fixNote',document.getElementById('fixNote').value.trim());
      const btn=e.target.querySelector('button'); btn.disabled=true; btn.textContent='⏳ جاري إرسال التعديل...';
      try{const res=await fetch('/api/fix',{method:'POST',body:fd}); const data=await res.json(); if(!data.ok) throw new Error(data.error||'حصل خطأ'); alert('✅ تم إرسال التعديل'); loadOrderStatus(order.phone);}
      catch(err){alert(err.message||'حصل خطأ');} finally{btn.disabled=false; btn.textContent='✅ إرسال التعديل';}
    }
    async function loadOrderStatus(phone){const box=document.getElementById('trackResult');box.className='track-result show';box.textContent='⏳ جاري جلب حالة الطلب...';try{const res=await fetch(`/api/status?phone=${encodeURIComponent(phone)}`);const data=await res.json();if(!data.ok) throw new Error(data.error||'مش قادر اجيب حالة الطلب');window.__supportUrl=data.supportUrl||'https://t.me/MOFR3OON';renderTrack(data.order,data.recent||[]);}catch(err){box.className='track-result show';box.innerHTML=`⚠️ ${escapeText(err.message||'حصل خطأ')}`;}}
    document.getElementById('trackForm').addEventListener('submit',e=>{e.preventDefault();loadOrderStatus(document.getElementById('trackPhone').value.trim());}); renderProducts();renderCart();renderPaymentDetails();


/* moba-v7-overrides */
(function(){
  const qState = {};
  const originalRenderProducts = window.renderProducts;
  const originalRenderCart = window.renderCart;

  function extractUc(productName){
    const m = String(productName||'').match(/(\d+)\s*UC/i);
    return m ? Number(m[1]) : 0;
  }
  function canUseQty(item){
    const p = String(item && item.product || item && item.name || '');
    return !/ازدهار|Growth|كريستالة|Crystal|Prime/i.test(p);
  }
  function itemQty(item){ return Math.max(1, Number((item && item.qty) || 1)); }
  function itemLineTotal(item){ return Number((item && item.price) || 0) * itemQty(item); }
  function itemUcTotal(item){ return extractUc(item && item.product) * itemQty(item); }
  function productKey(cat,i){ return `${cat}_${i}`; }
  function getProductQty(i){ return Math.max(1, Number(qState[productKey(window.activeCat || activeCat, i)] || 1)); }
  function setProductQty(i, qty){
    const cat = window.activeCat || activeCat;
    const p = products[cat][i];
    if(!canUseQty({product:p.name})) qty = 1;
    qState[productKey(cat,i)] = Math.max(1, Number(qty||1));
    window.renderProducts();
  }

  window.changeProductQty = function(i,delta){ setProductQty(i, getProductQty(i)+delta); };
  window.changeQty = function(i,delta){
    const item = cart[i];
    if(!item || !canUseQty(item)) return;
    item.qty = Math.max(1, itemQty(item) + delta);
    saveCart(); window.renderCart();
  };

  window.renderProducts = function(){
    const cat = window.activeCat || activeCat;
    productList.innerHTML = products[cat].map((p,i)=>{
      const q = getProductQty(i);
      const qtyAllowed = canUseQty({product:p.name});
      const ucTotal = extractUc(p.name) * q;
      return `<div class="product">${p.hot?'<span class="hot">🔥 الاكثر طلبا</span>':''}<b>${escapeText(p.name)}</b>${p.type?`<div class="type">${escapeText(p.type)}</div>`:''}<div class="price">💰 ${money(p.price)}</div>${p.warning?`<div class="warn">⚠️ ${escapeText(p.warning)}</div>`:''}<input class="id-input" id="id_${i}" inputmode="numeric" placeholder="PUBG ID" /><input class="id-input" id="name_${i}" placeholder="اسم الحساب داخل اللعبة" />${qtyAllowed ? `<div class="product-qty"><span class="product-qty-label">الكمية</span><div class="qty-box"><button class="qty-btn" onclick="changeProductQty(${i},-1)" type="button">−</button><span class="qty-num">${q}</span><button class="qty-btn" onclick="changeProductQty(${i},1)" type="button">+</button></div></div><div class="product-uc-preview">🎮 إجمالي الشدات: <b>${ucTotal.toLocaleString('ar-EG')} UC</b></div>` : `<div class="product-uc-preview">⚠️ كمية واحدة فقط للمنتج ده</div>`}<button class="btn add" onclick="addToCart(${i})">➕ إضافة للسلة</button></div>`;
    }).join('');
  };

  window.renderCart = function(){
    window.cart = cart;
    if(!cart.length){
      cartBox.innerHTML = '<div class="cart-empty">السلة فاضية<br>اختار منتج واكتب ID واضغط إضافة للسلة</div>';
    } else {
      cartBox.innerHTML = cart.map((item,i)=>`
        <div class="cart-item">
          <button class="remove" onclick="removeItem(${i})">حذف</button>
          <b>${i+1}) ${escapeText(item.product)}</b><br>
          🆔 ID: ${escapeText(item.pubgId)}<br>
          👤 Name: ${escapeText(item.pubgName||'-')}<br>
          ${canUseQty(item) ? `
            <div class="qty-row">
              <span>الكمية</span>
              <div class="qty-box">
                <button class="qty-btn" onclick="changeQty(${i},-1)" type="button">−</button>
                <span class="qty-num">${itemQty(item)}</span>
                <button class="qty-btn" onclick="changeQty(${i},1)" type="button">+</button>
              </div>
            </div>
            <div class="uc-total">🎮 إجمالي الشدات لهذا ID: <b>${itemUcTotal(item).toLocaleString('ar-EG')} UC</b></div>
          ` : `<div class="uc-total">⚠️ المنتج ده كمية 1 فقط عشان شروطه داخل اللعبة</div>`}
          💰 ${money(item.price)} × ${itemQty(item)} = <b>${money(itemLineTotal(item))}</b>
        </div>`).join('');
    }
    const total = cart.reduce((s,x)=>s+itemLineTotal(x),0);
    totalEl.textContent = money(total);
    if(typeof updateStickyCart === 'function') updateStickyCart();
  };

  window.addToCart = function(i){
    const cat = window.activeCat || activeCat;
    const p = products[cat][i];
    const pubgId = document.getElementById(`id_${i}`).value.trim();
    const pubgName = document.getElementById(`name_${i}`).value.trim();
    if(!/^\d{5,15}$/.test(pubgId)){ showStatus('اكتب PUBG ID صحيح ارقام فقط','err'); return; }
    if(pubgName.length < 2){ showStatus('اكتب اسم حسابك داخل اللعبة عشان نراجع الطلب صح','err'); return; }
    const newItem = {product:p.name, price:p.price, pubgId, pubgName, qty:getProductQty(i)};
    const existingIndex = cart.findIndex(x => canUseQty(newItem) && x.product===newItem.product && x.pubgId===newItem.pubgId && String(x.pubgName||'').trim()===pubgName);
    if(existingIndex >= 0){
      cart[existingIndex].qty = itemQty(cart[existingIndex]) + itemQty(newItem);
    }else{
      cart.push(newItem);
    }
    saveCart(); window.renderCart();
    localStorage.setItem('moba_last_pubg', JSON.stringify({pubgId,pubgName}));
    const activeItem = existingIndex >= 0 ? cart[existingIndex] : newItem;
    const qtyText = canUseQty(activeItem) ? `<br>🔢 الكمية الآن: ${itemQty(activeItem)}<br>🎮 إجمالي الشدات لهذا ID: ${itemUcTotal(activeItem).toLocaleString('ar-EG')} UC` : '';
    modalText.innerHTML = `🎮 ${escapeText(p.name)}<br>🆔 ${escapeText(pubgId)}<br>👤 ${escapeText(pubgName)}${qtyText}<br>💰 ${money(p.price)}<br><br>تحب تضيف حاجة تاني ولا نكمل الشراء؟`;
    modal.classList.add('show');
    document.getElementById(`id_${i}`).value='';
    document.getElementById(`name_${i}`).value='';
    setProductQty(i,1);
  };

  // Make top links and sticky cart reliably navigate
  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href^="#"]');
    if(a){
      const el = document.querySelector(a.getAttribute('href'));
      if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
    }
  });

  window.renderProducts();
  window.renderCart();
})();


/* moba-v8-click-fixes */
(function(){
  function goToCart(){
    const el = document.getElementById('cartSection') || document.querySelector('.cart');
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }
  function goToProducts(){
    const el = document.getElementById('productsSection') || document.querySelector('.products');
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }
  function goToStatus(){
    const el = document.getElementById('trackOrder');
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }

  document.addEventListener('click', function(e){
    const target = e.target.closest('.sticky-cart, .mobile-cart, .floating-cart, [data-go-cart]');
    if(target){
      e.preventDefault();
      e.stopPropagation();
      goToCart();
      return;
    }

    const link = e.target.closest('a[href="#cartSection"], a[href="#productsSection"], a[href="#trackOrder"]');
    if(link){
      const href = link.getAttribute('href');
      e.preventDefault();
      if(href === '#cartSection') goToCart();
      if(href === '#productsSection') goToProducts();
      if(href === '#trackOrder') goToStatus();
    }
  }, true);

  // لو السلة العائمة معمولة div ومفيهاش كلاس واضح، نمسكها من النص
  setTimeout(function(){
    document.querySelectorAll('div,button,a').forEach(function(el){
      const txt = (el.textContent || '').trim();
      if(txt.includes('السلة') && txt.includes('جنيه') && !el.dataset.goCartBound){
        el.dataset.goCartBound = '1';
        el.style.cursor = 'pointer';
        el.addEventListener('click', function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          goToCart();
        }, true);
      }
    });
  }, 500);
})();


/* moba-v10-cart-click */
(function(){
  function goToCart(){
    const el = document.getElementById('cartSection') || document.querySelector('.cart');
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }
  document.addEventListener('click', function(e){
    const target = e.target.closest('.sticky-cart, .mobile-cart, .floating-cart, [data-go-cart]');
    if(target){
      e.preventDefault();
      e.stopPropagation();
      goToCart();
    }
  }, true);
})();


/* moba-v11-ux-fixes */
(function(){
  function scrollToCheckout(){
    var modal = document.getElementById('modal');
    if(modal) modal.classList.remove('show');

    var cart = document.getElementById('cartSection') || document.querySelector('.cart');
    if(cart){
      cart.scrollIntoView({behavior:'smooth', block:'start'});
      cart.classList.add('cart-focus-pulse');
      setTimeout(function(){ cart.classList.remove('cart-focus-pulse'); }, 1300);
    }

    setTimeout(function(){
      var payment = document.querySelector('[name="paymentMethod"]');
      var checkout = document.querySelector('.checkout, button[type="submit"]');
      if(payment && !payment.value){ try{ payment.focus({preventScroll:true}); }catch(e){} }
      else if(checkout){ try{ checkout.focus({preventScroll:true}); }catch(e){} }
    }, 650);
  }

  document.addEventListener('click', function(e){
    var btn = e.target.closest('#goCheckout, .modal-actions .okbtn');
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      scrollToCheckout();
    }
  }, true);

  // لو الزر القديم متسجل عليه onclick قديم، نغلبه بعد تحميل الصفحة
  setTimeout(function(){
    var btn = document.getElementById('goCheckout');
    if(btn){
      btn.onclick = function(ev){
        if(ev){ ev.preventDefault(); ev.stopPropagation(); }
        scrollToCheckout();
      };
    }
  }, 300);
})();


/* moba-v12-order-history */
(function(){
  window.allHistoryOrders = [];
  let currentHistoryFilter = 'all';

  function normalizeStatus(status){
    if(['delivered','archived'].includes(status)) return 'done';
    if(['rejected','cancelled'].includes(status)) return 'cancelled';
    return 'open';
  }
  function statusLabelAr(status){
    return ({
      pending:'تم استلام الطلب',
      claimed:'تم استلام الطلب',
      processing:'قيد التنفيذ',
      delivered:'مكتمل',
      archived:'مكتمل',
      on_hold:'معلق',
      needs_fix:'محتاج تعديل',
      rejected:'ملغي',
      cancelled:'ملغي'
    })[status] || status || 'غير محدد';
  }
  function statusIcon(status){
    const n = normalizeStatus(status);
    if(n==='done') return '✅';
    if(n==='cancelled') return '❌';
    return '⏳';
  }
  function moneyLocal(n){
    try{ return `${Number(n||0).toLocaleString('ar-EG')} جنيه`; }catch(e){ return `${n||0} جنيه`; }
  }
  function formatDate(v){
    if(!v) return '';
    try{
      return new Date(v).toLocaleString('ar-EG',{year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'});
    }catch(e){ return v; }
  }
  function firstProduct(order){
    const items = Array.isArray(order.items) ? order.items : [];
    return items[0] || {};
  }
  function renderHistoryList(){
    const tabs = document.getElementById('historyTabs');
    const list = document.getElementById('historyList');
    const result = document.getElementById('trackResult');
    if(!list) return;

    if(tabs) tabs.style.display = window.allHistoryOrders.length ? 'flex' : 'none';
    if(result){ result.className='track-result'; result.innerHTML=''; }

    let shown = window.allHistoryOrders.filter(o => currentHistoryFilter==='all' || normalizeStatus(o.status)===currentHistoryFilter);
    if(!window.allHistoryOrders.length){
      list.innerHTML = '<div class="history-empty">لا يوجد طلبات على الرقم ده.</div>';
      return;
    }
    if(!shown.length){
      list.innerHTML = '<div class="history-empty">لا يوجد طلبات في القسم ده.</div>';
      return;
    }
    list.innerHTML = shown.map((order,idx)=>{
      const p = firstProduct(order);
      const items = Array.isArray(order.items) ? order.items : [];
      const title = p.product || 'طلب MOBA SHOP';
      const qty = items.reduce((s,x)=>s+(Number(x.qty||1)),0);
      return `<div class="history-card" onclick="openOrderDetailsByIndex('${order.id}')">
        <div>
          <div class="history-card-title">PUBG MOBILE 🎮</div>
          <div class="history-card-meta">${escapeText(title)} ${items.length>1 ? `+ ${items.length-1} منتجات` : ''}</div>
          <div class="history-card-meta">${formatDate(order.created_at)}</div>
          <div class="history-card-status">${statusIcon(order.status)} ${statusLabelAr(order.status)} ${qty?` | الكمية: ${qty}`:''}</div>
        </div>
        <div>
          <div class="history-product-icon">🎮</div>
          <div class="history-card-price">${moneyLocal(order.total)}</div>
        </div>
      </div>`;
    }).join('');
  }
  window.openOrderDetailsByIndex = function(orderId){
    const order = window.allHistoryOrders.find(o => String(o.id) === String(orderId));
    if(!order) return;
    const items = Array.isArray(order.items) ? order.items : [];
    const products = items.map((x,i)=>`
      <div class="order-detail-product">
        <b>${i+1}) ${escapeText(x.product||'منتج')}</b><br>
        ID: <code>${escapeText(x.pubgId||'-')}</code><br>
        Name: ${escapeText(x.pubgName||'-')}<br>
        الكمية: ${Number(x.qty||1)}<br>
        إجمالي الشدات: ${typeof itemUcTotal === 'function' ? itemUcTotal(x).toLocaleString('ar-EG') : '-'} UC<br>
        السعر: ${moneyLocal((Number(x.price||0) * Number(x.qty||1)))}
      </div>
    `).join('');
    const content = document.getElementById('orderDetailsContent');
    content.innerHTML = `
      <div class="order-detail-row"><div class="order-detail-label">الوقت :</div><div class="order-detail-value">${formatDate(order.created_at)}</div></div>
      <div class="order-detail-row"><div class="order-detail-label">الدفع :</div><div class="order-detail-value">${escapeText(order.payment_method||'-')}</div></div>
      <div class="order-detail-row"><div class="order-detail-label">الحالة :</div><div class="order-detail-value">${statusIcon(order.status)} ${statusLabelAr(order.status)}</div></div>
      <div class="order-detail-sep"></div>
      <div class="order-detail-row"><div class="order-detail-label">المنتجات :</div><div class="order-detail-value order-detail-products">${products || 'لا يوجد'}</div></div>
      <div class="order-detail-sep"></div>
      <div class="order-detail-row"><div class="order-detail-label">الإجمالي :</div><div class="order-detail-value">${moneyLocal(order.total)}</div></div>
      <div class="order-detail-row"><div class="order-detail-label">الملاحظة :</div><div class="order-detail-value">${escapeText(order.note||'لا يوجد')}</div></div>
      ${['needs_fix','rejected','cancelled'].includes(order.status) ? `<a class="order-support-link" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">📞 تواصل مع الدعم</a>` : ''}
    `;
    document.getElementById('orderDetailsModal').classList.add('show');
  };
  window.closeOrderDetails = function(){
    const modal = document.getElementById('orderDetailsModal');
    if(modal) modal.classList.remove('show');
  };

  window.loadOrderStatus = async function(phone){
    const list = document.getElementById('historyList');
    const result = document.getElementById('trackResult');
    if(list) list.innerHTML = '';
    if(result){ result.className='track-result show'; result.textContent='⏳ جاري جلب سجل الطلبات...'; }
    try{
      const res = await fetch(`/api/status?phone=${encodeURIComponent(phone)}&history=1`);
      const data = await res.json();
      if(!data.ok) throw new Error(data.error || 'مش قادر اجيب سجل الطلبات');
      window.allHistoryOrders = Array.isArray(data.orders) ? data.orders : (data.order ? [data.order] : []);
      currentHistoryFilter = 'all';
      document.querySelectorAll('.history-tab').forEach(b=>b.classList.toggle('active', b.dataset.filter==='all'));
      renderHistoryList();
    }catch(err){
      if(result){ result.className='track-result show'; result.innerHTML = `⚠️ ${escapeText(err.message || 'حصل خطأ')}`; }
    }
  };

  document.addEventListener('click', function(e){
    const tab = e.target.closest('.history-tab');
    if(tab){
      currentHistoryFilter = tab.dataset.filter || 'all';
      document.querySelectorAll('.history-tab').forEach(b=>b.classList.remove('active'));
      tab.classList.add('active');
      renderHistoryList();
    }
  });

  const form = document.getElementById('trackForm');
  if(form && !form.dataset.historyBound){
    form.dataset.historyBound='1';
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const phone = document.getElementById('trackPhone').value.trim();
      window.loadOrderStatus(phone);
    }, true);
  }
})();


/* moba-v14-fix-flow */
(function(){
  function escapeTextLocal(text){
    if(typeof escapeText === 'function') return escapeText(text);
    return String(text ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function problemText(type){
    return ({
      bad_screen:'السكرين غير واضح',
      bad_id:'الـ ID أو اسم الحساب محتاج تعديل',
      bad_phone:'رقم المتابعة أو بيانات التحويل محتاجة تعديل'
    })[type] || 'الطلب محتاج تعديل';
  }
  function fixInputHtml(order){
    const type = order.fix_type || 'general';
    if(type === 'bad_screen'){
      return `<input class="file" name="fixFile" type="file" accept="image/*" required>
              <div class="fix-small">ارفع سكرين تحويل واضح ومقروء.</div>`;
    }
    if(type === 'bad_phone'){
      return `<input class="input" name="fixValue" inputmode="numeric" placeholder="اكتب رقم الموبايل الصحيح أو آخر 3 أرقام من رقم التحويل" required>
              <div class="fix-small">اكتب الرقم الصحيح أو آخر 3 أرقام لو التحويل من محل أو رقم تاني.</div>`;
    }
    if(type === 'bad_id'){
      return `<textarea class="textarea" name="fixValue" placeholder="اكتب ID الصحيح واسم الحساب الصحيح" required></textarea>
              <div class="fix-small">مثال: ID: 123456789 - Name: MOBA</div>`;
    }
    return `<textarea class="textarea" name="fixValue" placeholder="اكتب التعديل المطلوب" required></textarea>`;
  }
  function fixSection(order){
    if(order.status !== 'needs_fix') return '';
    const count = Number(order.fix_count || 0);
    if(count >= 2){
      return `<div class="fix-alert">⚠️ تم استخدام فرص التعديل المتاحة. برجاء التواصل مع الدعم عشان نحل المشكلة.</div>
              <a class="fix-support" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">📞 تواصل مع الدعم</a>`;
    }
    const left = 2 - count;
    return `<div class="fix-alert">
        ⚠️ يوجد مشكلة في آخر طلب: <b>${problemText(order.fix_type)}</b><br>
        عندك ${left} فرصة تعديل قبل تحويل الطلب للدعم.
      </div>
      <form class="fix-form" onsubmit="submitOrderFix(event,'${escapeTextLocal(order.id)}')">
        <div class="fix-form-title">✏️ إرسال تعديل الطلب</div>
        ${fixInputHtml(order)}
        <input type="hidden" name="phone" value="${escapeTextLocal(order.phone || '')}">
        <button class="fix-submit" type="submit">✅ إرسال التعديل للمراجعة</button>
        <div class="fix-small">بعد الإرسال هيرجع الطلب للمراجعة وهيظهر لمسؤول الطلب.</div>
      </form>`;
  }

  window.submitOrderFix = async function(e, orderId){
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';
    try{
      const fd = new FormData(form);
      fd.append('orderId', orderId);
      const res = await fetch('/api/fix-order',{method:'POST',body:fd});
      const data = await res.json();
      if(!data.ok) throw new Error(data.error || 'حصل خطأ');
      form.innerHTML = '<div class="fix-alert">✅ تم إرسال التعديل للمراجعة. تابع حالة الطلب من سجل الطلبات.</div>';
      const phone = fd.get('phone');
      if(phone && window.loadOrderStatus) setTimeout(()=>window.loadOrderStatus(phone), 700);
    }catch(err){
      btn.disabled = false;
      btn.textContent = oldText;
      alert(err.message || 'حصل خطأ أثناء إرسال التعديل');
    }
  };

  // Override details renderer by wrapping old openOrderDetailsByIndex
  const oldOpen = window.openOrderDetailsByIndex;
  window.openOrderDetailsByIndex = function(orderId){
    if(typeof oldOpen === 'function') oldOpen(orderId);
    setTimeout(function(){
      try{
        const order = (window.allHistoryOrders || window.allHistoryOrders || []).find(o => String(o.id) === String(orderId));
        if(!order) return;
        const content = document.getElementById('orderDetailsContent');
        if(content && !content.querySelector('.fix-form') && !content.querySelector('.fix-alert')){
          content.insertAdjacentHTML('beforeend', fixSection(order));
        }
      }catch(e){}
    }, 50);
  };

  // Wrap loadOrderStatus to show issue alert after phone search
  const oldLoad = window.loadOrderStatus;
  window.loadOrderStatus = async function(phone){
    if(typeof oldLoad === 'function') await oldLoad(phone);
    setTimeout(function(){
      try{
        const alertBox = document.getElementById('lastIssueAlert');
        const orders = window.allHistoryOrders || window.allHistoryOrders || [];
        if(!alertBox || !orders.length) return;
        const latestIssue = orders.find(o => o.status === 'needs_fix');
        if(latestIssue){
          const count = Number(latestIssue.fix_count || 0);
          if(count < 2){
            alertBox.className = 'last-issue-alert show';
            alertBox.innerHTML = `⚠️ يوجد مشكلة في آخر طلب: <b>${problemText(latestIssue.fix_type)}</b><br>افتح الطلب من سجل الطلبات واضغط إرسال تعديل. المتبقي: ${2-count} فرصة.`;
          }else{
            alertBox.className = 'last-issue-alert show';
            alertBox.innerHTML = `⚠️ يوجد طلب محتاج دعم مباشر بعد انتهاء فرص التعديل. <a class="order-support-link" href="https://t.me/MOFR3OON" target="_blank">تواصل مع الدعم</a>`;
          }
        }else{
          alertBox.className = 'last-issue-alert';
          alertBox.innerHTML = '';
        }
      }catch(e){}
    }, 300);
  };
})();


/* moba-v15-premium-ui */
(function(){
  function safeNum(n){ return Number(n||0) || 0; }
  function ucFromName(name){
    const m = String(name||'').match(/(\d+)\s*UC/i);
    return m ? Number(m[1]) : 0;
  }
  function qty(item){ return Math.max(1, Number(item && item.qty || 1)); }
  function totalUc(items){
    return (Array.isArray(items)?items:[]).reduce((s,x)=>s+(ucFromName(x.product)*qty(x)),0);
  }
  function english(n){
    try{return Number(n||0).toLocaleString('en-US');}catch(e){return n||0;}
  }
  function statusKind(status){
    if(['delivered','archived'].includes(status)) return 'done';
    if(['rejected','cancelled'].includes(status)) return 'cancelled';
    if(status === 'needs_fix') return 'fix';
    return 'open';
  }
  function addCartSummary(){
    const box = document.getElementById('cartBox');
    if(!box || !window.cart) return;
    const old = document.getElementById('cartPremiumSummary');
    if(old) old.remove();
    if(!window.cart.length) return;
    const items = window.cart || [];
    const count = items.reduce((s,x)=>s+qty(x),0);
    const uc = totalUc(items);
    const total = items.reduce((s,x)=>s+(safeNum(x.price)*qty(x)),0);
    const div = document.createElement('div');
    div.id = 'cartPremiumSummary';
    div.className = 'cart-summary-premium';
    div.innerHTML = `<div><b>${english(count)}</b>منتجات</div><div><b>${english(uc)}</b>UC</div><div><b>${english(total)}</b>جنيه</div>`;
    box.prepend(div);
  }
  const oldRenderCart = window.renderCart;
  if(typeof oldRenderCart === 'function'){
    window.renderCart = function(){
      oldRenderCart.apply(this, arguments);
      setTimeout(addCartSummary, 0);
    };
    setTimeout(addCartSummary, 300);
  }

  function addHistorySummary(){
    const tabs = document.getElementById('historyTabs');
    if(!tabs || !window.allHistoryOrders) return;
    let sum = document.getElementById('historySummary');
    if(!sum){
      sum = document.createElement('div');
      sum.id = 'historySummary';
      sum.className = 'history-summary';
      tabs.insertAdjacentElement('afterend', sum);
    }
    const rows = window.allHistoryOrders || [];
    const done = rows.filter(o=>statusKind(o.status)==='done').length;
    const open = rows.filter(o=>statusKind(o.status)==='open' || statusKind(o.status)==='fix').length;
    const cancel = rows.filter(o=>statusKind(o.status)==='cancelled').length;
    sum.innerHTML = `<div><b>${english(rows.length)}</b>الجميع</div><div><b>${english(open)}</b>معلق</div><div><b>${english(done)}</b>مكتمل</div><div><b>${english(cancel)}</b>ملغي</div>`;
  }

  const oldLoadStatus = window.loadOrderStatus;
  if(typeof oldLoadStatus === 'function'){
    window.loadOrderStatus = async function(phone){
      const r = await oldLoadStatus.apply(this, arguments);
      setTimeout(addHistorySummary, 350);
      setTimeout(styleHistoryCards, 450);
      return r;
    };
  }

  function styleHistoryCards(){
    const cards = document.querySelectorAll('.history-card');
    const orders = window.allHistoryOrders || [];
    cards.forEach((card,idx)=>{
      const text = card.textContent || '';
      let order = orders[idx];
      if(!order){
        order = orders.find(o => text.includes(o.id) || (o.order_code && text.includes(o.order_code)));
      }
      if(order){
        const kind = statusKind(order.status);
        card.classList.add(`status-${kind}`);
        const statusLine = card.querySelector('.history-card-status');
        if(statusLine && !statusLine.classList.contains('history-status-pill')){
          statusLine.classList.add('history-status-pill');
        }
      }
    });
  }
  document.addEventListener('click', e=>{
    if(e.target.closest('.history-tab')) setTimeout(styleHistoryCards, 60);
  });

  function buildTimelineFromOrder(order){
    const history = Array.isArray(order && order.status_history) ? order.status_history : [];
    if(!history.length){
      return `<div class="order-timeline"><div class="timeline-item"><div class="timeline-dot">📌</div><div class="timeline-text"><b>تم استلام الطلب</b><span>تابع الحالة من هنا</span></div></div></div>`;
    }
    return `<div class="order-timeline">` + history.slice(-5).map(h=>{
      let icon = '📌';
      if(String(h.status).includes('delivered')) icon='✅';
      else if(String(h.status).includes('processing')) icon='🔄';
      else if(String(h.status).includes('needs_fix')) icon='⚠️';
      else if(String(h.status).includes('rejected')) icon='❌';
      const time = h.at ? new Date(h.at).toLocaleString('en-GB',{hour:'numeric',minute:'2-digit',day:'numeric',month:'numeric'}) : '';
      return `<div class="timeline-item"><div class="timeline-dot">${icon}</div><div class="timeline-text"><b>${h.label || h.status || 'تحديث'}</b><span>${time}</span></div></div>`;
    }).join('') + `</div>`;
  }

  const oldOpenDetails = window.openOrderDetailsByIndex;
  if(typeof oldOpenDetails === 'function'){
    window.openOrderDetailsByIndex = function(orderId){
      oldOpenDetails.apply(this, arguments);
      setTimeout(()=>{
        const order = (window.allHistoryOrders || []).find(o=>String(o.id)===String(orderId));
        const content = document.getElementById('orderDetailsContent');
        if(order && content && !content.querySelector('.order-timeline')){
          content.insertAdjacentHTML('afterbegin', buildTimelineFromOrder(order));
        }
      },80);
    };
  }
})();


/* moba-v16-history-fix-forms */
(function(){
  function esc(text){
    if(typeof escapeText === 'function') return escapeText(text);
    return String(text ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function statusKindV16(status){
    if(['delivered','archived'].includes(status)) return 'done';
    if(['rejected','cancelled'].includes(status)) return 'cancelled';
    if(status === 'needs_fix') return 'open';
    return 'open';
  }
  function getOrders(){ return window.allHistoryOrders || []; }
  function countBy(filter){
    const rows = getOrders();
    if(filter === 'all') return rows.length;
    return rows.filter(o => statusKindV16(o.status) === filter).length;
  }
  function renderSummaryOnly(){
    const tabs = document.getElementById('historyTabs');
    if(tabs) tabs.style.display = 'none';
    let sum = document.getElementById('historySummary');
    const target = tabs || document.getElementById('historyList');
    if(!sum && target){
      sum = document.createElement('div');
      sum.id = 'historySummary';
      sum.className = 'history-summary';
      if(tabs) tabs.insertAdjacentElement('afterend', sum);
      else target.insertAdjacentElement('beforebegin', sum);
    }
    if(!sum) return;
    const current = window.currentHistoryFilterV16 || 'all';
    const items = [
      ['all','الجميع',countBy('all')],
      ['open','معلق',countBy('open')],
      ['done','مكتمل',countBy('done')],
      ['cancelled','ملغي',countBy('cancelled')]
    ];
    sum.innerHTML = items.map(([key,label,num])=>`
      <div data-history-filter="${key}" class="${current===key?'active':''}">
        <b>${num}</b>
        <span>${label}</span>
      </div>
    `).join('');
  }
  function applyFilter(filter){
    window.currentHistoryFilterV16 = filter || 'all';
    if(typeof currentHistoryFilter !== 'undefined') currentHistoryFilter = window.currentHistoryFilterV16;
    if(typeof renderHistoryList === 'function') renderHistoryList();
    setTimeout(renderSummaryOnly,60);
  }
  document.addEventListener('click', function(e){
    const box = e.target.closest('[data-history-filter]');
    if(box){
      e.preventDefault();
      applyFilter(box.dataset.historyFilter || 'all');
    }
  });
  const oldLoad = window.loadOrderStatus;
  if(typeof oldLoad === 'function'){
    window.loadOrderStatus = async function(phone){
      const res = await oldLoad.apply(this, arguments);
      setTimeout(renderSummaryOnly,250);
      setTimeout(renderSummaryOnly,650);
      return res;
    };
  }
  setTimeout(renderSummaryOnly,500);

  function problemText(type){
    return ({
      bad_screen:'السكرين غير واضح',
      bad_id:'الـ ID أو اسم الحساب محتاج تعديل',
      bad_phone:'رقم المتابعة أو بيانات التحويل محتاجة تعديل'
    })[type] || 'الطلب محتاج تعديل';
  }
  function fixInputHtmlV16(order){
    const type = order.fix_type || 'general';
    if(type === 'bad_screen'){
      return `<div>
        <label>ارفع السكرين الجديد</label>
        <input class="file" name="fixFile" type="file" accept="image/*" required>
        <div class="fix-small">لازم الصورة تكون واضحة وفيها بيانات التحويل.</div>
      </div>`;
    }
    if(type === 'bad_phone'){
      return `<div>
        <label>رقم الموبايل الصحيح</label>
        <input class="input" name="fixPhone" inputmode="numeric" pattern="01[0-9]{9}" placeholder="010xxxxxxxx" required>
        <div class="fix-small">لازم يكون 11 رقم ويبدأ بـ 01.</div>
      </div>`;
    }
    if(type === 'bad_id'){
      return `<div class="fix-grid">
        <div>
          <label>PUBG ID الصحيح</label>
          <input class="input" name="fixPubgId" inputmode="numeric" pattern="[0-9]{5,15}" placeholder="اكتب ID الصحيح" required>
        </div>
        <div>
          <label>اسم الحساب داخل اللعبة</label>
          <input class="input" name="fixPubgName" placeholder="اسم الحساب الصحيح" required>
        </div>
      </div>`;
    }
    return `<div>
      <label>التعديل المطلوب</label>
      <textarea class="textarea" name="fixValue" placeholder="اكتب التعديل المطلوب" required></textarea>
    </div>`;
  }
  function buildFixSectionV16(order){
    if(!order || order.status !== 'needs_fix') return '';
    const count = Number(order.fix_count || 0);
    if(count >= 2){
      return `<div class="fix-alert">⚠️ تم استخدام فرص التعديل المتاحة. برجاء التواصل مع الدعم عشان نحل المشكلة.</div>
        <a class="fix-support" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">📞 تواصل مع الدعم</a>`;
    }
    const left = 2 - count;
    return `<div class="fix-alert">
      ⚠️ يوجد مشكلة في الطلب: <b>${problemText(order.fix_type)}</b><br>
      عندك ${left} فرصة تعديل قبل تحويل الطلب للدعم.
    </div>
    <form class="fix-form" onsubmit="submitOrderFixV16(event,'${esc(order.id)}')">
      <div class="fix-form-title">✏️ إرسال تعديل الطلب</div>
      ${fixInputHtmlV16(order)}
      <input type="hidden" name="phone" value="${esc(order.phone || '')}">
      <input type="hidden" name="fixType" value="${esc(order.fix_type || '')}">
      <button class="fix-submit" type="submit">✅ إرسال التعديل للمراجعة</button>
      <div class="fix-small">بعد الإرسال هيرجع الطلب للمراجعة وهيظهر لمسؤول الطلب.</div>
    </form>`;
  }
  window.submitOrderFixV16 = async function(e, orderId){
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';
    try{
      const fd = new FormData(form);
      const type = fd.get('fixType');
      if(type === 'bad_phone'){
        const phone = String(fd.get('fixPhone')||'').trim();
        if(!/^01[0-9]{9}$/.test(phone)) throw new Error('رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01');
        fd.set('fixValue', phone);
      }
      if(type === 'bad_id'){
        const id = String(fd.get('fixPubgId')||'').trim();
        const name = String(fd.get('fixPubgName')||'').trim();
        if(!/^[0-9]{5,15}$/.test(id)) throw new Error('اكتب PUBG ID صحيح');
        if(name.length < 2) throw new Error('اكتب اسم الحساب داخل اللعبة');
        fd.set('fixValue', `ID: ${id} - Name: ${name}`);
      }
      fd.append('orderId', orderId);
      const res = await fetch('/api/fix-order',{method:'POST',body:fd});
      const data = await res.json();
      if(!data.ok) throw new Error(data.error || 'حصل خطأ');
      form.innerHTML = '<div class="fix-alert">✅ تم إرسال التعديل للمراجعة. تابع حالة الطلب من سجل الطلبات.</div>';
      const phone = fd.get('phone');
      if(phone && window.loadOrderStatus) setTimeout(()=>window.loadOrderStatus(phone), 700);
    }catch(err){
      btn.disabled = false;
      btn.textContent = old;
      alert(err.message || 'حصل خطأ أثناء إرسال التعديل');
    }
  };
  const oldOpen = window.openOrderDetailsByIndex;
  if(typeof oldOpen === 'function'){
    window.openOrderDetailsByIndex = function(orderId){
      oldOpen.apply(this, arguments);
      setTimeout(function(){
        const orders = getOrders();
        const order = orders.find(o => String(o.id) === String(orderId));
        const content = document.getElementById('orderDetailsContent');
        if(!order || !content) return;
        content.querySelectorAll('.fix-form,.fix-alert,.fix-support').forEach(x=>x.remove());
        const html = buildFixSectionV16(order);
        if(html) content.insertAdjacentHTML('beforeend', html);
      },120);
    };
  }
})();


/* moba-v20-history-filter-fix */
(function(){
  function getOrders(){ return window.allHistoryOrders || []; }
  function kind(status){
    if(['delivered','archived'].includes(status)) return 'done';
    if(['rejected','cancelled'].includes(status)) return 'cancelled';
    if(status === 'needs_fix') return 'open';
    return 'open';
  }
  function problemText(type){
    return ({
      bad_screen:'السكرين غير واضح',
      bad_id:'الـ ID أو اسم الحساب محتاج تعديل',
      bad_phone:'رقم المتابعة أو بيانات التحويل محتاجة تعديل'
    })[type] || 'الطلب محتاج تعديل';
  }
  function esc(text){
    if(typeof escapeText === 'function') return escapeText(text);
    return String(text ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function normalizeFilter(f){ return f || window.currentHistoryFilterV16 || 'all'; }

  function fixInputHtml(order){
    const type = order.fix_type || 'general';
    if(type === 'bad_screen'){
      return `<div>
        <label>ارفع السكرين الجديد</label>
        <input class="file" name="fixFile" type="file" accept="image/*" required>
        <div class="fix-small">لازم الصورة تكون واضحة وفيها بيانات التحويل.</div>
      </div>`;
    }
    if(type === 'bad_phone'){
      return `<div>
        <label>رقم الموبايل الصحيح</label>
        <input class="input" name="fixPhone" inputmode="numeric" pattern="01[0-9]{9}" placeholder="010xxxxxxxx" required>
        <div class="fix-small">لازم يكون 11 رقم ويبدأ بـ 01.</div>
      </div>`;
    }
    if(type === 'bad_id'){
      return `<div class="fix-grid">
        <div>
          <label>PUBG ID الصحيح</label>
          <input class="input" name="fixPubgId" inputmode="numeric" pattern="[0-9]{5,15}" placeholder="اكتب ID الصحيح" required>
        </div>
        <div>
          <label>اسم الحساب داخل اللعبة</label>
          <input class="input" name="fixPubgName" placeholder="اسم الحساب الصحيح" required>
        </div>
      </div>`;
    }
    return `<div><label>التعديل المطلوب</label><textarea class="textarea" name="fixValue" placeholder="اكتب التعديل المطلوب" required></textarea></div>`;
  }
  function buildFixForm(order){
    const count = Number(order.fix_count || 0);
    if(count >= 2){
      return `<div class="fix-alert">⚠️ تم استخدام فرص التعديل المتاحة. برجاء التواصل مع الدعم.</div>
      <a class="fix-support" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">📞 تواصل مع الدعم</a>`;
    }
    return `<form class="fix-form" onsubmit="submitOrderFixV20(event,'${esc(order.id)}')">
      <div class="fix-form-title">✏️ إرسال تعديل الطلب</div>
      <div class="fix-small">المشكلة: ${problemText(order.fix_type)} - المتبقي ${2-count} فرصة</div>
      ${fixInputHtml(order)}
      <input type="hidden" name="phone" value="${esc(order.phone || '')}">
      <input type="hidden" name="fixType" value="${esc(order.fix_type || '')}">
      <button class="fix-submit" type="submit">✅ إرسال التعديل للمراجعة</button>
    </form>`;
  }

  window.submitOrderFixV20 = async function(e, orderId){
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'جاري الإرسال...';
    try{
      const fd = new FormData(form);
      const type = fd.get('fixType');
      if(type === 'bad_phone'){
        const phone = String(fd.get('fixPhone')||'').trim();
        if(!/^01[0-9]{9}$/.test(phone)) throw new Error('رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01');
        fd.set('fixValue', phone);
      }
      if(type === 'bad_id'){
        const id = String(fd.get('fixPubgId')||'').trim();
        const name = String(fd.get('fixPubgName')||'').trim();
        if(!/^[0-9]{5,15}$/.test(id)) throw new Error('اكتب PUBG ID صحيح');
        if(name.length < 2) throw new Error('اكتب اسم الحساب داخل اللعبة');
        fd.set('fixValue', `ID: ${id} - Name: ${name}`);
      }
      fd.append('orderId', orderId);
      const res = await fetch('/api/fix-order',{method:'POST',body:fd});
      const data = await res.json();
      if(!data.ok) throw new Error(data.error || 'حصل خطأ');
      form.innerHTML = '<div class="fix-alert">✅ تم إرسال التعديل للمراجعة. تابع حالة الطلب من سجل الطلبات.</div>';
      const phone = fd.get('phone');
      if(phone && window.loadOrderStatus) setTimeout(()=>window.loadOrderStatus(phone), 700);
    }catch(err){
      btn.disabled = false;
      btn.textContent = old;
      alert(err.message || 'حصل خطأ أثناء إرسال التعديل');
    }
  };

  function orderFromCard(card){
    const cards = Array.from(document.querySelectorAll('.history-card'));
    const idx = cards.indexOf(card);
    const filter = normalizeFilter();
    const shownOrders = getOrders().filter(o => filter === 'all' || kind(o.status) === filter);
    return shownOrders[idx] || getOrders()[idx];
  }
  function decorateCards(){
    const cards = Array.from(document.querySelectorAll('.history-card'));
    const filter = normalizeFilter();
    const shownOrders = getOrders().filter(o => filter === 'all' || kind(o.status) === filter);
    cards.forEach((card, idx)=>{
      const order = shownOrders[idx];
      if(!order) return;
      card.dataset.orderId = order.id;
      card.classList.remove('status-done','status-open','status-cancelled','status-fix');
      card.classList.add(order.status === 'needs_fix' ? 'status-fix' : `status-${kind(order.status)}`);
      card.querySelectorAll('.inline-fix-btn').forEach(x=>x.remove());
      if(order.status === 'needs_fix'){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'inline-fix-btn';
        btn.textContent = order.fix_type === 'bad_screen' ? '📸 رفع السكرين الجديد'
          : order.fix_type === 'bad_phone' ? '📱 تعديل الرقم'
          : order.fix_type === 'bad_id' ? '🆔 تعديل ID واسم الحساب'
          : '✏️ تعديل الطلب';
        btn.addEventListener('click', function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          openInlineFix(order, card);
        });
        card.appendChild(btn);
      }
    });
  }
  function openInlineFix(order, card){
    card.querySelectorAll('.fix-form,.fix-alert,.fix-support').forEach(x=>x.remove());
    card.insertAdjacentHTML('beforeend', buildFixForm(order));
  }
  function rebuildHistory(filter){
    window.currentHistoryFilterV16 = filter || 'all';
    if(typeof currentHistoryFilter !== 'undefined') currentHistoryFilter = window.currentHistoryFilterV16;
    const list = document.getElementById('historyList');
    if(!list) return;
    const orders = getOrders();
    const shown = orders.filter(o => window.currentHistoryFilterV16 === 'all' || kind(o.status) === window.currentHistoryFilterV16);
    if(!orders.length){
      list.innerHTML = '<div class="history-empty">لا يوجد طلبات على الرقم ده.</div>';
      return;
    }
    if(!shown.length){
      list.innerHTML = '<div class="history-empty">لا يوجد طلبات في القسم ده.</div>';
      updateSummaryActive();
      return;
    }
    // Use existing renderer if available then hide mismatch? Prefer direct card markup compatible
    list.innerHTML = shown.map(order=>{
      const items = Array.isArray(order.items) ? order.items : [];
      const p = items[0] || {};
      const title = p.product || 'طلب MOBA SHOP';
      const qty = items.reduce((s,x)=>s+Number(x.qty||1),0);
      const statusText = ({
        pending:'تم استلام الطلب',
        claimed:'تم استلام الطلب',
        processing:'قيد التنفيذ',
        delivered:'مكتمل',
        archived:'مكتمل',
        on_hold:'معلق',
        needs_fix:'محتاج تعديل',
        rejected:'ملغي',
        cancelled:'ملغي'
      })[order.status] || order.status || 'غير محدد';
      const date = order.created_at ? new Date(order.created_at).toLocaleString('en-GB',{year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'}) : '';
      return `<div class="history-card" onclick="openOrderDetailsByIndex('${esc(order.id)}')">
        <div>
          <div class="history-card-title">PUBG MOBILE 🎮</div>
          <div class="history-card-meta">${esc(title)} ${items.length>1 ? `+ ${items.length-1} منتجات` : ''}</div>
          <div class="history-card-meta">${date}</div>
          <div class="history-card-status history-status-pill">${order.status === 'needs_fix' ? '⚠️' : kind(order.status)==='done'?'✅':kind(order.status)==='cancelled'?'❌':'⏳'} ${statusText} ${qty?` | الكمية: ${qty}`:''}</div>
        </div>
        <div>
          <div class="history-product-icon">🎮</div>
          <div class="history-card-price">${Number(order.total||0).toLocaleString('en-US')} جنيه</div>
        </div>
      </div>`;
    }).join('');
    updateSummaryActive();
    setTimeout(decorateCards,0);
  }
  function updateSummaryActive(){
    document.querySelectorAll('[data-history-filter]').forEach(x=>{
      x.classList.toggle('active', x.dataset.historyFilter === (window.currentHistoryFilterV16 || 'all'));
    });
  }
  document.addEventListener('click', function(e){
    const box = e.target.closest('[data-history-filter]');
    if(box){
      e.preventDefault();
      e.stopPropagation();
      rebuildHistory(box.dataset.historyFilter || 'all');
    }
  }, true);

  const oldLoad = window.loadOrderStatus;
  if(typeof oldLoad === 'function'){
    window.loadOrderStatus = async function(phone){
      const res = await oldLoad.apply(this, arguments);
      setTimeout(()=>rebuildHistory(window.currentHistoryFilterV16 || 'all'), 450);
      return res;
    };
  }
  const oldOpen = window.openOrderDetailsByIndex;
  if(typeof oldOpen === 'function'){
    window.openOrderDetailsByIndex = function(orderId){
      oldOpen.apply(this, arguments);
      setTimeout(()=>{
        const order = getOrders().find(o => String(o.id) === String(orderId));
        const content = document.getElementById('orderDetailsContent');
        if(!order || !content || order.status !== 'needs_fix') return;
        content.querySelectorAll('.fix-form,.fix-alert,.fix-support').forEach(x=>x.remove());
        content.insertAdjacentHTML('beforeend', buildFixForm(order));
      },150);
    };
  }
  setTimeout(decorateCards,1000);
})();


/* moba-v50-order-form-screenshot-scope */
(function(){
  const MAX_SIZE = 5 * 1024 * 1024;
  const TYPES = ['image/jpeg','image/png','image/webp'];
  const EXT = /\.(jpg|jpeg|png|webp)$/i;

  function orderForm(){ return document.getElementById('orderForm'); }
  function checkoutBtn(){
    const form = orderForm();
    return form ? form.querySelector('button[type="submit"], input[type="submit"]') : null;
  }
  function fileInput(){
    const form = orderForm();
    return form ? form.querySelector('input[type="file"][name="screenshot"]') : null;
  }
  function warningBox(){ return document.getElementById('smartCheckoutWarning'); }
  function validate(){
    const input = fileInput();
    const file = input && input.files && input.files[0];
    if(!file) return 'لازم ترفع صورة سكرين التحويل قبل تنفيذ الطلب.';
    const type = String(file.type || '').toLowerCase();
    const name = String(file.name || '');
    if(!TYPES.includes(type) || !EXT.test(name)) return 'مسموح برفع صورة فقط بصيغة JPG أو PNG أو WEBP.';
    if(Number(file.size || 0) > MAX_SIZE) return 'حجم الصورة كبير. الحد الأقصى 5MB.';
    return '';
  }
  function updateCheckout(){
    const btn = checkoutBtn();
    const err = validate();
    if(btn){
      btn.disabled = !!err;
      btn.classList.toggle('disabled-checkout', !!err);
      btn.title = err || '';
    }
    const warning = warningBox();
    if(warning){
      warning.style.display = err ? 'block' : 'none';
      warning.innerHTML = err ? '⚠️ ' + err : '';
    }
  }
  document.addEventListener('click', function(e){
    const btn = e.target.closest('#orderForm button[type="submit"], #orderForm input[type="submit"]');
    if(!btn) return;
    const err = validate();
    if(err){
      e.preventDefault();
      e.stopImmediatePropagation();
      alert(err);
      updateCheckout();
      return false;
    }
  }, true);
  document.addEventListener('change', function(e){
    const input = e.target && e.target.matches('#orderForm input[type="file"][name="screenshot"]') ? e.target : null;
    if(!input) return;
    const file = input.files && input.files[0];
    if(file){
      const type = String(file.type || '').toLowerCase();
      const name = String(file.name || '');
      let err = '';
      if(!TYPES.includes(type) || !EXT.test(name)) err = 'مسموح برفع صورة فقط بصيغة JPG أو PNG أو WEBP.';
      else if(Number(file.size || 0) > MAX_SIZE) err = 'حجم الصورة كبير. الحد الأقصى 5MB.';
      if(err){
        alert(err);
        input.value = '';
      }
    }
    updateCheckout();
  }, true);
  window.mobaValidateScreenshot = function(){
    const err = validate();
    return err ? {ok:false,error:err} : {ok:true,file:fileInput()?.files?.[0]};
  };
  setTimeout(updateCheckout, 200);
})();


/* moba-v52-game-home-spa */
(function(){
  function pageName(view){
    if(view === 'cart') return 'cart';
    if(view === 'orders') return 'orders';
    if(view === 'reviews') return 'reviews';
    if(view === 'game') return 'game';
    return 'home';
  }

  function setNavActive(view){
    document.querySelectorAll('.app-nav a[data-view]').forEach(a=>{
      const on = a.dataset.view === view || (view === 'game' && a.dataset.view === 'home');
      a.classList.toggle('active-nav', on);
      a.classList.toggle('primary', on);
    });
  }

  function showView(view, opts={}){
    view = pageName(view);
    document.body.dataset.page = view;

    document.querySelectorAll('.moba-view[data-page]').forEach(sec=>{
      const p = sec.dataset.page;
      let show = false;
      if(view === 'home') show = p === 'home';
      if(view === 'game') show = p === 'game';
      if(view === 'cart') show = p === 'game';
      if(view === 'orders') show = p === 'orders';
      if(view === 'reviews') show = p === 'reviews';
      sec.classList.toggle('view-hidden', !show);
    });

    setNavActive(view);

    const target =
      view === 'home' ? document.getElementById('gamesHome') :
      view === 'game' ? document.getElementById('productsSection') :
      view === 'cart' ? (document.getElementById('cartPanel') || document.getElementById('cartSection')) :
      view === 'orders' ? document.getElementById('trackOrder') :
      view === 'reviews' ? document.getElementById('customerReviews') : null;

    if(target && !opts.noScroll) setTimeout(()=>target.scrollIntoView({behavior:'smooth', block:'start'}), 60);
  }

  window.mobaShowView = showView;

  function ensureGameToolbar(){
    const products = document.getElementById('productsSection');
    if(!products || products.querySelector('.game-page-toolbar')) return;

    const bar = document.createElement('div');
    bar.className = 'game-page-toolbar';
    bar.innerHTML = `
      <div>
        <h3>🎮 PUBG Mobile</h3>
        <div class="notice">اختار المنتج، اكتب ID واسم الحساب، وبعدها ضيف للسلة.</div>
      </div>
      <div class="game-page-actions">
        <button type="button" class="page-back-btn" data-view="home">⬅️ الألعاب</button>
        <button type="button" class="page-back-btn" data-view="cart">🛒 السلة والدفع</button>
      </div>
    `;
    products.insertAdjacentElement('afterbegin', bar);
  }

  document.addEventListener('click', function(e){
    const viewBtn = e.target.closest('[data-view]');
    if(viewBtn && !viewBtn.classList.contains('support-link')){
      e.preventDefault();
      showView(viewBtn.dataset.view);
      return;
    }

    const game = e.target.closest('[data-game]');
    if(game){
      e.preventDefault();
      if(game.dataset.game === 'pubg') showView('game');
      else{
        if(window.mobaToast) window.mobaToast('اللعبة دي هتتضاف قريبًا 👑');
        else alert('اللعبة دي هتتضاف قريبًا');
      }
    }
  }, true);

  const oldSticky = document.getElementById('stickyCart');
  if(oldSticky){
    oldSticky.onclick = function(e){
      e.preventDefault();
      showView('cart');
    };
  }

  setTimeout(()=>{
    const go = document.getElementById('goCheckout');
    const showCart = document.getElementById('showCartBtn');
    if(go) go.onclick = function(){ document.getElementById('modal')?.classList.remove('show'); showView('cart'); };
    if(showCart) showCart.onclick = function(){ document.getElementById('modal')?.classList.remove('show'); showView('cart'); };
  }, 700);

  ensureGameToolbar();
  showView('home', {noScroll:true});
})();


/* moba-v57-products-header-fix */
(function(){
  const PRODUCTS = {
    uc: [
      {name:'UC 60', type:'شحن بالايدي | ID', price:50, uc:60},
      {name:'UC 325', type:'شحن بالايدي | ID', price:235, uc:325, hot:true},
      {name:'UC 660', type:'شحن بالايدي | ID', price:435, uc:660},
      {name:'UC 1800', type:'شحن بالايدي | ID', price:1120, uc:1800},
      {name:'UC 3850', type:'شحن بالايدي | ID', price:2170, uc:3850},
      {name:'UC 8100', type:'شحن بالايدي | ID', price:4350, uc:8100}
    ],
    growth: [
      {name:'ازدهار 1', type:'مرة واحدة في الحساب', price:55, uc:60, noQty:true, warning:'اتأكد إنه متاح عندك قبل الطلب'},
      {name:'ازدهار 2', type:'مرة واحدة في الحساب', price:150, uc:180, noQty:true, warning:'اتأكد إنه متاح عندك قبل الطلب'},
      {name:'ازدهار 3', type:'مرة واحدة في الحساب', price:250, uc:325, noQty:true, warning:'اتأكد إنه متاح عندك قبل الطلب'},
      {name:'الثلاثة ازدهارات', type:'عرض الازدهار كامل', price:450, uc:565, noQty:true, hot:true, warning:'اتأكد إن كل الازدهارات متاحة في حسابك'},
      {name:'الكريستالة / الجوهرة', type:'Crystal / Mythic Gem', price:150, uc:0, noQty:true, warning:'اتأكد من المتاح داخل اللعبة. غالبا واحدة أو اتنين في الأسبوع حسب الحساب'}
    ],
    prime: [
      {name:'Prime + Prime Plus', type:'برايم وبرايم بلس مع بعض', price:500, uc:0, noQty:true, hot:true, warning:'منتج واحد يشمل Prime و Prime Plus مع بعض'},
      {name:'Prime', type:'اشتراك برايم فقط', price:55, uc:0, noQty:true},
      {name:'Prime Plus', type:'اشتراك برايم بلس فقط', price:445, uc:0, noQty:true}
    ]
  };

  function esc(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function money(n){return Number(n||0).toLocaleString('en-US') + ' جنيه';}
  function status(msg,type){
    try{ if(typeof window.showStatus === 'function') return window.showStatus(msg,type); }catch(e){}
    alert(msg);
  }
  function getCart(){
    try{
      const old = JSON.parse(localStorage.getItem('moba_cart') || '[]');
      window.cart = Array.isArray(old) ? old : [];
    }catch(e){window.cart=[];}
    return window.cart;
  }
  function saveCart(){
    localStorage.setItem('moba_cart', JSON.stringify(window.cart || []));
    try{cart = window.cart;}catch(e){}
    if(typeof window.renderCart === 'function') window.renderCart();
    else if(typeof renderCart === 'function') renderCart();
    updateSticky();
  }
  function updateSticky(){
    const sticky = document.getElementById('stickyCart');
    if(!sticky) return;
    const c = getCart();
    const total = c.reduce((s,x)=>s+(Number(x.price||0)*Number(x.qty||1)),0);
    sticky.textContent = `السلة ${c.length} منتجات | ${total.toLocaleString('en-US')} جنيه`;
  }
  function saveLastId(id,name){
    if(id) localStorage.setItem('moba_last_pubg_id', id);
    if(name) localStorage.setItem('moba_last_pubg_name', name);
    if(id || name){
      try{
        localStorage.setItem('moba_last_pubg', JSON.stringify({pubgId:id || '', pubgName:name || ''}));
      }catch(e){}
    }
  }
  function getLastId(){return localStorage.getItem('moba_last_pubg_id') || '';}
  function getLastName(){return localStorage.getItem('moba_last_pubg_name') || '';}

  window.mobaProducts = PRODUCTS;
  window.activeCat = window.activeCat || 'uc';
  window.productQty = window.productQty || {};

  function renderProducts(){
    const productList = document.getElementById('productList');
    if(!productList) return;
    const cat = window.activeCat || 'uc';
    const list = PRODUCTS[cat] || [];
    document.querySelectorAll('.tab[data-cat]').forEach(t=>t.classList.toggle('active', t.dataset.cat === cat));
    const catInfo=document.getElementById('productCatInfo');
    if(catInfo){
      const map={
        uc:'باقات UC للشحن بالـ ID. اكتب ID واسم الحساب بدقة قبل الإضافة للسلة.',
        growth:'منتجات الازدهار والكريستالة حساسة. اتأكد إنها متاحة داخل اللعبة قبل الطلب.',
        prime:'اشتراكات برايم وبرايم بلس. راجع نوع الاشتراك قبل الدفع.'
      };
      catInfo.textContent=map[cat]||'اختار المنتج المناسب واكتب بيانات الحساب قبل الإضافة للسلة.';
    }

    productList.innerHTML = list.map((p,i)=>{
      const qty = p.noQty ? 1 : Math.max(1, Number(window.productQty[i] || 1));
      const ucTotal = Number(p.uc || 0) * qty;
      const lastId = getLastId();
      return `<div class="product product--compact" data-card-index="${i}">
        <div class="product-card-head">
          <div class="product-card-copy">
            <b>${esc(p.name)}</b>
            ${p.type ? `<div class="type">${esc(p.type)}</div>` : ''}
          </div>
          <div class="product-card-side">
            ${p.hot ? '<span class="hot">🔥 الاكثر طلبا</span>' : ''}
            <div class="price">${money(p.price)}</div>
          </div>
        </div>
        ${p.warning ? `<div class="warn compact-warn">⚠️ ${esc(p.warning)}</div>` : ''}
        <div class="product-fields compact-fields">
          <div class="id-inline-wrap compact-inline-wrap">
            <button type="button" class="use-last-id-inline-btn compact-last-btn" data-last-id="${i}" ${lastId ? '' : 'style="display:none"'} title="استخدم آخر ID محفوظ">آخر ID</button>
            <input class="id-input id-input-main" id="id_${i}" inputmode="numeric" autocomplete="off" placeholder="PUBG ID" />
          </div>
          <input class="id-input" id="name_${i}" autocomplete="off" placeholder="اسم الحساب داخل اللعبة" />
        </div>
        <div class="product-bottom compact-bottom ${p.noQty ? 'single-only' : ''}">
          ${p.noQty ? `<div class="product-uc-preview compact-preview single">⚠️ كمية واحدة فقط للمنتج ده</div>` : `
          <div class="product-qty compact-qty">
            <span class="product-qty-label">الكمية</span>
            <div class="qty-box">
              <button class="qty-btn" type="button" data-v57-qty="${i}" data-dir="-1">−</button>
              <span class="qty-num">${qty}</span>
              <button class="qty-btn" type="button" data-v57-qty="${i}" data-dir="1">+</button>
            </div>
          </div>
          <div class="product-uc-preview compact-preview">🎮 إجمالي الشدات: <b>${ucTotal.toLocaleString('en-US')} UC</b></div>`}
        </div>
        <button class="btn add compact-add" type="button" data-v57-add="${i}">إضافة للسلة +</button>
      </div>`;
    }).join('');
  }

  function addToCart(i){
    const cat = window.activeCat || 'uc';
    const p = (PRODUCTS[cat] || [])[i];
    if(!p) return status('المنتج غير موجود','err');

    const idEl = document.getElementById('id_' + i);
    const nameEl = document.getElementById('name_' + i);
    const pubgId = (idEl?.value || '').trim();
    const name = (nameEl?.value || '').trim();

    if(!/^\d{5,15}$/.test(pubgId)){status('اكتب ID صحيح ارقام فقط','err');return;}
    if(!name){status('اكتب اسم الحساب داخل اللعبة','err');return;}

    if((cat==='growth'||/ازدهار|كريستالة|جوهرة|Crystal|Growth/i.test(String(p.name||p.type||p.warning||''))) && !confirm('تأكيد مهم: اتأكد إن المنتج متاح عندك داخل اللعبة قبل الطلب. تكمل الإضافة للسلة؟')){
      return;
    }
    saveLastId(pubgId,name);
    const qty = p.noQty ? 1 : Math.max(1, Number(window.productQty[i] || 1));
    const item = {
      product:p.name,type:p.type || cat,price:Number(p.price||0),uc:Number(p.uc||0),
      pubgId,name,qty,qtyTotal:qty,ucTotal:Number(p.uc||0)*qty,game:'PUBG Mobile'
    };
    const c = getCart();
    c.push(item);
    window.cart = c;
    saveCart();
    try{ if(typeof openModal === 'function') openModal(item); else status('تم إضافة المنتج للسلة ✅','ok'); }
    catch(e){ status('تم إضافة المنتج للسلة ✅','ok'); }
  }

  function useLastId(i){
    const id = getLastId();
    const name = getLastName();
    if(!id) return status('مفيش ID محفوظ لسه','err');
    const idEl = document.getElementById('id_' + i);
    const nameEl = document.getElementById('name_' + i);
    if(idEl) idEl.value = id;
    if(nameEl && name) nameEl.value = name;
  }

  document.addEventListener('click', function(e){
    const tab = e.target.closest('.tab[data-cat]');
    if(tab){
      e.preventDefault(); e.stopImmediatePropagation();
      window.activeCat = tab.dataset.cat || 'uc';
      window.productQty = {};
      renderProducts();
      return false;
    }
    const qty = e.target.closest('[data-v57-qty]');
    if(qty){
      e.preventDefault(); e.stopImmediatePropagation();
      const i = Number(qty.dataset.v57Qty);
      const dir = Number(qty.dataset.dir);
      window.productQty[i] = Math.max(1, Math.min(20, Number(window.productQty[i] || 1) + dir));
      renderProducts();
      return false;
    }
    const last = e.target.closest('[data-last-id]');
    if(last){
      e.preventDefault(); e.stopImmediatePropagation();
      useLastId(Number(last.dataset.lastId));
      return false;
    }
    const add = e.target.closest('[data-v57-add]');
    if(add){
      e.preventDefault(); e.stopImmediatePropagation();
      addToCart(Number(add.dataset.v57Add));
      return false;
    }
  }, true);

  // منع قفزة الصفحة وقت التركيز على ID/Name قدر الإمكان
  document.addEventListener('focusin', function(e){
    if(e.target && e.target.classList && e.target.classList.contains('id-input')){
      const y = window.scrollY;
      setTimeout(()=>{ if(Math.abs(window.scrollY - y) < 260) window.scrollTo({top:y, behavior:'instant'}); }, 60);
    }
  }, true);

  window.renderProducts = renderProducts;
  setTimeout(function(){
    getCart();
    updateSticky();
    renderProducts();
  }, 250);
})();


/* moba-v58-hide-cart-products-fix */
(function(){
  function showView(view){
    if(typeof window.mobaShowView === 'function'){
      window.mobaShowView(view);
      return;
    }
    document.body.dataset.page = view;
  }

  // Make every cart shortcut open cart page only
  document.addEventListener('click', function(e){
    const cartBtn = e.target.closest('[data-view="cart"], #stickyCart, .mini-cart-open');
    if(cartBtn){
      e.preventDefault();
      showView('cart');
    }
  }, true);

  function ensureCartToolbar(){
    const cart = document.getElementById('cartSection') || document.getElementById('cartPanel');
    if(!cart || cart.querySelector('.cart-page-toolbar')) return;
    const bar = document.createElement('div');
    bar.className = 'game-page-toolbar cart-page-toolbar';
    bar.innerHTML = `
      <div>
        <h3>🛒 السلة والدفع</h3>
        <div class="notice">راجع المنتجات، طبّق الكوبون، اختار الدفع وارفع السكرين.</div>
      </div>
      <div class="game-page-actions">
        <button type="button" class="page-back-btn" data-view="game">⬅️ رجوع للمنتجات</button>
      </div>
    `;
    cart.insertAdjacentElement('afterbegin', bar);
  }

  setTimeout(function(){
    ensureCartToolbar();
    if(document.body.dataset.page === 'game'){
      const cart = document.getElementById('cartSection') || document.getElementById('cartPanel');
      if(cart) cart.style.display = 'none';
    }
  }, 400);
})();


/* moba-v60-cart-total-ui-fix */
(function(){
  function esc(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getCart(){
    try{
      const c = JSON.parse(localStorage.getItem('moba_cart') || '[]');
      window.cart = Array.isArray(c) ? c : [];
    }catch(e){ window.cart = []; }
    return window.cart;
  }
  function saveCart(c){
    window.cart = c || [];
    try{ cart = window.cart; }catch(e){}
    localStorage.setItem('moba_cart', JSON.stringify(window.cart));
  }
  function qty(it){return Math.max(1, Number(it.qty || it.quantity || it.qtyTotal || 1));}
  function price(it){return Number(it.price || 0);}
  function idOf(it){return it.pubgId || it.id || it.playerId || it.accountId || '';}
  function nameOf(it){return it.name || it.pubgName || it.playerName || it.accountName || it.customer_name || '';}
  function ucEach(it){return Number(it.uc || 0);}
  function ucTotal(it){
    const v = Number(it.ucTotal || 0);
    if(v > 0) return v;
    return ucEach(it) * qty(it);
  }
  function totals(c){
    return {
      count:c.length,
      uc:c.reduce((s,x)=>s+ucTotal(x),0),
      money:c.reduce((s,x)=>s+(price(x)*qty(x)),0)
    };
  }
  function updateSticky(){
    const sticky = document.getElementById('stickyCart');
    if(!sticky) return;
    const t = totals(getCart());
    sticky.textContent = `السلة ${t.count} منتجات | ${t.money.toLocaleString('en-US')} جنيه`;
  }
  function updateOrderTotals(total){
    // أي مكان قديم بيعرض الإجمالي نخليه نفس الرقم الصح
    document.querySelectorAll('[data-cart-total], #cartTotal, #finalTotal, #orderTotal').forEach(el=>{
      el.textContent = total.toLocaleString('en-US') + ' جنيه';
    });
    document.querySelectorAll('input[name="total"], input[name="total_amount"], input[name="amount"]').forEach(inp=>{
      inp.value = String(total);
    });
    window.mobaCurrentCartTotal = total;
  }

  window.renderCart = function(){
    const box = document.getElementById('cartBox');
    if(!box) return;

    const c = getCart();
    if(!c.length){
      box.innerHTML = `<div class="cart-empty">السلة فاضية حاليا. ارجع للمنتجات واختار اللي محتاجه 👑</div>`;
      updateSticky();
      updateOrderTotals(0);
      return;
    }

    const t = totals(c);
    updateOrderTotals(t.money);

    box.innerHTML = `
      <div class="cart-summary-v60">
        <div><b>${t.count}</b><span>منتجات</span></div>
        <div><b>${t.uc.toLocaleString('en-US')}</b><span>UC</span></div>
        <div><b>${t.money.toLocaleString('en-US')}</b><span>جنيه</span></div>
      </div>

      ${c.map((it,idx)=>{
        const q = qty(it);
        const line = price(it)*q;
        const id = idOf(it);
        const nm = nameOf(it);
        return `<div class="cart-item cart-item-v60">
          <button class="remove" type="button" data-v60-remove="${idx}">حذف</button>
          <div class="cart-item-title-v60"><b>${esc(it.product || 'منتج')}</b> <span>(${idx+1})</span></div>

          <div class="cart-info-grid-v60">
            <div>🆔 ID: <b>${esc(id || '-')}</b></div>
            <div>👤 Name: <b>${esc(nm || '-')}</b></div>
          </div>

          <div class="qty-row">
            <span>الكمية</span>
            <div class="qty-box">
              <button class="qty-btn" type="button" data-v60-qty="${idx}" data-dir="-1">−</button>
              <span class="qty-num">${q}</span>
              <button class="qty-btn" type="button" data-v60-qty="${idx}" data-dir="1">+</button>
            </div>
          </div>

          <div class="uc-total">🎮 إجمالي الشدات لهذا ID: <b>${ucTotal(it).toLocaleString('en-US')} UC</b></div>
          <div class="cart-line-total-v60">💰 ${price(it).toLocaleString('en-US')} جنيه × ${q} = <b>${line.toLocaleString('en-US')} جنيه</b></div>
        </div>`;
      }).join('')}

      <div class="cart-total-v60">
        <div class="cart-total-row-v60">
          <span>الإجمالي النهائي</span>
          <b>${t.money.toLocaleString('en-US')} جنيه</b>
        </div>
        <div class="cart-note-v60">ده إجمالي المنتجات الموجودة في السلة قبل أي خصم كوبون.</div>
      </div>
    `;

    updateSticky();
  };

  document.addEventListener('click', function(e){
    const rem = e.target.closest('[data-v60-remove]');
    if(rem){
      e.preventDefault(); e.stopImmediatePropagation();
      const c = getCart();
      c.splice(Number(rem.dataset.v60Remove),1);
      saveCart(c);
      window.renderCart();
      return false;
    }

    const qBtn = e.target.closest('[data-v60-qty]');
    if(qBtn){
      e.preventDefault(); e.stopImmediatePropagation();
      const c = getCart();
      const i = Number(qBtn.dataset.v60Qty);
      const dir = Number(qBtn.dataset.dir);
      if(c[i]){
        const nq = Math.max(1, Math.min(20, qty(c[i])+dir));
        c[i].qty = nq;
        c[i].qtyTotal = nq;
        c[i].ucTotal = ucEach(c[i]) * nq;
        saveCart(c);
        window.renderCart();
      }
      return false;
    }
  }, true);

  // بعد أي كود قديم يحاول يرندر السلة، نعيد الرندر الصحيح
  setTimeout(()=>window.renderCart(), 350);
  window.addEventListener('storage', ()=>window.renderCart());
})();


/* moba-v71-premium-nav-cart */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function eg(n){try{return Number(n||0).toLocaleString('ar-EG')}catch(e){return n||0}}
  function cartItems(){return Array.isArray(window.cart)?window.cart:[]}
  function itemQty(item){return Math.max(1,Number(item&&item.qty||1))}
  function total(){return cartItems().reduce((s,x)=>s+Number(x.price||0)*itemQty(x),0)}
  function currentView(){
    return document.body.dataset.page || (location.hash.includes('cart')?'cart':location.hash.includes('track')?'orders':location.hash.includes('reviews')?'reviews':location.hash.includes('products')?'game':'home');
  }
  function enhanceNav(){
    const nav=qs('.jump-nav.app-nav'); if(!nav)return;
    const labels={home:'الرئيسية',cart:'السلة',orders:'طلباتي',reviews:'الآراء'};
    qsa('a[data-view]',nav).forEach(a=>{
      const v=a.dataset.view;
      const icon={home:'⌂',cart:'▣',orders:'◷',reviews:'☆'}[v]||'•';
      a.innerHTML='<span>'+icon+'</span><span>'+(labels[v]||a.textContent.trim())+'</span>';
      a.classList.toggle('active-nav',v===currentView() || (v==='home'&&currentView()==='game'));
      if(v==='home') a.classList.remove('primary');
    });
    const support=qs('a.support-link',nav);
    if(support) support.innerHTML='<span>☎</span><span>الدعم</span>';
  }
  function ensureCartShell(){
    const cart=qs('#cartSection'); if(!cart)return;
    let summary=qs('#cartV71Summary',cart);
    if(!summary){
      summary=document.createElement('div');
      summary.id='cartV71Summary';
      summary.className='cart-v71-summary';
      const title=cart.querySelector('h2');
      if(title) title.insertAdjacentElement('afterend',summary);
    }
    const count=cartItems().reduce((s,x)=>s+itemQty(x),0);
    summary.innerHTML='<div><b>'+eg(cartItems().length)+'</b><span>منتجات</span></div><div><b>'+eg(count)+'</b><span>كمية</span></div><div><b>'+eg(total())+' ج</b><span>الإجمالي</span></div>';
    let steps=qs('#cartV71Steps',cart);
    if(!steps){
      steps=document.createElement('div');
      steps.id='cartV71Steps';
      steps.className='cart-v71-steps';
      steps.innerHTML='<span>1. راجع ID والاسم</span><span>2. اختار الدفع وارفع السكرين</span><span>3. نفذ الطلب وتابع الحالة</span>';
      summary.insertAdjacentElement('afterend',steps);
    }
  }
  function refresh(){
    enhanceNav();
    ensureCartShell();
  }
  const oldShow=window.mobaShowView;
  if(typeof oldShow==='function'){
    window.mobaShowView=function(view){
      const r=oldShow.apply(this,arguments);
      setTimeout(refresh,40);
      return r;
    };
  }
  const oldRender=window.renderCart;
  if(typeof oldRender==='function'){
    window.renderCart=function(){
      const r=oldRender.apply(this,arguments);
      setTimeout(refresh,20);
      return r;
    };
  }
  document.addEventListener('click',function(e){
    if(e.target.closest('.jump-nav.app-nav a[data-view]')) setTimeout(refresh,80);
  },true);
  window.addEventListener('hashchange',refresh);
  // V74: avoid repeated nav/cart redraws that caused visible header jitter.
  setTimeout(refresh,250);
})();


/* moba-v80-remove-duplicate-cart-summary */
(function(){
  function cleanCart(){
    document.getElementById('cartPremiumSummary')?.remove();
    document.getElementById('cartV71Steps')?.remove();
  }
  cleanCart();
  document.addEventListener('DOMContentLoaded',cleanCart);
  const cart=document.getElementById('cartSection');
  if(cart && 'MutationObserver' in window){
    new MutationObserver(cleanCart).observe(cart,{childList:true,subtree:true});
  }
})();
/* V104 central cart/order modal clicks after HTML split */
(function(){
  if(window.__mobaV104CartClicks)return;
  window.__mobaV104CartClicks=true;
  document.addEventListener('click',function(e){
    const sticky=e.target.closest&&e.target.closest('#stickyCart');
    if(sticky){
      e.preventDefault();
      const el=document.getElementById('cartSection')||document.getElementById('cartPanel');
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    if(e.target.closest&&e.target.closest('[data-order-modal-card]')){
      e.stopPropagation();
      return;
    }
    if(e.target.closest&&e.target.closest('[data-order-modal-close], [data-order-modal-close-btn]')){
      e.preventDefault();
      if(typeof window.closeOrderDetails==='function')window.closeOrderDetails();
      else {
        const modal=document.getElementById('orderDetailsModal');
        if(modal)modal.classList.remove('show');
      }
    }
  },true);
})();


/* moba-v114-final-order-modal-rebuild */
(function(){
  if(window.__mobaV114FinalOrderModal)return;
  window.__mobaV114FinalOrderModal=true;
  function esc(t){return String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function money(n){try{return Number(n||0).toLocaleString('ar-EG')+' جنيه';}catch(e){return (n||0)+' جنيه';}}
  function fmtDate(v){try{return new Date(v).toLocaleString('ar-EG',{year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'});}catch(e){return v||'-';}}
  function ucTotal(x){
    if(typeof window.itemUcTotal==='function') return window.itemUcTotal(x);
    const qty=Math.max(1,Number(x&&x.qty||1));
    const explicit=Number(x.ucTotal||x.uc_total||0);
    if(explicit) return explicit;
    const line=String(x.product||'').match(/(\d+)\s*UC/i);
    return line ? Number(line[1])*qty : 0;
  }
  function lineTotal(x){return Number(x.line_total||0)||Number(x.total||0)||Number(x.price||0)*Math.max(1,Number(x.qty||1));}
  function statusText(status){
    const m={pending:'تم استلام الطلب',processing:'جاري المراجعة',delivered:'تم التنفيذ',archived:'تم التنفيذ',needs_fix:'محتاج تعديل',rejected:'مرفوض',cancelled:'ملغي'};
    return m[status]||status||'-';
  }
  function issueType(order){
    const all=[order?.fix_type,order?.status_text,order?.customer_status_text,order?.admin_status_text,order?.note].join(' ').toLowerCase();
    if(/bad[_\s-]?screen|badshot|screenshot|screen|shot|سكرين/.test(all)) return 'bad_screen';
    return order?.fix_type || 'general';
  }
  function buildFixPanel(order){
    if(!order || order.status!=='needs_fix') return '';
    const type=issueType(order);
    const count=Number(order.fix_count||0);
    const left=Math.max(0,2-count);
    if(left<=0){
      return `<div class="fix-panel-v114"><div class="fix-alert">⚠️ تم استخدام فرص التعديل المتاحة. تواصل مع الدعم لو لسه المشكلة موجودة.</div><a class="fix-support" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">📞 تواصل مع الدعم</a><button type="button" class="ask-pharaoh-btn" data-ask-pharaoh-issue="${esc(type)}">👑 اسأل فرعون عن المشكلة</button></div>`;
    }
    const screen = type==='bad_screen';
    return `<form class="fix-panel-v114 fix-form" onsubmit="return window.submitOrderFixV114(event,'${esc(order.id)}')">
      <div class="fix-alert">⚠️ فيه مشكلة في الطلب: <b>${screen?'السكرين غير واضح':'الطلب محتاج تعديل'}</b><br>المتبقي ليك ${left} فرصة تعديل.</div>
      <div class="fix-form-title">✏️ إرسال تعديل الطلب</div>
      ${screen ? `<div class="fix-upload-wrap"><label class="fix-upload-trigger">📸 اختار سكرين جديد<input type="file" name="fixFile" accept="image/*" required></label><span class="fix-file-name">لم يتم اختيار ملف بعد</span></div>` : `<textarea class="textarea fix-textarea" name="fixValue" placeholder="اكتب التعديل المطلوب بوضوح" required></textarea>`}
      <input type="hidden" name="phone" value="${esc(order.phone||'')}">
      <input type="hidden" name="fixType" value="${esc(type)}">
      <div class="fix-actions">
        <button class="fix-submit" type="submit">✅ إرسال التعديل</button>
        <button type="button" class="ask-pharaoh-btn" data-ask-pharaoh-issue="${esc(type)}">👑 اسأل فرعون عن المشكلة</button>
      </div>
      <a class="fix-support" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">📞 تواصل مع الدعم</a>
    </form>`;
  }
  window.submitOrderFixV114 = async function(e, orderId){
    e.preventDefault();
    const form=e.target;
    const btn=form.querySelector('.fix-submit');
    const old=btn.textContent;
    btn.disabled=true; btn.textContent='جاري الإرسال...';
    try{
      const fd=new FormData(form);
      fd.append('orderId',orderId);
      const type=String(fd.get('fixType')||'');
      if(type==='bad_screen'){
        const file=fd.get('fixFile');
        if(!file || !file.name) throw new Error('اختار سكرين واضح الأول');
      }else{
        const v=String(fd.get('fixValue')||'').trim();
        if(v.length<2) throw new Error('اكتب التعديل المطلوب');
      }
      const res=await fetch('/api/fix-order',{method:'POST',body:fd});
      const data=await res.json();
      if(!data.ok) throw new Error(data.error||'حصل خطأ أثناء الإرسال');
      form.outerHTML='<div class="fix-panel-v114"><div class="fix-alert">✅ تم إرسال التعديل للمراجعة. تابع الطلب من نفس الصفحة.</div></div>';
      const phone=String(fd.get('phone')||'').trim();
      if(phone && typeof window.loadOrderStatus==='function') setTimeout(()=>window.loadOrderStatus(phone),700);
    }catch(err){
      btn.disabled=false; btn.textContent=old; alert(err.message||'حصل خطأ');
    }
    return false;
  };
  function bindFixUi(content){
    content.querySelectorAll('input[type="file"][name="fixFile"]').forEach(function(inp){
      inp.addEventListener('change',function(){
        const name=inp.files&&inp.files[0]?inp.files[0].name:'لم يتم اختيار ملف بعد';
        const out=inp.closest('.fix-upload-wrap')?.querySelector('.fix-file-name');
        if(out) out.textContent=name;
      });
    });
  }
  window.openOrderDetailsByIndex=function(orderId){
    const orders=Array.isArray(window.allHistoryOrders)?window.allHistoryOrders:[];
    const order=orders.find(o=>String(o.id)===String(orderId));
    if(!order) return;
    const items=Array.isArray(order.items)?order.items:[];
    const modal=document.getElementById('orderDetailsModal');
    const content=document.getElementById('orderDetailsContent');
    if(!modal||!content) return;
    const products=items.map((x,i)=>`<div class="order-v114-product"><div class="order-v114-product-head"><div class="order-v114-product-title">${i+1}) ${esc(x.product||'منتج')}</div><div class="order-v114-product-price">${money(lineTotal(x))}</div></div><div class="order-v114-product-meta">🆔 ID: <code>${esc(x.pubgId||'-')}</code><br>👤 الاسم: ${esc(x.pubgName||'-')}<br>🔢 الكمية: ${Math.max(1,Number(x.qty||1))}<br>🎮 إجمالي الشدات: ${Number(ucTotal(x)||0).toLocaleString('ar-EG')} UC</div></div>`).join('') || '<div class="order-v114-product">لا يوجد منتجات</div>';
    const note=String(order.note||'').trim();
    content.innerHTML=`<div class="order-v114-grid"><div class="order-v114-summary"><div class="order-v114-chip"><span class="k">الحالة</span><span class="v">${statusText(order.status)}</span></div><div class="order-v114-chip"><span class="k">طريقة الدفع</span><span class="v">${esc(order.payment_method||'-')}</span></div><div class="order-v114-chip"><span class="k">الوقت</span><span class="v">${fmtDate(order.created_at)}</span></div><div class="order-v114-chip"><span class="k">رقم المتابعة</span><span class="v">${esc(order.phone||'-')}</span></div><div class="order-v114-chip"><span class="k">عدد المنتجات</span><span class="v">${items.length||0}</span></div><div class="order-v114-chip"><span class="k">الإجمالي</span><span class="v">${money(order.total)}</span></div></div><div class="order-v114-products">${products}</div>${note?`<div class="order-v114-note"><b>ملاحظة الطلب:</b><br>${esc(note)}</div>`:''}${buildFixPanel(order)}</div>`;
    bindFixUi(content);
    modal.classList.add('show');
    document.body.style.overflow='hidden';
  };
  window.closeOrderDetails=function(){
    const modal=document.getElementById('orderDetailsModal');
    if(modal) modal.classList.remove('show');
    document.body.style.overflow='';
  };
})();


/* moba-v118-antispam-cart-clean */
(function(){
  if(window.__mobaV118AntiSpamCartClean)return;
  window.__mobaV118AntiSpamCartClean=true;
  function getDeviceId(){
    let id=localStorage.getItem('moba_device_id');
    if(!id){
      id='dev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
      localStorage.setItem('moba_device_id',id);
    }
    return id;
  }
  function ensureDeviceInput(){
    const form=document.getElementById('orderForm');
    if(!form)return;
    let input=form.querySelector('input[name="deviceId"]');
    if(!input){
      input=document.createElement('input');
      input.type='hidden';
      input.name='deviceId';
      form.appendChild(input);
    }
    input.value=getDeviceId();
  }
  function cleanCartTopSummary(){
    document.getElementById('cartV71Summary')?.remove();
    document.getElementById('mobaV103Totals')?.remove();
    document.getElementById('cartV71Steps')?.remove();
  }
  ensureDeviceInput(); cleanCartTopSummary();
  document.addEventListener('submit',function(e){ if(e.target&&e.target.id==='orderForm')ensureDeviceInput(); },true);
  document.addEventListener('DOMContentLoaded',function(){ensureDeviceInput();cleanCartTopSummary();});
  const cart=document.getElementById('cartSection');
  if(cart && 'MutationObserver' in window){ new MutationObserver(cleanCartTopSummary).observe(cart,{childList:true,subtree:true}); }
})();

/* moba-v120-cart-admin-ux */
(function(){
  if(window.__mobaV120CartUx)return; window.__mobaV120CartUx=true;
  function qs(s,r=document){return r.querySelector(s)}
  function ensureDeviceId(){
    let id=localStorage.getItem('moba_device_id');
    if(!id){id='dev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);localStorage.setItem('moba_device_id',id)}
    return id;
  }
  document.addEventListener('submit',function(e){
    const form=e.target;
    if(!form || !form.querySelector || !form.querySelector('[name="customerPhone"]')) return;
    let d=form.querySelector('[name="deviceId"]');
    if(!d){d=document.createElement('input');d.type='hidden';d.name='deviceId';form.appendChild(d)}
    d.value=ensureDeviceId();
  },true);
  function addCartGuides(){
    const cart=document.getElementById('cartSection') || document.querySelector('.cart');
    if(!cart) return;
    if(!qs('.cart-v120-steps',cart)){
      const h=cart.querySelector('h2') || cart.firstElementChild;
      const box=document.createElement('div');
      box.className='cart-v120-steps';
      box.innerHTML='<span>راجع المنتجات</span><span>اختار الدفع</span><span>ارفع السكرين</span><span>نفذ الطلب</span>';
      if(h) h.insertAdjacentElement('afterend',box); else cart.prepend(box);
    }
    if(!qs('.cart-v120-policy',cart)){
      const box=document.createElement('div');
      box.className='cart-v120-policy';
      box.innerHTML='<b>سياسة الطلب</b><small>راجع ID واسم الحساب قبل الدفع. السكرين لازم يكون واضح. الطلبات خارج المواعيد بتتسجل والتنفيذ يبدأ وقت التشغيل. أي ID غلط بعد التأكيد مسؤولية العميل.</small>';
      const form=cart.querySelector('form');
      if(form) form.insertAdjacentElement('beforebegin',box); else cart.appendChild(box);
    }
  }
  document.addEventListener('DOMContentLoaded',addCartGuides);
  setTimeout(addCartGuides,500);
  const old=window.renderCart;
  if(typeof old==='function'){
    window.renderCart=function(){const r=old.apply(this,arguments);setTimeout(addCartGuides,20);return r}
  }
})();
