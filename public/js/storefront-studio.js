import { escapeText as esc, productIsAvailable } from './interface-utils.js';
import { gameTile, imageSource, catalogPrice } from './catalog-presentation.js';
import { storeIcon } from './store-icons.js';

export function gameStartingPrice(catalog,game){
  if(game.status&&game.status!=='available')return null;
  const prices=catalog.products.filter(p=>p.game===game.slug&&productIsAvailable(p)&&catalog.sections.some(s=>s.game===p.game&&s.slug===p.section&&productIsAvailable(s))).map(catalogPrice).filter(n=>Number.isFinite(n)&&n>0);
  return prices.length?Math.min(...prices):null;
}

export function studioHome(catalog,state,offerHtml){
  const offer=catalog.offers.find(o=>(!o.placement||o.placement==='home'||o.placement==='both')&&(!o.endsAt||Date.parse(o.endsAt)>Date.now()));
  const editions=['pubg','pubg-kr'].map(slug=>catalog.games.find(game=>game.slug===slug&&game.status==='available')).filter(Boolean);
  return `<div class="store-directory">
    <section class="directory-intro">
      <div><h1>اختار لعبتك<br><em>واشحن باقتك</em></h1><p>شدات، جواهر وكوينات بالجنيه المصري.</p></div>
      <div class="directory-status"><span class="status-pill store-${esc(catalog.store.status||'available')}">${esc(state.title)}</span>
        <p>${esc(catalog.store.message||state.message)}</p>
        ${catalog.store.workHours?`<small>${esc(catalog.store.workHours)}</small>`:''}
      </div>
    </section>
    <section class="directory-catalog" id="games" aria-labelledby="gamesTitle">
      <div class="directory-toolbar">
        <div><h2 id="gamesTitle">الألعاب والخدمات</h2><span id="gameCount">${catalog.games.length}</span></div>
        <label class="directory-search">${storeIcon('search')}<input id="gameSearch" type="search" aria-label="ابحث عن لعبة" aria-controls="gamesGrid" placeholder="ابحث عن لعبة…" autocomplete="off"></label>
      </div>
      <div class="games-grid" id="gamesGrid">${catalog.games.map(game=>gameTile(game,{startingPrice:gameStartingPrice(catalog,game)})).join('')}</div>
      <p class="notice" id="noGames" role="status" hidden>جرّب البحث باسم اللعبة بالعربي أو الإنجليزي.</p>
    </section>
    ${editions.length?`<section class="edition-panel">
      <img class="edition-cover" src="/assets/catalog-studio/field-hero.webp" alt="" width="1440" height="960" loading="lazy">
      <div><h2>ببجي العالمية والكورية</h2><p>اختار نسخة لعبتك عشان تظهر الباقات المناسبة.</p>
      <div class="edition-actions">${editions.map(game=>`<button class="ghost-btn" type="button" data-game="${esc(game.slug)}"><img src="${esc(imageSource(game.cover))}" alt="" width="32" height="32">${game.slug==='pubg'?'ببجي العالمية':'ببجي الكورية'} ${storeIcon('arrow')}</button>`).join('')}</div></div>
    </section>`:''}
    ${offer?offerHtml(offer):''}
    <div class="directory-footer"><a href="/track" data-link>${storeIcon('orders')} متابعة الطلب</a><a href="/faq" data-link>${storeIcon('shield')} الأسئلة الشائعة</a></div>
  </div>`;
}
