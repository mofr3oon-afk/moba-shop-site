export const DEFAULT_CATALOG = {
  games: [
    { slug:'pubg', name:'PUBG Mobile', subtitle:'UC | شدات', cover:'/assets/game-covers/pubg-new.webp', status:'available', order:1, defaultSection:'uc', idLabel:'PUBG ID', idPlaceholder:'اكتب ID ببجي', nameLabel:'اسم الحساب داخل اللعبة', namePlaceholder:'اكتب اسم الحساب' },
    { slug:'freefire', name:'Free Fire', subtitle:'Diamonds | عضويات', cover:'/assets/game-covers/freefire-new.webp', status:'available', order:2, defaultSection:'diamonds', idLabel:'Free Fire ID', idPlaceholder:'اكتب ID فري فاير', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب' },
    { slug:'blood-strike', name:'Blood Strike MENA', subtitle:'MENA Top Up', cover:'/assets/game-covers/blood_mena.jpg', status:'available', order:3, defaultSection:'diamonds', idLabel:'Blood Strike ID', idPlaceholder:'اكتب ID بلد سترايك', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب' },
    { slug:'mobile-legends', name:'Mobile Legends', subtitle:'Diamonds Top Up', cover:'/assets/game-covers/mobile_legends.svg', status:'available', order:4, defaultSection:'diamonds', idLabel:'Mobile Legends ID', idPlaceholder:'اكتب ID الحساب', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب', fields:[{key:'zoneId',label:'Zone ID',placeholder:'اكتب ID الزون',required:true,type:'number'}] },
    { slug:'yalla-ludo', name:'Yalla Ludo', subtitle:'Diamonds / Coins', cover:'/assets/game-covers/yalla_ludo.webp', status:'available', order:5, defaultSection:'diamonds', idLabel:'Yalla Ludo ID', idPlaceholder:'اكتب ID يلا لودو', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب' }
  ],
  sections: [
    { game:'pubg', slug:'uc', name:'شدات UC', order:1 },
    { game:'freefire', slug:'diamonds', name:'الماس', order:1 },
    { game:'freefire', slug:'memberships', name:'عضويات وتصاريح', order:2 },
    { game:'blood-strike', slug:'diamonds', name:'جواهر', order:1 },
    { game:'blood-strike', slug:'passes', name:'عروض خاصة', order:2 },
    { game:'mobile-legends', slug:'diamonds', name:'دايموند', order:1 },
    { game:'yalla-ludo', slug:'diamonds', name:'جواهر', order:1 }
  ],
  products: [
    ...[[60,50],[325,235],[660,435],[1800,1120],[3850,2170],[8100,4350]].map(([uc,price],i)=>({id:`pubg_${uc}`,game:'pubg',section:'uc',name:`UC ${uc}`,unit:'UC',amount:uc,price,order:i+1})),
    ...[[50,40],[100,70],[210,130],[310,180],[583,300],[1188,590],[2420,1140],[6160,2800]].map(([amount,price],i)=>({id:`ff_${amount}`,game:'freefire',section:'diamonds',name:`${amount} 💎`,unit:'Diamonds',amount,price,order:i+1})),
    {id:'ff_weekly',game:'freefire',section:'memberships',name:'عضوية أسبوعية',unit:'Membership',amount:1,price:130,order:20,noQty:true},
    {id:'ff_monthly',game:'freefire',section:'memberships',name:'عضوية شهرية',unit:'Membership',amount:1,price:570,order:21,noQty:true},
    {id:'ff_booyah',game:'freefire',section:'memberships',name:'تصريح بوياه',unit:'Pass',amount:1,price:180,order:22,noQty:true},
    ...[[105,60],[320,155],[540,260],[1100,475],[2260,920],[5800,2300]].map(([amount,price],i)=>({id:`bs_${amount}`,game:'blood-strike',section:'diamonds',name:`${amount} 💎`,unit:'Diamonds',amount,price,order:i+1})),
    {id:'bs_elite',game:'blood-strike',section:'passes',name:'Strike Elite',unit:'Pass',amount:1,price:225,order:20,noQty:true},
    {id:'bs_elite_plus',game:'blood-strike',section:'passes',name:'Strike Elite+',unit:'Pass',amount:1,price:475,order:21,noQty:true},
    {id:'bs_level_offer',game:'blood-strike',section:'passes',name:'عرض المستوى',unit:'Offer',amount:1,price:135,order:22,noQty:true},
    ...[[56,60],[172,160],[257,250],[344,300],[706,550],[1346,1000],[1825,1400],[2195,1750],[3688,2750],[5532,3900],[9288,6500]].map(([amount,price],i)=>({id:`ml_${amount}`,game:'mobile-legends',section:'diamonds',name:`${amount} 💎`,unit:'Diamonds',amount,price,order:i+1})),
    ...[[840,120],[2320,300],[5150,600],[13580,1500],[27640,2900],[55800,5600],[168860,16800],[283460,27500]].map(([amount,price],i)=>({id:`yl_${amount}`,game:'yalla-ludo',section:'diamonds',name:`${amount} جوهرة`,unit:'Diamonds',amount,price,order:i+1}))
  ],
  offers: [
    {id:'june_pubg',title:'عروض شهر 6',subtitle:'باقات PUBG Mobile محدودة',game:'pubg',section:'uc',image:'/assets/game-covers/pubg-new.webp',active:true,order:1}
  ]
};

const SETTINGS_KEY = 'moba_clean_catalog_overrides';

function safeJson(raw, fallback){ try{return raw ? JSON.parse(raw) : fallback}catch{return fallback} }
function normalizeGame(raw){
  return {
    slug: String(raw.slug || raw.key || '').trim(),
    name: String(raw.name || raw.title || '').trim(),
    subtitle: String(raw.subtitle || '').trim(),
    cover: String(raw.cover || raw.image || '').trim(),
    status: raw.status || 'available',
    order: Number(raw.order ?? raw.sort_order ?? 99),
    defaultSection: raw.defaultSection || raw.default_section || 'main',
    idLabel: raw.idLabel || raw.id_label || 'ID الحساب',
    idPlaceholder: raw.idPlaceholder || raw.id_placeholder || 'اكتب ID الحساب',
    nameLabel: raw.nameLabel || raw.name_label || 'اسم الحساب',
    namePlaceholder: raw.namePlaceholder || raw.name_placeholder || 'اكتب اسم الحساب',
    fields: Array.isArray(raw.fields || raw.custom_fields) ? (raw.fields || raw.custom_fields) : []
  };
}
function normalizeSection(raw){
  return {
    game:raw.game,
    slug:raw.slug || raw.key,
    name:raw.name || raw.title,
    order:Number(raw.order ?? raw.sort_order ?? 99),
    status:raw.status || 'available',
    image:raw.image || '',
    hot:!!raw.hot,
    featured:!!raw.featured,
    bestSeller:!!raw.bestSeller || !!raw.best_seller,
    startsAt:raw.startsAt || raw.starts_at || '',
    endsAt:raw.endsAt || raw.ends_at || ''
  };
}
function normalizeProduct(raw){
  return {
    id:raw.id || `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    game:raw.game,
    section:raw.section || raw.cat,
    name:raw.name,
    unit:raw.unit || raw.type || '',
    amount:Number(raw.amount || raw.uc || 0),
    price:Number(raw.price || 0),
    salePrice:Number(raw.salePrice || raw.sale_price || 0),
    description:raw.description || raw.desc || '',
    order:Number(raw.order ?? raw.sort_order ?? 99),
    noQty:!!raw.noQty || !!raw.no_qty,
    status:raw.status || 'available',
    image:raw.image || '',
    hot:!!raw.hot,
    featured:!!raw.featured,
    bestSeller:!!raw.bestSeller || !!raw.best_seller,
    startsAt:raw.startsAt || raw.starts_at || '',
    endsAt:raw.endsAt || raw.ends_at || ''
  };
}
function mergeById(base, extra, key='id'){
  const map = new Map(base.map(x=>[x[key],x]));
  extra.forEach(x=>{ if(x && x[key]) map.set(x[key], {...(map.get(x[key])||{}), ...x}); });
  return [...map.values()];
}
function mergeSections(base, extra){
  const map = new Map();
  [...base, ...extra].forEach(s=>{
    if(!s || !s.game || !s.slug) return;
    const key = `${s.game}|${s.slug}`;
    map.set(key, {...(map.get(key)||{}), ...s});
  });
  return [...map.values()];
}
export function readLocalCatalog(){
  return safeJson(localStorage.getItem(SETTINGS_KEY), {});
}
export function saveLocalCatalog(overrides){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(overrides));
}
export async function loadCatalog(){
  let remote = {};
  try{
    const r = await fetch('/api/settings');
    const data = await r.json();
    if(data.ok) remote = data.settings || {};
  }catch{}
  const local = readLocalCatalog();
  const dynamicGames = Object.values(remote.game_settings || {}).map(normalizeGame).filter(g=>g.slug);
  const games = mergeById(DEFAULT_CATALOG.games, [...dynamicGames, ...(local.games || []).map(normalizeGame)], 'slug')
    .filter(g=>g.status !== 'hidden').sort((a,b)=>a.order-b.order);
  const sections = mergeSections(DEFAULT_CATALOG.sections, [...(remote.dynamic_sections || []).map(normalizeSection), ...(local.sections || []).map(normalizeSection)].filter(s=>s.game && s.slug))
    .filter(s=>s.status !== 'hidden' && games.some(g=>g.slug===s.game)).sort((a,b)=>a.order-b.order);
  const products = mergeById(DEFAULT_CATALOG.products, [...(remote.dynamic_products || []).map(normalizeProduct), ...(local.products || []).map(normalizeProduct)].filter(p=>p.game && p.section && p.name && p.price), 'id')
    .filter(p=>p.status !== 'hidden' && games.some(g=>g.slug===p.game)).sort((a,b)=>a.order-b.order);
  const hasRemoteOffers = remote.exclusive_offer && Array.isArray(remote.exclusive_offer.items);
  const baseOffers = hasRemoteOffers ? [] : DEFAULT_CATALOG.offers;
  const offers = [...baseOffers, ...(hasRemoteOffers?remote.exclusive_offer.items:[]), ...(local.offers || [])]
    .filter(o=>o && o.active !== false).sort((a,b)=>(a.order||99)-(b.order||99));
  const brand = {...(remote.brand_settings || {}), ...(local.brand || {})};
  const store = {
    status: remote.store_status || 'available',
    message: remote.store_message || remote.store_status_message || '',
    workHours: remote.work_hours || ''
  };
  const payment = remote.payment_settings || {};
  return {games,sections,products,offers,brand,store,payment};
}
