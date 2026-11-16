import { escapeText as esc, productIsAvailable } from './interface-utils.js';
import { gameTile, imageSource, catalogPrice } from './catalog-presentation.js';

export function gameStartingPrice(catalog,game){
  if(game.status&&game.status!=='available')return null;
  const prices=catalog.products.filter(p=>p.game===game.slug&&productIsAvailable(p)&&catalog.sections.some(s=>s.game===p.game&&s.slug===p.section&&productIsAvailable(s))).map(catalogPrice).filter(n=>Number.isFinite(n)&&n>0);
  return prices.length?Math.min(...prices):null;
}

const priceText=n=>new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(n);

export function studioHome(catalog,state,offerHtml){
  const featured=catalog.games.find(game=>game.slug==='pubg'&&game.status==='available');
  const shortcuts=['pubg-kr','freefire','roblox','tiktok'].map(slug=>catalog.games.find(game=>game.slug===slug&&game.status==='available')).filter(Boolean);
  const offer=catalog.offers.find(o=>(!o.placement||o.placement==='home'||o.placement==='both')&&(!o.endsAt||Date.parse(o.endsAt)>Date.now()));
  const featuredPrice=featured?gameStartingPrice(catalog,featured):null;
  return `
    <section class="market-hero">
      <img class="market-hero-image" src="/assets/catalog-studio/field-hero.webp" alt="" width="1440" height="960" fetchpriority="high">
      <div class="market-hero-copy">
        <h1>اشحن لعبتك.</h1>
        <p>اختار اللعبة والباقة وشوف السعر بالجنيه.</p>
        <div class="market-actions">
          <a class="primary" href="#games">تصفح الباقات <span aria-hidden="true">↙</span></a>
          <button class="ghost-btn" data-go="/track">تابع طلبك</button>
        </div>
      </div>
      ${featured?`<button class="market-feature" data-game="${esc(featured.slug)}">
        <img src="${esc(imageSource(featured.cover))}" alt="" width="40" height="40">
        <span><strong>ببجي العالمية</strong><small>${featuredPrice===null?'شوف الباقات':`من ${priceText(featuredPrice)} ج.م`}</small></span>
        <i aria-hidden="true">←</i>
      </button>`:''}
    </section>
    <div class="studio-store-status"><span class="status-pill store-${esc(catalog.store.status||'available')}">${esc(state.title)}</span><p>${esc(catalog.store.message||state.message)}${catalog.store.workHours?` <span>· ${esc(catalog.store.workHours)}</span>`:''}</p></div>
    <div class="market-shortcuts" aria-label="اختصارات الشحن">${shortcuts.map(game=>`<button data-game="${esc(game.slug)}"><img src="${esc(imageSource(game.cover))}" alt="" width="38" height="38"><strong>${esc(game.name)}</strong><span aria-hidden="true">←</span></button>`).join('')}</div>
    <section class="section games-section" id="games" aria-labelledby="gamesTitle">
      <div class="games-heading"><div><h2 id="gamesTitle">الألعاب والباقات</h2><p><span id="gameCount">${catalog.games.length}</span> ألعاب وخدمات شحن</p></div><label class="game-search"><span aria-hidden="true">⌕</span><input id="gameSearch" type="search" aria-label="ابحث عن لعبة" aria-controls="gamesGrid" placeholder="اكتب اسم اللعبة…" autocomplete="off"></label></div>
      <div class="games-grid" id="gamesGrid">${catalog.games.map(g=>gameTile(g,{count:catalog.products.filter(p=>p.game===g.slug).length,startingPrice:gameStartingPrice(catalog,g)})).join('')}</div>
      <p class="notice" id="noGames" role="status" hidden>جرّب البحث باسم اللعبة بالعربي أو الإنجليزي.</p>
      ${offer?offerHtml(offer):''}
    </section>
    <section class="market-guide"><h2>إزاي تطلب؟</h2><p>اختار الباقة، وكمّل ببيانات الشحن المطلوبة. باقات الشات بيأكدها الدعم قبل التحويل.</p><a class="ghost-btn" href="/faq" data-link>الأسئلة الشائعة ←</a></section>`;
}
