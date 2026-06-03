import { DEFAULT_CATALOG, readLocalCatalog, saveLocalCatalog } from './catalog.js';
import { money, toast } from './store.js';

let tab='orders';
let settings={};
let local=readLocalCatalog();
let loginChallenge=null;
let loginRole='owner';
let loginUser='';
const view=document.querySelector('#adminView');
const content=document.querySelector('#adminContent');
const loginBox=document.querySelector('#loginBox');

async function api(path, opts={}){
  const r=await fetch(path,{headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});
  const d=await r.json().catch(()=>({ok:false,error:'رد غير مفهوم'}));
  if(!d.ok) throw new Error(d.error||'حدث خطأ');
  return d;
}
async function checkLogin(){
  try{ const d=await api('/api/admin-login'); if(d.authenticated){content.hidden=false; loginBox.hidden=true; loginBox.style.display='none'; await loadSettings(); render();} }catch{}
}
async function login(){
  loginUser = document.querySelector('#adminUsername').value.trim();
  const password = document.querySelector('#adminPassword').value;
  if(!['okatoka','bobo','jojo'].includes(loginUser.toLowerCase())) return toast('اسم المستخدم لازم يكون okatoka أو Bobo أو jojo','err');
  try{
    const d = await api('/api/admin-login',{method:'POST',body:JSON.stringify({username:loginUser,password,deviceId:localStorage.getItem('moba_device_id')||'admin'})});
    if(d.needsOtp){
      loginChallenge=d.challenge; loginRole=d.role || 'owner';
      document.querySelector('#credentialsStep').hidden=true;
      document.querySelector('#otpStep').hidden=false;
      return;
    }
    content.hidden=false; loginBox.hidden=true; loginBox.style.display='none'; await loadSettings(); render();
  }
  catch(e){ toast(e.message,'err'); }
}
async function verifyOtp(){
  try{
    await api('/api/admin-login',{method:'POST',body:JSON.stringify({username:loginUser,challenge:loginChallenge,otp:document.querySelector('#adminOtp').value.trim(),role:loginRole,trustDevice:document.querySelector('#trustAdminDevice')?.checked!==false,deviceId:localStorage.getItem('moba_device_id')||'admin'})});
    content.hidden=false; loginBox.hidden=true; loginBox.style.display='none'; await loadSettings(); render();
  }catch(e){ toast(e.message,'err'); }
}
async function loadSettings(){
  try{ const d=await api('/api/settings?admin=1'); settings=d.settings||{}; }catch{ settings={}; }
  local.brand = settings.brand_settings && Object.keys(settings.brand_settings).length ? settings.brand_settings : (local.brand || {});
  local.coupons = Array.isArray(settings.coupon_rules) ? settings.coupon_rules : (local.coupons || []);
  local.offers = settings.exclusive_offer && Array.isArray(settings.exclusive_offer.items) ? settings.exclusive_offer.items : (local.offers || DEFAULT_CATALOG.offers || []);
  local.payment = settings.payment_settings || local.payment || {
    instapay:{enabled:true,status:'available',user:'mofr3oon1',phone:'01061707294',name:'مؤمن',link:'https://ipn.eg/S/mofr3oon1/instapay/3ALZfx',message:'حوّل على InstaPay وبعدها ارفع السكرين'},
    wallet:{enabled:true,status:'available',phone:'01061707294',name:'مؤمن',message:'Vodafone / Orange / Etisalat / WE'}
  };
  local.security = local.security || {
    store_status: settings.store_status || 'available',
    store_message: settings.store_message || '',
    blacklist_ips: settings.blacklist_ips || [],
    blacklist_device_ids: settings.blacklist_device_ids || [],
    blacklist_phones: settings.blacklist_phones || [],
    blacklist_pubg_ids: settings.blacklist_pubg_ids || []
  };
  if(settings.store_status || settings.store_message || settings.blacklist_ips || settings.blacklist_device_ids || settings.blacklist_phones || settings.blacklist_pubg_ids){
    local.security = {
      store_status: settings.store_status || 'available',
      store_message: settings.store_message || '',
      work_hours: settings.work_hours || '',
      blacklist_ips: Array.isArray(settings.blacklist_ips) ? settings.blacklist_ips : [],
      blacklist_device_ids: Array.isArray(settings.blacklist_device_ids) ? settings.blacklist_device_ids : [],
      blacklist_phones: Array.isArray(settings.blacklist_phones) ? settings.blacklist_phones : [],
      blacklist_pubg_ids: Array.isArray(settings.blacklist_pubg_ids) ? settings.blacklist_pubg_ids : []
    };
  }
}
async function saveSettings(){
  if(!confirm('تأكيد حفظ التغييرات؟')) return;
  try{
    const game_settings={};
    (local.games||[]).forEach(g=>{game_settings[g.slug]=g;});
    const payload={settings:{game_settings,dynamic_sections:local.sections||[],dynamic_products:local.products||[],exclusive_offer:{items:local.offers||[]},brand_settings:local.brand||{},coupon_rules:local.coupons||[],payment_settings:local.payment||{},store_status:local.security?.store_status||'available',store_message:local.security?.store_message||'',work_hours:local.security?.work_hours||'',blacklist_ips:local.security?.blacklist_ips||[],blacklist_device_ids:local.security?.blacklist_device_ids||[],blacklist_phones:local.security?.blacklist_phones||[],blacklist_pubg_ids:local.security?.blacklist_pubg_ids||[]}};
    await api('/api/settings',{method:'POST',body:JSON.stringify(payload)});
    saveLocalCatalog(local);
    toast('تم الحفظ');
  }catch(e){ saveLocalCatalog(local); toast('تم الحفظ محليًا فقط: '+e.message,'err'); }
}
function render(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  if(tab==='catalog') return renderCatalog();
  if(tab==='offers') return renderOffers();
  if(tab==='brand') return renderBrand();
  if(tab==='coupons') return renderCoupons();
  if(tab==='security') return renderSecurity();
  if(tab==='reports') return renderReports();
  if(tab==='archive') return renderArchive();
  if(tab==='visitors') return renderVisitors();
  if(tab==='payments') return renderPayments();
  if(tab==='health') return renderHealth();
  if(tab==='adminlog') return renderAdminLog();
  return renderOrders();
}
async function renderOrders(){
  view.innerHTML='<div class="message">جاري تحميل الطلبات...</div>';
  try{
    const d=await api('/api/admin-orders?limit=80');
    view.innerHTML=`<div class="page-title"><div><h1>الطلبات</h1><p>${d.meta?.count||0} طلب</p></div><button class="primary" id="refreshOrders">تحديث</button></div><div class="orders-list">${(d.orders||[]).map(orderHtmlCompact).join('')||'<div class="notice">لا توجد طلبات.</div>'}</div>`;
  }catch(e){ view.innerHTML=`<div class="message err">${e.message}</div>`; }
}
function orderHtml(o){
  const items=(o.items||[]).map(i=>`${i.product} (${i.qty||1}) - ID: ${i.pubgId}`).join('<br>');
  return `<article class="order-card" data-order="${o.id}">
    <div class="page-title"><div><h2>${o.order_code||o.id}</h2><p>${o.phone||'-'} | ${o.payment_method||'-'} | ${money(o.total)}</p></div><span class="badge">${o.status_text||o.status}</span></div>
    <div class="admin-card">${items}</div>
    ${o.telegram_photo_file_id?`<div class="admin-card"><img src="/api/admin-orders?screenshot=${encodeURIComponent(o.telegram_photo_file_id)}" style="max-width:100%;border-radius:14px" alt="screenshot"></div>`:''}
    <textarea class="order-note" placeholder="ملاحظة أو سبب المشكلة" rows="2" style="width:100%;margin-top:10px"></textarea>
    <div class="order-actions">
      <button class="st-claimed" data-status="claimed">استلام</button>
      <button class="st-processing" data-status="processing">جاري التنفيذ</button>
      <button class="st-delivered" data-status="delivered">تم الشحن</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="السكرين غير واضح. ارفع صورة جديدة يظهر فيها رقم أو اسم التحويل، المبلغ، ووقت التحويل.">سكرين غير واضح</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="ID أو اسم الحساب غير صحيح. راجع البيانات وارسلها من جديد.">ID غلط</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="المبلغ المحول أقل من إجمالي الطلب. راجع الفرق أو تواصل مع الدعم.">المبلغ ناقص</button>
      <button class="st-cancelled" data-status="cancelled">إلغاء</button>
      <button class="st-archived" data-status="archived" data-note="تمت أرشفة الطلب من لوحة الأدمن.">أرشفة</button>
    </div>
  </article>`;
}
function orderHtmlCompact(o){
  const items=(o.items||[]).map(i=>`${i.product} (${i.qty||1}) - ID: ${i.pubgId || '-'} - Name: ${i.pubgName || '-'}`).join('<br>');
  const firstId=(o.items||[])[0]?.pubgId||'';
  const ip=o.raw_data?.clientIp||'-';
  const dev=o.raw_data?.deviceId||'-';
  return `<details class="order-card compact-order" data-order="${o.id}">
    <summary><b>${o.order_code||o.id}</b><span>${o.phone||'-'}</span><span>${money(o.total)}</span><span class="badge">${o.status_text||o.status}</span></summary>
    <div class="admin-card order-meta"><b>البيانات</b><p>الدفع: ${o.payment_method||'-'} | الوقت: ${o.created_at||'-'}</p><p>IP: ${ip} | Device: ${dev}</p></div>
    <div class="admin-card">${items}</div>
    ${o.telegram_photo_file_id?`<div class="admin-card"><img src="/api/admin-orders?screenshot=${encodeURIComponent(o.telegram_photo_file_id)}" style="max-width:100%;border-radius:14px" alt="screenshot"></div>`:''}
    <textarea class="order-note" placeholder="ملاحظة أو سبب المشكلة للعميل" rows="2" style="width:100%;margin-top:10px"></textarea>
    <div class="order-actions">
      <button class="st-claimed" data-status="claimed">استلام</button>
      <button class="st-processing" data-status="processing">جاري التنفيذ</button>
      <button class="st-delivered" data-status="delivered">تم الشحن</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="السكرين غير واضح. ارفع صورة جديدة يظهر فيها رقم أو اسم التحويل، المبلغ، ووقت التحويل.">سكرين غير واضح</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="ID أو اسم الحساب غير صحيح. اكتب ID واسم الحساب الصحيحين من صفحة متابعة الطلب.">ID غلط</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="المبلغ المحول ناقص. حول المبلغ المتبقي وارفع سكرين التحويل الجديد من صفحة متابعة الطلب.">المبلغ ناقص</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="رقم التحويل غير واضح. اكتب آخر 3 أرقام صحيحة أو الرقم الذي تم التحويل منه.">رقم التحويل غلط</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="برجاء التواصل مع الدعم لحل مشكلة طلبك: https://wa.me/201061707294">الدعم</button>
      <button class="st-cancelled" data-status="cancelled">إلغاء</button>
      <button class="st-archived" data-status="archived" data-note="تمت أرشفة الطلب من لوحة الأدمن.">أرشفة</button>
      <button class="danger" data-ban-ip="${ip}">حظر IP</button>
      <button class="danger" data-ban-device="${dev}">حظر Device</button>
      <button class="danger" data-ban-id="${firstId}">حظر ID</button>
    </div>
  </details>`;
}
async function updateOrder(card, status, fallbackNote){
  const note=card.querySelector('.order-note').value.trim() || fallbackNote || '';
  try{ await api('/api/admin-orders',{method:'POST',body:JSON.stringify({id:card.dataset.order,status,note})}); toast('تم تحديث الطلب'); renderOrders(); }
  catch(e){ toast(e.message,'err'); }
}

function combinedCatalog(){
  const games=[...DEFAULT_CATALOG.games, ...(local.games||[])];
  const sections=[...DEFAULT_CATALOG.sections, ...(local.sections||[])];
  const products=[...DEFAULT_CATALOG.products, ...(local.products||[])];
  return {games,sections,products};
}
function renderCatalogLegacy(){
  const c=combinedCatalog();
  view.innerHTML=`<div class="page-title"><div><h1>إدارة الأقسام</h1><p>كل لعبة قسم مستقل، وجواها المنتجات والخانات المطلوبة.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ</button><button class="ghost-btn" id="addGame">إضافة لعبة</button></div></div>
    <div class="admin-grid"><aside class="admin-list">${c.games.map(g=>`<button class="ghost-btn" data-edit-game="${g.slug}">${g.name}</button>`).join('')}</aside><div id="gameEditor" class="admin-card">اختار لعبة للتعديل.</div></div>`;
}
function editGameLegacy(slug){
  const c=combinedCatalog(); let game=(local.games||[]).find(g=>g.slug===slug) || c.games.find(g=>g.slug===slug);
  const sections=c.sections.filter(s=>s.game===slug); const products=c.products.filter(p=>p.game===slug);
  document.querySelector('#gameEditor').innerHTML=`<h2>${game.name}</h2>
    <div class="row">
      <div class="field"><label>اسم اللعبة</label><input data-game-field="name" value="${game.name||''}"></div>
      <div class="field"><label>Slug</label><input data-game-field="slug" value="${game.slug||''}"></div>
      <div class="field"><label>حالة اللعبة</label><select data-game-field="status"><option value="available">متاحة</option><option value="soon">قريبا</option><option value="hidden">مخفية</option></select></div>
      <div class="field"><label>ترتيب</label><input data-game-field="order" value="${game.order||99}" inputmode="numeric"></div>
    </div>
    <div class="row">
      <div class="field"><label>Label خانة ID</label><input data-game-field="idLabel" value="${game.idLabel||''}"></div>
      <div class="field"><label>Placeholder ID</label><input data-game-field="idPlaceholder" value="${game.idPlaceholder||''}"></div>
      <div class="field"><label>Label الاسم</label><input data-game-field="nameLabel" value="${game.nameLabel||''}"></div>
      <div class="field"><label>صورة اللعبة</label><div class="upload-line"><img class="image-preview" src="${game.cover||'/assets/moba-shop-logo-512.webp'}" alt=""><input data-game-field="cover" value="${game.cover||''}"><input type="file" accept="image/*" data-upload-game="${slug}"></div></div>
    </div>
    <button class="mini" data-add-zone="${slug}">إضافة خانة Zone</button>
    <h3>الأقسام داخل اللعبة</h3>
    <div class="admin-list">${sections.map(s=>`<div class="admin-card"><b>${s.name}</b><span> / ${s.slug}</span><button class="mini" data-add-product="${slug}|${s.slug}">إضافة منتج هنا</button></div>`).join('')}<button class="ghost-btn" data-new-section="${slug}">إضافة قسم</button></div>
    <h3>المنتجات</h3>
    <div class="admin-list">${products.map(p=>`<div class="admin-card row"><input data-prod="${p.id}" data-prod-field="name" value="${p.name}"><input data-prod="${p.id}" data-prod-field="price" value="${p.price}"><input data-prod="${p.id}" data-prod-field="section" value="${p.section}"><input data-prod="${p.id}" data-prod-field="order" value="${p.order||99}"></div>`).join('')}</div>`;
  const status=document.querySelector('[data-game-field="status"]'); if(status) status.value=game.status||'available';
  document.querySelectorAll('[data-game-field]').forEach(inp=>inp.addEventListener('change',()=>saveGameDraft(slug)));
  document.querySelectorAll('[data-prod-field]').forEach(inp=>inp.addEventListener('change',()=>saveProductDraft(inp.dataset.prod)));
}
function saveGameDraft(oldSlug){
  const data={}; document.querySelectorAll('[data-game-field]').forEach(i=>data[i.dataset.gameField]=i.value.trim());
  data.order=Number(data.order||99); data.fields = data.slug==='mobile-legends' ? [{key:'zoneId',label:'Zone ID',placeholder:'اكتب ID الزون',required:true,type:'number'}] : (data.fields||[]);
  local.games=(local.games||[]).filter(g=>g.slug!==oldSlug && g.slug!==data.slug); local.games.push(data);
  saveLocalCatalog(local);
}
function saveProductDraft(id){
  local.products=local.products||[];
  let p=local.products.find(x=>x.id===id);
  if(!p){
    p=DEFAULT_CATALOG.products.find(x=>x.id===id);
    if(p){ p={...p}; local.products.push(p); }
  }
  if(!p) return;
  document.querySelectorAll(`[data-prod="${id}"]`).forEach(i=>{
    const f=i.dataset.prodField;
    if(i.type==='checkbox') p[f]=i.checked;
    else if(['price','salePrice','order','amount'].includes(f)) p[f]=Number(i.value||0);
    else p[f]=i.value.trim();
  });
  saveLocalCatalog(local);
}
function addGame(){
  const slug='game-'+Date.now().toString(36);
  local.games=[...(local.games||[]),{slug,name:'لعبة جديدة',subtitle:'Top Up',cover:'/assets/moba-shop-logo-512.webp',status:'available',order:99,idLabel:'ID الحساب',idPlaceholder:'اكتب ID الحساب',nameLabel:'اسم الحساب',namePlaceholder:'اكتب اسم الحساب'}];
  local.sections=[...(local.sections||[]),{game:slug,slug:'main',name:'منتجات',order:1}];
  renderCatalog(); editGame(slug);
}
function addSection(game){
  const name=prompt('اسم القسم؟'); if(!name) return;
  const slug=name.toLowerCase().replace(/\s+/g,'_');
  local.sections=[...(local.sections||[]),{game,slug,name,order:99}]; renderCatalog(); editGame(game);
}
function addProduct(game,section){
  const name=prompt('اسم المنتج؟'); if(!name) return;
  const price=Number(prompt('السعر؟')||0); if(!price) return;
  local.products=[...(local.products||[]),{id:'p_'+Date.now(),game,section,name,price,amount:0,unit:'',order:99,status:'available'}]; renderCatalog(); editGame(game);
}
function renderOffersLegacy(){
  local.offers=local.offers||[];
  view.innerHTML=`<div class="page-title"><div><h1>العروض</h1><p>بانرات تظهر في الصفحة الرئيسية وتفتح اللعبة المختارة.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ</button><button class="ghost-btn" id="addOffer">إضافة عرض</button></div></div>
    <div class="admin-list">${local.offers.map((o,i)=>`<div class="admin-card row"><input data-offer="${i}" data-offer-field="title" value="${o.title||''}"><input data-offer="${i}" data-offer-field="game" value="${o.game||'pubg'}"><input data-offer="${i}" data-offer-field="image" value="${o.image||''}"><label><input type="checkbox" data-offer="${i}" data-offer-field="active" ${o.active!==false?'checked':''}> ظاهر</label></div>`).join('') || '<div class="notice">لا توجد عروض مخصصة.</div>'}</div>`;
  document.querySelectorAll('[data-offer-field]').forEach(i=>i.addEventListener('change',()=>{const o=local.offers[Number(i.dataset.offer)]; if(i.type==='checkbox') o[i.dataset.offerField]=i.checked; else o[i.dataset.offerField]=i.value.trim(); saveLocalCatalog(local);}));
}
function renderBrand(){
  local.brand = local.brand || {};
  const logo = local.brand.logo || '/assets/moba-shop-logo-512.webp';
  const icon = local.brand.icon || '/assets/moba-shop-logo-256.png';
  view.innerHTML = `<div class="page-title"><div><h1>البراند</h1><p>غيّر اسم الموقع واللوجو وأيقونة المتصفح من هنا.</p></div><button class="primary" id="saveCatalog">حفظ</button></div>
  <div class="row">
    <div class="field"><label>اسم الموقع</label><input data-brand-field="name" value="${local.brand.name || 'MOBA SHOP'}"></div>
    <div class="field"><label>الوصف الصغير</label><input data-brand-field="tagline" value="${local.brand.tagline || 'Digital Store For Gamers'}"></div>
    <div class="field"><label>لوجو الموقع</label><div class="upload-line"><img class="image-preview" src="${logo}" alt=""><input data-brand-field="logo" value="${logo}"><input type="file" accept="image/*" data-upload-brand="logo"></div></div>
    <div class="field"><label>أيقونة المتصفح</label><div class="upload-line"><img class="image-preview" src="${icon}" alt=""><input data-brand-field="icon" value="${icon}"><input type="file" accept="image/*" data-upload-brand="icon"></div></div>
  </div>
  <div class="notice">الصور المرفوعة هنا تتحفظ كبيانات داخل إعدادات الموقع. للأداء الأفضل استخدم صورة WebP أو PNG صغيرة.</div>`;
  document.querySelectorAll('[data-brand-field]').forEach(inp=>inp.addEventListener('change',()=>{local.brand[inp.dataset.brandField]=inp.value.trim(); saveLocalCatalog(local);}));
}
function readFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); });
}
async function uploadGameImage(input){
  const file=input.files?.[0]; if(!file) return;
  const slug=input.dataset.uploadGame;
  const data=await readFileAsDataUrl(file);
  let g=(local.games||[]).find(x=>x.slug===slug);
  if(!g){ g={...DEFAULT_CATALOG.games.find(x=>x.slug===slug)}; local.games=[...(local.games||[]),g]; }
  g.cover=data; saveLocalCatalog(local); editGame(slug); toast('تم تحديث صورة اللعبة');
}
async function uploadBrandImage(input){
  const file=input.files?.[0]; if(!file) return;
  local.brand=local.brand||{};
  local.brand[input.dataset.uploadBrand]=await readFileAsDataUrl(file);
  saveLocalCatalog(local); renderBrand(); toast('تم تحديث صورة البراند');
}
function renderCouponsLegacy(){
  local.coupons = local.coupons || [];
  view.innerHTML = `<div class="page-title"><div><h1>الكوبونات</h1><p>أكواد خصم فعلية تتحقق من السيرفر وتظهر في السلة والدفع.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ</button><button class="ghost-btn" id="addCoupon">إضافة كوبون</button></div></div>
  <div class="admin-list">${local.coupons.map((c,i)=>`<div class="admin-card row">
    <input data-coupon="${i}" data-coupon-field="code" placeholder="CODE" value="${c.code||''}">
    <select data-coupon="${i}" data-coupon-field="type"><option value="fixed">مبلغ ثابت</option><option value="percent">نسبة %</option></select>
    <input data-coupon="${i}" data-coupon-field="value" inputmode="numeric" placeholder="قيمة الخصم" value="${c.value||0}">
    <input data-coupon="${i}" data-coupon-field="min" inputmode="numeric" placeholder="حد أدنى" value="${c.min||0}">
    <label><input type="checkbox" data-coupon="${i}" data-coupon-field="active" ${c.active!==false?'checked':''}> شغال</label>
    <button class="mini danger" data-delete-coupon="${i}">حذف</button>
  </div>`).join('') || '<div class="notice">لا توجد كوبونات.</div>'}</div>`;
  document.querySelectorAll('[data-coupon-field]').forEach(inp=>{
    const c=local.coupons[Number(inp.dataset.coupon)];
    if(inp.dataset.couponField==='type') inp.value=c.type||'fixed';
    inp.addEventListener('change',()=>{const f=inp.dataset.couponField; c[f]=inp.type==='checkbox'?inp.checked:(['value','min'].includes(f)?Number(inp.value||0):String(inp.value||'').trim().toUpperCase()); saveLocalCatalog(local);});
  });
}
function splitLines(v){ return String(v||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean); }
function renderSecurityLegacy(){
  const s = local.security || {};
  view.innerHTML = `<div class="page-title"><div><h1>الأمان والحظر</h1><p>تحكم في حالة الموقع وحظر IP / Device / Phone من تنفيذ الطلبات.</p></div><button class="primary" id="saveCatalog">حفظ</button></div>
  <div class="row">
    <div class="field"><label>حالة الموقع</label><select id="storeStatus"><option value="available">متاح</option><option value="closed">مغلق</option><option value="maintenance">صيانة</option></select></div>
    <div class="field"><label>رسالة الحالة</label><input id="storeMessage" value="${s.store_message||''}" placeholder="رسالة تظهر للعميل"></div>
  </div>
  <div class="row">
    <div class="field"><label>IP محظورة</label><textarea id="blacklistIps" rows="6" placeholder="كل IP في سطر">${(s.blacklist_ips||[]).join('\n')}</textarea></div>
    <div class="field"><label>Device IDs محظورة</label><textarea id="blacklistDevices" rows="6" placeholder="كل Device في سطر">${(s.blacklist_device_ids||[]).join('\n')}</textarea></div>
    <div class="field"><label>أرقام موبايل محظورة</label><textarea id="blacklistPhones" rows="6" placeholder="كل رقم في سطر">${(s.blacklist_phones||[]).join('\n')}</textarea></div>
  </div>
  <div class="notice warn">الحظر هنا فعلي مع API تنفيذ الطلبات. أي قيمة محفوظة هنا تمنع تنفيذ أوردر جديد.</div>`;
  document.querySelector('#storeStatus').value=s.store_status||'available';
  ['storeStatus','storeMessage','blacklistIps','blacklistDevices','blacklistPhones'].forEach(id=>document.querySelector('#'+id).addEventListener('change',()=>{
    local.security={store_status:document.querySelector('#storeStatus').value,store_message:document.querySelector('#storeMessage').value,blacklist_ips:splitLines(document.querySelector('#blacklistIps').value),blacklist_device_ids:splitLines(document.querySelector('#blacklistDevices').value),blacklist_phones:splitLines(document.querySelector('#blacklistPhones').value)};
    saveLocalCatalog(local);
  }));
}
function renderReportsLegacy(){
  view.innerHTML = `<div class="page-title"><div><h1>التقارير</h1><p>تقرير يومي وأسبوعي وشهري من الطلبات الحالية.</p></div><button class="primary" id="loadReports">تحديث التقرير</button></div><div id="reportsBox" class="admin-list"><div class="message">اضغط تحديث التقرير.</div></div>`;
}
async function loadReportsLegacy(){
  const box=document.querySelector('#reportsBox'); box.innerHTML='<div class="message">جاري حساب التقرير...</div>';
  try{
    const d=await api('/api/admin-orders?limit=150'); const orders=d.orders||[]; const now=Date.now();
    const calc=days=>orders.filter(o=>now-new Date(o.created_at||0).getTime()<=days*86400000);
    const block=(title,list)=>`<div class="admin-card"><h3>${title}</h3><p>عدد الطلبات: ${list.length}</p><p>الإجمالي: ${money(list.reduce((s,o)=>s+Number(o.total||0),0))}</p></div>`;
    box.innerHTML=block('اليوم',calc(1))+block('آخر 7 أيام',calc(7))+block('آخر 30 يوم',calc(30));
  }catch(e){box.innerHTML=`<div class="message err">${e.message}</div>`;}
}
function renderArchive(){
  view.innerHTML = `<div class="page-title"><div><h1>الأرشيف</h1><p>طلبات مؤرشفة محفوظة للرجوع لها.</p></div><button class="primary" id="loadArchive">تحميل الأرشيف</button></div><div id="archiveBox" class="orders-list"></div>`;
}
async function loadArchive(){
  const box=document.querySelector('#archiveBox'); box.innerHTML='<div class="message">جاري التحميل...</div>';
  try{ const d=await api('/api/admin-orders?status=archived&limit=100'); box.innerHTML=(d.orders||[]).map(orderHtml).join('')||'<div class="notice">لا توجد طلبات مؤرشفة.</div>'; }catch(e){box.innerHTML=`<div class="message err">${e.message}</div>`;}
}
function renderVisitorsLegacy(){
  view.innerHTML = `<div class="page-title"><div><h1>الزوار والأجهزة</h1><p>مكان مراقبة IP و Device وحظرهم بسرعة.</p></div></div>
  <div class="notice warn">الطلبات تعرض IP وDevice داخل كارت الطلب. التتبع الحي للزوار يحتاج endpoint منفصل لتسجيل دخول كل زائر، وسيتم إضافته كمرحلة أمان تالية.</div>`;
}

function productEditorHtml(p){
  return `<div class="admin-card product-admin-card" data-product-row="${p.id}">
    <div class="row">
      <div class="field"><label>اسم المنتج</label><input data-prod="${p.id}" data-prod-field="name" value="${p.name||''}"></div>
      <div class="field"><label>السعر الأساسي</label><input data-prod="${p.id}" data-prod-field="price" value="${p.price||0}" inputmode="numeric"></div>
      <div class="field"><label>سعر العرض</label><input data-prod="${p.id}" data-prod-field="salePrice" value="${p.salePrice||0}" inputmode="numeric"></div>
      <div class="field"><label>ترتيب المنتج</label><input data-prod="${p.id}" data-prod-field="order" value="${p.order||99}" inputmode="numeric"></div>
    </div>
    <div class="row">
      <div class="field"><label>القسم</label><input data-prod="${p.id}" data-prod-field="section" value="${p.section||''}"></div>
      <div class="field"><label>الوحدة</label><input data-prod="${p.id}" data-prod-field="unit" value="${p.unit||''}"></div>
      <div class="field"><label>الكمية/القيمة</label><input data-prod="${p.id}" data-prod-field="amount" value="${p.amount||0}" inputmode="numeric"></div>
      <div class="field"><label>حالة المنتج</label><select data-prod="${p.id}" data-prod-field="status"><option value="available">ظاهر</option><option value="soon">قريبا</option><option value="hidden">مخفي</option></select></div>
    </div>
    <div class="admin-actions">
      <label><input type="checkbox" data-prod="${p.id}" data-prod-field="hot" ${p.hot?'checked':''}> Hot</label>
      <label><input type="checkbox" data-prod="${p.id}" data-prod-field="featured" ${p.featured?'checked':''}> مميز</label>
      <label><input type="checkbox" data-prod="${p.id}" data-prod-field="bestSeller" ${p.bestSeller?'checked':''}> الأكثر طلبا</label>
      <label><input type="checkbox" data-prod="${p.id}" data-prod-field="noQty" ${p.noQty?'checked':''}> كمية واحدة</label>
      <button class="mini danger" data-delete-product="${p.id}">إخفاء/حذف المنتج</button>
    </div>
    <div class="row">
      <div class="field"><label>بداية العرض</label><input data-prod="${p.id}" data-prod-field="startsAt" value="${p.startsAt||''}" placeholder="2026-06-03 10:00"></div>
      <div class="field"><label>نهاية العرض</label><input data-prod="${p.id}" data-prod-field="endsAt" value="${p.endsAt||''}" placeholder="2026-06-10 23:59"></div>
      <div class="field"><label>صورة المنتج - أفضل مقاس 800x450</label><input data-prod="${p.id}" data-prod-field="image" value="${p.image||''}" placeholder="/assets/products/example.webp"></div>
      <div class="field"><label>وصف قصير يظهر للعميل</label><input data-prod="${p.id}" data-prod-field="description" value="${p.description||''}" placeholder="مثال: عرض محدود أو شحن سريع"></div>
    </div>
  </div>`;
}

function renderCatalog(){
  const c=combinedCatalog();
  view.innerHTML=`<div class="page-title"><div><h1>إدارة الأقسام والمنتجات</h1><p>اختار لعبة، ثم تحكم في الأقسام والمنتجات داخلها. كل خانة هنا تؤثر على الموقع بعد الحفظ.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ التغييرات</button><button class="ghost-btn" id="addGame">إضافة لعبة</button></div></div>
  <div class="admin-grid"><aside class="admin-list">${c.games.map(g=>`<button class="ghost-btn game-admin-pick" data-edit-game="${g.slug}"><b>${g.name}</b><small>${g.status||'available'} | ترتيب ${g.order||99}</small></button>`).join('')}</aside><div id="gameEditor" class="admin-card">اختار لعبة لتعديل أقسامها ومنتجاتها.</div></div>`;
}

function editGame(slug){
  const c=combinedCatalog();
  let game=(local.games||[]).find(g=>g.slug===slug) || c.games.find(g=>g.slug===slug);
  if(!game) return;
  const sections=c.sections.filter(s=>s.game===slug);
  const products=c.products.filter(p=>p.game===slug);
  document.querySelector('#gameEditor').innerHTML=`<h2>${game.name}</h2>
    <div class="row">
      <div class="field"><label>اسم اللعبة الظاهر</label><input data-game-field="name" value="${game.name||''}"></div>
      <div class="field"><label>كود الرابط Slug</label><input data-game-field="slug" value="${game.slug||''}"></div>
      <div class="field"><label>حالة اللعبة</label><select data-game-field="status"><option value="available">متاحة</option><option value="soon">قريبا</option><option value="hidden">مخفية</option></select></div>
      <div class="field"><label>ترتيب الظهور</label><input data-game-field="order" value="${game.order||99}" inputmode="numeric"></div>
    </div>
    <div class="row">
      <div class="field"><label>اسم خانة ID</label><input data-game-field="idLabel" value="${game.idLabel||''}"></div>
      <div class="field"><label>نص داخل خانة ID</label><input data-game-field="idPlaceholder" value="${game.idPlaceholder||''}"></div>
      <div class="field"><label>اسم خانة الحساب</label><input data-game-field="nameLabel" value="${game.nameLabel||''}"></div>
      <div class="field"><label>صورة اللعبة</label><div class="upload-line"><img class="image-preview" src="${game.cover||'/assets/moba-shop-logo-512.webp'}" alt=""><input data-game-field="cover" value="${game.cover||''}"><input type="file" accept="image/*" data-upload-game="${slug}"></div></div>
    </div>
    <div class="admin-actions"><button class="mini" data-add-zone="${slug}">إضافة خانة Zone</button><button class="mini danger" data-hide-game="${slug}">إخفاء اللعبة</button></div>
    <h3>الأقسام داخل اللعبة</h3>
    <div class="admin-list">${sections.map(s=>`<div class="admin-card section-admin-card">
      <div class="row">
        <div class="field"><label>اسم القسم</label><input data-sec="${slug}|${s.slug}" data-sec-field="name" value="${s.name||''}"></div>
        <div class="field"><label>كود القسم</label><input data-sec="${slug}|${s.slug}" data-sec-field="slug" value="${s.slug||''}"></div>
        <div class="field"><label>حالة القسم</label><select data-sec="${slug}|${s.slug}" data-sec-field="status"><option value="available">ظاهر</option><option value="soon">قريبا</option><option value="hidden">مخفي</option></select></div>
        <div class="field"><label>ترتيب القسم</label><input data-sec="${slug}|${s.slug}" data-sec-field="order" value="${s.order||99}" inputmode="numeric"></div>
      </div>
      <div class="admin-actions"><label><input type="checkbox" data-sec="${slug}|${s.slug}" data-sec-field="hot" ${s.hot?'checked':''}> Hot</label><label><input type="checkbox" data-sec="${slug}|${s.slug}" data-sec-field="featured" ${s.featured?'checked':''}> مميز</label><label><input type="checkbox" data-sec="${slug}|${s.slug}" data-sec-field="bestSeller" ${s.bestSeller?'checked':''}> الأكثر طلبا</label><button class="mini" data-add-product="${slug}|${s.slug}">إضافة منتج داخل القسم</button><button class="mini danger" data-delete-section="${slug}|${s.slug}">إخفاء القسم</button></div>
      <div class="admin-list">${products.filter(p=>p.section===s.slug).map(p=>productEditorHtml(p)).join('')||'<div class="notice">لا توجد منتجات داخل هذا القسم.</div>'}</div>
    </div>`).join('')}<button class="ghost-btn" data-new-section="${slug}">إضافة قسم جديد</button></div>`;
  const status=document.querySelector('[data-game-field="status"]'); if(status) status.value=game.status||'available';
  document.querySelectorAll('[data-sec-field="status"]').forEach(sel=>{ const [g,sec]=sel.dataset.sec.split('|'); const s=sections.find(x=>x.slug===sec); if(s) sel.value=s.status||'available'; });
  document.querySelectorAll('[data-prod-field="status"]').forEach(sel=>{ const p=products.find(x=>x.id===sel.dataset.prod); if(p) sel.value=p.status||'available'; });
  document.querySelectorAll('[data-game-field]').forEach(inp=>inp.addEventListener('change',()=>saveGameDraft(slug)));
  document.querySelectorAll('[data-sec-field]').forEach(inp=>inp.addEventListener('change',()=>saveSectionDraft(inp.dataset.sec)));
  document.querySelectorAll('[data-prod-field]').forEach(inp=>inp.addEventListener('change',()=>saveProductDraft(inp.dataset.prod)));
}

function saveSectionDraft(key){
  const [game, oldSlug]=key.split('|');
  local.sections=local.sections||[];
  let s=local.sections.find(x=>x.game===game && x.slug===oldSlug);
  if(!s){
    s={...DEFAULT_CATALOG.sections.find(x=>x.game===game && x.slug===oldSlug)};
    if(!s.slug) return;
    local.sections.push(s);
  }
  document.querySelectorAll(`[data-sec="${key}"]`).forEach(i=>{
    const f=i.dataset.secField;
    if(i.type==='checkbox') s[f]=i.checked;
    else if(f==='order') s[f]=Number(i.value||99);
    else s[f]=i.value.trim();
  });
  saveLocalCatalog(local);
}

function renderOffers(){
  local.offers=local.offers||[];
  view.innerHTML=`<div class="page-title"><div><h1>العروض الحصرية</h1><p>أي عرض هنا يظهر في الصفحة الرئيسية، ويمكن فتح لعبة أو قسم معين عند الضغط عليه.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ</button><button class="ghost-btn" id="addOffer">إضافة عرض</button></div></div>
  <div class="admin-list">${local.offers.map((o,i)=>`<div class="admin-card offer-admin-card"><div class="row"><div class="field"><label>اسم العرض</label><input data-offer="${i}" data-offer-field="title" value="${o.title||''}"></div><div class="field"><label>وصف قصير</label><input data-offer="${i}" data-offer-field="subtitle" value="${o.subtitle||''}"></div><div class="field"><label>اللعبة التي يفتحها</label><input data-offer="${i}" data-offer-field="game" value="${o.game||'pubg'}"></div><div class="field"><label>القسم داخل اللعبة</label><input data-offer="${i}" data-offer-field="section" value="${o.section||''}"></div></div><div class="row"><div class="field"><label>صورة/بانر العرض - أفضل مقاس 1200x420</label><input data-offer="${i}" data-offer-field="image" value="${o.image||''}"></div><div class="field"><label>ترتيب الظهور</label><input data-offer="${i}" data-offer-field="order" value="${o.order||99}" inputmode="numeric"></div><div class="field"><label>مكان الظهور</label><select data-offer="${i}" data-offer-field="placement"><option value="home">الرئيسية فقط</option><option value="game">داخل اللعبة فقط</option><option value="both">الرئيسية واللعبة</option></select></div><div class="field"><label>شارة الخصم</label><input data-offer="${i}" data-offer-field="discountBadge" value="${o.discountBadge||''}" placeholder="مثال: خصم 20%"></div></div><div class="row"><div class="field"><label>يبدأ في</label><input data-offer="${i}" data-offer-field="startsAt" value="${o.startsAt||''}" placeholder="2026-06-03 10:00"></div><div class="field"><label>ينتهي في</label><input data-offer="${i}" data-offer-field="endsAt" value="${o.endsAt||''}" placeholder="2026-06-10 23:59"></div><div class="field"><label>نص زر العرض</label><input data-offer="${i}" data-offer-field="cta" value="${o.cta||'افتح العرض'}"></div></div><div class="admin-actions"><label><input type="checkbox" data-offer="${i}" data-offer-field="active" ${o.active!==false?'checked':''}> ظاهر</label><label><input type="checkbox" data-offer="${i}" data-offer-field="hot" ${o.hot?'checked':''}> Hot</label><button class="mini danger" data-delete-offer="${i}">حذف العرض</button></div></div>`).join('') || '<div class="notice">لا توجد عروض مخصصة.</div>'}</div>`;
  document.querySelectorAll('[data-offer-field="placement"]').forEach(sel=>{ const o=local.offers[Number(sel.dataset.offer)]; sel.value=o.placement||'home'; });
  document.querySelectorAll('[data-offer-field]').forEach(i=>i.addEventListener('change',()=>{const o=local.offers[Number(i.dataset.offer)]; const f=i.dataset.offerField; if(i.type==='checkbox') o[f]=i.checked; else if(f==='order') o[f]=Number(i.value||99); else o[f]=i.value.trim(); saveLocalCatalog(local);}));
}

function renderCoupons(){
  local.coupons = local.coupons || [];
  view.innerHTML = `<div class="page-title"><div><h1>الكوبونات</h1><p>حدد الكود، نوع الخصم، الحد الأدنى، وهل يعمل على كل المنتجات أو منتجات محددة.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ</button><button class="ghost-btn" id="addCoupon">إضافة كوبون</button></div></div>
  <div class="admin-list">${local.coupons.map((c,i)=>`<div class="admin-card"><div class="row">
    <div class="field"><label>كود الخصم</label><input data-coupon="${i}" data-coupon-field="code" placeholder="MOBA10" value="${c.code||''}"></div>
    <div class="field"><label>نوع الخصم</label><select data-coupon="${i}" data-coupon-field="type"><option value="fixed">مبلغ ثابت</option><option value="percent">نسبة %</option></select></div>
    <div class="field"><label>قيمة الخصم</label><input data-coupon="${i}" data-coupon-field="value" inputmode="numeric" value="${c.value||0}"></div>
    <div class="field"><label>حد أدنى للطلب</label><input data-coupon="${i}" data-coupon-field="min" inputmode="numeric" value="${c.min||0}"></div>
  </div><div class="field"><label>منتجات محددة للكوبون - اتركها فاضية لكل المنتجات</label><input data-coupon="${i}" data-coupon-field="productsText" value="${Array.isArray(c.products)?c.products.join(', '):''}" placeholder="UC 660, عضوية شهرية"></div>
  <div class="admin-actions"><label><input type="checkbox" data-coupon="${i}" data-coupon-field="active" ${c.active!==false?'checked':''}> الكوبون شغال</label><button class="mini danger" data-delete-coupon="${i}">حذف</button></div></div>`).join('') || '<div class="notice">لا توجد كوبونات.</div>'}</div>`;
  document.querySelectorAll('[data-coupon-field]').forEach(inp=>{
    const c=local.coupons[Number(inp.dataset.coupon)];
    if(inp.dataset.couponField==='type') inp.value=c.type||'fixed';
    inp.addEventListener('change',()=>{const f=inp.dataset.couponField; if(f==='productsText') c.products=splitLines(inp.value); else c[f]=inp.type==='checkbox'?inp.checked:(['value','min'].includes(f)?Number(inp.value||0):String(inp.value||'').trim().toUpperCase()); saveLocalCatalog(local);});
  });
}

function renderSecurity(){
  const s = local.security || {};
  view.innerHTML = `<div class="page-title"><div><h1>حالة الموقع والحظر</h1><p>تحكم في استقبال الطلبات، الرسالة الظاهرة للعميل، والقوائم المحظورة.</p></div><button class="primary" id="saveCatalog">حفظ</button></div>
  <div class="row">
    <div class="field"><label>حالة الموقع</label><select id="storeStatus"><option value="available">متاح - تنفيذ طبيعي وسريع</option><option value="busy">مزدحم - الطلبات تعمل مع تأخير بسيط</option><option value="closed">مغلق - يمكن عمل الطلب وينفذ في مواعيد العمل</option><option value="maintenance">صيانة - إيقاف تنفيذ الطلبات</option></select></div>
    <div class="field"><label>رسالة الحالة للعميل</label><input id="storeMessage" value="${s.store_message||''}" placeholder="مثال: ضغط بسيط، التنفيذ قد يتأخر شوية"></div>
    <div class="field"><label>مواعيد العمل</label><input id="workHours" value="${s.work_hours||'يوميا من 12 ظهرا إلى 2 صباحا'}"></div>
  </div>
  <div class="row">
    <div class="field"><label>IP محظورة - كل IP في سطر</label><textarea id="blacklistIps" rows="6">${(s.blacklist_ips||[]).join('\n')}</textarea></div>
    <div class="field"><label>Device IDs محظورة - كل جهاز في سطر</label><textarea id="blacklistDevices" rows="6">${(s.blacklist_device_ids||[]).join('\n')}</textarea></div>
    <div class="field"><label>أرقام موبيل محظورة - كل رقم في سطر</label><textarea id="blacklistPhones" rows="6">${(s.blacklist_phones||[]).join('\n')}</textarea></div>
    <div class="field"><label>ID حسابات محظورة - كل ID في سطر</label><textarea id="blacklistPubgIds" rows="6">${(s.blacklist_pubg_ids||[]).join('\n')}</textarea></div>
  </div>
  <div class="notice warn">الحظر فعلي عند تنفيذ الطلب. لو العميل محظور برقم أو IP أو Device لن يقدر ينفذ أوردر جديد.</div>`;
  document.querySelector('#storeStatus').value=s.store_status||'available';
  ['storeStatus','storeMessage','workHours','blacklistIps','blacklistDevices','blacklistPhones','blacklistPubgIds'].forEach(id=>document.querySelector('#'+id).addEventListener('change',()=>{
    local.security={store_status:document.querySelector('#storeStatus').value,store_message:document.querySelector('#storeMessage').value,work_hours:document.querySelector('#workHours').value,blacklist_ips:splitLines(document.querySelector('#blacklistIps').value),blacklist_device_ids:splitLines(document.querySelector('#blacklistDevices').value),blacklist_phones:splitLines(document.querySelector('#blacklistPhones').value),blacklist_pubg_ids:splitLines(document.querySelector('#blacklistPubgIds').value)};
    saveLocalCatalog(local);
  }));
}

function renderReports(){
  view.innerHTML = `<div class="page-title"><div><h1>التقارير</h1><p>راجع مبيعات اليوم أو الأسبوع أو الشهر، أو اختار يوم محدد.</p></div><button class="primary" id="loadReports">عرض التقرير</button></div>
  <div class="row"><div class="field"><label>نوع التقرير</label><select id="reportRange"><option value="1">اليوم</option><option value="7">آخر أسبوع</option><option value="30">آخر شهر</option><option value="custom">فترة مخصصة</option></select></div><div class="field"><label>من تاريخ</label><input id="reportFrom" type="date"></div><div class="field"><label>إلى تاريخ</label><input id="reportTo" type="date"></div></div>
  <div id="reportsBox" class="admin-list"><div class="message">اضغط عرض التقرير.</div></div>`;
}

async function loadReports(){
  const box=document.querySelector('#reportsBox'); box.innerHTML='<div class="message">جاري حساب التقرير...</div>';
  try{
    const d=await api('/api/admin-orders?limit=150'); const orders=d.orders||[];
    const range=document.querySelector('#reportRange')?.value||'1';
    let list=orders;
    if(range==='custom'){
      const from=document.querySelector('#reportFrom')?.value;
      const to=document.querySelector('#reportTo')?.value;
      list=orders.filter(o=>{const d=String(o.created_at||'').slice(0,10); return (!from||d>=from)&&(!to||d<=to);});
    }else{
      const days=Number(range||1); const now=Date.now();
      list=orders.filter(o=>now-new Date(o.created_at||0).getTime()<=days*86400000);
    }
    const byStatus={}; list.forEach(o=>{byStatus[o.status||'pending']=(byStatus[o.status||'pending']||0)+1;});
    box.innerHTML=`<div class="summary-grid"><div class="summary-box"><b>${list.length}</b><span>طلبات</span></div><div class="summary-box"><b>${money(list.reduce((s,o)=>s+Number(o.total||0),0))}</b><span>إجمالي</span></div><div class="summary-box"><b>${Object.keys(byStatus).length}</b><span>حالات مختلفة</span></div></div>
    <div class="admin-list">${Object.entries(byStatus).map(([k,v])=>`<div class="admin-card"><b>${k}</b><span>${v} طلب</span></div>`).join('') || '<div class="notice">لا توجد بيانات للفترة.</div>'}</div>`;
  }catch(e){box.innerHTML=`<div class="message err">${e.message}</div>`;}
}

function renderPayments(){
  const p=local.payment||{};
  p.instapay=p.instapay||{}; p.wallet=p.wallet||{};
  view.innerHTML=`<div class="page-title"><div><h1>بيانات الدفع</h1><p>أي تغيير هنا يظهر في صفحة الدفع وفرعون، ويتسجل مع الطلب.</p></div><button class="primary" id="saveCatalog">حفظ</button></div>
  <div class="admin-card"><h2>InstaPay</h2><div class="row">
    <div class="field"><label>الحالة</label><select data-pay="instapay" data-pay-field="status"><option value="available">متاح</option><option value="maintenance">صيانة</option><option value="disabled">متوقف</option></select></div>
    <div class="field"><label>User</label><input data-pay="instapay" data-pay-field="user" value="${p.instapay.user||'mofr3oon1'}"></div>
    <div class="field"><label>رقم الهاتف</label><input data-pay="instapay" data-pay-field="phone" value="${p.instapay.phone||'01061707294'}"></div>
    <div class="field"><label>اسم المستلم</label><input data-pay="instapay" data-pay-field="name" value="${p.instapay.name||'مؤمن'}"></div>
  </div><div class="field"><label>رابط الدفع</label><input data-pay="instapay" data-pay-field="link" value="${p.instapay.link||'https://ipn.eg/S/mofr3oon1/instapay/3ALZfx'}"></div><div class="field"><label>رسالة تظهر للعميل</label><textarea data-pay="instapay" data-pay-field="message" rows="3">${p.instapay.message||'حوّل على InstaPay وبعدها ارفع السكرين'}</textarea></div><label><input type="checkbox" data-pay="instapay" data-pay-field="enabled" ${p.instapay.enabled!==false?'checked':''}> طريقة الدفع مفعلة</label></div>
  <div class="admin-card"><h2>محفظة كاش</h2><div class="row">
    <div class="field"><label>الحالة</label><select data-pay="wallet" data-pay-field="status"><option value="available">متاح</option><option value="maintenance">صيانة</option><option value="disabled">متوقف</option></select></div>
    <div class="field"><label>رقم المحفظة</label><input data-pay="wallet" data-pay-field="phone" value="${p.wallet.phone||'01061707294'}"></div>
    <div class="field"><label>اسم المستلم</label><input data-pay="wallet" data-pay-field="name" value="${p.wallet.name||'مؤمن'}"></div>
  </div><div class="field"><label>رسالة تظهر للعميل</label><textarea data-pay="wallet" data-pay-field="message" rows="3">${p.wallet.message||'Vodafone / Orange / Etisalat / WE'}</textarea></div><label><input type="checkbox" data-pay="wallet" data-pay-field="enabled" ${p.wallet.enabled!==false?'checked':''}> طريقة الدفع مفعلة</label></div>`;
  document.querySelector('[data-pay="instapay"][data-pay-field="status"]').value=p.instapay.status||'available';
  document.querySelector('[data-pay="wallet"][data-pay-field="status"]').value=p.wallet.status||'available';
  document.querySelectorAll('[data-pay-field]').forEach(i=>i.addEventListener('change',()=>{local.payment=local.payment||{}; local.payment[i.dataset.pay]=local.payment[i.dataset.pay]||{}; local.payment[i.dataset.pay][i.dataset.payField]=i.type==='checkbox'?i.checked:i.value.trim(); saveLocalCatalog(local);}));
}

function renderHealth(){
  const active=Object.values(settings.visitor_presence||{}).filter(v=>Date.now()-Date.parse(v?.at||0)<2*60*1000).length;
  view.innerHTML=`<div class="page-title"><div><h1>صحة الموقع</h1><p>نظرة سريعة على أهم أجزاء التشغيل.</p></div><button class="primary" id="refreshHealth">تحديث</button></div>
  <div class="summary-grid"><div class="summary-box"><b>${settings.store_status||'available'}</b><span>حالة المتجر</span></div><div class="summary-box"><b>${active}</b><span>زوار الآن</span></div><div class="summary-box"><b>${settings.payment_settings?'OK':'افتراضي'}</b><span>بيانات الدفع</span></div></div>
  <div class="admin-list"><div class="admin-card">استقبال الطلبات: متصل بـ /api/order</div><div class="admin-card">التليجرام: يظهر أي خطأ داخل الطلب raw_data.telegramError لو الإرسال فشل</div><div class="admin-card">الحظر: IP / Device / Phone / ID من إعدادات الأمان</div></div>`;
}

function renderAdminLog(){
  const rows=Object.entries(settings||{}).filter(([k])=>k.startsWith('admin_log_')).map(([k,v])=>({k,...(typeof v==='object'?v:{value:v})})).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,80);
  view.innerHTML=`<div class="page-title"><div><h1>Admin Login</h1><p>محاولات الدخول والـ OTP والـ IP والجهاز.</p></div></div><div class="admin-list">${rows.map(r=>`<div class="admin-card"><b>${r.type||r.k}</b><p>IP: ${r.ip||'-'}</p><p>Device: ${r.deviceId||'-'} | Role: ${r.role||'-'}</p><p>${r.at||''}</p></div>`).join('')||'<div class="notice">لا توجد سجلات دخول محفوظة.</div>'}</div>`;
}

function renderVisitors(){
  const presence=settings.visitor_presence||{};
  const visitors=Object.entries(presence).map(([id,v])=>({id,...v})).filter(v=>Date.now()-Date.parse(v.at||0)<5*60*1000);
  view.innerHTML=`<div class="page-title"><div><h1>الزوار والأجهزة</h1><p>زوار فعليين من آخر 5 دقائق.</p></div><span class="badge" style="border-color:#2ee88c;color:#8fffc2">${visitors.length} زائر الآن</span></div>
  <div class="admin-list">${visitors.map(v=>`<div class="admin-card"><b>${v.page||'site'}</b><p>IP: ${v.ip||'-'}</p><p>Device: ${v.id}</p><p>${v.ua||''}</p><button class="mini danger" data-ban-ip="${v.ip||''}">حظر IP</button><button class="mini danger" data-ban-device="${v.id||''}">حظر Device</button></div>`).join('')||'<div class="notice">لا يوجد زوار نشطين حاليا.</div>'}</div>`;
}

document.addEventListener('click',e=>{
  const bip=e.target.closest('[data-ban-ip]'); if(bip){ if(confirm('حظر هذا IP؟')){ local.security=local.security||{}; local.security.blacklist_ips=Array.from(new Set([...(local.security.blacklist_ips||[]),bip.dataset.banIp].filter(x=>x&&x!=='-'))); saveSettings(); } return; }
  const bd=e.target.closest('[data-ban-device]'); if(bd){ if(confirm('حظر هذا الجهاز؟')){ local.security=local.security||{}; local.security.blacklist_device_ids=Array.from(new Set([...(local.security.blacklist_device_ids||[]),bd.dataset.banDevice].filter(x=>x&&x!=='-'))); saveSettings(); } return; }
  const bid=e.target.closest('[data-ban-id]'); if(bid){ if(confirm('حظر هذا ID؟')){ local.security=local.security||{}; local.security.blacklist_pubg_ids=Array.from(new Set([...(local.security.blacklist_pubg_ids||[]),bid.dataset.banId].filter(x=>x&&x!=='-'))); saveSettings(); } return; }
  const dof=e.target.closest('[data-delete-offer]'); if(dof){ if(confirm('حذف العرض من الصفحة الرئيسية؟')){ local.offers.splice(Number(dof.dataset.deleteOffer),1); saveLocalCatalog(local); renderOffers(); } return; }
  const dp=e.target.closest('[data-delete-product]'); if(dp){ if(confirm('إخفاء المنتج من الموقع؟')){ const id=dp.dataset.deleteProduct; let p=(local.products||[]).find(x=>x.id===id); if(!p){ p={...DEFAULT_CATALOG.products.find(x=>x.id===id)}; local.products=[...(local.products||[]),p]; } if(p){p.status='hidden'; saveLocalCatalog(local); renderCatalog();} } return; }
  const ds=e.target.closest('[data-delete-section]'); if(ds){ if(confirm('إخفاء القسم وكل منتجاته من العرض؟')){ const [g,sid]=ds.dataset.deleteSection.split('|'); local.sections=local.sections||[]; let s=local.sections.find(x=>x.game===g&&x.slug===sid); if(!s){s={...DEFAULT_CATALOG.sections.find(x=>x.game===g&&x.slug===sid)}; local.sections.push(s);} s.status='hidden'; saveLocalCatalog(local); renderCatalog(); } return; }
  const hg=e.target.closest('[data-hide-game]'); if(hg){ if(confirm('إخفاء اللعبة من الصفحة الرئيسية؟')){ const slug=hg.dataset.hideGame; let g=(local.games||[]).find(x=>x.slug===slug); if(!g){g={...DEFAULT_CATALOG.games.find(x=>x.slug===slug)}; local.games=[...(local.games||[]),g];} g.status='hidden'; saveLocalCatalog(local); renderCatalog(); } return; }
  if(e.target.id==='loginBtn') login();
  if(e.target.id==='otpBtn') verifyOtp();
  const tb=e.target.closest('[data-tab]'); if(tb){tab=tb.dataset.tab; render();}
  if(e.target.id==='refreshOrders') renderOrders();
  if(e.target.id==='refreshHealth'){ loadSettings().then(()=>renderHealth()); return; }
  if(e.target.id==='refreshVisitors'){ loadSettings().then(()=>renderVisitors()); return; }
  if(e.target.id==='refreshAdminLog'){ loadSettings().then(()=>renderAdminLog()); return; }
  if(e.target.id==='saveCatalog') saveSettings();
  if(e.target.id==='addGame') addGame();
  if(e.target.id==='addOffer'){ local.offers=[...(local.offers||[]),{id:'offer_'+Date.now(),title:'عرض جديد',subtitle:'عرض مميز',game:'pubg',image:'/assets/game-covers/pubg-new.webp',active:true,order:99}]; renderOffers(); }
  if(e.target.id==='addCoupon'){ local.coupons=[...(local.coupons||[]),{code:'NEWCODE',type:'fixed',value:10,min:0,active:true}]; renderCoupons(); }
  const dc=e.target.closest('[data-delete-coupon]'); if(dc){ if(confirm('حذف الكوبون؟')){ local.coupons.splice(Number(dc.dataset.deleteCoupon),1); saveLocalCatalog(local); renderCoupons(); } }
  if(e.target.id==='loadReports') loadReports();
  if(e.target.id==='loadArchive') loadArchive();
  const eg=e.target.closest('[data-edit-game]'); if(eg) editGame(eg.dataset.editGame);
  const ns=e.target.closest('[data-new-section]'); if(ns) addSection(ns.dataset.newSection);
  const ap=e.target.closest('[data-add-product]'); if(ap){const [g,s]=ap.dataset.addProduct.split('|'); addProduct(g,s);}
  const az=e.target.closest('[data-add-zone]'); if(az){ const slug=az.dataset.addZone; let g=(local.games||[]).find(x=>x.slug===slug); if(!g){g={...DEFAULT_CATALOG.games.find(x=>x.slug===slug)}; local.games=[...(local.games||[]),g];} g.fields=[{key:'zoneId',label:'Zone ID',placeholder:'اكتب ID الزون',required:true,type:'number'}]; saveLocalCatalog(local); toast('تم إضافة خانة Zone'); editGame(slug); }
  const status=e.target.closest('[data-status]'); if(status) updateOrder(status.closest('[data-order]'), status.dataset.status, status.dataset.note);
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-upload-game]')) uploadGameImage(e.target);
  if(e.target.matches('[data-upload-brand]')) uploadBrandImage(e.target);
});
document.addEventListener('keydown',e=>{
  if(e.key !== 'Enter') return;
  if(!document.querySelector('#loginBox')?.hidden && !document.querySelector('#credentialsStep')?.hidden){ e.preventDefault(); login(); }
  else if(!document.querySelector('#otpStep')?.hidden){ e.preventDefault(); verifyOtp(); }
});
checkLogin();
