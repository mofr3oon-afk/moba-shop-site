/* moba-v13-reviews-english-digits */
(function(){
  const arabicDigits = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
  function toEnglishDigitsText(s){ return String(s).replace(/[٠-٩۰-۹]/g, d => arabicDigits[d] || d); }
  window.toEnglishDigitsText = toEnglishDigitsText;

  function convertNode(node){
    if(!node) return;
    if(node.nodeType === 3){
      const v = toEnglishDigitsText(node.nodeValue);
      if(v !== node.nodeValue) node.nodeValue = v;
      return;
    }
    if(node.nodeType !== 1) return;
    if(['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(node.tagName)) return;
    node.childNodes.forEach(convertNode);
  }
  convertNode(document.body);
  const obs = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes.forEach(convertNode);
      if(m.type === 'characterData') convertNode(m.target);
    });
  });
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  document.addEventListener('input', e=>{
    if(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')){
      const pos = e.target.selectionStart;
      const v = toEnglishDigitsText(e.target.value);
      if(v !== e.target.value){
        e.target.value = v;
        try{ e.target.setSelectionRange(pos,pos); }catch(_){}
      }
    }
  });

  let reviewRate = 5;
  function setStars(n){
    reviewRate = Number(n || 5);
    const hidden = document.getElementById('reviewRating');
    if(hidden) hidden.value = reviewRate;
    document.querySelectorAll('.review-star').forEach(btn=>{
      btn.classList.toggle('active', Number(btn.dataset.rate) <= reviewRate);
    });
  }
  document.addEventListener('click', e=>{
    const star = e.target.closest('.review-star');
    if(star) setStars(star.dataset.rate);
  });

  function escapeText(text){
    return String(text ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function reviewStars(n){ return '★★★★★'.slice(0, Math.max(1, Math.min(5, Number(n||5)))); }
  function formatDate(v){
    try{return toEnglishDigitsText(new Date(v).toLocaleDateString('en-GB'));}catch(_){return '';}
  }
  async function loadReviews(){
    const box = document.getElementById('reviewsList');
    if(!box) return;
    try{
      const res = await fetch('/api/reviews');
      const data = await res.json();
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];
      if(!reviews.length){
        box.innerHTML = '<div class="review-card"><div class="review-text">لسه مفيش تقييمات على الموقع، كن أول واحد يكتب رأيه.</div></div>';
        return;
      }
      box.innerHTML = reviews.map(r=>`
        <div class="review-card">
          <div class="review-card-top">
            <div class="review-name">${escapeText(r.customer_name || 'عميل MOBA SHOP')}</div>
            <div class="review-date">${formatDate(r.created_at)}</div>
          </div>
          <div class="review-rating">${reviewStars(r.rating)}</div>
          <div class="review-text">${escapeText(r.review_text)}</div>
        </div>
      `).join('');
    }catch(e){
      box.innerHTML = '<div class="review-card"><div class="review-text">تعذر تحميل التقييمات حاليا.</div></div>';
    }
  }
  const form = document.getElementById('reviewForm');
  if(form){
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const status = document.getElementById('reviewStatus');
      status.className = 'review-status';
      const fd = new FormData(form);
      try{
        const res = await fetch('/api/reviews',{method:'POST',body:JSON.stringify({
          customer_name: fd.get('customerName'),
          rating: Number(fd.get('rating') || reviewRate),
          review_text: fd.get('reviewText')
        }),headers:{'Content-Type':'application/json'}});
        const data = await res.json();
        if(!data.ok) throw new Error(data.error || 'حصل خطأ');
        status.textContent = '✅ شكرا ليك، تقييمك اتنشر بنجاح';
        status.className = 'review-status ok';
        form.reset(); setStars(5); loadReviews();
      }catch(err){
        status.textContent = '⚠️ ' + (err.message || 'حصل خطأ أثناء نشر التقييم');
        status.className = 'review-status err';
      }
    });
  }
  setStars(5);
  loadReviews();
})();


/* moba-v41-sync-status-badges */
(function(){
  function findTopBadges(){
    const direct = Array.from(document.querySelectorAll('#topStatusBadge,#headerStatusBadge,.store-status-pill,.status-pill,.live-status'));
    const byText = Array.from(document.querySelectorAll('body *')).filter(el=>{
      if(el.closest('#workStatusMini')) return false;
      if(el.children.length > 3) return false;
      const t = (el.textContent || '').trim();
      return /متاح الآن|متاح ولكن فيه ضغط|خارج مواعيد التنفيذ|مغلق حاليًا/.test(t) && !/التنفيذ|مواعيد|الأول قبل الجميع/.test(t);
    });
    const all = [...direct, ...byText];
    return Array.from(new Set(all)).slice(0,4);
  }
  function setBadge(el, mode, title, desc){
    if(!el) return;
    el.classList.remove('available','busy','closed','maintenance');
    el.classList.add('store-status-pill', mode);
    el.innerHTML = `<span class="status-dot"></span><span class="status-copy"><span class="status-label">${title}</span><small class="status-desc">${desc||''}</small></span>`;
  }
  function setMainBox(box, mode, title, desc){
    if(!box) return;
    box.className = `work-status-mini ${mode}`;
    box.innerHTML = `<div class="status-head"><span class="status-dot"></span><span>${title}</span></div><div class="status-desc">${desc}</div>`;
  }
  function applyStoreStatus(settings){
    const rawMode = String(settings?.store_status || '').toLowerCase();
    const legacyBusy = settings?.busy_mode === true || settings?.busy_mode === 'true';
    const mode = rawMode || (legacyBusy ? 'busy' : 'available');
    const customMsg = settings?.store_status_message || settings?.busy_message || '';
    const config = {
      available:{
        title:'متاح الآن',
        desc: customMsg || 'التنفيذ شغال حاليا بشكل طبيعي.'
      },
      busy:{
        title:'متاح ولكن فيه ضغط',
        desc: customMsg || 'تقدر تعمل الأوردر عادي لكن التنفيذ ممكن يتأخر شوية.'
      },
      closed:{
        title:'خارج مواعيد التنفيذ',
        desc: customMsg || 'ينفع تعمل طلبك عادي دلوقتي. الطلب هيتسجل وأول ما مواعيد العمل تبدأ هيكون من أوائل الطلبات.'
      },
      maintenance:{
        title:'صيانة مؤقتة',
        desc: customMsg || 'الموقع تحت تحديث بسيط حاليا. الطلبات الجديدة متوقفة مؤقتا.'
      }
    };
    const c = config[mode] || config.available;
    setMainBox(document.getElementById('workStatusMini'), mode, c.title, c.desc);
    findTopBadges().forEach(el => setBadge(el, mode, c.title, c.desc));
    window.mobaStoreMode = mode;
    window.mobaBusyMode = mode === 'busy';
  }
  async function refreshStoreStatusV41(){
    try{
      const res = await fetch('/api/settings?t=' + Date.now());
      const data = await res.json();
      if(data && data.ok) applyStoreStatus(data.settings || {});
    }catch(e){}
  }
  window.refreshStoreStatusV41 = refreshStoreStatusV41;
  refreshStoreStatusV41();
  setInterval(refreshStoreStatusV41, 15000);
})();


/* moba-v44-closed-status-upsell */
(function(){
  const HOURS_HTML = `
    <h3>🕒 مواعيد العمل</h3>
    <p>تقدر تعمل طلبك في أي وقت حتى لو خارج مواعيد التنفيذ.</p>
    <p><b>التنفيذ:</b> يوميا من 12 صباحا حتى 5 الفجر.</p>
    <p><b>الاثنين والأربعاء والخميس والجمعة:</b> من 3 العصر حتى 5 الفجر.</p>
    <p>أي طلب خارج المواعيد هيتسجل، وأول ما نبدأ الشغل هيكون من أوائل الطلبات اللي تتنفذ ✅</p>
    <button type="button" id="closeWorkHoursPopup">تمام</button>
  `;

  function ensurePopup(){
    let p = document.getElementById('workHoursPopup');
    if(!p){
      p = document.createElement('div');
      p.id = 'workHoursPopup';
      p.className = 'work-hours-popup';
      p.innerHTML = HOURS_HTML;
      document.body.appendChild(p);
      p.querySelector('#closeWorkHoursPopup').onclick = () => p.classList.remove('show');
    }
    return p;
  }

  window.showWorkHoursPopup = function(){
    const p = ensurePopup();
    p.classList.add('show');
  };

  function addHoursButton(box){
    if(!box || box.querySelector('.closed-hours-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'closed-hours-btn';
    btn.innerHTML = '🕒 عرض مواعيد العمل';
    btn.onclick = function(e){
      e.preventDefault();
      e.stopPropagation();
      window.showWorkHoursPopup();
    };
    box.appendChild(btn);
  }

  function enhanceClosedStatus(){
    const main = document.getElementById('workStatusMini');
    if(main && main.classList.contains('closed')){
      const desc = main.querySelector('.status-desc');
      if(desc && !desc.dataset.v44){
        desc.dataset.v44 = '1';
        desc.innerHTML = 'ينفع تعمل طلبك عادي دلوقتي ✅ طلبك هيتسجل، وأول ما مواعيد العمل تبدأ هيكون من أوائل الطلبات اللي يتم تنفيذها.';
      }
      addHoursButton(main);
    }

    document.querySelectorAll('.store-status-pill.closed,.status-pill.closed,.live-status.closed,#topStatusBadge.closed,#headerStatusBadge.closed').forEach(el=>{
      const label = el.querySelector('.status-label');
      if(label) label.textContent = 'خارج مواعيد التنفيذ';
    });
  }

  // Patch V41 function if it exists by re-running after every status refresh
  const oldRefresh = window.refreshStoreStatusV41;
  if(typeof oldRefresh === 'function'){
    window.refreshStoreStatusV41 = async function(){
      await oldRefresh();
      setTimeout(enhanceClosedStatus, 100);
    };
  }

  setInterval(enhanceClosedStatus, 12000);
  setTimeout(enhanceClosedStatus, 600);

  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'closeWorkHoursPopup'){
      ensurePopup().classList.remove('show');
    }
  });
})();


/* moba-v61-home-polish-prices-fix */
(function(){
  // Ensure latest correct pricing is used everywhere after previous scripts.
  const P = window.mobaProducts;
  if(P){
    P.growth = [
      {name:'ازدهار 1', type:'مرة واحدة في الحساب', price:55, uc:60, noQty:true, warning:'اتأكد إنه متاح عندك قبل الطلب'},
      {name:'ازدهار 2', type:'مرة واحدة في الحساب', price:150, uc:180, noQty:true, warning:'اتأكد إنه متاح عندك قبل الطلب'},
      {name:'ازدهار 3', type:'مرة واحدة في الحساب', price:250, uc:325, noQty:true, warning:'اتأكد إنه متاح عندك قبل الطلب'},
      {name:'الثلاثة ازدهارات', type:'عرض الازدهار كامل', price:450, uc:565, noQty:true, hot:true, warning:'اتأكد إن كل الازدهارات متاحة في حسابك'},
      {name:'الكريستالة / الجوهرة', type:'Crystal / Mythic Gem', price:150, uc:0, noQty:true, warning:'اتأكد من المتاح داخل اللعبة. غالبا واحدة أو اتنين في الأسبوع حسب الحساب'}
    ];
    P.prime = [
      {name:'Prime + Prime Plus', type:'برايم وبرايم بلس مع بعض', price:500, uc:0, noQty:true, hot:true, warning:'منتج واحد يشمل Prime و Prime Plus مع بعض'},
      {name:'Prime', type:'اشتراك برايم فقط', price:55, uc:0, noQty:true},
      {name:'Prime Plus', type:'اشتراك برايم بلس فقط', price:445, uc:0, noQty:true}
    ];
  }
  // Text polish for game cards
  document.querySelectorAll('#gamesHome .game-card').forEach(card=>{
    const game = card.dataset.game || '';
    const span = card.querySelector('.game-info span');
    const em = card.querySelector('.game-bottomline em');
    if(game==='pubg' && span) span.textContent = 'UC | ازدهار | برايم';
    if(game==='freefire' && span) span.textContent = 'شحن Diamonds قريبًا';
    if(game==='roblox' && span) span.textContent = 'شحن Robux قريبًا';
    if(game==='blood_mena' && span) span.textContent = 'شحن MENA قريبًا';
    if(game==='blood_global' && span) span.textContent = 'Global Top Up قريبًا';
    if(card.classList.contains('active') && em) em.textContent = 'افتح المنتجات';
    if(card.classList.contains('coming') && em) em.textContent = 'قريبًا';
  });
  // make card button more professional when available.
  const mini = document.querySelector('.mini-cart-open');
  if(mini) mini.textContent = '🛒 افتح السلة';
  const title = document.querySelector('.games-home-head p');
  if(title) title.textContent = 'اختار اللعبة اللي عايز تشحنها وبعدها هتظهرلك المنتجات الخاصة بيها بشكل واضح واحترافي.';
})();


/* moba-v64-games-clean-fix */
(function(){
  document.addEventListener('click', function(e){
    const card = e.target.closest('.clean-games-v64 [data-game]');
    if(!card) return;
    const game = card.dataset.game;
    if(game === 'pubg' || (window.mobaAllowGameClick && window.mobaAllowGameClick(game))) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(window.mobaToast) window.mobaToast('اللعبة دي هتتضاف قريبًا 👑');
    else alert('اللعبة دي هتتضاف قريبًا 👑');
  }, true);
})();


/* moba-v76-home-trust-clean */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function enhanceTrust(){
    const hero=qs('#trustHeroV62 .trust-hero-content');
    if(!hero || qs('.moba-v76-trust-orbs',hero))return;
    const title=hero.querySelector('h1');
    const text=hero.querySelector('p');
    if(title) title.textContent='ليه تستخدم موبا شوب؟';
    if(text) text.textContent='كل حاجة معمولة عشان الطلب يبقى واضح، سريع المتابعة، وآمن من أول اختيار اللعبة لحد تنفيذ الشحن.';
    const orbs=document.createElement('div');
    orbs.className='moba-v76-trust-orbs';
    orbs.innerHTML=[
      ['تابع طلباتك','كل تحديث أول بأول'],
      ['دعم مباشر','تواصل في أي وقت'],
      ['أمان الطلب','مراجعة قبل التنفيذ'],
      ['+7000','عميل تعامل معانا'],
      ['+1000','تقييم وتجربة'],
      ['12 سنة','خبرة في الشحن']
    ].map(x=>`<div class="moba-v76-trust-orb">${x[0].startsWith('+')||/سنة/.test(x[0])?`<strong>${x[0]}</strong>`:`<b>${x[0]}</b>`}<span>${x[1]}</span></div>`).join('');
    hero.appendChild(orbs);
  }
  function cleanHomeButtons(){
    const cart=qs('#gamesHome .mini-cart-open');
    if(cart) cart.remove();
    qs('#trustHeroV62 .trust-actions-v62')?.remove();
  }
  setTimeout(()=>{enhanceTrust();cleanHomeButtons();},100);
  document.addEventListener('DOMContentLoaded',()=>{enhanceTrust();cleanHomeButtons();});
})();


/* moba-v82-game-card-mini-icons */
(function(){
  function addMiniIcons(){
    document.querySelectorAll('#gamesHome .clean-games-v64 .cover-card').forEach(function(card){
      const content=card.querySelector('.game-card-content');
      const cover=card.querySelector('.game-cover img');
      if(!content || !cover || content.querySelector('.game-mini-icon-v82'))return;
      const img=document.createElement('img');
      img.className='game-mini-icon-v82';
      img.src=cover.getAttribute('src');
      img.alt='';
      img.loading='lazy';
      content.insertBefore(img,content.firstChild);
    });
  }
  addMiniIcons();
  document.addEventListener('DOMContentLoaded',addMiniIcons);
  setTimeout(addMiniIcons,120);
})();


/* moba-v86-site-logo-favicon */
(function(){
  const logoSrc='assets/moba-shop-logo-512.webp';
  function addLogo(sel,cls){
    document.querySelectorAll(sel).forEach(function(el){
      if(el.querySelector('.site-logo-mark'))return;
      const img=document.createElement('img');
      img.className='site-logo-mark '+(cls||'');
      img.src=logoSrc;
      img.alt='MOBA SHOP';
      el.insertBefore(img,el.firstChild);
    });
  }
  function enhance(){
    addLogo('.logo','hero-logo-mark');
    addLogo('.trust-badge-v62','');
    addLogo('.games-home-badge','');
  }
  enhance();
  document.addEventListener('DOMContentLoaded',enhance);
  setTimeout(enhance,200);
})();


/* moba-v102-game-card-status-icon-polish */
(function(){
  const iconMap={
    pubg:'assets/game-icons/pubg-icon.webp',
    freefire:'assets/game-icons/freefire-icon.webp',
    roblox:'assets/game-icons/roblox.svg',
    blood_mena:'assets/game-icons/bloodstrike.svg',
    blood_global:'assets/game-icons/bloodstrike-global.svg',
    tiktok:'assets/game-icons/tiktok-icon.webp',
    valorant:'assets/game-icons/valorant-icon.jpg'
  };
  function polishGames(){
    document.querySelectorAll('#gamesHome .clean-games-v64 .cover-card').forEach(function(card){
      const game=card.getAttribute('data-game')||'';
      let status=card.querySelector(':scope > .game-status-v102');
      if(!status){
        status=document.createElement('span');
        status.className='game-status-v102';
        card.appendChild(status);
      }
      const isLive=card.classList.contains('active')||game==='pubg';
      status.className='game-status-v102 '+(isLive?'available':'soon');
      status.textContent=isLive?'متاح الآن':'قريبًا';
      const icon=card.querySelector('.game-mini-icon-v82');
      if(icon&&iconMap[game]){
        icon.src=iconMap[game];
        icon.removeAttribute('srcset');
      }
      card.querySelectorAll(':scope > .game-badge').forEach(function(b){b.remove()});
    });
  }
  polishGames();
  document.addEventListener('DOMContentLoaded',polishGames);
  setTimeout(polishGames,160);
  setInterval(polishGames,15000);
})();
/* V104 split polish: unavailable game popup + product inputs helper */
(function(){
  if(window.__mobaV104ProductPolish)return;
  window.__mobaV104ProductPolish=true;
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function soonModal(gameName){
    let modal=qs('#mobaV104SoonModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='mobaV104SoonModal';
      modal.className='moba-v104-soon-modal';
      modal.innerHTML='<div class="moba-v104-soon-card"><b id="mobaV104SoonTitle">قريبًا</b><p>اللعبة دي هتتضاف قريبًا. تابع العروض والتحديثات من MOBA SHOP.</p><button type="button">تمام</button></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click',function(e){
        if(e.target===modal||e.target.tagName==='BUTTON')modal.classList.remove('show');
      });
    }
    const title=qs('#mobaV104SoonTitle',modal);
    if(title)title.textContent=(gameName||'اللعبة')+' قريبًا';
    modal.classList.add('show');
  }
  function polishProductCards(){
    qsa('.product').forEach(function(card){
      const id=qs('input[id^="id_"]',card);
      const name=qs('input[id^="name_"]',card);
      if(id&&name){
        card.querySelectorAll('.moba-v104-use-last,.last-id-btn,.pharaoh-product-helper [data-v65-fill-last]').forEach(function(btn){btn.remove()});
        let row=qs('.id-inline-wrap',card);
        const inlineBtn=qs('.use-last-id-inline-btn,[data-last-id]',card);
        if(!row){
          row=document.createElement('div');
          row.className='id-inline-wrap';
          id.parentNode.insertBefore(row,id);
          row.appendChild(id);
          if(inlineBtn) row.appendChild(inlineBtn);
        }
        if(inlineBtn && inlineBtn.parentElement!==row) row.appendChild(inlineBtn);
      }
      card.dataset.v104Polished='1';
    });
  }
  document.addEventListener('click',function(e){
    const coming=e.target.closest&&e.target.closest('#gamesHome .cover-card.coming');
    if(!coming)return;
    if(window.mobaAllowGameClick && window.mobaAllowGameClick(coming.getAttribute('data-game'))) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    const name=(coming.querySelector('b')?.textContent||coming.getAttribute('data-game')||'اللعبة').trim();
    soonModal(name);
    return false;
  },true);
  const oldRender=window.renderProducts;
  if(typeof oldRender==='function'){
    window.renderProducts=function(){
      const r=oldRender.apply(this,arguments);
      setTimeout(polishProductCards,0);
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded',polishProductCards);
  setInterval(polishProductCards,12000);
})();


/* moba-v185-game-status-and-catalog-polish */
(function(){
  if(window.__mobaV185GameStatusPolish)return; window.__mobaV185GameStatusPolish=true;
  const norm=s=>String(s||'').toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/\s+/g,' ').trim();
  const statusText={available:'متاح الآن',soon:'قريبًا',unavailable:'متوقف',disabled:'متوقف',hidden:'مخفي'};
  const statusClass={available:'available',soon:'soon',unavailable:'unavailable',disabled:'unavailable',hidden:'unavailable'};
  function paint(card,g){
    const st=(g&&g.status)||'available', cls=statusClass[st]||'available', txt=statusText[st]||'متاح الآن';
    card.classList.toggle('active',st==='available'); card.classList.toggle('soon',st==='soon'); card.classList.toggle('unavailable',st==='unavailable'||st==='disabled');
    let b=card.querySelector('.game-status-v102')||card.querySelector('.game-card-content .game-badge')||card.querySelector('.game-badge');
    if(!b){b=document.createElement('span');b.className='game-status-v102';card.appendChild(b)}
    b.className=(b.className.includes('game-badge')?'game-badge ':'game-status-v102 ')+cls; b.textContent=txt;
    const cb=card.querySelector('.game-card-content .game-badge'); if(cb&&cb!==b){cb.className='game-badge '+cls;cb.textContent=txt;}
    if(g&&g.currency){const sm=card.querySelector('.game-card-content small'); if(sm)sm.textContent=g.currency;}
    if(g&&g.icon){const im=card.querySelector('.game-mini-icon-v82,img'); if(im){im.src=g.icon; im.removeAttribute('srcset');}}
    if(g&&g.cover){const im=card.querySelector('img.cover,img:not(.game-mini-icon-v82)'); if(im){im.src=g.cover; im.removeAttribute('srcset');}else card.style.backgroundImage='linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.55)),url("'+g.cover+'")';}
  }
  async function sync(){
    try{
      const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store',headers:{Accept:'application/json'}}); const d=await r.json(); const s=d.settings||{};
      const map=new Map();
      (Array.isArray(s.game_settings)?s.game_settings:[]).forEach(g=>{const k=String(g.key||g.id||g.game||'').trim(); if(k)map.set(k,{...g,key:k,status:g.status||'available'});});
      (Array.isArray(s.dynamic_sections)?s.dynamic_sections:[]).forEach(sec=>{const k=String(sec.game||'').trim(); if(!k)return; const old=map.get(k)||{key:k,title:k,status:'soon'}; if(sec.status==='available')old.status='available'; if(!old.currency&&sec.currency)old.currency=sec.currency; if(!old.cover&&sec.image)old.cover=sec.image; map.set(k,old);});
      document.querySelectorAll('#gamesHome [data-game], #gamesHome .cover-card, #gamesHome .game-card').forEach(card=>{let k=String(card.getAttribute('data-game')||'').trim(); let g=map.get(k); if(!g){const txt=norm(card.textContent||'');g=[...map.values()].find(x=>txt.includes(norm(x.title||x.name||x.key||'')));} if(g)paint(card,g);});
      window.mobaGameSettings=[...map.values()];
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',sync); setTimeout(sync,600); setTimeout(sync,1800); window.mobaSyncGameStatusesV185=sync;
})();
