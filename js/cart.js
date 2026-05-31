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

/* moba-v168-exclusive-offers-home */
(function(){
  if(window.__mobaExclusiveOffersV168)return; window.__mobaExclusiveOffersV168=true;
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function isLive(o){
    if(!o||!o.active)return false;
    const now=Date.now();
    if(o.from&&new Date(o.from).getTime()>now)return false;
    if(o.to&&new Date(o.to).getTime()<now)return false;
    return true;
  }
  async function renderExclusive(){
    try{
      const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'});
      const d=await r.json();
      const o=d&&d.settings&&d.settings.exclusive_offer;
      const old=document.getElementById('exclusiveOfferV168');
      if(old)old.remove();
      if(!isLive(o))return;
      const products=Array.isArray(o.products)?o.products:[];
      const box=document.createElement('section');
      box.id='exclusiveOfferV168';
      box.className='panel exclusive-offer-v168 moba-view';
      box.dataset.page='home';
      box.innerHTML=`<div class="exclusive-offer-copy-v168"><span>عرض خاص</span><h2>${esc(o.title||'عروض حصرية')}</h2><p>اختار العرض المناسب وضيفه للسلة من المنتجات.</p>${products.length?`<div class="exclusive-offer-products-v168">${products.slice(0,6).map(x=>`<b>${esc(x)}</b>`).join('')}</div>`:''}<button type="button" class="exclusive-offer-open-v168">افتح العروض</button></div>${o.image?`<img src="${esc(o.image)}" alt="${esc(o.title||'عرض')}" loading="lazy">`:''}`;
      const target=document.getElementById('gamesHome')||document.getElementById('productsSection');
      target&&target.parentNode.insertBefore(box,target);
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',renderExclusive);
  window.addEventListener('load',renderExclusive);
  async function resolveExclusiveOfferCat(){
    try{
      const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'});
      const d=await r.json();
      const s=d&&d.settings||{};
      const wanted=(s.exclusive_offer&&Array.isArray(s.exclusive_offer.products)?s.exclusive_offer.products:[]).map(x=>String(x||'').trim().toLowerCase()).filter(Boolean);
      const products=Array.isArray(s.dynamic_products)?s.dynamic_products:[];
      const hit=products.find(p=>wanted.some(w=>String(p.name||'').trim().toLowerCase()===w || String(p.name||'').trim().toLowerCase().includes(w)));
      return (hit&&hit.cat)||'offers';
    }catch(_){return 'offers'}
  }
  document.addEventListener('click',async function(e){
    if(!e.target.closest||!e.target.closest('#exclusiveOfferV168'))return;
    e.preventDefault();
    try{
      document.body.dataset.page='game';
      location.hash='productsSection';
      window.activeCat=await resolveExclusiveOfferCat();
      document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});
      if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),80);
      else document.querySelector('.tab[data-cat="'+window.activeCat+'"]')?.click();
    }catch(_){}
  },true);
})();

/* moba-v173-dynamic-games-home */
(function(){
  if(window.__mobaV173DynamicGames)return; window.__mobaV173DynamicGames=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BASE_GAMES=[
    {key:'pubg',title:'PUBG Mobile',subtitle:'UC | ازدهار | برايم',status:'available',sort_order:1,image:'assets/game-covers/pubg.webp',active:true,currency:'UC'},
    {key:'freefire',title:'Free Fire',subtitle:'Diamonds | عضويات',status:'available',sort_order:2,image:'assets/game-covers/freefire-new.webp',active:true,currency:'💎'},
    {key:'roblox',title:'Roblox',subtitle:'Robux',status:'soon',sort_order:3,image:'assets/game-covers/roblox.webp',active:true,currency:'Robux'},
    {key:'blood_mena',title:'Blood Strike MENA',subtitle:'MENA Top Up',status:'soon',sort_order:4,image:'assets/game-covers/blood_mena.jpg',active:true,currency:'Gold'},
    {key:'blood_global',title:'Blood Strike Global',subtitle:'Global Top Up',status:'soon',sort_order:5,image:'assets/game-covers/blood_global.jpg',active:true,currency:'Gold'},
    {key:'kingshot',title:'King Shot',subtitle:'Top Up',status:'soon',sort_order:6,image:'assets/game-covers/kingshot.webp',active:true,currency:'Top Up'},
    {key:'8ball',title:'8 Ball Pool',subtitle:'Coins / Cash',status:'soon',sort_order:7,image:'assets/game-covers/8ball.webp',active:true,currency:'Coins'},
    {key:'goal_battle',title:'Goal Battle',subtitle:'Top Up',status:'soon',sort_order:8,image:'assets/game-covers/goal_battle.webp',active:true,currency:'Top Up'},
    {key:'yalla_ludo',title:'Yalla Ludo',subtitle:'Diamonds / Coins',status:'soon',sort_order:9,image:'assets/game-covers/yalla_ludo.webp',active:true,currency:'Diamonds'},
    {key:'last_war',title:'Last War',subtitle:'Coins',status:'soon',sort_order:10,image:'assets/game-covers/last_war.webp',active:true,currency:'Coins'},
    {key:'efootball',title:'eFootball',subtitle:'Coins / Points',status:'soon',sort_order:11,image:'assets/game-covers/efootball.webp',active:true,currency:'Coins'},
    {key:'tiktok',title:'TikTok',subtitle:'Coins',status:'soon',sort_order:12,image:'assets/game-covers/tiktok.webp',active:true,currency:'Coins'},
    {key:'valorant',title:'Valorant',subtitle:'Points',status:'soon',sort_order:13,image:'assets/game-covers/valorant.jpg',active:true,currency:'VP'}
  ];
  function mergeGames(custom){
    const map=new Map();
    BASE_GAMES.concat(Array.isArray(custom)?custom:[]).forEach(g=>{ if(g&&g.key)map.set(String(g.key),{...g,key:String(g.key),status:g.status||'soon',active:g.active!==false}); });
    return [...map.values()].filter(g=>g.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.title).localeCompare(String(b.title),'ar'));
  }
  function statusBadge(g){
    if(g.status==='available')return '<span class="game-badge available">متاح الآن</span>';
    if(g.status==='unavailable')return '<span class="game-badge soon">غير متوفر</span>';
    return '<span class="game-badge soon">قريبًا</span>';
  }
  window.mobaAllowGameClick=function(game){
    const card=document.querySelector('#gamesHome [data-game="'+String(game||'').replace(/"/g,'')+'"]');
    return !!(card && String(card.dataset.gameStatus||'').toLowerCase()==='available');
  };
  function renderCards(settings){
    const grid=document.querySelector('#gamesHome .game-cards-grid');
    if(!grid)return;
    const games=mergeGames(settings&&settings.game_settings);
    games.forEach(g=>{if(g.key==='freefire' && g.status!=='unavailable')g.status='available';});
    grid.innerHTML=games.map(g=>`<button type="button" class="game-card premium-card cover-card ${g.status==='available'?'active':'coming'}" data-game="${esc(g.key)}" data-game-status="${esc(g.status||'soon')}">
      <div class="game-cover">${g.image?`<img src="${esc(g.image)}" alt="${esc(g.title)}" loading="lazy">`:''}</div>
      <span class="game-overlay"></span>
      <div class="game-card-content">${statusBadge(g)}<b>${esc(g.title||g.key)}</b><small>${esc(g.subtitle||'Top Up')}</small></div>
    </button>`).join('');
  }
  async function load(){
    try{const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); renderCards(d&&d.settings||{});}catch(_){}
  }
  function firstSectionForGame(game){
    const sections=Array.isArray(window.mobaDynamicSections)?window.mobaDynamicSections:[];
    const hit=sections.filter(s=>s&&s.active!==false&&(s.game||'pubg')===game&&(s.location||'game')!=='home').sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))[0];
    if(hit&&hit.key)return hit.key;
    const products=window.mobaProducts||{};
    const key=Object.keys(products).find(cat=>(products[cat]||[]).some(p=>(p.game||'pubg')===game));
    return key||'uc';
  }
  document.addEventListener('click',function(e){
    const game=e.target.closest&&e.target.closest('#gamesHome [data-game]'); if(!game)return;
    let status=game.dataset.gameStatus||'soon'; const key=game.dataset.game||'pubg';
    try{ if(window.mobaCanOpenGame&&window.mobaCanOpenGame(key)) status='available'; if(window.mobaAllowGameClick&&window.mobaAllowGameClick(key)) status='available'; }catch(_){ }
    if(status!=='available'){
      e.preventDefault(); e.stopImmediatePropagation();
      const text=status==='unavailable'?'اللعبة غير متوفرة حاليًا':'اللعبة دي قريبًا';
      if(window.mobaToast)window.mobaToast(text); else alert(text);
      return false;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    window.activeGame=key; window.activeCat=firstSectionForGame(key);
    if(typeof window.mobaShowView==='function') window.mobaShowView('game'); else {document.body.dataset.page='game'; document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});}
    if(typeof window.renderProducts==='function') setTimeout(()=>window.renderProducts(),80);
    return false;
  },true);
  document.addEventListener('DOMContentLoaded',load); window.addEventListener('load',load);
})();

/* moba-v173-home-sections */
(function(){
  if(window.__mobaV173HomeSections)return; window.__mobaV173HomeSections=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function openSection(game,cat){
    window.activeGame=game||'pubg'; window.activeCat=cat||'uc';
    if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),80);
  }
  async function render(){
    try{
      const old=document.getElementById('homeSectionsV173'); if(old)old.remove();
      const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); const s=d&&d.settings||{};
      const sections=(Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).filter(x=>x&&x.active!==false&&['home','both','exclusive'].includes(x.location||''));
      if(!sections.length)return;
      const box=document.createElement('div'); box.id='homeSectionsV173'; box.className='home-sections-v173';
      box.innerHTML=sections.sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(sec=>`<button type="button" data-home-section="${esc(sec.key)}" data-home-game="${esc(sec.game||'pubg')}" class="${sec.status&&sec.status!=='available'?'is-soon':''}">
        ${sec.image?`<img src="${esc(sec.image)}" alt="${esc(sec.title)}" loading="lazy">`:''}
        <span>${sec.status==='soon'?'قريبًا':sec.status==='unavailable'?'غير متوفر':'متاح'}</span><b>${esc(sec.title||sec.key)}</b>
      </button>`).join('');
      const head=document.querySelector('#gamesHome .games-home-head'); if(head)head.insertAdjacentElement('afterend',box); else document.getElementById('gamesHome')?.insertAdjacentElement('afterbegin',box);
    }catch(_){}
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('[data-home-section]'); if(!b)return;
    if(b.classList.contains('is-soon')){e.preventDefault(); e.stopImmediatePropagation(); const text='القسم ده غير متاح حاليًا'; if(window.mobaToast)window.mobaToast(text); else alert(text); return false;}
    e.preventDefault(); e.stopImmediatePropagation(); openSection(b.dataset.homeGame||'pubg',b.dataset.homeSection||'uc'); return false;
  },true);
  document.addEventListener('DOMContentLoaded',render); window.addEventListener('load',render);
  const st=document.createElement('style');
  st.textContent='.home-sections-v173{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 16px}.home-sections-v173 button{position:relative;min-height:86px;border:1px solid rgba(39,216,255,.25);border-radius:18px;background:linear-gradient(135deg,rgba(39,216,255,.13),rgba(255,216,107,.08));color:#fff;text-align:right;padding:12px;overflow:hidden;cursor:pointer}.home-sections-v173 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.22}.home-sections-v173 span,.home-sections-v173 b{position:relative;display:block}.home-sections-v173 span{color:#75ffcf;font-size:12px;font-weight:900}.home-sections-v173 b{font-size:16px;margin-top:8px}.home-sections-v173 .is-soon{opacity:.72}@media(max-width:760px){.home-sections-v173{grid-template-columns:repeat(2,minmax(0,1fr))}.home-sections-v173 button{min-height:76px}}';
  document.head.appendChild(st);
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
      const gkey = game.dataset.game || 'pubg';
      if(window.mobaAllowGameClick && window.mobaAllowGameClick(gkey)) return;
      e.preventDefault();
      if(gkey === 'pubg') showView('game');
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

  // v178 defaults: كل لعبة ظاهرة في الموقع يبقى لها أقسام ومنتجات قابلة للإدارة، وفري فاير متاح بعملته الصحيحة.
  PRODUCTS.freefire_diamonds = [
    {game:'freefire', cat:'freefire_diamonds', name:'50 💎', type:'شحن فري فاير جواهر', price:40, uc:50},
    {game:'freefire', cat:'freefire_diamonds', name:'100 💎', type:'شحن فري فاير جواهر', price:70, uc:100, hot:true},
    {game:'freefire', cat:'freefire_diamonds', name:'210 💎', type:'شحن فري فاير جواهر', price:130, uc:210},
    {game:'freefire', cat:'freefire_diamonds', name:'310 💎', type:'شحن فري فاير جواهر', price:180, uc:310},
    {game:'freefire', cat:'freefire_diamonds', name:'583 💎', type:'شحن فري فاير جواهر', price:300, uc:583},
    {game:'freefire', cat:'freefire_diamonds', name:'1,188 💎', type:'شحن فري فاير جواهر', price:590, uc:1188},
    {game:'freefire', cat:'freefire_diamonds', name:'2,420 💎', type:'شحن فري فاير جواهر', price:1140, uc:2420},
    {game:'freefire', cat:'freefire_diamonds', name:'6,160 💎', type:'شحن فري فاير جواهر', price:2800, uc:6160}
  ];
  PRODUCTS.freefire_memberships = [
    {game:'freefire', cat:'freefire_memberships', name:'عضوية اسبوعية', type:'Weekly Membership', price:130, noQty:true, uc:0},
    {game:'freefire', cat:'freefire_memberships', name:'عضوية شهرية', type:'Monthly Membership', price:570, noQty:true, uc:0},
    {game:'freefire', cat:'freefire_memberships', name:'تصريح بوياه', type:'Booyah Pass', price:180, noQty:true, uc:0}
  ];

  let PRODUCT_OVERRIDES_LOADED = false;
  async function loadProductOverrides(){
    if(PRODUCT_OVERRIDES_LOADED) return;
    PRODUCT_OVERRIDES_LOADED = true;
    try{
      const r = await fetch('/api/settings?ts=' + Date.now(), {cache:'no-store'});
      const d = await r.json();
      const overrides = d && d.settings && d.settings.product_overrides;
      let dynamicProducts = d && d.settings && Array.isArray(d.settings.dynamic_products) ? d.settings.dynamic_products : [];
      let dynamicSections = d && d.settings && Array.isArray(d.settings.dynamic_sections) ? d.settings.dynamic_sections : [];
      const DEFAULT_SITE_SECTIONS_V178=[
        {key:'uc',title:'شدات UC',game:'pubg',location:'game',active:true,sort_order:1,status:'available',subtitle:'شحن ID سريع'},
        {key:'growth',title:'ازدهار وعروض خاصة',game:'pubg',location:'game',active:true,sort_order:2,status:'available',subtitle:'منتجات حساسة'},
        {key:'prime',title:'برايم واشتراكات',game:'pubg',location:'game',active:true,sort_order:3,status:'available',subtitle:'Prime / Plus'},
        {key:'freefire_diamonds',title:'جواهر فري فاير',game:'freefire',location:'game',active:true,sort_order:1,status:'available',subtitle:'Diamonds 💎'},
        {key:'freefire_memberships',title:'عضويات فري فاير',game:'freefire',location:'game',active:true,sort_order:2,status:'available',subtitle:'عضويات وتصريح بوياه'},
        {key:'robux',title:'روبوكس Roblox',game:'roblox',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Robux'},
        {key:'tiktok_coins',title:'عملات TikTok',game:'tiktok',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Coins'},
        {key:'valorant_points',title:'Valorant Points',game:'valorant',location:'game',active:true,sort_order:1,status:'soon',subtitle:'VP'},
        {key:'blood_mena_topup',title:'Blood Strike MENA',game:'blood_mena',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Top Up'},
        {key:'blood_global_topup',title:'Blood Strike Global',game:'blood_global',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Top Up'},
        {key:'kingshot_topup',title:'King Shot',game:'kingshot',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Top Up'},
        {key:'8ball_topup',title:'8 Ball Pool',game:'8ball',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Coins / Cash'},
        {key:'goal_battle_topup',title:'Goal Battle',game:'goal_battle',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Top Up'},
        {key:'yalla_ludo_topup',title:'Yalla Ludo',game:'yalla_ludo',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Diamonds / Coins'},
        {key:'last_war_topup',title:'Last War',game:'last_war',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Coins'},
        {key:'efootball_topup',title:'eFootball',game:'efootball',location:'game',active:true,sort_order:1,status:'soon',subtitle:'Coins / Points'}
      ];
      dynamicSections = DEFAULT_SITE_SECTIONS_V178.concat(dynamicSections);
      // v175: تمنع تكرار الاقسام والمنتجات لو الادمن حفظ نفس الحاجة اكتر من مرة
      try{
        const normTitle=v=>String(v||'').trim().toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ');
        const secMap=new Map(), secTitle=new Set();
        dynamicSections.forEach(sec=>{
          if(!sec||!sec.key||!sec.title)return;
          const game=String(sec.game||'pubg'), key=String(sec.key||'').trim(), tk=game+'|'+normTitle(sec.title);
          if(secTitle.has(tk))return;
          secTitle.add(tk); secMap.set(game+'|'+key, sec);
        });
        dynamicSections=[...secMap.values()];
        const prodMap=new Map();
        dynamicProducts.forEach(prod=>{
          if(!prod||!prod.name)return;
          const game=String(prod.game||'pubg'), cat=String(prod.cat||'uc');
          const k=game+'|'+cat+'|'+normTitle(prod.name);
          prodMap.set(k, {...(prodMap.get(k)||{}), ...prod});
        });
        dynamicProducts=[...prodMap.values()];
      }catch(_){ }
      window.mobaDynamicSections = dynamicSections;
      window.mobaGameSettings = d && d.settings && Array.isArray(d.settings.game_settings) ? d.settings.game_settings : [];
      if(dynamicProducts.length){
        const byCat={};
        dynamicProducts
          .filter(p=>p && p.name && !p.hidden)
          .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))
          .forEach(p=>{
            const cat = p.cat || 'uc';
            if(!byCat[cat]) byCat[cat]=[];
            const basePrice=Number(p.price||0);
            const salePrice=Number(p.sale_price||p.discount_price||0);
            const finalPrice=salePrice>0&&salePrice<basePrice?salePrice:basePrice;
            const discountWarn=finalPrice<basePrice?`عرض خصم: بدل ${basePrice.toLocaleString('en-US')} جنيه دلوقتي ${finalPrice.toLocaleString('en-US')} جنيه`:'';
            byCat[cat].push({
              name:String(p.name||''),
              type:p.type || (cat==='uc'?'شحن بالايدي | ID':cat),
              price:finalPrice,
              oldPrice:basePrice,
              sale_price:finalPrice<basePrice?finalPrice:0,
              cost:Number(p.cost||0),
              uc:Number(p.uc||0),
              hot:!!p.hot||!!p.featured,
              noQty:!!p.noQty,
              status:p.status||'available',
              warning:[discountWarn,p.warning||''].filter(Boolean).join(' - '),
              image:p.image||'',
              cat,
              game:p.game||'pubg',
              placement:p.placement||'normal'
            });
          });
        Object.keys(byCat).forEach(cat=>{ PRODUCTS[cat]=byCat[cat]; });
      }else if(overrides && typeof overrides === 'object'){
        Object.keys(PRODUCTS).forEach(cat=>{
          PRODUCTS[cat] = PRODUCTS[cat].map(p=>{
            const ov = overrides[p.name] || overrides[`${cat}:${p.name}`];
            if(!ov || typeof ov !== 'object') return p;
            return {...p, ...ov, hidden: Boolean(ov.hidden)};
          }).filter(p=>!p.hidden);
        });
      }
      try{
        const tabs=document.querySelector('.tabs');
        const labels={uc:'شدات UC',growth:'ازدهار',prime:'برايم',offers:'عروض'};
        dynamicSections.forEach(sec=>{ if(sec&&sec.key&&sec.title) labels[sec.key]=sec.title; });
        Object.keys(PRODUCTS).forEach(cat=>{
          if(!PRODUCTS[cat]||!PRODUCTS[cat].length||document.querySelector('.tab[data-cat="'+cat+'"]'))return;
          const b=document.createElement('button');
          b.type='button';
          b.className='tab';
          b.dataset.cat=cat;
          b.textContent=labels[cat]||cat;
          tabs&&tabs.appendChild(b);
        });
      }catch(_){}
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

  function sectionTitleFor(cat,game){
    const sec=(window.mobaDynamicSections||[]).find(s=>s&&s.key===cat&&(s.game||'pubg')===game);
    if(sec&&sec.title)return sec.title;
    const fallback={uc:'شدات UC',growth:'ازدهار',prime:'برايم',freefire_diamonds:'جواهر فري فاير',freefire_memberships:'عضويات فري فاير'};
    return fallback[cat]||cat;
  }
  function sectionSubtitleFor(cat,game){
    const sec=(window.mobaDynamicSections||[]).find(s=>s&&s.key===cat&&(s.game||'pubg')===game);
    if(sec&&sec.subtitle)return sec.subtitle;
    const map={uc:'باقات الشحن',growth:'عروض خاصة',prime:'اشتراكات',freefire_diamonds:'Diamonds',freefire_memberships:'Memberships'};
    return map[cat]||'منتجات';
  }
  function currencyFor(cat,game){
    const sec=(window.mobaDynamicSections||[]).find(s=>s&&s.key===cat&&(s.game||'pubg')===game);
    if(sec&&(sec.currency||sec.currency_name))return sec.currency||sec.currency_name;
    if(game==='freefire')return '💎';
    if(game==='pubg')return 'UC';
    const map={roblox:'Robux',tiktok:'Coins',valorant:'VP','8ball':'Coins',last_war:'Coins',efootball:'Coins'};
    return map[game]||'';
  }
  function syncTabsForActiveGame(activeGame){
    const tabs=document.querySelector('.tabs.product-tabs-v119');
    if(!tabs)return;
    const cats=[];
    (window.mobaDynamicSections||[]).filter(s=>s&&s.active!==false&&(s.game||'pubg')===activeGame&&!['home','exclusive'].includes(s.location||'game')).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).forEach(s=>{if(s.key&&!cats.includes(s.key))cats.push(s.key)});
    Object.keys(PRODUCTS).forEach(cat=>{if((PRODUCTS[cat]||[]).some(p=>(p.game||'pubg')===activeGame)&&!cats.includes(cat))cats.push(cat)});
    if(!cats.length && activeGame==='pubg')cats.push('uc','growth','prime');
    if(!cats.includes(window.activeCat)) window.activeCat=cats[0]||'uc';
    tabs.innerHTML=cats.map(cat=>`<button class="tab ${window.activeCat===cat?'active':''}" data-cat="${esc(cat)}" data-game="${esc(activeGame)}"><span>${esc(sectionTitleFor(cat,activeGame))}</span><small>${esc(sectionSubtitleFor(cat,activeGame))}</small></button>`).join('');
    const h=document.querySelector('.game-page-toolbar h3');
    if(h){const gameCard=document.querySelector(`#gamesHome [data-game="${CSS&&CSS.escape?CSS.escape(activeGame):activeGame}"] b`); h.textContent='🎮 '+(gameCard?.textContent||activeGame);}
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
    const activeGame = window.activeGame || 'pubg';
    syncTabsForActiveGame(activeGame);
    const finalCat = window.activeCat || cat;
    const list = (PRODUCTS[finalCat] || []).filter(p=>(p.game || 'pubg') === activeGame);
    window.__mobaRenderedProducts = list;
    document.querySelectorAll('.tab[data-cat]').forEach(t=>t.classList.toggle('active', t.dataset.cat === cat));
    const catInfo=document.getElementById('productCatInfo');
    if(catInfo){
      const map={
        uc:'باقات UC للشحن بالـ ID. اكتب ID واسم الحساب بدقة قبل الإضافة للسلة.',
        growth:'منتجات الازدهار والكريستالة حساسة. اتأكد إنها متاحة داخل اللعبة قبل الطلب.',
        prime:'اشتراكات برايم وبرايم بلس. راجع نوع الاشتراك قبل الدفع.'
      };
      catInfo.textContent=map[finalCat]||'اختار المنتج المناسب واكتب بيانات الحساب قبل الإضافة للسلة.';
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
            ${p.status&&p.status!=='available' ? '<span class="hot">قريبًا</span>' : (p.hot ? '<span class="hot">🔥 الاكثر طلبا</span>' : '')}
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
          <div class="product-uc-preview compact-preview">🎮 إجمالي العملة: <b>${ucTotal.toLocaleString('en-US')} ${currencyFor(finalCat, activeGame)}</b></div>`}
        </div>
        <button class="btn add compact-add" type="button" data-v57-add="${i}" ${p.status&&p.status!=='available'?'disabled':''}>${p.status&&p.status!=='available'?'قريبًا':'إضافة للسلة +'}</button>
      </div>`;
    }).join('');
    restoreProductDrafts(finalCat);
  }

  function addToCart(i){
    const cat = window.activeCat || 'uc';
    const p = (window.__mobaRenderedProducts || PRODUCTS[cat] || [])[i];
    if(!p) return status('المنتج غير موجود','err');
    if(p.status && p.status !== 'available') return status('المنتج ده غير متاح حاليًا أو قريبًا','err');

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
      pubgId,pubgName:name,name,qty,qtyTotal:qty,ucTotal:Number(p.uc||0)*qty,game:p.game||window.activeGame||'pubg',currency:currencyFor(cat, p.game||window.activeGame||'pubg'),noQty:!!p.noQty
    };
    const c = getCart();
    if(p.noQty && c.some(x=>String(x.product||x.name||'').trim()===String(p.name||'').trim())){
      status('المنتج ده مسموح يتحط مرة واحدة فقط في السلة','err');
      return;
    }
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
      window.activeGame = tab.dataset.game || window.activeGame || 'pubg';
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
    try{return window.appliedCoupon||JSON.parse(sessionStorage.getItem('moba_coupon')||'null')}catch(e){return window.appliedCoupon||null}
  }
  function totals(c){
    const subtotal=total(c), cp=coupon();
    const discount=cp?Math.min(Number(cp.discount_amount||cp.value||0),subtotal):0;
    return {subtotal,discount,final:Math.max(0,subtotal-discount),coupon:cp};
  }
  function couponMsg(){
    try{return window.mobaCouponMsgV168||JSON.parse(sessionStorage.getItem('moba_coupon_msg_v168')||'null')}catch(e){return window.mobaCouponMsgV168||null}
  }
  function setCouponMsg(type,text){
    const msg={type:type||'ok',text:String(text||''),at:Date.now()};
    window.mobaCouponMsgV168=msg;
    try{sessionStorage.setItem('moba_coupon_msg_v168',JSON.stringify(msg))}catch(e){}
    return msg;
  }
  function couponStatusHtml(t){
    if(t.coupon){
      return {
        cls:'show ok',
        html:'تم تطبيق <b>'+esc(t.coupon.code||'COUPON')+'</b> بنجاح. الخصم '+Number(t.discount||0).toLocaleString('en-US')+' جنيه، والإجمالي بعد الخصم '+Number(t.final||0).toLocaleString('en-US')+' جنيه.'
      };
    }
    const m=couponMsg();
    return m&&m.text?{cls:'show '+(m.type==='err'?'err':'ok'),html:esc(m.text)}:{cls:'',html:''};
  }
  function couponBreakdownHtml(t){
    if(!t.coupon&&!t.discount)return '';
    return `<div class="clean-coupon-breakdown-v168">
      <span>قبل الخصم: <b>${Number(t.subtotal||0).toLocaleString('en-US')} جنيه</b></span>
      <span>قيمة الخصم: <b>${Number(t.discount||0).toLocaleString('en-US')} جنيه</b></span>
      <span>بعد الخصم: <b>${Number(t.final||0).toLocaleString('en-US')} جنيه</b></span>
    </div>`;
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
    const cpStatus=couponStatusHtml(t);
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
              <input id="couponInput" placeholder="اكتب كود الخصم" autocomplete="off" value="${esc(t.coupon?.code||'')}">
              <button type="button" id="applyCouponBtn">تطبيق</button>
            </div>
            <div id="couponStatus" class="coupon-status ${cpStatus.cls}">${cpStatus.html}</div>
            ${couponBreakdownHtml(t)}
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
          ${couponBreakdownHtml(t)}
          ${t.discount?`<div class="clean-warning-v161">الكوبون ${esc(t.coupon?.code||'')} متطبق على الطلب، والخصم محسوب في الإجمالي النهائي.</div>`:''}
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
    if(toggle&&body)toggle.onclick=function(){
      body.classList.toggle('open');
      if(body.classList.contains('open'))setTimeout(()=>qs('#couponInput',root)?.focus(),60);
    };
    const applyCoupon=qs('#applyCouponBtn',root);
    if(applyCoupon)applyCoupon.addEventListener('click',applyCouponNow,false);
    const couponInput=qs('#couponInput',root);
    if(couponInput)couponInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();applyCouponNow()}},false);
    qsa('[data-v161-tab]',root).forEach(btn=>btn.onclick=function(){setStep(btn.dataset.v161Tab)});
    const go=qs('[data-v161-go-pay]',root);
    if(go)go.onclick=function(){if(cart().length)setStep('pay')};
    const clear=qs('[data-v161-clear]',root);
    if(clear)clear.onclick=function(){save([]);render()};
    const back=qs('[data-v161-products]',root);
    if(back)back.onclick=function(){
      const link=document.querySelector('[data-view="home"],a[href="#home"]');
      if(link)link.click();
      location.hash='productsSection';
      setTimeout(()=>qs('#productsSection')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
    };
    qsa('[data-v161-remove]',root).forEach(btn=>btn.onclick=function(){const c=cart();c.splice(Number(btn.dataset.v161Remove),1);save(c);render()});
    qsa('[data-v161-qty]',root).forEach(btn=>btn.onclick=function(){const c=cart(),i=Number(btn.dataset.v161Qty);if(!c[i])return;if(c[i].noQty){show('المنتج ده كمية واحدة فقط ومينفعش يتكرر في السلة','err');return}c[i].qty=Math.max(1,qty(c[i])+Number(btn.dataset.dir));save(c);render()});
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
    if(form){form.dataset.confirmed='';form.onsubmit=submit}
  }
  async function applyCouponNow(){
    const root=qs('#cartSection');
    const input=qs('#couponInput',root), status=qs('#couponStatus',root), btn=qs('#applyCouponBtn',root);
    const code=String(input?.value||'').trim().toUpperCase();
    const c=cart(), subtotal=total(c);
    if(!code){setCouponMsg('err','اكتب كود الخصم الأول.');if(status){status.className='coupon-status show err';status.textContent='اكتب كود الخصم الأول.'}return}
    if(!c.length||subtotal<=0){setCouponMsg('err','السلة فاضية. ضيف منتج الأول.');if(status){status.className='coupon-status show err';status.textContent='السلة فاضية. ضيف منتج الأول.'}return}
    if(status){status.className='coupon-status show';status.textContent='جاري فحص الكوبون...'}
    if(btn){btn.disabled=true;btn.textContent='جاري...'}
    try{
      const res=await fetch('/api/coupon?code='+encodeURIComponent(code)+'&total='+encodeURIComponent(subtotal)+'&cart='+encodeURIComponent(JSON.stringify(c)),{credentials:'include',headers:{Accept:'application/json'}});
      const data=await res.json().catch(()=>({ok:false,error:'رد غير مفهوم من السيرفر'}));
      if(!data.ok)throw new Error(data.error||'الكوبون غير صالح');
      const cp=data.coupon||data;
      const saved={code:cp.code||code,discount_amount:Number(cp.discount_amount||cp.discount||0),discount_type:cp.discount_type||'fixed'};
      window.appliedCoupon=saved;
      try{sessionStorage.setItem('moba_coupon',JSON.stringify(saved))}catch(e){}
      setCouponMsg('ok','تم تطبيق الكوبون '+saved.code+' بنجاح. الخصم '+saved.discount_amount.toLocaleString('en-US')+' جنيه.');
      if(status){status.className='coupon-status show ok';status.innerHTML='تم تطبيق <b>'+esc(saved.code)+'</b> | الخصم '+saved.discount_amount.toLocaleString('en-US')+' جنيه'}
      setTimeout(render,350);
    }catch(err){
      window.appliedCoupon=null;
      try{sessionStorage.removeItem('moba_coupon');localStorage.removeItem('moba_coupon')}catch(e){}
      setCouponMsg('err',err.message||'الكوبون غير صالح');
      if(status){status.className='coupon-status show err';status.textContent=err.message||'الكوبون غير صالح'}
    }finally{
      if(btn){btn.disabled=false;btn.textContent='تطبيق'}
    }
  }
  window.__mobaCleanApplyCouponV167=applyCouponNow;
  function show(msg,type){
    const st=qs('#status');
    if(st){st.className='status '+(type||'err');st.textContent=msg;try{st.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}}
    else alert(msg);
  }
  function closeConfirmV168(){
    const old=document.getElementById('checkoutConfirmV168');
    if(old)old.remove();
  }
  function openConfirmV168(form,c,t,phone,fd){
    closeConfirmV168();
    const file=fd.get('screenshot');
    const pay=String(fd.get('paymentMethod')||'-');
    const items=c.map(x=>`<li>${esc(x.product||x.name||'منتج')} × ${qty(x)} - ID: ${esc(x.pubgId||x.id||'-')} - Name: ${esc(x.pubgName||x.nameInGame||x.name||'-')}</li>`).join('');
    const box=document.createElement('div');
    box.id='checkoutConfirmV168';
    box.className='checkout-confirm-v168';
    box.innerHTML=`<div class="checkout-confirm-card-v168" role="dialog" aria-modal="true">
      <h3>تأكيد الطلب قبل الإرسال</h3>
      <p>راجع البيانات كويس. بعد التأكيد الطلب هيتسجل للمراجعة اليدوية قبل التنفيذ.</p>
      <ul>${items}</ul>
      <div class="checkout-confirm-grid-v168">
        <span>رقم المتابعة <b>${esc(phone)}</b></span>
        <span>طريقة الدفع <b>${esc(pay)}</b></span>
        <span>السكرين <b>${esc(file&&file.name?file.name:'مرفوع')}</b></span>
        <span>الإجمالي <b>${Number(t.final||0).toLocaleString('en-US')} جنيه</b></span>
      </div>
      ${couponBreakdownHtml(t)}
      <div class="checkout-confirm-actions-v168">
        <button type="button" data-confirm-send>تأكيد وإرسال الطلب</button>
        <button type="button" data-confirm-close>رجوع للتعديل</button>
      </div>
    </div>`;
    document.body.appendChild(box);
    box.querySelector('[data-confirm-close]').onclick=closeConfirmV168;
    box.querySelector('[data-confirm-send]').onclick=function(){
      form.dataset.confirmed='1';
      closeConfirmV168();
      if(form.requestSubmit)form.requestSubmit();
      else form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    };
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
    const t=totals(c);
    if(form.dataset.confirmed!=='1'){
      openConfirmV168(form,c,t,phone,fd);
      return;
    }
    form.dataset.confirmed='';
    fd.append('cart',JSON.stringify(c));
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
      const track=qs('#trackPhone'); if(track)track.value=phone;
      save([]);
      try{sessionStorage.removeItem('moba_coupon');localStorage.removeItem('moba_coupon');window.appliedCoupon=null}catch(e){}
      render();
    }catch(err){form.dataset.confirmed='';show(err.message||'حصل خطأ أثناء إرسال الطلب')}
    finally{btn.disabled=false;btn.textContent='تنفيذ الطلب'}
  }
  window.renderCart=render;
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('load',render);
  setTimeout(render,50);
  setTimeout(render,500);
})();


/* moba-v176-catalog-display-pro-fix: no duplicate home sections + better images */
(function(){
  if(window.__mobaV176CatalogDisplayFix)return; window.__mobaV176CatalogDisplayFix=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleKey=v=>String(v||'').trim().toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ');
  function normalizeSections(arr){
    const byKey=new Map(), byTitle=new Map();
    (Array.isArray(arr)?arr:[]).forEach(sec=>{
      if(!sec||sec.active===false||!sec.key||!sec.title)return;
      const game=String(sec.game||'pubg');
      const key=String(sec.key||'').trim();
      const title=String(sec.title||'').trim();
      const k=game+'|'+key;
      const t=game+'|'+titleKey(title);
      const clean={...sec,game,key,title,location:sec.location||'game',status:sec.status||'available',sort_order:Number(sec.sort_order||0),image:String(sec.image||'').trim()};
      if(byTitle.has(t) && byTitle.get(t)!==k){
        const oldKey=byTitle.get(t);
        byKey.set(oldKey,{...byKey.get(oldKey),...clean,key:byKey.get(oldKey).key});
        return;
      }
      byTitle.set(t,k);
      byKey.set(k,{...(byKey.get(k)||{}),...clean});
    });
    return [...byKey.values()].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.title).localeCompare(String(b.title),'ar'));
  }
  function normalizeProducts(arr){
    const by=new Map();
    (Array.isArray(arr)?arr:[]).forEach(p=>{
      if(!p||!p.name)return;
      const game=String(p.game||'pubg'); const cat=String(p.cat||'uc');
      const k=game+'|'+cat+'|'+titleKey(p.name);
      by.set(k,{...(by.get(k)||{}),...p,game,cat,name:String(p.name||'').trim(),image:String(p.image||'').trim()});
    });
    return [...by.values()];
  }
  async function fetchSettings(){
    try{const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); return d&&d.settings||{};}catch(_){return {}}
  }
  function openSection(game,cat){
    window.activeGame=game||'pubg'; window.activeCat=cat||'uc';
    if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),80);
  }
  async function renderHomeSectionsV176(){
    const s=await fetchSettings();
    const old=document.getElementById('homeSectionsV173'); if(old)old.remove();
    const old2=document.getElementById('homeSectionsV176'); if(old2)old2.remove();
    const sections=normalizeSections(s.dynamic_sections).filter(x=>['home','both'].includes(x.location||''));
    if(!sections.length)return;
    const products=normalizeProducts(s.dynamic_products);
    const box=document.createElement('div'); box.id='homeSectionsV176'; box.className='home-sections-v176';
    box.innerHTML=sections.map(sec=>{
      const count=products.filter(p=>(p.game||'pubg')===(sec.game||'pubg')&&p.cat===sec.key&&!p.hidden).length;
      const disabled=sec.status&&sec.status!=='available';
      return `<button type="button" data-home-section-v176="${esc(sec.key)}" data-home-game-v176="${esc(sec.game||'pubg')}" class="${disabled?'is-soon':''}">
        <div class="home-section-img-v176">${sec.image?`<img src="${esc(sec.image)}" alt="${esc(sec.title)}" loading="lazy" onerror="this.style.display='none'">`:''}</div>
        <div class="home-section-copy-v176"><span>${esc(sec.badge|| (disabled?'قريبًا':'متاح'))}</span><b>${esc(sec.title||sec.key)}</b><small>${esc(sec.subtitle|| (count?count+' منتجات':'اضغط للفتح'))}</small></div>
      </button>`;
    }).join('');
    const head=document.querySelector('#gamesHome .games-home-head');
    if(head)head.insertAdjacentElement('afterend',box); else document.getElementById('gamesHome')?.insertAdjacentElement('afterbegin',box);
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('[data-home-section-v176]'); if(!b)return;
    if(b.classList.contains('is-soon')){e.preventDefault(); e.stopImmediatePropagation(); const text='القسم ده غير متاح حاليًا'; if(window.mobaToast)window.mobaToast(text); else alert(text); return false;}
    e.preventDefault(); e.stopImmediatePropagation(); openSection(b.dataset.homeGameV176||'pubg',b.dataset.homeSectionV176||'uc'); return false;
  },true);
  function enhanceProductImages(){
    const list=window.__mobaRenderedProducts||[];
    document.querySelectorAll('#productList .product').forEach((card,idx)=>{
      const i=Number(card.getAttribute('data-card-index')); const p=list[Number.isFinite(i)?i:idx];
      if(!p||!p.image||card.querySelector('.product-image-v176'))return;
      const img=document.createElement('div'); img.className='product-image-v176';
      img.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.name||'منتج')}" loading="lazy" onerror="this.closest('.product-image-v176').remove()">`;
      card.insertBefore(img, card.firstChild);
      card.classList.add('has-product-image-v176');
    });
  }
  const oldRender=window.renderProducts;
  if(typeof oldRender==='function'){
    window.renderProducts=function(){const r=oldRender.apply(this,arguments); setTimeout(enhanceProductImages,0); return r;};
  }
  const obsTarget=document.getElementById('productList');
  if(obsTarget){new MutationObserver(()=>enhanceProductImages()).observe(obsTarget,{childList:true,subtree:false});}
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(renderHomeSectionsV176,500);setTimeout(enhanceProductImages,700)});
  window.addEventListener('load',()=>{setTimeout(renderHomeSectionsV176,700);setTimeout(enhanceProductImages,900)});
  setTimeout(renderHomeSectionsV176,1000);
  const st=document.createElement('style');
  st.textContent=`.home-sections-v176{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 18px}.home-sections-v176 button{position:relative;min-height:96px;border:1px solid rgba(39,216,255,.28);border-radius:20px;background:linear-gradient(135deg,rgba(7,20,38,.92),rgba(12,39,55,.72));box-shadow:0 12px 28px rgba(0,0,0,.22),inset 0 0 0 1px rgba(255,255,255,.04);color:#fff;text-align:right;padding:0;overflow:hidden;cursor:pointer}.home-section-img-v176{position:absolute;inset:0}.home-section-img-v176 img{width:100%;height:100%;object-fit:cover;filter:saturate(1.08) contrast(1.04)}.home-sections-v176 button:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,11,24,.94),rgba(4,11,24,.48),rgba(4,11,24,.24))}.home-section-copy-v176{position:relative;z-index:1;padding:14px;display:grid;gap:5px}.home-section-copy-v176 span{justify-self:start;color:#6dffce;background:rgba(16,255,190,.12);border:1px solid rgba(16,255,190,.25);border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900}.home-section-copy-v176 b{font-size:18px;font-weight:1000;text-shadow:0 2px 10px rgba(0,0,0,.55)}.home-section-copy-v176 small{color:#d9efff;font-weight:800}.home-sections-v176 .is-soon{opacity:.72}.product-image-v176{height:128px;border-radius:16px;overflow:hidden;margin-bottom:12px;border:1px solid rgba(39,216,255,.22);background:rgba(255,255,255,.05)}.product-image-v176 img{width:100%;height:100%;object-fit:cover;display:block}.product.has-product-image-v176{padding-top:12px}@media(max-width:850px){.home-sections-v176{grid-template-columns:repeat(2,minmax(0,1fr))}.product-image-v176{height:112px}}@media(max-width:520px){.home-sections-v176{grid-template-columns:1fr}.home-sections-v176 button{min-height:90px}}`;
  document.head.appendChild(st);
})();

/* moba-v177-public-catalog-clean-images */
(function(){
  if(window.__mobaV177PublicCatalogClean)return; window.__mobaV177PublicCatalogClean=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function badText(t){return /لوحة\s*(الأدمن|الادمن|التحكم)|أضفته|اضفته|الأدمن|الادمن|admin/i.test(String(t||''));}
  function cleanText(t,fallback){return badText(t)?(fallback||'اختار العرض المناسب واضغط للفتح'):String(t||'');}
  function sanitizePublicCards(){
    document.querySelectorAll('#gamesHome, #homeSectionsV176, #homeSectionsV173, #productsSection').forEach(root=>{
      root.querySelectorAll('*').forEach(el=>{
        if(el.children.length) return;
        const tx=el.textContent||'';
        if(badText(tx)) el.textContent= el.tagName==='SMALL' ? 'اختار القسم المناسب واضغط للفتح' : 'عروض مميزة';
      });
    });
    document.querySelectorAll('#homeSectionsV173').forEach(x=>x.remove());
  }
  function enhanceImages(){
    const list=window.__mobaRenderedProducts||[];
    document.querySelectorAll('#productList .product').forEach((card,idx)=>{
      const i=Number(card.getAttribute('data-card-index')); const p=list[Number.isFinite(i)?i:idx];
      if(!p) return;
      card.querySelectorAll('.type,.warn').forEach(el=>{ if(badText(el.textContent)) el.remove(); });
      if(p.image && !card.querySelector('.product-image-v177') && !card.querySelector('.product-image-v176')){
        const box=document.createElement('div'); box.className='product-image-v177';
        box.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.name||'منتج')}" loading="lazy" onerror="this.closest('.product-image-v177').remove()">`;
        card.insertBefore(box,card.firstChild); card.classList.add('has-product-image-v177');
      }
      if(p.oldPrice && p.oldPrice>p.price && !card.querySelector('.old-price-v177')){
        const price=card.querySelector('.price'); if(price) price.insertAdjacentHTML('beforebegin',`<div class="old-price-v177">بدل ${Number(p.oldPrice).toLocaleString('en-US')} جنيه</div>`);
      }
    });
  }
  const oldRender=window.renderProducts;
  if(typeof oldRender==='function') window.renderProducts=function(){const r=oldRender.apply(this,arguments); setTimeout(()=>{sanitizePublicCards();enhanceImages();},20); return r;};
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(sanitizePublicCards,600);setTimeout(enhanceImages,800)});
  window.addEventListener('load',()=>{setTimeout(sanitizePublicCards,900);setTimeout(enhanceImages,1000)});
  setInterval(()=>{sanitizePublicCards();enhanceImages();},1800);
  const st=document.createElement('style');
  st.textContent=`.product-image-v177{height:136px;border-radius:18px;overflow:hidden;margin-bottom:12px;border:1px solid rgba(39,216,255,.24);background:rgba(255,255,255,.05)}.product-image-v177 img{width:100%;height:100%;object-fit:cover;display:block}.product.has-product-image-v177{padding-top:12px}.old-price-v177{color:#9eb7ca;text-decoration:line-through;font-weight:800;font-size:12px;text-align:left;margin-bottom:2px}@media(max-width:560px){.product-image-v177{height:116px}}`;
  document.head.appendChild(st);
})();


/* moba-v185-session-only-coupon */
(function(){
  try{localStorage.removeItem('moba_coupon')}catch(e){}
  window.addEventListener('pagehide',function(){try{sessionStorage.removeItem('moba_coupon');localStorage.removeItem('moba_coupon');window.appliedCoupon=null}catch(e){}},false);
  window.addEventListener('beforeunload',function(){try{sessionStorage.removeItem('moba_coupon');localStorage.removeItem('moba_coupon')}catch(e){}},false);
})();


/* moba-v186-public-catalog-stable-render-and-no-flicker */
(function(){
  if(window.__mobaV186CatalogStable)return; window.__mobaV186CatalogStable=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BASE={
    pubg:{key:'pubg',title:'PUBG Mobile',subtitle:'UC | ازدهار | برايم',currency:'UC',status:'available',sort_order:1,image:'assets/game-covers/pubg.webp',icon:'assets/game-icons/pubg-icon.webp'},
    freefire:{key:'freefire',title:'Free Fire',subtitle:'Diamonds',currency:'💎',status:'available',sort_order:2,image:'assets/game-covers/freefire-new.webp',icon:'assets/game-icons/freefire-icon.webp'},
    roblox:{key:'roblox',title:'Roblox',subtitle:'Robux',currency:'Robux',status:'soon',sort_order:3,image:'assets/game-covers/roblox.webp',icon:'assets/game-icons/roblox.svg'},
    tiktok:{key:'tiktok',title:'TikTok',subtitle:'Coins',currency:'Coins',status:'soon',sort_order:4,image:'assets/game-covers/tiktok.webp',icon:'assets/moba-shop-logo-256.png'},
    valorant:{key:'valorant',title:'Valorant',subtitle:'VP',currency:'VP',status:'soon',sort_order:5,image:'assets/game-covers/valorant.jpg',icon:'assets/moba-shop-logo-256.png'},
    yalla_ludo:{key:'yalla_ludo',title:'Yalla Ludo',subtitle:'Diamonds / Coins',currency:'Diamonds',status:'soon',sort_order:6,image:'assets/game-covers/yalla_ludo.webp',icon:'assets/moba-shop-logo-256.png'},
    last_war:{key:'last_war',title:'Last War',subtitle:'Coins',currency:'Coins',status:'soon',sort_order:7,image:'assets/game-covers/last_war.webp',icon:'assets/moba-shop-logo-256.png'},
    efootball:{key:'efootball',title:'eFootball',subtitle:'Coins / Points',currency:'Coins',status:'soon',sort_order:8,image:'assets/game-covers/efootball.webp',icon:'assets/moba-shop-logo-256.png'},
    blood_global:{key:'blood_global',title:'Blood Strike Global',subtitle:'Global Top Up',currency:'Gold',status:'soon',sort_order:9,image:'assets/game-covers/blood_global.jpg',icon:'assets/game-icons/bloodstrike-global.svg'},
    blood_mena:{key:'blood_mena',title:'Blood Strike MENA',subtitle:'MENA Top Up',currency:'Gold',status:'soon',sort_order:10,image:'assets/game-covers/blood_mena.jpg',icon:'assets/game-icons/bloodstrike.svg'},
    kingshot:{key:'kingshot',title:'King Shot',subtitle:'Top Up',currency:'Top Up',status:'soon',sort_order:11,image:'assets/game-covers/kingshot.webp',icon:'assets/moba-shop-logo-256.png'},
    '8ball':{key:'8ball',title:'8 Ball Pool',subtitle:'Coins / Cash',currency:'Coins',status:'soon',sort_order:12,image:'assets/game-covers/8ball.webp',icon:'assets/moba-shop-logo-256.png'},
    goal_battle:{key:'goal_battle',title:'Goal Battle',subtitle:'Top Up',currency:'Top Up',status:'soon',sort_order:13,image:'assets/game-covers/goal_battle.webp',icon:'assets/moba-shop-logo-256.png'}
  };
  function normStatus(x){
    const s=String(x||'').trim().toLowerCase();
    if(['available','active','on','open','live','enabled','متاح','متاح الآن','متاح الان'].includes(s))return 'available';
    if(['unavailable','disabled','off','stopped','stop','closed','متوقف','غير متاح','غير متوفر'].includes(s))return 'unavailable';
    if(['soon','coming','coming_soon','قريبا','قريبًا'].includes(s))return 'soon';
    return s||'soon';
  }
  function badge(g){const s=normStatus(g.status); if(s==='available')return '<span class="game-badge available">متاح الآن</span>'; if(s==='unavailable')return '<span class="game-badge soon off">متوقف</span>'; return '<span class="game-badge soon">قريبًا</span>';}
  function img(v,fallback){v=String(v||'').trim(); return v||fallback||'assets/moba-shop-logo-512.webp'}
  function mergeGames(custom){
    const map=new Map(Object.entries(BASE).map(([k,v])=>[k,{...v}]));
    (Array.isArray(custom)?custom:[]).forEach(g=>{
      if(!g)return; const key=String(g.key||g.id||'').trim(); if(!key)return; const b=map.get(key)||{};
      const clean={...b,...g,key,
        title:String(g.title||b.title||key),
        subtitle:String(g.subtitle||b.subtitle||g.currency||''),
        currency:String(g.currency||b.currency||''),
        status:normStatus(g.status||b.status),
        image:img(g.image,b.image),
        icon:img(g.icon,b.icon),
        active:g.active!==false,
        sort_order:Number(g.sort_order||b.sort_order||999)
      };
      map.set(key,clean);
    });
    return [...map.values()].filter(g=>g.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.title).localeCompare(String(b.title),'ar'));
  }
  function cachedSettings(){try{const raw=localStorage.getItem('moba_settings_cache_v187')||localStorage.getItem('moba_settings_cache'); if(!raw)return null; const d=JSON.parse(raw); return d&&d.settings?d.settings:d;}catch(e){return null;}}
  async function settings(){
    try{
      const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'});
      const d=await r.json();
      const out=d&&d.settings||{};
      try{localStorage.setItem('moba_settings_cache_v187',JSON.stringify({settings:out,ts:Date.now()}));localStorage.setItem('moba_settings_cache',JSON.stringify(out));}catch(_){}
      return out;
    }catch(e){return cachedSettings()||{};}
  }
  function renderGames(settings){
    const grid=document.querySelector('#gamesHome .game-cards-grid'); if(!grid)return;
    const games=mergeGames(settings.game_settings);
    grid.innerHTML=games.map(g=>`<button type="button" class="game-card premium-card cover-card ${normStatus(g.status)==='available'?'active':'coming'}" data-game="${esc(g.key)}" data-game-status="${esc(normStatus(g.status))}">
      <div class="game-cover"><img src="${esc(img(g.image,(BASE[g.key]||{}).image))}" alt="${esc(g.title)}" loading="lazy" onerror="this.onerror=null;this.src='${esc((BASE[g.key]||{}).image||'assets/moba-shop-logo-512.webp')}'"></div>
      <span class="game-overlay"></span>
      <div class="game-card-content">${badge(g)}<span class="game-icon-mini"><img src="${esc(img(g.icon,(BASE[g.key]||{}).icon))}" onerror="this.style.display='none'" alt=""></span><b>${esc(g.title)}</b><small>${esc(g.subtitle||g.currency||'Top Up')}</small></div>
    </button>`).join('');
  }
  function renderHomeBanners(settings){
    const old=document.getElementById('homeSectionsV186'); if(old)old.remove();
    const sections=(Array.isArray(settings.dynamic_sections)?settings.dynamic_sections:[]).filter(s=>s&&s.active!==false&&['home','both','exclusive'].includes(String(s.location||'')));
    if(!sections.length)return;
    const box=document.createElement('div'); box.id='homeSectionsV186'; box.className='home-sections-v186';
    box.innerHTML=sections.sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(sec=>{
      const s=normStatus(sec.status||'available'), b=BASE[sec.game]||{};
      const im=img(sec.image,b.image);
      return `<button type="button" data-v186-home-section="${esc(sec.key)}" data-v186-home-game="${esc(sec.game||'pubg')}" data-status="${esc(s)}" class="${s==='available'?'':'is-soon'}">
        <img src="${esc(im)}" alt="${esc(sec.title||'عرض')}" loading="lazy" onerror="this.onerror=null;this.src='${esc(b.image||'assets/moba-shop-logo-512.webp')}'">
        <span>${s==='available'?esc(sec.badge||'متاح الآن'):(s==='unavailable'?'متوقف':'قريبًا')}</span><b>${esc(sec.title||sec.key)}</b><small>${esc(sec.subtitle||sec.currency||'اضغط للفتح')}</small>
      </button>`;
    }).join('');
    const head=document.querySelector('#gamesHome .games-home-head'); if(head)head.insertAdjacentElement('afterend',box); else document.getElementById('gamesHome')?.insertAdjacentElement('afterbegin',box);
  }
  async function boot(){
    document.body.classList.add('moba-catalog-loading');
    const cached=cachedSettings&&cachedSettings();
    if(cached){window.__mobaV186Settings=cached; renderGames(cached); renderHomeBanners(cached); document.body.classList.add('moba-settings-ready','moba-page-ready'); document.body.classList.remove('moba-page-booting');}
    const s=await settings(); window.__mobaV186Settings=s;
    renderGames(s); renderHomeBanners(s);
    document.body.classList.add('moba-settings-ready','moba-page-ready'); document.body.classList.remove('moba-catalog-loading','moba-page-booting');
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('[data-v186-home-section]'); if(!b)return;
    e.preventDefault(); e.stopImmediatePropagation();
    if(String(b.dataset.status||'')!=='available'){ if(window.mobaToast)window.mobaToast('القسم ده مش متاح حاليا'); else alert('القسم ده مش متاح حاليا'); return false; }
    window.activeGame=b.dataset.v186HomeGame||'pubg'; window.activeCat=b.dataset.v186HomeSection||'uc';
    if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth'});
    if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),60);
    return false;
  },true);
  document.addEventListener('DOMContentLoaded',boot); window.addEventListener('load',()=>setTimeout(boot,180));
  setTimeout(()=>{document.body.classList.add('moba-settings-ready')},1800);
  const st=document.createElement('style'); st.textContent=`
    body:not(.moba-settings-ready) #gamesHome .game-cards-grid,body:not(.moba-settings-ready) #homeSectionsV173,body:not(.moba-settings-ready) #homeSectionsV176,body:not(.moba-settings-ready) #homeSectionsV186{opacity:0!important;pointer-events:none!important;min-height:260px}
    .game-icon-mini{width:38px;height:38px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;background:rgba(9,18,32,.62);border:1px solid rgba(39,216,255,.22);margin-inline-end:8px;vertical-align:middle;overflow:hidden}.game-icon-mini img{width:100%;height:100%;object-fit:cover}.game-card .game-cover img{filter:saturate(1.08) contrast(1.05)}.game-badge.off{background:rgba(255,86,86,.16)!important;color:#ffd0d0!important;border-color:rgba(255,86,86,.34)!important}
    .home-sections-v186{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 18px}.home-sections-v186 button{position:relative;min-height:92px;border:1px solid rgba(39,216,255,.26);border-radius:20px;background:#07111e;color:#fff;text-align:right;padding:12px;overflow:hidden;cursor:pointer;box-shadow:0 16px 42px rgba(0,0,0,.24)}.home-sections-v186 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.45;filter:saturate(1.1) contrast(1.08)}.home-sections-v186:empty{display:none}.home-sections-v186 span,.home-sections-v186 b,.home-sections-v186 small{position:relative;display:block;text-shadow:0 2px 10px rgba(0,0,0,.6)}.home-sections-v186 span{color:#75ffcf;font-size:12px;font-weight:900}.home-sections-v186 b{font-size:17px;margin-top:6px}.home-sections-v186 small{color:#dbefff;margin-top:3px}.home-sections-v186 .is-soon{opacity:.72}@media(max-width:760px){.home-sections-v186{grid-template-columns:1fr 1fr}.home-sections-v186 button{min-height:82px}}
  `; document.head.appendChild(st);
})();


/* moba-v187-catalog-route-status-final-fix */
(function(){
  if(window.__mobaV187CatalogFinal)return; window.__mobaV187CatalogFinal=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normStatus(x){const s=String(x||'').trim().toLowerCase(); if(['available','active','on','open','live','enabled','متاح','متاح الآن','متاح الان'].includes(s))return 'available'; if(['unavailable','disabled','off','stopped','stop','closed','متوقف','غير متاح','غير متوفر'].includes(s))return 'unavailable'; if(['soon','coming','coming_soon','قريبا','قريبًا'].includes(s))return 'soon'; return s||'soon';}
  function applyStatusFromCache(){
    try{
      const raw=localStorage.getItem('moba_settings_cache_v187')||localStorage.getItem('moba_settings_cache'); if(!raw)return;
      const d=JSON.parse(raw), s=d&&d.settings?d.settings:d; if(!s)return;
      const mode=String(s.store_status||((String(s.busy_mode)==='true')?'busy':'available')).toLowerCase();
      const msg=s.store_status_message||s.busy_message||'';
      const cfg={available:['متاح الآن','التنفيذ شغال حاليا بشكل طبيعي.'],busy:['متاح ولكن فيه ضغط','تقدر تعمل الأوردر عادي لكن التنفيذ ممكن يتأخر شوية.'],closed:['خارج مواعيد التنفيذ','ينفع تعمل طلبك عادي دلوقتي. الطلب هيتسجل وأول ما نفتح يتنفذ.'],maintenance:['صيانة مؤقتة','الطلبات الجديدة متوقفة مؤقتا.']};
      const c=cfg[mode]||cfg.available; if(msg)c[1]=msg;
      document.querySelectorAll('#topStatusBadge,#headerStatusBadge,.store-status-pill,.status-pill,.live-status').forEach(el=>{
        if(!el||el.closest('#workStatusMini'))return; el.classList.remove('available','busy','closed','maintenance'); el.classList.add('store-status-pill',mode);
        el.innerHTML='<span class="status-dot"></span><span class="status-copy"><span class="status-label">'+esc(c[0])+'</span><small class="status-desc">'+esc(c[1])+'</small></span>';
      });
      const mini=document.getElementById('workStatusMini'); if(mini){mini.className='work-status-mini '+mode; mini.innerHTML='<div class="status-head"><span class="status-dot"></span><span>'+esc(c[0])+'</span></div><div class="status-desc">'+esc(c[1])+'</div>';}
    }catch(e){}
  }
  function getGames(){
    try{const raw=localStorage.getItem('moba_settings_cache_v187')||localStorage.getItem('moba_settings_cache'); const d=JSON.parse(raw||'{}'); const s=d.settings||d; return Array.isArray(s.game_settings)?s.game_settings:[];}catch(e){return []}
  }
  function getGameStatus(key){const hit=getGames().find(g=>String(g.key||g.id||'')===String(key)); return normStatus(hit&&hit.status||'');}
  function openGame(key){
    if(!key)return;
    window.activeGame=key;
    if(typeof window.firstSectionForGame==='function') window.activeCat=window.firstSectionForGame(key);
    else {
      const sections=Array.isArray(window.mobaDynamicSections)?window.mobaDynamicSections:[];
      const sec=sections.find(s=>s&&s.active!==false&&(s.game||'pubg')===key&&(s.location||'game')!=='home');
      window.activeCat=(sec&&sec.key)||'uc';
    }
    if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else {document.body.dataset.page='game'; document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth'});}
    if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),60);
  }
  // Capture before old soon handlers after catalog rendered: available games must open.
  document.addEventListener('click',function(e){
    const card=e.target.closest&&e.target.closest('#gamesHome [data-game]'); if(!card)return;
    const key=card.dataset.game||'';
    const ds=normStatus(card.dataset.gameStatus||''); const cached=getGameStatus(key); const st=ds==='available'||cached==='available'?'available':(ds||cached||'soon');
    if(st==='available'){e.preventDefault(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); openGame(key); return false;}
  },true);
  document.addEventListener('DOMContentLoaded',()=>{applyStatusFromCache(); setTimeout(()=>document.body.classList.add('moba-page-ready'),2200);});
  window.addEventListener('load',()=>{applyStatusFromCache();});
  const st=document.createElement('style'); st.textContent=`
    body[data-page="home"] #shopWorkspace,body[data-page="home"] #trackOrder,body[data-page="home"] #customerReviews{display:none!important}
    body[data-page="game"] .moba-view[data-page="home"],body[data-page="cart"] .moba-view[data-page="home"]{display:none!important}
    body.moba-page-booting #gamesHome .game-cards-grid{opacity:0!important;pointer-events:none!important;min-height:320px}
    body.moba-page-ready #gamesHome .game-cards-grid{opacity:1!important}
    #gamesHome .game-card .game-badge.available{background:rgba(62,239,156,.18)!important;border-color:rgba(62,239,156,.38)!important;color:#d7ffec!important}
    #gamesHome .game-card .game-badge.soon{background:rgba(255,216,107,.14)!important;border-color:rgba(255,216,107,.32)!important;color:#ffe8a3!important}
  `; document.head.appendChild(st);
})();


/* moba-v188-public-catalog-final-fix */
(function(){
  if(window.__mobaV188PublicCatalogFinalFix)return; window.__mobaV188PublicCatalogFinalFix=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=t=>String(t||'').trim().toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/\s+/g,' ');
  const normStatus=x=>{const s=norm(x); if(['available','active','on','open','live','enabled','متاح','متاح الان'].includes(s))return 'available'; if(['unavailable','disabled','off','stopped','stop','closed','متوقف','غير متاح','غير متوفر'].includes(s))return 'unavailable'; return 'soon';};
  const defaults={
    pubg:{title:'PUBG Mobile',currency:'UC',image:'assets/game-covers/pubg.webp',icon:'assets/game-icons/pubg-icon.webp',status:'available'},
    freefire:{title:'Free Fire',currency:'💎',image:'assets/game-covers/freefire-new.webp',icon:'assets/game-icons/freefire-icon.webp',status:'available'},
    roblox:{title:'Roblox',currency:'Robux',image:'assets/game-covers/roblox.webp',icon:'assets/game-icons/roblox.svg',status:'soon'},
    tiktok:{title:'TikTok',currency:'Coins',image:'assets/game-covers/tiktok.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'}
  };
  function cache(){try{const raw=localStorage.getItem('moba_settings_cache_v187')||localStorage.getItem('moba_settings_cache'); if(!raw)return {}; const d=JSON.parse(raw); return d.settings||d||{};}catch(e){return {};}}
  async function settings(){try{const r=await fetch('/api/settings?t='+Date.now(),{cache:'no-store'}); const d=await r.json(); const st=d.settings||{}; try{localStorage.setItem('moba_settings_cache_v187',JSON.stringify({settings:st,ts:Date.now()}));localStorage.setItem('moba_settings_cache',JSON.stringify(st));}catch(_){ } return st;}catch(e){return cache();}}
  function gameMap(st){const m=new Map(); Object.keys(defaults).forEach(k=>m.set(k,{key:k,...defaults[k]})); (Array.isArray(st.game_settings)?st.game_settings:[]).forEach(g=>{const k=String(g.key||g.id||g.game||'').trim(); if(!k)return; const b=m.get(k)||{}; m.set(k,{...b,...g,key:k,status:normStatus(g.status||b.status),active:g.active!==false});}); (Array.isArray(st.dynamic_sections)?st.dynamic_sections:[]).forEach(sec=>{const k=String(sec.game||'').trim(); if(!k)return; const b=m.get(k)||{key:k,title:k,status:'soon'}; if(normStatus(sec.status)==='available') b.status='available'; if(!b.currency&&sec.currency)b.currency=sec.currency; if(!b.image&&sec.image)b.image=sec.image; m.set(k,b);}); return m;}
  function isAvailable(game){const st=window.__mobaV188Settings||window.__mobaV186Settings||cache(); const g=gameMap(st).get(String(game||'')); const card=document.querySelector('#gamesHome [data-game="'+CSS.escape(String(game||''))+'"]'); const ds=card&&card.dataset.gameStatus; return normStatus(ds||g?.status)==='available';}
  window.mobaAllowGameClick=function(game){return isAvailable(game);};
  window.mobaCanOpenGame=function(game){return isAvailable(game);};
  window.mobaOpenGameV188=function(game){
    game=String(game||'pubg').trim(); window.activeGame=game;
    const sections=Array.isArray(window.mobaDynamicSections)?window.mobaDynamicSections:((window.__mobaV188Settings||{}).dynamic_sections||[]);
    const sec=sections.find(s=>s&&s.active!==false&&String(s.game||'pubg')===game&&['game','both'].includes(String(s.location||'game'))&&normStatus(s.status)==='available')||sections.find(s=>s&&String(s.game||'pubg')===game);
    window.activeCat=sec&&sec.key?sec.key:(game==='pubg'?'uc':'');
    if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else {document.body.dataset.page='game';document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth'});}
    if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),40);
  };
  function paintGames(st){
    const map=gameMap(st); window.mobaGameSettings=[...map.values()];
    document.querySelectorAll('#gamesHome [data-game]').forEach(card=>{const key=card.dataset.game; const g=map.get(key); if(!g)return; const status=normStatus(g.status); card.dataset.gameStatus=status; card.classList.toggle('active',status==='available'); card.classList.toggle('coming',status!=='available'); const b=card.querySelector('.game-badge,.game-status-v102'); if(b){b.className='game-badge '+(status==='available'?'available':status==='unavailable'?'soon off':'soon'); b.textContent=status==='available'?'متاح الآن':status==='unavailable'?'متوقف':'قريبًا';}
      const sm=card.querySelector('.game-card-content small'); if(sm)sm.textContent=g.currency||g.subtitle||''; const cover=card.querySelector('.game-cover img'); if(cover&&g.image){cover.src=g.image; cover.onerror=function(){this.onerror=null;this.src=(defaults[key]&&defaults[key].image)||'assets/moba-shop-logo-512.webp';};}
      const icon=card.querySelector('.game-icon-mini img,.game-mini-icon-v82'); if(icon&&g.icon){icon.src=g.icon; icon.onerror=function(){this.style.display='none'};}
    });
  }
  function renderHomeSections(st){
    document.querySelectorAll('#homeSectionsV173,#homeSectionsV176,#homeSectionsV186,#homeSectionsV188').forEach(x=>x.remove());
    const sections=(Array.isArray(st.dynamic_sections)?st.dynamic_sections:[]).filter(sec=>sec&&sec.active!==false&&['home','both','exclusive'].includes(String(sec.location||'')));
    const seen=new Map();
    sections.forEach(sec=>{const k=(sec.game||'pubg')+'|'+(sec.key||norm(sec.title)); const t=(sec.game||'pubg')+'|title:'+norm(sec.title||sec.key); const cur=seen.get(k)||seen.get(t); const clean={...sec,status:normStatus(sec.status||'available')}; if(cur){Object.assign(cur,clean,{key:cur.key||clean.key});} else {seen.set(k,clean); seen.set(t,clean);} });
    const unique=[...new Set([...seen.values()])].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    if(!unique.length)return;
    const gm=gameMap(st); const box=document.createElement('div'); box.id='homeSectionsV188'; box.className='home-sections-v186 home-sections-v188';
    box.innerHTML=unique.map(sec=>{const g=gm.get(String(sec.game||''))||defaults[sec.game]||{}; const s=normStatus(sec.status); const img=sec.image||g.image||'assets/moba-shop-logo-512.webp'; return `<button type="button" data-v188-home-section="${esc(sec.key)}" data-v188-home-game="${esc(sec.game||'pubg')}" data-status="${esc(s)}" class="${s==='available'?'':'is-soon'}"><img src="${esc(img)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(g.image||'assets/moba-shop-logo-512.webp')}'"><span>${s==='available'?esc(sec.badge||'متاح'):s==='unavailable'?'متوقف':'قريبًا'}</span><b>${esc(sec.title||sec.key)}</b><small>${esc(sec.subtitle||sec.currency||'اضغط للفتح')}</small></button>`}).join('');
    const head=document.querySelector('#gamesHome .games-home-head'); if(head)head.insertAdjacentElement('afterend',box); else document.getElementById('gamesHome')?.prepend(box);
  }
  async function boot(){const st=await settings(); window.__mobaV188Settings=st; window.mobaDynamicSections=Array.isArray(st.dynamic_sections)?st.dynamic_sections:[]; paintGames(st); renderHomeSections(st); document.body.classList.add('moba-settings-ready','moba-page-ready'); document.body.classList.remove('moba-page-booting','moba-catalog-loading');}
  document.addEventListener('click',function(e){const card=e.target.closest&&e.target.closest('#gamesHome [data-game]'); if(!card)return; const game=card.dataset.game; if(isAvailable(game)){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); window.mobaOpenGameV188(game); return false;}},true);
  document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('[data-v188-home-section]'); if(!b)return; e.preventDefault();e.stopPropagation(); if(b.dataset.status!=='available'){window.mobaToast?window.mobaToast('القسم ده مش متاح حاليا'):alert('القسم ده مش متاح حاليا');return false;} window.activeGame=b.dataset.v188HomeGame||'pubg'; window.activeCat=b.dataset.v188HomeSection||''; if(typeof window.mobaShowView==='function')window.mobaShowView('game'); if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),40);},true);
  document.addEventListener('DOMContentLoaded',boot); window.addEventListener('load',()=>setTimeout(boot,120));
})();


/* moba-v189-final-delete-open-icons-no-flicker */
(function(){
  if(window.__mobaV189FinalDeleteOpenIconsNoFlicker)return; window.__mobaV189FinalDeleteOpenIconsNoFlicker=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=t=>String(t||'').trim().toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/\s+/g,' ');
  const stNorm=x=>{const s=norm(x); if(['available','active','on','open','live','enabled','متاح','متاح الان'].includes(s))return 'available'; if(['unavailable','disabled','off','stopped','stop','closed','متوقف','غير متاح','غير متوفر'].includes(s))return 'unavailable'; return 'soon';};
  const FALL={pubg:{title:'PUBG Mobile',currency:'UC',image:'assets/game-covers/pubg.webp',icon:'assets/game-icons/pubg-icon.webp'},freefire:{title:'Free Fire',currency:'💎',image:'assets/game-covers/freefire-new.webp',icon:'assets/game-icons/freefire-icon.webp'},roblox:{title:'Roblox',currency:'Robux',image:'assets/game-covers/roblox.webp',icon:'assets/game-icons/roblox.svg'},tiktok:{title:'TikTok',currency:'Coins',image:'assets/game-covers/tiktok.webp',icon:'assets/game-icons/tiktok-icon.webp'},valorant:{title:'Valorant',currency:'VP',image:'assets/game-covers/valorant.jpg',icon:'assets/game-icons/valorant-icon.jpg'}};
  function cache(){try{const raw=localStorage.getItem('moba_settings_cache_v189')||localStorage.getItem('moba_settings_cache_v187')||localStorage.getItem('moba_settings_cache'); if(!raw)return {}; const d=JSON.parse(raw); return d.settings||d||{};}catch(_){return {};}}
  async function getSettings(){try{const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); const s=d.settings||{}; try{localStorage.setItem('moba_settings_cache_v189',JSON.stringify({settings:s,ts:Date.now()}));localStorage.setItem('moba_settings_cache_v187',JSON.stringify({settings:s,ts:Date.now()}));localStorage.setItem('moba_settings_cache',JSON.stringify(s));}catch(_){} return s;}catch(_){return cache();}}
  function gameMap(s){const m=new Map(); document.querySelectorAll('#gamesHome [data-game]').forEach(card=>{const k=String(card.dataset.game||'').trim(); if(k)m.set(k,{key:k,title:card.querySelector('b')?.textContent||k,subtitle:card.querySelector('small')?.textContent||'',status:stNorm(card.dataset.gameStatus||''),image:card.querySelector('.game-cover img')?.getAttribute('src')||'',icon:card.querySelector('.game-icon-mini img,.game-mini-icon-v82')?.getAttribute('src')||''});}); Object.entries(FALL).forEach(([k,v])=>{if(!m.has(k))m.set(k,{key:k,status:'soon',...v});}); (Array.isArray(s.game_settings)?s.game_settings:[]).forEach(g=>{const k=String(g.key||g.id||g.game||'').trim(); if(k)m.set(k,{...(m.get(k)||{}),...g,key:k,status:stNorm(g.status||m.get(k)?.status)});}); return m;}
  function activeSections(s){const arr=Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]; const by=new Map(), titleSeen=new Map(); arr.forEach(sec=>{if(!sec||sec.active===false)return; const game=String(sec.game||'pubg'), key=String(sec.key||'').trim(); const title=String(sec.title||key).trim(); if(!key||!title)return; const loc=String(sec.location||'game'); if(loc==='deleted')return; const k=game+'|'+key, t=game+'|'+norm(title); const clean={...sec,game,key,title,status:stNorm(sec.status||'available')}; if(titleSeen.has(t)){Object.assign(by.get(titleSeen.get(t)),clean,{key:by.get(titleSeen.get(t)).key});}else{titleSeen.set(t,k);by.set(k,clean);} }); return [...by.values()].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));}
  function isAvailable(game){const s=window.__mobaV189Settings||cache(); const m=gameMap(s); const g=m.get(String(game)); const card=document.querySelector('#gamesHome [data-game="'+CSS.escape(String(game))+'"]'); const ds=card&&card.dataset.gameStatus; return stNorm(ds||g?.status)==='available';}
  function firstSection(game){const s=window.__mobaV189Settings||cache(); const sec=activeSections(s).find(x=>x.game===game&&['game','both'].includes(String(x.location||'game'))&&stNorm(x.status)==='available')||activeSections(s).find(x=>x.game===game&&['game','both'].includes(String(x.location||'game'))); if(sec)return sec.key; const prods=window.mobaProducts||{}; const k=Object.keys(prods).find(cat=>(prods[cat]||[]).some(p=>(p.game||'pubg')===game)); return k||'';}
  function openGame(game){game=String(game||'pubg'); window.activeGame=game; window.activeCat=firstSection(game); if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else document.body.dataset.page='game'; if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),20); document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});}
  function paint(s){window.__mobaV189Settings=s; window.mobaDynamicSections=activeSections(s); const gm=gameMap(s); document.querySelectorAll('#gamesHome [data-game]').forEach(card=>{const key=card.dataset.game; const g=gm.get(key)||{}; const status=stNorm(g.status||card.dataset.gameStatus); card.dataset.gameStatus=status; card.classList.toggle('active',status==='available'); card.classList.toggle('coming',status!=='available'); let b=card.querySelector('.game-badge,.game-status-v102'); if(!b){b=document.createElement('span'); b.className='game-badge'; card.querySelector('.game-card-content')?.prepend(b);} if(b){b.className='game-badge '+(status==='available'?'available':status==='unavailable'?'soon off':'soon'); b.textContent=status==='available'?'متاح الآن':status==='unavailable'?'متوقف':'قريبًا';}
      const sm=card.querySelector('.game-card-content small'); if(sm)sm.textContent=g.currency||g.subtitle||sm.textContent||''; const cover=card.querySelector('.game-cover img'); if(cover){cover.src=g.image||FALL[key]?.image||cover.src; cover.onerror=function(){this.onerror=null;this.src=FALL[key]?.image||'assets/moba-shop-logo-512.webp'};} const icon=card.querySelector('.game-icon-mini img,.game-mini-icon-v82'); if(icon){icon.src=g.icon||FALL[key]?.icon||icon.src; icon.onerror=function(){this.onerror=null;this.src='assets/moba-shop-logo-256.png'};}
    }); renderHomeSections(s); document.body.classList.remove('moba-page-booting','moba-catalog-loading'); document.body.classList.add('moba-page-ready','moba-settings-ready');}
  function renderHomeSections(s){document.querySelectorAll('#homeSectionsV173,#homeSectionsV176,#homeSectionsV186,#homeSectionsV188,#homeSectionsV189').forEach(x=>x.remove()); const sections=activeSections(s).filter(sec=>['home','both','exclusive'].includes(String(sec.location||''))); if(!sections.length)return; const gm=gameMap(s); const box=document.createElement('div'); box.id='homeSectionsV189'; box.className='home-sections-v189'; box.innerHTML=sections.map(sec=>{const g=gm.get(sec.game)||{}; const status=stNorm(sec.status); const img=sec.image||g.image||'assets/moba-shop-logo-512.webp'; return `<button type="button" data-v189-home-section="${esc(sec.key)}" data-v189-home-game="${esc(sec.game)}" data-status="${esc(status)}" class="${status==='available'?'':'is-soon'}"><img src="${esc(img)}" onerror="this.onerror=null;this.src='${esc(g.image||'assets/moba-shop-logo-512.webp')}'"><span>${status==='available'?esc(sec.badge||'متاح'):status==='unavailable'?'متوقف':'قريبًا'}</span><b>${esc(sec.title)}</b><small>${esc(sec.subtitle||sec.currency||'اضغط للفتح')}</small></button>`}).join(''); const head=document.querySelector('#gamesHome .games-home-head'); (head||document.getElementById('gamesHome'))?.insertAdjacentElement(head?'afterend':'afterbegin',box);}
  // Fast paint from cache prevents the delayed badge/status glitch.
  try{paint(cache());}catch(_){ }
  getSettings().then(paint).catch(()=>{});
  document.addEventListener('DOMContentLoaded',()=>{try{paint(cache())}catch(_){}});
  window.addEventListener('load',()=>getSettings().then(paint).catch(()=>{}));
  document.addEventListener('click',function(e){const card=e.target.closest&&e.target.closest('#gamesHome [data-game]'); if(!card)return; const game=card.dataset.game; if(isAvailable(game)){e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); openGame(game); return false;} const st=stNorm(card.dataset.gameStatus); e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); (window.mobaToast||alert)(st==='unavailable'?'اللعبة غير متوفرة حاليًا':'اللعبة دي هتتضاف قريبًا'); return false;},true);
  document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('[data-v189-home-section]'); if(!b)return; e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); if(b.dataset.status!=='available'){(window.mobaToast||alert)('القسم ده مش متاح حاليا'); return false;} window.activeGame=b.dataset.v189HomeGame||'pubg'; window.activeCat=b.dataset.v189HomeSection||firstSection(window.activeGame); if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else document.body.dataset.page='game'; if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),20); return false;},true);
  const css=document.createElement('style'); css.textContent=`
    html body.moba-page-booting .moba-view[data-page="game"],html body.moba-page-booting #shopWorkspace,html body.moba-page-booting #trackOrder,html body.moba-page-booting #customerReviews{display:none!important}
    #gamesHome .game-icon-mini,#gamesHome .game-mini-icon-v82{width:38px!important;height:38px!important;border-radius:12px!important;overflow:hidden!important;display:inline-grid!important;place-items:center!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(39,216,255,.24)!important;flex:0 0 auto!important}
    #gamesHome .game-icon-mini img,#gamesHome .game-mini-icon-v82{width:100%!important;height:100%!important;object-fit:cover!important;aspect-ratio:1/1!important}
    #gamesHome .game-cover img{object-fit:cover!important}
    #gamesHome .game-card-content{align-items:start!important}.game-badge{border-radius:999px!important;padding:5px 9px!important;font-weight:1000!important;font-size:11px!important}
    .home-sections-v189{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 18px}.home-sections-v189:empty{display:none}.home-sections-v189 button{position:relative;min-height:92px;border:1px solid rgba(39,216,255,.26);border-radius:20px;background:#07111e;color:#fff;text-align:right;padding:12px;overflow:hidden;cursor:pointer}.home-sections-v189 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.46;filter:saturate(1.08) contrast(1.05)}.home-sections-v189 span,.home-sections-v189 b,.home-sections-v189 small{position:relative;display:block;text-shadow:0 2px 10px rgba(0,0,0,.65)}.home-sections-v189 span{justify-self:start;color:#75ffcf;background:rgba(16,255,190,.12);border:1px solid rgba(16,255,190,.25);border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900}.home-sections-v189 b{font-size:18px;margin-top:7px}.home-sections-v189 small{color:#e5f5ff;margin-top:4px}@media(max-width:760px){.home-sections-v189{grid-template-columns:1fr 1fr}}@media(max-width:520px){.home-sections-v189{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
})();


/* moba-v190-month6-purge-game-open-final */
(function(){
  if(window.__mobaV190Month6GameOpenFinal)return; window.__mobaV190Month6GameOpenFinal=true;
  const norm=t=>String(t||'').trim().toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/\s+/g,' ');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stNorm=x=>{const s=norm(x); if(['available','active','on','open','live','enabled','متاح','متاح الان'].includes(s))return 'available'; if(['unavailable','disabled','off','stopped','stop','closed','متوقف','غير متاح','غير متوفر'].includes(s))return 'unavailable'; return 'soon';};
  const isLegacyMonth6=sec=>{
    const title=norm(sec&&sec.title); if(!/عروض? شهر 6/.test(title))return false;
    // الأقسام القديمة التي ظهرت قبل نسخة v190 لا تحتوي على origin، فبنخفيها لحد ما تتشال من السيرفر.
    return !sec.origin && !sec.created_from_admin_v190;
  };
  function readCache(){try{const raw=localStorage.getItem('moba_settings_cache_v190')||localStorage.getItem('moba_settings_cache_v189')||localStorage.getItem('moba_settings_cache_v187')||localStorage.getItem('moba_settings_cache'); if(!raw)return {}; const d=JSON.parse(raw); return d.settings||d||{};}catch(_){return {};}}
  function gamesMap(s){const m=new Map(); (Array.isArray(s.game_settings)?s.game_settings:[]).forEach(g=>{const k=String(g.key||g.id||g.game||'').trim(); if(k)m.set(k,{...g,key:k,status:stNorm(g.status)});}); document.querySelectorAll('#gamesHome [data-game]').forEach(card=>{const k=String(card.dataset.game||'').trim(); if(!k)return; const old=m.get(k)||{}; m.set(k,{...old,key:k,status:stNorm(old.status||card.dataset.gameStatus),title:old.title||card.querySelector('b')?.textContent||k,currency:old.currency||card.querySelector('small')?.textContent||''});}); return m;}
  function canOpen(game){const s=window.__mobaV189Settings||window.__mobaV188Settings||window.__mobaV186Settings||readCache(); const g=gamesMap(s).get(String(game||'')); const card=document.querySelector('#gamesHome [data-game="'+CSS.escape(String(game||''))+'"]'); return stNorm((g&&g.status)||(card&&card.dataset.gameStatus))==='available';}
  window.mobaAllowGameClick=canOpen;
  window.mobaCanOpenGame=canOpen;
  function firstSection(game){const s=window.__mobaV189Settings||readCache(); const arr=(Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).filter(x=>x&&x.active!==false&&!isLegacyMonth6(x)&&String(x.game||'pubg')===String(game)&&['game','both'].includes(String(x.location||'game'))); const hit=arr.find(x=>stNorm(x.status)==='available')||arr[0]; if(hit&&hit.key)return hit.key; const products=window.mobaProducts||{}; return Object.keys(products).find(cat=>(products[cat]||[]).some(p=>String(p.game||'pubg')===String(game)))||'';
  }
  function openGame(game){window.activeGame=String(game||'pubg'); window.activeCat=firstSection(window.activeGame); if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else {document.body.dataset.page='game'; document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});} if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),30);}
  window.mobaOpenGameV190=openGame;
  function repaintHomeSections(){
    const s=window.__mobaV189Settings||readCache();
    document.querySelectorAll('#homeSectionsV173,#homeSectionsV176,#homeSectionsV186,#homeSectionsV188,#homeSectionsV189,#homeSectionsV190').forEach(x=>x.remove());
    const seen=new Map();
    (Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).forEach(sec=>{
      if(!sec||sec.active===false||isLegacyMonth6(sec))return;
      const loc=String(sec.location||''); if(!['home','both','exclusive'].includes(loc))return;
      const key=(sec.game||'pubg')+'|'+(sec.key||norm(sec.title)); const title=(sec.game||'pubg')+'|title:'+norm(sec.title||sec.key);
      if(seen.has(title)){ const prev=seen.get(title); seen.set(prev,{...prev,...sec,key:prev.key}); return; }
      seen.set(key,sec); seen.set(title,key);
    });
    const list=[...seen.values()].filter(x=>typeof x==='object').sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    if(!list.length)return;
    const gm=gamesMap(s); const box=document.createElement('div'); box.id='homeSectionsV190'; box.className='home-sections-v189 home-sections-v190';
    box.innerHTML=list.map(sec=>{const g=gm.get(String(sec.game||''))||{}; const status=stNorm(sec.status||'available'); const img=sec.image||g.image||'assets/moba-shop-logo-512.webp'; return `<button type="button" data-v190-home-section="${esc(sec.key)}" data-v190-home-game="${esc(sec.game||'pubg')}" data-status="${esc(status)}" class="${status==='available'?'':'is-soon'}"><img src="${esc(img)}" onerror="this.onerror=null;this.src='${esc(g.image||'assets/moba-shop-logo-512.webp')}'"><span>${status==='available'?esc(sec.badge||'متاح'):status==='unavailable'?'متوقف':'قريبًا'}</span><b>${esc(sec.title||sec.key)}</b><small>${esc(sec.subtitle||sec.currency||'اضغط للفتح')}</small></button>`}).join('');
    const head=document.querySelector('#gamesHome .games-home-head'); (head||document.getElementById('gamesHome'))?.insertAdjacentElement(head?'afterend':'afterbegin',box);
  }
  async function reload(){try{const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); const s=d.settings||{}; window.__mobaV189Settings=s; try{localStorage.setItem('moba_settings_cache_v190',JSON.stringify({settings:s,ts:Date.now()}));}catch(_){} repaintHomeSections();}catch(_){repaintHomeSections();}}
  document.addEventListener('click',function(e){const card=e.target.closest&&e.target.closest('#gamesHome [data-game]'); if(!card)return; const game=card.dataset.game; if(canOpen(game)){e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); openGame(game); return false;}},true);
  document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('[data-v190-home-section]'); if(!b)return; e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); if(b.dataset.status!=='available'){(window.mobaToast||alert)('القسم ده مش متاح حاليا');return false;} window.activeGame=b.dataset.v190HomeGame||'pubg'; window.activeCat=b.dataset.v190HomeSection||firstSection(window.activeGame); if(typeof window.mobaShowView==='function')window.mobaShowView('game'); if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),30); return false;},true);
  document.addEventListener('DOMContentLoaded',()=>{repaintHomeSections(); reload();}); window.addEventListener('load',()=>setTimeout(reload,120));
})();


/* moba-v191-single-home-sections-and-square-icons */
(function(){
  if(window.__mobaV191SingleHomeSections)return; window.__mobaV191SingleHomeSections=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=t=>String(t||'').trim().toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/\s+/g,' ');
  const statusNorm=x=>{const s=norm(x); if(['available','active','on','open','live','enabled','متاح','متاح الان'].includes(s))return 'available'; if(['unavailable','disabled','off','stopped','stop','closed','متوقف','غير متاح','غير متوفر'].includes(s))return 'unavailable'; return 'soon';};
  const BASE={
    pubg:{key:'pubg',title:'PUBG Mobile',subtitle:'UC | ازدهار | برايم',currency:'UC',status:'available',sort_order:1,image:'assets/game-covers/pubg-new.webp',icon:'assets/game-icons/pubg-icon.webp'},
    freefire:{key:'freefire',title:'Free Fire',subtitle:'Diamonds',currency:'💎',status:'available',sort_order:2,image:'assets/game-covers/freefire-new.webp',icon:'assets/game-icons/freefire-icon.webp'},
    roblox:{key:'roblox',title:'Roblox',subtitle:'Robux',currency:'Robux',status:'soon',sort_order:3,image:'assets/game-covers/roblox.webp',icon:'assets/game-icons/roblox.svg'},
    tiktok:{key:'tiktok',title:'TikTok',subtitle:'Coins',currency:'Coins',status:'soon',sort_order:4,image:'assets/game-covers/tiktok.webp',icon:'assets/game-icons/tiktok-icon.webp'},
    valorant:{key:'valorant',title:'Valorant',subtitle:'VP',currency:'VP',status:'soon',sort_order:5,image:'assets/game-covers/valorant.jpg',icon:'assets/game-icons/valorant-icon.jpg'},
    yalla_ludo:{key:'yalla_ludo',title:'Yalla Ludo',subtitle:'Diamonds / Coins',currency:'Diamonds',status:'soon',sort_order:6,image:'assets/game-covers/yalla_ludo.webp',icon:'assets/moba-shop-logo-256.png'},
    last_war:{key:'last_war',title:'Last War',subtitle:'Coins',currency:'Coins',status:'soon',sort_order:7,image:'assets/game-covers/last_war.webp',icon:'assets/moba-shop-logo-256.png'},
    efootball:{key:'efootball',title:'eFootball',subtitle:'Coins / Points',currency:'Coins',status:'soon',sort_order:8,image:'assets/game-covers/efootball.webp',icon:'assets/moba-shop-logo-256.png'},
    blood_global:{key:'blood_global',title:'Blood Strike Global',subtitle:'Global Top Up',currency:'Gold',status:'soon',sort_order:9,image:'assets/game-covers/blood_global.jpg',icon:'assets/game-icons/bloodstrike-global.svg'},
    blood_mena:{key:'blood_mena',title:'Blood Strike MENA',subtitle:'MENA Top Up',currency:'Gold',status:'soon',sort_order:10,image:'assets/game-covers/blood_mena.jpg',icon:'assets/game-icons/bloodstrike.svg'},
    kingshot:{key:'kingshot',title:'King Shot',subtitle:'Top Up',currency:'Top Up',status:'soon',sort_order:11,image:'assets/game-covers/kingshot.webp',icon:'assets/moba-shop-logo-256.png'},
    '8ball':{key:'8ball',title:'8 Ball Pool',subtitle:'Coins / Cash',currency:'Coins',status:'soon',sort_order:12,image:'assets/game-covers/8ball.webp',icon:'assets/moba-shop-logo-256.png'},
    goal_battle:{key:'goal_battle',title:'Goal Battle',subtitle:'Top Up',currency:'Top Up',status:'soon',sort_order:13,image:'assets/game-covers/goal_battle.webp',icon:'assets/moba-shop-logo-256.png'}
  };
  function readCache(){
    const keys=['moba_settings_cache_v191','moba_settings_cache_v190','moba_settings_cache_v189','moba_settings_cache_v187','moba_settings_cache'];
    for(const k of keys){try{const raw=localStorage.getItem(k); if(!raw)continue; const j=JSON.parse(raw); return j.settings||j||{};}catch(_){}}
    return {};
  }
  function currentSettings(){return window.__mobaV191Settings||window.__mobaV189Settings||window.__mobaV188Settings||window.__mobaV186Settings||readCache()||{};}
  function gameList(s){
    const m=new Map(Object.entries(BASE).map(([k,v])=>[k,{...v}]));
    (Array.isArray(s.game_settings)?s.game_settings:[]).forEach(g=>{const k=String(g.key||g.id||g.game||'').trim(); if(k)m.set(k,{...(m.get(k)||{}),...g,key:k,status:statusNorm(g.status)});});
    return [...m.values()].filter(g=>g.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
  }
  function gameMap(s){return new Map(gameList(s).map(g=>[g.key,g]));}
  function uniqueHomeSections(s){
    const gm=gameMap(s), map=new Map();
    (Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).forEach((sec,i)=>{
      if(!sec||sec.active===false)return;
      const loc=String(sec.location||'game');
      if(!['home','both','exclusive'].includes(loc))return;
      const game=String(sec.game||'pubg');
      const title=String(sec.title||sec.name||sec.key||'').trim();
      if(!title)return;
      const key=game+'|'+norm(title); // يمنع تكرار نفس العرض حتى لو الكود مختلف
      const g=gm.get(game)||{};
      map.set(key,{...sec,game,title,_idx:i,image:sec.image||g.image||BASE[game]?.image||'assets/moba-shop-logo-512.webp',icon:g.icon||BASE[game]?.icon||'assets/moba-shop-logo-256.png',currency:sec.currency||g.currency||''});
    });
    return [...map.values()].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||Number(a._idx||0)-Number(b._idx||0));
  }
  function removeOldHomeSectionBoxes(){
    document.querySelectorAll('#exclusiveOfferV168,#homeSectionsV173,#homeSectionsV176,#homeSectionsV186,#homeSectionsV188,#homeSectionsV189,#homeSectionsV190').forEach(x=>x.remove());
    const boxes=[...document.querySelectorAll('#homeSectionsV191')];
    boxes.slice(1).forEach(x=>x.remove());
  }
  let rendering=false;
  function renderHomeSections(){
    if(rendering)return; rendering=true;
    try{
      removeOldHomeSectionBoxes();
      const s=currentSettings();
      const list=uniqueHomeSections(s);
      let box=document.getElementById('homeSectionsV191');
      if(!box){box=document.createElement('div'); box.id='homeSectionsV191'; box.className='home-sections-v191';}
      box.innerHTML=list.map(sec=>{
        const status=statusNorm(sec.status||'available');
        const b=status==='available'?(sec.badge||'متاح'):status==='unavailable'?'متوقف':'قريبًا';
        return `<button type="button" data-v191-home-section="${esc(sec.key)}" data-v191-home-game="${esc(sec.game)}" data-status="${esc(status)}" class="${status==='available'?'':'is-soon'}"><img src="${esc(sec.image)}" alt="${esc(sec.title)}" loading="eager" decoding="async" onerror="this.onerror=null;this.src='assets/moba-shop-logo-512.webp'"><span>${esc(b)}</span><b>${esc(sec.title)}</b><small>${esc(sec.subtitle||sec.currency||'اضغط للفتح')}</small></button>`;
      }).join('');
      if(list.length){
        const head=document.querySelector('#gamesHome .games-home-head');
        if(!box.parentNode)(head||document.getElementById('gamesHome'))?.insertAdjacentElement(head?'afterend':'afterbegin',box);
      }else box.remove();
    }finally{rendering=false;}
  }
  function updateGameCards(){
    const s=currentSettings(); const gm=gameMap(s);
    document.querySelectorAll('#gamesHome [data-game]').forEach(card=>{
      const k=String(card.dataset.game||''); const g=gm.get(k)||BASE[k]||{key:k,title:k,status:'soon'}; const st=statusNorm(g.status);
      card.dataset.gameStatus=st;
      card.classList.toggle('coming',st!=='available'); card.classList.toggle('active',st==='available'); card.classList.toggle('available',st==='available');
      const cover=card.querySelector('.game-cover img'); if(cover){const src=g.image||BASE[k]?.image||cover.getAttribute('src')||'assets/moba-shop-logo-512.webp'; if(cover.getAttribute('src')!==src)cover.setAttribute('src',src); cover.onerror=function(){this.onerror=null; this.src=BASE[k]?.image||'assets/moba-shop-logo-512.webp'};}
      let content=card.querySelector('.game-card-content'); if(!content)return;
      let badge=content.querySelector('.game-badge'); if(!badge){badge=document.createElement('span'); badge.className='game-badge'; content.prepend(badge);} badge.className='game-badge '+(st==='available'?'available':st==='unavailable'?'unavailable':'soon'); badge.textContent=st==='available'?'متاح الآن':st==='unavailable'?'متوقف':'قريبًا';
      let icon=content.querySelector('.game-square-icon-v191'); if(!icon){icon=document.createElement('span'); icon.className='game-square-icon-v191'; badge.insertAdjacentElement('afterend',icon);} const iconSrc=g.icon||BASE[k]?.icon||'assets/moba-shop-logo-256.png'; icon.innerHTML=`<img src="${esc(iconSrc)}" alt="${esc(g.title||k)}" onerror="this.onerror=null;this.src='assets/moba-shop-logo-256.png'">`;
      const b=content.querySelector('b'); if(b&&g.title)b.textContent=g.title;
      const small=content.querySelector('small'); if(small)small.textContent=g.currency||g.subtitle||BASE[k]?.subtitle||small.textContent||'';
    });
  }
  async function loadSettingsFresh(){
    try{const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); const s=d.settings||d||{}; window.__mobaV191Settings=s; try{localStorage.setItem('moba_settings_cache_v191',JSON.stringify({settings:s,ts:Date.now()}));}catch(_){}; updateGameCards(); renderHomeSections();}
    catch(_){updateGameCards(); renderHomeSections();}
  }
  function firstSection(game){
    const s=currentSettings(); const arr=(Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).filter(x=>x&&x.active!==false&&String(x.game||'pubg')===String(game)&&['game','both'].includes(String(x.location||'game'))).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const hit=arr.find(x=>statusNorm(x.status)==='available')||arr[0]; if(hit&&hit.key)return hit.key;
    const products=window.mobaProducts||{}; return Object.keys(products).find(cat=>(products[cat]||[]).some(p=>String(p.game||'pubg')===String(game)))||'';
  }
  function openGame(game){
    window.activeGame=String(game||'pubg'); window.activeCat=firstSection(window.activeGame);
    if(typeof window.mobaShowView==='function')window.mobaShowView('game'); else {document.body.dataset.page='game'; document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});}
    if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),20);
  }
  window.mobaOpenGameV191=openGame;
  document.addEventListener('click',function(e){
    const sec=e.target.closest&&e.target.closest('[data-v191-home-section]');
    if(sec){e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); if(sec.dataset.status!=='available'){(window.mobaToast||alert)('القسم ده مش متاح حاليا');return false;} window.activeGame=sec.dataset.v191HomeGame||'pubg'; window.activeCat=sec.dataset.v191HomeSection||firstSection(window.activeGame); if(typeof window.mobaShowView==='function')window.mobaShowView('game'); if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),20); return false;}
    const card=e.target.closest&&e.target.closest('#gamesHome [data-game]');
    if(card){const game=card.dataset.game; const st=statusNorm(card.dataset.gameStatus); if(st==='available'){e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); openGame(game); return false;}}
  },true);
  let obsTimer=null; function schedule(){clearTimeout(obsTimer); obsTimer=setTimeout(()=>{removeOldHomeSectionBoxes(); updateGameCards(); if(!document.getElementById('homeSectionsV191'))renderHomeSections();},40);}
  const root=document.getElementById('gamesHome'); if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:false});
  document.addEventListener('DOMContentLoaded',()=>{updateGameCards(); renderHomeSections(); loadSettingsFresh(); setTimeout(schedule,350); setTimeout(schedule,900); setTimeout(schedule,1800);});
  window.addEventListener('load',()=>{setTimeout(loadSettingsFresh,80); setTimeout(schedule,500);});
  setInterval(()=>{removeOldHomeSectionBoxes();},1200);
  const css=document.createElement('style'); css.textContent=`
    #exclusiveOfferV168,#homeSectionsV173,#homeSectionsV176,#homeSectionsV186,#homeSectionsV188,#homeSectionsV189,#homeSectionsV190{display:none!important}
    .home-sections-v191{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 18px}.home-sections-v191:empty{display:none}.home-sections-v191 button{position:relative;min-height:96px;border:1px solid rgba(39,216,255,.28);border-radius:20px;background:#07111e;color:#fff;text-align:right;padding:12px;overflow:hidden;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.22),inset 0 0 0 1px rgba(255,255,255,.04)}.home-sections-v191 button img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.58;filter:saturate(1.14) contrast(1.08)}.home-sections-v191 button:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,11,24,.94),rgba(4,11,24,.45),rgba(4,11,24,.18));pointer-events:none}.home-sections-v191 span,.home-sections-v191 b,.home-sections-v191 small{position:relative;z-index:1;display:block;text-shadow:0 2px 10px rgba(0,0,0,.7)}.home-sections-v191 span{width:max-content;color:#75ffcf;background:rgba(16,255,190,.14);border:1px solid rgba(16,255,190,.28);border-radius:999px;padding:4px 9px;font-size:11px;font-weight:1000}.home-sections-v191 b{font-size:18px;margin-top:8px;font-weight:1000}.home-sections-v191 small{color:#e5f5ff;margin-top:4px;font-weight:800}.home-sections-v191 .is-soon{opacity:.68}
    #gamesHome .game-card{overflow:hidden!important}#gamesHome .game-cover img{width:100%!important;height:100%!important;object-fit:cover!important;image-rendering:auto!important;transform:translateZ(0)}#gamesHome .game-card-content{display:grid!important;grid-template-columns:48px 1fr!important;grid-template-areas:'icon badge' 'icon title' 'icon sub'!important;align-items:center!important;gap:2px 10px!important;text-align:right!important}#gamesHome .game-square-icon-v191{grid-area:icon!important;width:48px!important;height:48px!important;border-radius:13px!important;overflow:hidden!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(39,216,255,.28)!important;box-shadow:0 8px 22px rgba(0,0,0,.28)!important}#gamesHome .game-square-icon-v191 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}#gamesHome .game-card-content .game-badge{grid-area:badge!important;width:max-content!important}#gamesHome .game-card-content b{grid-area:title!important}#gamesHome .game-card-content small{grid-area:sub!important}.game-badge.unavailable{background:rgba(255,80,100,.16)!important;border-color:rgba(255,80,100,.32)!important;color:#ffb7c0!important}
    @media(max-width:760px){.home-sections-v191{grid-template-columns:1fr 1fr}#gamesHome .game-card-content{grid-template-columns:42px 1fr!important}#gamesHome .game-square-icon-v191{width:42px!important;height:42px!important}}@media(max-width:520px){.home-sections-v191{grid-template-columns:1fr}}
  `; document.head.appendChild(css);
})();


/* moba-v193-final-home-section-dedupe */
(function(){
  if(window.__mobaV193FinalHomeSectionDedupe)return; window.__mobaV193FinalHomeSectionDedupe=true;
  const norm=t=>String(t||'').trim().toLowerCase()
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
    .replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/[^\p{L}\p{N}\s]/gu,' ')
    .replace(/\b(عرض|عروض|العروض|offer|offers)\b/gi,'')
    .replace(/\s+/g,' ').trim();
  function ckey(btn){
    const game=String(btn.dataset.v191HomeGame||btn.dataset.v190HomeGame||btn.dataset.v189HomeGame||btn.dataset.v188HomeGame||btn.dataset.game||'pubg');
    let title=norm(btn.querySelector('b')?.textContent || btn.textContent || btn.dataset.v191HomeSection || btn.dataset.v190HomeSection || '');
    if(/شهر\s*6/.test(title) || /month\s*6/i.test(title)) title='month_6_offer';
    return game+'|'+title;
  }
  function enforce(){
    // امسح كل صناديق العرض القديمة نهائيا وسيب الصندوق النهائي فقط
    document.querySelectorAll('#exclusiveOfferV168,#homeSectionsV173,#homeSectionsV176,#homeSectionsV186,#homeSectionsV188,#homeSectionsV189,#homeSectionsV190').forEach(x=>x.remove());
    const boxes=[...document.querySelectorAll('#homeSectionsV191')];
    boxes.slice(1).forEach(x=>x.remove());
    const box=boxes[0]||document.getElementById('homeSectionsV191'); if(!box)return;
    const seen=new Set();
    [...box.querySelectorAll('button')].forEach(btn=>{const k=ckey(btn); if(seen.has(k))btn.remove(); else seen.add(k);});
  }
  document.addEventListener('DOMContentLoaded',()=>{enforce(); setTimeout(enforce,80); setTimeout(enforce,350); setTimeout(enforce,900); setTimeout(enforce,1800);});
  window.addEventListener('load',()=>{enforce(); setTimeout(enforce,200); setTimeout(enforce,1200);});
  setInterval(enforce,700);
})();

/* moba-v194-final-admin-clean-game-open-icons */
(function(){
  if(window.__mobaV194FinalGameOpen)return; window.__mobaV194FinalGameOpen=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=t=>String(t||'').trim().toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/\s+/g,' ');
  const statusNorm=x=>{const s=norm(x); if(['available','active','on','open','live','enabled','متاح','متاح الان','شغال'].includes(s))return 'available'; if(['unavailable','disabled','off','stopped','stop','closed','متوقف','غير متاح','غير متوفر','مغلق'].includes(s))return 'unavailable'; if(['soon','coming','coming_soon','قريبا','قريبًا'].includes(s))return 'soon'; return s||'soon';};
  const BASE={
    pubg:{key:'pubg',title:'PUBG Mobile',currency:'UC',image:'assets/game-covers/pubg.webp',icon:'assets/game-icons/pubg-icon.webp',status:'available'},
    freefire:{key:'freefire',title:'Free Fire',currency:'💎',image:'assets/game-covers/freefire-new.webp',icon:'assets/game-icons/freefire-icon.webp',status:'soon'},
    roblox:{key:'roblox',title:'Roblox',currency:'Robux',image:'assets/game-covers/roblox.webp',icon:'assets/game-icons/roblox.svg',status:'soon'},
    blood_mena:{key:'blood_mena',title:'Blood Strike MENA',currency:'Gold',image:'assets/game-covers/blood-mena.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    blood_global:{key:'blood_global',title:'Blood Strike Global',currency:'Gold',image:'assets/game-covers/blood-global.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    kingshot:{key:'kingshot',title:'King Shot',currency:'Top Up',image:'assets/game-covers/kingshot.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    '8ball':{key:'8ball',title:'Ball Pool 8',currency:'Coins',image:'assets/game-covers/8ball.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    goal_battle:{key:'goal_battle',title:'Goal Battle',currency:'Top Up',image:'assets/game-covers/goal-battle.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    yalla_ludo:{key:'yalla_ludo',title:'Yalla Ludo',currency:'Diamonds',image:'assets/game-covers/yalla-ludo.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    last_war:{key:'last_war',title:'Last War',currency:'Coins',image:'assets/game-covers/last-war.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    efootball:{key:'efootball',title:'eFootball',currency:'Coins',image:'assets/game-covers/efootball.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    tiktok:{key:'tiktok',title:'TikTok',currency:'Coins',image:'assets/game-covers/tiktok.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'},
    valorant:{key:'valorant',title:'Valorant',currency:'VP',image:'assets/game-covers/valorant.webp',icon:'assets/moba-shop-logo-256.png',status:'soon'}
  };
  function readCache(){
    for(const k of ['moba_settings_cache_v191','moba_settings_cache_v190','moba_settings_cache_v189','moba_settings_cache_v187','moba_settings_cache']){
      try{const raw=localStorage.getItem(k); if(!raw)continue; const d=JSON.parse(raw); return d.settings||d||{};}catch(_){ }
    }
    return {};
  }
  function settings(){return window.__mobaV194Settings||window.__mobaV191Settings||window.__mobaV189Settings||window.__mobaV188Settings||window.__mobaV186Settings||readCache()||{};}
  function hasProducts(game,s){
    const prods=Array.isArray(s.dynamic_products)?s.dynamic_products:[];
    if(prods.some(p=>p&&p.hidden!==true&&p.active!==false&&String(p.game||'pubg')===String(game)))return true;
    const mp=window.mobaProducts||{};
    return Object.keys(mp).some(cat=>(mp[cat]||[]).some(p=>p&&String(p.game||'pubg')===String(game)));
  }
  function hasSections(game,s){
    return (Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).some(sec=>sec&&sec.active!==false&&String(sec.game||'pubg')===String(game));
  }
  function gameInfo(game){
    const s=settings(); game=String(game||'pubg');
    let g={...(BASE[game]||{key:game,title:game,status:'soon'})};
    const gs=(Array.isArray(s.game_settings)?s.game_settings:[]).find(x=>String(x.key||x.id||x.game||'')===game);
    if(gs)g={...g,...gs,key:game,status:statusNorm(gs.status||g.status)};
    const explicit=!!gs;
    if(!explicit){
      const secs=(Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).filter(x=>x&&x.active!==false&&String(x.game||'pubg')===game);
      const availableSec=secs.find(x=>statusNorm(x.status)==='available');
      if(availableSec)g.status='available';
      const first=availableSec||secs[0];
      if(first){g.currency=g.currency||first.currency||first.subtitle; g.image=g.image||first.image;}
    }
    if(hasProducts(game,s) && statusNorm(g.status)==='soon' && !explicit) g.status='available';
    return {...g,status:statusNorm(g.status)};
  }
  function isGameAvailable(game){
    const card=document.querySelector('#gamesHome [data-game="'+(window.CSS&&CSS.escape?CSS.escape(String(game)):String(game))+'"]');
    const badgeText=norm(card?.querySelector('.game-badge')?.textContent||'');
    const ds=statusNorm(card?.dataset.gameStatus||'');
    const gi=gameInfo(game);
    return gi.status==='available' || ds==='available' || badgeText.includes('متاح');
  }
  function firstSection(game){
    const s=settings(); game=String(game||'pubg');
    const arr=(Array.isArray(s.dynamic_sections)?s.dynamic_sections:[])
      .filter(x=>x&&x.active!==false&&String(x.game||'pubg')===game&&['game','both'].includes(String(x.location||'game')))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const hit=arr.find(x=>statusNorm(x.status)==='available')||arr[0];
    if(hit&&hit.key)return String(hit.key);
    const prods=(Array.isArray(s.dynamic_products)?s.dynamic_products:[]).filter(p=>p&&p.hidden!==true&&p.active!==false&&String(p.game||'pubg')===game);
    if(prods[0]&&(prods[0].cat||prods[0].section))return String(prods[0].cat||prods[0].section);
    const mp=window.mobaProducts||{};
    return Object.keys(mp).find(cat=>(mp[cat]||[]).some(p=>p&&String(p.game||'pubg')===game)) || (game==='pubg'?'uc':'');
  }
  function openGame(game){
    game=String(game||'pubg');
    window.activeGame=game;
    window.activeCat=firstSection(game);
    if(typeof window.mobaShowView==='function') window.mobaShowView('game'); else document.body.dataset.page='game';
    if(typeof window.renderProducts==='function') setTimeout(()=>window.renderProducts(),30);
    setTimeout(()=>document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'}),45);
  }
  window.mobaAllowGameClick=function(game){return isGameAvailable(game);};
  window.mobaCanOpenGame=function(game){return isGameAvailable(game);};
  window.mobaOpenGame=window.mobaOpenGameV194=openGame;
  function paintGames(){
    document.querySelectorAll('#gamesHome [data-game]').forEach(card=>{
      const key=String(card.dataset.game||''); const g=gameInfo(key); const st=statusNorm(g.status);
      card.dataset.gameStatus=st; card.classList.toggle('coming',st!=='available'); card.classList.toggle('active',st==='available'); card.classList.toggle('available',st==='available');
      const cover=card.querySelector('.game-cover img'); if(cover){const src=g.image||BASE[key]?.image||cover.src||'assets/moba-shop-logo-512.webp'; if(cover.getAttribute('src')!==src)cover.setAttribute('src',src); cover.onerror=function(){this.onerror=null;this.src=BASE[key]?.image||'assets/moba-shop-logo-512.webp'};}
      let content=card.querySelector('.game-card-content'); if(!content)return;
      let badge=content.querySelector('.game-badge'); if(!badge){badge=document.createElement('span');badge.className='game-badge';content.prepend(badge);} badge.className='game-badge '+(st==='available'?'available':st==='unavailable'?'unavailable':'soon'); badge.textContent=st==='available'?'متاح الآن':st==='unavailable'?'متوقف':'قريبًا';
      let icon=content.querySelector('.game-square-icon-v194,.game-square-icon-v191'); if(!icon){icon=document.createElement('span');icon.className='game-square-icon-v194';badge.insertAdjacentElement('afterend',icon);} else {icon.classList.add('game-square-icon-v194');}
      const iconSrc=g.icon||BASE[key]?.icon||'assets/moba-shop-logo-256.png'; icon.innerHTML='<img src="'+esc(iconSrc)+'" alt="'+esc(g.title||key)+'" onerror="this.onerror=null;this.src=\'assets/moba-shop-logo-256.png\'">';
      const title=content.querySelector('b'); if(title&&g.title)title.textContent=g.title;
      const small=content.querySelector('small'); if(small)small.textContent=g.currency||g.subtitle||BASE[key]?.currency||'';
    });
  }
  async function refreshSettings(){
    try{const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); const s=d.settings||d||{}; window.__mobaV194Settings=s; try{localStorage.setItem('moba_settings_cache_v191',JSON.stringify({settings:s,ts:Date.now()}));}catch(_){ } paintGames();}
    catch(_){paintGames();}
  }
  document.addEventListener('click',function(e){
    const card=e.target.closest&&e.target.closest('#gamesHome [data-game]');
    if(!card)return;
    const game=card.dataset.game;
    if(isGameAvailable(game)){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation(); openGame(game); return false;
    }
  },true);
  document.addEventListener('DOMContentLoaded',()=>{paintGames(); refreshSettings(); setTimeout(paintGames,80); setTimeout(refreshSettings,450);});
  window.addEventListener('load',()=>setTimeout(refreshSettings,120));
  const css=document.createElement('style'); css.textContent=`
    #gamesHome .game-card-content{display:grid!important;grid-template-columns:52px 1fr!important;grid-template-areas:'icon badge' 'icon title' 'icon sub'!important;align-items:center!important;gap:3px 11px!important}
    #gamesHome .game-square-icon-v194,#gamesHome .game-square-icon-v191,.game-icon-mini{grid-area:icon!important;width:52px!important;height:52px!important;border-radius:14px!important;overflow:hidden!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(39,216,255,.30)!important;box-shadow:0 10px 25px rgba(0,0,0,.32)!important;flex:0 0 52px!important}
    #gamesHome .game-square-icon-v194 img,#gamesHome .game-square-icon-v191 img,.game-icon-mini img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;image-rendering:auto!important}
    #gamesHome .game-cover img{object-fit:cover!important;image-rendering:auto!important;filter:saturate(1.08) contrast(1.04)!important}
    #gamesHome .game-card-content .game-badge{grid-area:badge!important;width:max-content!important;min-height:24px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;padding:5px 10px!important;font-weight:1000!important;font-size:11px!important}
    #gamesHome .game-card-content .game-badge.available{background:rgba(74,220,255,.18)!important;border:1px solid rgba(74,220,255,.36)!important;color:#dff9ff!important}
    #gamesHome .game-card-content .game-badge.soon{background:rgba(255,216,107,.14)!important;border:1px solid rgba(255,216,107,.30)!important;color:#ffe8a3!important}
    #gamesHome .game-card-content .game-badge.unavailable{background:rgba(255,76,96,.16)!important;border:1px solid rgba(255,76,96,.32)!important;color:#ffbac2!important}
    #gamesHome .game-card-content b{grid-area:title!important}#gamesHome .game-card-content small{grid-area:sub!important}
    @media(max-width:640px){#gamesHome .game-card-content{grid-template-columns:44px 1fr!important}.game-square-icon-v194,.game-square-icon-v191{width:44px!important;height:44px!important;flex-basis:44px!important}}
  `; document.head.appendChild(css);
})();
