/* moba-v47-nav-highlight */
(function(){
  const links = Array.from(document.querySelectorAll('.jump-nav a[href^="#"]'));
  if(!links.length) return;

  function clearActive(){ links.forEach(a => a.classList.remove('active-nav')); }
  links.forEach(a => {
    a.addEventListener('click', function(){
      clearActive();
      a.classList.add('active-nav');
    });
  });

  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if('IntersectionObserver' in window && sections.length){
    const map = new Map();
    links.forEach(a => map.set(a.getAttribute('href'), a));
    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if(!visible) return;
      clearActive();
      const id = '#' + visible.target.id;
      const link = map.get(id);
      if(link) link.classList.add('active-nav');
    }, {rootMargin:'-20% 0px -55% 0px', threshold:[0.2,0.35,0.55]});
    sections.forEach(sec => io.observe(sec));
  }
})();


/* moba-v72-compact-pro-nav-cart */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function refreshNavText(){
    const nav=qs('.jump-nav.app-nav'); if(!nav)return;
    const data={
      home:['⌂','الرئيسية'],
      cart:['▣','السلة'],
      orders:['◷','طلباتي'],
      reviews:['☆','الآراء']
    };
    qsa('a[data-view]',nav).forEach(a=>{
      const d=data[a.dataset.view]; if(!d)return;
      a.innerHTML='<span>'+d[0]+'</span><span>'+d[1]+'</span>';
    });
    const support=qs('a.support-link',nav);
    if(support) support.innerHTML='<span>☎</span><span>الدعم</span>';
  }
  // V74: run on load only; repeated text rewrites made the header jitter.
  setTimeout(refreshNavText,100);
})();


/* moba-v73-final-nav-cart-cleanup */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function current(){
    return document.body.dataset.page || 'home';
  }
  function normalizeNav(){
    const labels={home:'الرئيسية',cart:'السلة',orders:'سجل الطلبات',reviews:'التقييمات'};
    qsa('.jump-nav.app-nav a[data-view]').forEach(a=>{
      const label=labels[a.dataset.view]||a.textContent.trim();
      a.textContent=label;
      a.classList.toggle('active-nav',a.dataset.view===current() || (current()==='game'&&a.dataset.view==='home'));
      a.classList.remove('primary');
    });
    const support=qs('.jump-nav.app-nav a.support-link');
    if(support) support.textContent='الدعم';
  }
  const oldShow=window.mobaShowView;
  if(typeof oldShow==='function'){
    window.mobaShowView=function(view){
      const r=oldShow.apply(this,arguments);
      setTimeout(normalizeNav,30);
      return r;
    };
  }
  window.addEventListener('hashchange',normalizeNav);
  // V74: no interval here; mobaShowView/hashchange update the active item.
  setTimeout(normalizeNav,100);
})();


/* moba-v74-stable-responsive-nav */
(function(){
  const labels={home:'الرئيسية',cart:'السلة',orders:'الطلبات',reviews:'التقييمات'};
  function current(){
    return document.body.dataset.page || 'home';
  }
  function sync(){
    document.querySelectorAll('.jump-nav.app-nav a[data-view]').forEach(a=>{
      const text=labels[a.dataset.view]||a.textContent.trim();
      if(a.textContent!==text) a.textContent=text;
      a.classList.toggle('active-nav',a.dataset.view===current() || (current()==='game'&&a.dataset.view==='home'));
      a.classList.remove('primary');
    });
    const support=document.querySelector('.jump-nav.app-nav a.support-link');
    if(support && support.textContent!=='الدعم') support.textContent='الدعم';
  }
  const oldShow=window.mobaShowView;
  if(typeof oldShow==='function'){
    window.mobaShowView=function(view){
      const r=oldShow.apply(this,arguments);
      requestAnimationFrame(sync);
      return r;
    };
  }
  window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
  document.addEventListener('DOMContentLoaded',sync);
  setTimeout(sync,120);
})();


/* moba-v77-home-compact-first */
(function(){
  function arrangeHome(){
    const nav=document.querySelector('.jump-nav.app-nav');
    const games=document.getElementById('gamesHome');
    const trust=document.getElementById('trustHeroV62');
    if(nav && games && nav.nextElementSibling!==games){
      nav.insertAdjacentElement('afterend',games);
    }
    if(games && trust && trust.parentElement!==games){
      games.insertAdjacentElement('afterbegin',trust);
    }
  }
  arrangeHome();
  document.addEventListener('DOMContentLoaded',arrangeHome);
  setTimeout(arrangeHome,120);
})();
