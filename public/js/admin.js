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
  try{ const d=await api('/api/admin-login'); if(d.authenticated){content.hidden=false; loginBox.hidden=true; await loadSettings(); render();} }catch{}
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
    content.hidden=false; loginBox.hidden=true; await loadSettings(); render();
  }
  catch(e){ toast(e.message,'err'); }
}
async function verifyOtp(){
  try{
    await api('/api/admin-login',{method:'POST',body:JSON.stringify({username:loginUser,challenge:loginChallenge,otp:document.querySelector('#adminOtp').value.trim(),role:loginRole,deviceId:localStorage.getItem('moba_device_id')||'admin'})});
    content.hidden=false; loginBox.hidden=true; await loadSettings(); render();
  }catch(e){ toast(e.message,'err'); }
}
async function loadSettings(){
  try{ const d=await api('/api/settings?admin=1'); settings=d.settings||{}; }catch{ settings={}; }
  local.brand = local.brand || settings.brand_settings || {};
}
async function saveSettings(){
  try{
    const game_settings={};
    (local.games||[]).forEach(g=>{game_settings[g.slug]=g;});
    const payload={settings:{game_settings,dynamic_sections:local.sections||[],dynamic_products:local.products||[],exclusive_offer:{items:local.offers||[]},brand_settings:local.brand||{}}};
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
  return renderOrders();
}
async function renderOrders(){
  view.innerHTML='<div class="message">جاري تحميل الطلبات...</div>';
  try{
    const d=await api('/api/admin-orders?limit=80');
    view.innerHTML=`<div class="page-title"><div><h1>الطلبات</h1><p>${d.meta?.count||0} طلب</p></div><button class="primary" id="refreshOrders">تحديث</button></div><div class="orders-list">${(d.orders||[]).map(orderHtml).join('')||'<div class="notice">لا توجد طلبات.</div>'}</div>`;
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
function renderCatalog(){
  const c=combinedCatalog();
  view.innerHTML=`<div class="page-title"><div><h1>إدارة الأقسام</h1><p>كل لعبة قسم مستقل، وجواها المنتجات والخانات المطلوبة.</p></div><div class="admin-actions"><button class="primary" id="saveCatalog">حفظ</button><button class="ghost-btn" id="addGame">إضافة لعبة</button></div></div>
    <div class="admin-grid"><aside class="admin-list">${c.games.map(g=>`<button class="ghost-btn" data-edit-game="${g.slug}">${g.name}</button>`).join('')}</aside><div id="gameEditor" class="admin-card">اختار لعبة للتعديل.</div></div>`;
}
function editGame(slug){
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
  document.querySelectorAll(`[data-prod="${id}"]`).forEach(i=>{ p[i.dataset.prodField]=i.dataset.prodField==='price'||i.dataset.prodField==='order'?Number(i.value||0):i.value.trim(); });
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
function renderOffers(){
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

document.addEventListener('click',e=>{
  if(e.target.id==='loginBtn') login();
  if(e.target.id==='otpBtn') verifyOtp();
  const tb=e.target.closest('[data-tab]'); if(tb){tab=tb.dataset.tab; render();}
  if(e.target.id==='refreshOrders') renderOrders();
  if(e.target.id==='saveCatalog') saveSettings();
  if(e.target.id==='addGame') addGame();
  if(e.target.id==='addOffer'){ local.offers=[...(local.offers||[]),{id:'offer_'+Date.now(),title:'عرض جديد',subtitle:'عرض مميز',game:'pubg',image:'/assets/game-covers/pubg-new.webp',active:true,order:99}]; renderOffers(); }
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
