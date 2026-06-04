import { DEFAULT_CATALOG, readLocalCatalog, saveLocalCatalog } from './catalog.js';
import { money, toast } from './store.js';

let tab='orders';
let settings={};
let local=readLocalCatalog();
let loginChallenge=null;
let loginRole='owner';
let loginUser='';
let currentAdmin=null;
const view=document.querySelector('#adminView');
const content=document.querySelector('#adminContent');
const loginBox=document.querySelector('#loginBox');
const $=(s,root=document)=>root.querySelector(s);
function escAdmin(v){ return String(v ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
let adminOrdersCache=[];
let adminOrderFilters={q:'',status:'all',game:'all',payment:'all',late:'all'};

async function api(path, opts={}){
  const r=await fetch(path,{headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});
  const d=await r.json().catch(()=>({ok:false,error:'رد غير مفهوم'}));
  if(!d.ok) throw new Error(d.error||'حدث خطأ');
  return d;
}
async function checkLogin(){
  try{ const d=await api('/api/admin-login'); if(d.authenticated){currentAdmin=d.session||null; loginUser=currentAdmin?.username||loginUser; loginRole=currentAdmin?.role||loginRole; content.hidden=false; loginBox.hidden=true; loginBox.style.display='none'; await loadSettings(); render();} }catch{}
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
    currentAdmin=d.session||{username:loginUser,role:d.role||loginRole};
    content.hidden=false; loginBox.hidden=true; loginBox.style.display='none'; await loadSettings(); render();
  }
  catch(e){ toast(e.message,'err'); }
}
async function verifyOtp(){
  try{
    const d=await api('/api/admin-login',{method:'POST',body:JSON.stringify({username:loginUser,challenge:loginChallenge,otp:document.querySelector('#adminOtp').value.trim(),role:loginRole,trustDevice:document.querySelector('#trustAdminDevice')?.checked!==false,deviceId:localStorage.getItem('moba_device_id')||'admin'})});
    currentAdmin=d.session||{username:loginUser,role:loginRole};
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
      support_phone: settings.support_phone || '201061707294',
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
    const payload={settings:{game_settings,dynamic_sections:local.sections||[],dynamic_products:local.products||[],exclusive_offer:{items:local.offers||[]},brand_settings:local.brand||{},coupon_rules:local.coupons||[],payment_settings:local.payment||{},store_status:local.security?.store_status||'available',store_message:local.security?.store_message||'',work_hours:local.security?.work_hours||'',support_phone:local.security?.support_phone||'201061707294',blacklist_ips:local.security?.blacklist_ips||[],blacklist_device_ids:local.security?.blacklist_device_ids||[],blacklist_phones:local.security?.blacklist_phones||[],blacklist_pubg_ids:local.security?.blacklist_pubg_ids||[]}};
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
  if(tab==='reviews') return renderAdminReviews();
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
    view.innerHTML=`<div class="page-title"><div><h1>الطلبات</h1><p>${d.meta?.count||0} طلب | المستخدم: ${currentAdmin?.username||loginUser||'-'} | الصلاحية: ${currentAdmin?.role||loginRole||'-'}</p></div><button class="primary" id="refreshOrders">تحديث</button></div><div class="orders-list">${(d.orders||[]).map(orderHtmlCompact).join('')||'<div class="notice">لا توجد طلبات.</div>'}</div>`;
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
    <summary><b>${o.order_code||o.id}</b><span>${o.phone||'-'}</span><span>${money(o.total)}</span><span class="badge">${o.status_text||o.status}</span><small>المستلم: ${o.claimed_by_name||o.handler||'-'}</small></summary>
    <div class="admin-card order-meta"><b>البيانات</b><p>الدفع: ${o.payment_method||'-'} | الوقت: ${o.created_at||'-'}</p><p>المستلم: ${o.claimed_by_name||o.handler||'-'} | آخر تعديل: ${o.last_status_by||'-'}</p><p>IP: ${ip} | Device: ${dev}</p></div>
    <div class="admin-card">${items}</div>
    ${o.telegram_photo_file_id?`<div class="admin-card"><img src="/api/admin-orders?screenshot=${encodeURIComponent(o.telegram_photo_file_id)}" style="max-width:100%;border-radius:14px" alt="screenshot"></div>`:''}
    <textarea class="order-note" placeholder="ملاحظة أو سبب المشكلة للعميل" rows="2" style="width:100%;margin-top:10px"></textarea>
    <div class="order-actions">
      <button class="st-claimed" data-status="claimed">استلام</button>
      <button class="st-pending" data-status="pending" data-note="سحب الاستلام من المسؤول الحالي">سحب الاستلام</button>
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
  const gameMap=new Map();
  [...DEFAULT_CATALOG.games, ...(local.games||[])].forEach(g=>{ if(g?.slug) gameMap.set(g.slug,{...(gameMap.get(g.slug)||{}),...g}); });
  const sectionMap=new Map();
  [...DEFAULT_CATALOG.sections, ...(local.sections||[])].forEach(s=>{ if(s?.game&&s?.slug) sectionMap.set(`${s.game}|${s.slug}`,{...(sectionMap.get(`${s.game}|${s.slug}`)||{}),...s}); });
  const productMap=new Map();
  [...DEFAULT_CATALOG.products, ...(local.products||[])].forEach(p=>{ if(p?.id) productMap.set(p.id,{...(productMap.get(p.id)||{}),...p}); });
  const games=[...gameMap.values()].filter(g=>g.status!=='hidden').sort((a,b)=>Number(a.order||99)-Number(b.order||99));
  const sections=[...sectionMap.values()].filter(s=>s.status!=='hidden').sort((a,b)=>Number(a.order||99)-Number(b.order||99));
  const products=[...productMap.values()].filter(p=>p.status!=='hidden').sort((a,b)=>Number(a.order||99)-Number(b.order||99));
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
      <div class="field"><label>رفع صورة المنتج من جهازك</label><input type="file" accept="image/*" data-upload-product="${p.id}"><small>أفضل مقاس: 800x450 WebP أو PNG</small></div>
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

function offerGameOptions(selected){
  const c=combinedCatalog();
  return c.games.map(g=>`<option value="${g.slug}" ${g.slug===selected?'selected':''}>${g.name}</option>`).join('');
}
function offerSectionOptions(game, selected){
  const c=combinedCatalog();
  return `<option value="">بدون قسم محدد</option>` + c.sections.filter(s=>s.game===game).map(s=>`<option value="${s.slug}" ${s.slug===selected?'selected':''}>${s.name}</option>`).join('');
}
function offerProductOptions(game, selected=[]){
  const c=combinedCatalog();
  const ids=Array.isArray(selected)?selected:[];
  return c.products.filter(p=>p.game===game).map(p=>`<option value="${p.id}" ${ids.includes(p.id)?'selected':''}>${p.name} - ${money(p.salePrice||p.price||0)}</option>`).join('');
}

function renderOffers(){
  local.offers=local.offers||[];
  view.innerHTML=`<div class="page-title"><div><h1>العروض الحصرية</h1><p>أي عرض هنا يظهر في الصفحة الرئيسية، ويمكن فتح لعبة أو قسم معين عند الضغط عليه.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ</button><button class="ghost-btn" id="addOffer">إضافة عرض</button></div></div>
  <div class="admin-list">${local.offers.map((o,i)=>`<div class="admin-card offer-admin-card"><div class="row"><div class="field"><label>اسم العرض</label><input data-offer="${i}" data-offer-field="title" value="${o.title||''}"></div><div class="field"><label>وصف قصير</label><input data-offer="${i}" data-offer-field="subtitle" value="${o.subtitle||''}"></div><div class="field"><label>اللعبة التي يفتحها</label><input data-offer="${i}" data-offer-field="game" value="${o.game||'pubg'}"></div><div class="field"><label>القسم داخل اللعبة</label><input data-offer="${i}" data-offer-field="section" value="${o.section||''}"></div></div><div class="row"><div class="field"><label>صورة/بانر العرض - أفضل مقاس 1200x420</label><input data-offer="${i}" data-offer-field="image" value="${o.image||''}"></div><div class="field"><label>ترتيب الظهور</label><input data-offer="${i}" data-offer-field="order" value="${o.order||99}" inputmode="numeric"></div><div class="field"><label>مكان الظهور</label><select data-offer="${i}" data-offer-field="placement"><option value="home">الرئيسية فقط</option><option value="game">داخل اللعبة فقط</option><option value="both">الرئيسية واللعبة</option></select></div><div class="field"><label>شارة الخصم</label><input data-offer="${i}" data-offer-field="discountBadge" value="${o.discountBadge||''}" placeholder="مثال: خصم 20%"></div></div><div class="row"><div class="field"><label>يبدأ في</label><input data-offer="${i}" data-offer-field="startsAt" value="${o.startsAt||''}" placeholder="2026-06-03 10:00"></div><div class="field"><label>ينتهي في</label><input data-offer="${i}" data-offer-field="endsAt" value="${o.endsAt||''}" placeholder="2026-06-10 23:59"></div><div class="field"><label>نص زر العرض</label><input data-offer="${i}" data-offer-field="cta" value="${o.cta||'افتح العرض'}"></div></div><div class="admin-actions"><label><input type="checkbox" data-offer="${i}" data-offer-field="active" ${o.active!==false?'checked':''}> ظاهر</label><label><input type="checkbox" data-offer="${i}" data-offer-field="hot" ${o.hot?'checked':''}> Hot</label><button class="mini danger" data-delete-offer="${i}">حذف العرض</button></div></div>`).join('') || '<div class="notice">لا توجد عروض مخصصة.</div>'}</div>`;
  document.querySelectorAll('.offer-admin-card').forEach((card,i)=>{
    const o=local.offers[i]||{};
    card.insertAdjacentHTML('beforeend', `<div class="row offer-smart-controls"><div class="field"><label>اختيار اللعبة من الأقسام الموجودة</label><select data-offer="${i}" data-offer-field="gameSelect">${offerGameOptions(o.game||'pubg')}</select></div><div class="field"><label>اختيار القسم داخل اللعبة</label><select data-offer="${i}" data-offer-field="sectionSelect">${offerSectionOptions(o.game||'pubg', o.section||'')}</select></div><div class="field"><label>مدة العرض السريعة</label><div class="row compact-row"><input data-offer="${i}" data-offer-field="durationHours" inputmode="numeric" placeholder="ساعات"><input data-offer="${i}" data-offer-field="durationMinutes" inputmode="numeric" placeholder="دقائق"></div><small>لو كتبت مدة هنا هيتحسب وقت انتهاء العرض تلقائي.</small></div></div><div class="field"><label>اختار منتجات العرض من نفس اللعبة</label><select multiple size="5" data-offer="${i}" data-offer-field="productIdsSelect">${offerProductOptions(o.game||'pubg', o.productIds||[])}</select><small>اضغط Ctrl لاختيار أكتر من منتج على الكمبيوتر.</small></div>`);
    card.insertAdjacentHTML('beforeend', `<div class="field"><label>منتجات العرض - اكتب ID المنتجات وافصل بينها بفاصلة</label><input data-offer="${i}" data-offer-field="productIdsText" value="${Array.isArray(o.productIds)?o.productIds.join(', '):(o.productIds||'')}" placeholder="مثال: pubg_660, pubg_1800"></div>`);
    card.insertAdjacentHTML('beforeend', `<div class="field"><label>رفع صورة العرض من جهازك</label><input type="file" accept="image/*" data-upload-offer="${i}"><small>أفضل مقاس: 1200x420</small></div>`);
  });
  document.querySelectorAll('[data-offer-field="placement"]').forEach(sel=>{ const o=local.offers[Number(sel.dataset.offer)]; sel.value=o.placement||'home'; });
  document.querySelectorAll('[data-offer-field]').forEach(i=>i.addEventListener('change',()=>{const o=local.offers[Number(i.dataset.offer)]; const f=i.dataset.offerField; if(i.type==='checkbox') o[f]=i.checked; else if(f==='order') o[f]=Number(i.value||99); else if(f==='gameSelect'){ o.game=i.value; o.section=''; o.productIds=[]; saveLocalCatalog(local); renderOffers(); return; } else if(f==='sectionSelect') o.section=i.value; else if(f==='productIdsSelect') o.productIds=Array.from(i.selectedOptions).map(x=>x.value); else if(f==='productIdsText') o.productIds=String(i.value||'').split(',').map(x=>x.trim()).filter(Boolean); else if(f==='durationHours'||f==='durationMinutes'){ const card=i.closest('.offer-admin-card'); const h=Number(card.querySelector('[data-offer-field="durationHours"]')?.value||0); const m=Number(card.querySelector('[data-offer-field="durationMinutes"]')?.value||0); if(h||m){ o.endsAt=new Date(Date.now()+((h*60)+m)*60000).toISOString().slice(0,16); } } else o[f]=i.value.trim(); saveLocalCatalog(local);}));
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

async function uploadOfferImage(input){
  const file=input.files?.[0]; if(!file) return;
  const idx=Number(input.dataset.uploadOffer);
  local.offers=local.offers||[];
  local.offers[idx]=local.offers[idx]||{};
  local.offers[idx].image=await readFileAsDataUrl(file);
  saveLocalCatalog(local);
  toast('تم رفع صورة العرض');
  renderOffers();
}

async function uploadProductImage(input){
  const file=input.files?.[0]; if(!file) return;
  const id=input.dataset.uploadProduct;
  local.products=local.products||[];
  let p=local.products.find(x=>x.id===id);
  if(!p){
    p={...DEFAULT_CATALOG.products.find(x=>x.id===id)};
    if(!p.id) return toast('المنتج غير موجود', 'err');
    local.products.push(p);
  }
  p.image=await readFileAsDataUrl(file);
  saveLocalCatalog(local);
  toast('تم رفع صورة المنتج');
  renderCatalog();
}

async function renderAdminReviews(){
  view.innerHTML='<div class="message">جاري تحميل الآراء...</div>';
  try{
    const d=await api('/api/reviews?admin=1');
    const rows=d.reviews||[];
    view.innerHTML=`<div class="page-title"><div><h1>آراء العملاء</h1><p>وافق أو ارفض أي تقييم قبل ظهوره في الموقع، واكتب رد باسم MOBA SHOP.</p></div><button class="primary" id="refreshReviews">تحديث</button></div>
    <div class="admin-list">${rows.map(r=>`<article class="admin-card review-admin-card" data-review="${r.id}">
      <div class="page-title"><div><h3>${r.customer_name}</h3><p>${'★'.repeat(Number(r.rating||5))} | ${r.created_at||''}</p></div><span class="badge">${r.is_approved?'ظاهر':'في المراجعة'}</span></div>
      <p>${r.review_text}</p>
      <div class="field"><label>رد MOBA SHOP</label><textarea class="review-reply" rows="2">${r.store_reply||''}</textarea></div>
      <div class="admin-actions"><button class="mini success" data-review-action="approve">قبول وظهور</button><button class="mini" data-review-action="reply">حفظ الرد</button><button class="mini danger" data-review-action="reject">رفض/إخفاء</button></div>
    </article>`).join('')||'<div class="notice">لا توجد آراء حتى الآن.</div>'}</div>`;
  }catch(e){ view.innerHTML=`<div class="message err">${e.message}</div>`; }
}

async function updateReview(card, action){
  try{
    await api('/api/reviews',{method:'PATCH',body:JSON.stringify({id:card.dataset.review,action,store_reply:card.querySelector('.review-reply')?.value||''})});
    toast('تم تحديث الرأي');
    renderAdminReviews();
  }catch(e){ toast(e.message,'err'); }
}

function renderSecurity(){
  const s = local.security || {};
  view.innerHTML = `<div class="page-title"><div><h1>حالة الموقع والحظر</h1><p>تحكم في استقبال الطلبات، الرسالة الظاهرة للعميل، والقوائم المحظورة.</p></div><button class="primary" id="saveCatalog">حفظ</button></div>
  <div class="row">
    <div class="field"><label>حالة الموقع</label><select id="storeStatus"><option value="available">متاح - تنفيذ طبيعي وسريع</option><option value="busy">مزدحم - الطلبات تعمل مع تأخير بسيط</option><option value="closed">مغلق - يمكن عمل الطلب وينفذ في مواعيد العمل</option><option value="maintenance">صيانة - إيقاف تنفيذ الطلبات</option></select></div>
    <div class="field"><label>رسالة الحالة للعميل</label><input id="storeMessage" value="${s.store_message||''}" placeholder="مثال: ضغط بسيط، التنفيذ قد يتأخر شوية"></div>
    <div class="field"><label>مواعيد العمل</label><input id="workHours" value="${s.work_hours||'يوميا من 12 ظهرا إلى 2 صباحا'}"></div>
    <div class="field"><label>رقم الدعم WhatsApp بصيغة دولية</label><input id="supportPhone" value="${s.support_phone||'201061707294'}" placeholder="201061707294"></div>
  </div>
  <div class="row">
    <div class="field"><label>IP محظورة - كل IP في سطر</label><textarea id="blacklistIps" rows="6">${(s.blacklist_ips||[]).join('\n')}</textarea></div>
    <div class="field"><label>Device IDs محظورة - كل جهاز في سطر</label><textarea id="blacklistDevices" rows="6">${(s.blacklist_device_ids||[]).join('\n')}</textarea></div>
    <div class="field"><label>أرقام موبيل محظورة - كل رقم في سطر</label><textarea id="blacklistPhones" rows="6">${(s.blacklist_phones||[]).join('\n')}</textarea></div>
    <div class="field"><label>ID حسابات محظورة - كل ID في سطر</label><textarea id="blacklistPubgIds" rows="6">${(s.blacklist_pubg_ids||[]).join('\n')}</textarea></div>
  </div>
  <div class="notice warn">الحظر فعلي عند تنفيذ الطلب. لو العميل محظور برقم أو IP أو Device لن يقدر ينفذ أوردر جديد.</div>`;
  document.querySelector('#storeStatus').value=s.store_status||'available';
  ['storeStatus','storeMessage','workHours','supportPhone','blacklistIps','blacklistDevices','blacklistPhones','blacklistPubgIds'].forEach(id=>document.querySelector('#'+id).addEventListener('change',()=>{
    local.security={store_status:document.querySelector('#storeStatus').value,store_message:document.querySelector('#storeMessage').value,work_hours:document.querySelector('#workHours').value,support_phone:document.querySelector('#supportPhone').value,blacklist_ips:splitLines(document.querySelector('#blacklistIps').value),blacklist_device_ids:splitLines(document.querySelector('#blacklistDevices').value),blacklist_phones:splitLines(document.querySelector('#blacklistPhones').value),blacklist_pubg_ids:splitLines(document.querySelector('#blacklistPubgIds').value)};
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
  view.innerHTML=`<div class="page-title"><div><h1>Admin Login</h1><p>محاولات الدخول والـ OTP والـ IP والجهاز.</p></div></div><div class="admin-list">${rows.map(r=>`<div class="admin-card"><b>${r.type||r.k}</b><p>Username: ${r.username||'-'} | Role: ${r.role||'-'}</p><p>IP: ${r.ip||'-'}</p><p>Device: ${r.deviceId||'-'}</p><p>${r.at||''}</p></div>`).join('')||'<div class="notice">لا توجد سجلات دخول محفوظة.</div>'}</div>`;
}

function renderVisitors(){
  const presence=settings.visitor_presence||{};
  const visitors=Object.entries(presence).map(([id,v])=>({id,...v})).filter(v=>Date.now()-Date.parse(v.at||0)<5*60*1000);
  view.innerHTML=`<div class="page-title"><div><h1>الزوار والأجهزة</h1><p>زوار فعليين من آخر 5 دقائق.</p></div><span class="badge" style="border-color:#2ee88c;color:#8fffc2">${visitors.length} زائر الآن</span></div>
  <div class="admin-list">${visitors.map(v=>`<div class="admin-card"><b>${v.page||'site'}</b><p>IP: ${v.ip||'-'}</p><p>Device: ${v.id}</p><p>${v.ua||''}</p><button class="mini danger" data-ban-ip="${v.ip||''}">حظر IP</button><button class="mini danger" data-ban-device="${v.id||''}">حظر Device</button></div>`).join('')||'<div class="notice">لا يوجد زوار نشطين حاليا.</div>'}</div>`;
}

// V217: safer and more practical admin orders workspace.
function orderGame(o){
  const item=(o.items||[])[0]||{};
  return String(item.game || item.gameSlug || item.game_name || item.gameName || '').trim();
}
function orderAgeMinutes(o){
  return Math.floor((Date.now() - new Date(o.created_at||0).getTime()) / 60000);
}
function filteredAdminOrders(){
  return (adminOrdersCache||[]).filter(o=>{
    const q=adminOrderFilters.q.toLowerCase();
    const text=JSON.stringify([o.id,o.order_code,o.phone,o.payment_method,o.status,o.items,o.note,o.raw_data]).toLowerCase();
    const game=orderGame(o).toLowerCase();
    const pay=String(o.payment_method||'').toLowerCase();
    const age=orderAgeMinutes(o);
    return (!q || text.includes(q)) &&
      (adminOrderFilters.status==='all' || String(o.status)===adminOrderFilters.status) &&
      (adminOrderFilters.game==='all' || game.includes(adminOrderFilters.game.toLowerCase())) &&
      (adminOrderFilters.payment==='all' || pay.includes(adminOrderFilters.payment.toLowerCase())) &&
      (adminOrderFilters.late==='all' || (adminOrderFilters.late==='10' && age>=10) || (adminOrderFilters.late==='30' && age>=30) || (adminOrderFilters.late==='60' && age>=60));
  });
}
function adminSummaryHtml(rows){
  const today=new Date().toISOString().slice(0,10);
  const todayRows=(rows||[]).filter(o=>String(o.created_at||'').slice(0,10)===today);
  const byGame={}; rows.forEach(o=>{const g=orderGame(o)||'غير محدد'; byGame[g]=(byGame[g]||0)+1;});
  const top=Object.entries(byGame).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-';
  return `<div class="summary-grid admin-summary">
    <div class="summary-box"><b>${todayRows.length}</b><span>طلبات اليوم</span></div>
    <div class="summary-box"><b>${rows.filter(o=>o.status==='processing').length}</b><span>قيد التنفيذ</span></div>
    <div class="summary-box"><b>${rows.filter(o=>o.status==='delivered').length}</b><span>مكتملة</span></div>
    <div class="summary-box"><b>${rows.filter(o=>['rejected','cancelled'].includes(o.status)).length}</b><span>مرفوضة/ملغية</span></div>
    <div class="summary-box"><b>${money(todayRows.reduce((s,o)=>s+Number(o.total||0),0))}</b><span>مبيعات اليوم</span></div>
    <div class="summary-box"><b>${escAdmin(top)}</b><span>أكثر لعبة</span></div>
  </div>`;
}
const renderOrdersV217 = async function(){
  view.innerHTML='<div class="message">جاري تحميل الطلبات...</div>';
  try{
    const d=await api('/api/admin-orders?limit=150');
    adminOrdersCache=d.orders||[];
    renderAdminOrdersList();
  }catch(e){ view.innerHTML=`<div class="message err">${escAdmin(e.message)}</div>`; }
}
function renderAdminOrdersList(){
  const rows=filteredAdminOrders();
  const games=[...new Set(adminOrdersCache.map(orderGame).filter(Boolean))];
  const pays=[...new Set(adminOrdersCache.map(o=>String(o.payment_method||'').trim()).filter(Boolean))];
  view.innerHTML=`<div class="page-title"><div><h1>الطلبات</h1><p>${adminOrdersCache.length} طلب | المستخدم: ${escAdmin(currentAdmin?.username||loginUser||'-')} | الصلاحية: ${escAdmin(currentAdmin?.role||loginRole||'-')}</p></div><div class="admin-actions"><button class="primary" id="refreshOrders">تحديث</button><button class="ghost-btn" id="exportOrdersCsv">Export CSV</button></div></div>
    ${adminSummaryHtml(adminOrdersCache)}
    <div class="admin-filters">
      <input id="adminOrderSearch" placeholder="بحث برقم الطلب / رقم العميل / ID" value="${escAdmin(adminOrderFilters.q)}">
      <select id="adminStatusFilter"><option value="all">كل الحالات</option>${['pending','claimed','processing','needs_fix','on_hold','delivered','rejected','cancelled','archived'].map(s=>`<option value="${s}" ${adminOrderFilters.status===s?'selected':''}>${s}</option>`).join('')}</select>
      <select id="adminGameFilter"><option value="all">كل الألعاب</option>${games.map(g=>`<option value="${escAdmin(g)}" ${adminOrderFilters.game===g?'selected':''}>${escAdmin(g)}</option>`).join('')}</select>
      <select id="adminPaymentFilter"><option value="all">كل طرق الدفع</option>${pays.map(p=>`<option value="${escAdmin(p)}" ${adminOrderFilters.payment===p?'selected':''}>${escAdmin(p)}</option>`).join('')}</select>
      <select id="adminLateFilter"><option value="all">كل الأوقات</option><option value="10">أكثر من 10 دقائق</option><option value="30">أكثر من 30 دقيقة</option><option value="60">أكثر من ساعة</option></select>
    </div>
    <div class="orders-list">${rows.map(orderHtmlCompact).join('')||'<div class="notice">لا توجد طلبات مطابقة.</div>'}</div>`;
  const late=$('#adminLateFilter'); if(late) late.value=adminOrderFilters.late;
}
const orderHtmlCompactV217 = function(o){
  const items=(Array.isArray(o.items)?o.items:[]).map(i=>`${escAdmin(i.product)} (${escAdmin(i.qty||1)}) - ID: ${escAdmin(i.pubgId || '-')} - Name: ${escAdmin(i.pubgName || '-')}`).join('<br>');
  const firstId=(Array.isArray(o.items)?o.items:[])[0]?.pubgId||'';
  const ip=o.raw_data?.clientIp||'-';
  const dev=o.raw_data?.deviceId||'-';
  const telegram=o.raw_data?.telegramOk===false?'فشل/معلق':(o.telegram_message_id?'وصل':'غير مؤكد');
  return `<details class="order-card compact-order" data-order="${escAdmin(o.id)}">
    <summary><b>${escAdmin(o.order_code||o.id)}</b><span>${escAdmin(o.phone||'-')}</span><span>${money(o.total)}</span><span class="badge">${escAdmin(o.status_text||o.status)}</span><small>Telegram: ${escAdmin(telegram)}</small></summary>
    <div class="admin-card order-meta"><b>بيانات الطلب</b><p>الدفع: ${escAdmin(o.payment_method||'-')} | الوقت: ${escAdmin(o.created_at||'-')} | العمر: ${orderAgeMinutes(o)} دقيقة</p><p>المستلم: ${escAdmin(o.claimed_by_name||o.handler||'-')} | آخر تعديل: ${escAdmin(o.last_status_by||'-')}</p><p>IP: ${escAdmin(ip)} | Device: ${escAdmin(dev)}</p></div>
    <div class="admin-card">${items || 'لا توجد منتجات'}</div>
    ${o.telegram_photo_file_id?`<div class="admin-card screenshot-card"><img src="/api/admin-orders?screenshot=${encodeURIComponent(o.telegram_photo_file_id)}" alt="screenshot"><a class="ghost-btn" href="/api/admin-orders?screenshot=${encodeURIComponent(o.telegram_photo_file_id)}" target="_blank">فتح كامل</a></div>`:''}
    <div class="admin-card"><b>سجل العميل</b><p>عدد طلبات هذا الرقم داخل القائمة الحالية: ${adminOrdersCache.filter(x=>String(x.phone)===String(o.phone)).length}</p><p>إجمالي مشتريات ظاهرة: ${money(adminOrdersCache.filter(x=>String(x.phone)===String(o.phone)).reduce((s,x)=>s+Number(x.total||0),0))}</p></div>
    <textarea class="order-note" placeholder="ملاحظة أو سبب المشكلة للعميل" rows="2" style="width:100%;margin-top:10px"></textarea>
    <div class="order-actions">
      <button class="mini" data-copy="${escAdmin(firstId)}">نسخ ID</button>
      <button class="mini" data-copy="${escAdmin(o.phone||'')}">نسخ رقم العميل</button>
      <a class="mini" href="https://wa.me/2${escAdmin(String(o.phone||'').replace(/^0/,''))}" target="_blank">واتساب</a>
      <button class="st-claimed" data-status="claimed">استلام</button>
      <button class="st-pending" data-status="pending" data-note="سحب الاستلام من المسؤول الحالي">سحب الاستلام</button>
      <button class="st-processing" data-status="processing">جاري التنفيذ</button>
      <button class="st-delivered" data-status="delivered">تم الشحن</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="السكرين غير واضح. ارفع صورة جديدة يظهر فيها رقم أو اسم التحويل، المبلغ، ووقت التحويل.">سكرين غير واضح</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="ID أو اسم الحساب غير صحيح. اكتب ID واسم الحساب الصحيحين من صفحة متابعة الطلب.">ID غلط</button>
      <button class="st-needs_fix" data-status="needs_fix" data-note="المبلغ المحول ناقص. حول المبلغ المتبقي وارفع سكرين التحويل الجديد من صفحة متابعة الطلب.">المبلغ ناقص</button>
      <button class="st-rejected" data-status="rejected" data-note="لم يتم العثور على التحويل أو بيانات الطلب غير صحيحة.">رفض جاهز</button>
      <button class="st-cancelled" data-status="cancelled">إلغاء</button>
      <button class="st-archived" data-status="archived" data-note="تمت أرشفة الطلب من لوحة الأدمن.">أرشفة</button>
      <button class="danger" data-ban-ip="${escAdmin(ip)}">حظر IP</button>
      <button class="danger" data-ban-device="${escAdmin(dev)}">حظر Device</button>
      <button class="danger" data-ban-id="${escAdmin(firstId)}">حظر ID</button>
    </div>
  </details>`;
}
function exportOrdersCsv(){
  const rows=filteredAdminOrders();
  const header=['order number','date','game','product','customer phone','price','status','payment method'];
  const lines=[header.join(',')];
  rows.forEach(o=>{
    (Array.isArray(o.items)?o.items:[{}]).forEach(i=>{
      lines.push([o.order_code||o.id,o.created_at||'',i.game||orderGame(o),i.product||'',o.phone||'',o.total||0,o.status||'',o.payment_method||''].map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','));
    });
  });
  const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='moba-orders-export.csv'; a.click(); URL.revokeObjectURL(a.href);
}
const _v217RenderHealth = renderHealth;
renderHealth = function(){
  const active=Object.values(settings.visitor_presence||{}).filter(v=>Date.now()-Date.parse(v?.at||0)<2*60*1000).length;
  view.innerHTML=`<div class="page-title"><div><h1>صحة الموقع</h1><p>فحص تشغيل بدون كشف أي أسرار.</p></div><button class="primary" id="refreshHealth">تحديث</button></div>
  <div class="summary-grid">
    <div class="summary-box"><b>${settings.store_status||'available'}</b><span>حالة المتجر</span></div>
    <div class="summary-box"><b>${active}</b><span>زوار الآن</span></div>
    <div class="summary-box"><b>${settings.payment_settings?'OK':'افتراضي'}</b><span>Payment methods configured</span></div>
    <div class="summary-box"><b>OK</b><span>Orders table reachable</span></div>
    <div class="summary-box"><b>${settings.brand_settings?'OK':'Default'}</b><span>Brand settings</span></div>
    <div class="summary-box"><b>Private</b><span>ENV hidden</span></div>
  </div>
  <div class="admin-list"><div class="admin-card">Supabase connected: يظهر من تحميل الطلبات والإعدادات.</div><div class="admin-card">Telegram delivery: يظهر داخل كل طلب باسم Telegram وصل/فشل/غير مؤكد.</div><div class="admin-card">Storage/upload: يتم التحقق عند عرض سكرين الطلب.</div></div>`;
};
const renderAdminReviewsV217 = async function(){
  view.innerHTML='<div class="message">جاري تحميل الآراء...</div>';
  try{
    const d=await api('/api/reviews?admin=1');
    const rows=d.reviews||[];
    view.innerHTML=`<div class="page-title"><div><h1>آراء العملاء</h1><p>وافق أو ارفض أي تقييم قبل ظهوره في الموقع، واكتب رد باسم MOBA SHOP.</p></div><button class="primary" id="refreshReviews">تحديث</button></div>
    <div class="admin-list">${rows.map(r=>`<article class="admin-card review-admin-card" data-review="${escAdmin(r.id)}">
      <div class="page-title"><div><h3>${escAdmin(r.customer_name)}</h3><p>${'★'.repeat(Number(r.rating||5))} | ${escAdmin(r.created_at||'')}</p></div><span class="badge">${r.is_approved?'ظاهر':'في المراجعة'}</span></div>
      <p>${escAdmin(r.review_text)}</p>
      <div class="field"><label>رد MOBA SHOP</label><textarea class="review-reply" rows="2">${escAdmin(r.store_reply||'')}</textarea></div>
      <div class="admin-actions"><button class="mini success" data-review-action="approve">قبول وظهور</button><button class="mini" data-review-action="reply">حفظ الرد</button><button class="mini danger" data-review-action="reject">رفض/إخفاء</button></div>
    </article>`).join('')||'<div class="notice">لا توجد آراء حتى الآن.</div>'}</div>`;
  }catch(e){ view.innerHTML=`<div class="message err">${escAdmin(e.message)}</div>`; }
}
const renderAdminLogV217 = function(){
  const rows=Object.entries(settings||{}).filter(([k])=>k.startsWith('admin_log_')).map(([k,v])=>({k,...(typeof v==='object'?v:{value:v})})).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,100);
  view.innerHTML=`<div class="page-title"><div><h1>Audit Log</h1><p>آخر 100 حركة مهمة داخل لوحة الأدمن.</p></div></div><div class="admin-list">${rows.map(r=>`<div class="admin-card"><b>${escAdmin(r.type||r.k)}</b><p>Username: ${escAdmin(r.username||'-')} | Role: ${escAdmin(r.role||'-')}</p><p>IP: ${escAdmin(r.ip||'-')}</p><p>Device: ${escAdmin(r.deviceId||'-')}</p><p>${escAdmin(r.at||'')}</p><pre>${escAdmin(JSON.stringify(r.details||r,null,2)).slice(0,700)}</pre></div>`).join('')||'<div class="notice">لا توجد سجلات محفوظة.</div>'}</div>`;
}
const renderVisitorsV217 = function(){
  const presence=settings.visitor_presence||{};
  const visitors=Object.entries(presence).map(([id,v])=>({id,...v})).filter(v=>Date.now()-Date.parse(v.at||0)<5*60*1000);
  view.innerHTML=`<div class="page-title"><div><h1>الزوار والأجهزة</h1><p>زوار فعليين من آخر 5 دقائق.</p></div><span class="badge" style="border-color:#2ee88c;color:#8fffc2">${visitors.length} زائر الآن</span></div>
  <div class="admin-list">${visitors.map(v=>`<div class="admin-card"><b>${escAdmin(v.page||'site')}</b><p>IP: ${escAdmin(v.ip||'-')}</p><p>Device: ${escAdmin(v.id)}</p><p>${escAdmin(v.ua||'')}</p><button class="mini danger" data-ban-ip="${escAdmin(v.ip||'')}">حظر IP</button><button class="mini danger" data-ban-device="${escAdmin(v.id||'')}">حظر Device</button></div>`).join('')||'<div class="notice">لا يوجد زوار نشطين حاليا.</div>'}</div>`;
}

renderOrders = renderOrdersV217;
orderHtmlCompact = orderHtmlCompactV217;
renderAdminReviews = renderAdminReviewsV217;
renderAdminLog = renderAdminLogV217;
renderVisitors = renderVisitorsV217;

document.addEventListener('click',e=>{
  if(e.target.id==='logoutBtn'){ api('/api/admin-login',{method:'POST',body:JSON.stringify({action:'logout'})}).catch(()=>null).finally(()=>location.reload()); return; }
  if(e.target.id==='exportOrdersCsv'){ exportOrdersCsv(); return; }
  const copy=e.target.closest('[data-copy]'); if(copy){ navigator.clipboard?.writeText(copy.dataset.copy||''); toast('تم النسخ'); return; }
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
  if(e.target.id==='refreshReviews') renderAdminReviews();
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
  const reviewAction=e.target.closest('[data-review-action]'); if(reviewAction) updateReview(reviewAction.closest('[data-review]'), reviewAction.dataset.reviewAction);
});
document.addEventListener('change',e=>{
  if(e.target.id==='adminOrderSearch' || e.target.id==='adminStatusFilter' || e.target.id==='adminGameFilter' || e.target.id==='adminPaymentFilter' || e.target.id==='adminLateFilter'){
    adminOrderFilters={q:document.querySelector('#adminOrderSearch')?.value||'',status:document.querySelector('#adminStatusFilter')?.value||'all',game:document.querySelector('#adminGameFilter')?.value||'all',payment:document.querySelector('#adminPaymentFilter')?.value||'all',late:document.querySelector('#adminLateFilter')?.value||'all'};
    renderAdminOrdersList();
    return;
  }
  if(e.target.matches('[data-upload-game]')) uploadGameImage(e.target);
  if(e.target.matches('[data-upload-brand]')) uploadBrandImage(e.target);
  if(e.target.matches('[data-upload-offer]')) uploadOfferImage(e.target);
  if(e.target.matches('[data-upload-product]')) uploadProductImage(e.target);
});
document.addEventListener('input',e=>{
  if(e.target.id==='adminOrderSearch'){
    adminOrderFilters.q=e.target.value||'';
    clearTimeout(window.__adminSearchTimer);
    window.__adminSearchTimer=setTimeout(renderAdminOrdersList,120);
  }
});
document.addEventListener('keydown',e=>{
  if(e.key !== 'Enter') return;
  if(!document.querySelector('#loginBox')?.hidden && !document.querySelector('#credentialsStep')?.hidden){ e.preventDefault(); login(); }
  else if(!document.querySelector('#otpStep')?.hidden){ e.preventDefault(); verifyOtp(); }
});
checkLogin();

// V218 launch hardening: compact final admin tools without changing the core workflow.
function isTestOrderV218(o){ return o?.order_type === 'test' || o?.raw_data?.testOrder === true; }
const _v218AdminSummaryHtml = adminSummaryHtml;
adminSummaryHtml = function(rows){
  return _v218AdminSummaryHtml((rows || []).filter(o=>!isTestOrderV218(o)));
};
const _v218OrderHtmlCompact = orderHtmlCompact;
orderHtmlCompact = function(o){
  let html = _v218OrderHtmlCompact(o);
  const first = (Array.isArray(o.items) ? o.items : [])[0] || {};
  const vip = o.vip === true || o.customer_vip === true || o.raw_data?.vip === true;
  const badges = `${isTestOrderV218(o)?'<span class="badge test-badge">TEST</span>':''}${vip?'<span class="badge vip-badge">عميل VIP ⭐</span>':''}${o.raw_data?.storeStatus?`<span class="badge">حالة الموقع وقت الطلب: ${escAdmin(o.raw_data.storeStatus)}</span>`:''}`;
  const controls = `<div class="admin-card launch-tools">
    <div class="admin-actions">${badges || '<span class="badge">أدوات نهائية</span>'}
      <button class="mini" data-vip-toggle="${escAdmin(o.id)}" data-vip="${vip ? '0' : '1'}">${vip ? 'إلغاء VIP' : 'تفعيل VIP'}</button>
    </div>
    <details class="edit-order-panel">
      <summary>تعديل بيانات الطلب</summary>
      <div class="fields-grid">
        <label>رقم العميل<input class="edit-phone" value="${escAdmin(o.phone || '')}" inputmode="tel"></label>
        <label>ID<input class="edit-id" value="${escAdmin(first.pubgId || '')}"></label>
        <label>اسم اللاعب<input class="edit-name" value="${escAdmin(first.pubgName || first.name || '')}"></label>
        <label>ملاحظة داخلية<textarea class="edit-internal-note" rows="2">${escAdmin(o.internal_note || '')}</textarea></label>
      </div>
      <p class="hint">التعديل هنا لا يسمح بتغيير السعر، وأي تعديل يتسجل في Audit Log.</p>
      <button class="primary" data-edit-order-v218="${escAdmin(o.id)}">حفظ تعديل البيانات</button>
    </details>
  </div>`;
  return html.replace('</details>', `${controls}</details>`);
};
const _v218RenderAdminOrdersList = renderAdminOrdersList;
renderAdminOrdersList = function(){
  _v218RenderAdminOrdersList();
  const actions = document.querySelector('.page-title .admin-actions');
  if(actions && !document.getElementById('deleteTestOrders')){
    actions.insertAdjacentHTML('beforeend', `<a class="ghost-btn" href="/?test=1" target="_blank">فتح طلب TEST</a><button class="danger" id="deleteTestOrders">حذف طلبات TEST</button>`);
  }
};
renderHealth = async function(){
  view.innerHTML='<div class="message">جاري فحص صحة الموقع...</div>';
  try{
    const d = await api('/api/admin-health');
    const checks = d.checks || {};
    const missing = d.requiredEnvMissing || [];
    const card = (title, ok, detail='') => `<div class="summary-box ${ok?'health-ok':'health-bad'}"><b>${ok?'OK':'Needs check'}</b><span>${escAdmin(title)}</span>${detail?`<small>${escAdmin(detail)}</small>`:''}</div>`;
    view.innerHTML=`<div class="page-title"><div><h1>Health Check</h1><p>فحص تشغيل بدون كشف أي Tokens أو Secrets.</p></div><button class="primary" id="refreshHealth">تحديث</button></div>
    <div class="summary-grid">
      ${card('Supabase reachable', checks.supabaseReachable, checks.supabaseReachable?'Orders table reachable':'راجع إعدادات Supabase')}
      ${card('Telegram reachable', checks.telegramReachable, checks.telegramConfigured?'Configured':'not configured')}
      ${card('Storage/upload ready', checks.storageReady, 'Telegram screenshot stream / upload check')}
      ${card('Payment methods configured', checks.paymentConfigured, checks.paymentDetail || '')}
      ${card('Required ENV', !missing.length, missing.length ? missing.join(', ') : 'No required ENV missing')}
      ${card('Admin session', true, currentAdmin?.username || loginUser || '-')}
    </div>
    <div class="admin-list">${(d.errorLogs||[]).slice(0,50).map(x=>`<div class="admin-card"><b>${escAdmin(x.type||'error')}</b><p>${escAdmin(x.message||'')}</p><small>${escAdmin(x.at||'')}</small></div>`).join('') || '<div class="notice">لا توجد أخطاء مسجلة حديثا.</div>'}</div>`;
  }catch(e){
    view.innerHTML=`<div class="message err">${escAdmin(e.message || 'تعذر فحص صحة الموقع')}</div>`;
  }
};
document.addEventListener('click', async e=>{
  const vipBtn=e.target.closest('[data-vip-toggle]');
  if(vipBtn){
    try{
      await api('/api/admin-orders',{method:'POST',body:JSON.stringify({action:'set_vip',id:vipBtn.dataset.vipToggle,vip:vipBtn.dataset.vip==='1'})});
      toast('تم تحديث VIP'); renderOrders();
    }catch(err){ toast(err.message || 'تعذر تحديث VIP','err'); }
    return;
  }
  const editBtn=e.target.closest('[data-edit-order-v218]');
  if(editBtn){
    const card=editBtn.closest('[data-order]');
    try{
      await api('/api/admin-orders',{method:'POST',body:JSON.stringify({
        action:'edit_order',
        id:editBtn.dataset.editOrderV218,
        phone:card.querySelector('.edit-phone')?.value || '',
        pubgId:card.querySelector('.edit-id')?.value || '',
        pubgName:card.querySelector('.edit-name')?.value || '',
        internal_note:card.querySelector('.edit-internal-note')?.value || ''
      })});
      toast('تم حفظ تعديل الطلب'); renderOrders();
    }catch(err){ toast(err.message || 'تعذر تعديل الطلب','err'); }
    return;
  }
  if(e.target.id==='deleteTestOrders'){
    const txt=prompt('لحذف كل طلبات TEST اكتب DELETE');
    if(txt !== 'DELETE') return toast('تم إلغاء الحذف');
    try{
      const d=await api('/api/admin-orders',{method:'POST',body:JSON.stringify({action:'delete_test_orders',confirmText:'DELETE'})});
      toast(`تم حذف ${d.count || 0} طلب TEST`); renderOrders();
    }catch(err){ toast(err.message || 'تعذر حذف طلبات TEST','err'); }
  }
});
