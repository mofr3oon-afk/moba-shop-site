import { loadCatalog } from './catalog.js';
import { addCartItem, cartTotal, cartUnits, clearCart, deviceId, money, readCart, removeCartItem, saveCart, toast, updateCartItem } from './store.js';

let catalog = {games:[],sections:[],products:[],offers:[]};
let route = location.pathname;
let selectedSection = {};
let coupon = null;
let checkoutFile = null;
let assistantState = null;

const $ = (s,root=document)=>root.querySelector(s);
const app = $('#app');

function navigate(path){
  history.pushState({}, '', path);
  route = location.pathname;
  render();
}
function setActiveNav(){
  document.querySelectorAll('[data-link]').forEach(a=>{
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === route || (href==='/' && route==='/'));
  });
}
function page(html){ app.innerHTML = html; app.focus({preventScroll:true}); setActiveNav(); updateCartBubble(); }
function gameBySlug(slug){ return catalog.games.find(g=>g.slug===slug) || catalog.games[0]; }
function currentGameSlug(){
  const m = route.match(/^\/game\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
function updateCartBubble(){
  const cart=readCart();
  $('#cartBubbleText').textContent = `${cartUnits(cart)} منتجات | ${money(cartTotal(cart))}`;
}
function applyBrand(){
  const brand = catalog.brand || {};
  const logo = brand.logo || '/assets/moba-shop-logo-512.webp';
  const icon = brand.icon || '/assets/moba-shop-logo-256.png';
  if(brand.name) document.title = `${brand.name} | Digital Store For Gamers`;
  const img = document.querySelector('.brand img');
  if(img) img.src = logo;
  const name = document.querySelector('.brand b');
  if(name && brand.name){
    const parts = String(brand.name).trim().split(/\s+/);
    name.innerHTML = `${parts[0] || 'MOBA'} <em>${parts.slice(1).join(' ') || 'SHOP'}</em>`;
  }
  const tagline = document.querySelector('.brand small');
  if(tagline) tagline.textContent = brand.tagline || 'Digital Store For Gamers';
  const favicon = document.querySelector('link[rel="icon"]');
  if(favicon) favicon.href = icon;
}

function renderHome(){
  const mainOffer = catalog.offers[0];
  page(`
    <section class="section hero">
      <div>
        <span class="status-pill">متاح ولكن فيه ضغط</span>
        <h1>ليه تستخدم موبا شوب؟</h1>
        <p>كل حاجة معمولة عشان الطلب يبقى واضح، سريع المتابعة، وآمن من أول اختيار اللعبة لحد تنفيذ الشحن.</p>
      </div>
      <div class="trust-grid">
        <div class="trust-card"><b>7000+</b><span>عميل تعامل معنا</span></div>
        <div class="trust-card"><b>1000+</b><span>تقييم وتجربة</span></div>
        <div class="trust-card"><b>12 سنة</b><span>خبرة في الشحن</span></div>
        <div class="trust-card"><b>دعم مباشر</b><span>تواصل في أي وقت</span></div>
        <div class="trust-card"><b>متابعة</b><span>كل تحديث أول بأول</span></div>
        <div class="trust-card"><b>أمان</b><span>مراجعة قبل التنفيذ</span></div>
      </div>
    </section>
    <section class="section">
      <div class="page-title">
        <div>
          <span class="badge">MOBA SHOP Games</span>
          <h1>اختار لعبتك</h1>
          <p>اختار اللعبة، اكتب بيانات الحساب، وبعدها ضيف الباقة للسلة بخطوات واضحة.</p>
        </div>
      </div>
      ${mainOffer ? offerHtml(mainOffer) : ''}
      <div class="games-grid">
        ${catalog.games.map(gameCard).join('')}
      </div>
    </section>
  `);
}
function offerHtml(o){
  const img = o.image || gameBySlug(o.game)?.cover || '/assets/game-covers/pubg-new.webp';
  return `<button class="offer-card" data-offer-game="${o.game || 'pubg'}" data-offer-section="${o.section || ''}" type="button">
    <img src="${img}" alt="">
    <span class="game-status">متاح الآن</span>
    <div class="offer-content">
      <span class="badge">عرض حصري</span>
      <h2>${o.title || 'عروض حصرية'}</h2>
      <p>${o.subtitle || 'باقات مختارة بسعر مميز'}</p>
      <span class="price">اضغط لفتح العرض</span>
    </div>
  </button>`;
}
function gameCard(g){
  const soon = g.status !== 'available';
  return `<button class="game-card ${soon?'soon':''}" data-game="${g.slug}" type="button">
    <img src="${g.cover}" alt="">
    <span class="game-status">${soon?'قريبًا':'متاح الآن'}</span>
    <div class="game-info"><h3>${g.name}</h3><p>${g.subtitle || ''}</p></div>
  </button>`;
}

function renderGame(slug=currentGameSlug()){
  const game = gameBySlug(slug);
  if(!game) return renderHome();
  const sections = catalog.sections.filter(s=>s.game===game.slug);
  const active = selectedSection[game.slug] || game.defaultSection || sections[0]?.slug;
  const products = catalog.products.filter(p=>p.game===game.slug && p.section===active);
  page(`
    <section class="section">
      <div class="page-title">
        <div>
          <span class="badge">${game.name}</span>
          <h1>${game.name}</h1>
          <p>اكتب البيانات المطلوبة مرة واحدة، وبعدها اختار الباقة المناسبة.</p>
        </div>
        <button class="ghost-btn" data-go="/">رجوع للرئيسية</button>
      </div>
    </section>
    <section class="section products-layout">
      <aside class="side-list">
        ${sections.map(s=>`<button type="button" data-section="${s.slug}" class="${s.slug===active?'active':''}">${s.name}</button>`).join('')}
      </aside>
      <div>
        <div class="fields-grid" id="accountFields">
          <div class="field"><label>${game.idLabel}</label><input id="accountId" inputmode="numeric" placeholder="${game.idPlaceholder}"></div>
          <div class="field"><label>${game.nameLabel}</label><input id="accountName" placeholder="${game.namePlaceholder}"></div>
          ${(game.fields||[]).map(f=>`<div class="field"><label>${f.label}</label><input data-extra-field="${f.key}" ${f.type==='number'?'inputmode="numeric"':''} placeholder="${f.placeholder||f.label}" ${f.required?'data-required="1"':''}></div>`).join('')}
        </div>
        <div class="products-grid">
          ${products.map(productCard).join('') || '<div class="notice">لا توجد منتجات في القسم ده حاليا.</div>'}
        </div>
      </div>
    </section>
  `);
}
function productCard(p){
  const finalPrice = Number(p.salePrice || 0) > 0 ? Number(p.salePrice) : Number(p.price || 0);
  const flags = [p.hot?'Hot':'',p.featured?'مميز':'',p.bestSeller?'الأكثر طلبا':''].filter(Boolean);
  return `<article class="product-card" data-product="${p.id}">
    <div><h3>${p.name}</h3><span>${p.unit || ''}</span>${flags.length?`<div class="product-flags">${flags.map(f=>`<b>${f}</b>`).join('')}</div>`:''}</div>
    <div class="price">${Number(p.salePrice||0)>0?`<small>${money(p.price)}</small> ${money(finalPrice)}`:money(p.price)}</div>
    <div class="product-actions">
      ${p.noQty ? '<span></span>' : `<div class="qty"><button type="button" data-qty-minus>-</button><b data-qty>1</b><button type="button" data-qty-plus>+</button></div>`}
      <button class="primary" type="button" data-add-product="${p.id}">إضافة للسلة</button>
    </div>
  </article>`;
}

function renderCart(){
  const cart=readCart();
  page(`
    <section class="section">
      <div class="page-title"><div><h1>السلة</h1><p>راجع المنتجات والكميات قبل الانتقال للدفع.</p></div><button class="ghost-btn" data-go="/">رجوع للمنتجات</button></div>
    </section>
    <section class="section">
      <div class="cart-list">
        ${cart.map((item,i)=>cartItem(item,i)).join('') || '<div class="notice">السلة فاضية. اختار منتج الأول.</div>'}
      </div>
      <div class="summary-grid" style="margin-top:14px">
        <div class="summary-box"><b>${cart.length}</b><span>منتجات</span></div>
        <div class="summary-box"><b>${cartUnits(cart)}</b><span>كمية</span></div>
        <div class="summary-box"><b>${money(cartTotal(cart))}</b><span>الإجمالي</span></div>
      </div>
      <div class="coupon-box" style="margin-top:14px">
        <button class="ghost-btn" type="button" id="toggleCoupon">عندك كوبون خصم؟</button>
        <div id="couponForm" hidden style="margin-top:10px">
          <div class="fields-grid">
            <div class="field"><label>كود الخصم</label><input id="couponCode" placeholder="اكتب الكود"></div>
            <button class="primary" type="button" id="applyCoupon">تفعيل الكوبون</button>
          </div>
          <div id="couponMessage"></div>
        </div>
      </div>
      <button class="primary" style="width:100%;margin-top:14px" ${cart.length?'':'disabled'} type="button" data-go="/checkout">كمل الدفع</button>
    </section>
  `);
  if(coupon){ showCouponMessage(`الكوبون ${coupon.code} شغال. الخصم: ${money(coupon.discount_amount)}`, 'ok'); }
}
function cartItem(item,i){
  return `<article class="cart-item">
    <div>
      <h3>${item.product}</h3>
      <p>ID: ${item.pubgId} | Name: ${item.pubgName}</p>
      ${item.extraFields ? `<p>${Object.entries(item.extraFields).map(([k,v])=>`${k}: ${v}`).join(' | ')}</p>` : ''}
      <b>${money(item.price)} × ${item.qty}</b>
    </div>
    <div class="qty">
      <button type="button" data-cart-minus="${i}">-</button>
      <b>${item.qty}</b>
      <button type="button" data-cart-plus="${i}">+</button>
      <button type="button" data-cart-remove="${i}" class="danger icon-btn">×</button>
    </div>
  </article>`;
}
async function applyCoupon(){
  const code = $('#couponCode')?.value.trim().toUpperCase();
  if(!code) return showCouponMessage('اكتب كود الخصم الأول.', 'err');
  const total = cartTotal();
  try{
    const q = new URLSearchParams({code,total:String(total),cart:JSON.stringify(readCart())});
    const res = await fetch('/api/coupon?' + q.toString());
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'الكود غير صحيح');
    coupon = data.coupon;
    showCouponMessage(`تم تفعيل ${coupon.code}. الخصم: ${money(coupon.discount_amount)}. الإجمالي بعد الخصم: ${money(Math.max(0,total-coupon.discount_amount))}`, 'ok');
  }catch(e){ coupon=null; showCouponMessage(e.message || 'الكود غير صحيح', 'err'); }
}
function showCouponMessage(text,type){ const box=$('#couponMessage'); if(box) box.innerHTML=`<div class="message ${type==='ok'?'ok':'err'}">${text}</div>`; }

function renderCheckout(){
  const cart=readCart(); const total=cartTotal(cart); const discount=Number(coupon?.discount_amount||0);
  page(`
    <section class="section"><div class="page-title"><div><h1>الدفع وتنفيذ الطلب</h1><p>اختار طريقة الدفع، ارفع السكرين، وبعدها راجع الطلب قبل الإرسال.</p></div><button class="ghost-btn" data-go="/cart">رجوع للسلة</button></div></section>
    <section class="section checkout-section">
      <div class="summary-grid">
        <div class="summary-box"><b>${money(total)}</b><span>قبل الخصم</span></div>
        <div class="summary-box"><b>${money(discount)}</b><span>الخصم</span></div>
        <div class="summary-box"><b>${money(Math.max(0,total-discount))}</b><span>المطلوب دفعه</span></div>
      </div>
      <div class="checkout-steps">
        <span>1. رقم المتابعة</span>
        <span>2. طريقة الدفع</span>
        <span>3. سكرين التحويل</span>
        <span>4. تنفيذ الطلب</span>
      </div>
      <div class="notice warn" style="margin-top:14px">راجع ID واسم الحساب والسكرين قبل تنفيذ الطلب. أي ID غلط بعد التأكيد مسؤولية العميل.</div>
      <form id="checkoutForm" class="checkout-grid" style="margin-top:14px">
        <div class="field"><label>رقم الموبايل للمتابعة</label><input name="customerPhone" inputmode="tel" placeholder="010xxxxxxxx" required></div>
        <div class="field"><label>طريقة الدفع</label><select name="paymentMethod"><option value="InstaPay">InstaPay</option><option value="Wallet">محفظة كاش</option></select></div>
        <div class="pay-box payment-details">
          <b>بيانات الدفع</b>
          <p>InstaPay: mofr3oon1</p><p>Phone: 01061707294</p><p>Name: مؤمن</p>
          <a class="primary" style="display:block;text-align:center" href="https://ipn.eg/S/mofr3oon1/instapay/3ALZfx" target="_blank">فتح InstaPay</a>
        </div>
        <div class="pay-box transfer-box">
          <b>تأكيد التحويل</b>
          <label><input type="radio" name="transferMode" value="same" checked> نفس رقم المتابعة</label>
          <label><input type="radio" name="transferMode" value="other"> رقم تاني أو محل دفع</label>
          <input name="transferLast3" inputmode="numeric" maxlength="3" placeholder="آخر 3 أرقام لو التحويل من رقم تاني">
        </div>
        <div class="field"><label>ملاحظة اختيارية</label><textarea name="note" rows="4" placeholder="أي ملاحظة للطلب"></textarea></div>
        <div class="field upload-card"><label>سكرين التحويل</label><input id="screenshotInput" name="screenshot" type="file" accept="image/png,image/jpeg,image/webp" required><div id="filePreview" class="message">لم يتم اختيار صورة بعد</div></div>
        <div id="checkoutMessage" style="grid-column:1/-1"></div>
        <button class="primary success" style="grid-column:1/-1" type="submit" ${cart.length?'':'disabled'}>تنفيذ الشراء</button>
      </form>
    </section>
  `);
  applyAssistantPrefill();
}
function applyAssistantPrefill(){
  const raw = sessionStorage.getItem('assistant_prefill');
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    const form = $('#checkoutForm');
    if(!form) return;
    if(data.phone) form.customerPhone.value = data.phone;
    if(data.paymentMethod) form.paymentMethod.value = data.paymentMethod;
    if(data.transferMode){
      const radio = form.querySelector(`input[name="transferMode"][value="${data.transferMode}"]`);
      if(radio) radio.checked = true;
    }
    if(data.transferLast3) form.transferLast3.value = data.transferLast3;
  }catch{}
}
async function submitCheckout(form){
  const cart=readCart();
  if(!cart.length) return checkoutMessage('السلة فاضية.', 'err');
  const fd = new FormData(form);
  if(fd.get('transferMode')==='other' && !/^\d{3}$/.test(String(fd.get('transferLast3')||''))) return checkoutMessage('اكتب آخر 3 أرقام من رقم التحويل.', 'err');
  if(!checkoutFile) return checkoutMessage('ارفع سكرين التحويل الأول.', 'err');
  fd.set('cart', JSON.stringify(cart));
  fd.set('deviceId', deviceId());
  if(coupon?.code) fd.set('coupon_code', coupon.code);
  fd.set('screenshot', checkoutFile, checkoutFile.name);
  const summary = `${cart.length} منتجات - الإجمالي ${money(cartTotal(cart)-Number(coupon?.discount_amount||0))}`;
  if(!confirm(`تأكيد إرسال الطلب؟\n${summary}`)) return;
  const btn=form.querySelector('button[type="submit"]'); btn.disabled=true; btn.textContent='جاري إرسال الطلب...';
  try{
    const res = await fetch('/api/order',{method:'POST',body:fd});
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'تعذر تنفيذ الطلب');
    clearCart(); coupon=null; checkoutFile=null;
    sessionStorage.setItem('last_invoice', JSON.stringify(data));
    navigate('/success');
  }catch(e){ checkoutMessage(e.message || 'تعذر تنفيذ الطلب', 'err'); btn.disabled=false; btn.textContent='تنفيذ الشراء'; }
}
function checkoutMessage(text,type){ const box=$('#checkoutMessage'); if(box) box.innerHTML=`<div class="message ${type==='ok'?'ok':'err'}">${text}</div>`; }

function renderSuccess(){
  const data = JSON.parse(sessionStorage.getItem('last_invoice') || '{}');
  page(`<section class="section invoice"><div class="invoice-card">
    <h1>تم استلام طلبك بنجاح</h1>
    <p>طلبك اتسجل وهيتم مراجعته يدويًا قبل التنفيذ للتأكد من البيانات والدفع.</p>
    <div class="summary-grid">
      <div class="summary-box"><b>${data.orderCode || '-'}</b><span>رقم الطلب</span></div>
      <div class="summary-box"><b>${data.phone || '-'}</b><span>رقم المتابعة</span></div>
      <div class="summary-box"><b>${money(data.total || 0)}</b><span>الإجمالي</span></div>
    </div>
    <div class="timeline"><div>تم استلام الطلب</div><div>تحت المراجعة</div><div>بعد التأكد يبدأ التنفيذ</div></div>
    <button class="primary" style="margin-top:16px" data-go="/track">متابعة الطلب</button>
  </div></section>`);
}
function renderTrack(){
  page(`<section class="section"><div class="page-title"><div><h1>متابعة الطلب</h1><p>اكتب رقم الموبايل وشوف آخر حالة للطلب.</p></div></div></section>
    <section class="section"><form id="trackForm" class="fields-grid"><div class="field"><label>رقم الموبايل</label><input name="phone" inputmode="tel" placeholder="010xxxxxxxx"></div><button class="primary">بحث</button></form><div id="trackResult"></div></section>`);
}
async function trackOrder(phone){
  const box=$('#trackResult'); box.innerHTML='<div class="message">جاري البحث...</div>';
  try{ const r=await fetch('/api/status?history=1&phone='+encodeURIComponent(phone)); const d=await r.json(); if(!d.ok) throw new Error(d.error||'لا يوجد طلب');
    box.innerHTML = (d.orders||[]).map(o=>`<div class="timeline"><b>${o.order_code || o.id}</b><span>${o.status_label || o.status_text || o.status}</span><span>${money(o.total)}</span></div>`).join('');
  }catch(e){ box.innerHTML=`<div class="message err">${e.message}</div>`; }
}
function renderReviews(){ page(`<section class="section"><h1>آراء العملاء</h1><p>قسم الآراء جاهز للربط بالتقييمات بعد اكتمال الطلبات.</p></section>`); }

function assistantReply(text, actions=[]){
  const box=$('#assistantMessages'); const el=document.createElement('div'); el.className='bubble'; el.innerHTML=`<div>${text}</div>${actions.length?`<div class="quick-actions">${actions.map(a=>`<button type="button" data-assist="${a.cmd}">${a.label}</button>`).join('')}</div>`:''}`; box.appendChild(el); box.scrollTop=box.scrollHeight;
}
function assistantUser(text){ const box=$('#assistantMessages'); const el=document.createElement('div'); el.className='bubble user'; el.textContent=text; box.appendChild(el); box.scrollTop=box.scrollHeight; }
function budgetCombos(amount){
  const pubg = catalog.products.filter(p=>p.game==='pubg' && p.price<=amount).sort((a,b)=>b.price-a.price);
  const combos=[]; for(const a of pubg){ for(const b of pubg){ const total=a.price+b.price; if(total<=amount) combos.push({items:[a,b],total}); } }
  return combos.sort((a,b)=>b.total-a.total).slice(0,3);
}
function handleAssistant(text){
  const t=text.trim(); if(!t) return; assistantUser(t);
  if(assistantState) return continueAssistantOrder(t);
  const n = Number((t.match(/\d+/)||[])[0]||0);
  if(/طلب|متابع|فين/i.test(t)){ assistantReply('افتح متابعة الطلب واكتب رقم الموبايل.',[{label:'متابعة طلبي',cmd:'track'}]); return; }
  if(/دفع|انستا|محفظ/i.test(t)){ assistantReply('تقدر تدفع InstaPay أو محفظة كاش، وبعدها ارفع السكرين في صفحة الدفع.',[{label:'فتح الدفع',cmd:'checkout'}]); return; }
  if(n>=40){
    const combos=budgetCombos(n);
    if(combos.length){ assistantReply(`أفضل ترشيحات PUBG لميزانية ${money(n)}. اختار ترشيح وأنا أفتحلك ببجي تكمل البيانات.`, combos.map((c,i)=>({label:`اختيار رقم ${i+1}: ${c.items.map(x=>x.name).join(' + ')}`,cmd:`combo:${i}:${n}`}))); return; }
  }
  assistantReply('أنا معاك. اختار شحن جديد، متابعة طلب، أو طرق الدفع.',[{label:'ابدأ الشحن',cmd:'charge'},{label:'تابع طلبي',cmd:'track'},{label:'طرق الدفع',cmd:'checkout'},{label:'مشكلة في الطلب',cmd:'track'}]);
}
function continueAssistantOrder(text){
  if(assistantState.step === 'id'){
    const id = text.replace(/\D/g,'');
    if(id.length < 4 || id.length > 18) return assistantReply('اكتب ID الحساب أرقام صحيحة من 4 إلى 18 رقم.');
    assistantState.pubgId = id; assistantState.step = 'name';
    assistantReply('تمام، اكتب اسم الحساب داخل اللعبة.');
    return;
  }
  if(assistantState.step === 'name'){
    if(text.length < 2) return assistantReply('اسم الحساب قصير جدًا. اكتبه زي ما ظاهر داخل اللعبة.');
    assistantState.pubgName = text; assistantState.step = 'payment';
    assistantReply('اختار طريقة الدفع.',[{label:'InstaPay',cmd:'assistpay:InstaPay'},{label:'محفظة كاش',cmd:'assistpay:Wallet'}]);
    return;
  }
  if(assistantState.step === 'phone'){
    const phone = text.replace(/\D/g,'');
    if(!/^01\d{9}$/.test(phone)) return assistantReply('اكتب رقم متابعة صحيح يبدأ بـ 01 ومكون من 11 رقم.');
    assistantState.phone = phone; assistantState.step = 'transfer';
    assistantReply('التحويل من نفس رقم المتابعة ولا من رقم تاني/محل دفع؟',[{label:'نفس رقم المتابعة',cmd:'assisttransfer:same'},{label:'رقم تاني أو محل دفع',cmd:'assisttransfer:other'}]);
    return;
  }
  if(assistantState.step === 'last3'){
    const last3 = text.replace(/\D/g,'');
    if(!/^\d{3}$/.test(last3)) return assistantReply('اكتب آخر 3 أرقام فقط من رقم التحويل.');
    assistantState.transferLast3 = last3;
    finishAssistantOrderDraft();
  }
}

async function render(){
  if(!catalog.games.length) catalog = await loadCatalog();
  applyBrand();
  if(route.startsWith('/game/')) renderGame();
  else if(route==='/cart') renderCart();
  else if(route==='/checkout') renderCheckout();
  else if(route==='/success') renderSuccess();
  else if(route==='/track') renderTrack();
  else if(route==='/reviews') renderReviews();
  else renderHome();
}

document.addEventListener('click', e=>{
  const link=e.target.closest('[data-link]'); if(link){ e.preventDefault(); navigate(link.getAttribute('href')); return; }
  const go=e.target.closest('[data-go]'); if(go){ navigate(go.dataset.go); return; }
  const game=e.target.closest('[data-game]'); if(game){ const g=gameBySlug(game.dataset.game); if(g.status==='available') navigate('/game/'+g.slug); else toast('اللعبة دي هتتوفر قريبًا'); return; }
  const offer=e.target.closest('[data-offer-game]'); if(offer){ selectedSection[offer.dataset.offerGame]=offer.dataset.offerSection || selectedSection[offer.dataset.offerGame]; navigate('/game/'+offer.dataset.offerGame); return; }
  const section=e.target.closest('[data-section]'); if(section){ selectedSection[currentGameSlug()]=section.dataset.section; renderGame(); return; }
  const plus=e.target.closest('[data-qty-plus]'); if(plus){ const q=plus.closest('.product-card').querySelector('[data-qty]'); q.textContent=Number(q.textContent)+1; return; }
  const minus=e.target.closest('[data-qty-minus]'); if(minus){ const q=minus.closest('.product-card').querySelector('[data-qty]'); q.textContent=Math.max(1,Number(q.textContent)-1); return; }
  const add=e.target.closest('[data-add-product]'); if(add) return addProduct(add.dataset.addProduct, add.closest('.product-card'));
  const cp=e.target.closest('[data-cart-plus]'); if(cp){ const i=Number(cp.dataset.cartPlus); const cart=readCart(); updateCartItem(i,{qty:Number(cart[i].qty||1)+1}); renderCart(); return; }
  const cm=e.target.closest('[data-cart-minus]'); if(cm){ const i=Number(cm.dataset.cartMinus); const cart=readCart(); updateCartItem(i,{qty:Math.max(1,Number(cart[i].qty||1)-1)}); renderCart(); return; }
  const cr=e.target.closest('[data-cart-remove]'); if(cr){ removeCartItem(Number(cr.dataset.cartRemove)); renderCart(); return; }
  if(e.target.id==='toggleCoupon'){ const f=$('#couponForm'); f.hidden=!f.hidden; return; }
  if(e.target.id==='applyCoupon') return applyCoupon();
  const ac=e.target.closest('[data-assist]'); if(ac) return assistantAction(ac.dataset.assist);
});
function addProduct(id, card){
  const product=catalog.products.find(p=>p.id===id); const game=gameBySlug(product.game);
  const accId=$('#accountId')?.value.trim(); const accName=$('#accountName')?.value.trim();
  const extras={}; let missing=false;
  document.querySelectorAll('[data-extra-field]').forEach(inp=>{ extras[inp.dataset.extraField]=inp.value.trim(); if(inp.dataset.required && !inp.value.trim()) missing=true; });
  if(!accId || !accName || missing) return toast('اكتب كل بيانات الحساب المطلوبة الأول.', 'err');
  const qty=Number(card?.querySelector('[data-qty]')?.textContent || 1);
  addCartItem({ productId:product.id, product:product.name, game:game.name, price:Number(product.salePrice||0)>0?Number(product.salePrice):product.price, qty, noQty:product.noQty, pubgId:accId, pubgName:accName, extraFields:extras });
  toast('تمت إضافة المنتج للسلة');
}
function assistantAction(cmd){
  if(cmd==='charge') return navigate('/');
  if(cmd==='track') return navigate('/track');
  if(cmd==='checkout') return navigate('/checkout');
  if(cmd.startsWith('combo:')){
    const [,idx,amount] = cmd.split(':');
    const combo = budgetCombos(Number(amount))[Number(idx)];
    if(!combo) return assistantReply('الترشيح ده مش متاح حاليًا. اكتب الميزانية تاني.');
    assistantState = {step:'id', products:combo.items};
    assistantReply(`اختارت: ${combo.items.map(x=>x.name).join(' + ')}. اكتب ID الحساب دلوقتي.`);
    return;
  }
  if(cmd.startsWith('assistpay:')){
    assistantState.paymentMethod = cmd.split(':')[1];
    assistantState.step = 'phone';
    const payText = assistantState.paymentMethod === 'InstaPay' ? 'InstaPay: mofr3oon1 | Phone: 01061707294 | Name: مؤمن' : 'Wallet Phone: 01061707294 | Name: مؤمن';
    assistantReply(`${payText}<br>بعد التحويل اكتب رقم الموبايل اللي هتتابع بيه الطلب.`);
    return;
  }
  if(cmd.startsWith('assisttransfer:')){
    assistantState.transferMode = cmd.split(':')[1];
    if(assistantState.transferMode === 'other'){
      assistantState.step = 'last3';
      assistantReply('اكتب آخر 3 أرقام من رقم التحويل.');
    }else{
      assistantState.transferLast3 = '';
      finishAssistantOrderDraft();
    }
    return;
  }
  if(cmd === 'assistantCheckout') return navigate('/checkout');
  if(cmd === 'assistantCancel'){ assistantState=null; assistantReply('تم إلغاء مسار الطلب. اكتب ميزانيتك أو اختار ابدأ الشحن في أي وقت.'); }
}
function finishAssistantOrderDraft(){
  const products = assistantState.products || [];
  products.forEach(p=>addCartItem({productId:p.id,product:p.name,game:'PUBG Mobile',price:p.price,qty:1,pubgId:assistantState.pubgId,pubgName:assistantState.pubgName,extraFields:{}}));
  sessionStorage.setItem('assistant_prefill', JSON.stringify({phone:assistantState.phone,paymentMethod:assistantState.paymentMethod,transferMode:assistantState.transferMode,transferLast3:assistantState.transferLast3}));
  const total = products.reduce((s,p)=>s+Number(p.price||0),0);
  assistantReply(`تم تجهيز الطلب: ${products.map(p=>p.name).join(' + ')}<br>الإجمالي: ${money(total)}<br>افتح الدفع وارفع سكرين التحويل ثم اضغط تنفيذ الشراء.`,[{label:'فتح الدفع ورفع السكرين',cmd:'assistantCheckout'},{label:'إلغاء',cmd:'assistantCancel'}]);
  assistantState = null;
}

document.addEventListener('submit', e=>{
  if(e.target.id==='checkoutForm'){ e.preventDefault(); submitCheckout(e.target); }
  if(e.target.id==='trackForm'){ e.preventDefault(); trackOrder(new FormData(e.target).get('phone')); }
  if(e.target.id==='assistantForm'){ e.preventDefault(); const input=$('#assistantInput'); handleAssistant(input.value); input.value=''; }
});
document.addEventListener('change', e=>{
  if(e.target.id==='screenshotInput'){
    checkoutFile = e.target.files?.[0] || null;
    $('#filePreview').textContent = checkoutFile ? `تم اختيار: ${checkoutFile.name}` : 'لم يتم اختيار صورة بعد';
  }
});
document.addEventListener('focusin', e=>{
  if(e.target.matches('input,textarea,select')) document.body.classList.add('typing');
});
document.addEventListener('focusout', e=>{
  if(e.target.matches('input,textarea,select')) setTimeout(()=>document.body.classList.remove('typing'), 180);
});
$('#cartBubble').addEventListener('click',()=>navigate('/cart'));
$('#openAssistant').addEventListener('click',()=>{ $('#assistantPanel').classList.add('open'); assistantReply('أنا معاك يا بطل. محتاج تشحن، تتابع طلب، ولا تعرف طرق الدفع؟',[{label:'ابدأ الشحن',cmd:'charge'},{label:'تابع طلبي',cmd:'track'},{label:'طرق الدفع',cmd:'checkout'},{label:'مشكلة في الطلب',cmd:'track'}]); });
$('#closeAssistant').addEventListener('click',()=>$('#assistantPanel').classList.remove('open'));
window.addEventListener('popstate',()=>{route=location.pathname; render();});
window.addEventListener('cart:changed', updateCartBubble);
render();
