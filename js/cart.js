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
      try{const res=await fetch('/api/fix-order',{method:'POST',body:fd}); const data=await res.json(); if(!data.ok) throw new Error(data.error||'حصل خطأ'); alert('✅ تم إرسال التعديل'); loadOrderStatus(order.phone);}
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

/* moba-v151-native-screenshot-input-fix */
(function(){
  if(window.__mobaV151ScreenshotUploadFix)return;
  window.__mobaV151ScreenshotUploadFix=true;
  function qs(s,r=document){return r.querySelector(s)}
  function ensureShotUi(){
    if(window.__mobaV156PharaohStyleUpload)return;
    const input=qs('#orderForm input[type="file"][name="screenshot"]');
    if(!input || input.dataset.v151Ready)return;
    input.dataset.v151Ready='1';
    input.classList.remove('v148-hidden-file');
    input.classList.add('screenshot-native-v151');
    input.removeAttribute('hidden');
    input.removeAttribute('aria-hidden');
    input.disabled=false;
    const wrap=input.closest('div')||input.parentElement;
    if(wrap){
      wrap.classList.remove('screenshot-upload-v148');
      wrap.classList.add('screenshot-upload-v151');
    }
    if(!input.id) input.id='orderScreenshotInputV151';
    document.querySelectorAll('.screenshot-pick-v148').forEach(function(el){el.remove()});
    const name=document.createElement('span');
    name.className='screenshot-name-v151';
    name.textContent='لم يتم اختيار صورة بعد';
    input.insertAdjacentElement('afterend',name);
    input.addEventListener('change',function(){
      const file=input.files&&input.files[0];
      name.textContent=file?file.name:'لم يتم اختيار صورة بعد';
      try{
        const st=qs('#status');
        if(st && file && st.classList.contains('err') && /سكرين|صورة/.test(st.textContent||'')){
          st.className='status';
          st.textContent='';
        }
      }catch(e){}
    });
  }
  document.addEventListener('DOMContentLoaded',ensureShotUi);
  setTimeout(ensureShotUi,300);
  setTimeout(ensureShotUi,1200);
})();

/* moba-v152-cart-two-step-cleanup */
(function(){
  if(window.__mobaV152CartCleanup)return;
  window.__mobaV152CartCleanup=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function cleanOldGuides(){
    const cart=qs('#cartSection');
    if(!cart)return;
    qsa('.cart-flow-v119,.cart-policy-v119,.cart-v120-steps',cart).forEach(function(el){el.remove()});
  }
  function enforceTwoStep(){
    cleanOldGuides();
    try{window.mobaCartStepV145&&window.mobaCartStepV145.ensure&&window.mobaCartStepV145.ensure()}catch(e){}
    const cart=qs('#cartSection');
    const stepper=qs('#cartStepperV145',cart||document);
    const form=qs('#orderForm');
    const paymentBody=qs('#cartPaymentStepBodyV145');
    if(form&&paymentBody&&!paymentBody.contains(form))paymentBody.appendChild(form);
    if(cart&&!cart.dataset.cartStep)cart.dataset.cartStep='products';
    if(!document.body.dataset.cartStep)document.body.dataset.cartStep=(cart&&cart.dataset.cartStep)||'products';
    if(stepper){
      qsa('.cart-step-card-v145',stepper).forEach(function(card){
        const active=card.dataset.step===((cart&&cart.dataset.cartStep)||document.body.dataset.cartStep||'products');
        card.classList.toggle('is-active',active);
      });
    }
  }
  document.addEventListener('DOMContentLoaded',enforceTwoStep);
  window.addEventListener('load',enforceTwoStep);
  [100,500,1200,2200].forEach(function(ms){setTimeout(enforceTwoStep,ms)});
  document.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('#cartGoPaymentV145,[data-cart-step-open],#cartBackProductsV145')){
      setTimeout(enforceTwoStep,30);
    }
  },true);
})();

/* moba-v153-screenshot-full-tap-upload */
(function(){
  if(window.__mobaV153ScreenshotFullTap)return;
  window.__mobaV153ScreenshotFullTap=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function ensureUpload(){
    if(window.__mobaV156PharaohStyleUpload)return;
    const input=qs('#orderForm input[type="file"][name="screenshot"]');
    if(!input)return;
    input.removeAttribute('hidden');
    input.removeAttribute('aria-hidden');
    input.disabled=false;
    input.classList.add('screenshot-native-v153');
    const holder=input.closest('.screenshot-field-v153') || input.parentElement;
    if(!holder)return;
    holder.classList.add('screenshot-field-v153');
    qsa(':scope > label',holder).forEach(function(label){
      if(!label.contains(input)) label.remove();
    });
    qsa('.screenshot-name-v151,.screenshot-name-v153,.screenshot-upload-title-v153,.screenshot-upload-v153',holder).forEach(function(el){
      if(!el.contains(input)) el.remove();
    });
    let title=qs('.screenshot-upload-title-v153',holder);
    if(!title){
      title=document.createElement('div');
      title.className='screenshot-upload-title-v153';
      title.textContent='سكرين التحويل';
      holder.insertBefore(title,holder.firstChild);
    }
    let zone=input.closest('.screenshot-upload-v153');
    if(!zone){
      zone=document.createElement('label');
      zone.className='screenshot-upload-v153';
      zone.setAttribute('for',input.id || 'orderScreenshotInputV153');
      if(!input.id) input.id='orderScreenshotInputV153';
      zone.innerHTML='<span class="screenshot-upload-icon-v153">📸</span><span class="screenshot-upload-text-v153"><b>اضغط هنا لاختيار صورة التحويل</b><small>المعرض أو الملفات هيفتح من نفس الخانة</small></span>';
      holder.appendChild(zone);
      zone.appendChild(input);
    }
    let name=qs('.screenshot-name-v153',holder);
    if(!name){
      name=document.createElement('div');
      name.className='screenshot-name-v153';
      holder.appendChild(name);
    }
    const file=input.files&&input.files[0];
    name.textContent=file?('تم اختيار: '+file.name):'لم يتم اختيار صورة بعد';
  }
  document.addEventListener('DOMContentLoaded',ensureUpload);
  window.addEventListener('load',ensureUpload);
  document.addEventListener('change',function(e){
    if(e.target&&e.target.matches&&e.target.matches('#orderForm input[type="file"][name="screenshot"]')) ensureUpload();
  },true);
  [100,400,1000,1800,3000].forEach(function(ms){setTimeout(ensureUpload,ms)});
})();

/* moba-v154-plain-native-file-upload */
(function(){
  if(window.__mobaV154PlainNativeUpload)return;
  window.__mobaV154PlainNativeUpload=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function normalizeUpload(){
    if(window.__mobaV156PharaohStyleUpload)return;
    const input=qs('#orderForm input[type="file"][name="screenshot"]');
    if(!input)return;
    const zone=input.closest('.screenshot-upload-v153');
    const holder=zone ? (zone.closest('.screenshot-field-v153') || zone.parentElement) : (input.closest('.screenshot-field-v153') || input.parentElement);
    if(zone && holder){
      holder.appendChild(input);
      zone.remove();
    }
    if(holder){
      holder.classList.add('screenshot-plain-field-v154');
      holder.classList.remove('screenshot-field-v153','screenshot-upload-v151','screenshot-upload-v148');
      qsa('.screenshot-upload-title-v153,.screenshot-name-v153,.screenshot-name-v151,.screenshot-pick-v148',holder).forEach(function(el){el.remove()});
      let label=qs('.screenshot-plain-label-v154',holder);
      if(!label){
        label=document.createElement('label');
        label.className='screenshot-plain-label-v154';
        label.textContent='سكرين التحويل';
        holder.insertBefore(label,input);
      }
    }
    input.removeAttribute('hidden');
    input.removeAttribute('aria-hidden');
    input.disabled=false;
    input.className='file screenshot-plain-input-v154';
    input.style.cssText='';
    if(!input.id)input.id='orderScreenshotInputV154';
  }
  document.addEventListener('DOMContentLoaded',normalizeUpload);
  window.addEventListener('load',normalizeUpload);
  document.addEventListener('change',function(e){
    if(e.target&&e.target.matches&&e.target.matches('#orderForm input[type="file"][name="screenshot"]')) normalizeUpload();
  },true);
  [50,150,350,700,1200,2000,3200,4500].forEach(function(ms){setTimeout(normalizeUpload,ms)});
})();

/* moba-v156-pharaoh-style-cart-screenshot-upload */
(function(){
  if(window.__mobaV156PharaohStyleUploadInstalled)return;
  window.__mobaV156PharaohStyleUploadInstalled=true;
  window.__mobaV156PharaohStyleUpload=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function install(){
    if(window.__mobaV158NativeScreenshotInput)return;
    const form=qs('#orderForm');
    if(!form)return;
    let old=qs('input[type="file"][name="screenshot"]',form);
    let field=old&&old.closest('div');
    if(!field){
      const note=qs('textarea[name="note"]',form)?.closest('div');
      field=document.createElement('div');
      if(note)note.insertAdjacentElement('beforebegin',field); else form.appendChild(field);
    }
    field.className='cart-shot-field-v156';
    qsa('.screenshot-upload-v153,.screenshot-upload-title-v153,.screenshot-name-v153,.screenshot-name-v151,.screenshot-pick-v148,.screenshot-plain-label-v154,.cart-shot-name-v156',field).forEach(el=>el.remove());
    qsa('label',field).forEach(label=>{if(!label.contains(old))label.remove()});
    if(!old || old.dataset.v156Replaced!=='1'){
      const fresh=document.createElement('input');
      fresh.type='file';
      fresh.name='screenshot';
      fresh.accept='image/*';
      fresh.required=true;
      fresh.id='orderScreenshotInputV156';
      fresh.className='pharaoh-v91-file cart-shot-input-v156';
      fresh.dataset.v156Replaced='1';
      if(old) old.replaceWith(fresh); else field.appendChild(fresh);
      old=fresh;
    }
    old.type='file';
    old.name='screenshot';
    old.accept='image/*';
    old.required=true;
    old.disabled=false;
    old.hidden=false;
    old.removeAttribute('aria-hidden');
    old.id='orderScreenshotInputV156';
    old.className='pharaoh-v91-file cart-shot-input-v156';
    old.style.cssText='';
    if(!qs('.cart-shot-label-v156',field)){
      const label=document.createElement('label');
      label.className='cart-shot-label-v156';
      label.setAttribute('for',old.id);
      label.textContent='سكرين التحويل';
      field.insertBefore(label,old);
    }
    if(!qs('.cart-shot-name-v156',field)){
      const name=document.createElement('div');
      name.className='cart-shot-name-v156';
      name.textContent=(old.files&&old.files[0])?old.files[0].name:'لم يتم اختيار ملف بعد';
      old.insertAdjacentElement('afterend',name);
    }
  }
  document.addEventListener('change',function(e){
    if(e.target&&e.target.matches&&e.target.matches('#orderForm input[type="file"][name="screenshot"]')){
      const out=qs('.cart-shot-name-v156',e.target.closest('.cart-shot-field-v156')||document);
      if(out)out.textContent=(e.target.files&&e.target.files[0])?e.target.files[0].name:'لم يتم اختيار ملف بعد';
      const st=qs('#status');
      if(st&&e.target.files&&e.target.files[0]&&st.classList.contains('err')){
        st.className='status';
        st.textContent='';
      }
    }
  },true);
  document.addEventListener('DOMContentLoaded',install);
  window.addEventListener('load',install);
  [20,100,250,600,1200,2200,3600,5200].forEach(ms=>setTimeout(install,ms));
})();

/* moba-v157-rebuild-real-screenshot-input */
(function(){
  if(window.__mobaV157RealScreenshotInput)return;
  window.__mobaV157RealScreenshotInput=true;
  window.__mobaV156PharaohStyleUpload=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function rebuild(){
    const form=qs('#orderForm');
    if(!form)return;
    const existing=qs('#orderScreenshotInputV157',form);
    if(existing && existing.isConnected)return;
    const noteWrap=qs('textarea[name="note"]',form)?.closest('div');
    let field=qs('.cart-shot-field-v157',form) || qs('.cart-shot-field-v156',form);
    if(!field){
      const any=qs('input[type="file"][name="screenshot"]',form);
      field=any&&any.closest('div');
    }
    if(!field){
      field=document.createElement('div');
      if(noteWrap)noteWrap.insertAdjacentElement('beforebegin',field); else form.appendChild(field);
    }
    const oldFiles=qsa('input[type="file"][name="screenshot"]',form);
    const picked=oldFiles.find(x=>x.files&&x.files.length);
    field.innerHTML='';
    field.className='cart-shot-field-v157';
    const label=document.createElement('label');
    label.className='cart-shot-label-v157';
    label.setAttribute('for','orderScreenshotInputV157');
    label.textContent='سكرين التحويل';
    const input=document.createElement('input');
    input.type='file';
    input.name='screenshot';
    input.accept='image/*';
    input.required=true;
    input.id='orderScreenshotInputV157';
    input.className='pharaoh-v91-file cart-shot-input-v157';
    const name=document.createElement('div');
    name.className='cart-shot-name-v157';
    name.textContent=picked&&picked.files&&picked.files[0]?picked.files[0].name:'لم يتم اختيار ملف بعد';
    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(name);
    oldFiles.forEach(function(x){
      if(x!==input && x.parentElement && !field.contains(x)){
        x.remove();
      }
    });
  }
  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='orderScreenshotInputV157'){
      const out=qs('.cart-shot-name-v157',e.target.closest('.cart-shot-field-v157')||document);
      out&&(out.textContent=(e.target.files&&e.target.files[0])?e.target.files[0].name:'لم يتم اختيار ملف بعد');
      const st=qs('#status');
      if(st&&e.target.files&&e.target.files[0]&&st.classList.contains('err')){
        st.className='status';
        st.textContent='';
      }
    }
  },true);
  document.addEventListener('DOMContentLoaded',rebuild);
  window.addEventListener('load',rebuild);
  [10,80,180,400,900,1600,2800,4200,6500].forEach(ms=>setTimeout(rebuild,ms));
})();

/* moba-v158-native-screenshot-input-final */
(function(){
  if(window.__mobaV158NativeScreenshotInput)return;
  window.__mobaV158NativeScreenshotInput=true;
  window.__mobaV156PharaohStyleUpload=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function ensureNativeInput(){
    if(window.__mobaV160FreshCheckoutUpload)return;
    const form=qs('#orderForm');
    if(!form)return;
    let current=qs('#orderScreenshotInputV158',form);
    if(current && current.isConnected)return;

    const noteWrap=qs('textarea[name="note"]',form)?.closest('div');
    let field=qs('.cart-shot-field-v158',form) || qs('.cart-shot-field-v157',form) || qs('.cart-shot-field-v156',form);
    if(!field){
      const old=qs('input[type="file"][name="screenshot"]',form);
      field=old&&old.closest('div');
    }
    if(!field){
      field=document.createElement('div');
      if(noteWrap)noteWrap.insertAdjacentElement('beforebegin',field); else form.appendChild(field);
    }

    const picked=qsa('input[type="file"][name="screenshot"]',form).find(function(x){
      return x.files&&x.files.length;
    });
    if(picked && picked.id==='orderScreenshotInputV158'){
      return;
    }

    field.className='cart-shot-field-v158';
    field.innerHTML='';

    const label=document.createElement('label');
    label.className='cart-shot-label-v158';
    label.setAttribute('for','orderScreenshotInputV158');
    label.textContent='سكرين التحويل';

    const input=document.createElement('input');
    input.type='file';
    input.name='screenshot';
    input.accept='image/*';
    input.required=true;
    input.id='orderScreenshotInputV158';
    input.className='cart-shot-input-v158';
    input.removeAttribute('hidden');
    input.removeAttribute('aria-hidden');
    input.disabled=false;
    input.style.cssText='';

    const help=document.createElement('div');
    help.className='cart-shot-help-v158';
    help.textContent='اختار صورة واضحة للتحويل من المعرض أو الملفات.';

    const name=document.createElement('div');
    name.className='cart-shot-name-v158';
    name.textContent=picked&&picked.files&&picked.files[0]?picked.files[0].name:'لم يتم اختيار ملف بعد';

    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(help);
    field.appendChild(name);

    qsa('input[type="file"][name="screenshot"]',form).forEach(function(x){
      if(x!==input && x.parentElement && !field.contains(x))x.remove();
    });
  }
  window.mobaEnsureScreenshotInputV158=ensureNativeInput;
  document.addEventListener('change',function(e){
    if(e.target&&e.target.matches&&e.target.matches('#orderForm input[type="file"][name="screenshot"]')){
      const out=qs('.cart-shot-name-v158',e.target.closest('.cart-shot-field-v158')||document);
      if(out)out.textContent=(e.target.files&&e.target.files[0])?e.target.files[0].name:'لم يتم اختيار ملف بعد';
      const st=qs('#status');
      if(st&&e.target.files&&e.target.files[0]&&st.classList.contains('err')){
        st.className='status';
        st.textContent='';
      }
    }
  },true);
  document.addEventListener('DOMContentLoaded',ensureNativeInput);
  window.addEventListener('load',ensureNativeInput);
  document.addEventListener('cart:rendered',ensureNativeInput);
  [10,60,140,320,700,1300,2300,3600,5600,8000].forEach(function(ms){setTimeout(ensureNativeInput,ms)});
})();

/* moba-v146-cart-step-click-hard-fix */
(function(){
  if(window.__mobaV146CartStepClickFix)return;
  window.__mobaV146CartStepClickFix=true;
  function qs(s,r=document){return r.querySelector(s)}
  function hasItems(){
    try{
      if(Array.isArray(window.cart) && window.cart.length) return true;
      const saved=JSON.parse(localStorage.getItem('moba_cart')||'[]');
      if(Array.isArray(saved) && saved.length) return true;
    }catch(e){}
    return !!qs('#cartBox .cart-item,#cartBox .cart-item-v60');
  }
  function applyStep(step){
    const cart=qs('#cartSection');
    if(!cart)return;
    if(step==='payment' && !hasItems()){
      step='products';
      const lock=qs('#cartStepLockV145');
      if(lock){lock.style.display='block';lock.textContent='ضيف منتج للسلة الأول وبعدها تقدر تكمل الدفع.'}
    }
    cart.dataset.cartStep=step;
    document.body.dataset.cartStep=step;
    cart.querySelectorAll('.cart-step-card-v145').forEach(card=>{
      const active=card.dataset.step===step;
      card.classList.toggle('is-active',active);
      const arrow=card.querySelector('.cart-step-arrow-v145');
      if(arrow) arrow.textContent=active?'▲':'▼';
    });
    const payment=qs('.cart-step-card-v145[data-step="payment"]',cart);
    if(payment) payment.classList.toggle('is-disabled',!hasItems());
  }
  function toggleCoupon(){
    const box=qs('#couponBox');
    if(!box)return;
    const btn=qs('.coupon-toggle-v78',box);
    const open=box.classList.toggle('is-open');
    if(btn) btn.setAttribute('aria-expanded',open?'true':'false');
    if(open){
      const input=qs('#couponInput');
      setTimeout(()=>{try{input&&input.focus({preventScroll:true})}catch(e){}},60);
    }
  }
  document.addEventListener('click',function(e){
    const coupon=e.target.closest&&e.target.closest('#couponBox .coupon-toggle-v78');
    if(coupon){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      toggleCoupon();
      return false;
    }
    const goPay=e.target.closest&&e.target.closest('#cartGoPaymentV145');
    if(goPay){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      applyStep('payment');
      return false;
    }
    const goBack=e.target.closest&&e.target.closest('#cartBackProductsV145');
    if(goBack){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      applyStep('products');
      return false;
    }
    const head=e.target.closest&&e.target.closest('[data-cart-step-open]');
    if(head){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      applyStep(head.dataset.cartStepOpen||'products');
      return false;
    }
  },true);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>applyStep('products'),250));
})();

/* moba-v145-two-step-cart */
(function(){
  if(window.__mobaV145TwoStepCart)return;
  window.__mobaV145TwoStepCart=true;
  const qs=(s,r=document)=>r.querySelector(s);
  function cartItems(){
    try{return JSON.parse(localStorage.getItem('moba_cart')||'[]')||[]}catch(e){return []}
  }
  function hasItems(){return cartItems().length>0}
  function setStep(step){
    const cart=qs('#cartSection');
    if(!cart)return;
    if(step==='payment' && !hasItems()){
      step='products';
      const lock=qs('#cartStepLockV145');
      if(lock) lock.textContent='ضيف منتج للسلة الأول وبعدها تقدر تكمل الدفع.';
    }
    cart.dataset.cartStep=step;
    document.body.dataset.cartStep=step;
    cart.querySelectorAll('.cart-step-card-v145').forEach(card=>{
      const active=card.dataset.step===step;
      card.classList.toggle('is-active',active);
      const arrow=card.querySelector('.cart-step-arrow-v145');
      if(arrow) arrow.textContent=active?'▲':'▼';
    });
    updateStepState();
  }
  function updateStepState(){
    if(window.__mobaV161CleanCheckout)return;
    const cart=qs('#cartSection');
    if(!cart)return;
    const ok=hasItems();
    const payment=qs('.cart-step-card-v145[data-step="payment"]',cart);
    const lock=qs('#cartStepLockV145',cart);
    if(payment) payment.classList.toggle('is-disabled',!ok);
    if(lock) lock.style.display=ok?'none':'block';
  }
  function ensureTwoStep(){
    if(window.__mobaV161CleanCheckout)return;
    const cart=qs('#cartSection');
    const cartBox=qs('#cartBox'), total=qs('#cartSection .total'), coupon=qs('#couponBox'), form=qs('#orderForm');
    if(!cart||!cartBox||!total||!form||qs('#cartStepperV145')){updateStepState();return}
    const oldPolicy=qs('.cart-v120-policy',cart);
    const stepper=document.createElement('div');
    stepper.id='cartStepperV145';
    stepper.className='cart-stepper-v145';
    stepper.innerHTML=`
      <section class="cart-step-card-v145 is-active" data-step="products">
        <button type="button" class="cart-step-head-v145" data-cart-step-open="products">
          <span class="cart-step-num-v145">1</span>
          <span><strong>السلة والمنتجات</strong><small>راجع المنتجات والكميات والكوبون قبل الدفع</small></span>
          <span class="cart-step-arrow-v145">▲</span>
        </button>
        <div class="cart-step-body-v145" id="cartProductsStepBodyV145"></div>
      </section>
      <section class="cart-step-card-v145" data-step="payment">
        <button type="button" class="cart-step-head-v145" data-cart-step-open="payment">
          <span class="cart-step-num-v145">2</span>
          <span><strong>الدفع وتنفيذ الطلب</strong><small>اختار الدفع، ارفع السكرين، ونفذ الطلب</small></span>
          <span class="cart-step-arrow-v145">▼</span>
        </button>
        <div class="cart-step-body-v145" id="cartPaymentStepBodyV145"></div>
      </section>`;
    const h=cart.querySelector('h2');
    if(h) h.insertAdjacentElement('afterend',stepper); else cart.prepend(stepper);
    const productsBody=qs('#cartProductsStepBodyV145',stepper);
    const paymentBody=qs('#cartPaymentStepBodyV145',stepper);
    productsBody.appendChild(cartBox);
    productsBody.appendChild(total);
    if(coupon) productsBody.appendChild(coupon);
    const next=document.createElement('button');
    next.type='button';
    next.className='cart-step-action-v145';
    next.id='cartGoPaymentV145';
    next.textContent='كمل للدفع';
    productsBody.appendChild(next);
    const lock=document.createElement('div');
    lock.id='cartStepLockV145';
    lock.className='cart-step-lock-v145';
    lock.textContent='ضيف منتج للسلة الأول وبعدها تقدر تكمل الدفع.';
    productsBody.appendChild(lock);
    if(oldPolicy) paymentBody.appendChild(oldPolicy);
    paymentBody.appendChild(form);
    const back=document.createElement('button');
    back.type='button';
    back.className='cart-step-action-v145 secondary';
    back.id='cartBackProductsV145';
    back.textContent='رجوع لمراجعة المنتجات';
    paymentBody.insertBefore(back,form);
    stepper.addEventListener('click',function(e){
      const open=e.target.closest('[data-cart-step-open]');
      if(open){setStep(open.dataset.cartStepOpen);return}
      if(e.target.id==='cartGoPaymentV145'){setStep('payment');return}
      if(e.target.id==='cartBackProductsV145'){setStep('products');return}
    });
    setStep('products');
  }
  document.addEventListener('DOMContentLoaded',ensureTwoStep);
  setTimeout(ensureTwoStep,250);
  setTimeout(ensureTwoStep,900);
  document.addEventListener('click',function(e){
    if(e.target.closest('.add,[data-add-to-cart],#clearCart,.remove,.cart-item-v60 .remove')) setTimeout(updateStepState,80);
  },true);
  window.addEventListener('storage',updateStepState);
  const oldRender=window.renderCart;
  if(typeof oldRender==='function'){
    window.renderCart=function(){
      const out=oldRender.apply(this,arguments);
      setTimeout(()=>{ensureTwoStep();updateStepState()},0);
      return out;
    };
  }
  window.mobaCartStepV145={ensure:ensureTwoStep,set:setStep,update:updateStepState};
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


  let PRODUCT_OVERRIDES_LOADED = false;
  async function loadProductOverrides(){
    if(PRODUCT_OVERRIDES_LOADED) return;
    PRODUCT_OVERRIDES_LOADED = true;
    try{
      const r = await fetch('/api/settings?ts=' + Date.now(), {cache:'no-store'});
      const d = await r.json();
      const overrides = d && d.settings && d.settings.product_overrides;
      const dynamicProducts = d && d.settings && Array.isArray(d.settings.dynamic_products) ? d.settings.dynamic_products : [];
      if(dynamicProducts.length){
        Object.keys(PRODUCTS).forEach(cat=>{ PRODUCTS[cat] = []; });
        dynamicProducts
          .filter(p=>p && p.name && !p.hidden)
          .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))
          .forEach(p=>{
            const cat = p.cat || 'uc';
            if(!PRODUCTS[cat]) PRODUCTS[cat]=[];
            const basePrice=Number(p.price||0);
            const salePrice=Number(p.sale_price||p.discount_price||0);
            const finalPrice=salePrice>0&&salePrice<basePrice?salePrice:basePrice;
            const discountWarn=finalPrice<basePrice?`عرض خصم: بدل ${basePrice.toLocaleString('en-US')} جنيه دلوقتي ${finalPrice.toLocaleString('en-US')} جنيه`:'';
            PRODUCTS[cat].push({
              name:String(p.name||''),
              type:p.type || (cat==='uc'?'شحن بالايدي | ID':cat),
              price:finalPrice,
              oldPrice:basePrice,
              sale_price:finalPrice<basePrice?finalPrice:0,
              cost:Number(p.cost||0),
              uc:Number(p.uc||0),
              hot:!!p.hot||!!p.featured,
              noQty:!!p.noQty,
              warning:[discountWarn,p.warning||''].filter(Boolean).join(' - '),
              image:p.image||'',
              cat,
              game:p.game||'pubg',
              placement:p.placement||'normal'
            });
          });
      }else if(overrides && typeof overrides === 'object'){
        Object.keys(PRODUCTS).forEach(cat=>{
          PRODUCTS[cat] = PRODUCTS[cat].map(p=>{
            const ov = overrides[p.name] || overrides[`${cat}:${p.name}`];
            if(!ov || typeof ov !== 'object') return p;
            return {...p, ...ov, hidden: Boolean(ov.hidden)};
          }).filter(p=>!p.hidden);
        });
      }
      window.mobaProducts = PRODUCTS;
    }catch(e){ console.warn('products settings failed', e); }
  }
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
  window.productDrafts = window.productDrafts || {};

  function draftKey(cat,i){ return `${cat}_${i}`; }
  function collectProductDrafts(){
    const cat = window.activeCat || 'uc';
    document.querySelectorAll('#productList .product').forEach(card=>{
      const i = Number(card.getAttribute('data-card-index'));
      if(!Number.isFinite(i)) return;
      const id = card.querySelector('#id_' + i)?.value || '';
      const name = card.querySelector('#name_' + i)?.value || '';
      window.productDrafts[draftKey(cat,i)] = {id,name};
    });
  }
  function restoreProductDrafts(cat){
    Object.entries(window.productDrafts || {}).forEach(([key,value])=>{
      if(!key.startsWith(cat + '_') || !value) return;
      const i = key.slice(cat.length + 1);
      const idEl = document.getElementById('id_' + i);
      const nameEl = document.getElementById('name_' + i);
      if(idEl) idEl.value = value.id || '';
      if(nameEl) nameEl.value = value.name || '';
    });
  }

  function renderProducts(){
    const productList = document.getElementById('productList');
    if(!productList) return;
    if(!PRODUCT_OVERRIDES_LOADED){
      productList.innerHTML='<div class="empty">جاري تحميل المنتجات...</div>';
      loadProductOverrides().then(()=>renderProducts());
      return;
    }
    const cat = window.activeCat || 'uc';
    collectProductDrafts();
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
    restoreProductDrafts(cat);
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
      pubgId,pubgName:name,name,qty,qtyTotal:qty,ucTotal:Number(p.uc||0)*qty,game:'PUBG Mobile'
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

  let PRODUCT_OVERRIDES_LOADED = false;
  async function loadProductOverrides(){ return; }
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
    if(window.__mobaV152CartCleanup)return;
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


/* moba-v126-success-card-helper */
(function(){
  window.mobaShowSuccessCard = function(data){
    try{
      const box=document.createElement('div');
      box.className='modal show';
      box.innerHTML=`<div class="modal-card"><h2>تم استلام طلبك ✅</h2><p>رقم الطلب: <b>${data.orderCode||data.orderId||'-'}</b></p><p>الإجمالي: <b>${Number(data.total||0).toLocaleString('ar-EG')} جنيه</b></p><p>احتفظ برقم المتابعة وافتح صفحة الطلبات لمتابعة الحالة.</p><div class="modal-actions"><button class="okbtn" onclick="location.hash='#trackOrder'; this.closest('.modal').remove()">متابعة الطلب</button><button class="ghost" onclick="this.closest('.modal').remove()">تمام</button></div></div>`;
      document.body.appendChild(box);
    }catch(e){}
  };
})();


/* moba-v129-payment-control */
(function(){
  if(window.__mobaPaymentControlV129) return;
  window.__mobaPaymentControlV129=true;
  const fallback={
    wallet:{enabled:true,status:'available',phone:'01061707294',name:'مؤمن',message:'Vodafone / Orange / Etisalat / WE'},
    instapay:{enabled:true,status:'available',user:'mofr3oon1',phone:'01061707294',name:'مؤمن',link:'https://ipn.eg/S/mofr3oon1/instapay/3ALZfx',message:'حوّل على InstaPay وبعدها ارفع السكرين'}
  };
  function esc(t){return String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function copy(v){ if(window.copyText) window.copyText(v); else navigator.clipboard?.writeText(v); }
  window.mobaPaymentSettings=fallback;
  function normalize(s){s=s||{};return {...fallback,...s,wallet:{...fallback.wallet,...(s.wallet||{})},instapay:{...fallback.instapay,...(s.instapay||{})}}}
  function statusLabel(x){return x==='busy'?'ضغط مراجعة':x==='disabled'?'متوقف':x==='maintenance'?'صيانة':'متاح'}
  function enabled(method){const p=window.mobaPaymentSettings; const d=method==='InstaPay'?p.instapay:p.wallet; return d.enabled!==false && !['disabled','maintenance'].includes(String(d.status||'available'));}
  function updateSelect(){
    const sel=document.getElementById('paymentMethod'); if(!sel) return;
    const val=sel.value;
    sel.innerHTML='<option value="">اختار طريقة الدفع</option>'+
      `<option value="InstaPay" ${enabled('InstaPay')?'':'disabled'}>InstaPay - ${statusLabel(window.mobaPaymentSettings.instapay.status)}</option>`+
      `<option value="Wallet" ${enabled('Wallet')?'':'disabled'}>محفظة - ${statusLabel(window.mobaPaymentSettings.wallet.status)}</option>`;
    if([...sel.options].some(o=>o.value===val && !o.disabled)) sel.value=val;
  }
  function render(){
    const sel=document.getElementById('paymentMethod'), box=document.getElementById('paymentDetails'); if(!sel||!box) return;
    const v=sel.value; if(!v){box.className='payment-details';box.innerHTML='';return;}
    const p=window.mobaPaymentSettings;
    const d=v==='InstaPay'?p.instapay:p.wallet;
    const disabled=!enabled(v);
    box.className='payment-details show';
    if(disabled){box.innerHTML=`<b>طريقة الدفع متوقفة مؤقتا</b><div class="notice">${esc(d.message||'اختار طريقة دفع تانية أو تواصل مع الدعم.')}</div>`;return;}
    if(v==='InstaPay') box.innerHTML=`<b>بيانات InstaPay</b><div class="pay-row"><span>User: ${esc(d.user||'')}</span><button type="button" class="copy" data-pay-copy="${esc(d.user||'')}">نسخ</button></div><div class="pay-row"><span>Phone: ${esc(d.phone||'')}</span><button type="button" class="copy" data-pay-copy="${esc(d.phone||'')}">نسخ</button></div><div class="pay-row"><span>Name: ${esc(d.name||'')}</span><button type="button" class="copy" data-pay-copy="${esc(d.name||'')}">نسخ</button></div>${d.link?`<a class="pay-link" href="${esc(d.link)}" target="_blank" rel="noopener">فتح لينك InstaPay</a>`:''}<div class="notice">${esc(d.message||'حوّل الأول وبعدها ارفع السكرين.')}</div>`;
    else box.innerHTML=`<b>بيانات المحفظة</b><div class="pay-row"><span>Phone: ${esc(d.phone||'')}</span><button type="button" class="copy" data-pay-copy="${esc(d.phone||'')}">نسخ</button></div><div class="pay-row"><span>Name: ${esc(d.name||'')}</span><button type="button" class="copy" data-pay-copy="${esc(d.name||'')}">نسخ</button></div><div class="notice">${esc(d.message||'Vodafone / Orange / Etisalat / WE - حوّل الأول وبعدها ارفع السكرين.')}</div>`;
    ensureHidden(v,d);
  }
  function ensureHidden(method,d){
    const form=document.getElementById('orderForm'); if(!form) return;
    const data={method,destination:method==='InstaPay'?`InstaPay:${d.user}|${d.phone}`:`Wallet:${d.phone}`,name:d.name||'',status:d.status||'available'};
    let inp=form.querySelector('[name="paymentSnapshot"]'); if(!inp){inp=document.createElement('input');inp.type='hidden';inp.name='paymentSnapshot';form.appendChild(inp)}
    inp.value=JSON.stringify(data);
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-pay-copy]'); if(b) copy(b.dataset.payCopy||'')});
  document.addEventListener('change',e=>{if(e.target && e.target.id==='paymentMethod') setTimeout(render,0)},true);
  fetch('/api/settings').then(r=>r.json()).then(d=>{window.mobaPaymentSettings=normalize(d.settings?.payment_settings);updateSelect();render();}).catch(()=>{updateSelect();render();});
})();


/* moba-v135-order-details-close-hard-fix */
(function(){
  if(window.__mobaV135DetailsCloseFix)return;
  window.__mobaV135DetailsCloseFix=true;
  window.closeOrderDetails=function(){
    const modal=document.getElementById('orderDetailsModal');
    if(modal) modal.classList.remove('show');
    document.body.style.overflow='';
  };
  document.addEventListener('click',function(e){
    const btn=e.target.closest && e.target.closest('[data-order-modal-close-btn],.order-details-close');
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      window.closeOrderDetails();
      return false;
    }
    if(e.target && e.target.id==='orderDetailsModal'){
      e.preventDefault();
      window.closeOrderDetails();
    }
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') window.closeOrderDetails();
  },true);
})();

/* moba-v143-order-details-compact-fix */
(function(){
  if(window.__mobaV143OrderDetailsCompact)return;
  window.__mobaV143OrderDetailsCompact=true;
  function esc(t){return String(t??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function money(n){try{return Number(n||0).toLocaleString('ar-EG')+' جنيه';}catch(e){return (n||0)+' جنيه';}}
  function fmtDate(v){try{return new Date(v).toLocaleString('ar-EG',{month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'});}catch(e){return v||'-';}}
  function lineTotal(x){return Number(x.line_total||0)||Number(x.total||0)||Number(x.price||0)*Math.max(1,Number(x.qty||1));}
  function ucTotal(x){
    if(typeof window.itemUcTotal==='function') return window.itemUcTotal(x);
    const qty=Math.max(1,Number(x&&x.qty||1));
    const explicit=Number(x.ucTotal||x.uc_total||0);
    if(explicit) return explicit;
    const line=String(x.product||'').match(/(\d+)\s*UC/i);
    return line ? Number(line[1])*qty : 0;
  }
  function statusText(status){
    const m={pending:'تم استلام الطلب',claimed:'تحت المراجعة',processing:'جاري التنفيذ',delivered:'تم الشحن',archived:'تم الشحن',needs_fix:'محتاج تعديل',rejected:'مرفوض',cancelled:'ملغي',on_hold:'معلق'};
    return m[status]||status||'-';
  }
  function issueType(order){
    const all=[order?.fix_type,order?.status_text,order?.customer_status_text,order?.admin_status_text,order?.note].join(' ').toLowerCase();
    if(/bad[_\s-]?screen|badshot|screenshot|screen|shot|سكرين/.test(all)) return 'bad_screen';
    if(/bad[_\s-]?id|id غلط|ايدي|id/.test(all)) return 'bad_id';
    if(/phone|mobile|رقم/.test(all)) return 'bad_phone';
    if(/amount|price|مبلغ|ناقص/.test(all)) return 'bad_amount';
    return order?.fix_type || 'general';
  }
  function problemText(order){
    const type=issueType(order);
    const map={bad_screen:'السكرين غير واضح. ارفع صورة جديدة يظهر فيها رقم أو اسم التحويل، المبلغ، ووقت التحويل.',bad_id:'ID أو اسم الحساب محتاج تعديل. اكتب البيانات الصحيحة قبل التنفيذ.',bad_phone:'رقم المتابعة محتاج تعديل. اكتب رقم موبايل صحيح يبدأ بـ 01.',bad_amount:'المبلغ غير مطابق. راجع التحويل أو تواصل مع الدعم.',general:'الطلب محتاج تعديل. اكتب المطلوب بوضوح أو اسأل فرعون.'};
    const raw=String(order?.note||order?.status_text||order?.customer_status_text||'').trim();
    if(/سكرين/.test(raw)) return map.bad_screen;
    if(/ID غلط|id غلط/i.test(raw)) return map.bad_id;
    if(/مبلغ|ناقص/.test(raw)) return map.bad_amount;
    return map[type]||map.general;
  }
  function buildFixPanel(order){
    if(!order || order.status!=='needs_fix') return '';
    const type=issueType(order);
    const count=Number(order.fix_count||0);
    const left=Math.max(0,2-count);
    if(left<=0){
      return `<div class="fix-panel-v114"><div class="fix-alert">تم استخدام فرص التعديل المتاحة. تواصل مع الدعم لو المشكلة لسه موجودة.</div><a class="fix-support" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">تواصل مع الدعم</a><button type="button" class="ask-pharaoh-btn" data-ask-pharaoh-issue="${esc(type)}">اسأل فرعون عن المشكلة</button></div>`;
    }
    const screen=type==='bad_screen';
    return `<form class="fix-panel-v114 fix-form" onsubmit="return window.submitOrderFixV114(event,'${esc(order.id)}')">
      <div class="fix-alert"><b>سبب المشكلة:</b> ${esc(problemText(order))}<br>متبقي لك ${left} فرصة تعديل.</div>
      <div class="fix-form-title">إرسال تعديل الطلب</div>
      ${screen ? `<div class="fix-upload-wrap"><label class="fix-upload-trigger">اختار سكرين جديد<input type="file" name="fixFile" accept="image/*" required></label><span class="fix-file-name">لم يتم اختيار ملف بعد</span></div>` : `<textarea class="textarea fix-textarea" name="fixValue" placeholder="اكتب التعديل المطلوب بوضوح" required></textarea>`}
      <input type="hidden" name="phone" value="${esc(order.phone||'')}">
      <input type="hidden" name="fixType" value="${esc(type)}">
      <div class="fix-actions">
        <button class="fix-submit" type="submit">إرسال التعديل</button>
        <button type="button" class="ask-pharaoh-btn" data-ask-pharaoh-issue="${esc(type)}">اسأل فرعون</button>
      </div>
      <a class="fix-support" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">الدعم المباشر</a>
    </form>`;
  }
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
    const fixHtml=buildFixPanel(order);
    const issueHtml=order.status==='needs_fix'?`<div class="order-v143-note"><b>سبب المشكلة</b>${esc(problemText(order))}</div>`:'';
    const products=items.map((x,i)=>`<div class="order-v143-product"><div class="order-v143-product-title">${i+1}) ${esc(x.product||'منتج')}</div><div class="order-v143-product-price">${money(lineTotal(x))}</div><div class="order-v143-product-meta"><span>ID: <code>${esc(x.pubgId||'-')}</code></span><span>الاسم: ${esc(x.pubgName||x.name||'-')}</span><span>الكمية: ${Math.max(1,Number(x.qty||1))}</span><span>الشحنات: ${Number(ucTotal(x)||0).toLocaleString('ar-EG')} UC</span></div></div>`).join('') || '<div class="order-v143-product">لا يوجد منتجات</div>';
    content.innerHTML=`<div class="order-v143-grid">
      <div class="order-v143-summary">
        <div class="order-v143-chip"><span class="k">الحالة</span><span class="v">${statusText(order.status)}</span></div>
        <div class="order-v143-chip"><span class="k">الإجمالي</span><span class="v">${money(order.total)}</span></div>
        <div class="order-v143-chip"><span class="k">المنتجات</span><span class="v">${items.length||0}</span></div>
        <div class="order-v143-chip"><span class="k">الدفع</span><span class="v">${esc(order.payment_method||'-')}</span></div>
        <div class="order-v143-chip"><span class="k">المتابعة</span><span class="v">${esc(order.phone||'-')}</span></div>
        <div class="order-v143-chip"><span class="k">الوقت</span><span class="v">${fmtDate(order.created_at)}</span></div>
      </div>
      <div class="order-v143-main">
        <div class="order-v143-products">${products}</div>
        <div class="order-v143-side">${issueHtml}${fixHtml}</div>
      </div>
    </div>`;
    bindFixUi(content);
    modal.classList.add('show');
    document.body.style.overflow='hidden';
  };
})();

/* moba-v145-two-step-cart-last-bind */
(function(){
  function refreshV145(){
    try{window.mobaCartStepV145&&window.mobaCartStepV145.ensure&&window.mobaCartStepV145.ensure()}catch(e){}
    try{window.mobaCartStepV145&&window.mobaCartStepV145.update&&window.mobaCartStepV145.update()}catch(e){}
  }
  if(window.renderCart && !window.renderCart.__v145LastBound){
    const old=window.renderCart;
    window.renderCart=function(){
      const out=old.apply(this,arguments);
      setTimeout(refreshV145,0);
      return out;
    };
    window.renderCart.__v145LastBound=true;
  }
  document.addEventListener('DOMContentLoaded',refreshV145);
  setTimeout(refreshV145,500);
  setTimeout(refreshV145,1600);
})();

/* moba-v147-payment-step-actions-fix */
(function(){
  if(window.__mobaV147PaymentStepActions)return;
  window.__mobaV147PaymentStepActions=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function checkoutButton(){return qs('#orderForm button[type="submit"],#orderForm input[type="submit"]')}
  function keepCheckoutClickable(){
    const btn=checkoutButton();
    if(!btn)return;
    const busy=/جاري|ارسال|إرسال|sending/i.test(btn.textContent||btn.value||'');
    if(!busy && btn.disabled){
      btn.disabled=false;
      btn.dataset.v147WasDisabled='1';
    }
  }
  function formError(){
    const form=qs('#orderForm');
    if(!form)return '';
    let cart=[];
    try{cart=Array.isArray(window.cart)?window.cart:JSON.parse(localStorage.getItem('moba_cart')||'[]')}catch(e){}
    if(!cart.length)return 'السلة فاضية. ارجع لخطوة المنتجات وضيف منتج الأول.';
    const phone=String(form.querySelector('[name="customerPhone"]')?.value||'').trim();
    if(!/^01\d{9}$/.test(phone))return 'اكتب رقم موبايل صحيح 11 رقم ويبدأ بـ 01.';
    if(!form.querySelector('[name="paymentMethod"]')?.value)return 'اختار طريقة الدفع الأول.';
    if(!form.querySelector('[name="transferMode"]:checked'))return 'اختار التحويل من نفس رقم المتابعة ولا رقم تاني.';
    const other=form.querySelector('[name="transferMode"]:checked')?.value==='other';
    const last3=String(form.querySelector('[name="transferLast3"]')?.value||'').trim();
    if(other && !/^\d{3}$/.test(last3))return 'لو التحويل من رقم تاني اكتب آخر 3 أرقام.';
    const file=form.querySelector('[name="screenshot"]')?.files?.[0];
    if(!file)return 'ارفع سكرين التحويل قبل تنفيذ الطلب.';
    return '';
  }
  function showStatus(msg){
    const st=qs('#status');
    if(st){
      st.className='status err';
      st.textContent=msg;
      try{st.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}
    }else alert(msg);
  }
  document.addEventListener('click',function(e){
    const inPayment=e.target.closest&&e.target.closest('#cartPaymentStepBodyV145,#orderForm,#paymentDetails');
    if(!inPayment)return;
    const pay=e.target.closest('a.pay-link');
    if(pay){
      e.stopPropagation();
      if(pay.href){
        e.preventDefault();
        window.open(pay.href,'_blank','noopener');
      }
      return;
    }
    const copy=e.target.closest('button.copy,[data-pay-copy]');
    if(copy){
      e.preventDefault(); e.stopPropagation();
      const value=copy.dataset.payCopy || copy.previousElementSibling?.textContent?.replace(/^(User|Phone|Name):\s*/i,'').trim() || '';
      if(value){
        try{navigator.clipboard&&navigator.clipboard.writeText(value)}catch(_){}
      }
      return;
    }
    const radioLabel=e.target.closest('.verify-options label');
    if(radioLabel){
      const input=radioLabel.querySelector('input[type="radio"]');
      if(input){
        input.checked=true;
        input.dispatchEvent(new Event('change',{bubbles:true}));
        keepCheckoutClickable();
      }
      return;
    }
    if(e.target.closest('#orderForm input[type="file"][name="screenshot"]')) return;
    const fileWrap=e.target.closest('#orderForm div');
    if(fileWrap && !e.target.matches('input[type="file"]') && /سكرين|screenshot/i.test(fileWrap.textContent||'')){
      const file=qs('input[type="file"][name="screenshot"]',fileWrap);
      if(file){
        return;
      }
    }
    const submit=e.target.closest('#orderForm button[type="submit"],#orderForm input[type="submit"]');
    if(submit){
      const err=formError();
      if(err){
        e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
        showStatus(err);
        keepCheckoutClickable();
        return false;
      }
    }
  },true);
  document.addEventListener('change',function(e){
    if(e.target && e.target.closest && e.target.closest('#orderForm')){
      keepCheckoutClickable();
      setTimeout(keepCheckoutClickable,50);
    }
  },true);
  document.addEventListener('DOMContentLoaded',function(){
    const form=qs('#orderForm');
    if(form) form.noValidate=true;
    keepCheckoutClickable();
  });
  setInterval(keepCheckoutClickable,700);
})();

/* moba-v158-render-hook-for-screenshot-input */
(function(){
  if(window.__mobaV158RenderHook)return;
  window.__mobaV158RenderHook=true;
  function ensure(){
    try{
      if(typeof window.mobaEnsureScreenshotInputV158==='function')window.mobaEnsureScreenshotInputV158();
    }catch(e){}
  }
  const old=window.renderCart;
  if(typeof old==='function'){
    window.renderCart=function(){
      const out=old.apply(this,arguments);
      setTimeout(ensure,0);
      setTimeout(ensure,80);
      return out;
    };
  }
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#cartSection,#orderForm')){
      if(e.target.closest('#orderForm input[type="file"][name="screenshot"],#orderForm .cart-shot-field-v158'))return;
      setTimeout(ensure,0);
      setTimeout(ensure,120);
    }
  },true);
  document.addEventListener('DOMContentLoaded',ensure);
  window.addEventListener('load',ensure);
  setTimeout(ensure,300);
  setTimeout(ensure,1200);
})();

/* moba-v160-fresh-checkout-screenshot-upload */
(function(){
  if(window.__mobaV160FreshCheckoutUploadInstalled)return;
  window.__mobaV160FreshCheckoutUploadInstalled=true;
  window.__mobaV160FreshCheckoutUpload=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function build(){
    if(window.__mobaV161CleanCheckout)return;
    const form=qs('#orderForm');
    if(!form)return;
    let block=qs('#checkoutScreenshotBlockV160',form);
    const noteWrap=qs('textarea[name="note"]',form)?.closest('div');
    const submit=qs('button[type="submit"],input[type="submit"]',form);
    if(!block){
      block=document.createElement('div');
      block.id='checkoutScreenshotBlockV160';
      block.className='checkout-shot-block-v160';
      if(noteWrap)noteWrap.insertAdjacentElement('beforebegin',block);
      else if(submit)submit.insertAdjacentElement('beforebegin',block);
      else form.appendChild(block);
    }
    block.className='checkout-shot-block-v160';
    qsa('input[type="file"][name="screenshot"]',form).forEach(function(input){
      if(input.id!=='checkoutScreenshotV160')input.remove();
    });
    let input=qs('#checkoutScreenshotV160',block);
    if(!input){
      block.innerHTML='';
      const label=document.createElement('label');
      label.setAttribute('for','checkoutScreenshotV160');
      label.textContent='📸 ارفع سكرين التحويل';
      input=document.createElement('input');
      input.id='checkoutScreenshotV160';
      input.className='file checkout-shot-input-v160';
      input.type='file';
      input.name='screenshot';
      input.accept='image/*';
      input.required=true;
      const name=document.createElement('small');
      name.id='checkoutScreenshotNameV160';
      name.textContent='لم يتم اختيار صورة بعد';
      block.appendChild(label);
      block.appendChild(input);
      block.appendChild(name);
    }else{
      input.type='file';
      input.name='screenshot';
      input.accept='image/*';
      input.required=true;
      input.disabled=false;
      input.hidden=false;
      input.removeAttribute('aria-hidden');
      input.className='file checkout-shot-input-v160';
      input.style.cssText='';
      if(!qs('label[for="checkoutScreenshotV160"]',block)){
        const label=document.createElement('label');
        label.setAttribute('for','checkoutScreenshotV160');
        label.textContent='📸 ارفع سكرين التحويل';
        block.insertBefore(label,input);
      }
      if(!qs('#checkoutScreenshotNameV160',block)){
        const name=document.createElement('small');
        name.id='checkoutScreenshotNameV160';
        name.textContent='لم يتم اختيار صورة بعد';
        input.insertAdjacentElement('afterend',name);
      }
    }
    qsa('.cart-shot-field-v156,.cart-shot-field-v157,.cart-shot-field-v158,.screenshot-upload-v153,.screenshot-plain-field-v154',form).forEach(function(el){
      if(el!==block && !el.contains(input))el.remove();
    });
  }
  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='checkoutScreenshotV160'){
      const file=e.target.files&&e.target.files[0];
      const name=qs('#checkoutScreenshotNameV160');
      if(name)name.textContent=file?('تم اختيار: '+file.name):'لم يتم اختيار صورة بعد';
      const st=qs('#status');
      if(st&&file&&st.classList.contains('err')){
        st.className='status';
        st.textContent='';
      }
    }
  },true);
  document.addEventListener('DOMContentLoaded',build);
  window.addEventListener('load',build);
  const old=window.renderCart;
  if(typeof old==='function'){
    window.renderCart=function(){
      const out=old.apply(this,arguments);
      setTimeout(build,0);
      setTimeout(build,100);
      return out;
    };
  }
  [10,80,200,500,1000,2000,3500,6000].forEach(function(ms){setTimeout(build,ms)});
})();

/* moba-v161-clean-cart-and-payment-rebuild */
(function(){
  if(window.__mobaV161CleanCheckout)return;
  window.__mobaV161CleanCheckout=true;
  const SUPPORT='https://t.me/MOFR3OON';
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(v){return String(v??'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function cart(){
    try{
      const fromWin=Array.isArray(window.cart)?window.cart:null;
      const saved=JSON.parse(localStorage.getItem('moba_cart')||'[]');
      return Array.isArray(saved)&&saved.length?saved:(fromWin||[]);
    }catch(e){return Array.isArray(window.cart)?window.cart:[]}
  }
  function save(c){
    try{localStorage.setItem('moba_cart',JSON.stringify(c));window.cart=c}catch(e){}
  }
  function qty(x){return Math.max(1,Number(x.qty||1))}
  function price(x){return Number(x.price||x.amount||0)}
  function ucEach(x){const m=String(x.product||x.name||'').match(/(\d+)\s*UC/i);return m?Number(m[1]):Number(x.uc||0)}
  function total(c){return c.reduce((s,x)=>s+price(x)*qty(x),0)}
  function ucTotal(c){return c.reduce((s,x)=>s+ucEach(x)*qty(x),0)}
  function coupon(){
    try{return window.appliedCoupon||JSON.parse(localStorage.getItem('moba_coupon')||'null')}catch(e){return window.appliedCoupon||null}
  }
  function totals(c){
    const subtotal=total(c), cp=coupon();
    const discount=cp?Math.min(Number(cp.discount_amount||cp.value||0),subtotal):0;
    return {subtotal,discount,final:Math.max(0,subtotal-discount),coupon:cp};
  }
  function lastSuccess(){
    try{return JSON.parse(localStorage.getItem('moba_last_order_success')||'null')}catch(e){return null}
  }
  function clearSuccess(){
    try{localStorage.removeItem('moba_last_order_success')}catch(e){}
    render();
  }
  function setStep(step){
    const root=qs('#cartSection');
    if(!root)return;
    root.dataset.cleanStep=step;
    qsa('[data-v161-panel]',root).forEach(p=>p.hidden=p.dataset.v161Panel!==step);
    qsa('[data-v161-tab]',root).forEach(b=>b.classList.toggle('active',b.dataset.v161Tab===step));
    try{root.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  }
  function paymentDetails(method){
    if(method==='Wallet'){
      return '<div class="clean-pay-box-v161"><b>بيانات المحفظة</b><div>Phone: <button type="button" data-copy-v161="01061707294">01061707294</button></div><div>Name: مؤمن</div><small>Vodafone / Orange / Etisalat / WE</small></div>';
    }
    if(method==='InstaPay'){
      return '<div class="clean-pay-box-v161"><b>بيانات InstaPay</b><div>User: <button type="button" data-copy-v161="mofr3oon1">mofr3oon1</button></div><div>Phone: <button type="button" data-copy-v161="01061707294">01061707294</button></div><div>Name: مؤمن</div><a href="https://ipn.eg/S/mofr3oon1/instapay/3ALZfx" target="_blank" rel="noopener">فتح لينك InstaPay</a></div>';
    }
    return '<div class="clean-pay-box-v161 muted">اختار طريقة الدفع عشان تظهر البيانات.</div>';
  }
  function render(){
    const root=qs('#cartSection');
    if(!root)return;
    const c=cart();
    window.cart=c;
    const t=totals(c);
    const money=t.final;
    root.classList.add('clean-cart-v161');
    const done=lastSuccess();
    if(done && !c.length){
      root.innerHTML=`
        <div class="clean-success-v165">
          <div class="clean-success-icon-v165">✓</div>
          <h2>تم استلام طلبك بنجاح</h2>
          <p>طلبك اتسجل عندنا وبيتم مراجعته يدويًا للتأكد من بيانات الحساب والدفع قبل التنفيذ. أول ما المراجعة تخلص هتقدر تتابع الحالة من صفحة طلباتي بنفس رقم الموبايل.</p>
          <div class="clean-success-grid-v165">
            <div><span>رقم الطلب</span><b>${esc(done.orderCode||done.orderId||'MOBA')}</b></div>
            <div><span>رقم المتابعة</span><b>${esc(done.phone||'-')}</b></div>
            <div><span>الإجمالي</span><b>${Number(done.total||0).toLocaleString('en-US')} جنيه</b></div>
            <div><span>الحالة</span><b>تحت المراجعة</b></div>
          </div>
          <div class="clean-success-actions-v165">
            <button type="button" data-success-track>تابع الطلب</button>
            <button type="button" data-success-new>طلب جديد</button>
          </div>
        </div>`;
      const track=qs('[data-success-track]',root);
      if(track)track.onclick=function(){const input=qs('#trackPhone');if(input)input.value=done.phone||'';location.hash='trackOrder';qs('#trackOrder')?.scrollIntoView({behavior:'smooth'})};
      const fresh=qs('[data-success-new]',root);
      if(fresh)fresh.onclick=clearSuccess;
      return;
    }
    root.innerHTML=`
      <div class="clean-cart-head-v161">
        <button type="button" class="clean-back-v161" data-v161-products>رجوع للمنتجات</button>
        <div><h2>السلة والدفع</h2><small>راجع المنتجات، وبعدها افتح صفحة الدفع</small></div>
      </div>
      <div class="clean-tabs-v161">
        <button type="button" data-v161-tab="cart">1 السلة</button>
        <button type="button" data-v161-tab="pay">2 الدفع</button>
      </div>
      <section data-v161-panel="cart">
        <div class="clean-summary-v161">
          <div><b>${c.length}</b><span>منتجات</span></div>
          <div><b>${ucTotal(c).toLocaleString('en-US')}</b><span>UC</span></div>
          <div><b>${money.toLocaleString('en-US')}</b><span>بعد الخصم</span></div>
        </div>
        <div id="cartBox" class="clean-items-v161">
          ${c.length?c.map((it,i)=>`
            <article class="clean-item-v161">
              <button type="button" data-v161-remove="${i}">حذف</button>
              <h3>${esc(it.product||it.name||'منتج')}</h3>
              <div class="clean-item-grid-v161">
                <span>ID: <b>${esc(it.pubgId||it.id||'-')}</b></span>
                <span>Name: <b>${esc(it.pubgName||it.nameInGame||it.name||'-')}</b></span>
              </div>
              <div class="clean-qty-v161">
                <span>الكمية</span>
                <button type="button" data-v161-qty="${i}" data-dir="-1">-</button>
                <b>${qty(it)}</b>
                <button type="button" data-v161-qty="${i}" data-dir="1">+</button>
              </div>
              <div class="clean-line-v161">${price(it).toLocaleString('en-US')} جنيه × ${qty(it)} = <b>${(price(it)*qty(it)).toLocaleString('en-US')} جنيه</b></div>
            </article>`).join(''):'<div class="clean-empty-v161">السلة فاضية. اختار منتج الأول.</div>'}
        </div>
        <div class="clean-coupon-v161" id="couponBox">
          <button type="button" class="clean-coupon-toggle-v161" id="couponToggleV161">عندك كوبون خصم؟</button>
          <div class="clean-coupon-body-v161" id="couponBodyV161">
            <div class="coupon-row">
              <input id="couponInput" placeholder="اكتب كود الخصم" autocomplete="off">
              <button type="button" id="applyCouponBtn">تطبيق</button>
            </div>
            <div id="couponStatus" class="coupon-status ${t.coupon?'show ok':''}">${t.coupon?`تم تطبيق <b>${esc(t.coupon.code||'COUPON')}</b> | الخصم ${t.discount.toLocaleString('en-US')} جنيه | النهائي ${t.final.toLocaleString('en-US')} جنيه`:''}</div>
          </div>
        </div>
        <div class="clean-total-v161"><span>الإجمالي النهائي</span><b id="total">${money.toLocaleString('en-US')} جنيه</b></div>
        <div class="clean-actions-v161">
          <button type="button" data-v161-clear>تفريغ السلة</button>
          <button type="button" class="primary" data-v161-go-pay ${c.length?'':'disabled'}>كمل الدفع</button>
        </div>
      </section>
      <section data-v161-panel="pay" hidden>
        <form id="orderForm" class="clean-pay-form-v161" novalidate>
          <button type="button" class="clean-back-step-v161" data-v161-tab="cart">رجوع للسلة</button>
          <div class="clean-warning-v161">راجع ID واسم الحساب قبل الدفع. أي ID غلط بعد التأكيد مسؤولية العميل.</div>
          <label>رقم الموبايل للمتابعة
            <input class="input" name="customerPhone" inputmode="numeric" autocomplete="tel" placeholder="010xxxxxxxx" required>
          </label>
          <label>طريقة الدفع
            <select class="select" name="paymentMethod" id="paymentMethod" required>
              <option value="">اختار طريقة الدفع</option>
              <option value="InstaPay">InstaPay</option>
              <option value="Wallet">محفظة كاش</option>
            </select>
          </label>
          <div id="paymentDetails">${paymentDetails('')}</div>
          <div class="clean-transfer-v161">
            <b>تأكيد التحويل</b>
            <label><input type="radio" name="transferMode" value="same" required> التحويل من نفس رقم المتابعة</label>
            <label><input type="radio" name="transferMode" value="other" required> التحويل من رقم تاني أو محل دفع</label>
            <div id="last3Box" hidden>
              <span>اكتب آخر 3 أرقام من الرقم اللي حولت منه</span>
              <input class="input" name="transferLast3" id="transferLast3" inputmode="numeric" maxlength="3" placeholder="مثال: 083">
            </div>
          </div>
          <label class="clean-shot-v161">سكرين التحويل
            <input id="checkoutScreenshotV161" class="file" name="screenshot" type="file" accept="image/*" required>
            <small id="checkoutScreenshotNameV161">لم يتم اختيار صورة بعد</small>
          </label>
          <label>ملاحظة اختيارية
            <textarea class="textarea" name="note" placeholder="أي ملاحظة للطلب"></textarea>
          </label>
          <div class="clean-total-v161"><span>إجمالي الطلب</span><b>${money.toLocaleString('en-US')} جنيه</b></div>
          ${t.discount?`<div class="clean-warning-v161">تم خصم ${t.discount.toLocaleString('en-US')} جنيه بالكوبون ${esc(t.coupon?.code||'')}</div>`:''}
          <button class="btn checkout" type="submit">تنفيذ الطلب</button>
          <div id="status" class="status"></div>
        </form>
      </section>`;
    bind();
    setStep(root.dataset.cleanStep==='pay'?'pay':'cart');
    const sticky=qs('#stickyCart');
    if(sticky)sticky.textContent=`السلة ${c.length} منتجات | ${money.toLocaleString('en-US')} جنيه`;
  }
  function bind(){
    const root=qs('#cartSection'), form=qs('#orderForm',root);
    if(!root)return;
    const body=qs('#couponBodyV161',root), toggle=qs('#couponToggleV161',root);
    if(toggle&&body)toggle.onclick=function(){body.classList.toggle('open')};
    const applyCoupon=qs('#applyCouponBtn',root);
    if(applyCoupon)applyCoupon.addEventListener('click',function(){setTimeout(render,900)},false);
    const couponInput=qs('#couponInput',root);
    if(couponInput)couponInput.addEventListener('keydown',function(e){if(e.key==='Enter')setTimeout(render,900)},false);
    qsa('[data-v161-tab]',root).forEach(btn=>btn.onclick=function(){setStep(btn.dataset.v161Tab)});
    const go=qs('[data-v161-go-pay]',root);
    if(go)go.onclick=function(){if(cart().length)setStep('pay')};
    const clear=qs('[data-v161-clear]',root);
    if(clear)clear.onclick=function(){save([]);render()};
    const back=qs('[data-v161-products]',root);
    if(back)back.onclick=function(){location.hash='productsSection';qs('#productsSection')?.scrollIntoView({behavior:'smooth'})};
    qsa('[data-v161-remove]',root).forEach(btn=>btn.onclick=function(){const c=cart();c.splice(Number(btn.dataset.v161Remove),1);save(c);render()});
    qsa('[data-v161-qty]',root).forEach(btn=>btn.onclick=function(){const c=cart(),i=Number(btn.dataset.v161Qty);if(!c[i])return;c[i].qty=Math.max(1,qty(c[i])+Number(btn.dataset.dir));save(c);render()});
    qsa('[data-copy-v161]',root).forEach(btn=>btn.onclick=function(){try{navigator.clipboard.writeText(btn.dataset.copyV161)}catch(e){}});
    const method=qs('#paymentMethod',root);
    if(method)method.onchange=function(){qs('#paymentDetails',root).innerHTML=paymentDetails(method.value)};
    qsa('input[name="transferMode"]',root).forEach(r=>r.onchange=function(){
      const other=qs('input[name="transferMode"]:checked',root)?.value==='other';
      const box=qs('#last3Box',root), input=qs('#transferLast3',root);
      if(box)box.hidden=!other;
      if(input)input.required=other;
    });
    const shot=qs('#checkoutScreenshotV161',root);
    if(shot)shot.onchange=function(){
      const out=qs('#checkoutScreenshotNameV161',root);
      if(out)out.textContent=shot.files&&shot.files[0]?('تم اختيار: '+shot.files[0].name):'لم يتم اختيار صورة بعد';
    };
    if(form){form.dataset.confirmed='1';form.onsubmit=submit}
  }
  function show(msg,type){
    const st=qs('#status');
    if(st){st.className='status '+(type||'err');st.textContent=msg;try{st.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}}
    else alert(msg);
  }
  async function submit(e){
    e.preventDefault();
    e.stopPropagation();
    const c=cart(), form=e.currentTarget;
    if(!c.length)return show('السلة فاضية. ارجع اختار منتج الأول.');
    const fd=new FormData(form);
    const phone=String(fd.get('customerPhone')||'').trim();
    if(!/^01\d{9}$/.test(phone))return show('اكتب رقم موبايل صحيح 11 رقم.');
    if(!fd.get('paymentMethod'))return show('اختار طريقة الدفع.');
    if(!fd.get('transferMode'))return show('اختار التحويل من نفس الرقم ولا رقم تاني.');
    if(fd.get('transferMode')==='other'&&!/^\d{3}$/.test(String(fd.get('transferLast3')||'')))return show('اكتب آخر 3 أرقام من رقم التحويل.');
    if(!fd.get('screenshot')||!fd.get('screenshot').name)return show('ارفع سكرين التحويل قبل تنفيذ الطلب.');
    fd.append('cart',JSON.stringify(c));
    const t=totals(c);
    fd.set('total_before_discount',String(t.subtotal));
    fd.set('coupon_discount',String(t.discount));
    fd.set('total_after_discount',String(t.final));
    if(t.coupon&&t.coupon.code)fd.set('coupon_code',String(t.coupon.code));
    const btn=form.querySelector('button[type="submit"]');
    btn.disabled=true;btn.textContent='جاري إرسال الطلب...';
    try{
      const res=await fetch('/api/order',{method:'POST',body:fd});
      const data=await res.json();
      if(!data.ok)throw new Error(data.error||'حصل خطأ أثناء إرسال الطلب');
      try{localStorage.setItem('moba_last_order_success',JSON.stringify({orderCode:data.orderCode||'',orderId:data.orderId||'',phone,total:data.total||t.final,at:Date.now()}))}catch(e){}
      show(`تم استلام طلبك بنجاح.\nرقم الطلب: ${data.orderCode||data.orderId||'MOBA'}\nالإجمالي: ${data.total?Number(data.total).toLocaleString('ar-EG')+' جنيه':total(c).toLocaleString('ar-EG')+' جنيه'}`,'ok');
      const track=qs('#trackPhone'); if(track)track.value=phone;
      save([]); form.reset(); setTimeout(render,900);
    }catch(err){show(err.message||'حصل خطأ أثناء إرسال الطلب')}
    finally{btn.disabled=false;btn.textContent='تنفيذ الطلب'}
  }
  window.renderCart=render;
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('load',render);
  setTimeout(render,50);
  setTimeout(render,500);
})();
