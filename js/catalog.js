const idPrices = [[60,55],[325,265],[355,295],[385,320],[445,375],[660,500],[720,555],[840,665],[985,765],[1800,1270],[3850,2470],[8100,4950]];
const previousIdPrices = new Map([
  ['pubg_60',[60,55]], ['pubg_325',[270,250]], ['pubg_660',[500,480]],
  ['pubg_1800',[1300,1225]], ['pubg_3850',[2500,0]], ['pubg_8100',[5000,4750]]
]);
const latestIdPrices = new Map(idPrices.map(([amount,price])=>['pubg_'+amount,price]));

// Replace the matching legacy price pairs while retaining the rest of each stored row.
export function refreshLegacyIdPrice(row){
  const previous=previousIdPrices.get(row?.id);
  if(!previous || row.catalogPriceRevision===2)return row;
  if(Number(row.price)!==previous[0] || Number(row.salePrice??row.sale_price??0)!==previous[1])return row;
  return {...row,price:latestIdPrices.get(row.id),salePrice:0,sale_price:0,catalogPriceRevision:2};
}

function packages(game,section,unit,label,rows,{manual=false}={}){
  return rows.map(([amount,price],index)=>({
    id:game+'_'+section+'_'+amount,game,section,unit,amount,name:amount.toLocaleString('en-US')+' '+label,
    price,order:index+1,...(manual?{checkoutMethod:'manual',noQty:true}:{})
  }));
}

export const DEFAULT_CATALOG = {
  games: [
    {slug:'tiktok',name:'TikTok Coins',subtitle:'كوينات · عبر الشات',cover:'/assets/game-covers/tiktok.webp',status:'available',order:7,defaultSection:'coins'},
    {slug:'efootball',name:'eFootball Android',subtitle:'كوينز وباكدجات · عبر الشات',cover:'/assets/game-covers/efootball.webp',status:'available',order:8,defaultSection:'coins'},
    { slug:'roblox', name:'Roblox', subtitle:'روبوكس · الشحن في الشات', cover:'/assets/game-covers/roblox.webp', status:'available', order:6, defaultSection:'robux' },
    { slug:'pubg', name:'PUBG Mobile', subtitle:'UC | شدات', cover:'/assets/game-covers/pubg-new.webp', status:'available', order:1, defaultSection:'uc', idLabel:'PUBG ID', idPlaceholder:'اكتب ID ببجي', nameLabel:'اسم الحساب داخل اللعبة', namePlaceholder:'اكتب اسم الحساب' },
    { slug:'freefire', name:'Free Fire', subtitle:'Diamonds | عضويات', cover:'/assets/game-covers/freefire-new.webp', status:'available', order:2, defaultSection:'diamonds', idLabel:'Free Fire ID', idPlaceholder:'اكتب ID فري فاير', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب' },
    { slug:'blood-strike', name:'Blood Strike MENA', subtitle:'MENA Top Up', cover:'/assets/game-covers/blood_mena.jpg', status:'available', order:3, defaultSection:'diamonds', idLabel:'Blood Strike ID', idPlaceholder:'اكتب ID بلد سترايك', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب' },
    { slug:'mobile-legends', name:'Mobile Legends', subtitle:'Diamonds Top Up', cover:'/assets/game-covers/mobile_legends.svg', status:'available', order:4, defaultSection:'diamonds', idLabel:'Mobile Legends ID', idPlaceholder:'اكتب ID الحساب', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب', fields:[{key:'zoneId',label:'Zone ID',placeholder:'اكتب ID الزون',required:true,type:'number'}] },
    { slug:'yalla-ludo', name:'Yalla Ludo', subtitle:'Diamonds / Coins', cover:'/assets/game-covers/yalla_ludo.webp', status:'available', order:5, defaultSection:'diamonds', idLabel:'Yalla Ludo ID', idPlaceholder:'اكتب ID يلا لودو', nameLabel:'اسم الحساب', namePlaceholder:'اكتب اسم الحساب' }
  ],
  sections: [
    {game:'pubg',slug:'qr-bonus',name:'QR الزيادة · عبر الشات',order:3},
    {game:'pubg',slug:'korea',name:'PUBG الكورية · بالحساب',order:4},
    {game:'pubg',slug:'prime',name:'Prime وPrime Plus',order:6},
    {game:'roblox',slug:'robux-standard',name:'الأسعار العادية',order:2},
    {game:'tiktok',slug:'coins',name:'كوينات TikTok',order:1},
    {game:'efootball',slug:'coins',name:'كوينز Android',order:1},
    {game:'efootball',slug:'legends',name:'باكدجات الأساطير',order:2},
    { game:'pubg', slug:'qr', name:'شدات QR · عبر الشات', order:2 },
    { game:'pubg', slug:'growth', name:'الازدهار والكريستالة', order:5 },
    { game:'roblox', slug:'robux', name:'عروض روبوكس', order:1 },
    { game:'pubg', slug:'uc', name:'شدات عبر ID', order:1 },
    { game:'freefire', slug:'diamonds', name:'الماس', order:1 },
    { game:'freefire', slug:'memberships', name:'عضويات وتصاريح', order:2 },
    { game:'blood-strike', slug:'diamonds', name:'جواهر', order:1 },
    { game:'blood-strike', slug:'passes', name:'عروض خاصة', order:2 },
    { game:'mobile-legends', slug:'diamonds', name:'دايموند', order:1 },
    { game:'yalla-ludo', slug:'diamonds', name:'جواهر', order:1 }
  ],
  products: [
    ...packages('tiktok','coins','Coins','كوين',[[100,85],[350,235],[500,320],[1000,620],[1500,930],[1600,990],[2000,1240],[2500,1550],[3000,1860],[3500,2170],[4000,2480],[5000,3100],[6000,3720],[7000,4300],[8000,4920],[10000,6100],[15000,9150],[20000,12200]],{manual:true}),
    ...packages('efootball','coins','Coins','كوينز',[[100,60],[300,165],[500,275],[1000,475],[2000,935],[3000,1320],[5000,2040],[10000,3750],[15000,5500]],{manual:true}),
    ...packages('roblox','robux-standard','Robux','روبوكس',[[40,45],[80,75],[400,320],[800,620],[1700,1200],[5250,3050],[11000,5500],[24000,11000]],{manual:true}),
    ...packages('pubg','korea','UC','شدة',[[60,60],[195,165],[390,320],[680,480],[1850,1180],[3950,2250],[8300,4450]],{manual:true}),
    ...[[370,700,325,300],[690,1200,550,600],[2000,2900,1300,1500],[4000,5500,2500,3000],[9000,12000,4950,6000]].map(([min,max,price,gift],index)=>({
      id:'pubg_qr_bonus_'+min,game:'pubg',section:'qr-bonus',name:'من '+min+' إلى '+max+' شدة',unit:'UC',amount:min,
      price,order:index+1,checkoutMethod:'manual',noQty:true,description:'يُحتسب في هدايا الشراء '+gift+' شدة.'
    })),
    ...[
      ['prime','Prime',60,'60 شدة عند التفعيل + 3 يوميًا. الإجمالي 150 شدة.'],
      ['plus','Prime Plus',480,'660 شدة عند التفعيل + 8 يوميًا. الإجمالي 900 شدة.'],
      ['bundle','Prime + Prime Plus',540,'الاشتراكان معًا لمدة 30 يومًا.']
    ].map(([key,name,price,description],index)=>({
      id:'pubg_prime_'+key,game:'pubg',section:'prime',name,price,description:description+' مدة الاشتراك 30 يومًا من التفعيل.',
      unit:'اشتراك',amount:1,order:index+1,checkoutMethod:'manual',noQty:true
    })),
    ...[['suarez','باكدج لويس سواريز',60],['casillas','باكدج إيكر كاسياس',165]].map(([key,name,price],index)=>({
      id:'efootball_'+key,game:'efootball',section:'legends',name,price,unit:'باكدج',amount:1,order:index+1,checkoutMethod:'manual',noQty:true
    })),
    ...[
      ['growth_1','الازدهار الأول',55,'170 شدة + 900 رصيد'],
      ['growth_2','الازدهار الثاني',155,'180 شدة + 9 قطع'],
      ['growth_3','الازدهار الثالث',255,'300 شدة + 79 جزء ميثك'],
      ['mythic_crystal','الكريستالة الميثك',140,'']
    ].map(([key,name,price,description],index)=>({
      id:`pubg_${key}`,game:'pubg',section:'growth',name,unit:'Pack',amount:1,price,description,order:index+1,noQty:true
    })),
    ...[[325,230],[660,460],[1800,1190],[3850,2250],[8100,4600]].map(([amount,price],index)=>({
      id:`pubg_qr_${amount}`,game:'pubg',section:'qr',name:`${amount} شدة QR`,unit:'UC',amount,price,
      order:index+1,checkoutMethod:'manual',noQty:true,
      description:'تأكد من توفر العرض مع الدعم قبل التحويل.'
    })),
    ...[[100,100,80],[200,200,160],[400,310,250],[800,620,480]].map(([amount,price,salePrice],index)=>({
      id:`roblox_${amount}`,game:'roblox',section:'robux',name:`${amount} روبوكس`,unit:'Robux',amount,price,salePrice,
      order:index+1,checkoutMethod:'manual',noQty:true,
      description:'عرض بكمية محدودة. تأكد من توفر الباقة مع الدعم قبل التحويل.'
    })),
    ...idPrices.map(([uc,price],i)=>({id:`pubg_${uc}`,game:'pubg',section:'uc',name:`UC ${uc}`,unit:'UC',amount:uc,price,order:i+1})),
    ...[[50,35],[100,70],[210,120],[310,180],[583,270],[1188,500],[2420,1000],[6160,2800]].map(([amount,price],i)=>({id:`ff_${amount}`,game:'freefire',section:'diamonds',name:`${amount} 💎`,unit:'Diamonds',amount,price,order:i+1})),
    {id:'ff_weekly',game:'freefire',section:'memberships',name:'عضوية أسبوعية',unit:'Membership',amount:1,price:130,order:20,noQty:true},
    {id:'ff_monthly',game:'freefire',section:'memberships',name:'عضوية شهرية',unit:'Membership',amount:1,price:570,order:21,noQty:true},
    {id:'ff_booyah',game:'freefire',section:'memberships',name:'تصريح بوياه',unit:'Pass',amount:1,price:180,order:22,noQty:true},
    ...[[105,60],[320,155],[540,260],[1100,475],[2260,920],[5800,2300]].map(([amount,price],i)=>({id:`bs_${amount}`,game:'blood-strike',section:'diamonds',name:`${amount} 💎`,unit:'Diamonds',amount,price,order:i+1})),
    {id:'bs_elite',game:'blood-strike',section:'passes',name:'Strike Elite',unit:'Pass',amount:1,price:225,order:20,noQty:true},
    {id:'bs_elite_plus',game:'blood-strike',section:'passes',name:'Strike Elite+',unit:'Pass',amount:1,price:475,order:21,noQty:true},
    {id:'bs_level_offer',game:'blood-strike',section:'passes',name:'عرض المستوى',unit:'Offer',amount:1,price:135,order:22,noQty:true},
    ...[[56,60],[172,160],[257,250],[344,300],[706,550],[1346,1000],[1825,1400],[2195,1750],[3688,2750],[5532,3900],[9288,6500]].map(([amount,price],i)=>({id:`ml_${amount}`,game:'mobile-legends',section:'diamonds',name:`${amount} 💎`,unit:'Diamonds',amount,price,order:i+1})),
    ...[[840,115],[2320,270],[5150,530],[13580,1245],[27640,2350],[55800,4650],[168860,13800],[283460,22900]].map(([amount,price],i)=>({id:`yl_${amount}`,game:'yalla-ludo',section:'diamonds',name:`${amount} جوهرة`,unit:'Diamonds',amount,price,order:i+1}))
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
    accent: /^#[0-9a-f]{6}$/i.test(raw.accent||'')?raw.accent:'',
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
    customFields:raw.custom_fields||raw.fields,
    slug:raw.slug || raw.key,
    name:raw.name || raw.title,
    order:Number(raw.order ?? raw.sort_order ?? 99),
    status:raw.status || 'available',
    hidden:!!raw.hidden,
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
    customFields:raw.custom_fields||raw.fields,
    checkoutMethod:raw.checkoutMethod||raw.checkout_method||'direct',
    id:raw.id || `p_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    game:raw.game,
    section:raw.section || raw.cat,
    name:raw.name,
    unit:raw.unit || raw.type || '',
    amount:Number(raw.amount || raw.uc || 0),
    price:Number(raw.price || 0),
    salePrice:Number(raw.salePrice ?? raw.sale_price ?? 0),
    description:raw.description || raw.desc || '',
    order:Number(raw.order ?? raw.sort_order ?? 99),
    noQty:!!raw.noQty || !!raw.no_qty,
    hidden:!!raw.hidden,
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
  const r = await fetch('/api/settings');
  const data = await r.json();
  if(!r.ok||!data.ok)throw new Error('تعذر تحميل الأسعار الحالية. أعد المحاولة قبل اختيار باقة.');
  const remote = data.settings || {};
  const local = {}; // Customer prices never use admin drafts left in localStorage.
  const dynamicGames = Object.values(remote.game_settings || {}).map(normalizeGame).filter(g=>g.slug);
  const games = mergeById(DEFAULT_CATALOG.games, [...dynamicGames, ...(local.games || []).map(normalizeGame)], 'slug')
    .filter(g=>g.status !== 'hidden').sort((a,b)=>a.order-b.order);
  const sections = mergeSections(DEFAULT_CATALOG.sections, [...(remote.dynamic_sections || []).map(normalizeSection), ...(local.sections || []).map(normalizeSection)].filter(s=>s.game && s.slug))
    .filter(s=>!s.hidden&&s.status !== 'hidden' && games.some(g=>g.slug===s.game)).sort((a,b)=>a.order-b.order);
  const products = mergeById(DEFAULT_CATALOG.products, [...(remote.dynamic_products || []).map(refreshLegacyIdPrice), ...(local.products || [])].filter(p=>p?.id), 'id').map(normalizeProduct)
    .filter(p=>!p.hidden&&p.status !== 'hidden'&&Number.isFinite(p.price)&&p.price>0&&games.some(g=>g.slug===p.game)&&sections.some(s=>s.game===p.game&&s.slug===p.section)).sort((a,b)=>a.order-b.order);
  const hasRemoteOffers = remote.exclusive_offer && Array.isArray(remote.exclusive_offer.items);
  const baseOffers = hasRemoteOffers ? [] : DEFAULT_CATALOG.offers;
  const offers = [...baseOffers, ...(hasRemoteOffers?remote.exclusive_offer.items:[]), ...(local.offers || [])]
    .filter(o=>o && o.active !== false).sort((a,b)=>(a.order||99)-(b.order||99));
  const brand = {...(remote.brand_settings || {}), ...(local.brand || {})};
  const store = {
    status: remote.store_status || 'available',
    message: remote.store_message || remote.store_status_message || '',
    workHours: remote.work_hours || '',
    supportPhone: remote.support_phone || '201061707294'
  };
  const payment = remote.payment_settings || {};
  return {games,sections,products,offers,brand,store,payment};
}
