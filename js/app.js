import { loadCatalog } from './catalog.js';
import { addCartItem, cartTotal, cartUnits, clearCart, deviceId, money, readCart, removeCartItem, saveCart, toast, updateCartItem } from './store.js';
import { SITE_CONTENT } from './site-content.js';

let catalog = {games:[],sections:[],products:[],offers:[]};
let route = location.pathname;
let selectedSection = {};
let selectedOfferProducts = {};
let coupon = null;
let checkoutFile = null;
let assistantState = null;

const $ = (s,root=document)=>root.querySelector(s);
const app = $('#app');
function esc(v){ return String(v ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function policiesCards(){
  return `<div class="policy-grid">${SITE_CONTENT.sections.map(s=>`<details class="policy-card"><summary>${esc(s.title)}</summary><p>${esc(s.body)}</p></details>`).join('')}</div>`;
}
function cartWarningType(cart=readCart()){
  const names=cart.map(i=>`${i.product||''} ${i.name||''}`).join(' ');
  if(/ازدهار|Growth|Prosperity/i.test(names)) return 'growth';
  if(/كريستالة|Crystal/i.test(names)) return 'crystal';
  return '';
}

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
  const supportPhone = String(catalog.store?.supportPhone || '201061707294').replace(/\D/g,'');
  ['supportWhatsApp','footerSupportWhatsApp'].forEach(id=>{ const a=document.getElementById(id); if(a) a.href=`https://wa.me/${supportPhone}`; });
}

function renderHome(){
  const mainOffer = catalog.offers.find(o=>!o.placement || o.placement==='home' || o.placement==='both');
  const store = catalog.store || {};
  const statusText = store.status==='maintenance' ? 'صيانة مؤقتة' : store.status==='busy' ? 'مزدحم ولكن شغال' : store.status==='closed' ? 'مغلق حاليا ويقبل طلبات' : 'متاح الآن';
  const statusMsg = store.message || (store.status==='closed' ? `التنفيذ يبدأ في مواعيد العمل${store.workHours ? ': '+store.workHours : ''}` : store.status==='busy' ? 'تقدر تعمل الأوردر عادي لكن التنفيذ ممكن يتأخر شوية.' : 'التنفيذ شغال حاليا بشكل طبيعي.');
  const heroCopy = store.status==='closed'
    ? 'تقدر تسجل طلبك دلوقتي، وهنبدأ مراجعته مع بداية مواعيد العمل.'
    : store.status==='busy'
      ? 'فيه ضغط بسيط، لكن الطلبات بتتسجل وبتتنفذ بالترتيب.'
      : store.status==='maintenance'
        ? 'بنجهز تحسينات سريعة. الطلبات متوقفة مؤقتا لسلامة التنفيذ.'
        : 'اختار لعبتك وكمل طلبك بخطوات واضحة وسريعة.';
  page(`
    <section class="section hero">
      <div>
        <span class="status-pill store-${store.status||'available'}">${statusText}</span>
        <div class="store-alert store-${store.status||'available'}">
          <b>${statusText}</b>
          <span>${statusMsg}</span>
          ${store.workHours ? `<small>مواعيد العمل: ${store.workHours}</small>` : ''}
        </div>
        <h1>ليه تستخدم موبا شوب؟</h1>
        <p>${heroCopy}</p>
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
  const badge = o.discountBadge || o.badge || '';
  const end = o.endsAt ? new Date(o.endsAt).getTime() : 0;
  const left = end && end>Date.now() ? Math.ceil((end-Date.now())/86400000) : 0;
  const productIds = Array.isArray(o.productIds) ? o.productIds.join(',') : String(o.productIds || '');
  return `<button class="offer-card" data-offer-game="${o.game || 'pubg'}" data-offer-section="${o.section || ''}" data-offer-products="${productIds}" type="button">
    <img src="${img}" alt="">
    <span class="game-status">متاح الآن</span>
    ${badge ? `<span class="discount-badge">${badge}</span>` : ''}
    <div class="offer-content">
      <span class="badge">عرض حصري</span>
      <h2>${o.title || 'عروض حصرية'}</h2>
      <p>${o.subtitle || 'باقات مختارة بسعر مميز'}</p>
      <span class="price">${o.cta || 'اضغط لفتح العرض'}</span>
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
  const firstSectionWithProducts = sections.find(s=>catalog.products.some(p=>p.game===game.slug && p.section===s.slug))?.slug;
  const active = selectedSection[game.slug] || firstSectionWithProducts || game.defaultSection || sections[0]?.slug;
  const offerIds = selectedOfferProducts[game.slug] || null;
  const products = catalog.products.filter(p=>p.game===game.slug && p.section===active && (!offerIds || offerIds.includes(p.id)));
  const gameOffer = catalog.offers.find(o=>o.game===game.slug && (o.placement==='game' || o.placement==='both'));
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
    ${gameOffer ? `<section class="section">${offerHtml(gameOffer)}</section>` : ''}
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
          ${products.map(productCard).join('') || '<div class="notice">لا توجد منتجات في القسم ده حاليا. اختار قسم تاني أو راجع العروض.</div>'}
        </div>
      </div>
    </section>
  `);
}
function productCard(p){
  const finalPrice = Number(p.salePrice || 0) > 0 ? Number(p.salePrice) : Number(p.price || 0);
  const flags = [p.hot?'Hot':'',p.featured?'مميز':'',p.bestSeller?'الأكثر طلبا':''].filter(Boolean);
  return `<article class="product-card" data-product="${p.id}">
    ${p.image ? `<img class="product-thumb" src="${p.image}" alt="">` : ''}
    <div><h3>${p.name}</h3><span>${p.unit || ''}</span>${flags.length?`<div class="product-flags">${flags.map(f=>`<b>${f}</b>`).join('')}</div>`:''}</div>
    ${p.description ? `<p class="product-desc">${p.description}</p>` : ''}
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
        <div id="couponActiveBox"></div>
      </div>
      <button class="primary" style="width:100%;margin-top:14px" ${cart.length?'':'disabled'} type="button" data-go="/checkout">كمل الدفع</button>
    </section>
  `);
  renderCouponState();
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
    const res = await fetch('/api/public?action=coupon&' + q.toString());
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'الكود غير صحيح');
    coupon = data.coupon;
    showCouponMessage(`تم تفعيل ${coupon.code}. الخصم: ${money(coupon.discount_amount)}. الإجمالي بعد الخصم: ${money(Math.max(0,total-coupon.discount_amount))}`, 'ok');
  }catch(e){ coupon=null; showCouponMessage(e.message || 'الكود غير صحيح', 'err'); }
}
function showCouponMessage(text,type){ const box=$('#couponMessage'); if(box) box.innerHTML=`<div class="message ${type==='ok'?'ok':'err'}">${text}</div>`; }
function renderCouponState(){
  const box=$('#couponActiveBox'); if(!box) return;
  if(!coupon){ box.innerHTML=''; return; }
  const total=cartTotal();
  const discount=Number(coupon.discount_amount||0);
  box.innerHTML=`<div class="message ok coupon-state">
    <b>الكوبون ${coupon.code} مفعل</b>
    <span>قبل الخصم: ${money(total)} | الخصم: ${money(discount)} | بعد الخصم: ${money(Math.max(0,total-discount))}</span>
    <small>النطاق: ${coupon.product_scope_text || 'كل المنتجات'}</small>
    <button class="mini" type="button" id="clearCoupon">إلغاء الكوبون</button>
  </div>`;
}

function paymentDetailsHtml(method, instapay, wallet){
  if(method === 'Wallet'){
    return `<b>بيانات المحفظة</b><p>Wallet Phone: ${esc(wallet.phone||'-')}</p><p>Name: ${esc(wallet.name||'-')}</p><p>${esc(wallet.message||'حوّل على المحفظة وبعدها ارفع السكرين')}</p>`;
  }
  return `<b>بيانات InstaPay</b><p>User: ${esc(instapay.user||'-')}</p><p>Phone: ${esc(instapay.phone||'-')}</p><p>Name: ${esc(instapay.name||'-')}</p><p>${esc(instapay.message||'حوّل على InstaPay وبعدها ارفع السكرين')}</p>${instapay.link?`<a class="primary" style="display:block;text-align:center" href="${esc(instapay.link)}" target="_blank">فتح InstaPay</a>`:''}`;
}
function checkoutPoliciesHtml(cart){
  const warning=cartWarningType(cart);
  return `<div class="checkout-info-card" style="grid-column:1/-1"><h3>${esc(SITE_CONTENT.checkoutIntroTitle)}</h3><ol>${SITE_CONTENT.checkoutIntro.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
  ${warning?`<div class="message warn product-warning" style="grid-column:1/-1" data-product-warning="${warning}"><b>${esc(SITE_CONTENT.productWarnings[warning])}</b><button type="button" class="ghost-btn" id="acceptProductWarning">موافق ومتأكد</button></div>`:''}
  <div class="checkout-info-card policies-mini" style="grid-column:1/-1"><div class="page-title"><div><h3>الشروط والسياسات</h3><p>ملخص سريع قبل تأكيد الطلب.</p></div><a href="/policies" data-link class="ghost-btn">عرض كل الشروط</a></div>${policiesCards()}</div>
  <label class="terms-check" style="grid-column:1/-1"><input type="checkbox" name="termsAccepted" value="true" required> ${esc(SITE_CONTENT.termsCheckbox)}</label>`;
}
function renderCheckout(){
  const cart=readCart(); const total=cartTotal(cart); const discount=Number(coupon?.discount_amount||0);
  const pay = catalog.payment || {};
  const instapay = {user:'mofr3oon1',phone:'01061707294',name:'مؤمن',link:'https://ipn.eg/S/mofr3oon1/instapay/3ALZfx',...(pay.instapay||{})};
  const wallet = {phone:'01061707294',name:'مؤمن',message:'Vodafone / Orange / Etisalat / WE',...(pay.wallet||{})};
  const locked = catalog.store?.status === 'maintenance';
  page(`
    <section class="section"><div class="page-title"><div><h1>الدفع وتنفيذ الطلب</h1><p>اختار طريقة الدفع، ارفع السكرين، وبعدها راجع الطلب قبل الإرسال.</p></div><button class="ghost-btn" data-go="/cart">رجوع للسلة</button></div></section>
    <section class="section checkout-section">
      <div class="summary-grid">
        <div class="summary-box"><b>${money(total)}</b><span>قبل الخصم</span></div>
        <div class="summary-box"><b>${money(discount)}</b><span>الخصم</span></div>
        <div class="summary-box"><b>${money(Math.max(0,total-discount))}</b><span>المطلوب دفعه</span></div>
      </div>
      ${coupon ? `<div class="message ok coupon-state" style="margin-top:12px"><b>كوبون ${coupon.code}</b><span>خصم ${money(discount)} من إجمالي ${money(total)}</span><small>${coupon.product_scope_text || 'كل المنتجات'}</small></div>` : ''}
      <div class="checkout-steps">
        <span>1. رقم المتابعة</span>
        <span>2. طريقة الدفع</span>
        <span>3. سكرين التحويل</span>
        <span>4. تنفيذ الطلب</span>
      </div>
      <div class="notice warn" style="margin-top:14px">راجع ID واسم الحساب والسكرين قبل تنفيذ الطلب. أي ID غلط بعد التأكيد مسؤولية العميل.</div>
      <form id="checkoutForm" class="checkout-grid" style="margin-top:14px">
        <div class="field"><label>رقم الموبايل للمتابعة</label><input name="customerPhone" inputmode="tel" placeholder="010xxxxxxxx" required></div>
        <div class="field"><label>طريقة الدفع</label><select name="paymentMethod"><option value="InstaPay" ${instapay.enabled===false||instapay.status==='disabled'?'disabled':''}>InstaPay</option><option value="Wallet" ${wallet.enabled===false||wallet.status==='disabled'?'disabled':''}>محفظة كاش</option></select></div>
        <div class="pay-box payment-details" id="paymentDetails" data-instapay='${JSON.stringify(instapay).replace(/'/g,'&#39;')}' data-wallet='${JSON.stringify(wallet).replace(/'/g,'&#39;')}'>
          ${paymentDetailsHtml('InstaPay', instapay, wallet)}
        </div>
        <div class="pay-box transfer-box">
          <b>تأكيد التحويل</b>
          <label><input type="radio" name="transferMode" value="same" checked> نفس رقم المتابعة</label>
          <label><input type="radio" name="transferMode" value="other"> رقم تاني أو محل دفع</label>
          <input name="transferLast3" inputmode="numeric" maxlength="3" placeholder="آخر 3 أرقام لو التحويل من رقم تاني">
        </div>
        <div class="field"><label>ملاحظة اختيارية</label><textarea name="note" rows="4" placeholder="أي ملاحظة للطلب"></textarea></div>
        <div class="field upload-card"><label>سكرين التحويل</label><input id="screenshotInput" name="screenshot" type="file" accept="image/png,image/jpeg,image/webp" required><div id="filePreview" class="message">لم يتم اختيار صورة بعد</div></div>
        ${checkoutPoliciesHtml(cart)}
        <div id="checkoutMessage" style="grid-column:1/-1"></div>
        ${locked?'<div class="message err" style="grid-column:1/-1">الموقع في وضع الصيانة حاليا، تنفيذ الطلبات متوقف مؤقتا.</div>':''}
        <button class="primary success" style="grid-column:1/-1" type="submit" ${(cart.length&&!locked)?'':'disabled'}>تنفيذ الشراء</button>
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
  if(fd.get('termsAccepted')!=='true') return checkoutMessage('لازم توافق على شروط الشحن وسياسة الاسترجاع قبل تنفيذ الطلب.', 'err');
  const warning=$('.product-warning');
  if(warning && warning.dataset.accepted!=='true') return checkoutMessage('اقرأ تنبيه المنتج واضغط موافق ومتأكد قبل تنفيذ الطلب.', 'err');
  if(fd.get('transferMode')==='other' && !/^\d{3}$/.test(String(fd.get('transferLast3')||''))) return checkoutMessage('اكتب آخر 3 أرقام من رقم التحويل.', 'err');
  if(!checkoutFile) return checkoutMessage('ارفع سكرين التحويل الأول.', 'err');
  fd.set('cart', JSON.stringify(cart));
  fd.set('deviceId', deviceId());
  fd.set('termsAccepted','true');
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
function renderPolicies(){
  page(`<section class="section policies-page">
    <div class="page-title"><div><span class="badge">MOBA SHOP</span><h1>${esc(SITE_CONTENT.policiesTitle)}</h1><p>اقرأ الشروط المهمة قبل الشراء، وكل النصوص هنا قابلة للتعديل من ملف واحد.</p></div></div>
    ${policiesCards()}
  </section>`);
}
async function trackOrder(phone){
  const box=$('#trackResult'); box.innerHTML='<div class="message">جاري البحث...</div>';
  try{ const r=await fetch('/api/public?action=status&history=1&phone='+encodeURIComponent(phone)); const d=await r.json(); if(!d.ok) throw new Error(d.error||'لا يوجد طلب');
    const orders=d.orders||[];
    const groups={all:orders,fix:orders.filter(o=>['needs_fix','on_hold','pending'].includes(o.status)),done:orders.filter(o=>o.status==='delivered'),cancel:orders.filter(o=>['cancelled','rejected'].includes(o.status))};
    box.innerHTML = `<div class="track-tabs"><button class="active" data-track-filter="all">الكل <small>${groups.all.length}</small></button><button data-track-filter="fix">محتاج تعديل/معلق <small>${groups.fix.length}</small></button><button data-track-filter="done">مكتمل <small>${groups.done.length}</small></button><button data-track-filter="cancel">ملغي <small>${groups.cancel.length}</small></button></div><div id="trackOrders">${orders.map(o=>trackCard(o,phone)).join('')}</div>`;
  }catch(e){ box.innerHTML=`<div class="message err">${e.message}</div>`; }
}
function trackCard(o,phone){
  const fix=o.status==='needs_fix';
  return `<details class="track-card" data-track-status="${o.status}">
    <summary><b>${esc(o.order_code || o.id)}</b><span>${esc(o.status_label || o.status_text || o.status)}</span><span>${money(o.total)}</span></summary>
    <div class="track-detail-grid">
      <div><b>وقت الطلب</b><span>${esc(o.created_at||'-')}</span></div>
      <div><b>طريقة الدفع</b><span>${esc(o.payment_method||'-')}</span></div>
      <div><b>آخر تحديث</b><span>${esc(o.updated_at||'-')}</span></div>
      <div><b>الإجمالي</b><span>${money(o.total)}</span></div>
    </div>
    <div class="track-items">${(o.items||[]).map(i=>`<article><b>${esc(i.product)}</b><span>ID: ${esc(i.pubgId||'-')}</span><span>Name: ${esc(i.pubgName||'-')}</span><span>Qty: ${esc(i.qty||1)}</span></article>`).join('')}</div>
    ${fix?`<form class="fix-form" data-fix-form><input type="hidden" name="orderId" value="${o.id}"><input type="hidden" name="phone" value="${phone}"><div class="field"><label>اكتب التعديل المطلوب</label><textarea name="fixValue" rows="3" placeholder="ID الجديد / الرقم الصحيح / ملاحظة المبلغ الناقص"></textarea></div><div class="field"><label>ارفع سكرين جديد لو المشكلة تخص الدفع أو السكرين</label><input type="file" name="fixFile" accept="image/png,image/jpeg,image/webp"></div><button class="primary" type="submit">إرسال التعديل</button><a class="ghost-btn" href="https://wa.me/201061707294" target="_blank">التواصل مع الدعم</a></form>`:''}
  </details>`;
}
async function renderReviews(){
  page(`<section class="section reviews-form-section"><div class="page-title"><div><span class="badge">MOBA SHOP Reviews</span><h1>تقييم الخدمة</h1><p>شارك تجربتك، وبعد المراجعة يظهر تقييمك للزوار.</p></div></div>
  <form id="reviewForm" class="checkout-grid">
    <div class="field"><label>اسمك</label><input name="customer_name" maxlength="32" required></div>
    <div class="field"><label>التقييم</label><select name="rating"><option value="5">5 نجوم</option><option value="4">4 نجوم</option><option value="3">3 نجوم</option></select></div>
    <div class="field" style="grid-column:1/-1"><label>رأيك</label><textarea name="review_text" rows="4" maxlength="260" required></textarea></div>
    <button class="primary" type="submit">إرسال</button>
    <div id="reviewMessage"></div>
  </form></section>
  <section class="section reviews-section"><div class="page-title"><div><h1>آراء العملاء</h1><p>تقييمات مقبولة بعد مراجعة المتجر.</p></div></div><div id="reviewsList" class="reviews-grid"><div class="message">جاري تحميل الآراء...</div></div></section>`);
  try{
    const r=await fetch('/api/public?action=reviews'); const d=await r.json();
    const list=$('#reviewsList');
    list.innerHTML=(d.reviews||[]).map(rv=>`<article class="review-card"><b>${esc(rv.customer_name)}</b><span>${'★'.repeat(Number(rv.rating||5))}</span><p>${esc(rv.review_text)}</p>${rv.store_reply?`<div class="store-reply"><b>MOBA SHOP</b><p>${esc(rv.store_reply)}</p></div>`:''}</article>`).join('') || '<div class="notice">لسه مفيش آراء ظاهرة.</div>';
  }catch(e){ $('#reviewsList').innerHTML=`<div class="message err">${e.message}</div>`; }
}

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
  else if(route==='/policies') renderPolicies();
  else renderHome();
}

document.addEventListener('click', e=>{
  const link=e.target.closest('[data-link]'); if(link){ e.preventDefault(); navigate(link.getAttribute('href')); return; }
  const go=e.target.closest('[data-go]'); if(go){ navigate(go.dataset.go); return; }
  const game=e.target.closest('[data-game]'); if(game){ const g=gameBySlug(game.dataset.game); if(g.status==='available') navigate('/game/'+g.slug); else toast('اللعبة دي هتتوفر قريبًا'); return; }
  const offer=e.target.closest('[data-offer-game]'); if(offer){ selectedSection[offer.dataset.offerGame]=offer.dataset.offerSection || selectedSection[offer.dataset.offerGame]; const ids=(offer.dataset.offerProducts||'').split(',').map(x=>x.trim()).filter(Boolean); selectedOfferProducts[offer.dataset.offerGame]=ids.length?ids:null; navigate('/game/'+offer.dataset.offerGame); return; }
  const section=e.target.closest('[data-section]'); if(section){ selectedOfferProducts[currentGameSlug()]=null; selectedSection[currentGameSlug()]=section.dataset.section; renderGame(); return; }
  const plus=e.target.closest('[data-qty-plus]'); if(plus){ const q=plus.closest('.product-card').querySelector('[data-qty]'); q.textContent=Number(q.textContent)+1; return; }
  const minus=e.target.closest('[data-qty-minus]'); if(minus){ const q=minus.closest('.product-card').querySelector('[data-qty]'); q.textContent=Math.max(1,Number(q.textContent)-1); return; }
  const add=e.target.closest('[data-add-product]'); if(add) return addProduct(add.dataset.addProduct, add.closest('.product-card'));
  const cp=e.target.closest('[data-cart-plus]'); if(cp){ const i=Number(cp.dataset.cartPlus); const cart=readCart(); if(cart[i]?.noQty){toast('هذا المنتج كمية واحدة فقط'); renderCart(); return;} updateCartItem(i,{qty:Number(cart[i].qty||1)+1}); renderCart(); return; }
  const cm=e.target.closest('[data-cart-minus]'); if(cm){ const i=Number(cm.dataset.cartMinus); const cart=readCart(); updateCartItem(i,{qty:Math.max(1,Number(cart[i].qty||1)-1)}); renderCart(); return; }
  const cr=e.target.closest('[data-cart-remove]'); if(cr){ removeCartItem(Number(cr.dataset.cartRemove)); renderCart(); return; }
  if(e.target.id==='toggleCoupon'){ const f=$('#couponForm'); f.hidden=!f.hidden; return; }
  if(e.target.id==='applyCoupon') return applyCoupon();
  if(e.target.id==='clearCoupon'){ coupon=null; renderCart(); return; }
  if(e.target.id==='acceptProductWarning'){ e.target.closest('.product-warning')?.classList.add('accepted'); e.target.closest('.product-warning')?.setAttribute('data-accepted','true'); e.target.textContent='تم التأكيد'; e.target.disabled=true; return; }
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
  if(cmd==='support'){
    const phone=(catalog.store?.supportPhone || '201061707294').replace(/\D/g,'');
    window.open(`https://wa.me/${phone}`,'_blank','noopener');
    return;
  }
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
    const pay = catalog.payment || {};
    const instapay = {user:'mofr3oon1',phone:'01061707294',name:'مؤمن',...(pay.instapay||{})};
    const wallet = {phone:'01061707294',name:'مؤمن',message:'Vodafone / Orange / Etisalat / WE',...(pay.wallet||{})};
    const payText = assistantState.paymentMethod === 'InstaPay' ? `InstaPay: ${instapay.user||'-'} | Phone: ${instapay.phone||'-'} | Name: ${instapay.name||'-'}` : `Wallet Phone: ${wallet.phone||'-'} | Name: ${wallet.name||'-'}`;
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
  if(e.target.id==='reviewForm'){ e.preventDefault(); submitReview(e.target); }
  if(e.target.matches('[data-fix-form]')){ e.preventDefault(); submitFix(e.target); }
});
async function submitReview(form){
  const box=$('#reviewMessage'); box.innerHTML='<div class="message">جاري إرسال الرأي...</div>';
  try{
    const body=Object.fromEntries(new FormData(form).entries());
    const r=await fetch('/api/public?action=reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json(); if(!d.ok) throw new Error(d.error||'تعذر إرسال الرأي');
    form.reset(); box.innerHTML='<div class="message ok">تم إرسال رأيك للمراجعة، وهيظهر بعد الموافقة عليه.</div>';
  }catch(e){ box.innerHTML=`<div class="message err">${e.message}</div>`; }
}
async function submitFix(form){
  const btn=form.querySelector('button'); btn.disabled=true; btn.textContent='جاري الإرسال...';
  try{
    const r=await fetch('/api/public?action=fix-order',{method:'POST',body:new FormData(form)});
    const d=await r.json(); if(!d.ok) throw new Error(d.error||'تعذر إرسال التعديل');
    form.innerHTML='<div class="message ok">تم إرسال التعديل للمتجر للمراجعة.</div>';
  }catch(e){ btn.disabled=false; btn.textContent='إرسال التعديل'; form.insertAdjacentHTML('beforeend',`<div class="message err">${e.message}</div>`); }
}
document.addEventListener('click',e=>{
  const tf=e.target.closest('[data-track-filter]');
  if(tf){ const f=tf.dataset.trackFilter; document.querySelectorAll('.track-card').forEach(c=>{const s=c.dataset.trackStatus; c.style.display=(f==='all'||(f==='fix'&&['needs_fix','on_hold','pending'].includes(s))||(f==='done'&&s==='delivered')||(f==='cancel'&&['cancelled','rejected'].includes(s)))?'block':'none';}); document.querySelectorAll('[data-track-filter]').forEach(b=>b.classList.toggle('active', b===tf)); }
});
document.addEventListener('change', e=>{
  if(e.target.name==='paymentMethod'){
    const box=$('#paymentDetails');
    if(box){
      const instapay=JSON.parse(box.dataset.instapay || '{}');
      const wallet=JSON.parse(box.dataset.wallet || '{}');
      box.innerHTML=paymentDetailsHtml(e.target.value, instapay, wallet);
    }
  }
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
function initDraggablePharaoh(){
  const btn=$('#openAssistant'); if(!btn) return;
  const saved=localStorage.getItem('pharaoh_pos');
  if(saved){try{const p=JSON.parse(saved); Object.assign(btn.style,{left:p.left+'px',top:p.top+'px',right:'auto',bottom:'auto'});}catch{}}
  let dragging=false,moved=false,dx=0,dy=0;
  btn.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;moved=false;btn.setPointerCapture?.(e.pointerId);const r=btn.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;btn.classList.add('dragging');});
  btn.addEventListener('pointermove',e=>{if(!dragging)return;e.preventDefault();moved=true;const x=Math.max(6,Math.min(innerWidth-btn.offsetWidth-6,e.clientX-dx));const y=Math.max(6,Math.min(innerHeight-btn.offsetHeight-6,e.clientY-dy));Object.assign(btn.style,{left:x+'px',top:y+'px',right:'auto',bottom:'auto'});});
  btn.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;btn.classList.remove('dragging');localStorage.setItem('pharaoh_pos',JSON.stringify({left:btn.offsetLeft,top:btn.offsetTop}));setTimeout(()=>{moved=false},80);});
  btn.addEventListener('click',e=>{if(moved){e.preventDefault();return;} $('#assistantPanel').classList.add('open'); const hours=catalog.store?.workHours || 'يوميا من 12 ظهرا إلى 2 صباحا'; assistantReply(`أنا معاك يا بطل. محتاج تشحن، تتابع طلب، ولا تكلم الدعم؟<br>مواعيد العمل: ${hours}`,[{label:'ابدأ الشحن',cmd:'charge'},{label:'تابع طلبي',cmd:'track'},{label:'طرق الدفع',cmd:'checkout'},{label:'الدعم',cmd:'support'}]);});
}
initDraggablePharaoh();
$('#closeAssistant').addEventListener('click',()=>$('#assistantPanel').classList.remove('open'));
window.addEventListener('popstate',()=>{route=location.pathname; render();});
window.addEventListener('cart:changed', updateCartBubble);

// V217: customer safety, manual store status, FAQ, direct product links, and cleaner tracking.
function storeStatusInfo(){
  const key = String(catalog.store?.status || 'available');
  const info = SITE_CONTENT.storeStatus?.[key] || SITE_CONTENT.storeStatus?.available || {};
  const message = catalog.store?.message || info.message || '';
  return {key,title:info.title || 'متاح الآن',message,tone:info.tone || 'ok',hours:catalog.store?.workHours || catalog.store?.work_hours || ''};
}
function storeStatusCard(compact=false){
  const s=storeStatusInfo();
  const hours=s.hours ? `<small>مواعيد العمل: ${esc(s.hours)}</small>` : '';
  return `<div class="store-status-card ${s.tone} ${compact?'compact':''}">
    <span class="status-dot"></span>
    <div><b>${esc(s.title)}</b><p>${esc(s.message)}</p>${hours}</div>
  </div>`;
}
function supportLinks(){
  const phone=String(catalog.store?.supportPhone || '201061707294').replace(/\D/g,'');
  return `<div class="support-actions"><a class="ghost-btn" href="https://wa.me/${phone}" target="_blank" rel="noopener">واتساب</a><a class="ghost-btn" href="https://t.me/MOFR3OON" target="_blank" rel="noopener">تليجرام</a></div>`;
}
const _v217RenderHome = renderHome;
renderHome = function(){
  _v217RenderHome();
  const hero=$('.hero');
  if(hero && !$('.store-status-card')) hero.insertAdjacentHTML('afterbegin', storeStatusCard(true));
};
const _v217RenderCheckout = renderCheckout;
renderCheckout = function(){
  _v217RenderCheckout();
  const section=$('.checkout-section');
  if(section && !section.querySelector('.store-status-card')) section.insertAdjacentHTML('afterbegin', storeStatusCard(true));
  const phone=$('[name="customerPhone"]');
  if(phone && !phone.value) phone.value=localStorage.getItem('moba_last_phone') || '';
};
const _v217RenderPolicies = renderPolicies;
renderPolicies = function(){
  _v217RenderPolicies();
  const pageEl=$('.policies-page');
  if(pageEl && !pageEl.querySelector('.store-status-card')) pageEl.insertAdjacentHTML('afterbegin', storeStatusCard(true));
};
const _v217RenderGame = renderGame;
renderGame = function(slug=currentGameSlug()){
  _v217RenderGame(slug);
  const id=$('#accountId');
  const name=$('#accountName');
  if(id && !id.value) id.value=localStorage.getItem('moba_last_id') || '';
  if(name && !name.value) name.value=localStorage.getItem('moba_last_name') || '';
  if(window.__mobaFocusProduct){
    const card=document.querySelector(`[data-product="${CSS.escape(window.__mobaFocusProduct)}"]`);
    if(card){ card.classList.add('focused-product'); setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'center'}),80); }
  }
};
const _v217ProductCard = productCard;
productCard = function(p){
  let html=_v217ProductCard(p);
  const badges=[];
  if(p.status==='soon') badges.push('قريبا');
  else if(p.status==='disabled') badges.push('موقوف مؤقتا');
  else badges.push('متاح');
  if(Number(p.salePrice||p.sale_price||0)>0) badges.push('عرض');
  if(p.hot) badges.push('الأكثر طلبا');
  if(p.new) badges.push('جديد');
  if(p.featured) badges.push('مميز');
  const badgeHtml=`<div class="product-badge-row">${badges.map(b=>`<span>${esc(b)}</span>`).join('')}<a href="/product/${encodeURIComponent(p.id)}" data-link class="mini product-link">رابط المنتج</a></div>`;
  return html.replace('<div><h3>', `${badgeHtml}<div><h3>`);
};
function renderFAQ(){
  page(`<section class="section faq-page">
    <div class="page-title"><div><span class="badge">MOBA SHOP</span><h1>${esc(SITE_CONTENT.faqTitle || 'الأسئلة الشائعة')}</h1><p>إجابات مختصرة قبل الشراء وبعده.</p></div></div>
    <div class="policy-grid">${(SITE_CONTENT.faq||[]).map(x=>`<details class="policy-card"><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}</div>
  </section>`);
}
function renderPubgOffers(){
  const game=gameBySlug('pubg');
  const products=catalog.products.filter(p=>p.game==='pubg' && (p.hot || p.featured || Number(p.salePrice||0)>0 || /عرض|ازدهار|كريستالة/i.test(p.name||'')));
  page(`<section class="section">
    <div class="page-title"><div><span class="badge">PUBG Offers</span><h1>عروض PUBG</h1><p>صفحة سريعة للنشر تعرض أهم عروض ببجي المتاحة.</p></div><button class="ghost-btn" data-go="/game/${game.slug}">فتح كل منتجات ببجي</button></div>
    <div class="products-grid">${products.map(productCard).join('') || '<div class="notice">لا توجد عروض PUBG مفعلة حاليا.</div>'}</div>
  </section>`);
}
function renderProductDirect(productId){
  const p=catalog.products.find(x=>String(x.id)===String(productId));
  if(!p){ toast('المنتج غير موجود أو تم إخفاؤه','err'); return renderHome(); }
  selectedSection[p.game]=p.section || p.cat || selectedSection[p.game];
  selectedOfferProducts[p.game]=null;
  window.__mobaFocusProduct=p.id;
  renderGame(p.game);
}
const _v217TrackCard = trackCard;
trackCard = function(o,phone){
  const msg = SITE_CONTENT.orderStatusMessages?.[o.status] || o.customer_status_text || o.status_text || o.status;
  const items = Array.isArray(o.items) ? o.items : [];
  const steps=['pending','claimed','processing','delivered'];
  const currentIndex=o.status==='rejected'||o.status==='cancelled'?3:Math.max(0,steps.indexOf(o.status));
  return `<details class="track-card upgraded-track" data-track-status="${esc(o.status)}">
    <summary><b>${esc(o.order_code || o.id)}</b><span>${esc(o.status_label || o.status_text || o.status)}</span><span>${money(o.total)}</span></summary>
    <div class="track-status-message ${o.status==='rejected'||o.status==='needs_fix'?'warn':'ok'}">${esc(msg)}</div>
    <div class="track-timeline">${steps.map((s,i)=>`<span class="${i<=currentIndex?'done':''}">${esc(SITE_CONTENT.orderStatusMessages?.[s] || s)}</span>`).join('')}</div>
    <div class="track-blocks">
      <section><h3>بيانات الطلب</h3><p>رقم الطلب: ${esc(o.order_code || o.id)}</p><p>وقت الطلب: ${esc(o.created_at || '-')}</p><p>آخر تحديث: ${esc(o.updated_at || '-')}</p></section>
      <section><h3>المنتجات</h3>${items.map(i=>`<article><b>${esc(i.product)}</b><span>ID: ${esc(i.pubgId||'-')}</span><span>Name: ${esc(i.pubgName||'-')}</span><span>Qty: ${esc(i.qty||1)}</span></article>`).join('') || '<p>لا توجد منتجات.</p>'}</section>
      <section><h3>الدفع</h3><p>طريقة الدفع: ${esc(o.payment_method||'-')}</p><p>الإجمالي: ${money(o.total)}</p></section>
      <section><h3>الحالة والدعم</h3><p>${esc(o.customer_status_text || o.status_text || o.status)}</p>${o.rejection_reason?`<p class="danger-text">${esc(o.rejection_reason)}</p>`:''}${supportLinks()}</section>
    </div>
    ${o.status==='needs_fix'?_v217TrackCard(o,phone).replace(/^<details[\s\S]*?<form class="fix-form"/,'<form class="fix-form').replace(/<\/details>$/,''):''}
  </details>`;
};
const _v217SubmitCheckout = submitCheckout;
submitCheckout = async function(form){
  const fd=new FormData(form);
  localStorage.setItem('moba_last_phone', String(fd.get('customerPhone')||''));
  return _v217SubmitCheckout(form);
};
const _v217AddProduct = addProduct;
addProduct = function(id,card){
  const before=readCart().length;
  const result=_v217AddProduct(id,card);
  if(readCart().length>before){
    localStorage.setItem('moba_last_id', $('#accountId')?.value.trim() || '');
    localStorage.setItem('moba_last_name', $('#accountName')?.value.trim() || '');
  }
  return result;
};
const _v217Render = render;
render = async function(){
  if(!catalog.games.length) catalog = await loadCatalog();
  applyBrand();
  if(route.startsWith('/product/')) return renderProductDirect(decodeURIComponent(route.split('/').pop()||''));
  if(route==='/faq') return renderFAQ();
  if(route==='/offers/pubg') return renderPubgOffers();
  return _v217Render();
};
async function visitorPing(){
  try{
    const r=await fetch('/api/public?action=client-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'visitor_ping',deviceId:deviceId(),page:location.pathname})});
    const d=await r.json().catch(()=>null);
    if(d?.blocked) document.body.innerHTML = `<main class="app-shell"><section class="section"><div class="message err">${d.error || 'تم حظر الجهاز من استخدام الموقع.'}</div></section></main>`;
  }catch{}
}
visitorPing();
setInterval(visitorPing, 60000);
render();

// V218 launch hardening: success actions, safe checkout confirmation, upload preview, and 404.
let checkoutSubmittingV218 = false;
function customerErrorMessage(error){
  const msg = String(error?.message || error || '');
  if(/supabase|telegram|stack|syntax|unexpected|token|secret|service|fetch failed|networkerror/i.test(msg)){
    return 'حصلت مشكلة مؤقتة، جرب مرة تانية أو تواصل معنا.';
  }
  return msg || 'حصلت مشكلة مؤقتة، جرب مرة تانية أو تواصل معنا.';
}
function selectedPaymentSettings(form){
  const details = $('#paymentDetails');
  const instapay = JSON.parse(details?.dataset.instapay || '{}');
  const wallet = JSON.parse(details?.dataset.wallet || '{}');
  const method = String(form.paymentMethod?.value || 'InstaPay');
  return {method, instapay, wallet, data:/insta/i.test(method) ? instapay : wallet};
}
function validateSelectedPayment(form){
  const {method, data} = selectedPaymentSettings(form);
  if(data.enabled === false || data.status === 'disabled' || data.status === 'maintenance'){
    throw new Error(`${method} متوقف مؤقتا. اختار طريقة دفع تانية أو تواصل مع الدعم.`);
  }
  if(/insta/i.test(method) && (!String(data.user || '').trim() || !String(data.link || '').trim())){
    throw new Error('بيانات InstaPay ناقصة حاليا. اختار محفظة كاش أو تواصل مع الدعم.');
  }
  if(!/insta/i.test(method) && (!String(data.phone || '').trim() || !String(data.name || '').trim())){
    throw new Error('بيانات المحفظة ناقصة حاليا. اختار InstaPay أو تواصل مع الدعم.');
  }
}
function orderConfirmModalV218(form, cart, total){
  return new Promise(resolve=>{
    const {method} = selectedPaymentSettings(form);
    const first = cart[0] || {};
    const products = cart.map(i=>`${i.product || i.name || '-'} × ${i.qty || 1}`).join(' / ');
    const back = document.createElement('div');
    back.className = 'modal-backdrop checkout-confirm-modal';
    back.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-label="تأكيد إرسال الطلب">
      <h2>راجع طلبك قبل الإرسال</h2>
      <div class="confirm-lines">
        <p><b>المنتجات:</b> ${esc(products)}</p>
        <p><b>الإجمالي:</b> ${money(total)}</p>
        <p><b>طريقة الدفع:</b> ${esc(method)}</p>
        <p><b>رقم الموبايل:</b> ${esc(form.customerPhone?.value || '-')}</p>
        <p><b>ID:</b> ${esc(first.pubgId || '-')}</p>
      </div>
      <div class="modal-actions">
        <button class="primary success" type="button" data-confirm-send>تأكيد وإرسال الطلب</button>
        <button class="ghost-btn" type="button" data-confirm-back>رجوع للتعديل</button>
      </div>
    </div>`;
    document.body.appendChild(back);
    back.querySelector('[data-confirm-send]').addEventListener('click',()=>{back.remove(); resolve(true);});
    back.querySelector('[data-confirm-back]').addEventListener('click',()=>{back.remove(); resolve(false);});
    back.addEventListener('click',e=>{ if(e.target === back){ back.remove(); resolve(false); } });
  });
}
function testOrderEnabledV218(){
  const params = new URLSearchParams(location.search);
  return params.get('test') === '1' || localStorage.getItem('moba_test_order') === '1';
}
submitCheckout = async function(form){
  if(checkoutSubmittingV218) return;
  const cart=readCart();
  if(!cart.length) return checkoutMessage('السلة فاضية.', 'err');
  const fd = new FormData(form);
  try{
    validateSelectedPayment(form);
    if(fd.get('termsAccepted')!=='true') throw new Error('لازم توافق على شروط الشحن وسياسة الاسترجاع قبل تنفيذ الطلب.');
    const warning=$('.product-warning');
    if(warning && warning.dataset.accepted!=='true') throw new Error('اقرأ تنبيه المنتج واضغط موافق ومتاكد قبل تنفيذ الطلب.');
    if(fd.get('transferMode')==='other' && !/^\d{3}$/.test(String(fd.get('transferLast3')||''))) throw new Error('اكتب آخر 3 أرقام من رقم التحويل.');
    if(!checkoutFile) throw new Error('ارفع سكرين التحويل الأول.');
    const total = Math.max(0, cartTotal(cart)-Number(coupon?.discount_amount||0));
    const ok = await orderConfirmModalV218(form, cart, total);
    if(!ok) return;
    checkoutSubmittingV218 = true;
    fd.set('cart', JSON.stringify(cart));
    fd.set('deviceId', deviceId());
    fd.set('termsAccepted','true');
    if(testOrderEnabledV218()) fd.set('testOrder','true');
    if(coupon?.code) fd.set('coupon_code', coupon.code);
    fd.set('screenshot', checkoutFile, checkoutFile.name);
    localStorage.setItem('moba_last_phone', String(fd.get('customerPhone')||''));
    const btn=form.querySelector('button[type="submit"]');
    btn.disabled=true;
    btn.textContent='جاري إرسال الطلب...';
    const res = await fetch('/api/order',{method:'POST',body:fd});
    const data = await res.json().catch(()=>({ok:false,error:'حصلت مشكلة مؤقتة، جرب مرة تانية أو تواصل معنا.'}));
    if(!data.ok) throw new Error(data.error || 'تعذر تنفيذ الطلب');
    clearCart(); coupon=null; checkoutFile=null;
    sessionStorage.setItem('last_invoice', JSON.stringify(data));
    navigate('/success');
  }catch(e){
    checkoutSubmittingV218 = false;
    checkoutMessage(customerErrorMessage(e), 'err');
    const btn=form.querySelector('button[type="submit"]');
    if(btn){ btn.disabled=false; btn.textContent='تنفيذ الشراء'; }
  }
};
renderSuccess = function(){
  const data = JSON.parse(sessionStorage.getItem('last_invoice') || '{}');
  page(`<section class="section invoice success-page">
    <div class="invoice-card">
      <span class="badge success-badge">تم تسجيل الطلب</span>
      <h1>تم تسجيل طلبك بنجاح</h1>
      <p>طلبك وصل وهيتم مراجعته يدويًا قبل التنفيذ للتأكد من بيانات الدفع والمنتجات.</p>
      <div class="summary-grid">
        <div class="summary-box"><b>${esc(data.orderCode || data.orderId || '-')}</b><span>رقم الطلب</span></div>
        <div class="summary-box"><b>${esc(data.status || 'تحت المراجعة')}</b><span>حالة الطلب</span></div>
        <div class="summary-box"><b>${money(data.total || 0)}</b><span>الإجمالي</span></div>
      </div>
      <div class="message ok">احتفظ برقم الطلب أو رقم الموبايل لمتابعة طلبك.</div>
      <div class="success-actions">
        <button class="primary" data-go="/track">متابعة الطلب</button>
        ${supportLinks()}
      </div>
    </div>
  </section>`);
};
function renderNotFoundV218(){
  page(`<section class="section not-found-page">
    <div class="invoice-card">
      <span class="badge">404</span>
      <h1>الصفحة غير موجودة</h1>
      <p>الرابط ده مش موجود أو اتغير. تقدر ترجع للرئيسية أو تكلم الدعم لو محتاج مساعدة.</p>
      <div class="success-actions"><button class="primary" data-go="/">الرجوع للرئيسية</button>${supportLinks()}</div>
    </div>
  </section>`);
}
const _v218Render = render;
render = async function(){
  if(!catalog.games.length) catalog = await loadCatalog();
  const known = route==='/' || ['/cart','/checkout','/success','/track','/policies','/reviews','/faq','/offers/pubg'].includes(route) || route.startsWith('/game/') || route.startsWith('/product/');
  if(!known) return renderNotFoundV218();
  return _v218Render();
};
document.addEventListener('change', e=>{
  if(e.target.id==='screenshotInput'){
    checkoutFile = e.target.files?.[0] || null;
    const box = $('#filePreview');
    if(!box) return;
    if(!checkoutFile){ box.innerHTML='لم يتم اختيار صورة بعد'; return; }
    const size = checkoutFile.size >= 1024*1024 ? `${(checkoutFile.size/1024/1024).toFixed(2)} MB` : `${Math.ceil(checkoutFile.size/1024)} KB`;
    const url = URL.createObjectURL(checkoutFile);
    box.innerHTML = `<div class="upload-preview"><img src="${url}" alt="معاينة سكرين التحويل"><div><b>${esc(checkoutFile.name)}</b><small>الحجم: ${size}</small><button type="button" class="mini" onclick="document.getElementById('screenshotInput')?.click()">تغيير الصورة</button></div></div>`;
  }
});
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
function sendClientErrorLogV218(type, payload){
  try{
    const safe = {
      type,
      deviceId: deviceId(),
      page: location.pathname,
      message: String(payload?.message || payload?.reason || payload || '').slice(0,220),
      source: String(payload?.filename || payload?.source || '').slice(0,160),
      line: Number(payload?.lineno || 0) || 0,
      at: new Date().toISOString()
    };
    fetch('/api/public?action=client-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'client_error',...safe})}).catch(()=>null);
  }catch{}
}
window.addEventListener('error', e=>sendClientErrorLogV218('window.onerror', e));
window.addEventListener('unhandledrejection', e=>sendClientErrorLogV218('unhandledrejection', {message:e.reason?.message || e.reason || 'Unhandled rejection'}));
render();
