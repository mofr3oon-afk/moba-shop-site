/* moba-v109-pharaoh-single-flow-controller */
(function(){
  if(window.__mobaV109SingleFlow)return;
  window.__mobaV109SingleFlow=true;
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const state={expected:'',active:false,lastError:''};
  const labels={
    id:{title:'تمام، هات ID الحساب',small:'اكتب PUBG ID أرقام فقط',errorTitle:'مطلوب PUBG ID',errorSmall:'اكتب الايدي أرقام فقط من 5 لـ 15 رقم.'},
    name:{title:'تمام، هات اسم الحساب',small:'اكتب اسم الحساب داخل اللعبة',errorTitle:'مطلوب اسم الحساب',errorSmall:'اكتب اسم الحساب داخل اللعبة بوضوح.'},
    phone:{title:'تمام، هات رقم متابعة الطلب',small:'اكتب رقم موبايل يبدأ بـ 01 لمتابعة حالة الطلب',errorTitle:'مطلوب رقم الموبايل',errorSmall:'اكتب رقم متابعة الطلب 11 رقم ويبدأ بـ 01.'},
    last3:{title:'اكتب آخر 3 أرقام',small:'اكتب آخر 3 أرقام من الرقم اللي حولت منه',errorTitle:'مطلوب آخر 3 أرقام',errorSmall:'اكتب 3 أرقام فقط من الرقم اللي تم التحويل منه.'}
  };
  function api(){return window.__pharaohV91;}
  function input(){return qs('#pharaohChatInput');}
  function body(){return qs('#pharaohChatBody');}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function digitsOnly(text){
    return String(text||'')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/\D/g,'');
  }
  function validName(raw){
    const t=String(raw||'').trim();
    if(t.length<2)return false;
    if(/^\d+$/.test(t))return false;
    return true;
  }
  function addUser(text){
    const b=body(); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg user pharaoh-brain-new';
    m.textContent=String(text||'');
    const ty=qs('#pharaohTyping',b);
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function lastBotCard(){
    const cards=qsa('#pharaohChatBody .pharaoh-msg.bot .pharaoh-v85-card, #pharaohChatBody .pharaoh-msg.bot .pharaoh-assist-pro-card');
    return cards.length?cards[cards.length-1]:null;
  }
  function inferStep(){
    const card=lastBotCard();
    const t=card?(card.innerText||''):'';
    if(!t)return '';
    if(/(هات\s*اسم\s*الحساب|اكتب\s*اسم\s*الحساب|اسم\s*الحساب\s*داخل)/i.test(t))return 'name';
    if(/(هات\s*رقم\s*متابعة|هات\s*رقم\s*متابعه|رقم\s*موبايل\s*يبدأ|رقم\s*موبايل\s*يبدا|متابعة\s*حالة\s*الطلب)/i.test(t))return 'phone';
    if(/(آخر\s*3|اخر\s*3|3\s*أرقام|3\s*ارقام|الرقم\s*اللي\s*حولت)/i.test(t))return 'last3';
    if(/(هات\s*(PUBG\s*)?ID|اكتب\s*(PUBG\s*)?ID|PUBG\s*ID|ID\s*الحساب|هات\s*الايدي|اكتب\s*الايدي)/i.test(t))return 'id';
    return '';
  }
  function actionsHtml(){
    return '<div class="pharaoh-v109-actions pharaoh-v109-actions--single">'
      +'<button type="button" class="danger" data-v109-act="cancel">الغاء</button>'
      +'</div>';
  }
  function decorate(step,mode){
    const cfg=labels[step]; if(!cfg)return;
    const card=lastBotCard(); if(!card)return;
    card.dataset.v109Step=step;
    card.classList.toggle('v109-error',mode==='error');
    let b=card.querySelector('b');
    if(!b){b=document.createElement('b'); card.prepend(b);}
    b.textContent=(mode==='error'?cfg.errorTitle:cfg.title);
    let sm=card.querySelector('small');
    if(!sm){sm=document.createElement('small'); b.insertAdjacentElement('afterend',sm);}
    sm.textContent=(mode==='error'?cfg.errorSmall:cfg.small);
    card.querySelectorAll('.pharaoh-v108-actions,.pharaoh-v109-actions').forEach(x=>x.remove());
    card.insertAdjacentHTML('beforeend',actionsHtml());
  }
  function setExpected(step,mode){
    state.expected=step||'';
    state.active=!!step;
    if(step)setTimeout(()=>decorate(step,mode||'normal'),0);
  }
  function clearExpected(){state.expected='';state.active=false;state.lastError='';}
  function currentStep(){return state.expected||inferStep();}
  function focusInput(clear){const i=input(); if(!i)return; if(clear)i.value=''; try{i.focus()}catch(e){}}
  function reject(step,raw){
    addUser(raw);
    setExpected(step,'error');
    focusInput(true);
    return true;
  }
  function accept(step,raw,value){
    const a=api();
    addUser(raw);
    const i=input(); if(i)i.value='';
    try{ if(a){ a.state=a.state||{}; a.state.active=true; a.state.startedAt=Date.now(); } }catch(e){}
    if(a){
      if(step==='id' && typeof a.askName==='function') a.askName(value);
      else if(step==='name' && typeof a.askPayment==='function') a.askPayment(value);
      else if(step==='phone' && typeof a.askTransfer==='function') a.askTransfer(value);
      else if(step==='last3'){
        if(a.state) a.state.transferLast3 = value;
        if(typeof a.summary==='function') a.summary();
        else if(typeof a.consumeText==='function') a.consumeText(value);
      } else if(typeof a.consumeText==='function') a.consumeText(value);
    }
    if(step==='id')setExpected('name','normal');
    else clearExpected();
    return true;
  }
  function processSend(){
    const i=input(); const raw=String(i&&i.value||'').trim();
    if(!raw)return false;
    const step=currentStep();
    if(!step)return false;
    const ds=digitsOnly(raw);
    if(/^(الغي|الغاء|إلغاء|كنسل|cancel)$/i.test(raw)){
      const a=api(); if(a&&typeof a.handle==='function')a.handle('cancel'); clearExpected(); if(i)i.value=''; return true;
    }
    if(step==='id'){
      if(/^\d{5,15}$/.test(ds))return accept(step,raw,ds);
      return reject(step,raw);
    }
    if(step==='name'){
      if(validName(raw))return accept(step,raw,raw);
      return reject(step,raw);
    }
    if(step==='phone'){
      if(/^01\d{9}$/.test(ds))return accept(step,raw,ds);
      return reject(step,raw);
    }
    if(step==='last3'){
      if(/^\d{3}$/.test(ds))return accept(step,raw,ds);
      return reject(step,raw);
    }
    return false;
  }
  document.addEventListener('click',function(e){
    const send=e.target.closest&&e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');
    if(send&&send.closest('#pharaohChatForm')&&processSend()){
      e.preventDefault(); e.stopImmediatePropagation(); return false;
    }
  },true);
  document.addEventListener('submit',function(e){
    if(e.target&&e.target.id==='pharaohChatForm'&&processSend()){
      e.preventDefault(); e.stopImmediatePropagation(); return false;
    }
  },true);
  document.addEventListener('keydown',function(e){
    if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'&&processSend()){
      e.preventDefault(); e.stopImmediatePropagation(); return false;
    }
  },true);
  document.addEventListener('click',function(e){
    const act=e.target.closest&&e.target.closest('[data-v91-act]');
    if(!act)return;
    const a=act.dataset.v91Act;
    const v=act.dataset.v;
    if(a==='combo'||a==='manualPick')setTimeout(()=>setExpected('id','normal'),60);
    else if(a==='transfer'&&String(v)==='other')setTimeout(()=>setExpected('last3','normal'),60);
    else if(['cancel','newOrder','askBudget','manualProducts'].includes(String(a)))clearExpected();
    else if(a==='pay'||a==='paid'||a==='transfer')clearExpected();
  },true);
  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='pharaohShotV91'&&e.target.files&&e.target.files[0])setTimeout(()=>setExpected('phone','normal'),80);
  },true);
  document.addEventListener('click',function(e){
    const btn=e.target.closest&&e.target.closest('[data-v109-act]');
    if(!btn)return;
    e.preventDefault(); e.stopImmediatePropagation();
    const a=btn.dataset.v109Act;
    if(a==='cancel'){
      const apiObj=api();
      if(apiObj&&typeof apiObj.handle==='function')apiObj.handle('cancel');
      clearExpected();
      return false;
    }
  },true);
})();

/* moba-v169-pharaoh-prize-road-and-budget-guard */
(function(){
  if(window.__mobaV169PharaohPrizeRoad)return; window.__mobaV169PharaohPrizeRoad=true;
  function qs(s,r=document){return r.querySelector(s)}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function body(){return qs('#pharaohChatBody')}
  function bot(html){
    const b=body(); if(!b)return;
    const m=document.createElement('div'); m.className='pharaoh-msg bot pharaoh-brain-new'; m.innerHTML=html;
    const ty=qs('#pharaohTyping',b); if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function askPrizeRoad(){
    bot('<div class="pharaoh-v85-card"><b>عايز تشحن طريق الجايزة؟</b><small>فرعون هيكمل معاك نفس خطوات الشحن: ID، اسم الحساب، الدفع، السكرين، وتأكيد الطلب.</small><div class="pharaoh-v85-note">هبدأ لك طلب طريق الجايزة بنفس خطوات الشحن العادية.</div><div class="pharaoh-v85-actions"><button type="button" class="gold" data-v169-prize-confirm>تأكيد شحن طريق الجايزة</button><button type="button" data-v91-act="manualProducts">اختار منتج تاني</button></div></div>');
  }
  function startPrizeRoad(){
    const api=window.__pharaohV91;
    if(!api||!api.state){askPrizeRoad();return}
    const dyn=Array.isArray(window.mobaPharaohDynamicProducts)?window.mobaPharaohDynamicProducts:[];
    const flat=window.mobaProducts&&typeof window.mobaProducts==='object'?Object.values(window.mobaProducts).flat():[];
    const found=[...dyn,...flat].find(p=>/(طريق\s*الجايز|طريق\s*الجائزة|prize\s*road)/i.test(String(p.name||p.product||'')))||{};
    const productName=found.name||found.product||'طريق الجايزة';
    const productPrice=Number(found.sale_price||found.price||0);
    const productUc=Number(found.uc||0);
    api.state.active=true;
    api.state.startedAt=Date.now();
    api.state.step='id';
    api.state.items=[{product:productName,type:found.type||'عرض خاص',price:productPrice,uc:productUc,qty:1,qtyTotal:1,ucTotal:productUc,game:found.game||'PUBG Mobile',noQty:true}];
    bot('<div class="pharaoh-v85-card"><b>تمام، هات ID الحساب</b><small>اكتب PUBG ID أرقام فقط، وبعدها هسألك عن اسم الحساب.</small><div class="pharaoh-v85-note">المنتج: '+esc(productName)+(productPrice?' - '+productPrice.toLocaleString('en-US')+' جنيه':'')+'</div></div>');
  }
  function isPrize(text){return /(طريق\s*الجايز|طريق\s*الجائزة|الجايز|الجائزة|prize\s*road)/i.test(String(text||''))}
  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('[data-v169-prize-confirm]');
    if(!b)return;
    e.preventDefault(); e.stopImmediatePropagation(); startPrizeRoad(); return false;
  },true);
  document.addEventListener('click',function(e){
    const send=e.target.closest&&e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');
    if(!send||!send.closest('#pharaohChatForm'))return;
    const input=qs('#pharaohChatInput'); const text=input&&input.value;
    if(isPrize(text)){e.preventDefault();e.stopImmediatePropagation(); if(input)input.value=''; const b=body(); if(b){const u=document.createElement('div');u.className='pharaoh-msg user pharaoh-brain-new';u.textContent=String(text||'');b.appendChild(u)} startPrizeRoad(); return false}
  },true);
  document.addEventListener('submit',function(e){
    if(!e.target||e.target.id!=='pharaohChatForm')return;
    const input=qs('#pharaohChatInput'); const text=input&&input.value;
    if(isPrize(text)){e.preventDefault();e.stopImmediatePropagation(); if(input)input.value=''; startPrizeRoad(); return false}
  },true);
})();

/* moba-v167-pharaoh-dynamic-products */
(function(){
  if(window.__mobaV167PharaohDynamic)return;
  window.__mobaV167PharaohDynamic=true;
  const state={loaded:false,items:[],seen:new Set()};
  function qs(s,r=document){return r.querySelector(s)}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function norm(v){return String(v||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
  async function load(){
    if(state.loaded)return state.items;
    state.loaded=true;
    try{
      const r=await fetch('/api/settings?t='+Date.now());
      const j=await r.json();
      const list=j?.settings?.dynamic_products;
      state.items=Array.isArray(list)?list.filter(p=>p&&p.hidden!==true&&p.active!==false).map((p,i)=>({i,name:String(p.name||p.title||'عرض').trim(),price:Number(p.sale_price||p.price||0),section:String(p.cat||p.section||p.game||'العروض').trim()})):[];
      window.mobaPharaohDynamicProducts=state.items;
    }catch(e){state.items=[]}
    return state.items;
  }
  function bot(html){
    const body=qs('#pharaohChatBody');if(!body)return;
    const m=document.createElement('div');m.className='pharaoh-msg bot pharaoh-brain-new';m.innerHTML=html;
    const typing=qs('#pharaohTyping',body);if(typing&&typing.parentElement===body)body.insertBefore(m,typing);else body.appendChild(m);
    body.scrollTop=body.scrollHeight;
  }
  function openProducts(){
    try{document.body.dataset.page='game';location.hash='productsSection';document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  }
  async function respond(text){
    const items=await load();if(!items.length)return;
    const raw=String(text||'');
    const t=norm(raw);
    const hasBudget=/معايا|معي|ميزانية|ميزانيه|رشح|ترشيح|جنيه|جم|egp|budget/i.test(raw);
    const amount=Number((raw.match(/[0-9٠-٩]+/g)||[]).join('').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)))||0;
    if(hasBudget && amount) return;
    function wholeHit(name){
      const n=norm(name); if(!n || n.length<3) return false;
      if(n.length<=3 && /^\d+$/.test(n)) return false;
      const safe=n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp('(^|\\s)'+safe+'($|\\s)','u').test(t);
    }
    const list=items.filter(p=>wholeHit(p.name)).slice(0,3);
    if(!list.length)return;
    const key=t+'|'+list.map(p=>p.name).join(',');
    if(state.seen.has(key))return;state.seen.add(key);
    bot(`<div class="pharaoh-v85-card"><b>لقيتلك المنتج ده</b><small>اختار المنتج المناسب وكمّل الشحن بنفس خطوات الطلب.</small>${list.map(p=>`<div class="pharaoh-v85-note"><b>${esc(p.name)}</b> - ${Number(p.price||0).toLocaleString('en-US')} جنيه<br><small>${esc(p.section)}</small></div>`).join('')}<div class="pharaoh-v85-actions"><button type="button" class="gold" data-v167-open-products>افتح المنتجات</button></div></div>`);
  }
  document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('[data-v167-open-products]');if(b){e.preventDefault();e.stopImmediatePropagation();openProducts();return false}},true);
  document.addEventListener('DOMContentLoaded',function(){
    load();
    const body=qs('#pharaohChatBody');if(!body||!('MutationObserver' in window))return;
    new MutationObserver(muts=>muts.forEach(m=>m.addedNodes&&m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.classList&&n.classList.contains('user'))respond(n.textContent||'')}))).observe(body,{childList:true});
  });
})();


/* moba-v107-pharaoh-master-context-first */
(function(){
  if(true)return; // disabled in v110 to prevent duplicate context handling
  if(window.__mobaV107MasterContext)return;
  window.__mobaV107MasterContext=true;
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function panel(){return qs('#pharaohChatPanel')}
  function body(){return qs('#pharaohChatBody')}
  function input(){return qs('#pharaohChatInput')}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function digitsOnly(text){return String(text||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,'')}
  function lastBotText(){
    const bots=qsa('.pharaoh-msg.bot',body()||document);
    return (bots.slice(-2).map(x=>x.innerText||'').join('\n')||'').slice(-1200);
  }
  function addUser(t){
    const b=body(); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg user pharaoh-brain-new';
    m.textContent=String(t||'');
    const ty=qs('#pharaohTyping',b);
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  let lastGuard='';
  function guard(title,small){
    const key=title+'|'+small;
    if(lastGuard===key) return;
    lastGuard=key;
    setTimeout(()=>{ if(lastGuard===key) lastGuard=''; },2500);
    const b=body(); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg bot pharaoh-brain-new moba-v107-guard';
    m.innerHTML='<div class="pharaoh-v85-card"><b>'+esc(title)+'</b><small>'+esc(small)+'</small><div class="pharaoh-v85-actions"><button type="button" class="gold" data-v91-act="newOrder">إعادة من الأول</button><button type="button" data-v91-act="cancel">إلغاء</button></div></div>';
    const ty=qs('#pharaohTyping',b);
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function asksId(ctx){return /(هات\s*(pubg\s*)?id|اكتب\s*(pubg\s*)?id|pubg\s*id|id\s*الحساب|رقم\s*الحساب|مطلوب\s*pubg\s*id|مطلوب\s*id|هات\s*الايدي|هات\s*الأيدي|اكتب\s*الايدي|اكتب\s*الأيدي|اكتب\s*ايدي)/i.test(ctx)}
  function asksPhone(ctx){return /(هات\s*رقم\s*متابعة|هات\s*رقم\s*متابعه|رقم\s*متابعة\s*الطلب|رقم\s*متابعه\s*الطلب|رقم\s*الموبايل|رقم\s*موبايل|يبدأ\s*بـ?\s*01|يبدا\s*بـ?\s*01|مطلوب\s*رقم\s*الموبايل|مطلوب\s*رقم\s*التلفون)/i.test(ctx)}
  function asksLast3(ctx){return /(آخر\s*3|اخر\s*3|3\s*أرقام|3\s*ارقام|مطلوب\s*آخر\s*3|مطلوب\s*اخر\s*3|رقم\s*التحويل|حولت\s*منه)/i.test(ctx)}
  function asksName(ctx){return /(هات\s*اسم\s*الحساب|اكتب\s*اسم\s*الحساب|اسم\s*الحساب\s*داخل\s*اللعبة|اسم\s*الحساب\s*داخل\s*اللعبه|مطلوب\s*اسم\s*الحساب)/i.test(ctx)}
  function isCancel(raw){return /^(الغي|الغاء|إلغاء|كنسل|cancel|بلاش|وقف)$/i.test(String(raw||'').trim())}
  function isReset(raw){return /^(اعادة|إعادة|اعاده|إعاده|ابدا من الاول|ابدأ من الاول|ريست|reset|طلب جديد)$/i.test(String(raw||'').trim())}
  function handleContext(raw){
    const a=window.__pharaohV91;
    const ctx=lastBotText();
    const ds=digitsOnly(raw);
    if(!a) return false;
    if(isCancel(raw)){ addUser(raw); a.handle&&a.handle('cancel'); return true; }
    if(isReset(raw)){ addUser(raw); a.start&&a.start(); return true; }
    if(asksId(ctx)){
      addUser(raw);
      try{a.state&&(a.state.active=true,a.state.startedAt=Date.now())}catch(e){}
      if(/^\d{5,15}$/.test(ds)){
        if(typeof a.askName==='function') a.askName(ds); else a.consumeText&&a.consumeText(ds);
      }else{
        guard('مطلوب PUBG ID','اكتب الايدي أرقام فقط من 5 لـ 15 رقم أو اختار إلغاء / إعادة من الأول.');
      }
      return true;
    }
    if(asksPhone(ctx)){
      addUser(raw);
      try{a.state&&(a.state.active=true,a.state.startedAt=Date.now())}catch(e){}
      if(/^01\d{9}$/.test(ds)){
        if(typeof a.askTransfer==='function') a.askTransfer(ds); else a.consumeText&&a.consumeText(ds);
      }else{
        guard('مطلوب رقم الموبايل','اكتب رقم متابعة الطلب 11 رقم ويبدأ بـ 01 أو اختار إلغاء / إعادة من الأول.');
      }
      return true;
    }
    if(asksLast3(ctx)){
      addUser(raw);
      try{a.state&&(a.state.active=true,a.state.startedAt=Date.now())}catch(e){}
      if(/^\d{3}$/.test(ds)){
        if(a.state){a.state.transferLast3=ds; a.state.step='confirm'}
        if(typeof a.summary==='function') a.summary(); else a.consumeText&&a.consumeText(ds);
      }else{
        guard('مطلوب آخر 3 أرقام','اكتب 3 أرقام فقط من رقم التحويل أو اختار إلغاء / إعادة من الأول.');
      }
      return true;
    }
    if(asksName(ctx)){
      addUser(raw);
      const name=String(raw||'').trim();
      if(name.length>=2 && !(ds && ds===name)){
        if(typeof a.askPayment==='function') a.askPayment(name); else a.consumeText&&a.consumeText(name);
      }else{
        guard('مطلوب اسم الحساب','اكتب اسم الحساب داخل اللعبة بوضوح أو اختار إلغاء / إعادة من الأول.');
      }
      return true;
    }
    return false;
  }
  function submitNow(e){
    const inp=input();
    const raw=String(inp&&inp.value||'').trim();
    if(!raw)return false;
    if(handleContext(raw)){
      if(inp)inp.value='';
      e&&e.preventDefault&&e.preventDefault();
      e&&e.stopImmediatePropagation&&e.stopImmediatePropagation();
      return true;
    }
    return false;
  }
  document.addEventListener('click',function(e){
    const target=e.target;
    const btn=target&&target.closest&&target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn):not([data-v91-act]):not([data-v65-act]):not([data-v67-act]):not([data-pharaoh-q])');
    if(btn&&btn.closest('#pharaohChatForm')&&submitNow(e)) return false;
  },true);
  document.addEventListener('submit',function(e){
    if(e.target&&e.target.id==='pharaohChatForm'&&submitNow(e)) return false;
  },true);
  document.addEventListener('keydown',function(e){
    if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'&&submitNow(e)) return false;
  },true);
})();

/* pharaoh-v19-assistant */
(function(){
  const fab = document.getElementById('pharaohAssistantFab');
  const panel = document.getElementById('pharaohChatPanel');
  const closeBtn = document.getElementById('pharaohClose');
  const body = document.getElementById('pharaohChatBody');
  const form = document.getElementById('pharaohChatForm');
  const input = document.getElementById('pharaohChatInput');
  const typing = document.getElementById('pharaohTyping');
  if(!fab || !panel) return;
  
  // move the assistant and panel directly under body so it can roam freely above the whole site
  if(fab.parentElement !== document.body) document.body.appendChild(fab);
  if(panel.parentElement !== document.body) document.body.appendChild(panel);

  let drag = false, moved = false, startX = 0, startY = 0, baseX = 0, baseY = 0;

  function getPoint(ev){
    if(ev.touches && ev.touches[0]) return {x: ev.touches[0].clientX, y: ev.touches[0].clientY};
    if(ev.changedTouches && ev.changedTouches[0]) return {x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY};
    return {x: ev.clientX, y: ev.clientY};
  }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function loadPos(){
    try{
      const p = JSON.parse(localStorage.getItem('pharaoh_assistant_pos') || 'null');
      if(p && typeof p.x === 'number' && typeof p.y === 'number'){
        fab.style.left = p.x + 'px';
        fab.style.top = p.y + 'px';
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
        return;
      }
    }catch(e){}
    fab.style.left = (window.innerWidth - fab.offsetWidth - 12) + 'px';
    fab.style.top = (window.innerHeight - fab.offsetHeight - 86) + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  }
  function savePos(){
    const rect = fab.getBoundingClientRect();
    localStorage.setItem('pharaoh_assistant_pos', JSON.stringify({x:rect.left,y:rect.top}));
  }
  function clampFab(){
    const maxX = Math.max(0, window.innerWidth - fab.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - fab.offsetHeight);
    const rect = fab.getBoundingClientRect();
    fab.style.left = clamp(rect.left, 0, maxX) + 'px';
    fab.style.top = clamp(rect.top, 0, maxY) + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  }
  function positionPanel(){
    const r = fab.getBoundingClientRect();
    const pw = Math.min(430, window.innerWidth - 24);
    const ph = Math.min(640, window.innerHeight - 120);
    let left = r.left - pw + fab.offsetWidth + 8;
    let top = r.top - ph - 10;
    if(top < 10) top = r.bottom + 10;
    left = clamp(left, 10, window.innerWidth - pw - 10);
    top = clamp(top, 10, window.innerHeight - ph - 10);
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.width = pw + 'px';
    panel.style.height = ph + 'px';
  }
  function togglePanel(show){
    const willShow = typeof show === 'boolean' ? show : !panel.classList.contains('show');
    if(willShow){
      positionPanel();
      panel.classList.add('show');
      fab.classList.remove('has-notify');
      setTimeout(()=>input && input.focus(),120);
    } else {
      panel.classList.remove('show');
    }
  }
  function onMove(ev){
    if(!drag) return;
    const pt = getPoint(ev);
    const dx = pt.x - startX;
    const dy = pt.y - startY;
    if(Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    const maxX = Math.max(0, window.innerWidth - fab.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - fab.offsetHeight);
    fab.style.left = clamp(baseX + dx, 0, maxX) + 'px';
    fab.style.top = clamp(baseY + dy, 0, maxY) + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    if(panel.classList.contains('show')) positionPanel();
    if(ev.cancelable) ev.preventDefault();
  }
  function endDrag(ev){
    if(!drag) return;
    drag = false;
    document.body.classList.remove('pharaoh-is-dragging');
    fab.classList.remove('dragging');
    if(moved){
      fab.classList.add('drop-bounce');
      setTimeout(()=>fab.classList.remove('drop-bounce'), 760);
    }
    savePos();
    if(!moved) togglePanel();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', endDrag);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', endDrag);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
  }
  function startDrag(ev){
    const pt = getPoint(ev);
    drag = true; moved = false;
    document.body.classList.add('pharaoh-is-dragging');
    fab.classList.remove('drop-bounce');
    fab.classList.add('dragging');
    const r = fab.getBoundingClientRect();
    startX = pt.x; startY = pt.y;
    baseX = r.left; baseY = r.top;
    fab.style.left = baseX + 'px';
    fab.style.top = baseY + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    window.addEventListener('mousemove', onMove, {passive:false});
    window.addEventListener('mouseup', endDrag, {passive:false});
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', endDrag, {passive:false});
    window.addEventListener('pointermove', onMove, {passive:false});
    window.addEventListener('pointerup', endDrag, {passive:false});
    window.addEventListener('pointercancel', endDrag, {passive:false});
    if(ev.cancelable) ev.preventDefault();
  }
  fab.addEventListener('mousedown', startDrag, {passive:false});
  fab.addEventListener('touchstart', startDrag, {passive:false});
  fab.addEventListener('pointerdown', startDrag, {passive:false});

  closeBtn && closeBtn.addEventListener('click', ()=>togglePanel(false));
  window.addEventListener('resize', ()=>{ clampFab(); savePos(); if(panel.classList.contains('show')) positionPanel(); });

  function esc(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function addMsg(type, html){
    const msg = document.createElement('div');
    msg.className = 'pharaoh-msg ' + type;
    msg.innerHTML = html;
    const typingEl = document.getElementById('pharaohTyping');
    body.insertBefore(msg, typingEl);
    body.scrollTop = body.scrollHeight;
  }
  function goTo(sel){
    const el = document.querySelector(sel);
    if(el){
      togglePanel(false);
      setTimeout(()=>el.scrollIntoView({behavior:'smooth', block:'start'}),100);
    }
  }

  function replyFor(q){
    const raw = String(q||'');
    const t = raw.toLowerCase();

    const mode = window.mobaStoreMode || (window.mobaBusyMode ? 'busy' : 'available');
    const busy = mode === 'busy';
    const closed = mode === 'closed';
    const supportLink = `<a href="https://t.me/MOFR3OON" target="_blank" style="color:#7ee7ff;font-weight:900">فتح الدعم على تليجرام 📞</a>`;

    if(/عايز اشحن|ازاي اشحن|اشحن|اطلب|طلب جديد/.test(t) && !/متابعة|قديم|قديمة|مشكلة/.test(t)){
      return `تمام يا بطل 👑<br>هتشحن لنفس ID ولا أكتر من ID؟
      <div class="pharaoh-mini-question">
        <button type="button" data-pharaoh-action="products">نفس ID 🎮</button>
        <button type="button" data-pharaoh-q="اكتر من ID">أكتر من ID</button>
      </div>
      <div class="pharaoh-small-note">اختار الباقة، اكتب ID واسم الحساب، ضيف للسلة، وبعد التحويل ارفع السكرين.</div>`;
    }

    if(/اكتر من id|اكثر من id|ids|ايدي مختلف|ايديات|اكتر من ايدي|اكتر من شحنة/.test(t)){
      return `ينفع تعمل كذا شحنة بـ IDs مختلفة في نفس الطلب ✅<br>
      كل باقة اكتب لها ID واسم الحساب بتوعها، وبعدها ضيفها للسلة.<br>
      كرر نفس الخطوة لأي ID تاني.`;
    }

    if(/نفس id|نفس الايدي|كمية|مرتين|كرر|تكرار/.test(t)){
      return `لو هتشحن لنفس ID أكتر من مرة، استخدم عداد الكمية أو ضيف نفس الباقة للسلة حسب المتاح.<br>
      راجع إجمالي UC والسعر قبل الدفع 👑`;
    }

    if(/دفع|فودافون|انستا|insta|wallet|محفظ|حولت|تحويل/.test(t)){
      return `طرق الدفع المتاحة داخل الموقع:<br>
      🟢 InstaPay<br>📱 Wallet<br><br>
      بعد التحويل ارفع السكرين. لو التحويل من محل أو رقم تاني، اكتب آخر 3 أرقام في الملاحظات.`;
    }

    if(/ميعاد|مواعيد|وقت|امتى|متاح/.test(t)){
      return `مواعيد العمل:<br>
      يوميًا من 12 صباحًا حتى 5 الفجر.<br>
      الاثنين والأربعاء والخميس والجمعة من 3 العصر حتى 5 الفجر.<br><br>
      تقدر تعمل الطلب في أي وقت، والتنفيذ داخل مواعيد العمل.`;
    }

    if(/فين طلبي|الاوردر فين|اوردر فين|متابعة|حالة|طلبي|order/.test(t)){
      return `اكتب نفس رقم الموبايل اللي عملت بيه الطلب في سجل الطلبات، وهظهرلك آخر طلباتك كلها 📦<br><br>
      <span class="mini-action" data-pharaoh-action="track">افتح سجل الطلبات</span>`;
    }

    if(/الطلبات القديمة|سجل|قديمة|قديم|طلباتي/.test(t)){
      return `عشان تشوف الطلبات القديمة، اكتب رقم الموبايل في سجل الطلبات.<br>
      بعد كده تقدر تختار: الجميع / معلق / مكتمل / ملغي.<br><br>
      <span class="mini-action" data-pharaoh-action="track">روح لسجل الطلبات 📦</span>`;
    }

    if(/اتأخر|اتأخر|لسه متشحنش|متشحنش|واقف|تأخير|تاخير/.test(t)){
      return closed
        ? `المتجر خارج مواعيد التنفيذ 👑<br>تقدر تعمل طلبك عادي، وأول ما مواعيد العمل تبدأ هنبدأ تنفيذ الطلبات بالترتيب.`
        : busy
        ? `فيه ضغط طلبات حاليًا 👑<br>طلبك ممكن ياخد وقت أطول شوية. تابع الحالة من سجل الطلبات بنفس رقم الموبايل.`
        : `ممكن الطلب تحت المراجعة أو قيد التنفيذ. افتح سجل الطلبات برقمك وشوف آخر تحديث. لو محتاج تعديل، هتلاقي زر واضح داخل التفاصيل.`;
    }

    if(/مشكلة|غلط|عدل|تعديل|مش واضح|سكرين|screen|id|ايدي|رقم/.test(t)){
      return `ايه نوع المشكلة؟ 👑
      <div class="pharaoh-problem-grid">
        <button type="button" data-pharaoh-q="ID غلط">ID غلط</button>
        <button type="button" data-pharaoh-q="سكرين غير واضح">سكرين غير واضح</button>
        <button type="button" data-pharaoh-q="رقم التحويل غلط">رقم التحويل</button>
        <button type="button" data-pharaoh-q="الطلب اتأخر">الطلب اتأخر</button>
        <button type="button" data-pharaoh-q="عايز دعم">عايز دعم</button>
      </div>`;
    }

    if(/سكرين|screen|مش واضح|الصورة/.test(t)){
      return `ارفع سكرين جديد واضح من تفاصيل الطلب 📸<br>
      لازم يظهر فيه الرقم أو الاسم، المبلغ، ووقت التحويل.<br>
      افتح سجل الطلبات برقمك واضغط على الطلب، هتلاقي زر رفع السكرين الجديد.`;
    }

    if(/id غلط|ايدي غلط|ال id غلط|كتبت id|كتبت الايدي/.test(t)){
      return `افتح سجل الطلبات برقمك، ولو الطلب لسه محتاج تعديل هتلاقي خانة تكتب فيها ID الصحيح واسم الحساب.<br>
      لو الطلب اتشحن بالفعل، تواصل مع الدعم.`;
    }

    if(/رقم التحويل|رقم غلط|آخر 3|اخر 3|رقم الموبايل/.test(t)){
      return `لو رقم التحويل ناقص أو غلط، افتح الطلب من سجل الطلبات واكتب الرقم الصحيح.<br>
      لو التحويل من محل أو رقم تاني، اكتب آخر 3 أرقام من رقم التحويل.`;
    }

    if(/ازدهار/.test(t)){
      return `<div class="pharaoh-warning-note">
        تنبيه مهم عن الازدهار 👑<br>
        لازم تتأكد الأول إنه متاح على حسابك قبل الطلب، لأن بعض أنواع الازدهار بتكون مرة واحدة فقط على الحساب طول العمر.
      </div>
      لو الازدهار اتشحن قبل كده ومش متاح عندك في اللعبة، الطلب ممكن ماينفعش يتنفذ.`;
    }

    if(/كريستالة|جوهرة|الكريستالة|الجوهرة/.test(t)){
      return `<div class="pharaoh-warning-note">
        الكريستالة أو الجوهرة ليها عدد محدود حسب حسابك ووقت التجديد في اللعبة.
      </div>
      اتأكد من المتاح عندك الأول، وبعدها نفذ الطلب عادي.`;
    }

    if(/كوبون|كود خصم|خصم|coupon/.test(t)){
      return `لو معاك كوبون خصم، اكتبه في خانة الكوبون داخل السلة واضغط تطبيق 🎟️<br>
      لو مش شغال، ممكن يكون:<br>
      • متوقف<br>
      • خاص بمنتج معين<br>
      • محتاج حد أدنى للطلب<br>
      • منتهي<br><br>
      <span class="mini-action" data-pharaoh-action="cart">افتح السلة</span>`;
    }

    if(/مضمون|امان|آمن|خايف|قلقان/.test(t)){
      return `اطمن 👑<br>
      طلبك بيتسجل برقم موبايلك، وتقدر تتابع حالته من سجل الطلبات. ولو في أي مشكلة هيظهرلك تعديل أو دعم مباشر.`;
    }

    if(/busy|ضغط|زحمة|زحمه/.test(t)){
      return closed
        ? `المتجر خارج مواعيد التنفيذ 🔴<br>ينفع تعمل طلبك عادي دلوقتي ✅ طلبك هيتسجل، وأول ما مواعيد العمل تبدأ هيكون من أوائل الطلبات اللي يتم تنفيذها.`
        : busy
        ? `فيه ضغط طلبات حاليًا 👑<br>تقدر تعمل طلبك عادي، بس التنفيذ ممكن ياخد وقت أطول من المعتاد.`
        : `الشحن متاح حاليًا ✅<br>نفذ طلبك وارفع السكرين وهنتابع معاك بسرعة.`;
    }

    if(/تقييم|رأي|راي|نجوم/.test(t)){
      return `تقدر تكتب تقييمك من قسم آراء العملاء، والتقييم بيظهر بعد مراجعة الإدارة.<br><br>
      <span class="mini-action" data-pharaoh-action="reviews">افتح آراء العملاء ⭐</span>`;
    }

    if(/دعم|كلم|تواصل|مساعدة/.test(t)){
      return `لو محتاج تكلم الدعم مباشرة:<br><br>${supportLink}`;
    }

    if(/ضمان|قواعد|سياسة|الشحن/.test(t)){
      return `<div class="pharaoh-info-card">
        <b>🛡️ قواعد الشحن والضمان</b>
        <ul>
          <li>راجع PUBG ID واسم الحساب قبل الدفع.</li>
          <li>ارفع سكرين تحويل واضح.</li>
          <li>لو التحويل من رقم تاني أو محل اكتب آخر 3 أرقام.</li>
          <li>لو في مشكلة عندك فرصتين تعديل قبل تحويل الطلب للدعم.</li>
          <li>التنفيذ حسب ضغط الطلبات ومواعيد العمل.</li>
        </ul>
      </div>`;
    }

    if(/الاكثر|أكثر|طلبا|طلبًا|افضل باقة|باقة/.test(t)){
      return `<div class="pharaoh-info-card">
        <b>🔥 الأكثر طلبًا</b>
        <ul>
          <li><b>60 UC</b> باقة سريعة ومناسبة.</li>
          <li><b>325 UC</b> الأكثر طلبًا.</li>
          <li><b>660 UC</b> قيمة أعلى وشحن أسرع.</li>
        </ul>
      </div>
      <span class="mini-action gold" data-pharaoh-action="products">افتح المنتجات 🎮</span>`;
    }

    return `أنا <b>فرعون</b> 👑 أقدر أساعدك في:<br>
    • طريقة الشحن<br>
    • متابعة الطلبات القديمة والجديدة<br>
    • مشاكل ID أو السكرين أو الرقم<br>
    • الازدهار والكريستالة<br>
    • الكوبونات والخصومات<br>
    • الدعم والمواعيد<br><br>
    جرب تكتب: <b>فين طلبي</b> أو <b>مشكلة في الطلب</b> أو <b>كوبون</b>.`;
  }

  function botReply(q){
    addMsg('user', esc(q));
    typing && typing.classList.add('show');
    setTimeout(()=>{
      typing && typing.classList.remove('show');
      addMsg('bot', replyFor(q));
    }, 420);
  }

  document.addEventListener('click', function(e){
    const quick = e.target.closest('[data-pharaoh-q]');
    if(quick){ botReply(quick.dataset.pharaohQ); }
    const action = e.target.closest('[data-pharaoh-action]');
    if(action){
      const a = action.dataset.pharaohAction;
      if(a==='products') goTo('#productsSection');
      if(a==='track') goTo('#trackOrder');
      if(a==='reviews') goTo('#customerReviews');
      if(a==='rules') botReply('قواعد الشحن');
      if(a==='cart') goTo('#cartSection');
    }
  });

  form && form.addEventListener('submit', function(e){
    e.preventDefault();
    const q = input.value.trim();
    if(!q) return;
    input.value = '';
    botReply(q);
  });

  loadPos();
  setTimeout(()=>{ clampFab(); savePos(); }, 50);
})();


/* pharaoh-v28-override */
(function(){
  function init(){
    const oldFab = document.getElementById('pharaohAssistantFab');
    const panel = document.getElementById('pharaohChatPanel');
    const closeBtn = document.getElementById('pharaohClose');
    const input = document.getElementById('pharaohChatInput');
    if(!oldFab || !panel) return;

    const fab = oldFab.cloneNode(true); // drop old listeners completely
    oldFab.replaceWith(fab);
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    let pos = {x: window.innerWidth - fab.offsetWidth, y: window.innerHeight - fab.offsetHeight};
    try{
      const saved = JSON.parse(localStorage.getItem('pharaoh_assistant_pos_v28') || 'null');
      if(saved && typeof saved.x === 'number' && typeof saved.y === 'number') pos = saved;
    }catch(e){}

    function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
    function applyPos(){
      const maxX = Math.max(0, window.innerWidth - fab.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - fab.offsetHeight);
      pos.x = clamp(pos.x, 0, maxX);
      pos.y = clamp(pos.y, 0, maxY);
      fab.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      localStorage.setItem('pharaoh_assistant_pos_v28', JSON.stringify(pos));
      if(panel.classList.contains('show')) positionPanel();
    }
    function positionPanel(){
      const pw = Math.min(430, window.innerWidth - 24);
      const ph = Math.min(640, window.innerHeight - 120);
      let left = pos.x - pw + fab.offsetWidth + 10;
      let top = pos.y - ph - 10;
      if(top < 8) top = pos.y + fab.offsetHeight + 10;
      left = clamp(left, 8, window.innerWidth - pw - 8);
      top = clamp(top, 8, window.innerHeight - ph - 8);
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.width = pw + 'px';
      panel.style.height = ph + 'px';
    }
    function togglePanel(show){
      const want = typeof show === 'boolean' ? show : !panel.classList.contains('show');
      if(want){ positionPanel(); panel.classList.add('show'); setTimeout(()=>input&&input.focus(),120); }
      else panel.classList.remove('show');
    }
    closeBtn && closeBtn.addEventListener('click', ()=>togglePanel(false));

    let dragging=false, moved=false, startX=0, startY=0, grabX=0, grabY=0;
    function point(e){
      if(e.touches && e.touches[0]) return {x:e.touches[0].clientX, y:e.touches[0].clientY};
      if(e.changedTouches && e.changedTouches[0]) return {x:e.changedTouches[0].clientX, y:e.changedTouches[0].clientY};
      return {x:e.clientX, y:e.clientY};
    }
    function onStart(e){
      const p = point(e);
      dragging = true; moved = false;
      startX = p.x; startY = p.y;
      grabX = p.x - pos.x; grabY = p.y - pos.y;
      fab.classList.remove('drop-bounce');
      fab.classList.add('dragging');
      if(e.cancelable) e.preventDefault();
    }
    function onMove(e){
      if(!dragging) return;
      const p = point(e);
      const nx = p.x - grabX;
      const ny = p.y - grabY;
      if(Math.abs(p.x - startX) + Math.abs(p.y - startY) > 4) moved = true;
      pos.x = nx; pos.y = ny;
      applyPos();
      if(e.cancelable) e.preventDefault();
    }
    function onEnd(e){
      if(!dragging) return;
      dragging = false;
      fab.classList.remove('dragging');
      if(moved){
        fab.classList.add('drop-bounce');
        setTimeout(()=>fab.classList.remove('drop-bounce'), 700);
      } else {
        togglePanel();
      }
      applyPos();
      if(e && e.cancelable) e.preventDefault();
    }

    fab.addEventListener('pointerdown', onStart, {passive:false});
    window.addEventListener('pointermove', onMove, {passive:false});
    window.addEventListener('pointerup', onEnd, {passive:false});
    window.addEventListener('pointercancel', onEnd, {passive:false});
    fab.addEventListener('touchstart', onStart, {passive:false});
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', onEnd, {passive:false});
    fab.addEventListener('mousedown', onStart, {passive:false});
    window.addEventListener('mousemove', onMove, {passive:false});
    window.addEventListener('mouseup', onEnd, {passive:false});
    window.addEventListener('resize', applyPos);
    applyPos();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* pharaoh-v29-effects */
(function(){
  function init(){
    const fab = document.getElementById('pharaohAssistantFab');
    const panel = document.getElementById('pharaohChatPanel');
    const body = document.getElementById('pharaohChatBody');
    const hint = document.getElementById('pharaohHintBubble');
    if(!fab || !panel || !hint) return;

    let openedOnce = localStorage.getItem('pharaoh_opened_once') === '1';
    let autoHintTimer = null;
    let lastContext = '';
    const tips = [
      'محتاج مساعدة؟ اضغط عليا 👑',
      'اسألني عن الشحن أو متابعة الطلب',
      'أقدر أشرحلك الدفع ومواعيد العمل'
    ];
    let tipIndex = 0;

    function showHint(text, tag=''){
      hint.innerHTML = text + (tag ? `<div class="pharaoh-tip-tag">${tag}</div>` : '');
      fab.classList.add('show-hint');
      clearTimeout(autoHintTimer);
      autoHintTimer = setTimeout(()=>fab.classList.remove('show-hint'), 4200);
    }
    function cycleHint(){
      if(panel.classList.contains('show')) return;
      showHint(tips[tipIndex % tips.length]);
      tipIndex++;
    }
    function setPulse(on){ fab.classList.toggle('pulse', !!on); }
    function wave(){
      fab.classList.remove('pharaoh-waving');
      void fab.offsetWidth;
      fab.classList.add('pharaoh-waving');
      setTimeout(()=>fab.classList.remove('pharaoh-waving'), 1100);
    }
    function createParticles(type){
      const host = document.createElement('div');
      host.className = type === 'dust' ? 'pharaoh-dust' : 'pharaoh-particles';
      const count = type === 'dust' ? 7 : 9;
      for(let i=0;i<count;i++){
        const p = document.createElement('span');
        p.className = type === 'dust' ? 'pharaoh-dust-particle' : 'pharaoh-particle';
        const dx = (Math.random()*80 - 40).toFixed(1) + 'px';
        const dy = (type === 'dust' ? -(Math.random()*10) : (Math.random()*-50 - 8)).toFixed(1) + 'px';
        p.style.setProperty('--dx', dx);
        p.style.setProperty('--dy', dy);
        p.style.left = (type === 'dust' ? 44 + Math.random()*20 : 28 + Math.random()*40) + 'px';
        p.style.top = (type === 'dust' ? 102 + Math.random()*12 : 28 + Math.random()*60) + 'px';
        host.appendChild(p);
      }
      fab.appendChild(host);
      setTimeout(()=>host.remove(), 760);
    }

    // welcome
    setTimeout(()=>{ setPulse(true); if(!openedOnce){ wave(); showHint('محتاج مساعدة؟ اضغط عليا 👑'); }}, 1000);
    setInterval(()=>{ if(!openedOnce && !panel.classList.contains('show')) cycleHint(); }, 16000);

    // track panel open/close
    const panelObserver = new MutationObserver(()=>{
      if(panel.classList.contains('show')){
        openedOnce = true;
        localStorage.setItem('pharaoh_opened_once', '1');
        setPulse(false);
        fab.classList.remove('show-hint');
      } else {
        setPulse(true);
      }
    });
    panelObserver.observe(panel, {attributes:true, attributeFilter:['class']});

    // watch drag/drop classes
    const fabObserver = new MutationObserver(()=>{
      const cls = fab.className;
      if(cls.includes('dragging')) createParticles('spark');
      if(cls.includes('drop-bounce')) createParticles('dust');
    });
    fabObserver.observe(fab, {attributes:true, attributeFilter:['class']});

    // contextual hints
    const sectionMap = [
      {id:'productsSection', text:'اختار الباقة واكتب الـ ID واسم الحساب', tag:'قسم المنتجات'},
      {id:'trackOrder', text:'اكتب رقم الموبايل هنا عشان أجيب آخر طلباتك', tag:'سجل الطلبات'},
      {id:'customerReviews', text:'تقدر تكتب تقييمك هنا بعد ما الطلب يكتمل', tag:'آراء العملاء'}
    ];
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting && entry.intersectionRatio > .45){
          const match = sectionMap.find(x=>x.id === entry.target.id);
          if(match && lastContext !== match.id && !panel.classList.contains('show')){
            lastContext = match.id;
            showHint(match.text, match.tag);
          }
        }
      });
    }, {threshold:[.45,.6]});
    sectionMap.forEach(x=>{ const el = document.getElementById(x.id); if(el) io.observe(el); });

    // prettier message add animation already via CSS; add wave when replying
    const bodyObserver = new MutationObserver((mutations)=>{
      const hasNewMsg = mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1 && n.classList && n.classList.contains('pharaoh-msg')));
      if(hasNewMsg && panel.classList.contains('show')) wave();
    });
    if(body) bodyObserver.observe(body, {childList:true, subtree:true});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* moba-v30-pharaoh-busy-late */
(function(){
  const fab = document.getElementById('pharaohAssistantFab');
  const panel = document.getElementById('pharaohChatPanel');
  const statusBox = document.getElementById('workStatusMini');

  function addBotMessage(html){
    const body = document.getElementById('pharaohChatBody');
    const typing = document.getElementById('pharaohTyping');
    if(!body || !typing) return;
    const msg = document.createElement('div');
    msg.className = 'pharaoh-msg bot';
    msg.innerHTML = html;
    body.insertBefore(msg, typing);
    body.scrollTop = body.scrollHeight;
  }
  function openPharaohWith(text){
    if(panel && !panel.classList.contains('show')){
      document.getElementById('pharaohAssistantFab')?.click();
    }
    setTimeout(()=>addBotMessage(text), 250);
  }
  window.askPharaohAboutIssue = function(type){
    const map = {
      bad_screen:'المشكلة إن السكرين مش واضح. ارفع صورة تحويل أوضح من سجل الطلبات، لازم تكون البيانات ظاهرة.',
      bad_id:'المشكلة في PUBG ID أو اسم الحساب. افتح الطلب واكتب ID الصحيح واسم الحساب الصحيح.',
      bad_phone:'المشكلة في رقم المتابعة أو بيانات التحويل. اكتب رقم صحيح 11 رقم أو آخر 3 أرقام من رقم التحويل.'
    };
    openPharaohWith((map[type] || 'افتح الطلب من سجل الطلبات وهتلاقي زر التعديل المطلوب.') + '<br><br>لو احتجت دعم مباشر، استخدم زر الدعم بعد فرص التعديل.');
  };

  async function loadWorkStatus(){
    try{
      const res = await fetch('/api/settings');
      const data = await res.json();
      if(!data.ok) return;
      const rawMode = String(data.settings?.store_status || '').toLowerCase();
      const legacyBusy = data.settings?.busy_mode === true || data.settings?.busy_mode === 'true';
      const mode = rawMode || (legacyBusy ? 'busy' : 'available');
      const customMsg = data.settings?.store_status_message || data.settings?.busy_message || '';
      const config = {
        available:{title:'متاح الآن', desc: customMsg || 'التنفيذ شغال حاليا بشكل طبيعي.', cls:'available'},
        busy:{title:'متاح ولكن فيه ضغط', desc: customMsg || 'تقدر تعمل الأوردر عادي لكن التنفيذ ممكن يتأخر شوية.', cls:'busy'},
        closed:{title:'خارج مواعيد التنفيذ', desc: customMsg || 'ينفع تعمل طلبك عادي دلوقتي ✅ طلبك هيتسجل، وأول ما مواعيد العمل تبدأ هيكون من أوائل الطلبات اللي يتم تنفيذها.', cls:'closed'}
      };
      const current = config[mode] || config.available;
      if(statusBox){
        statusBox.className = `work-status-mini ${current.cls}`;
        statusBox.innerHTML = `<div class="status-head"><span class="status-dot"></span><span>${current.title}</span></div><div class="status-desc">${current.desc}</div>`;
      }
      window.mobaStoreMode = mode;
      window.mobaBusyMode = mode === 'busy';
    }catch(e){}
  }
  loadWorkStatus();
  setInterval(loadWorkStatus, 120000);

  // Pharaoh smart Q: if user says wants to charge, ask if one ID or multiple IDs
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-pharaoh-q]');
    if(btn && /عايز اشحن|اشحن/i.test(btn.dataset.pharaohQ || '')){
      setTimeout(()=>{
        addBotMessage(`تحب تشحن لنفس ID ولا أكتر من ID؟<div class="pharaoh-mini-question">
          <button type="button" data-pharaoh-action="products">نفس ID 🎮</button>
          <button type="button" data-pharaoh-q="اكتر من ID">أكتر من ID</button>
        </div>`);
      }, 650);
    }
  });

  // shrink Pharaoh while user is typing or filling forms on mobile
  function compact(on){
    if(!fab) return;
    fab.classList.toggle('pharaoh-compact', !!on);
  }
  document.addEventListener('focusin', function(e){
    if(e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){
      compact(true);
    }
  });
  document.addEventListener('focusout', function(e){
    setTimeout(()=>compact(false), 250);
  });

  // add ask Pharaoh buttons into fix forms/cards dynamically
  const mo = new MutationObserver(()=>{
    document.querySelectorAll('.fix-form').forEach(form=>{
      if(form.querySelector('.ask-pharaoh-btn')) return;
      const type = form.querySelector('[name="fixType"]')?.value || '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ask-pharaoh-btn';
      btn.textContent = '👑 اسأل فرعون عن المشكلة';
      btn.onclick = () => window.askPharaohAboutIssue(type);
      form.appendChild(btn);
    });
  });
  mo.observe(document.body,{childList:true,subtree:true});

  // Context tips improved
  let lastTip = '';
  const tips = [
    {id:'cartSection', text:'راجع ID واسم الحساب قبل تنفيذ الطلب 👑'},
    {id:'productsSection', text:'تقدر تضيف أكتر من ID في نفس السلة'},
    {id:'trackOrder', text:'اكتب رقمك هنا عشان أجيب طلباتك القديمة والجديدة'}
  ];
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting && entry.intersectionRatio > .5){
        const t = tips.find(x=>x.id === entry.target.id);
        if(t && t.id !== lastTip && !panel?.classList.contains('show')){
          lastTip = t.id;
          const hint = document.getElementById('pharaohHintBubble');
          if(hint && fab){
            hint.innerHTML = t.text;
            fab.classList.add('show-hint');
            setTimeout(()=>fab.classList.remove('show-hint'), 3600);
          }
        }
      }
    });
  },{threshold:[.5]});
  tips.forEach(t=>{ const el=document.getElementById(t.id); if(el) io.observe(el); });
})();


/* moba-v35-pharaoh-extra */
(function(){
  function openAndSay(html){
    const panel = document.getElementById('pharaohChatPanel');
    const fab = document.getElementById('pharaohAssistantFab');
    const body = document.getElementById('pharaohChatBody');
    const typing = document.getElementById('pharaohTyping');
    if(!body || !typing) return;
    if(panel && !panel.classList.contains('show')) fab?.click();
    setTimeout(()=>{
      const msg = document.createElement('div');
      msg.className = 'pharaoh-msg bot';
      msg.innerHTML = html;
      body.insertBefore(msg, typing);
      body.scrollTop = body.scrollHeight;
    },250);
  }

  // If checkout success text appears, Pharaoh gives follow-up
  const obs = new MutationObserver(()=>{
    const txt = document.body.innerText || '';
    if(!window.__pharaohOrderDone && /تم استلام طلبك|تم إرسال الطلب|طلبك اتسجل|تم تنفيذ الطلب/.test(txt)){
      window.__pharaohOrderDone = true;
      const mode = window.mobaStoreMode || (window.mobaBusyMode ? 'busy' : 'available');
    const busy = mode === 'busy';
    const closed = mode === 'closed';
      openAndSay(busy
        ? 'تم استلام طلبك ✅<br>فيه ضغط طلبات حاليًا، تابع الحالة من سجل الطلبات وهيوصلك التحديث هناك.'
        : 'تم استلام طلبك ✅<br>تابع الحالة من سجل الطلبات بنفس رقم الموبايل اللي كتبته.');
    }
  });
  obs.observe(document.body,{childList:true,subtree:true});

  // Welcome messages rotate
  const welcomes = [
    'أهلا بيك في MOBA SHOP 👑 محتاج مساعدة في الشحن؟',
    'أنا فرعون، أقدر أساعدك تتابع طلبك أو تعرف طريقة الشحن.',
    'لو هتشحن لأكتر من ID، ضيف كل باقة للسلة لوحدها.'
  ];
  setTimeout(()=>{
    const hint = document.getElementById('pharaohHintBubble');
    const fab = document.getElementById('pharaohAssistantFab');
    if(hint && fab && !localStorage.getItem('pharaoh_opened_once')){
      hint.innerHTML = welcomes[Math.floor(Math.random()*welcomes.length)];
      fab.classList.add('show-hint');
      setTimeout(()=>fab.classList.remove('show-hint'),4200);
    }
  },1600);
})();


/* moba-v36-pharaoh-buttons-fix */
(function(){
  const replies = {
    'ازاي اشحن': 'تمام يا بطل 👑<br>اختار الباقة، اكتب PUBG ID واسم الحساب، ضيف للسلة، وبعد التحويل ارفع السكرين.',
    'طرق الدفع': 'طرق الدفع المتاحة:<br>🟢 InstaPay<br>📱 Wallet<br><br>بعد التحويل ارفع السكرين، ولو التحويل من رقم تاني اكتب آخر 3 أرقام في الملاحظات.',
    'متابعة الطلب': 'اكتب نفس رقم الموبايل في سجل الطلبات، وهظهرلك آخر طلباتك كلها 📦<br><br><span class="mini-action" data-pharaoh-action="track">افتح سجل الطلبات</span>',
    'الطلبات القديمة': 'اكتب رقم الموبايل في سجل الطلبات، وبعدها اختار: الجميع / معلق / مكتمل / ملغي.',
    'الازدهار': '<div class="pharaoh-warning-note">تنبيه مهم 👑<br>لازم تتأكد إن الازدهار متاح على حسابك قبل الطلب، لأن بعض الأنواع بتكون مرة واحدة فقط على الحساب.</div>',
    'اكتر من ID': 'ينفع تعمل كذا شحنة بـ IDs مختلفة ✅<br>كل باقة اكتب لها ID واسم الحساب بتوعها، وبعدها ضيفها للسلة وكرر لأي ID تاني.',
    'عايز أشحن': 'تمام 👑<br>هتشحن لنفس ID ولا أكتر من ID؟<div class="pharaoh-mini-question"><button type="button" data-pharaoh-action="products">نفس ID 🎮</button><button type="button" data-pharaoh-q="اكتر من ID">أكتر من ID</button></div>',
    'عايز اشحن': 'تمام 👑<br>هتشحن لنفس ID ولا أكتر من ID؟<div class="pharaoh-mini-question"><button type="button" data-pharaoh-action="products">نفس ID 🎮</button><button type="button" data-pharaoh-q="اكتر من ID">أكتر من ID</button></div>',
    'قواعد الشحن': '<div class="pharaoh-info-card"><b>🛡️ قواعد الشحن</b><ul><li>راجع ID واسم الحساب قبل الدفع.</li><li>ارفع سكرين واضح.</li><li>لو التحويل من رقم تاني اكتب آخر 3 أرقام.</li><li>عندك فرصتين تعديل لو فيه مشكلة.</li></ul></div>',
    'الأكثر طلبًا': '<div class="pharaoh-info-card"><b>🔥 الأكثر طلبًا</b><ul><li>60 UC باقة سريعة</li><li>325 UC الأكثر طلبًا</li><li>660 UC قيمة أعلى</li></ul></div><span class="mini-action gold" data-pharaoh-action="products">افتح المنتجات 🎮</span>',
    'مواعيد العمل': 'مواعيد العمل:<br>يوميًا من 12 صباحًا حتى 5 الفجر.<br>الاثنين والأربعاء والخميس والجمعة من 3 العصر حتى 5 الفجر.',
    'الدعم': 'لو محتاج تكلم الدعم مباشرة:<br><br><a href="https://t.me/MOFR3OON" target="_blank" style="color:#7ee7ff;font-weight:900">فتح الدعم على تليجرام 📞</a>',
    'حل مشكلة': 'ايه نوع المشكلة؟ 👑<div class="pharaoh-problem-grid"><button type="button" data-pharaoh-q="ID غلط">ID غلط</button><button type="button" data-pharaoh-q="سكرين غير واضح">سكرين غير واضح</button><button type="button" data-pharaoh-q="رقم التحويل غلط">رقم التحويل</button><button type="button" data-pharaoh-q="الطلب اتأخر">الطلب اتأخر</button><button type="button" data-pharaoh-q="عايز دعم">عايز دعم</button></div>',
    'مشكلة في الطلب': 'ايه نوع المشكلة؟ 👑<div class="pharaoh-problem-grid"><button type="button" data-pharaoh-q="ID غلط">ID غلط</button><button type="button" data-pharaoh-q="سكرين غير واضح">سكرين غير واضح</button><button type="button" data-pharaoh-q="رقم التحويل غلط">رقم التحويل</button><button type="button" data-pharaoh-q="الطلب اتأخر">الطلب اتأخر</button><button type="button" data-pharaoh-q="عايز دعم">عايز دعم</button></div>',
    'ID غلط': 'افتح سجل الطلبات برقمك، ولو الطلب محتاج تعديل هتلاقي خانة تكتب فيها ID الصحيح واسم الحساب.',
    'سكرين غير واضح': 'ارفع سكرين جديد واضح من تفاصيل الطلب 📸<br>لازم يظهر الرقم أو الاسم والمبلغ ووقت التحويل.',
    'رقم التحويل غلط': 'افتح الطلب من سجل الطلبات واكتب الرقم الصحيح أو آخر 3 أرقام من رقم التحويل.',
    'الطلب اتأخر': 'افتح سجل الطلبات وشوف آخر تحديث. لو فيه ضغط طلبات، التنفيذ ممكن ياخد وقت أطول شوية.',
    'عايز دعم': 'تقدر تكلم الدعم مباشرة من هنا:<br><br><a href="https://t.me/MOFR3OON" target="_blank" style="color:#7ee7ff;font-weight:900">فتح الدعم على تليجرام 📞</a>',
    'كوبون': 'لو معاك كوبون، اكتبه في خانة الكوبون داخل السلة واضغط تطبيق 🎟️<br>لو مش شغال ممكن يكون خاص بمنتج معين أو محتاج حد أدنى.',
    'كريستالة': '<div class="pharaoh-warning-note">الكريستالة أو الجوهرة ليها عدد محدود حسب حسابك ووقت التجديد في اللعبة.</div>اتأكد من المتاح عندك الأول وبعدها نفذ الطلب.'
  };

  function body(){ return document.getElementById('pharaohChatBody'); }
  function typing(){ return document.getElementById('pharaohTyping'); }

  function addMsg(type, html){
    const b = body();
    const t = typing();
    if(!b || !t) return;
    const msg = document.createElement('div');
    msg.className = 'pharaoh-msg ' + type;
    msg.innerHTML = html;
    b.insertBefore(msg, t);
    b.scrollTop = b.scrollHeight;
  }

  function answer(q){
    const text = String(q || '').trim();
    if(!text) return;
    addMsg('user', text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
    const t = typing();
    if(t) t.classList.add('show');
    setTimeout(()=>{
      if(t) t.classList.remove('show');
      let reply = replies[text];
      if(!reply){
        const key = Object.keys(replies).find(k => text.includes(k) || k.includes(text));
        reply = key ? replies[key] : 'أنا فرعون 👑 أقدر أساعدك في الشحن، متابعة الطلب، المشاكل، الكوبونات، والدعم.';
      }
      addMsg('bot', reply);
    }, 250);
  }

  function goTo(sel){
    const el = document.querySelector(sel);
    const panel = document.getElementById('pharaohChatPanel');
    if(panel) panel.classList.remove('show');
    if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth', block:'start'}), 100);
  }

  document.addEventListener('click', function(e){
    const qBtn = e.target.closest('[data-pharaoh-q]');
    if(qBtn){
      e.preventDefault();
      e.stopPropagation();
      answer(qBtn.dataset.pharaohQ || qBtn.textContent);
      return;
    }
    const action = e.target.closest('[data-pharaoh-action]');
    if(action){
      e.preventDefault();
      e.stopPropagation();
      const a = action.dataset.pharaohAction;
      if(a === 'products') goTo('#productsSection');
      if(a === 'track') goTo('#trackOrder');
      if(a === 'reviews') goTo('#customerReviews');
      if(a === 'cart') goTo('#cartSection');
      if(a === 'rules') answer('قواعد الشحن');
      return;
    }
  }, true);

  // make mobile keyboard nicer: shrink panel when input focused
  document.addEventListener('focusin', function(e){
    if(e.target && e.target.id === 'pharaohChatInput'){
      const panel = document.getElementById('pharaohChatPanel');
      if(panel) panel.style.height = 'min(360px, calc(100dvh - 95px))';
    }
  });
  document.addEventListener('focusout', function(e){
    if(e.target && e.target.id === 'pharaohChatInput'){
      const panel = document.getElementById('pharaohChatPanel');
      if(panel) panel.style.height = '';
    }
  });
})();


/* moba-v37-pharaoh-send-fix */
(function(){
  const replies = {
    'ازاي اشحن': 'تمام يا بطل 👑<br>اختار الباقة، اكتب PUBG ID واسم الحساب، ضيف للسلة، وبعد التحويل ارفع السكرين.',
    'طرق الدفع': 'طرق الدفع المتاحة:<br>🟢 InstaPay<br>📱 Wallet<br><br>بعد التحويل ارفع السكرين، ولو التحويل من رقم تاني اكتب آخر 3 أرقام في الملاحظات.',
    'متابعة الطلب': 'اكتب نفس رقم الموبايل في سجل الطلبات، وهظهرلك آخر طلباتك كلها 📦<br><br><span class="mini-action" data-pharaoh-action="track">افتح سجل الطلبات</span>',
    'الطلبات القديمة': 'اكتب رقم الموبايل في سجل الطلبات، وبعدها اختار: الجميع / معلق / مكتمل / ملغي.',
    'الازدهار': '<div class="pharaoh-warning-note">تنبيه مهم 👑<br>لازم تتأكد إن الازدهار متاح على حسابك قبل الطلب، لأن بعض الأنواع بتكون مرة واحدة فقط على الحساب.</div>',
    'اكتر من ID': 'ينفع تعمل كذا شحنة بـ IDs مختلفة ✅<br>كل باقة اكتب لها ID واسم الحساب بتوعها، وبعدها ضيفها للسلة وكرر لأي ID تاني.',
    'كوبون': 'لو معاك كوبون، اكتبه في خانة الكوبون داخل السلة واضغط تطبيق 🎟️<br>لو مش شغال ممكن يكون خاص بمنتج معين أو محتاج حد أدنى.',
    'مشكلة': 'ايه نوع المشكلة؟ 👑<div class="pharaoh-problem-grid"><button type="button" data-pharaoh-q="ID غلط">ID غلط</button><button type="button" data-pharaoh-q="سكرين غير واضح">سكرين غير واضح</button><button type="button" data-pharaoh-q="رقم التحويل غلط">رقم التحويل</button><button type="button" data-pharaoh-q="الطلب اتأخر">الطلب اتأخر</button><button type="button" data-pharaoh-q="عايز دعم">عايز دعم</button></div>',
    'حل مشكلة': 'ايه نوع المشكلة؟ 👑<div class="pharaoh-problem-grid"><button type="button" data-pharaoh-q="ID غلط">ID غلط</button><button type="button" data-pharaoh-q="سكرين غير واضح">سكرين غير واضح</button><button type="button" data-pharaoh-q="رقم التحويل غلط">رقم التحويل</button><button type="button" data-pharaoh-q="الطلب اتأخر">الطلب اتأخر</button><button type="button" data-pharaoh-q="عايز دعم">عايز دعم</button></div>',
    'ID غلط': 'افتح سجل الطلبات برقمك، ولو الطلب محتاج تعديل هتلاقي خانة تكتب فيها ID الصحيح واسم الحساب.',
    'سكرين غير واضح': 'ارفع سكرين جديد واضح من تفاصيل الطلب 📸<br>لازم يظهر الرقم أو الاسم والمبلغ ووقت التحويل.',
    'رقم التحويل غلط': 'افتح الطلب من سجل الطلبات واكتب الرقم الصحيح أو آخر 3 أرقام من رقم التحويل.',
    'الطلب اتأخر': 'افتح سجل الطلبات وشوف آخر تحديث. لو فيه ضغط طلبات، التنفيذ ممكن ياخد وقت أطول شوية.',
    'الدعم': '<a href="https://t.me/MOFR3OON" target="_blank" style="color:#7ee7ff;font-weight:900">فتح الدعم على تليجرام 📞</a>'
  };

  function esc(s){
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function body(){ return document.getElementById('pharaohChatBody'); }
  function typing(){ return document.getElementById('pharaohTyping'); }
  function addMsg(type, html){
    const b = body();
    const t = typing();
    if(!b || !t) return;
    const msg = document.createElement('div');
    msg.className = 'pharaoh-msg ' + type;
    msg.innerHTML = html;
    b.insertBefore(msg, t);
    b.scrollTop = b.scrollHeight;
  }
  function getReply(text){
    const q = String(text || '').trim();
    const low = q.toLowerCase();

    if(/فين طلبي|الاوردر فين|متابعة|حالة|طلبي/.test(low)) return replies['متابعة الطلب'];
    if(/قديم|قديمة|طلباتي|سجل/.test(low)) return replies['الطلبات القديمة'];
    if(/ازدهار/.test(low)) return replies['الازدهار'];
    if(/كوبون|خصم|coupon/.test(low)) return replies['كوبون'];
    if(/مشكلة|غلط|تعديل|عدل|مش واضح/.test(low)) return replies['مشكلة'];
    if(/سكرين|screen|صورة/.test(low)) return replies['سكرين غير واضح'];
    if(/id|ايدي/.test(low) && /غلط|تعديل|عدل/.test(low)) return replies['ID غلط'];
    if(/اتأخر|متشحنش|واقف|تاخير|تأخير/.test(low)) return replies['الطلب اتأخر'];
    if(/دعم|كلم|تواصل/.test(low)) return replies['الدعم'];
    if(/دفع|انستا|فودافون|wallet|محفظ/.test(low)) return replies['طرق الدفع'];
    if(/اشحن|اطلب|طلب/.test(low)) return replies['ازاي اشحن'];

    const key = Object.keys(replies).find(k => q.includes(k) || k.includes(q));
    return key ? replies[key] : 'أنا فرعون 👑 أقدر أساعدك في الشحن، متابعة الطلب، المشاكل، الكوبونات، والدعم. جرّب تكتب: فين طلبي أو كوبون أو مشكلة.';
  }
  function sendPharaohMessage(){
    const input = document.getElementById('pharaohChatInput');
    const panel = document.getElementById('pharaohChatPanel');
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;
    const apiV97 = window.__pharaohV91;
    const activeV97 = !!(apiV97 && apiV97.state && apiV97.state.active && Date.now() - Number(apiV97.state.startedAt || 0) < 60*60*1000);
    if(activeV97 && typeof apiV97.consumeText === 'function'){
      input.value = '';
      if(panel) panel.classList.add('show');
      addMsg('user', esc(text));
      apiV97.state.startedAt = Date.now();
      apiV97.consumeText(text);
      return;
    }
    const cleanV97 = String(text).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    const numsV97 = (cleanV97.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20 && n<=200000);
    if(numsV97.length){
      const amountV97 = numsV97[numsV97.length-1];
      input.value = '';
      if(panel) panel.classList.add('show');
      addMsg('user', esc(text));
      addMsg('bot', '<div class="pharaoh-v85-card"><b>فهمت إن معاك '+amountV97.toLocaleString('en-US')+' جنيه</b><small>هطلعلك أفضل ترشيحات تحت الميزانية دي. ينفع تكتبها بأي شكل: 500، 500ج، معايا 500، أو 2000 جنيه.</small></div>');
      setTimeout(()=>{ if(window.__pharaohV91 && typeof window.__pharaohV91.start === 'function') window.__pharaohV91.start(String(amountV97)); }, 80);
      return;
    }
    if(typeof window.__pharaohPriorityTextV97 === 'function' && window.__pharaohPriorityTextV97(text)){
      input.value = '';
      if(panel) panel.classList.add('show');
      return;
    }
    input.value = '';
    if(panel) panel.classList.add('show');

    addMsg('user', esc(text));
    const t = typing();
    if(t) t.classList.add('show');
    setTimeout(()=>{
      if(t) t.classList.remove('show');
      addMsg('bot', getReply(text));
      setTimeout(()=>input.focus(), 50);
    }, 250);
  }

  document.addEventListener('submit', function(e){
    if(e.target && e.target.id === 'pharaohChatForm'){
      e.preventDefault();
      e.stopPropagation();
      sendPharaohMessage();
      return false;
    }
  }, true);

  document.addEventListener('click', function(e){
    const send = e.target.closest('#pharaohSendBtn, #pharaohChatForm button:not(#pharaohMicBtn)');
    if(send && send.closest('#pharaohChatForm')){
      e.preventDefault();
      e.stopPropagation();
      sendPharaohMessage();
      return false;
    }
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.target && e.target.id === 'pharaohChatInput' && e.key === 'Enter'){
      e.preventDefault();
      e.stopPropagation();
      sendPharaohMessage();
      return false;
    }
  }, true);
})();


/* moba-v38-full-site-upgrade */
(function(){
  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function money(n){ try{return Number(n||0).toLocaleString('en-US')}catch(e){return n||0} }
  function cartTotal(){
    return (window.cart||[]).reduce((s,x)=>s+(Number(x.price||0)*Number(x.qty||1)),0);
  }
  function couponInfo(){
    if(window.mobaCouponFinalTotal) return window.mobaCouponFinalTotal();
    const total = cartTotal();
    const disc = window.appliedCoupon ? Math.min(Number(window.appliedCoupon.discount_amount||0),total) : 0;
    return {total,discount:disc,final:Math.max(0,total-disc),code:window.appliedCoupon?.code||''};
  }
  function getPaymentMethod(){
    const checked = qs('input[name="paymentMethod"]:checked');
    return checked ? checked.value : (qs('[name="paymentMethod"]')?.value || localStorage.getItem('moba_preferred_payment') || '');
  }
  // V45 old broad screenshot lock was removed because it blocked unrelated buttons.
  // V65 keeps screenshot validation scoped to #orderForm only.

  // restore preferred payment
  setTimeout(()=>{
    const pref = localStorage.getItem('moba_preferred_payment');
    if(pref){
      const input = qsa('input[name="paymentMethod"]').find(i=>i.value===pref);
      if(input){ input.checked = true; input.dispatchEvent(new Event('change',{bubbles:true})); }
      const select = qs('select[name="paymentMethod"]');
      if(select){ select.value = pref; select.dispatchEvent(new Event('change',{bubbles:true})); }
    }
  }, 1000);
  // V43: old broad final confirmation guard disabled. Checkout-only guard is added below.

  // clearer coupon state
  const cObs = new MutationObserver(()=>{
    const st = qs('#couponStatus');
    if(st && window.appliedCoupon && !st.dataset.v38){
      st.dataset.v38 = '1';
      const scope = window.appliedCoupon.product_scope_text || 'كل المنتجات';
      st.insertAdjacentHTML('beforeend', `<div style="margin-top:6px">ينطبق على: <b>${scope}</b></div>`);
    }
  });
  cObs.observe(document.body,{childList:true,subtree:true});

  function relativeTime(date){
    const d = new Date(date);
    if(!date || isNaN(d)) return '';
    const diff = Math.max(0, Math.floor((Date.now()-d.getTime())/60000));
    if(diff < 1) return 'الآن';
    if(diff < 60) return `منذ ${diff} دقيقة`;
    const h = Math.floor(diff/60);
    if(h < 24) return `منذ ${h} ساعة`;
    return `منذ ${Math.floor(h/24)} يوم`;
  }
  function statusIndex(status){
    if(['pending','claimed'].includes(status)) return 1;
    if(['processing','on_hold','needs_fix'].includes(status)) return 2;
    if(['delivered','archived'].includes(status)) return 4;
    if(['rejected','cancelled'].includes(status)) return 0;
    return 1;
  }
  function timelineHtml(order){
    const idx = statusIndex(order.status);
    const warn = order.status === 'needs_fix' || order.status === 'on_hold';
    return `<div class="v38-timeline">
      <div class="v38-step ${idx>=1?'active':''}">✅ استلام الطلب</div>
      <div class="v38-step ${idx>=2?'active':''} ${warn?'warn':''}">🔍 مراجعة الدفع</div>
      <div class="v38-step ${idx>=3?'active':''}">🔄 جاري الشحن</div>
      <div class="v38-step ${idx>=4?'active':''}">✅ تم الشحن</div>
    </div>`;
  }
  const oldOpen = window.openOrderDetailsByIndex;
  if(typeof oldOpen === 'function'){
    window.openOrderDetailsByIndex = function(orderId){
      oldOpen.apply(this,arguments);
      setTimeout(()=>{
        const order = (window.allHistoryOrders||[]).find(o=>String(o.id)===String(orderId));
        const content = qs('#orderDetailsContent');
        if(order && content && !content.querySelector('.v38-timeline')){
          content.insertAdjacentHTML('afterbegin', timelineHtml(order));
        }
      },120);
    };
  }
  setInterval(()=>{
    qsa('.history-card').forEach((card,idx)=>{
      const order = (window.allHistoryOrders||[])[idx];
      if(order && order.updated_at && !card.querySelector('.v38-relative-time')){
        card.insertAdjacentHTML('beforeend', `<div class="v38-relative-time" style="font-size:11px;color:var(--muted,#aab3c5);margin-top:6px">آخر تحديث ${relativeTime(order.updated_at || order.created_at)}</div>`);
      }
    });
  }, 1200);

  // Reviews filters/stats/verified/replies UI
  function enhanceReviews(){
    const section = qs('#customerReviews') || qs('.reviews-panel');
    if(!section) return;
    if(!qs('#reviewStatsBox')){
      section.insertAdjacentHTML('afterbegin', `<div id="reviewStatsBox" class="review-stats-box"><div><b id="reviewAvg">⭐ 0.0</b><div>متوسط التقييم</div></div><div id="reviewCount">0 تقييم</div></div>
      <div class="review-filter-bar" id="reviewFilterBar"><button data-review-filter="all" class="active">كل التقييمات</button><button data-review-filter="5">5 نجوم</button><button data-review-filter="latest">الأحدث</button></div>`);
    }
    const cards = qsa('.review-card');
    let sum=0,count=0;
    cards.forEach(card=>{
      const text = card.textContent || '';
      const stars = (text.match(/★|⭐/g)||[]).length || Number((text.match(/([1-5])\s*\/\s*5/)||[])[1]||0);
      if(stars){sum+=stars;count++;}
      if(/موثق|verified|طلب مكتمل/i.test(text) && !card.querySelector('.verified-badge')){
        const title = card.querySelector('b,strong,.review-name') || card.firstElementChild;
        if(title) title.insertAdjacentHTML('beforeend',' <span class="verified-badge">عميل موثق</span>');
      }
      if(/رد المتجر[:：]/.test(text) && !card.querySelector('.store-reply-box')){
        const reply = text.split(/رد المتجر[:：]/)[1]?.trim();
        if(reply) card.insertAdjacentHTML('beforeend', `<div class="store-reply-box"><b>رد MOBA SHOP:</b><br>${reply}</div>`);
      }
    });
    const avg = count ? (sum/count).toFixed(1) : '0.0';
    const avgEl = qs('#reviewAvg'), countEl=qs('#reviewCount');
    if(avgEl) avgEl.textContent = `⭐ ${avg} من 5`;
    if(countEl) countEl.textContent = `${count} تقييم`;
  }
  document.addEventListener('click',function(e){
    const btn = e.target.closest('[data-review-filter]');
    if(!btn) return;
    qsa('[data-review-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.reviewFilter;
    let cards = qsa('.review-card');
    if(f==='latest') cards.reverse().forEach(c=>c.parentElement?.appendChild(c));
    cards.forEach(card=>{
      const stars = (card.textContent.match(/★|⭐/g)||[]).length || Number((card.textContent.match(/([1-5])\s*\/\s*5/)||[])[1]||0);
      card.style.display = (f==='all'||f==='latest'||(f==='5'&&stars>=5)) ? '' : 'none';
    });
  });
  setInterval(enhanceReviews,1600);

  // Review only after completed order: if no completed local history, show note
  document.addEventListener('focusin', function(e){
    const form = e.target.closest && e.target.closest('form');
    if(form && /review|rating|تقييم/i.test(form.textContent||'')){
      const hasDone = (window.allHistoryOrders||[]).some(o=>['delivered','archived'].includes(o.status));
      if(!hasDone){
        const noteId='reviewNeedPurchaseNote';
        if(!qs('#'+noteId)){
          form.insertAdjacentHTML('afterbegin', `<div id="${noteId}" class="smart-checkout-warning">⭐ التقييمات للعملاء بعد الطلب المكتمل. اكتب رقمك في سجل الطلبات الأول لو حابب توثق تقييمك.</div>`);
        }
      }
    }
  });

  // Smart hide Pharaoh during any form input
  document.addEventListener('focusin', function(e){
    if(e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){
      document.getElementById('pharaohAssistantFab')?.classList.add('pharaoh-smart-hide');
    }
  });
  document.addEventListener('focusout', function(e){
    setTimeout(()=>document.getElementById('pharaohAssistantFab')?.classList.remove('pharaoh-smart-hide'), 250);
  });

  // Pharaoh contextual smarter replies/hints
  function showPharaohHint(text){
    const hint = qs('#pharaohHintBubble');
    const fab = qs('#pharaohAssistantFab');
    if(hint && fab){
      hint.innerHTML = text;
      fab.classList.add('show-hint');
      setTimeout(()=>fab.classList.remove('show-hint'),3600);
    }
  }
  const contexts = [
    ['productsSection','تقدر تضيف أكتر من ID في نفس السلة 👑'],
    ['cartSection','راجع البيانات والسكرين قبل تنفيذ الطلب 👑'],
    ['trackOrder','اكتب رقمك هنا عشان أجيب طلباتك 📦']
  ];
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(en.isIntersecting && en.intersectionRatio>.55){
        const c = contexts.find(x=>x[0]===en.target.id);
        if(c) showPharaohHint(c[1]);
      }
    });
  },{threshold:[.55]});
  contexts.forEach(c=>{const el=qs('#'+c[0]); if(el) io.observe(el);});
})();


/* moba-v62-sales-trust-upgrade */
(function(){
  function ensureCartEnhancements(){
    const cart = document.getElementById('cartSection') || document.getElementById('cartPanel');
    if(!cart) return;

    if(!cart.querySelector('.checkout-warning-v62')){
      const warn = document.createElement('div');
      warn.className = 'checkout-warning-v62';
      warn.innerHTML = '⚠️ راجع ID واسم الحساب كويس قبل تنفيذ الطلب. أي ID غلط بعد التأكيد مسؤولية العميل.';
      const form = cart.querySelector('#orderForm,.form') || cart;
      form.insertAdjacentElement('beforebegin', warn);
    }

    const couponInput = cart.querySelector('#couponInput,[name="coupon_code"],.coupon-input');
    if(couponInput && !couponInput.closest('.cart-coupon-v62')){
      const wrap = document.createElement('div');
      wrap.className = 'cart-coupon-v62';
      wrap.innerHTML = '<h3>🎟️ عندك كوبون؟</h3><div class="coupon-slot-v62"></div><div class="notice">لو الكوبون مش مناسب للمنتجات الموجودة هنقولك السبب بوضوح.</div>';
      couponInput.parentNode.insertBefore(wrap, couponInput);
      wrap.querySelector('.coupon-slot-v62').appendChild(couponInput);
      const apply = cart.querySelector('#applyCoupon,.apply-coupon');
      if(apply) wrap.querySelector('.coupon-slot-v62').appendChild(apply);
    }
  }

  function ensureTimeline(){
    document.querySelectorAll('.track-result,.order-detail-modal,.order-card,.order-detail').forEach(box=>{
      if(box.querySelector('.order-timeline-v62')) return;
      const text = (box.textContent || '').toLowerCase();
      let step = 1;
      if(/مراجعة|استلام|pending|معلق/.test(text)) step = 2;
      if(/جاري|تنفيذ|الشحن|processing/.test(text)) step = 3;
      if(/تم|مكتمل|completed|done/.test(text)) step = 4;
      const tl = document.createElement('div');
      tl.className = 'order-timeline-v62';
      tl.innerHTML = `
        <div class="${step>=1?'done':''}">استلام الطلب</div>
        <div class="${step>=2?'active':''}">مراجعة الدفع</div>
        <div class="${step>=3?'active':''}">جاري الشحن</div>
        <div class="${step>=4?'done':''}">تم الشحن</div>
      `;
      box.insertAdjacentElement('afterbegin', tl);
    });
  }

  function pharaohContextTip(){
    const panel = document.querySelector('.pharaoh-chat,.assistant-chat,.pharaoh-panel');
    if(!panel || panel.querySelector('.pharaoh-context-tip-v62')) return;

    let msg = 'أنا فرعون مساعدك 👑 اسألني عن الشحن أو الدفع أو حالة الطلب.';
    const page = document.body.dataset.page || '';
    if(page === 'cart') msg = 'راجع ID والاسم وارفع سكرين التحويل قبل تنفيذ الطلب 👑';
    if(page === 'game') msg = 'اختار الباقة واكتب ID واسم الحساب وبعدها ضيف للسلة 🎮';
    if(page === 'orders') msg = 'اكتب رقم الموبايل اللي عملت بيه الطلب عشان تشوف الحالة 📦';

    const tip = document.createElement('div');
    tip.className = 'pharaoh-context-tip-v62';
    tip.innerHTML = msg;
    panel.insertAdjacentElement('afterbegin', tip);
  }

  document.addEventListener('click', function(){
    setTimeout(function(){
      ensureCartEnhancements();
      ensureTimeline();
      pharaohContextTip();
    }, 350);
  }, true);

  setInterval(function(){
    ensureCartEnhancements();
    ensureTimeline();
  }, 1800);

  setTimeout(function(){
    ensureCartEnhancements();
    ensureTimeline();
    pharaohContextTip();
  }, 700);
})();


/* moba-v63-home-pharaoh-upgrade */
(function(){
  const FAQ = {
    how: `تمام 👑 اختار اللعبة، بعدها اختار المنتج، اكتب ID واسم الحساب، ضيف للسلة، وبعدين افتح السلة وارفع سكرين التحويل.`,
    late: `ولا يهمك 👑 اكتب رقم الموبايل في صفحة طلباتي وهتشوف حالة طلبك. لو الطلب متأخر غالبًا بسبب ضغط الطلبات أو مراجعة الدفع.`,
    growth: `الازدهار لازم تتأكد إنه متاح عندك في اللعبة قبل الطلب، لأنه غالبًا بيكون مرة واحدة على الحساب حسب نوع العرض.`,
    crystal: `الكريستالة غالبًا بيكون ليك واحدة أو اتنين في الأسبوع حسب حسابك. اتأكد إنها متاحة عندك قبل الطلب.`,
    multi: `تقدر تشحن لأكتر من ID عادي 👑 ضيف كل ID كمنتج منفصل في السلة، وبعدها ادفع مرة واحدة.`,
    orders: `افتح صفحة طلباتي واكتب رقم الموبايل اللي عملت بيه الطلب، وهيظهرلك آخر الطلبات وحالتها.`,
    hours: `مواعيد التنفيذ حسب حالة المتجر. حتى لو خارج المواعيد تقدر تعمل طلبك، وهيتسجل ويتنفذ مع أول تشغيل.`,
    payment: `اختار طريقة الدفع، حوّل، ارفع سكرين التحويل، وتأكد إن بيانات الحساب والـ ID صح قبل التنفيذ.`,
    coupon: `لو الكوبون مش نافع، السبب غالبًا إنه متوقف أو مش مناسب للمنتج أو محتاج حد أدنى. ضيف المنتج المناسب وجرب تاني.`,
    recommend: `لو عايز الأرخص اختار 60 UC. لو عايز الأكثر طلبًا اختار 325 UC. لو عايز قيمة أعلى اختار 660 UC.`
  };

  function addMiniTrust(){
    const head = document.querySelector('.games-home-head');
    if(!head || head.querySelector('.home-mini-trust-v63')) return;
    const wrap = document.createElement('div');
    wrap.className = 'home-mini-trust-v63';
    wrap.innerHTML = `
      <span>✅ مراجعة قبل التنفيذ</span>
      <span>🛒 أكتر من ID في سلة واحدة</span>
      <span>📞 دعم مباشر</span>
      <span>⚡ تنفيذ حسب الضغط</span>
    `;
    head.appendChild(wrap);
  }

  function currentPageText(){
    const page = document.body.dataset.page || 'home';
    if(page === 'cart') return 'راجع ID والاسم وارفع سكرين التحويل قبل تنفيذ الطلب 👑';
    if(page === 'game') return 'اختار الباقة واكتب ID واسم الحساب وبعدها ضيف للسلة 🎮';
    if(page === 'orders') return 'اكتب رقم الموبايل اللي عملت بيه الطلب عشان تشوف الحالة 📦';
    if(page === 'reviews') return 'شوف آراء العملاء ولو ليك طلب مكتمل تقدر تسيب تقييم ⭐';
    return 'اختار اللعبة اللي عايز تشحنها وأنا هساعدك تكمل الطلب 👑';
  }

  function findPharaohPanel(){
    return document.querySelector('.pharaoh-chat,.assistant-chat,.pharaoh-panel,.pharaoh-widget,.assistant-panel');
  }

  function findPharaohFloat(){
    return document.querySelector('.pharaoh-float,#pharaohAssistant,.assistant-float,.pharaoh-avatar,.assistant-avatar');
  }

  function speak(text){
    const panel = findPharaohPanel();
    if(panel){
      let box = panel.querySelector('.pharaoh-live-answer-v63');
      if(!box){
        box = document.createElement('div');
        box.className = 'pharaoh-context-tip-v63 pharaoh-live-answer-v63';
        panel.insertAdjacentElement('afterbegin', box);
      }
      box.innerHTML = text;
    }else{
      showBubble(text);
    }
  }

  function showBubble(text, ms=4600){
    let bubble = document.getElementById('pharaohBubbleHelpV63');
    if(!bubble){
      bubble = document.createElement('div');
      bubble.id = 'pharaohBubbleHelpV63';
      bubble.className = 'pharaoh-bubble-help-v63';
      document.body.appendChild(bubble);
    }
    bubble.innerHTML = text;
    bubble.classList.add('show');
    clearTimeout(window.__pharaohBubbleTimerV63);
    window.__pharaohBubbleTimerV63 = setTimeout(()=>bubble.classList.remove('show'), ms);
  }

  function addPharaohSmartActions(){
    const panel = findPharaohPanel();
    if(!panel) return;

    let tip = panel.querySelector('.pharaoh-context-tip-v63');
    if(!tip){
      tip = document.createElement('div');
      tip.className = 'pharaoh-context-tip-v63';
      panel.insertAdjacentElement('afterbegin', tip);
    }
    tip.innerHTML = currentPageText();

    if(panel.querySelector('.pharaoh-smart-actions-v63')) return;

    const actions = document.createElement('div');
    actions.className = 'pharaoh-smart-actions-v63';
    actions.innerHTML = `
      <button type="button" data-v63-pharaoh="how">ازاي اشحن؟</button>
      <button type="button" data-v63-pharaoh="late">طلبي اتأخر</button>
      <button type="button" data-v63-pharaoh="growth">الازدهار</button>
      <button type="button" data-v63-pharaoh="crystal">الكريستالة</button>
      <button type="button" data-v63-pharaoh="multi">أكتر من ID</button>
      <button type="button" data-v63-pharaoh="orders">حالة طلبي</button>
      <button type="button" data-v63-pharaoh="hours">مواعيد العمل</button>
      <button type="button" data-v63-pharaoh="payment">طرق الدفع</button>
      <button type="button" data-v63-pharaoh="coupon">الكوبونات</button>
      <button type="button" data-v63-pharaoh="recommend">رشحلي باقة</button>
      <button type="button" data-v63-use-last-id>استخدم آخر ID</button>
      <button type="button" data-v63-support>الدعم</button>
    `;
    tip.insertAdjacentElement('afterend', actions);
  }

  function updatePharaohContext(){
    const panel = findPharaohPanel();
    const tip = panel && panel.querySelector('.pharaoh-context-tip-v63');
    if(tip) tip.innerHTML = currentPageText();
  }

  function pharaohDance(type='ok'){
    const f = findPharaohFloat();
    if(!f) return;
    const cls = type === 'err' ? 'pharaoh-error-v63' : 'pharaoh-dance-v63';
    f.classList.remove('pharaoh-dance-v63','pharaoh-error-v63');
    void f.offsetWidth;
    f.classList.add(cls);
    setTimeout(()=>f.classList.remove(cls), 700);
  }

  function useLastId(){
    const id = localStorage.getItem('moba_last_pubg_id') || '';
    const name = localStorage.getItem('moba_last_pubg_name') || '';
    if(!id){
      speak('مفيش ID محفوظ لسه 👑 ضيف أول طلب وبعدها هقدر استخدمه تلقائيًا.');
      pharaohDance('err');
      return;
    }
    const idInput = document.querySelector('.id-input[id^="id_"]');
    const nameInput = document.querySelector('.id-input[id^="name_"]');
    if(idInput) idInput.value = id;
    if(nameInput && name) nameInput.value = name;
    speak('تم استخدام آخر ID محفوظ 👑 راجع البيانات قبل الإضافة للسلة.');
    pharaohDance('ok');
  }

  function go(view){
    if(typeof window.mobaShowView === 'function') window.mobaShowView(view);
    else document.body.dataset.page = view;
    setTimeout(updatePharaohContext, 250);
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-v63-pharaoh]');
    if(btn){
      e.preventDefault();
      const key = btn.dataset.v63Pharaoh;
      speak(FAQ[key] || FAQ.how);
      pharaohDance('ok');
      return;
    }
    if(e.target.closest('[data-v63-use-last-id]')){
      e.preventDefault();
      useLastId();
      return;
    }
    if(e.target.closest('[data-v63-support]')){
      e.preventDefault();
      window.open('https://t.me/MOFR3OON','_blank');
      return;
    }

    const add = e.target.closest('[data-v57-add],[data-v56-add],[data-v60-qty],.btn.add');
    if(add){
      setTimeout(()=>{
        showBubble('تم تحديث السلة 👑 افتح السلة وراجع الطلب قبل الدفع.');
        pharaohDance('ok');
      }, 350);
    }
  }, true);

  document.addEventListener('focusin', function(e){
    if(e.target && (e.target.matches('input,textarea,select') || e.target.classList.contains('id-input'))){
      document.body.classList.add('pharaoh-writing-v63');
    }
  }, true);
  document.addEventListener('focusout', function(){
    setTimeout(()=>document.body.classList.remove('pharaoh-writing-v63'), 350);
  }, true);

  // Smart idle help
  let idleTimer;
  function resetIdle(){
    clearTimeout(idleTimer);
    idleTimer = setTimeout(()=>{
      if(!document.querySelector('.modal.show')){
        showBubble(currentPageText(), 5200);
      }
    }, 18000);
  }
  ['mousemove','keydown','scroll','click','touchstart'].forEach(ev=>document.addEventListener(ev, resetIdle, {passive:true}));

  // Observe page changes
  const obs = new MutationObserver(()=>setTimeout(updatePharaohContext, 120));
  obs.observe(document.body, {attributes:true, attributeFilter:['data-page']});

  setInterval(()=>{
    addMiniTrust();
    addPharaohSmartActions();
    updatePharaohContext();
  }, 1500);

  setTimeout(()=>{
    addMiniTrust();
    addPharaohSmartActions();
    updatePharaohContext();
    resetIdle();
  }, 700);
})();


/* moba-v65-pharaoh-assist-pro */
(function(){
  const SUPPORT='https://t.me/MOFR3OON';
  const packs=[
    {name:'60 UC',price:50,type:'uc',score:1},{name:'325 UC',price:235,type:'uc',score:2},{name:'660 UC',price:435,type:'uc',score:3},{name:'1800 UC',price:1120,type:'uc',score:4},{name:'3850 UC',price:2170,type:'uc',score:5},{name:'8100 UC',price:4350,type:'uc',score:6},
    {name:'ازدهار 1',price:55,type:'growth',note:'مرة واحدة على الحساب'}, {name:'ازدهار 2',price:150,type:'growth',note:'مرة واحدة على الحساب'}, {name:'ازدهار 3',price:250,type:'growth',note:'مرة واحدة على الحساب'}, {name:'الكريستالة الميثك',price:150,type:'crystal',note:'اتأكد من المتاح جوه اللعبة'},
    {name:'Prime',price:55,type:'prime'},{name:'Prime Plus',price:445,type:'prime'},{name:'Prime + Prime Plus',price:500,type:'prime'}
  ];
  function qs(s,r=document){return r.querySelector(s)} function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function money(n){return Number(n||0).toLocaleString('ar-EG')+' جنيه'}
  function panel(){return qs('#pharaohChatPanel')||qs('.pharaoh-chat-panel')||qs('.pharaoh-chat,.assistant-chat,.pharaoh-panel,.assistant-panel')}
  function body(){return qs('#pharaohChatBody')||qs('.pharaoh-chat-body')||panel()}
  function input(){return qs('#pharaohChatInput')}
  function fab(){return qs('#pharaohAssistantFab')||qs('.pharaoh-assistant-fab')||qs('.pharaoh-float,.assistant-float')}
  function openPanel(){const p=panel(),f=fab(); if(p&&!p.classList.contains('show')){f&&f.click&&f.click(); p.classList.add('show')}}
  function add(type,html){const b=body(); if(!b)return; const m=document.createElement('div'); m.className='pharaoh-msg '+(type||'bot'); m.innerHTML=html; b.appendChild(m); b.scrollTop=b.scrollHeight;}
  function bot(html){const f=fab(); f&&f.classList.add('pharaoh-thinking-v65'); setTimeout(()=>{f&&f.classList.remove('pharaoh-thinking-v65'); add('bot',html)},260)}
  function user(t){add('user',esc(t))}
  function go(id){
    const map={'#gamesHome':'home','#productsSection':'game','#cartSection':'cart','#cartPanel':'cart','#trackOrder':'orders','#customerReviews':'reviews'};
    const view=map[id]||null;
    if(view && typeof window.mobaShowView==='function') window.mobaShowView(view);
    else if(view) document.body.dataset.page=view;
    const el=qs(id)||qs(id==='#cartSection'?'#cartPanel':id);
    if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),90);
    try{history.replaceState(null,'',id)}catch(e){}
  }
  function showNudge(text,ms=5200){let n=qs('#pharaohNudgeV65'); if(!n){n=document.createElement('div'); n.id='pharaohNudgeV65'; n.className='pharaoh-floating-nudge-v65'; document.body.appendChild(n)} n.innerHTML=text; n.classList.add('show'); clearTimeout(window.__pharaohNudge65); window.__pharaohNudge65=setTimeout(()=>n.classList.remove('show'),ms)}
  function statusNow(){const d=new Date(),day=d.getDay(),h=d.getHours(); const open=(day===1||day===3||day===4||day===5)?(h>=15||h<5):(h>=0&&h<5); if(!open)return {state:'closed',text:'خارج مواعيد التنفيذ دلوقتي بس الطلبات بتتسجل عادي'}; if((window.cart||[]).length>=3)return {state:'busy',text:'راجع السلة كويس لان عندك اكتر من منتج'}; return {state:'open',text:'الشحن متاح دلوقتي'} }
  function page(){const y=window.scrollY+180; const parts=[['#trackOrder','orders'],['#customerReviews','reviews'],['#cartSection','cart'],['#productsSection','products'],['#gamesHome','home']]; for(const [sel,n] of parts){const e=qs(sel); if(e&&e.offsetTop<=y&&e.offsetTop+e.offsetHeight>y)return n} return 'home'}
  function contextText(){const p=page(); if(p==='cart')return 'انت في السلة: راجع ID والاسم واختار الدفع وارفع السكرين.'; if(p==='products')return 'انت في المنتجات: اختار باقة واكتب ID واسم الحساب.'; if(p==='orders')return 'انت في سجل الطلبات: اكتب رقم الموبايل وتابع حالة طلبك.'; if(p==='reviews')return 'انت في آراء العملاء: تقدر تشوف الثقة والتقييمات.'; return 'اختار اللعبة من هنا وفرعون يكملك خطوة بخطوة.'}
  function dashboard(){const st=statusNow(); return `<div class="pharaoh-assist-pro-card"><b>👑 فرعون Assist Pro</b><small>${st.text}</small><div class="pharaoh-wizard-step">${contextText()}</div><div class="pharaoh-assist-pro-actions"><button class="gold" data-v65-act="start">ابدأ الشحن</button><button data-v65-act="recommend">رشحلي باقة</button><button data-v65-act="track">تابع طلبي</button><button data-v65-act="problem">مشكلة في الطلب</button><button data-v65-act="payment">طرق الدفع</button><button data-v65-act="hours">مواعيد العمل</button></div></div>`}
  function recommend(amount){amount=Number(amount||0); if(!amount)return `<div class="pharaoh-assist-pro-card"><b>اكتب الميزانية</b><small>مثال: معايا 500 جنيه</small><div class="pharaoh-assist-pro-actions"><button data-v65-act="budget" data-budget="100">100ج</button><button data-v65-act="budget" data-budget="250">250ج</button><button data-v65-act="budget" data-budget="500">500ج</button><button data-v65-act="budget" data-budget="1200">1200ج</button></div></div>`; let choices=packs.filter(p=>p.price<=amount).sort((a,b)=>b.price-a.price||b.score-a.score).slice(0,3); if(!choices.length)return `اقل باقة متاحة تقريبا 50 جنيه. زود الميزانية شوية وابدأ بباقة 60 UC.`; return `<div class="pharaoh-assist-pro-card"><b>انسب ترشيح لميزانية ${money(amount)}</b><small>اخترتلك اقرب باقات تصرف الميزانية صح</small>${choices.map((c,i)=>`<div class="pharaoh-wizard-step"><b>${i+1}) ${esc(c.name)}</b> — ${money(c.price)} ${c.note?'<br><span>'+esc(c.note)+'</span>':''}</div>`).join('')}<div class="pharaoh-assist-pro-actions"><button class="gold" data-v65-act="products">افتح المنتجات</button><button data-v65-act="start">اعمل الطلب خطوة بخطوة</button></div></div>`}
  function reply(q){const t=String(q||'').trim(),low=t.toLowerCase(),num=(t.match(/[0-9٠-٩]+/g)||[]).join('').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)); if(/(عايز|عاوز|اطلب|اشحن|ضيف|هات|محتاج).*(شدة|شدات|uc|UC)/i.test(t)&&num){return `<div class="pharaoh-assist-pro-card"><b>تمام، تقصد ${num} UC؟</b><small>افتح قسم شدات UC واختار الباقة القريبة، واكتب ID واسم الحساب بعدها.</small><div class="pharaoh-assist-pro-actions"><button class="gold" data-v65-act="products">افتح شدات UC</button><button data-v65-act="cart">افتح السلة</button></div></div>`;} if(/معايا|ميزانية|ميزانيه|كام|رشح|باقة|باقه|budget/.test(t)&&num)return recommend(Number(num)); if(/رشح|ميزانية|ميزانيه|باقة|باقه/.test(t))return recommend(0); if(/ازدهار|growth/.test(t))return `<div class="pharaoh-critical-note"><b>تنبيه الازدهار</b><br>لازم تتأكد من اللعبة إن الازدهار متاح على الحساب قبل الطلب لأنه في الغالب مرة واحدة على الحساب في العمر كله.</div><div class="pharaoh-assist-pro-actions"><button data-v65-act="growth">افتح الازدهار</button><button data-v65-act="start">اكمل طلب</button></div>`; if(/كريستالة|كريستاله|جوهرة|crystal/.test(t))return `<div class="pharaoh-critical-note"><b>تنبيه الكريستالة</b><br>الكريستالة ليها عدد محدود حسب حسابك وبتتجدد في اللعبة. اتأكد من المتاح قبل الطلب عشان منرجعش نوقف الطلب.</div><div class="pharaoh-assist-pro-actions"><button data-v65-act="growth">افتح قسم الازدهار والكريستالة</button></div>`; if(/مشكلة|غلط|سكرين|اتأخر|اتأخر|دعم|تواصل|مش واضح|id/.test(t))return `<div class="pharaoh-assist-pro-card"><b>حل المشكلة بسرعة</b><small>اختار نوع المشكلة</small><div class="pharaoh-assist-pro-actions"><button data-v65-act="badid">ID غلط</button><button data-v65-act="badshot">سكرين غير واضح</button><button data-v65-act="late">الطلب اتأخر</button><a href="${SUPPORT}" target="_blank">الدعم المباشر</a></div></div>`; if(/فين|تابع|حالة|طلبي|طلبى|order/.test(t))return `<div class="pharaoh-assist-pro-card"><b>متابعة الطلب</b><small>اكتب رقم الموبايل اللي عملت بيه الطلب في سجل الطلبات</small><div class="pharaoh-assist-pro-actions"><button class="green" data-v65-act="track">افتح سجل الطلبات</button></div></div>`; if(/دفع|فودافون|انستا|insta|wallet|محفظة/.test(t))return `<div class="pharaoh-assist-pro-card"><b>طرق الدفع</b><div class="pharaoh-wizard-step">🟢 InstaPay<br>📱 Vodafone / Orange / Etisalat / WE Wallet</div><small>بعد التحويل ارفع سكرين واضح ولو التحويل من رقم تاني اكتب آخر 3 أرقام في الملاحظات.</small><div class="pharaoh-assist-pro-actions"><button data-v65-act="cart">افتح السلة</button></div></div>`; if(/مواعيد|وقت|شغال|مفتوح|مقفول/.test(t))return `<div class="pharaoh-assist-pro-card"><b>مواعيد العمل</b><div class="pharaoh-wizard-step">كل يوم من 12 صباحا حتى 5 الفجر<br>الاثنين والاربعاء والخميس والجمعة من 3 العصر حتى 5 الفجر</div><small>تقدر تعمل اوردر خارج المواعيد والتنفيذ اول ما الشغل يبدأ.</small></div>`; if(/اشحن|ابدأ|عايز|order|start/.test(t))return `<div class="pharaoh-assist-pro-card"><b>يلا نبدأ الطلب</b><small>امشي معايا خطوة خطوة</small><div class="pharaoh-wizard-step">1) اختار اللعبة  2) اختار الباقة  3) اكتب ID والاسم  4) ادفع وارفع السكرين</div><div class="pharaoh-assist-pro-actions"><button class="gold" data-v65-act="products">افتح المنتجات</button><button data-v65-act="use-last">استخدم آخر ID</button><button data-v65-act="cart">افتح السلة</button><button data-v65-act="track">تابع طلب قديم</button></div></div>`; return dashboard();}
  function setCat(cat){
    cat = cat || 'uc';
    window.activeCat = cat;
    const tab = qs('.tab[data-cat="'+cat+'"]');
    if(tab) tab.click();
    else if(typeof window.renderProducts==='function') window.renderProducts();
  }
  function catName(cat){return cat==='growth'?'الازدهار والكريستالة':cat==='prime'?'برايم':'شدات PUBG'}
  function productList(cat){
    const data=(window.mobaProducts&&window.mobaProducts[cat])||[];
    if(!data.length) return `<div class="pharaoh-wizard-step">القسم ده لسه بيتجهز.</div>`;
    return data.map((p,i)=>`<button type="button" data-v66-pick="${cat}" data-index="${i}">${esc(p.name)}<br><small>${money(p.price)}</small></button>`).join('');
  }
  function catalog(cat){
    cat=cat||'uc';
    return `<div class="pharaoh-assist-pro-card pharaoh-v66-catalog"><b>اختار من الشات: ${catName(cat)}</b><small>دوس على الباقة هفتحلك مكانها في الصفحة وانورلك عليها</small><div class="pharaoh-assist-pro-actions"><button class="gold" data-v65-act="cat-uc">شدات UC</button><button data-v65-act="cat-growth">ازدهار/كريستالة</button><button data-v65-act="cat-prime">برايم</button><button data-v65-act="cart">السلة والدفع</button></div><div class="pharaoh-v66-products">${productList(cat)}</div></div>`;
  }
  function startWizard(){return `<div class="pharaoh-assist-pro-card"><b>يلا نعمل الطلب من غير لف 👑</b><small>اختار القسم من هنا وانا هفتحلك مكانه في الموقع</small><div class="pharaoh-wizard-step">1) اختار القسم من الشات<br>2) دوس على الباقة<br>3) اكتب ID واسم الحساب في الكارت اللي هيتفتحلك<br>4) ضيف للسلة وبعدها الدفع</div><div class="pharaoh-assist-pro-actions"><button class="gold" data-v65-act="cat-uc">شدات UC</button><button data-v65-act="cat-growth">ازدهار وكريستالة</button><button data-v65-act="cat-prime">برايم</button><button data-v65-act="recommend">رشحلي باقة</button><button data-v65-act="use-last">استخدم آخر ID</button><button data-v65-act="track">تابع طلب قديم</button></div></div>`}
  function handleAction(a,budget){
    if(a==='start'){bot(startWizard());return}
    if(a==='products'){go('#productsSection');setCat('uc');bot(catalog('uc'));return}
    if(a==='cat-uc'){go('#productsSection');setCat('uc');bot(catalog('uc'));return}
    if(a==='cat-growth'||a==='growth'){go('#productsSection');setCat('growth');bot(catalog('growth'));return}
    if(a==='cat-prime'){go('#productsSection');setCat('prime');bot(catalog('prime'));return}
    if(a==='cart'){go('#cartSection');bot('فتحتلك السلة 👑 راجع البيانات واختار طريقة الدفع وارفع سكرين التحويل.');return}
    if(a==='track'){go('#trackOrder');bot('فتحتلك سجل الطلبات 👑 اكتب رقم الموبايل اللي عملت بيه الطلب وهيظهرلك كل الطلبات.');return}
    if(a==='reviews'){go('#customerReviews');bot('فتحتلك آراء العملاء 👑');return}
    if(a==='home'){go('#gamesHome');bot('رجعتك لاختيار اللعبة 👑');return}
    if(a==='payment'){bot(reply('طرق الدفع'));return}
    if(a==='hours'){bot(reply('مواعيد العمل'));return}
    if(a==='problem'){bot(reply('مشكلة في الطلب'));return}
    if(a==='recommend'){bot(recommend(0));return}
    if(a==='budget'){bot(recommend(budget));return}
    if(a==='badid'){bot('افتح سجل الطلبات برقمك، لو الطلب محتاج تعديل هتلاقي زر تعديل ID واسم الحساب. لو اتنفذ خلاص كلم الدعم فورًا.');return}
    if(a==='badshot'){bot('افتح تفاصيل الطلب وارفع سكرين جديد واضح يظهر الرقم أو الاسم والمبلغ ووقت التحويل.');return}
    if(a==='late'){bot('لو الطلب اتأخر افتح سجل الطلبات الأول. لو الحالة ثابتة فترة طويلة كلم الدعم من هنا: <br><a class="support-link" target="_blank" href="'+SUPPORT+'">الدعم المباشر</a>');return}
    if(a==='use-last'){useLastId();return}
  }
  function useLastId(){try{
    let v={};
    try{v=JSON.parse(localStorage.getItem('moba_last_pubg')||'{}')||{}}catch(e){}
    const savedId = v.pubgId || localStorage.getItem('moba_last_pubg_id') || '';
    const savedName = v.pubgName || localStorage.getItem('moba_last_pubg_name') || '';
    if(!savedId){bot('مفيش ID محفوظ قبل كده. اكتب ID واسم الحساب مرة وهيتحفظ للطلبات الجاية.');return}
    go('#productsSection');
    setTimeout(()=>{
      qsa('input[id^="id_"]').forEach(x=>x.value=savedId);
      qsa('input[id^="name_"]').forEach(x=>x.value=savedName);
    },180);
    bot('حطيت آخر ID واسم محفوظين في المنتجات الظاهرة 👑 راجعهم قبل الإضافة للسلة.');
  }catch(e){bot('مش قادر اقرأ آخر ID محفوظ.')}}
  function decoratePanel(){const b=body(); if(!b||qs('.pharaoh-context-pro',b))return; const div=document.createElement('div'); div.className='pharaoh-context-pro'; div.innerHTML='👑 '+contextText(); b.prepend(div); bot(dashboard());}
  function decorateProducts(){return; qsa('.product').forEach(card=>{if(qs('.pharaoh-product-helper',card))return; const title=(qs('b',card)?.textContent||'').trim(); const help=document.createElement('div'); help.className='pharaoh-product-helper'; help.innerHTML=`<button type="button" data-v65-product="${esc(title)}">اسأل فرعون</button><button type="button" data-v65-fill-last>آخر ID</button>`; card.appendChild(help); if(/ازدهار|كريستالة|Crystal|Growth/i.test(card.textContent)&&!qs('.pharaoh-critical-note',card)){const n=document.createElement('div');n.className='pharaoh-critical-note';n.innerHTML=/كريستالة/.test(card.textContent)?'اتأكد إن الكريستالة متاحة عندك في اللعبة قبل الطلب.':'اتأكد إن الازدهار متاح ومتشحنش قبل كده على الحساب.'; card.appendChild(n)}})}
  document.addEventListener('submit',function(e){if(e.target&&e.target.id==='pharaohChatForm'){e.preventDefault();e.stopImmediatePropagation();const q=input()?.value.trim(); if(!q)return; input().value=''; user(q); bot(reply(q));}},true);
  document.addEventListener('click',function(e){const act=e.target.closest('[data-v65-act]'); if(act){e.preventDefault();e.stopImmediatePropagation();handleAction(act.dataset.v65Act,Number(act.dataset.budget||0));return} const prod=e.target.closest('[data-v65-product]'); if(prod){e.preventDefault();e.stopImmediatePropagation();openPanel();user('اسأل عن '+prod.dataset.v65Product);bot(reply(prod.dataset.v65Product));return} if(e.target.closest('[data-v65-fill-last]')){e.preventDefault();e.stopImmediatePropagation();useLastId();return} },true);
  let idle; function reset(){clearTimeout(idle); idle=setTimeout(()=>{if(!qs('.modal.show'))showNudge('👑 '+contextText()+'<br><b>اضغط على فرعون لو محتاج مساعدة</b>')},22000)}
  ['scroll','click','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,reset,{passive:true}));
  setInterval(()=>{decorateProducts(); const c=qs('.pharaoh-context-pro'); if(c)c.innerHTML='👑 '+contextText()},1600);
  setTimeout(()=>{decoratePanel();decorateProducts();reset();showNudge('فرعون اتطور 👑 اسألني عن الشحن او اكتب ميزانيتك وانا ارشحلك باقة.',6500)},900);
})();


/* moba-v66-pharaoh-action-fix */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function openView(view){
    if(typeof window.mobaShowView==='function') window.mobaShowView(view);
    else document.body.dataset.page=view;
  }
  function goTarget(sel,view){
    if(view) openView(view);
    const el=qs(sel)||qs(sel==='#cartSection'?'#cartPanel':sel);
    if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),90);
  }
  function setCat(cat){
    window.activeCat=cat;
    const tab=qs('.tab[data-cat="'+cat+'"]');
    if(tab) tab.click();
    else if(typeof window.renderProducts==='function') window.renderProducts();
  }
  function pickProduct(cat,index){
    openView('game');
    setCat(cat);
    setTimeout(function(){
      const card=qs('.product[data-card-index="'+index+'"]')||qsa('.product')[Number(index)||0];
      if(card){
        qsa('.product.pharaoh-v66-focus').forEach(x=>x.classList.remove('pharaoh-v66-focus'));
        card.classList.add('pharaoh-v66-focus');
        card.scrollIntoView({behavior:'smooth',block:'center'});
        const id=card.querySelector('input[id^="id_"]');
        if(id) setTimeout(()=>id.focus({preventScroll:true}),450);
      }
    },240);
  }
  document.addEventListener('click',function(e){
    const old=e.target.closest('[data-pharaoh-action]');
    if(old){
      const a=old.dataset.pharaohAction;
      if(a==='products'){e.preventDefault();e.stopImmediatePropagation();goTarget('#productsSection','game');return false}
      if(a==='track'){e.preventDefault();e.stopImmediatePropagation();goTarget('#trackOrder','orders');return false}
      if(a==='cart'){e.preventDefault();e.stopImmediatePropagation();goTarget('#cartSection','cart');return false}
      if(a==='reviews'){e.preventDefault();e.stopImmediatePropagation();goTarget('#customerReviews','reviews');return false}
    }
    const pick=e.target.closest('[data-v66-pick]');
    if(pick){
      e.preventDefault();e.stopImmediatePropagation();
      pickProduct(pick.dataset.v66Pick, Number(pick.dataset.index||0));
      return false;
    }
  },true);
})();


/* moba-v67-pharaoh-brain-mode */
(function(){
  const SUPPORT='https://t.me/MOFR3OON';
  const packs=[
    {name:'60 UC',price:50,cat:'uc',i:0},{name:'325 UC',price:235,cat:'uc',i:1},{name:'660 UC',price:435,cat:'uc',i:2},{name:'1800 UC',price:1120,cat:'uc',i:3},{name:'3850 UC',price:2170,cat:'uc',i:4},{name:'8100 UC',price:4350,cat:'uc',i:5},
    {name:'ازدهار 1',price:55,cat:'growth',i:0,note:'اتأكد انه متاح ومتشحنش قبل كده'},{name:'ازدهار 2',price:150,cat:'growth',i:1,note:'مرة واحدة غالبا على الحساب'},{name:'ازدهار 3',price:250,cat:'growth',i:2,note:'راجع اللعبة قبل الطلب'},{name:'الكريستالة',price:150,cat:'growth',i:3,note:'اتأكد من عددها جوه اللعبة'},
    {name:'Prime',price:55,cat:'prime',i:0},{name:'Prime Plus',price:445,cat:'prime',i:2},{name:'Prime + Prime Plus',price:500,cat:'prime',i:1}
  ];
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function panel(){return qs('#pharaohChatPanel')}
  function body(){return qs('#pharaohChatBody')||panel()}
  function input(){return qs('#pharaohChatInput')}
  function typing(){return qs('#pharaohTyping')}
  function money(n){return Number(n||0).toLocaleString('ar-EG')+' جنيه'}
  function normalize(s){return String(s||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').trim()}
  function arDigits(s){return String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))}
  function nums(t){return (arDigits(t).match(/\d+/g)||[]).map(Number)}
  function add(type,html){const b=body(); if(!b)return; const m=document.createElement('div'); m.className='pharaoh-msg '+type+(type==='bot'?' pharaoh-brain-new':''); m.innerHTML=html; const ty=typing(); if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m); b.scrollTop=b.scrollHeight}
  function bot(html,delay=260){const ty=typing(); if(ty)ty.classList.add('show'); setTimeout(()=>{if(ty)ty.classList.remove('show'); add('bot',html)},delay)}
  function user(t){add('user',esc(t))}
  function showView(view){if(typeof window.mobaShowView==='function')window.mobaShowView(view);else document.body.dataset.page=view}
  function go(sel,view){if(view)showView(view); const el=qs(sel)||qs(sel==='#cartSection'?'#cartPanel':sel); if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),100); try{history.replaceState(null,'',sel)}catch(e){}}
  function setCat(cat){window.activeCat=cat; const tab=qs('.tab[data-cat="'+cat+'"]'); if(tab)tab.click(); else if(typeof window.renderProducts==='function')window.renderProducts()}
  function pick(cat,i){showView('game');setCat(cat);setTimeout(()=>{const card=qs('.product[data-card-index="'+i+'"]')||qsa('.product')[Number(i)||0]; if(card){qsa('.product.pharaoh-v66-focus').forEach(x=>x.classList.remove('pharaoh-v66-focus'));card.classList.add('pharaoh-v66-focus');card.scrollIntoView({behavior:'smooth',block:'center'});const id=card.querySelector('input[id^="id_"]');if(id)setTimeout(()=>id.focus({preventScroll:true}),450)}},260)}
  function actions(rows){return '<div class="pharaoh-brain-actions">'+rows.map(r=>r.href?`<a class="${r.cls||''}" href="${r.href}" target="_blank" rel="noopener">${r.t}</a>`:`<button class="${r.cls||''}" data-v67-act="${r.a||''}" ${r.cat?`data-cat="${r.cat}"`:''} ${Number.isInteger(r.i)?`data-i="${r.i}"`:''} ${r.v?`data-v="${r.v}"`:''}>${r.t}</button>`).join('')+'</div>'}
  function card(title,small,inner,rows,step){return `<div class="pharaoh-brain-card"><b>${title}</b>${small?`<small>${small}</small>`:''}${step?`<div class="pharaoh-brain-progress"><span style="width:${step}%"></span></div>`:''}${inner||''}${rows?actions(rows):''}</div>`}
  function main(){return card('👑 انا معاك يا بطل','اختار اللي محتاجه وانا هظبطهولك خطوة بخطوة','<div class="pharaoh-brain-note">شحن جديد ولا متابعة طلب ولا عندك مشكلة؟</div>',[
    {t:'ابدأ شحن جديد',a:'start',cls:'gold'},{t:'تابع طلبي',a:'track',cls:'green'},{t:'طرق الدفع',a:'payment'},{t:'مشكلة في الطلب',a:'problem'},{t:'رشحلي باقة',a:'recommend'},{t:'كلم الدعم',href:SUPPORT}
  ],15)}
  function start(){localStorage.setItem('pharaoh_last_flow','start');return card('يلا نبدأ الشحن','هسألك خطوة خطوة من غير ما تلف في الموقع','<div class="pharaoh-brain-note">الخطوة 1 من 4: اختار القسم</div>',[
    {t:'شدات UC',a:'catalog',cat:'uc',cls:'gold'},{t:'ازدهار وكريستالة',a:'catalog',cat:'growth'},{t:'برايم',a:'catalog',cat:'prime'},{t:'العاب تانية',a:'games'},{t:'القائمة الرئيسية',a:'main'},{t:'ابدأ من الأول',a:'reset'}
  ],25)}
  function catalog(cat){cat=cat||'uc'; localStorage.setItem('pharaoh_last_cat',cat); const names={uc:'شدات UC',growth:'ازدهار وكريستالة',prime:'برايم'}; const list=packs.filter(p=>p.cat===cat).map(p=>({t:p.name+' - '+money(p.price),a:'pick',cat:p.cat,i:p.i,cls:p.cat==='uc'&&p.i===2?'gold':''})); const warn=cat==='growth'?'<div class="pharaoh-brain-warn">مهم: الازدهار غالبا مرة واحدة على الحساب والكريستالة ليها عدد محدد. اتأكد من اللعبة قبل الطلب.</div>':''; return card('اختار الباقة: '+(names[cat]||'المنتجات'),'لما تدوس على باقة هفتحلك مكانها وانورلك عليها','<div class="pharaoh-brain-note">الخطوة 2 من 4: اختار الباقة</div>'+warn,list.concat([{t:'رشحلي حسب الميزانية',a:'recommend'},{t:'رجوع',a:'start'}]),50)}
  function recommend(amount){amount=Number(amount||0); if(!amount)return card('رشحلي باقة حسب الميزانية','اكتب مثلا: معايا 500 او اختار رقم جاهز','<span class="pharaoh-brain-chip">100ج</span><span class="pharaoh-brain-chip">250ج</span><span class="pharaoh-brain-chip">500ج</span><span class="pharaoh-brain-chip">1200ج</span>',[
    {t:'100 جنيه',a:'budget',v:'100'},{t:'250 جنيه',a:'budget',v:'250'},{t:'500 جنيه',a:'budget',v:'500',cls:'gold'},{t:'1200 جنيه',a:'budget',v:'1200'},{t:'القائمة الرئيسية',a:'main'}
  ],35); const choices=packs.filter(p=>p.price<=amount).sort((a,b)=>b.price-a.price).slice(0,4); if(!choices.length)return card('الميزانية قليلة شوية','اقل حاجة تقريبا 50 جنيه','<div class="pharaoh-brain-note">زود الميزانية شوية او اختار 60 UC</div>',[{t:'60 UC',a:'pick',cat:'uc',i:0,cls:'gold'},{t:'القائمة الرئيسية',a:'main'}]); return card('انسب اختيارات لميزانية '+money(amount),'اخترتلك اقرب باقات تستفيد منها','<div class="pharaoh-brain-note">دوس على الباقة اللي عجبتك وهفتحها لك</div>',choices.map(c=>({t:c.name+' - '+money(c.price),a:'pick',cat:c.cat,i:c.i,cls:c.price===choices[0].price?'gold':''})).concat([{t:'افتح المنتجات',a:'products'}]),55)}
  function payment(){return card('طرق الدفع','بعد الدفع ارفع سكرين واضح في السلة','<div class="pharaoh-brain-note">🟢 InstaPay<br>📱 Vodafone Cash / Orange / Etisalat / WE Wallet</div><div class="pharaoh-brain-warn">لو التحويل من رقم تاني اكتب اخر 3 ارقام من رقم التحويل عشان نراجع الطلب بسرعة.</div>',[
    {t:'افتح السلة',a:'cart',cls:'gold'},{t:'طريقة الشحن',a:'start'},{t:'كلم الدعم',href:SUPPORT},{t:'القائمة الرئيسية',a:'main'}
  ],75)}
  function track(phone){return card('متابعة الطلب','اكتب رقم الموبايل اللي عملت بيه الطلب في سجل الطلبات','<div class="pharaoh-brain-note">لو كتبت رقم موبايل هنا هفتحلك صفحة المتابعة. لازم الرقم يكون 11 رقم ويبدأ ب 01.</div>',[
    {t:'افتح سجل الطلبات',a:'track',cls:'green'},{t:'مشكلة في الطلب',a:'problem'},{t:'كلم الدعم',href:SUPPORT},{t:'القائمة الرئيسية',a:'main'}
  ],65)}
  function problem(){return card('حل مشكلة في الطلب','اختار المشكلة وانا اقولك تعمل ايه','<div class="pharaoh-brain-note">لو الطلب لسه قيد المراجعة تقدر تصلح بياناته من سجل الطلبات لو متاح لك زر التعديل.</div>',[
    {t:'ID غلط',a:'badid'},{t:'سكرين مش واضح',a:'badshot'},{t:'الطلب اتأخر',a:'late'},{t:'دفعت ومش ظاهر',a:'paid'},{t:'افتح سجل الطلبات',a:'track',cls:'green'},{t:'الدعم المباشر',href:SUPPORT}
  ],60)}
  function issue(kind){const map={badid:['ID غلط','افتح سجل الطلبات برقمك. لو الطلب محتاج تعديل هتلاقي زر تعديل ID واسم الحساب. لو الطلب اتنفذ خلاص كلم الدعم بسرعة.'],badshot:['سكرين مش واضح','ارفع سكرين واضح يظهر المبلغ والوقت واسم او رقم التحويل. لو التحويل من رقم تاني اكتب اخر 3 ارقام.'],late:['الطلب اتأخر','افتح سجل الطلبات وشوف الحالة. لو الحالة ثابتة فترة طويلة كلم الدعم وابعت رقم الطلب.'],paid:['دفعت ومش ظاهر','راجع انك رفعت السكرين وكتبت رقم التحويل صح. لو كل حاجة تمام افتح سجل الطلبات او كلم الدعم.']}; const m=map[kind]||map.late; return card(m[0],'هحلها معاك خطوة خطوة','<div class="pharaoh-brain-note">'+m[1]+'</div>',[{t:'افتح سجل الطلبات',a:'track',cls:'green'},{t:'افتح السلة',a:'cart'},{t:'كلم الدعم',href:SUPPORT},{t:'القائمة الرئيسية',a:'main'}])}
  function hours(){return card('مواعيد العمل','تقدر تعمل الطلب في اي وقت والتنفيذ حسب المواعيد','<div class="pharaoh-brain-note">كل يوم من 12 صباحا لحد 5 الفجر<br>الاثنين والاربعاء والخميس والجمعة من 3 العصر لحد 5 الفجر</div>',[{t:'اعمل الطلب عادي',a:'start',cls:'gold'},{t:'القائمة الرئيسية',a:'main'}])}
  function fallback(q){return card('مش فاهم قصدك بالظبط يا بطل','اختار من دول وانا هساعدك فوراً','<div class="pharaoh-brain-note">ممكن تكتب: عايز اشحن - فين طلبي - معايا 500 - طرق الدفع - مشكلة في الطلب</div>',[
    {t:'عايز اشحن',a:'start',cls:'gold'},{t:'تابع طلبي',a:'track',cls:'green'},{t:'طرق الدفع',a:'payment'},{t:'مشكلة في الطلب',a:'problem'},{t:'رشحلي باقة',a:'recommend'},{t:'الدعم',href:SUPPORT}
  ])}
  function reply(q){const raw=String(q||'').trim(); const t=normalize(raw); const n=nums(raw); const first=n[0]||0;
    if(!t)return main();
    const directDigits=arDigits(raw).replace(/\D/g,'');
    if(!(directDigits.length===11&&directDigits.indexOf('01')===0)){
      const directAmounts=(arDigits(raw).match(/\d{2,6}/g)||[]).map(Number).filter(x=>x>=20&&x<=200000);
      if(directAmounts.length)return recommend(directAmounts[directAmounts.length-1]);
    }
    if(/^(ازيك|ازيك يا|عامل ايه|السلام عليكم|سلام عليكم|الو|هاي|hi|hello|اهلا|صباح|مساء)/.test(t))return card('نورت يا بطل 👑','انا تمام ومعاك فرعون من MOBA SHOP','<div class="pharaoh-brain-note">تحب نبدأ شحن جديد ولا تتابع طلب؟</div>',[{t:'ابدأ شحن',a:'start',cls:'gold'},{t:'تابع طلبي',a:'track',cls:'green'},{t:'طرق الدفع',a:'payment'},{t:'الدعم',href:SUPPORT}],15);
    if(/^(تمام|ماشي|اوكي|ok|شكرا|تسلم|حلو|جامد|اشطا)/.test(t))return card('تحت امرك دايما 👑','نكمل على ايه؟','', [{t:'شحن جديد',a:'start',cls:'gold'},{t:'تابع طلب',a:'track',cls:'green'},{t:'القائمة الرئيسية',a:'main'}]);
    if(/قائمه|القائمه|الرئيسيه|menu/.test(t))return main();
    if(/ابدا من الاول|من الاول|reset/.test(t))return start();
    if((/معايا|ميزانيه|ميزانية|رشح|اقترح|باقة|باقه|كام/.test(t)&&first)||(/\d/.test(arDigits(raw))&&/ج|جنيه|egp/.test(t)))return recommend(first);
    if(/رشح|ميزانيه|ميزانية|اقترح/.test(t))return recommend(0);
    if(/ازدهار|growth/.test(t))return catalog('growth');
    if(/كريستال|كريستاله|كريستالة|جوهرة|جوهره/.test(t))return catalog('growth');
    if(/برايم|prime/.test(t))return catalog('prime');
    if(/uc|شدات|شدة|شده|ببجي|pubg/.test(t))return catalog('uc');
    if(/اشحن|شحن|عايز|عاوز|ابدأ|ابدا|اوردر|طلب جديد/.test(t))return start();
    if(/دفع|ادفع|فودافون|انستا|insta|محفظه|محفظة|wallet|كاش/.test(t))return payment();
    if(/فين|تابع|حاله|حالة|طلبي|طلبى|اتشحن|اتأخر|اتأخر|اتأخرت|متشحنش|order/.test(t))return track();
    if(/^01\d{9}$/.test(arDigits(raw).replace(/\s/g,'')))return track(raw);
    if(/مشكله|مشكلة|غلط|سكرين|مش واضح|ايدي|id غلط|دعم|كلم/.test(t))return problem();
    if(/مواعيد|ميعاد|شغال|مفتوح|مقفول|امتي|امتى/.test(t))return hours();
    return fallback(raw)
  }
  function handleAct(a,btn){const cat=btn&&btn.dataset.cat, i=btn&&btn.dataset.i, v=btn&&btn.dataset.v; if(a==='main'){bot(main());return} if(a==='reset'||a==='start'){bot(start());return} if(a==='catalog'){go('#productsSection','game');setCat(cat||'uc');bot(catalog(cat||'uc'));return} if(a==='pick'){pick(cat||'uc',Number(i||0));bot(card('فتحتلك الباقة 👑','كمل البيانات في الكارت اللي نورتلك عليه','<div class="pharaoh-brain-note">الخطوة 3 من 4: اكتب ID واسم الحساب ثم ضيف للسلة.</div>',[{t:'افتح السلة بعد الإضافة',a:'cart',cls:'gold'},{t:'استخدم آخر ID',a:'lastid'},{t:'رجوع للباقات',a:'catalog',cat:cat||'uc'}],80));return} if(a==='products'){go('#productsSection','game');bot(catalog(localStorage.getItem('pharaoh_last_cat')||'uc'));return} if(a==='games'){go('#gamesHome','home');bot('فتحتلك الالعاب يا بطل 👑 اختار اللعبة وبعدها فرعون يكملك.');return} if(a==='cart'){go('#cartSection','cart');bot(card('فتحتلك السلة','راجع البيانات واختار طريقة الدفع وارفع السكرين','<div class="pharaoh-brain-note">الخطوة 4 من 4: الدفع ورفع الاسكرين.</div>',[{t:'طرق الدفع',a:'payment'},{t:'تابع طلبي',a:'track',cls:'green'}],100));return} if(a==='track'){go('#trackOrder','orders');bot(track());return} if(a==='payment'){bot(payment());return} if(a==='problem'){bot(problem());return} if(a==='recommend'){bot(recommend(0));return} if(a==='budget'){bot(recommend(Number(v||0)));return} if(['badid','badshot','late','paid'].includes(a)){bot(issue(a));return} if(a==='hours'){bot(hours());return} if(a==='lastid'){try{const id=localStorage.getItem('moba_last_pubg_id')||''; const name=localStorage.getItem('moba_last_pubg_name')||''; if(!id){bot('مفيش ID محفوظ قبل كده يا بطل. اكتب ID واسم الحساب مرة وهيتحفظوا بعد كده.');return} qsa('input[id^="id_"]').forEach(x=>x.value=id); qsa('input[id^="name_"]').forEach(x=>x.value=name); bot('حطيت آخر ID محفوظ في الكروت الظاهرة. راجعه قبل الإضافة للسلة 👑')}catch(e){bot('مش قادر اقرأ آخر ID محفوظ.')}} }
  function ask(q){if(!String(q||'').trim())return; user(q); bot(reply(q))}
  function send(){const inp=input(); if(!inp)return; const q=inp.value.trim(); if(!q)return; inp.value=''; ask(q); setTimeout(()=>inp.focus(),40)}
  window.__pharaohBrainV67={send,handleAct,ask};
  document.addEventListener('submit',function(e){if(e.target&&e.target.id==='pharaohChatForm'){e.preventDefault();e.stopImmediatePropagation();send();return false}},true);
  document.addEventListener('click',function(e){const sendBtn=e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)'); if(sendBtn&&sendBtn.closest('#pharaohChatForm')){e.preventDefault();e.stopImmediatePropagation();send();return false} const q=e.target.closest('[data-pharaoh-q]'); if(q){e.preventDefault();e.stopImmediatePropagation();user(q.dataset.pharaohQ);bot(reply(q.dataset.pharaohQ));return false} const old=e.target.closest('[data-v65-act],[data-pharaoh-action]'); if(old&&!e.target.closest('[data-v67-act]')){const val=old.dataset.v65Act||old.dataset.pharaohAction; if(val){e.preventDefault();e.stopImmediatePropagation();handleAct(val,old);return false}} const act=e.target.closest('[data-v67-act]'); if(act){e.preventDefault();e.stopImmediatePropagation();handleAct(act.dataset.v67Act,act);return false}},true);
  document.addEventListener('keydown',function(e){if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();send();return false}},true);
  setTimeout(()=>{const b=body(); if(b&&!qs('.pharaoh-brain-welcome',b)){const d=document.createElement('div');d.className='pharaoh-msg bot pharaoh-brain-new pharaoh-brain-welcome';d.innerHTML=main();const ty=typing(); if(ty&&ty.parentElement===b)b.insertBefore(d,ty);else b.appendChild(d)}},900);
})();


/* moba-v68-pharaoh-reliable-events */
(function(){
  function api(){return window.__pharaohBrainV67}
  function isPharaohEventTarget(target){
    return target && target.closest && target.closest('#pharaohChatPanel,#pharaohChatForm,#pharaohAssistantFab');
  }
  function stop(e){
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  }
  window.addEventListener('click',function(e){
    if(!isPharaohEventTarget(e.target)) return;
    const brain=api();
    if(!brain) return;
    const send=e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');
    if(send && send.closest('#pharaohChatForm')){
      stop(e);
      if(typeof window.__pharaohPrioritySendV97==='function' && window.__pharaohPrioritySendV97()) return false;
      if(typeof window.__pharaohForceSendV69==='function') window.__pharaohForceSendV69();
      else brain.send();
      return false;
    }
    const act=e.target.closest('[data-v67-act]');
    if(act){
      stop(e);
      brain.handleAct(act.dataset.v67Act,act);
      return false;
    }
    const quick=e.target.closest('[data-pharaoh-q]');
    if(quick){
      stop(e);
      brain.ask(quick.dataset.pharaohQ || quick.textContent || '');
      return false;
    }
  },true);
  window.addEventListener('submit',function(e){
    if(e.target && e.target.id==='pharaohChatForm' && api()){
      stop(e);
      if(typeof window.__pharaohForceSendV69==='function') window.__pharaohForceSendV69();
      else api().send();
      return false;
    }
  },true);
  window.addEventListener('keydown',function(e){
    if(e.target && e.target.id==='pharaohChatInput' && e.key==='Enter' && api()){
      stop(e);
      if(typeof window.__pharaohForceSendV69==='function') window.__pharaohForceSendV69();
      else api().send();
      return false;
    }
  },true);
})();


/* moba-v69-pharaoh-force-send */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function body(){return qs('#pharaohChatBody')}
  function typing(){return qs('#pharaohTyping')}
  function add(type,html){
    const b=body(); if(!b)return;
    const msg=document.createElement('div');
    msg.className='pharaoh-msg '+type+(type==='bot'?' pharaoh-brain-new':'');
    msg.innerHTML=html;
    const t=typing();
    if(t&&t.parentElement===b)b.insertBefore(msg,t);else b.appendChild(msg);
    b.scrollTop=b.scrollHeight;
  }
  function welcomeHtml(){
    return '<div class="pharaoh-brain-card pharaoh-v70-home"><b>أنا معاك يا بطل</b><small>اختار اللي محتاجه وفرعون يظبطهولك خطوة بخطوة</small><div class="pharaoh-brain-note">شحن جديد ولا متابعة طلب ولا عندك مشكلة؟</div><div class="pharaoh-brain-actions"><button class="gold" type="button" data-v70-act="start">ابدأ الشحن جديد</button><button class="green" type="button" data-v70-act="track">تابع طلبي</button><button type="button" data-v70-act="payment">طرق الدفع</button><button type="button" data-v70-act="problem">مشكلة في الطلب</button></div></div>';
  }
  function clearToWelcome(){
    const b=body(); if(!b)return;
    Array.from(b.querySelectorAll('.pharaoh-msg')).forEach(x=>x.remove());
    add('bot',welcomeHtml());
  }
  function keepChatShort(){
    const b=body(); if(!b)return;
    const msgs=Array.from(b.querySelectorAll('.pharaoh-msg'));
    if(msgs.length<=8)return;
    msgs.slice(0,Math.max(0,msgs.length-5)).forEach(x=>x.remove());
    if(!b.querySelector('.pharaoh-v70-home')) add('bot',welcomeHtml());
  }
  function scheduleReset(){
    clearTimeout(window.__pharaohV70ResetTimer);
    window.__pharaohV70ResetTimer=setTimeout(clearToWelcome,45000);
  }
  function fallbackReply(q){
    const t=String(q||'').toLowerCase();
    if(/الغي|الغاء|إلغاء|كنسل|cancel|مش عايز|مش عاوز|بلاش|وقف|عايز الغي|عاوز الغي/.test(t))return '<div class="pharaoh-v85-card"><b>تمام، ألغيت الخطوة الحالية</b><small>لو حبيت تبدأ من جديد اكتب: عايز أشحن، أو اكتب ميزانيتك مباشرة.</small></div>';
    if(/مش فاهم|مش فاهمك|اعمل ايه|مساعده|مساعدة|ساعدني|ايه المطلوب|اكتب ايه|فهمني/.test(t))return '<div class="pharaoh-v85-card"><b>أنا معاك خطوة بخطوة</b><small>اكتبلي طلبك عادي: معايا 500، عايز أشحن، فين طلبي، عايز ألغي، أو طرق الدفع.</small></div>';
    const clean=String(q||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    const allDigits=clean.replace(/\D/g,'');
    if(!(allDigits.length===11&&allDigits.indexOf('01')===0)){
      const amounts=(clean.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20&&n<=200000);
      if(amounts.length){
        const amount=amounts[amounts.length-1];
        setTimeout(()=>{if(window.__pharaohV91&&typeof window.__pharaohV91.start==='function')window.__pharaohV91.start(String(amount));},80);
        return '<div class="pharaoh-v85-card"><b>فهمت إن معاك '+amount.toLocaleString('en-US')+' جنيه</b><small>هطلعلك أفضل ترشيحات مناسبة. تقدر تكتبها كده: 500، 500ج، معايا 500، أو 2000 جنيه.</small></div>';
      }
    }
    if(/شدات|uc|ببجي|pubg/.test(t))return 'اختار قسم شدات UC، وبعدها دوس على الباقة واكتب ID واسم الحساب ثم ضيف للسلة.';
    if(/ازدهار|كريستال|كريستالة|جوهرة/.test(t))return 'الازدهار والكريستالة لازم تتأكد إنهم متاحين داخل اللعبة قبل الطلب، وبعدها اختار الباقة المناسبة.';
    if(/دفع|فودافون|انستا|insta|wallet|كاش/.test(t))return 'طرق الدفع: InstaPay أو محافظ الموبايل. بعد التحويل ارفع سكرين واضح من السلة.';
    if(/طلب|فين|اتأخر|متابعة|حالة|اوردر|order/.test(t))return 'افتح سجل الطلبات واكتب نفس رقم الموبايل اللي عملت بيه الطلب عشان تظهر الحالة.';
    if(/مشكلة|غلط|سكرين|id|ايدي|دعم/.test(t))return 'لو في مشكلة افتح سجل الطلبات. لو التعديل متاح هتلاقي زر تعديل، ولو الطلب اتنفذ كلم الدعم مباشرة.';
    if(/ميزانية|معايا|كام|رشح/.test(t))return 'اكتبلي الميزانية بالأرقام، مثال: معايا 500 جنيه، وأنا أرشحلك أنسب باقة.';
    if(/سلام|ازيك|اهلا|هاي|hi|hello/.test(t))return 'نورت يا بطل. تحب نبدأ شحن جديد، تتابع طلبك، ولا تعرف طرق الدفع؟';
    return 'أنا معاك يا بطل. اكتب عايز أشحن، فين طلبي، طرق الدفع، أو معايا ميزانية كام، وأنا أساعدك خطوة بخطوة.';
  }
  function forceSend(){
    const input=qs('#pharaohChatInput');
    if(!input)return;
    const text=input.value.trim();
    if(!text)return;
    input.value='';
    const t=typing();
    if(t)t.classList.add('show');
    setTimeout(function(){
      if(t)t.classList.remove('show');
      add('user',esc(text));
      add('bot',fallbackReply(text));
      keepChatShort();
      scheduleReset();
    },220);
    setTimeout(()=>input.focus(),40);
  }
  window.__pharaohForceSendV69=forceSend;
  function isSendTarget(target){
    return target && target.closest && target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');
  }
  [].forEach(function(ev){
    window.addEventListener(ev,function(e){
      if(!isSendTarget(e.target))return;
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      forceSend();
      return false;
    },true);
  });
  window.addEventListener('keydown',function(e){
    return;
    if(e.target && e.target.id==='pharaohChatInput' && e.key==='Enter'){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      forceSend();
      return false;
    }
  },true);
  document.addEventListener('focusin',function(e){
    if(e.target && e.target.closest && e.target.closest('#pharaohChatPanel')){
      document.body.classList.remove('pharaoh-writing-v63');
      qs('#pharaohAssistantFab')?.classList.remove('pharaoh-smart-hide');
    }
  },true);
  document.addEventListener('click',function(e){
    const btn=e.target.closest && e.target.closest('[data-v70-act]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    const a=btn.dataset.v70Act;
    if(a==='start') add('bot','اختار اللعبة وبعدها الباقة. لو PUBG اختار شدات UC أو ازدهار أو برايم، وبعدها اكتب ID واسم الحساب.');
    if(a==='track') add('bot','افتح سجل الطلبات واكتب رقم الموبايل اللي عملت بيه الطلب، وهيظهرلك آخر حالة.');
    if(a==='payment') add('bot','الدفع متاح عن طريق InstaPay ومحافظ الموبايل. بعد التحويل ارفع سكرين واضح في السلة.');
    if(a==='problem') add('bot','اختار نوع المشكلة: ID غلط، سكرين مش واضح، الطلب اتأخر، أو محتاج دعم مباشر.');
    keepChatShort();
    scheduleReset();
    return false;
  },true);
  setTimeout(clearToWelcome,1200);
})();


/* moba-v84-pharaoh-life-motion */
(function(){
  function setupPharaohMotion(){
    const fab=document.getElementById('pharaohAssistantFab');
    if(!fab || fab.dataset.v84Motion)return;
    const character=fab.querySelector('.pharaoh-character');
    if(!character)return;
    fab.dataset.v84Motion='1';
    if(!character.querySelector('.pharaoh-wave-hand-v84')){
      const hand=document.createElement('span');
      hand.className='pharaoh-wave-hand-v84';
      hand.textContent='👋';
      character.appendChild(hand);
    }
    if(!character.querySelector('.pharaoh-land-dust-v84')){
      const dust=document.createElement('span');
      dust.className='pharaoh-land-dust-v84';
      character.appendChild(dust);
    }
    let waveTimer;
    function waveNow(){
      fab.classList.remove('pharaoh-wave-now-v84');
      void fab.offsetWidth;
      fab.classList.add('pharaoh-wave-now-v84');
      clearTimeout(waveTimer);
      waveTimer=setTimeout(()=>fab.classList.remove('pharaoh-wave-now-v84'),1900);
    }
    fab.addEventListener('mouseenter',waveNow);
    fab.addEventListener('click',waveNow);
    const observer=new MutationObserver(function(){
      if(fab.classList.contains('drop-bounce')){
        fab.classList.add('pharaoh-landed-v84');
        setTimeout(()=>fab.classList.remove('pharaoh-landed-v84'),850);
      }
    });
    observer.observe(fab,{attributes:true,attributeFilter:['class']});
    setInterval(function(){
      if(!fab.classList.contains('dragging') && !fab.classList.contains('drop-bounce')) waveNow();
    },11000);
    setTimeout(waveNow,900);
  }
  setupPharaohMotion();
  document.addEventListener('DOMContentLoaded',setupPharaohMotion);
  setTimeout(setupPharaohMotion,400);
})();


/* moba-v85-pharaoh-service-brain */
(function(){
  const SUPPORT='https://t.me/MOFR3OON';
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function money(n){try{return Number(n||0).toLocaleString('en-US')+' جنيه'}catch(e){return (n||0)+' جنيه'}}
  function body(){return qs('#pharaohChatBody')}
  function typing(){return qs('#pharaohTyping')}
  function input(){return qs('#pharaohChatInput')}
  function cart(){return Array.isArray(window.cart)?window.cart:[]}
  function cartTotal(){return cart().reduce((s,x)=>s+Number(x.price||0)*Math.max(1,Number(x.qty||1)),0)}
  function page(){return document.body.dataset.page||'home'}
  function add(type,html){
    const b=body(); if(!b)return;
    const msg=document.createElement('div');
    msg.className='pharaoh-msg '+type+(type==='bot'?' pharaoh-brain-new':'');
    msg.innerHTML=html;
    const t=typing();
    if(t&&t.parentElement===b)b.insertBefore(msg,t);else b.appendChild(msg);
    b.scrollTop=b.scrollHeight;
    trimChat();
  }
  function user(t){add('user',esc(t))}
  function bot(html){add('bot',html); wave();}
  function card(title,small,inner,actions){
    return `<div class="pharaoh-v85-card"><b>${title}</b>${small?`<small>${small}</small>`:''}${inner||''}${actions?act(actions):''}</div>`;
  }
  function act(rows){
    return '<div class="pharaoh-v85-actions">'+rows.map(r=>r.href?
      `<a class="${r.cls||''}" href="${r.href}" target="_blank" rel="noopener">${r.t}</a>`:
      `<button type="button" class="${r.cls||''}" data-v85-act="${r.a||''}" ${r.v!=null?`data-v="${esc(r.v)}"`:''}>${r.t}</button>`).join('')+'</div>';
  }
  function trimChat(){
    const b=body(); if(!b)return;
    const msgs=qsa('.pharaoh-msg',b);
    if(msgs.length>10) msgs.slice(0,msgs.length-7).forEach(x=>x.remove());
  }
  function wave(){const f=qs('#pharaohAssistantFab'); if(f){f.classList.add('pharaoh-wave-now-v84'); setTimeout(()=>f.classList.remove('pharaoh-wave-now-v84'),1200)}}
  function show(view){
    if(typeof window.mobaShowView==='function') window.mobaShowView(view);
    else location.hash = view==='cart'?'#cartSection':view==='orders'?'#trackOrder':view==='game'?'#productsSection':'#gamesHome';
  }
  function digits(t){
    return String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/\d+/g)?.join('')||'';
  }
  function budget(t){
    const nums=String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/\d+/g)||[];
    return nums.length?Number(nums[nums.length-1]):0;
  }
  function products(){
    const all=[];
    const src=window.mobaProducts||{};
    Object.keys(src).forEach(cat=>(src[cat]||[]).forEach((p,i)=>all.push({...p,cat,i})));
    return all;
  }
  function findProductByBudget(amount){
    return products().filter(p=>Number(p.price||0)<=amount).sort((a,b)=>Number(b.price||0)-Number(a.price||0)).slice(0,4);
  }
  function welcome(){
    return card('أنا معاك خطوة بخطوة','اختار اللي محتاجه وفرعون يفتحلك المكان الصح',
      '<div class="pharaoh-v85-mini-grid"><span>شحن جديد</span><span>متابعة طلب</span><span>ترشيح بميزانية</span><span>فحص الطلب</span></div>',
      [{t:'ابدأ الشحن',a:'start',cls:'gold'},{t:'تابع طلبي',a:'track',cls:'green'},{t:'رشحلي باقة',a:'budget'},{t:'افحص طلبي',a:'check'}]);
  }
  function start(){
    return card('خطة الطلب السريعة','امشي معايا من غير لف',
      '<div class="pharaoh-v85-note">1) اختار اللعبة<br>2) اختار الباقة<br>3) اكتب ID واسم الحساب<br>4) ضيف للسلة<br>5) اختار الدفع وارفع السكرين</div>',
      [{t:'افتح الألعاب',a:'games',cls:'gold'},{t:'افتح المنتجات',a:'products'},{t:'استخدم آخر ID',a:'last'},{t:'افحص السلة',a:'check'}]);
  }
  function budgetReply(amount){
    if(!amount) return card('اكتب ميزانيتك','مثال: معايا 300 جنيه أو عايز باقة بـ 500',
      '<div class="pharaoh-v85-note">هختارلك أقرب باقات مناسبة للرقم اللي تكتبه.</div>',
      [{t:'100 جنيه',a:'budgetPick',v:100},{t:'250 جنيه',a:'budgetPick',v:250},{t:'500 جنيه',a:'budgetPick',v:500},{t:'1000 جنيه',a:'budgetPick',v:1000}]);
    const list=findProductByBudget(amount);
    if(!list.length) return card('الميزانية قليلة شوية','أقل باقة غالبًا محتاجة تزود الميزانية بسيطة',
      '<div class="pharaoh-v85-warn">جرب تبدأ من أرخص باقة UC متاحة.</div>',
      [{t:'افتح المنتجات',a:'products',cls:'gold'}]);
    return card('أنسب اختيارات لميزانية '+money(amount),'اخترتلك أقرب باقات تستفيد منها',
      '<div class="pharaoh-v85-mini-grid">'+list.map(p=>`<span>${esc(p.name)}<br><b>${money(p.price)}</b></span>`).join('')+'</div>',
      list.map(p=>({t:p.name+' - '+money(p.price),a:'openProduct',v:p.cat+':'+p.i,cls:p===list[0]?'gold':''})).concat([{t:'افتح المنتجات',a:'products'}]));
  }
  function payment(){
    return card('مساعد الدفع','بعد التحويل ارفع سكرين واضح من السلة',
      '<div class="pharaoh-v85-note">InstaPay: mofr3oon1<br>المحافظ: 01061707294<br>السكرين لازم يوضح المبلغ والوقت وبيانات التحويل.</div>',
      [{t:'افتح السلة',a:'cart',cls:'gold'},{t:'اختار InstaPay',a:'pay',v:'InstaPay'},{t:'اختار محفظة',a:'pay',v:'Wallet'},{t:'نسخ الرقم',a:'copyPhone'}]);
  }
  function checkOrder(){
    const issues=[];
    if(!cart().length) issues.push('السلة فاضية، ضيف منتج الأول.');
    const form=qs('#orderForm');
    if(form){
      const phone=form.querySelector('[name="customerPhone"]')?.value.trim()||'';
      const method=form.querySelector('[name="paymentMethod"]')?.value||'';
      const shot=form.querySelector('[name="screenshot"]');
      const transfer=form.querySelector('[name="transferMode"]:checked')?.value||'';
      const last3=form.querySelector('[name="transferLast3"]')?.value.trim()||'';
      if(cart().length && !/^01\d{9}$/.test(phone)) issues.push('رقم الموبايل لازم 11 رقم ويبدأ بـ 01.');
      if(cart().length && !method) issues.push('اختار طريقة الدفع.');
      if(cart().length && !transfer) issues.push('حدد التحويل من نفس الرقم ولا رقم تاني.');
      if(transfer==='other' && !/^\d{3}$/.test(last3)) issues.push('لو التحويل من رقم تاني اكتب آخر 3 أرقام.');
      if(cart().length && shot && !shot.files.length) issues.push('ارفع سكرين التحويل.');
    }
    if(!issues.length) return card('طلبك جاهز تقريبًا','راجع ID والاسم قبل التنفيذ',
      '<div class="pharaoh-v85-note">الإجمالي الحالي: <b>'+money(cartTotal())+'</b><br>لو كل البيانات صح دوس تنفيذ الشراء.</div>',
      [{t:'افتح السلة',a:'cart',cls:'gold'},{t:'طرق الدفع',a:'payment'}]);
    return card('لسه ناقص شوية','صلح الحاجات دي قبل تنفيذ الطلب',
      '<div class="pharaoh-v85-warn">'+issues.map(x=>'• '+esc(x)).join('<br>')+'</div>',
      [{t:'افتح السلة',a:'cart',cls:'gold'},{t:'طرق الدفع',a:'payment'},{t:'الدعم',href:SUPPORT}]);
  }
  function track(phone){
    if(!phone) return card('متابعة الطلب من الشات','اكتب رقم الموبايل اللي عملت بيه الطلب',
      '<div class="pharaoh-v85-note">مثال: 010xxxxxxxx، وأنا هفتح سجل الطلبات وأبحث عنه.</div>',
      [{t:'افتح سجل الطلبات',a:'orders',cls:'green'}]);
    show('orders');
    setTimeout(()=>{
      const inp=qs('#trackPhone'); const form=qs('#trackForm');
      if(inp){inp.value=phone}
      if(form) form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    },250);
    return card('فتحتلك سجل الطلبات','بدور برقم: '+esc(phone),
      '<div class="pharaoh-v85-note">لو فيه طلب على الرقم ده هيظهر حالته وتفاصيله.</div>',
      [{t:'تواصل دعم',href:SUPPORT},{t:'رجوع للشحن',a:'start'}]);
  }
  function problem(){
    return card('حل المشكلة بسرعة','اختار نوع المشكلة',
      '<div class="pharaoh-v85-note">لو الطلب محتاج تعديل هتلاقي زر التعديل في سجل الطلبات. لو اتنفذ بالفعل كلم الدعم فورًا.</div>',
      [{t:'ID غلط',a:'badid'},{t:'سكرين مش واضح',a:'badshot'},{t:'الطلب اتأخر',a:'late'},{t:'الدعم المباشر',href:SUPPORT,cls:'danger'}]);
  }
  function explainGrowth(){
    return card('تنبيه مهم','الازدهار والكريستالة لازم تتراجع من اللعبة قبل الطلب',
      '<div class="pharaoh-v85-warn">الازدهار غالبًا مرة واحدة على الحساب، والكريستالة لها عدد محدود حسب حسابك. اتأكد إنها متاحة قبل الدفع.</div>',
      [{t:'افتح الازدهار',a:'growth',cls:'gold'},{t:'اسأل الدعم',href:SUPPORT}]);
  }
  function reply(q){
    const t=String(q||'').trim(), low=t.toLowerCase(), num=digits(t), amount=budget(t);
    if(/^01\d{9}$/.test(num)) return track(num);
    if(/فلوس|فلوسي|نصب|راحت|مش شغال|مش بيرد|دعم|تواصل|مشكلة كبيرة/.test(t)) return card('هتصرف معاك بسرعة','لو الموضوع مستعجل افتح الدعم مباشر',
      '<div class="pharaoh-v85-warn">ابعت رقم الطلب أو رقم الموبايل وسكرين التحويل للدعم.</div>',
      [{t:'الدعم المباشر',href:SUPPORT,cls:'danger'},{t:'سجل الطلبات',a:'orders'}]);
    if(/معايا|ميزانية|ميزانيه|كام|رشح|باقة|باقه|budget/.test(t)) return budgetReply(amount);
    if(/فين|تابع|حالة|طلبي|طلبى|order|اوردر/.test(t)) return track(/^01\d{9}$/.test(num)?num:'');
    if(/دفع|فودافون|انستا|insta|wallet|محفظة|كاش/.test(t)) return payment();
    if(/افحص|راجع|جاهز|ناقص|قبل التنفيذ/.test(t)) return checkOrder();
    if(/ازدهار|كريستال|كريستالة|جوهرة|growth|crystal/.test(t)) return explainGrowth();
    if(/كوبون|خصم|coupon/.test(t)) return card('الكوبون','افتح السلة واضغط كوبون خصم فوق الإجمالي',
      '<div class="pharaoh-v85-note">لو الكود مش مناسب هقولك برسالة بسيطة بدون أخطاء تقنية.</div>',
      [{t:'افتح السلة',a:'cart',cls:'gold'}]);
    if(/ارخص|أرخص|اقل|أقل/.test(t)) return budgetReply(100);
    if(/اكتر طلب|الأكثر|الاكثر|popular/.test(t)) return card('الأكثر طلبًا','غالبًا باقات 325 UC و660 UC مناسبة لمعظم الطلبات',
      '<div class="pharaoh-v85-note">لو معاك ميزانية معينة اكتبها وأنا أرشح الأقرب.</div>',
      [{t:'افتح المنتجات',a:'products',cls:'gold'},{t:'رشحلي بميزانية',a:'budget'}]);
    if(/اشحن|ابدأ|عايز|start/.test(t)) return start();
    if(/سلام|ازيك|اهلا|هاي|hi|hello/.test(low)) return welcome();
    return card('اختار اللي محتاجه','ممكن أساعدك في الشحن والمتابعة والدفع والمشاكل',
      '<div class="pharaoh-v85-note">اكتب مثلًا: معايا 500، فين طلبي، طرق الدفع، افحص طلبي، أو مشكلة في الطلب.</div>',
      [{t:'ابدأ الشحن',a:'start',cls:'gold'},{t:'تابع طلبي',a:'track',cls:'green'},{t:'طرق الدفع',a:'payment'},{t:'مشكلة',a:'problem'}]);
  }
  function send(){
    const inp=input(); if(!inp)return;
    const text=inp.value.trim(); if(!text)return;
    inp.value='';
    user(text);
    const ty=typing(); if(ty)ty.classList.add('show');
    setTimeout(()=>{if(ty)ty.classList.remove('show'); bot(reply(text));},260);
  }
  function openProduct(v){
    const [cat,i]=String(v||'').split(':');
    show('game');
    setTimeout(()=>{
      const tab=qs(`.tab[data-cat="${cat}"]`);
      if(tab) tab.click();
      setTimeout(()=>{
        const card=qs(`.product[data-card-index="${i}"]`)||qsa('.product')[Number(i)||0];
        if(card){card.scrollIntoView({behavior:'smooth',block:'center'}); card.classList.add('pharaoh-v66-focus'); setTimeout(()=>card.classList.remove('pharaoh-v66-focus'),1600)}
      },180);
    },200);
  }
  function handle(a,v){
    if(a==='start') return bot(start());
    if(a==='games'){show('home');return bot(card('اختار لعبتك','دوس على PUBG Mobile وبعدها اختار الباقة',[].join(''),[{t:'افتح المنتجات',a:'products',cls:'gold'}]))}
    if(a==='products'){show('game');return bot(card('فتحت المنتجات','اختار الباقة واكتب ID واسم الحساب',{toString:()=>'<div class="pharaoh-v85-note">لو مش عارف تختار اكتب ميزانيتك.</div>'},[{t:'رشحلي باقة',a:'budget'}]))}
    if(a==='cart'){show('cart');return bot(checkOrder())}
    if(a==='orders') {show('orders');return bot(track(''))}
    if(a==='track') return bot(track(''));
    if(a==='budget') return bot(budgetReply(0));
    if(a==='budgetPick') return bot(budgetReply(Number(v||0)));
    if(a==='openProduct') return openProduct(v);
    if(a==='payment') return bot(payment());
    if(a==='check') return bot(checkOrder());
    if(a==='problem') return bot(problem());
    if(a==='growth'){show('game'); setTimeout(()=>qs('.tab[data-cat="growth"]')?.click(),200); return bot(explainGrowth())}
    if(a==='pay'){show('cart'); setTimeout(()=>{const s=qs('#paymentMethod'); if(s){s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))}},200); return bot(payment())}
    if(a==='copyPhone'){navigator.clipboard&&navigator.clipboard.writeText('01061707294'); return bot(card('تم نسخ رقم الدفع','01061707294','<div class="pharaoh-v85-note">بعد التحويل ارفع السكرين من السلة.</div>',[{t:'افتح السلة',a:'cart',cls:'gold'}]))}
    if(a==='last'){qsa('input[id^="id_"]').forEach(x=>x.value=localStorage.getItem('moba_last_pubg_id')||''); qsa('input[id^="name_"]').forEach(x=>x.value=localStorage.getItem('moba_last_pubg_name')||''); return bot(card('استخدمت آخر ID محفوظ','راجعه قبل الإضافة للسلة','',null))}
    if(['badid','badshot','late'].includes(a)) return bot(problem());
  }
  function addShortcuts(){
    const b=body(); if(!b || qs('.pharaoh-v85-shortcuts',b))return;
    const wrap=document.createElement('div');
    wrap.className='pharaoh-v85-shortcuts';
    wrap.innerHTML='<button data-v85-act="start">ابدأ الشحن</button><button data-v85-act="budget">رشحلي باقة</button><button data-v85-act="check">افحص طلبي</button><button data-v85-act="track">تابع طلبي</button>';
    const ty=typing();
    if(ty&&ty.parentElement===b)b.insertBefore(wrap,ty); else b.appendChild(wrap);
  }
  function decorateProducts(){
    return;
    qsa('.product').forEach(cardEl=>{
      if(qs('.pharaoh-product-smart-v85',cardEl))return;
      const title=qs('b',cardEl)?.textContent||'';
      const box=document.createElement('div');
      box.className='pharaoh-product-smart-v85';
      box.innerHTML='<button type="button" data-v85-product-help>اسأل فرعون</button><button type="button" data-v85-product-check>فحص سريع</button>';
      cardEl.appendChild(box);
      if(/ازدهار|كريستال|Crystal|Growth/i.test(cardEl.textContent) && !qs('.pharaoh-critical-note',cardEl)){
        const note=document.createElement('div');
        note.className='pharaoh-critical-note';
        note.textContent='اتأكد من توفر العرض داخل اللعبة قبل الطلب.';
        cardEl.appendChild(note);
      }
      box.dataset.title=title;
    });
  }
  function validateProduct(cardEl){
    const id=qs('input[id^="id_"]',cardEl)?.value.trim()||'';
    const name=qs('input[id^="name_"]',cardEl)?.value.trim()||'';
    const issues=[];
    if(!/^\d{5,15}$/.test(id)) issues.push('اكتب PUBG ID أرقام فقط من 5 لـ 15 رقم.');
    if(!name) issues.push('اكتب اسم الحساب داخل اللعبة.');
    return issues;
  }
  document.addEventListener('click',function(e){
    const sendBtn=e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not([data-v85-act]):not(#pharaohMicBtn)');
    if(sendBtn && sendBtn.closest('#pharaohChatForm')){e.preventDefault();e.stopImmediatePropagation();send();return false}
    const actBtn=e.target.closest('[data-v85-act]');
    if(actBtn){e.preventDefault();e.stopImmediatePropagation();handle(actBtn.dataset.v85Act,actBtn.dataset.v);return false}
    const addBtn=e.target.closest('[data-v57-add], .product .btn.add');
    if(addBtn){
      const cardEl=addBtn.closest('.product');
      const issues=cardEl?validateProduct(cardEl):[];
      if(issues.length){bot(card('قبل ما تضيف للسلة','فيه بيانات ناقصة',`<div class="pharaoh-v85-warn">${issues.map(x=>'• '+x).join('<br>')}</div>`,null));}
      else setTimeout(()=>bot(card('تمت الإضافة للسلة','تحب تضيف ID تاني ولا تروح للدفع؟','<div class="pharaoh-v85-note">فاضلك اختيار طريقة الدفع ورفع السكرين.</div>',[{t:'افتح السلة',a:'cart',cls:'gold'},{t:'ضيف منتج تاني',a:'products'}])),450);
    }
    const ph=e.target.closest('[data-v85-product-help]');
    if(ph){const c=ph.closest('.product'); bot(card('عن الباقة دي',qs('b',c)?.textContent||'باقة','<div class="pharaoh-v85-note">اكتب ID واسم الحساب، ولو المنتج ازدهار أو كريستالة اتأكد من توفره داخل اللعبة قبل الدفع.</div>',[{t:'فحص سريع',a:'check'}]));}
    const pc=e.target.closest('[data-v85-product-check]');
    if(pc){const issues=validateProduct(pc.closest('.product')); bot(issues.length?card('الفحص السريع','لسه ناقص',`<div class="pharaoh-v85-warn">${issues.map(x=>'• '+x).join('<br>')}</div>`,null):card('تمام','البيانات شكلها جاهزة للإضافة للسلة','',null));}
  },true);
  document.addEventListener('keydown',function(e){
    if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();send();return false}
  },true);
  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='paymentMethod'&&e.target.value){
      localStorage.setItem('moba_preferred_payment',e.target.value);
      setTimeout(()=>bot(card('تمام، اختارت طريقة الدفع','بعد التحويل ارفع سكرين واضح','<div class="pharaoh-v85-note">لو التحويل من رقم تاني اكتب آخر 3 أرقام.</div>',[{t:'افحص طلبي',a:'check'}])),250);
    }
  });
  document.addEventListener('submit',function(e){
    if(e.target&&e.target.id==='orderForm'){
      const issues=[];
      if(!cart().length) issues.push('السلة فاضية.');
      if(issues.length) bot(checkOrder());
      else bot(card('مراجعة أخيرة','راجع ID والاسم والسكرين قبل الإرسال','<div class="pharaoh-v85-warn">أي ID غلط بعد التنفيذ مسؤولية العميل.</div>',null));
    }
  },true);
  window.__pharaohForceSendV69=send;
  window.__pharaohV85={reply,send,handle,checkOrder};
  setTimeout(()=>{addShortcuts(); decorateProducts(); bot(welcome());},900);
  setInterval(decorateProducts,1800);
})();


/* moba-v87-pharaoh-clean-single-start */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function body(){return qs('#pharaohChatBody')}
  function typing(){return qs('#pharaohTyping')}
  function startHtml(){
    return '<div class="pharaoh-v85-card pharaoh-v87-start"><b>أنا معاك يا بطل</b><small>اختار اللي محتاجه وفرعون يكملك خطوة بخطوة</small><div class="pharaoh-v85-note">شحن جديد، متابعة طلب، فحص الطلب، أو مشكلة؟</div><div class="pharaoh-v85-actions"><button class="gold" type="button" data-v85-act="start">ابدأ الشحن</button><button class="green" type="button" data-v85-act="track">تابع طلبي</button><button type="button" data-v85-act="check">افحص طلبي</button><button type="button" data-v85-act="problem">مشكلة في الطلب</button></div></div>';
  }
  function clean(){
    const b=body(); if(!b)return;
    qsa(':scope > .pharaoh-quick, :scope > .pharaoh-v85-shortcuts',b).forEach(x=>x.remove());
    qsa('.pharaoh-brain-welcome, .pharaoh-v70-home',b).forEach(x=>x.closest('.pharaoh-msg')?.remove());
    const starts=qsa('.pharaoh-v87-start',b);
    starts.slice(1).forEach(x=>x.closest('.pharaoh-msg')?.remove());
    const botMsgs=qsa(':scope > .pharaoh-msg.bot',b);
    if(!starts.length){
      botMsgs.forEach(x=>x.remove());
      const msg=document.createElement('div');
      msg.className='pharaoh-msg bot pharaoh-brain-new';
      msg.innerHTML=startHtml();
      const ty=typing();
      if(ty&&ty.parentElement===b)b.insertBefore(msg,ty); else b.appendChild(msg);
    }else{
      botMsgs.forEach(x=>{
        const isStart=x.querySelector('.pharaoh-v87-start');
        const isOldWelcome=/أهلا بيك|مساعد MOBA SHOP|أقدر أساعدك|MOBA SHOP/.test(x.textContent||'') && !x.querySelector('.pharaoh-v85-card');
        if(!isStart && isOldWelcome) x.remove();
      });
    }
  }
  function smartClean(){
    const b=body(); if(!b)return;
    const hasUser=!!qs('.pharaoh-msg.user',b);
    if(hasUser){
      qsa(':scope > .pharaoh-quick, :scope > .pharaoh-v85-shortcuts',b).forEach(x=>x.remove());
      qsa('.pharaoh-brain-welcome, .pharaoh-v70-home',b).forEach(x=>x.closest('.pharaoh-msg')?.remove());
      qsa('.pharaoh-v87-start',b).slice(1).forEach(x=>x.closest('.pharaoh-msg')?.remove());
      return;
    }
    clean();
  }
  setTimeout(clean,80);
  setTimeout(clean,1050);
  setTimeout(clean,1800);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(clean,120));
  const b=body();
  if(b && 'MutationObserver' in window){
    new MutationObserver(()=>setTimeout(smartClean,0)).observe(b,{childList:true,subtree:true});
  }
})();


/* moba-v89-pharaoh-actions-hard-fix */
(function(){
  function run(btn){
    if(window.__pharaohV91 && typeof window.__pharaohV91.start==='function' && ['start','budget'].includes(btn.dataset.v85Act||'')){
      window.__pharaohV91.start();
      return true;
    }
    const api=window.__pharaohV85;
    if(!api || typeof api.handle!=='function')return false;
    const act=btn.dataset.v85Act;
    if(!act)return false;
    api.handle(act,btn.dataset.v);
    return true;
  }
  document.addEventListener('pointerdown',function(e){
    const btn=e.target.closest && e.target.closest('#pharaohChatBody [data-v85-act]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
  },true);
  document.addEventListener('click',function(e){
    const btn=e.target.closest && e.target.closest('#pharaohChatBody [data-v85-act]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    run(btn);
    return false;
  },true);
})();


/* moba-v90-pharaoh-budget-combo */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function money(n){try{return Number(n||0).toLocaleString('en-US')+' جنيه'}catch(e){return (n||0)+' جنيه'}}
  function normalizeNum(t){return String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))}
  function amountFrom(t){const m=normalizeNum(t).match(/\d+/g)||[];return m.length?Number(m[m.length-1]):0}
  function ucFrom(p){return Number(p.uc||((String(p.name||'').match(/(\d+)\s*UC/i)||[])[1])||0)}
  function packs(){
    const src=window.mobaProducts||{};
    return (src.uc||[]).map((p,i)=>({...p,cat:'uc',i,price:Number(p.price||0),uc:ucFrom(p)}))
      .filter(p=>p.price>0 && p.uc>0)
      .sort((a,b)=>b.price-a.price);
  }
  function comboForBudget(amount){
    const list=packs();
    const results=[];
    function walk(start,remain,chosen,total,uc){
      if(chosen.length){
        results.push({chosen:[...chosen],total,uc,left:amount-total});
      }
      if(chosen.length>=4)return;
      for(let idx=start;idx<list.length;idx++){
        const p=list[idx];
        if(p.price>remain)continue;
        chosen.push(p);
        walk(idx,remain-p.price,chosen,total+p.price,uc+p.uc);
        chosen.pop();
      }
    }
    walk(0,amount,[],0,0);
    const seen=new Set();
    return results
      .filter(r=>r.total>0)
      .sort((a,b)=>(a.left-b.left)||(b.uc-a.uc)||(a.chosen.length-b.chosen.length))
      .filter(r=>{
        const key=r.chosen.map(x=>x.i).sort((a,b)=>a-b).join('-')+'|'+r.total;
        if(seen.has(key))return false; seen.add(key); return true;
      })
      .slice(0,3);
  }
  function budgetPrompt(){
    return `<div class="pharaoh-v85-card"><b>اكتب الميزانية اللي معاك</b><small>فرعون هيطلعلك أفضل تركيبة باقات تحت الرقم</small><div class="pharaoh-v90-budget-row"><input id="pharaohBudgetInputV90" inputmode="numeric" placeholder="مثال: 5000"><button type="button" data-v90-budget-submit>رشح</button></div><div class="pharaoh-v85-note">ينفع تكتب الرقم هنا أو تبعته في الشات: معايا 5000.</div></div>`;
  }
  function budgetResult(amount){
    if(!amount)return budgetPrompt();
    const combos=comboForBudget(amount);
    if(!combos.length){
      return `<div class="pharaoh-v85-card"><b>الميزانية قليلة شوية</b><small>زود الميزانية أو اختار أرخص باقة من المنتجات</small><div class="pharaoh-v85-actions"><button class="gold" type="button" data-v85-act="products">افتح المنتجات</button></div></div>`;
    }
    return `<div class="pharaoh-v85-card"><b>أفضل ترشيحات لميزانية ${money(amount)}</b><small>اخترتلك تركيبات تستغل الميزانية بأقرب شكل</small>${combos.map((c,i)=>`<div class="pharaoh-v90-combo" data-v90-combo="${i}"><b>${i+1}) ${c.chosen.map(p=>esc(p.name)).join(' + ')}</b><small>الإجمالي: <strong>${money(c.total)}</strong> | الشدات: <strong>${c.uc.toLocaleString('en-US')} UC</strong>${c.left?` | المتبقي: ${money(c.left)}`:''}</small><span class="pick-hint">دوس هنا لاختيار الترشيح</span></div>`).join('')}<div class="pharaoh-v85-actions"><button class="gold" type="button" data-v85-act="products">افتح المنتجات</button><button type="button" data-v90-budget-reset>رقم تاني</button></div></div>`;
  }
  function add(type,html){
    const body=qs('#pharaohChatBody'), typing=qs('#pharaohTyping');
    if(!body)return;
    const msg=document.createElement('div');
    msg.className='pharaoh-msg '+type+' pharaoh-brain-new';
    msg.innerHTML=html;
    if(typing&&typing.parentElement===body)body.insertBefore(msg,typing);else body.appendChild(msg);
    body.scrollTop=body.scrollHeight;
  }
  function bot(html){add('bot',html)}
  function user(text){add('user',esc(text))}
  function interceptText(text){
    const amount=amountFrom(text);
    if(amount && /معايا|ميزانية|ميزانيه|رشح|باقة|باقه|جنيه|egp|budget/i.test(text)){
      bot(budgetResult(amount));
      return true;
    }
    return false;
  }
  const old=window.__pharaohV85;
  if(old){
    const oldReply=old.reply;
    old.reply=function(q){
      const amount=amountFrom(q);
      if(amount && /معايا|ميزانية|ميزانيه|رشح|باقة|باقه|جنيه|egp|budget/i.test(q))return budgetResult(amount);
      if(/رشح|ميزانية|ميزانيه|باقة|باقه|budget/i.test(q))return budgetPrompt();
      return oldReply(q);
    };
    const oldHandle=old.handle;
    old.handle=function(a,v){
      if(a==='budget')return bot(budgetPrompt());
      if(a==='budgetPick')return bot(budgetResult(Number(v||0)));
      return oldHandle(a,v);
    };
  }
  document.addEventListener('click',function(e){
    const combo=e.target.closest && e.target.closest('[data-v90-combo]');
    if(combo){
      e.preventDefault();e.stopImmediatePropagation();
      const api=window.__pharaohV91;
      if(api&&typeof api.handle==='function')api.handle('combo',combo.dataset.v90Combo);
      return false;
    }
    const submit=e.target.closest && e.target.closest('[data-v90-budget-submit]');
    if(submit){
      e.preventDefault();e.stopImmediatePropagation();
      const amount=amountFrom(qs('#pharaohBudgetInputV90')?.value||'');
      if(amount){user(String(amount));bot(budgetResult(amount));}
      else bot(budgetPrompt());
      return false;
    }
    const reset=e.target.closest && e.target.closest('[data-v90-budget-reset]');
    if(reset){e.preventDefault();e.stopImmediatePropagation();bot(budgetPrompt());return false}
  },true);
  document.addEventListener('keydown',function(e){
    if(e.target&&e.target.id==='pharaohBudgetInputV90'&&e.key==='Enter'){
      e.preventDefault();e.stopImmediatePropagation();
      const amount=amountFrom(e.target.value||'');
      if(amount){user(String(amount));bot(budgetResult(amount));}
      return false;
    }
  },true);
  const previousSend=window.__pharaohForceSendV69;
  window.__pharaohForceSendV69=function(){
    const inp=qs('#pharaohChatInput');
    const text=inp&&inp.value.trim();
    if(text && interceptText(text)){inp.value='';user(text);return}
    if(typeof previousSend==='function')return previousSend();
  };
})();


/* moba-v91-pharaoh-voice-order-wizard */
(function(){
  const SUPPORT='https://t.me/MOFR3OON';
  const PAY_PHONE='01061707294';
  const INSTAPAY='mofr3oon1';
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function money(n){try{return Number(n||0).toLocaleString('en-US')+' جنيه'}catch(e){return (n||0)+' جنيه'}}
  function normalize(t){return String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))}
  function num(t){const m=normalize(t).match(/\d+/g)||[];return m.length?Number(m[m.length-1]):0}
  function body(){return qs('#pharaohChatBody')}
  function typing(){return qs('#pharaohTyping')}
  function input(){return qs('#pharaohChatInput')}
  function products(){
    const src=window.mobaProducts||{};
    return Object.keys(src).flatMap(cat=>(src[cat]||[]).map((p,i)=>({...p,cat,i,price:Number(p.price||0),uc:Number(p.uc||0)})));
  }
  function ucPacks(){return products().filter(p=>p.cat==='uc'&&p.price>0&&p.uc>0).sort((a,b)=>b.price-a.price)}
  function add(type,html){
    const b=body(); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg '+type+' pharaoh-brain-new';
    m.innerHTML=html;
    const t=typing();
    if(t&&t.parentElement===b)b.insertBefore(m,t); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function user(t){add('user',esc(t))}
  function bot(h){add('bot',h); const f=qs('#pharaohAssistantFab'); if(f){f.classList.add('pharaoh-wave-now-v84'); setTimeout(()=>f.classList.remove('pharaoh-wave-now-v84'),900)}}
  function card(title,small,inner='',actions=[]){
    return `<div class="pharaoh-v85-card"><b>${title}</b>${small?`<small>${small}</small>`:''}${inner}${actions.length?'<div class="pharaoh-v85-actions">'+actions.map(a=>a.href?`<a class="${a.cls||''}" href="${a.href}" target="_blank">${a.t}</a>`:`<button type="button" class="${a.cls||''}" data-v91-act="${a.a}" ${a.v!=null?`data-v="${esc(a.v)}"`:''}>${a.t}</button>`).join('')+'</div>':''}</div>`;
  }
  function combo(amount){
    const list=ucPacks(), out=[];
    function walk(start,remain,chosen,total,uc){
      if(chosen.length) out.push({chosen:[...chosen],total,uc,left:amount-total});
      if(chosen.length>=4)return;
      for(let i=start;i<list.length;i++){
        const p=list[i]; if(p.price>remain)continue;
        chosen.push(p); walk(i,remain-p.price,chosen,total+p.price,uc+p.uc); chosen.pop();
      }
    }
    walk(0,amount,[],0,0);
    const seen=new Set();
    return out.sort((a,b)=>(a.left-b.left)||(b.uc-a.uc)||(a.chosen.length-b.chosen.length)).filter(c=>{const k=c.chosen.map(x=>x.i).sort().join('-')+'|'+c.total;if(seen.has(k))return false;seen.add(k);return true}).slice(0,3);
  }
  const wiz={active:false,step:'',items:[],pubgId:'',pubgName:'',paymentMethod:'',transferMode:'',transferLast3:'',phone:'',screenshot:null};
  function reset(){wiz.active=false;wiz.step='';wiz.items=[];wiz.pubgId='';wiz.pubgName='';wiz.paymentMethod='';wiz.transferMode='';wiz.transferLast3='';wiz.phone='';wiz.screenshot=null}
  function start(text=''){
    reset(); wiz.active=true;
    const amount=num(text);
    if(amount) return recommend(amount);
    wiz.step='budget';
    bot(card('ابدأ طلبك مع فرعون','اكتب الميزانية أو قولها بالصوت',
      '<div class="pharaoh-v85-note">مثال: معايا 400 جنيه وعايز أشحن.</div>',
      [{t:'اكتب ميزانية',a:'askBudget',cls:'gold'},{t:'اختار يدوي',a:'manualProducts'}]));
  }
  function recommend(amount){
    const c=combo(amount);
    if(!c.length){wiz.step='budget';return bot(card('الميزانية قليلة شوية','اكتب رقم أكبر أو اختار يدويًا','', [{t:'اختار يدوي',a:'manualProducts',cls:'gold'}]))}
    wiz.step='chooseCombo';
    bot(card('اختار ترشيح مناسب','دي أفضل تركيبات تحت '+money(amount),
      c.map((x,i)=>`<div class="pharaoh-v90-combo" data-v91-act="combo" data-v="${i}"><b>${i+1}) ${x.chosen.map(p=>esc(p.name)).join(' + ')}</b><small>الإجمالي: <strong>${money(x.total)}</strong> | الشدات: <strong>${x.uc.toLocaleString('en-US')} UC</strong>${x.left?` | المتبقي: ${money(x.left)}`:''}</small><span class="pick-hint">دوس هنا لاختيار الترشيح</span></div>`).join(''),
      c.map((x,i)=>({t:'اختار رقم '+(i+1),a:'combo',v:i,cls:i===0?'gold':''})).concat([{t:'رقم تاني',a:'askBudget'}])));
    window.__pharaohV91Combos=c;
  }
  function chooseCombo(i){
    const c=(window.__pharaohV91Combos||[])[Number(i)];
    if(!c)return start();
    wiz.items=c.chosen.map(p=>({product:p.name,type:p.type||'uc',price:p.price,uc:p.uc,qty:1,qtyTotal:1,ucTotal:p.uc,game:'PUBG Mobile'}));
    wiz.step='id';
    bot(card('تمام، هات ID الحساب','اكتب PUBG ID أرقام فقط',
      `<div class="pharaoh-v85-note">الباقات: ${wiz.items.map(x=>esc(x.product)).join(' + ')}</div>`,[]));
  }
  function manualProducts(){
    const list=ucPacks().slice().reverse();
    wiz.step='manual';
    bot(card('اختار الباقة يدويًا','دوس على الباقة اللي عايزها',
      '<div class="pharaoh-v85-note">بعد الاختيار هسألك عن ID واسم الحساب.</div>',
      list.map(p=>({t:p.name+' - '+money(p.price),a:'manualPick',v:p.i,cls:p.hot?'gold':''}))));
  }
  function manualPick(i){
    const p=ucPacks().find(x=>String(x.i)===String(i));
    if(!p)return manualProducts();
    wiz.items=[{product:p.name,type:p.type||'uc',price:p.price,uc:p.uc,qty:1,qtyTotal:1,ucTotal:p.uc,game:'PUBG Mobile'}];
    wiz.step='id';
    bot(card('اختارت '+p.name,'اكتب PUBG ID بتاع الحساب','',[]));
  }
  function askName(v){
    const id=normalize(v).replace(/\D/g,'');
    if(!/^\d{5,15}$/.test(id))return bot(card('ID مش واضح','اكتب ID أرقام فقط من 5 لـ 15 رقم','',[]));
    wiz.pubgId=id; wiz.step='name';
    bot(card('تمام، هات اسم الحساب','اكتب اسم الحساب داخل اللعبة','',[]));
  }
  function askPayment(v){
    if(String(v||'').trim().length<2)return bot(card('الاسم قصير','اكتب اسم الحساب داخل اللعبة بوضوح','',[]));
    wiz.pubgName=String(v).trim();
    wiz.items=wiz.items.map(x=>({...x,pubgId:wiz.pubgId,pubgName:wiz.pubgName,name:wiz.pubgName}));
    wiz.step='payment';
    bot(card('اختار طريقة الدفع','تحب تحول على InstaPay ولا محفظة كاش؟','',
      [{t:'InstaPay',a:'pay',v:'InstaPay',cls:'green'},{t:'محفظة كاش',a:'pay',v:'Wallet',cls:'gold'}]));
  }
  function getLivePaymentSettings(){
    const d={wallet:{enabled:true,status:'available',phone:PAY_PHONE,name:'مؤمن',message:''},instapay:{enabled:true,status:'available',user:INSTAPAY,phone:PAY_PHONE,name:'مؤمن',link:'',message:''}};
    const p=window.mobaPaymentSettings||{};
    return {...d,...p,wallet:{...d.wallet,...(p.wallet||{})},instapay:{...d.instapay,...(p.instapay||{})}};
  }
  async function refreshLivePaymentSettings(){
    try{const r=await fetch('/api/settings?t='+Date.now());const j=await r.json();if(j&&j.ok&&j.settings&&j.settings.payment_settings)window.mobaPaymentSettings=j.settings.payment_settings;}catch(e){}
    return getLivePaymentSettings();
  }
  async function choosePay(v){
    wiz.paymentMethod=v; wiz.step='paid';
    const pay=await refreshLivePaymentSettings();
    const isInsta=v==='InstaPay';
    const data=isInsta?pay.instapay:pay.wallet;
    if(!data.enabled || ['disabled','maintenance'].includes(String(data.status||''))){
      return bot(card('طريقة الدفع متوقفة مؤقتا',isInsta?'InstaPay غير متاح حاليا':'المحفظة غير متاحة حاليا','<div class="pharaoh-v85-warn">اختار طريقة دفع تانية أو تواصل مع الدعم.</div>',[{t:'اختار InstaPay',a:'pay',v:'InstaPay',cls:'green'},{t:'اختار محفظة',a:'pay',v:'Wallet',cls:'gold'},{t:'الدعم',href:SUPPORT}]));
    }
    const busyNote=String(data.status||'')==='busy'?'<div class="pharaoh-v85-warn">فيه ضغط على طريقة الدفع دي، المراجعة ممكن تتأخر شوية.</div>':'';
    const info=isInsta?`InstaPay: <b>${esc(data.user||INSTAPAY)}</b><br>Phone: <b>${esc(data.phone||PAY_PHONE)}</b>${data.link?`<br>Link: <b>${esc(data.link)}</b>`:''}`:`Wallet Phone: <b>${esc(data.phone||PAY_PHONE)}</b><br>Name: <b>${esc(data.name||'مؤمن')}</b>`;
    bot(card('بيانات الدفع',isInsta?'حوّل على InstaPay وبعدها اضغط تم التحويل':'حوّل على المحفظة وبعدها اضغط تم التحويل',
      `<div class="pharaoh-v91-paybox">${info}</div>${data.message?`<div class="pharaoh-v85-note">${esc(data.message)}</div>`:''}${busyNote}`,[{t:'تم التحويل',a:'paid',cls:'gold'},{t:'الدعم',href:SUPPORT}]));
  }
  function askShot(){
    wiz.step='screenshot';
    bot(card('ارفع سكرين التحويل','لازم السكرين يوضح المبلغ ووقت التحويل',
      '<input class="pharaoh-v91-file" id="pharaohShotV91" type="file" accept="image/*">',[]));
  }
  function gotShot(file){
    wiz.screenshot=file; wiz.step='phone';
    bot(card('تمام، هات رقم متابعة الطلب','اكتب رقم موبايل يبدأ بـ 01 علشان تتابع حالة الطلب','',[]));
  }
  function askTransfer(v){
    const phone=normalize(v).replace(/\D/g,'');
    if(!/^01\d{9}$/.test(phone))return bot(card('رقم الموبايل مش صحيح','اكتبه 11 رقم ويبدأ بـ 01','',[]));
    wiz.phone=phone; wiz.step='transferMode';
    bot(card('تأكيد التحويل','رقم المتابعة هو الرقم اللي هتتابع بيه طلبك. هل التحويل اتعمل من نفس الرقم ده؟','<div class="pharaoh-v85-note">اختار "نفس رقم المتابعة" لو حولت من رقمك اللي كتبته. اختار "رقم تاني أو محل" لو دفعت من محفظة شخص تاني أو من محل دفع.</div>',
      [{t:'نفس رقم المتابعة',a:'transfer',v:'same',cls:'green'},{t:'رقم تاني أو محل دفع',a:'transfer',v:'other',cls:'gold'}]));
  }
  function chooseTransfer(v){
    wiz.transferMode=v;
    if(v==='same'){wiz.transferLast3=''; return summary()}
    wiz.step='last3';
    bot(card('اكتب آخر 3 أرقام','اكتب آخر 3 أرقام من الرقم اللي حولت منه الفلوس','<div class="pharaoh-v85-warn">المطلوب هنا مش رقم متابعة الطلب. ده آخر 3 أرقام من رقم المحفظة أو المحل اللي اتعمل منه التحويل.</div>',[]));
  }
  function editData(){
    wiz.pubgId='';
    wiz.pubgName='';
    wiz.paymentMethod='';
    wiz.transferMode='';
    wiz.transferLast3='';
    wiz.phone='';
    wiz.screenshot=null;
    wiz.step='id';
    bot(card('تمام، هات ID الحساب','اكتب PUBG ID أرقام فقط',
      `<div class="pharaoh-v85-note">الباقات: ${wiz.items.map(x=>esc(x.product)).join(' + ')}</div>`,[]));
  }
  function summary(){
    wiz.step='confirm';
    const total=wiz.items.reduce((s,x)=>s+Number(x.price||0),0);
    bot(card('راجع بيانات الطلب','لو كله تمام دوس تأكيد الطلب',
      `<div class="pharaoh-v91-summary">
        <div>الباقات: <b>${wiz.items.map(x=>esc(x.product)).join(' + ')}</b></div>
        <div>ID: <b>${esc(wiz.pubgId)}</b> | الاسم: <b>${esc(wiz.pubgName)}</b></div>
        <div>الدفع: <b>${esc(wiz.paymentMethod)}</b> | المتابعة: <b>${esc(wiz.phone)}</b></div>
        <div>تأكيد التحويل: <b>${wiz.transferMode==='same'?'نفس الرقم':'آخر 3 أرقام '+esc(wiz.transferLast3)}</b></div>
        <div>الإجمالي: <b>${money(total)}</b></div>
      </div>`,[{t:'صح',a:'confirm',cls:'green'},{t:'تصحيح',a:'editData',cls:'gold'},{t:'إلغاء الطلب',a:'cancel',cls:'danger'}]));
  }
  async function submit(){
    if(!wiz.screenshot)return askShot();
    const fd=new FormData();
    fd.append('customerPhone',wiz.phone);
    fd.append('paymentMethod',wiz.paymentMethod);
    fd.append('transferMode',wiz.transferMode);
    fd.append('transferLast3',wiz.transferLast3||'');
    fd.append('note','طلب تم من فرعون داخل الشات');
    fd.append('cart',JSON.stringify(wiz.items));
    fd.append('screenshot',wiz.screenshot,wiz.screenshot.name||'pharaoh-transfer.jpg');
    bot(card('جاري إرسال الطلب','استنى لحظة، فرعون بيبعت الأوردر للإدارة','',[]));
    try{
      const res=await fetch('/api/order',{method:'POST',body:fd});
      const data=await res.json().catch(()=>({ok:false,error:'رد السيرفر غير واضح'}));
      if(!data.ok)throw new Error(data.error||'حصل خطأ');
      bot(card('تم إرسال طلبك بنجاح','طلبك تحت المراجعة الآن',
        '<div class="pharaoh-v85-note">تقدر تتابع حالة الطلب من سجل الطلبات برقم الموبايل.</div>',
        [{t:'تابع طلبي',a:'openTrack',cls:'green'},{t:'طلب جديد',a:'newOrder'}]));
      try{const p=qs('#trackPhone'); if(p)p.value=wiz.phone}catch(e){}
      reset();
    }catch(err){
      bot(card('الإرسال وقف','راجع الرسالة دي وحاول تاني',
        '<div class="pharaoh-v85-warn">'+esc(err.message||'حصل خطأ أثناء إرسال الطلب')+'</div>',
        [{t:'راجع البيانات',a:'summary',cls:'gold'},{t:'الدعم',href:SUPPORT}]));
    }
  }
  function consumeText(text){
    const t=String(text||'').trim(); if(!t)return false;
    const natural=normalize(t).replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase();
    if(/(الغي|الغاء|إلغاء|كنسل|cancel|مش عايز|مش عاوز|بلاش|وقف|عايز الغي|عاوز الغي)/.test(natural)){
      handle('cancel');
      return true;
    }
    if(/(ابدا من الاول|ابدأ من الاول|من الاول|اعاده|اعادة|ريست|reset|ابدأ تاني|ابدا تاني)/.test(natural)){
      start();
      return true;
    }
    if(/(ارجع|رجوع|رجعني|غير الباقه|غير الباقة|اختار باقه تانيه|اختار باقة تانية|رقم تاني|ميزانيه تانيه|غير الميزانيه)/.test(natural)){
      start();
      return true;
    }
    if(/(مش فاهم|مش فاهمك|اعمل ايه|مساعده|مساعدة|ساعدني|ايه المطلوب|اكتب ايه|فهمني)/.test(natural)){
      bot(card('أنا فاهمك يا بطل','قولّي عايز تعمل إيه بكلام عادي، وأنا هكمل معاك.',
        '<div class="pharaoh-v85-note">أمثلة: معايا 500، عايز ألغي، رجعني، غير الميزانية، InstaPay، محفظة، تم التحويل، فين طلبي.</div>',
        [{t:'ابدأ من الأول',a:'newOrder',cls:'gold'},{t:'اختار يدوي',a:'manualProducts'},{t:'إلغاء',a:'cancel'}]));
      return true;
    }
    if(/تم التحويل|حولت|دفعت/i.test(t)&&wiz.active&&wiz.step==='paid'){askShot();return true}
    if(/عايز|اشحن|شحن|معايا|ميزانية|ميزانيه/i.test(t)&&(!wiz.active||wiz.step==='')){start(t);return true}
    if(!wiz.active)return false;
    if(wiz.step==='budget'){const a=num(t); if(a){recommend(a);return true}}
    if(wiz.step==='id'){askName(t);return true}
    if(wiz.step==='name'){askPayment(t);return true}
    if(wiz.step==='phone'){askTransfer(t);return true}
    if(wiz.step==='last3'){
      const n=normalize(t).replace(/\D/g,'');
      if(!/^\d{3}$/.test(n))bot(card('آخر 3 أرقام فقط','اكتب 3 أرقام بالظبط','',[]));
      else{wiz.transferLast3=n; summary()}
      return true;
    }
    return false;
  }
  function handle(a,v){
    if(a==='askBudget')return start();
    if(a==='manualProducts')return manualProducts();
    if(a==='manualPick')return manualPick(v);
    if(a==='combo')return chooseCombo(v);
    if(a==='pay')return choosePay(v);
    if(a==='paid')return askShot();
    if(a==='transfer')return chooseTransfer(v);
    if(a==='summary')return summary();
    if(a==='confirm')return submit();
    if(a==='editData')return editData();
    if(a==='cancel'){reset();return bot(card('تم إلغاء الطلب','نبدأ من جديد وقت ما تحب','',[{t:'طلب جديد',a:'newOrder',cls:'gold'}]))}
    if(a==='newOrder')return start();
    if(a==='openTrack'){if(typeof window.mobaShowView==='function')window.mobaShowView('orders');return}
  }
  function ensureMic(){
    const form=qs('#pharaohChatForm'), send=qs('#pharaohSendBtn');
    if(!form||!send||qs('#pharaohMicBtn'))return;
    const btn=document.createElement('button');
    btn.type='button'; btn.id='pharaohMicBtn'; btn.title='تكلم مع فرعون'; btn.textContent='🎙';
    form.insertBefore(btn,send);
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){btn.disabled=true;btn.title='الميكروفون غير مدعوم في المتصفح ده';return}
    const rec=new SR(); rec.lang='ar-EG'; rec.interimResults=false; rec.maxAlternatives=1;
    rec.onstart=()=>btn.classList.add('listening');
    rec.onend=()=>btn.classList.remove('listening');
    rec.onresult=e=>{
      const text=e.results&&e.results[0]&&e.results[0][0]&&e.results[0][0].transcript||'';
      if(text){user(text); if(!consumeText(text)) bot(card('سمعتك','قلت: '+esc(text)+'<br>اكتب أو قول: معايا 400 وعايز أشحن','',[]))}
    };
    btn.onclick=()=>{try{rec.start()}catch(e){}};
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('[data-v91-act]');
    if(b){e.preventDefault();e.stopImmediatePropagation();handle(b.dataset.v91Act,b.dataset.v);return false}
  },true);
  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='pharaohShotV91'&&e.target.files&&e.target.files[0])gotShot(e.target.files[0]);
  },true);
  const oldSend=window.__pharaohForceSendV69;
  window.__pharaohForceSendV69=function(){
    const inp=input(), text=inp&&inp.value.trim();
    if(text&&consumeText(text)){inp.value='';user(text);return}
    if(typeof oldSend==='function')return oldSend();
  };
  const api=window.__pharaohV85;
  if(api){
    const oldReply=api.reply;
    api.reply=function(q){if(consumeText(q))return ''; return oldReply(q)};
  }
  ensureMic();
  document.addEventListener('DOMContentLoaded',ensureMic);
  setTimeout(ensureMic,500);
  window.__pharaohV91={start,consumeText,handle,summary,state:wiz,askName,askPayment,askTransfer,chooseTransfer,editData};
})();


/* moba-v92-pharaoh-wizard-fixes */
(function(){
  const ORDER_TTL=60*60*1000;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function body(){return qs('#pharaohChatBody')}
  function add(type,html){
    const b=body(), ty=qs('#pharaohTyping'); if(!b)return;
    const m=document.createElement('div'); m.className='pharaoh-msg '+type+' pharaoh-brain-new'; m.innerHTML=html;
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function bot(h){add('bot',h)}
  function user(t){add('user',esc(t))}
  function normalize(t){return String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))}
  function isWizardActive(){
    const api=window.__pharaohV91;
    if(!api||!api.state)return false;
    return api.state.active && Date.now()-Number(api.state.startedAt||0)<ORDER_TTL;
  }
  function stopOldCleanerDuringOrder(){
    if(!isWizardActive())return;
    clearTimeout(window.__pharaohV70ResetTimer);
  }
  setInterval(stopOldCleanerDuringOrder,3000);
  const apiWait=setInterval(()=>{
    if(!window.__pharaohV91)return;
    clearInterval(apiWait);
    const api=window.__pharaohV91;
    api.state=api.state||{};
    const oldStart=api.start;
    api.start=function(text){
      api.state.active=true;
      api.state.startedAt=Date.now();
      return oldStart(text);
    };
    const oldConsume=api.consumeText;
    api.consumeText=function(text){
      api.state.startedAt=Date.now();
      const t=String(text||'').trim();
      const digits=normalize(t).replace(/\D/g,'');
      if(api.state.active && /^\\d{5,15}$/.test(digits)){
        oldConsume(digits);
        return true;
      }
      if(api.state.active && /^(نفس الرقم|نفسه|same)$/i.test(t)){
        api.handle&&api.handle('transfer','same');
        return true;
      }
      if(api.state.active && /(رقم تاني|محل|other)/i.test(t)){
        api.handle&&api.handle('transfer','other');
        return true;
      }
      if(api.state.active && /^(انستا|انستاباي|insta|instapay)$/i.test(t)){
        api.handle&&api.handle('pay','InstaPay');
        return true;
      }
      if(api.state.active && /(محفظة|كاش|wallet|فودافون)/i.test(t)){
        api.handle&&api.handle('pay','Wallet');
        return true;
      }
      if(api.state.active && /(تأكيد|اكد|أكد|تمام|confirm)/i.test(t)){
        api.handle&&api.handle('confirm');
        return true;
      }
      return oldConsume(text);
    };
    const oldHandle=api.handle;
    api.handle=function(a,v){
      if(a==='cancel')api.state.active=false;
      if(a==='confirm')api.state.startedAt=Date.now();
      return oldHandle(a,v);
    };
  },120);
  function hardSend(){
    const inp=qs('#pharaohChatInput');
    const text=inp&&inp.value.trim();
    if(!text)return false;
    if(window.__pharaohV91&&window.__pharaohV91.consumeText&&isWizardActive()){
      inp.value='';
      user(text);
      window.__pharaohV91.consumeText(text);
      return true;
    }
    return false;
  }
  document.addEventListener('click',function(e){
    const send=e.target.closest&&e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');
    if(send&&hardSend()){e.preventDefault();e.stopImmediatePropagation();return false}
  },true);
  document.addEventListener('keydown',function(e){
    if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'&&hardSend()){
      e.preventDefault();e.stopImmediatePropagation();return false;
    }
  },true);
  function micStatus(msg,type='info'){
    let st=qs('#pharaohMicStatusV92');
    const form=qs('#pharaohChatForm');
    if(!st&&form){st=document.createElement('div');st.id='pharaohMicStatusV92';form.insertAdjacentElement('beforebegin',st)}
    if(!st)return;
    st.textContent=msg;
    st.className='show '+type;
    clearTimeout(window.__pharaohMicStatusTimerV92);
    window.__pharaohMicStatusTimerV92=setTimeout(()=>st.classList.remove('show'),4200);
  }
  function upgradeMic(){
    const btn=qs('#pharaohMicBtn'); if(!btn||btn.dataset.v92)return;
    btn.dataset.v92='1';
    btn.disabled=false;
    btn.title='اضغط واتكلم مع فرعون';
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){btn.onclick=()=>micStatus('المتصفح ده مش داعم الميكروفون. جرّب Chrome أو Edge.','err');return}
    const rec=new SR();
    rec.lang='ar-EG'; rec.interimResults=false; rec.continuous=false; rec.maxAlternatives=1;
    rec.onstart=()=>{btn.classList.add('listening');micStatus('فرعون بيسمعك دلوقتي... اتكلم.')}
    rec.onerror=e=>{btn.classList.remove('listening');micStatus(e.error==='not-allowed'?'لازم تسمح للميكروفون من المتصفح.':'الميكروفون وقف، جرّب تاني.','err')}
    rec.onend=()=>btn.classList.remove('listening');
    rec.onresult=e=>{
      const text=e.results&&e.results[0]&&e.results[0][0]&&e.results[0][0].transcript||'';
      if(text){
        user(text);
        if(window.__pharaohV91&&window.__pharaohV91.consumeText&&window.__pharaohV91.consumeText(text))return;
        bot('<div class="pharaoh-v85-card"><b>سمعتك</b><small>'+esc(text)+'</small><div class="pharaoh-v85-note">قول مثلًا: معايا 400 وعايز أشحن.</div></div>');
      }
    };
    btn.onclick=async()=>{
      try{
        if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
          const stream=await navigator.mediaDevices.getUserMedia({audio:true});
          stream.getTracks().forEach(t=>t.stop());
        }
        rec.start();
      }catch(err){
        micStatus('لازم تسمح للميكروفون من المتصفح عشان فرعون يسمعك.','err');
      }
    };
  }
  upgradeMic();
  document.addEventListener('DOMContentLoaded',upgradeMic);
  setTimeout(upgradeMic,700);
})();


/* moba-v95-pharaoh-mobile-voice-final */
(function(){
  const ORDER_TTL=60*60*1000;
  function qs(s,r=document){return r.querySelector(s)}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function normalizeDigits(t){
    return String(t||'')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[,\s]+/g,' ');
  }
  function digitsOnly(t){return normalizeDigits(t).replace(/\D/g,'')}
  function pharaohBody(){return qs('#pharaohChatBody')}
  function add(type,html){
    const b=pharaohBody(), ty=qs('#pharaohTyping'); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg '+type+' pharaoh-brain-new';
    m.innerHTML=html;
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function bot(html){add('bot',html)}
  function user(text){add('user',esc(text))}
  function isWizardActive(){
    const api=window.__pharaohV91;
    return !!(api&&api.state&&api.state.active&&Date.now()-Number(api.state.startedAt||0)<ORDER_TTL);
  }
  function moneyIntent(text){
    const t=normalizeDigits(text).toLowerCase().trim();
    if(!t)return false;
    if(/^(\d{2,6})\s*(ج|جنيه|جنية|جم|egp|e\.g\.p)?$/i.test(t))return true;
    return /(معايا|معي|ميزانية|ميزانيه|فلوس|رشح|ترشيح|باقة|باقه|اشحن|شحن|عايز|اريد|بـ|ب\s|جنيه|جنية|egp|جم)/i.test(t);
  }
  function amountFrom(text){
    const t=normalizeDigits(text).toLowerCase();
    const nums=(t.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20&&n<=200000);
    if(!nums.length)return 0;
    if(!moneyIntent(t))return 0;
    return nums[nums.length-1]||0;
  }
  function budgetCard(amount){
    return '<div class="pharaoh-v85-card"><b>تمام، فهمت إن ميزانيتك '+amount.toLocaleString('en-US')+' جنيه</b><small>اختار ترشيح من اللي هيظهرلك، أو ابعت رقم تاني بأي صيغة: 500، 500ج، معايا 500، 2000 جنيه.</small></div>';
  }
  function handleText(text,showUser){
    const api=window.__pharaohV91;
    const raw=String(text||'').trim();
    if(!raw)return false;
    if(isWizardActive()&&api&&typeof api.consumeText==='function'){
      if(showUser)user(raw);
      api.state.startedAt=Date.now();
      api.consumeText(raw);
      return true;
    }
    const amount=amountFrom(raw);
    if(amount){
      if(showUser)user(raw);
      if(api&&typeof api.start==='function'){
        bot(budgetCard(amount));
        api.start(String(amount));
      }else{
        bot('<div class="pharaoh-v85-card"><b>ميزانيتك '+amount.toLocaleString('en-US')+' جنيه</b><small>اكتب: ابدأ الشحن، وفرعون هيكملك خطوة بخطوة.</small></div>');
      }
      return true;
    }
    if(api&&typeof api.consumeText==='function'&&/(اشحن|شحن|عايز|ابدأ|ابدا|طلب جديد)/i.test(raw)){
      if(showUser)user(raw);
      api.start(raw);
      return true;
    }
    return false;
  }
  function wrapApis(){
    const api=window.__pharaohV91;
    if(api&&!api.__v95Wrapped){
      api.__v95Wrapped=true;
      api.state=api.state||{};
      const oldStart=api.start;
      api.start=function(text){
        api.state.active=true;
        api.state.startedAt=Date.now();
        return oldStart.apply(this,arguments);
      };
      const oldHandle=api.handle;
      api.handle=function(a,v){
        if(a==='cancel')api.state.active=false;
        if(a==='newOrder'||a==='askBudget'||a==='manualProducts'||a==='combo'||a==='manualPick')api.state.active=true;
        api.state.startedAt=Date.now();
        return oldHandle.apply(this,arguments);
      };
      const oldConsume=api.consumeText;
      api.consumeText=function(text){
        const raw=String(text||'').trim();
        const ds=digitsOnly(raw);
        api.state.startedAt=Date.now();
        if(api.state.active&&/^(نفس|نفس الرقم|نفس رقم المتابعة)$/i.test(raw)){api.handle('transfer','same');return true}
        if(api.state.active&&/(رقم تاني|رقم اخر|محل|دفع من محل|شخص تاني)/i.test(raw)){api.handle('transfer','other');return true}
        if(api.state.active&&/(انستا|انستاباي|insta|instapay)/i.test(raw)){api.handle('pay','InstaPay');return true}
        if(api.state.active&&/(محفظ|كاش|wallet|فودافون|اورنج|اتصالات|وي)/i.test(raw)){api.handle('pay','Wallet');return true}
        if(api.state.active&&/^(تم|تمام|اكد|أكد|تاكيد|تأكيد|confirm)$/i.test(raw)){api.handle('confirm');return true}
        if(api.state.active&&ds.length===3){return oldConsume.call(this,ds)}
        if(api.state.active&&ds.length>=5&&ds.length<=15){return oldConsume.call(this,ds)}
        return oldConsume.apply(this,arguments);
      };
    }
  }
  function status(msg,type){
    let st=qs('#pharaohMicStatusV95');
    const form=qs('#pharaohChatForm');
    if(!st&&form){st=document.createElement('div');st.id='pharaohMicStatusV95';form.insertAdjacentElement('beforebegin',st)}
    if(!st)return;
    st.textContent=msg;
    st.className='show '+(type||'');
    clearTimeout(window.__pharaohMicStatusTimerV95);
    window.__pharaohMicStatusTimerV95=setTimeout(()=>st.classList.remove('show'),5200);
  }
  function ensureMic(){
    const form=qs('#pharaohChatForm'), send=qs('#pharaohSendBtn');
    if(!form||!send)return;
    let btn=qs('#pharaohMicBtn');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.id='pharaohMicBtn';
      form.insertBefore(btn,send);
    }
    btn.textContent='🎙';
    btn.disabled=false;
    btn.classList.add('ready');
    btn.title='اضغط واتكلم مع فرعون';
    if(btn.__v95MicReady)return;
    btn.__v95MicReady=true;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!window.isSecureContext){
      btn.onclick=function(){status('الميكروفون محتاج الموقع يفتح من localhost أو HTTPS. افتح الموقع من localhost وجرب تاني.','err')};
      return;
    }
    if(!SR){
      btn.onclick=function(){status('المتصفح ده مش داعم تحويل الصوت لنص. جرب Chrome أو Edge، أو اكتب الرسالة وفرعون هيفهمها.','err')};
      return;
    }
    let rec=null, listening=false;
    function buildRec(){
      rec=new SR();
      rec.lang='ar-EG';
      rec.interimResults=true;
      rec.continuous=false;
      rec.maxAlternatives=3;
      rec.onstart=function(){listening=true;btn.classList.add('listening');status('فرعون بيسمعك دلوقتي... اتكلم بصوت واضح.','ok')};
      rec.onerror=function(e){
        listening=false;btn.classList.remove('listening');
        const msg=e&&e.error==='not-allowed'
          ? 'المتصفح منع الميكروفون. دوس سماح للمايك من علامة القفل جنب الرابط.'
          : 'الميكروفون وقف. دوس الزرار وجرب تاني.';
        status(msg,'err');
      };
      rec.onend=function(){listening=false;btn.classList.remove('listening')};
      rec.onresult=function(e){
        let text='';
        for(let i=e.resultIndex||0;i<e.results.length;i++){
          text+=(e.results[i][0]&&e.results[i][0].transcript||'')+' ';
        }
        text=text.trim();
        const inp=qs('#pharaohChatInput');
        if(inp&&text)inp.value=text;
        const last=e.results[e.results.length-1];
        if(last&&last.isFinal&&text){
          status('سمعت: '+text,'ok');
          if(!handleText(text,true)){
            bot('<div class="pharaoh-v85-card"><b>سمعتك</b><small>'+esc(text)+'</small><div class="pharaoh-v85-note">قول مثلا: معايا 500، أو عايز أشحن، أو فين طلبي.</div></div>');
          }
          if(inp)inp.value='';
        }
      };
    }
    buildRec();
    btn.onclick=async function(){
      try{
        wrapApis();
        if(listening&&rec){try{rec.stop()}catch(e){};return}
        if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
          const stream=await navigator.mediaDevices.getUserMedia({audio:true});
          stream.getTracks().forEach(t=>t.stop());
        }
        buildRec();
        rec.start();
      }catch(err){
        status('لو مظهرش طلب السماح، افتح صلاحيات الموقع واسمح للميكروفون. ولو على موبايل جرب Chrome.','err');
      }
    };
  }
  const oldForce=window.__pharaohForceSendV69;
  window.__pharaohForceSendV69=function(){
    wrapApis();
    const inp=qs('#pharaohChatInput');
    const text=inp&&inp.value.trim();
    if(text&&handleText(text,true)){inp.value='';return}
    if(typeof oldForce==='function')return oldForce();
  };
  document.addEventListener('keydown',function(e){
    if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'){
      wrapApis();
      const text=e.target.value.trim();
      if(text&&handleText(text,true)){e.target.value='';e.preventDefault();e.stopImmediatePropagation();return false}
    }
  },true);
  document.addEventListener('click',function(e){
    const send=e.target.closest&&e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');
    if(send){
      wrapApis();
      const inp=qs('#pharaohChatInput'), text=inp&&inp.value.trim();
      if(text&&handleText(text,true)){inp.value='';e.preventDefault();e.stopImmediatePropagation();return false}
    }
  },true);
  wrapApis();
  ensureMic();
  document.addEventListener('DOMContentLoaded',function(){wrapApis();ensureMic()});
  setInterval(function(){wrapApis();ensureMic()},1000);
})();


/* moba-v96-pharaoh-budget-final-router */
(function(){
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function normalizeDigits(t){
    return String(t||'')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[,\s]+/g,' ');
  }
  function moneyIntent(text){
    const t=normalizeDigits(text).toLowerCase().trim();
    if(/^(\d{2,6})\s*(ج|جنيه|جنية|جم|egp|e\.g\.p)?$/i.test(t))return true;
    return /(معايا|معي|ميزانية|ميزانيه|فلوس|رشح|ترشيح|باقة|باقه|اشحن|شحن|عايز|اريد|بـ|ب\s|جنيه|جنية|egp|جم)/i.test(t);
  }
  function amountFrom(text){
    const t=normalizeDigits(text).toLowerCase();
    const nums=(t.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20&&n<=200000);
    if(!nums.length||!moneyIntent(t))return 0;
    return nums[nums.length-1]||0;
  }
  function card(amount){
    return '<div class="pharaoh-v85-card"><b>فهمت ميزانيتك '+amount.toLocaleString('en-US')+' جنيه</b><small>هطلعلك أفضل ترشيحات مناسبة. تقدر تكتبها بأي شكل: 500، 500ج، معايا 500، أو 2000 جنيه.</small><div class="pharaoh-v85-note">دوس على الترشيح اللي يعجبك وفرعون يكمل معاك ID والدفع خطوة بخطوة.</div></div>';
  }
  function routeBudget(q){
    const amount=amountFrom(q);
    if(!amount)return '';
    setTimeout(function(){
      const api=window.__pharaohV91;
      if(api&&typeof api.start==='function')api.start(String(amount));
    },40);
    return card(amount);
  }
  function wrap(){
    const api=window.__pharaohV85;
    if(api&&!api.__v96BudgetRouter){
      api.__v96BudgetRouter=true;
      const oldReply=api.reply;
      api.reply=function(q){
        const r=routeBudget(q);
        if(r)return r;
        return oldReply.apply(this,arguments);
      };
    }
  }
  wrap();
  document.addEventListener('DOMContentLoaded',wrap);
  setInterval(wrap,800);
})();


/* moba-v97-pharaoh-send-priority */
(function(){
  function qs(s,r=document){return r.querySelector(s)}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function normalizeDigits(t){
    return String(t||'')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[,\s]+/g,' ');
  }
  function amountFrom(text){
    const t=normalizeDigits(text).toLowerCase().trim();
    const hasIntent=/^(\d{2,6})\s*(ج|جنيه|جنية|جم|egp|e\.g\.p)?$/i.test(t)||/(معايا|معي|ميزانية|ميزانيه|فلوس|رشح|ترشيح|باقة|باقه|اشحن|شحن|عايز|اريد|بـ|ب\s|جنيه|جنية|egp|جم)/i.test(t);
    if(!hasIntent)return 0;
    const nums=(t.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20&&n<=200000);
    return nums.length?nums[nums.length-1]:0;
  }
  function body(){return qs('#pharaohChatBody')}
  function add(type,html){
    const b=body(), ty=qs('#pharaohTyping'); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg '+type+' pharaoh-brain-new';
    m.innerHTML=html;
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function user(t){add('user',esc(t))}
  function bot(h){add('bot',h)}
  function activeOrder(){
    const api=window.__pharaohV91;
    return !!(api&&api.state&&api.state.active&&Date.now()-Number(api.state.startedAt||0)<60*60*1000);
  }
  function process(text){
    const api=window.__pharaohV91;
    if(!text)return false;
    if(activeOrder()&&api&&typeof api.consumeText==='function'){
      user(text);
      api.state.startedAt=Date.now();
      api.consumeText(text);
      return true;
    }
    const amount=amountFrom(text);
    if(amount){
      user(text);
      bot('<div class="pharaoh-v85-card"><b>فهمت إن معاك '+amount.toLocaleString('en-US')+' جنيه</b><small>هختارلك أفضل باقات تحت الميزانية دي. ينفع تكتبها بأي شكل: 500، 500ج، معايا 500، 2000 جنيه.</small></div>');
      if(api&&typeof api.start==='function')setTimeout(()=>api.start(String(amount)),40);
      return true;
    }
    if(api&&typeof api.start==='function'&&/(اشحن|شحن|عايز|ابدأ|ابدا|طلب جديد)/i.test(text)){
      user(text);
      api.start(text);
      return true;
    }
    return false;
  }
  window.__pharaohPriorityTextV97=function(text){
    return process(String(text||'').trim());
  };
  window.__pharaohPrioritySendV97=function(){
    const inp=qs('#pharaohChatInput');
    const text=inp&&inp.value.trim();
    if(process(text)){
      inp.value='';
      return true;
    }
    return false;
  };
  function intercept(e){
    const target=e.target;
    const isSend=target&&target.closest&&target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');
    if(!isSend)return;
    const inp=qs('#pharaohChatInput');
    const text=inp&&inp.value.trim();
    if(process(text)){
      inp.value='';
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }
  function interceptKey(e){
    if(!(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'))return;
    const text=e.target.value.trim();
    if(process(text)){
      e.target.value='';
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }
  window.addEventListener('click',intercept,true);
  window.addEventListener('pointerdown',function(){
    const api=window.__pharaohV91;
    if(api)api.state=api.state||{};
  },true);
  window.addEventListener('keydown',interceptKey,true);
})();


/* moba-v98-pharaoh-natural-brain */
(function(){
  const SUPPORT='https://t.me/MOFR3OON';
  function qs(s,r=document){return r.querySelector(s)}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function norm(t){
    return String(t||'')
      .replace(/[أإآ]/g,'ا')
      .replace(/ة/g,'ه')
      .replace(/ى/g,'ي')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .toLowerCase()
      .trim();
  }
  function body(){return qs('#pharaohChatBody')}
  function add(type,html){
    const b=body(), ty=qs('#pharaohTyping'); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg '+type+' pharaoh-brain-new';
    m.innerHTML=html;
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function bot(title,small,inner,actions){
    add('bot','<div class="pharaoh-v85-card"><b>'+title+'</b>'+(small?'<small>'+small+'</small>':'')+(inner||'')+(actions&&actions.length?'<div class="pharaoh-v85-actions">'+actions.map(a=>a.href?'<a class="'+(a.cls||'')+'" href="'+a.href+'" target="_blank">'+a.t+'</a>':'<button type="button" class="'+(a.cls||'')+'" data-v91-act="'+a.a+'" '+(a.v!=null?'data-v="'+esc(a.v)+'"':'')+'>'+a.t+'</button>').join('')+'</div>':'')+'</div>');
  }
  function active(){
    const api=window.__pharaohV91;
    return !!(api&&api.state&&api.state.active&&Date.now()-Number(api.state.startedAt||0)<60*60*1000);
  }
  function amountFrom(t){
    const s=norm(t);
    const nums=(s.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20&&n<=200000);
    if(!nums.length)return 0;
    if(/^(\d{2,6})\s*(ج|جنيه|جنية|جم|egp)?$/.test(s) || /(معايا|معي|ميزانيه|فلوس|رشح|باقه|اشحن|شحن|عايز|اريد|ب|جنيه|جنية|جم|egp)/.test(s))return nums[nums.length-1];
    return 0;
  }
  function natural(text){
    const s=norm(text);
    const api=window.__pharaohV91;
    if(!s)return false;

    if(/(الغي|الغاء|إلغاء|كنسل|cancel|مش عايز|مش عاوز|بلاش|وقف|خلاص مش|عايز الغي|عاوز الغي)/.test(s)){
      if(api&&typeof api.handle==='function')api.handle('cancel');
      else bot('تم الإلغاء','رجعتك للبداية. لما تحب تبدأ تاني اكتب: عايز أشحن.','',[{t:'طلب جديد',a:'newOrder',cls:'gold'}]);
      return true;
    }
    if(/(ابدا من الاول|ابدأ من الاول|من الاول|اعاده|اعادة|ريست|reset|ابدأ تاني|ابدا تاني)/.test(s)){
      if(api&&typeof api.start==='function')api.start();
      else bot('نبدأ من الأول','تمام، اكتب الميزانية أو اختار يدوي.','',[{t:'طلب جديد',a:'newOrder',cls:'gold'}]);
      return true;
    }
    if(/(ارجع|رجوع|ورا|رجعني|غير الباقه|غير الباقة|اختار باقه تانيه|اختار باقة تانية|رقم تاني|ميزانيه تانيه|غير الميزانيه)/.test(s)){
      if(api&&typeof api.handle==='function')api.handle('askBudget');
      else bot('تمام، نغير الاختيار','اكتب الميزانية الجديدة أو اختار من المنتجات.','',[{t:'اكتب ميزانية',a:'askBudget',cls:'gold'},{t:'اختار يدوي',a:'manualProducts'}]);
      return true;
    }
    const recentText=(body()?.innerText||'').slice(-1200);
    const contextDigits=String(text||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,'');
    if(/(ID|Pubg|PUBG|ايدي|ايدى|هات ID|هات ايدي|رقم الحساب|ID الحساب)/i.test(recentText)&&/^\d{5,15}$/.test(contextDigits))return false;
    if(/(رقم متابعة|رقم موبايل|الموبايل|تابع حالة|تتابع حالة)/i.test(recentText)&&/^01\d{9}$/.test(contextDigits))return false;
    if(/(آخر 3|اخر 3|3 أرقام|3 ارقام|رقم التحويل)/i.test(recentText)&&/^\d{3}$/.test(contextDigits))return false;
    const recentContextV98=(body()?.innerText||'').slice(-1600);
    const contextDigitsV98=String(text||'')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/\D/g,'');
    if(api&&active()){
      const asksForId=/(هات\s*id|اكتب\s*id|pubg\s*id|id الحساب|اي دي الحساب|ايدي الحساب|رقم الحساب|هات الايدي|هات الأيدي|اكتب الايدي|اكتب الأيدي)/i.test(recentContextV98);
      const asksForPhone=/(رقم متابعة|رقم موبايل|رقمك|الموبايل|تتابع حالة|تابع حالة|حالة الطلب|فونك|تليفونك)/i.test(recentContextV98);
      const asksForTransferTail=/(آخر 3|اخر 3|3 أرقام|3 ارقام|رقم التحويل|الرقم اللي حولت|حوالة|حولت منه)/i.test(recentContextV98);
      const asksForName=/(اسم الحساب|اسمك في اللعبة|اسم اللاعب|اسم اكونت|اسم الاكونت)/i.test(recentContextV98);
      if((asksForId||/(الايدي|الأيدي|\bid\b|اي دي)/i.test(s))&&/^\d{5,15}$/.test(contextDigitsV98))return false;
      if(asksForPhone&&/^01\d{9}$/.test(contextDigitsV98))return false;
      if(asksForTransferTail&&/^\d{3}$/.test(contextDigitsV98))return false;
      if(asksForName&&contextDigitsV98&&!/(معايا|ميزانيه|ميزانية|جنيه|جنية|اشحن|شحن|فلوس|رصيد)/.test(s))return false;
    }
    const amount=amountFrom(s);
    if(amount){
      if(api&&typeof api.start==='function')api.start(String(amount));
      else bot('فهمت ميزانيتك '+amount.toLocaleString('en-US')+' جنيه','هطلعلك أقرب ترشيحات مناسبة للرقم ده.','',[]);
      return true;
    }
    if(/(مش فاهم|مش فاهمك|اعمل ايه|مساعده|مساعدة|ساعدني|ايه المطلوب|اكتب ايه|فهمني)/.test(s)){
      bot('أنا معاك خطوة بخطوة','لو أنت في نص طلب، اكتب الحاجة المطلوبة بس. ولو عايز توقف اكتب: إلغاء.',
        '<div class="pharaoh-v85-note">أمثلة يفهمها فرعون: معايا 500، عايز ألغي، رجعني، غير الميزانية، InstaPay، محفظة، تم التحويل، فين طلبي.</div>',
        [{t:'ابدأ الشحن',a:'newOrder',cls:'gold'},{t:'اختار يدوي',a:'manualProducts'},{t:'الدعم',href:SUPPORT}]);
      return true;
    }
    if(/(انستا|انستاباي|insta|instapay)/.test(s)){
      if(api&&active()&&typeof api.handle==='function')api.handle('pay','InstaPay');
      else bot('الدفع عن طريق InstaPay','حوّل على InstaPay وبعدها ارفع سكرين التحويل.',
        '<div class="pharaoh-v91-paybox">InstaPay: <b>mofr3oon1</b><br>Phone: <b>01061707294</b></div>',
        [{t:'ابدأ طلب',a:'newOrder',cls:'gold'}]);
      return true;
    }
    if(/(محفظه|محفظة|كاش|فودافون|اورنج|اتصالات|وي|wallet)/.test(s)){
      if(api&&active()&&typeof api.handle==='function')api.handle('pay','Wallet');
      else bot('الدفع عن طريق محفظة كاش','حوّل على رقم المحفظة وبعدها ارفع سكرين التحويل.',
        '<div class="pharaoh-v91-paybox">Wallet Phone: <b>01061707294</b></div>',
        [{t:'ابدأ طلب',a:'newOrder',cls:'gold'}]);
      return true;
    }
    if(/(تم التحويل|حولت|دفعت|تم الدفع|خلصت دفع)/.test(s)){
      if(api&&typeof api.handle==='function')api.handle('paid');
      else bot('تمام','ارفع سكرين التحويل من السلة أو من خطوات فرعون.','',[{t:'افتح السلة',a:'openCart',cls:'gold'}]);
      return true;
    }
    if(/(فين طلبي|تابع طلبي|حاله الطلب|حالة الطلب|طلباتي|سجل الطلبات|اوردر|order)/.test(s)){
      if(typeof window.mobaShowView==='function')window.mobaShowView('orders');
      bot('فتحتلك سجل الطلبات','اكتب رقم الموبايل اللي عملت بيه الطلب عشان تظهر الحالة.','',[]);
      return true;
    }
    return false;
  }
  function wrap(){
    const api=window.__pharaohV91;
    if(api&&!api.__v98Natural){
      api.__v98Natural=true;
      api.state=api.state||{};
      const oldConsume=api.consumeText;
      api.consumeText=function(text){
        api.state.startedAt=Date.now();
        if(natural(text))return true;
        return oldConsume.apply(this,arguments);
      };
      const oldStart=api.start;
      api.start=function(text){
        api.state.active=true;
        api.state.startedAt=Date.now();
        return oldStart.apply(this,arguments);
      };
      const oldHandle=api.handle;
      api.handle=function(a,v){
        if(a==='cancel')api.state.active=false;
        if(['newOrder','askBudget','manualProducts','combo','manualPick'].includes(a))api.state.active=true;
        api.state.startedAt=Date.now();
        return oldHandle.apply(this,arguments);
      };
    }
  }
  const oldPriority=window.__pharaohPriorityTextV97;
  window.__pharaohPriorityTextV97=function(text){
    wrap();
    if(natural(text))return true;
    return typeof oldPriority==='function' ? oldPriority(text) : false;
  };
  wrap();
  document.addEventListener('DOMContentLoaded',wrap);
  setInterval(wrap,700);
})();


/* moba-v99-pharaoh-mic-natural-plus */
(function(){
  const SUPPORT='https://t.me/MOFR3OON';
  function qs(s,r=document){return r.querySelector(s)}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function clean(t){
    return String(t||'')
      .replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[^\S\r\n]+/g,' ')
      .toLowerCase().trim();
  }
  function body(){return qs('#pharaohChatBody')}
  function add(type,html){
    const b=body(), ty=qs('#pharaohTyping'); if(!b)return;
    const m=document.createElement('div');
    m.className='pharaoh-msg '+type+' pharaoh-brain-new';
    m.innerHTML=html;
    if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function user(text){add('user',esc(text))}
  function bot(title,small,inner,actions){
    add('bot','<div class="pharaoh-v85-card"><b>'+title+'</b>'+(small?'<small>'+small+'</small>':'')+(inner||'')+(actions&&actions.length?'<div class="pharaoh-v85-actions">'+actions.map(a=>a.href?'<a class="'+(a.cls||'')+'" href="'+a.href+'" target="_blank">'+a.t+'</a>':'<button type="button" class="'+(a.cls||'')+'" data-v91-act="'+a.a+'" '+(a.v!=null?'data-v="'+esc(a.v)+'"':'')+'>'+a.t+'</button>').join('')+'</div>':'')+'</div>');
  }
  function status(msg,type){
    let st=qs('#pharaohMicStatusV99');
    const form=qs('#pharaohChatForm');
    if(!st&&form){st=document.createElement('div');st.id='pharaohMicStatusV99';form.insertAdjacentElement('beforebegin',st)}
    if(!st)return;
    st.textContent=msg;
    st.className='show '+(type||'');
    clearTimeout(window.__pharaohMicStatusTimerV99);
    window.__pharaohMicStatusTimerV99=setTimeout(()=>st.classList.remove('show'),6500);
  }
  function amountFrom(text){
    const t=clean(text);
    const nums=(t.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20&&n<=200000);
    if(!nums.length)return 0;
    if(/^(\d{2,6})\s*(ج|جنيه|جنية|جم|egp)?$/.test(t) || /(معايا|معي|معاي|معايا كام|ميزانيه|فلوس|رصيد|رشح|اقترح|باقه|اشحن|شحن|عايز|عاوز|اريد|ابغي|ب|جنيه|جنية|جم|egp)/.test(t))return nums[nums.length-1];
    return 0;
  }
  function activeOrder(){
    const api=window.__pharaohV91;
    return !!(api&&api.state&&api.state.active&&Date.now()-Number(api.state.startedAt||0)<60*60*1000);
  }
  function understand(text,showUser){
    const raw=String(text||'').trim();
    const t=clean(raw);
    const api=window.__pharaohV91;
    if(!raw)return false;
    if(showUser)user(raw);

    if(/(الغي|الغاء|اللغاء|كنسل|cancel|مش عايز|مش عاوز|بلاش|وقف|سيبك|خلاص|مش هكمل|عايز الغي|عاوز الغي|لا خلاص)/.test(t)){
      if(api&&typeof api.handle==='function')api.handle('cancel');
      else bot('تمام، ألغيت الخطوة الحالية','لو حبيت تبدأ تاني اكتب: عايز أشحن أو اكتب ميزانيتك.','',[{t:'طلب جديد',a:'newOrder',cls:'gold'}]);
      return true;
    }
    if(/(ارجع|رجوع|رجعني|ورا|اللي قبلها|غير|بدل|رقم تاني|ميزانيه تانيه|باقة تانيه|باقه تانيه|اختيار تاني)/.test(t)){
      if(api&&typeof api.handle==='function')api.handle('askBudget');
      else bot('تمام، نغير الاختيار','اكتب ميزانية جديدة أو اختار يدوي.','',[{t:'اكتب ميزانية',a:'askBudget',cls:'gold'},{t:'اختار يدوي',a:'manualProducts'}]);
      return true;
    }
    if(/(ابدا من الاول|ابدأ من الاول|نبدأ من الاول|اعاده|اعادة|ريست|reset|ابدأ تاني|ابدا تاني|من جديد)/.test(t)){
      if(api&&typeof api.start==='function')api.start();
      else bot('نبدأ من الأول','اكتب ميزانيتك أو اختار يدوي.','',[{t:'طلب جديد',a:'newOrder',cls:'gold'}]);
      return true;
    }
    const recentContextV99=(body()?.innerText||'').slice(-1600);
    const contextDigitsV99=String(raw||'')
      .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/\D/g,'');
    if(activeOrder()&&api&&typeof api.consumeText==='function'){
      const asksForId=/(هات\s*id|اكتب\s*id|pubg\s*id|id الحساب|اي دي الحساب|ايدي الحساب|رقم الحساب|هات الايدي|هات الأيدي|اكتب الايدي|اكتب الأيدي)/i.test(recentContextV99);
      const asksForPhone=/(رقم متابعة|رقم موبايل|رقمك|الموبايل|تتابع حالة|تابع حالة|حالة الطلب|فونك|تليفونك)/i.test(recentContextV99);
      const asksForTransferTail=/(آخر 3|اخر 3|3 أرقام|3 ارقام|رقم التحويل|الرقم اللي حولت|حوالة|حولت منه)/i.test(recentContextV99);
      const asksForName=/(اسم الحساب|اسمك في اللعبة|اسم اللاعب|اسم اكونت|اسم الاكونت)/i.test(recentContextV99);
      if((asksForId||/(الايدي|الأيدي|\bid\b|اي دي)/i.test(t))&&/^\d{5,15}$/.test(contextDigitsV99)){
        api.state.startedAt=Date.now();
        return api.consumeText(contextDigitsV99);
      }
      if(asksForPhone&&/^01\d{9}$/.test(contextDigitsV99)){
        api.state.startedAt=Date.now();
        return api.consumeText(contextDigitsV99);
      }
      if(asksForTransferTail&&/^\d{3}$/.test(contextDigitsV99)){
        api.state.startedAt=Date.now();
        return api.consumeText(contextDigitsV99);
      }
      if(asksForName&&contextDigitsV99&&!/(معايا|ميزانيه|ميزانية|جنيه|جنية|اشحن|شحن|فلوس|رصيد)/.test(t)){
        api.state.startedAt=Date.now();
        return api.consumeText(raw);
      }
    }
    const amount=amountFrom(raw);
    if(amount){
      if(api&&typeof api.start==='function')api.start(String(amount));
      else bot('فهمت إن معاك '+amount.toLocaleString('en-US')+' جنيه','هطلعلك ترشيحات مناسبة للميزانية دي.','',[]);
      return true;
    }
    if(/(اشحن|شحن|عايز اشحن|عاوز اشحن|ابدا شحن|ابدأ شحن|طلب جديد|اوردر جديد|اعمل طلب)/.test(t)){
      if(api&&typeof api.start==='function')api.start(raw);
      else bot('يلا نبدأ الشحن','اكتب الميزانية اللي معاك أو اختار يدوي.','',[{t:'اكتب ميزانية',a:'askBudget',cls:'gold'},{t:'اختار يدوي',a:'manualProducts'}]);
      return true;
    }
    if(/(مش فاهم|مش فاهمك|اعمل ايه|اساعدني|ساعدني|مساعده|مساعدة|اكتب ايه|اي المطلوب|فهمني|وضحلي|مش عارف)/.test(t)){
      bot('أنا فاهمك، قولها بطريقتك','فرعون يفهم كلام عادي زي: معايا 500، عايز ألغي، رجعني، غير الميزانية، تم التحويل، فين طلبي.',
        '<div class="pharaoh-v85-note">لو أنت في خطوة ID اكتب الأرقام بس. لو عايز توقف اكتب: إلغاء. لو عايز تختار من جديد اكتب: رجعني.</div>',
        [{t:'ابدأ الشحن',a:'newOrder',cls:'gold'},{t:'اختار يدوي',a:'manualProducts'},{t:'الدعم',href:SUPPORT}]);
      return true;
    }
    if(/(انستا|انستاباي|insta|instapay)/.test(t)){
      if(api&&activeOrder()&&typeof api.handle==='function')api.handle('pay','InstaPay');
      else bot('InstaPay','حوّل على InstaPay وبعدها ارفع سكرين التحويل.','<div class="pharaoh-v91-paybox">InstaPay: <b>mofr3oon1</b><br>Phone: <b>01061707294</b></div>',[]);
      return true;
    }
    if(/(محفظه|محفظة|كاش|فودافون|اورنج|اتصالات|وي|wallet|vodafone|cash)/.test(t)){
      if(api&&activeOrder()&&typeof api.handle==='function')api.handle('pay','Wallet');
      else bot('محفظة كاش','حوّل على رقم المحفظة وبعدها ارفع سكرين التحويل.','<div class="pharaoh-v91-paybox">Wallet Phone: <b>01061707294</b></div>',[]);
      return true;
    }
    if(/(تم التحويل|حولت|دفعت|تم الدفع|خلصت دفع|بعت الفلوس|حولت الفلوس)/.test(t)){
      if(api&&typeof api.handle==='function')api.handle('paid');
      else bot('تمام','ارفع سكرين التحويل عشان نكمل الطلب.','',[]);
      return true;
    }
    if(/(فين طلبي|تابع طلبي|حاله الطلب|حالة الطلب|طلباتي|سجل الطلبات|اوردر|order|اتشحن|اتأخر|متاخر)/.test(t)){
      if(typeof window.mobaShowView==='function')window.mobaShowView('orders');
      bot('فتحتلك سجل الطلبات','اكتب رقم الموبايل اللي عملت بيه الطلب.','',[]);
      return true;
    }
    if(activeOrder()&&api&&typeof api.consumeText==='function'){
      api.state.startedAt=Date.now();
      return api.consumeText(raw);
    }
    return false;
  }
  function installBrain(){
    const oldPriority=window.__pharaohPriorityTextV97;
    if(!window.__pharaohPriorityTextV99){
      window.__pharaohPriorityTextV99=true;
      window.__pharaohPriorityTextV97=function(text){
        if(understand(text,true))return true;
        return typeof oldPriority==='function' ? oldPriority(text) : false;
      };
      const oldForce=window.__pharaohForceSendV69;
      window.__pharaohForceSendV69=function(){
        const inp=qs('#pharaohChatInput');
        const text=inp&&inp.value.trim();
        if(text&&understand(text,true)){inp.value='';return}
        if(typeof oldForce==='function')return oldForce();
      };
    }
  }
  function installMic(){
    const form=qs('#pharaohChatForm'), send=qs('#pharaohSendBtn');
    if(!form||!send)return;
    let btn=qs('#pharaohMicBtn');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.id='pharaohMicBtn';
      form.insertBefore(btn,send);
    }
    btn.textContent='🎙';
    btn.disabled=false;
    btn.title='اضغط للتسجيل واضغط تاني للإيقاف';
    btn.classList.add('v99-ready','ready');

    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!window.isSecureContext){
      btn.onclick=function(){status('افتح الموقع من localhost أو HTTPS عشان المايك يشتغل.','err')};
      return;
    }
    if(!SR){
      btn.onclick=function(){status('المتصفح ده مش داعم تحويل الصوت لنص. استخدم Chrome أو Edge.','err')};
      return;
    }
    if(btn.__v99Installed)return;
    btn.__v99Installed=true;
    let rec=null, wanted=false, heard='', until=0, restarting=false;
    function makeRec(){
      rec=new SR();
      rec.lang='ar-EG';
      rec.interimResults=true;
      rec.continuous=true;
      rec.maxAlternatives=3;
      rec.onstart=function(){
        btn.classList.add('listening','v99-listening');
        status('فرعون بيسمعك... اتكلم دلوقتي، ولو وقف لحظة هيفتح تاني لوحده.','ok');
      };
      rec.onerror=function(e){
        if(e&&e.error==='not-allowed'){
          wanted=false;
          btn.classList.remove('listening','v99-listening');
          status('المتصفح منع المايك. دوس علامة القفل جنب الرابط واسمح للميكروفون.','err');
          return;
        }
        if(e&&e.error==='no-speech')status('مسمعتش صوت واضح، قرب من المايك واتكلم تاني.','err');
      };
      rec.onend=function(){
        btn.classList.remove('listening','v99-listening');
        if(wanted && Date.now()<until && !heard && !restarting){
          restarting=true;
          setTimeout(function(){
            restarting=false;
            try{rec.start()}catch(e){}
          },280);
        }else if(wanted && !heard){
          wanted=false;
          status('المايك خلص من غير صوت واضح. دوس المايك وجرب جملة قصيرة زي: معايا 500.','err');
        }
      };
      rec.onresult=function(e){
        let text='';
        for(let i=e.resultIndex||0;i<e.results.length;i++){
          text+=(e.results[i][0]&&e.results[i][0].transcript||'')+' ';
        }
        text=text.trim();
        const inp=qs('#pharaohChatInput');
        if(inp&&text)inp.value=text;
        const last=e.results[e.results.length-1];
        if(last&&last.isFinal&&text){
          heard=text;
          wanted=false;
          try{rec.stop()}catch(err){}
          status('سمعتك: '+text,'ok');
          if(inp)inp.value='';
          if(!understand(text,true)){
            bot('سمعتك','قلت: '+esc(text)+'<br>قول مثلًا: معايا 500، عايز أشحن، فين طلبي، أو عايز ألغي.','',[]);
          }
        }
      };
    }
    makeRec();
    btn.onclick=async function(e){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      installBrain();
      if(wanted){
        wanted=false;
        try{rec&&rec.stop()}catch(err){}
        btn.classList.remove('listening','v99-listening');
        status('وقفت التسجيل.','');
        return false;
      }
      try{
        if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
          const stream=await navigator.mediaDevices.getUserMedia({audio:true});
          stream.getTracks().forEach(t=>t.stop());
        }
        wanted=true;
        heard='';
        until=Date.now()+20000;
        makeRec();
        rec.start();
      }catch(err){
        wanted=false;
        status('لو مظهرش طلب السماح، افتح صلاحيات الموقع واسمح للميكروفون. على الموبايل الأفضل Chrome.','err');
      }
      return false;
    };
  }
  installBrain();
  installMic();
  document.addEventListener('DOMContentLoaded',function(){installBrain();installMic()});
  setInterval(function(){installBrain();installMic()},900);
})();


/* moba-v113-pharaoh-fix-buttons-action */
(function(){
  if(window.__mobaV113PharaohFixButtons)return;
  window.__mobaV113PharaohFixButtons=true;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function openPanel(){
    const panel=qs('#pharaohChatPanel');
    const fab=qs('#pharaohAssistantFab');
    if(panel){
      panel.classList.add('show');
      panel.removeAttribute('aria-hidden');
    }else if(fab){
      fab.click();
    }
    try{fab&&fab.classList.remove('show-hint')}catch(e){}
  }
  function addBot(html){
    openPanel();
    const body=qs('#pharaohChatBody');
    const typing=qs('#pharaohTyping');
    if(!body)return;
    const msg=document.createElement('div');
    msg.className='pharaoh-msg bot pharaoh-brain-new';
    msg.innerHTML=html;
    if(typing&&typing.parentElement===body)body.insertBefore(msg,typing); else body.appendChild(msg);
    body.scrollTop=body.scrollHeight;
  }
  function issueText(type){
    if(type==='bad_screen'||type==='badshot'){
      return '<b>فرعون معاك في مشكلة السكرين 👑</b><small>اضغط على زر رفع السكرين الجديد، واختار صورة واضحة فيها المبلغ ووقت التحويل ورقم العملية، وبعدها اضغط إرسال التعديل للمراجعة.</small>';
    }
    if(type==='bad_id'){
      return '<b>فرعون معاك في تعديل ID 👑</b><small>اكتب PUBG ID الصحيح واسم الحساب داخل اللعبة، وبعدها اضغط إرسال التعديل للمراجعة.</small>';
    }
    if(type==='bad_phone'){
      return '<b>فرعون معاك في تعديل رقم المتابعة 👑</b><small>اكتب رقم موبايل صحيح يبدأ بـ 01 ومكون من 11 رقم، وبعدها ابعت التعديل.</small>';
    }
    return '<b>فرعون معاك 👑</b><small>افتح خانة تعديل الطلب واكتب المطلوب أو ارفع السكرين الجديد حسب سبب المشكلة.</small>';
  }
  function highlightFixForm(){
    const form=qs('.fix-form');
    if(!form)return;
    form.scrollIntoView({behavior:'smooth',block:'center'});
    form.style.boxShadow='0 0 0 3px rgba(39,216,255,.35),0 0 28px rgba(39,216,255,.22)';
    setTimeout(()=>{form.style.boxShadow=''},1800);
  }
  window.askPharaohAboutIssue=function(type){
    const t=String(type||qs('.fix-form [name="fixType"]')?.value||'').trim();
    addBot('<div class="pharaoh-v85-card">'+issueText(t)+'<div class="pharaoh-v85-actions"><button type="button" class="gold" data-v113-highlight-fix>روح للتعديل</button><a href="https://t.me/MOFR3OON" target="_blank" rel="noopener">الدعم المباشر</a></div></div>');
    setTimeout(highlightFixForm,250);
  };
  function fixButtons(){
    qsa('.fix-form').forEach(form=>{
      let type=form.querySelector('[name="fixType"]')?.value||'';
      let btn=form.querySelector('.ask-pharaoh-btn');
      if(!btn){
        btn=document.createElement('button');
        btn.type='button';
        btn.className='ask-pharaoh-btn';
        btn.textContent='👑 اسأل فرعون عن المشكلة';
        form.appendChild(btn);
      }
      btn.type='button';
      btn.dataset.askPharaohIssue=type;
      btn.onclick=function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window.askPharaohAboutIssue(type);
        return false;
      };
    });
  }
  document.addEventListener('click',function(e){
    const h=e.target.closest&&e.target.closest('[data-v113-highlight-fix]');
    if(h){e.preventDefault();e.stopImmediatePropagation();highlightFixForm();return false}
    const btn=e.target.closest&&e.target.closest('.ask-pharaoh-btn,[data-ask-pharaoh-issue]');
    if(btn){
      e.preventDefault();
      e.stopImmediatePropagation();
      window.askPharaohAboutIssue(btn.dataset.askPharaohIssue||btn.closest('.fix-form')?.querySelector('[name="fixType"]')?.value||'');
      return false;
    }
    const support=e.target.closest&&e.target.closest('a.fix-support,a.order-support-link');
    if(support&&support.href){
      e.preventDefault();
      window.location.href=support.href;
      return false;
    }
  },true);
  const mo=new MutationObserver(()=>fixButtons());
  mo.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',fixButtons);
  setTimeout(fixButtons,300);
  setInterval(fixButtons,8000);
})();


/* moba-v120-pharaoh-quick-request */
(function(){
  if(window.__mobaV120QuickRequest)return; window.__mobaV120QuickRequest=true;
  function qs(s,r=document){return r.querySelector(s)}
  function body(){return qs('#pharaohChatBody')}
  function addBot(html){
    const b=body(); if(!b)return;
    const m=document.createElement('div');m.className='pharaoh-msg bot pharaoh-brain-new';m.innerHTML=html;
    const ty=qs('#pharaohTyping',b); if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m);
    b.scrollTop=b.scrollHeight;
  }
  function openProducts(){
    try{document.body.dataset.page='game';document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
  }
  document.addEventListener('click',function(e){
    const btn=e.target.closest&&e.target.closest('[data-v120-open-products]');
    if(btn){e.preventDefault();e.stopImmediatePropagation();openProducts();return false}
  },true);
  document.addEventListener('keydown',function(e){
    if(!(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'))return;
    const t=String(e.target.value||'').trim();
    const m=t.match(/(?:عايز|اريد|اشحن|طلب)?\s*(60|325|660|1800|3850|8100)\s*(?:uc|شدة|شده|شدات)?/i);
    if(!m)return;
    setTimeout(()=>addBot('<div class="pharaoh-v85-card"><b>تمام، فهمت إنك عايز '+m[1]+' UC</b><small>افتح قسم المنتجات واختار نفس الباقة، وبعدها اكتب ID واسم الحساب وضيفها للسلة.</small><div class="pharaoh-v85-actions"><button type="button" class="gold" data-v120-open-products>افتح المنتجات</button></div></div>'),60);
  },true);
})();


/* moba-v129-pharaoh-payment-settings */
(function(){
  if(window.__pharaohPayV129)return; window.__pharaohPayV129=true;
  fetch('/api/settings').then(r=>r.json()).then(d=>{window.mobaPaymentSettings=d.settings?.payment_settings||window.mobaPaymentSettings||null}).catch(()=>{});
})();

/* moba-v181-pharaoh-multi-game-budget-recommender */
(function(){
  if(window.__mobaV181PharaohMultiGameBudget)return; window.__mobaV181PharaohMultiGameBudget=true;
  const GAME_NAMES={pubg:'PUBG Mobile',freefire:'Free Fire',roblox:'Roblox',tiktok:'TikTok',valorant:'Valorant',yalla_ludo:'Yalla Ludo',last_war:'Last War',efootball:'eFootball',blood_mena:'Blood Strike MENA',blood_global:'Blood Strike Global',kingshot:'King Shot','8ball':'8 Ball Pool',goal_battle:'Goal Battle'};
  const DEFAULT_GAMES=[
    {key:'pubg',title:'PUBG Mobile',currency:'UC',status:'available'},
    {key:'freefire',title:'Free Fire',currency:'💎',status:'available'},
    {key:'roblox',title:'Roblox',currency:'Robux',status:'soon'},
    {key:'tiktok',title:'TikTok',currency:'Coins',status:'soon'},
    {key:'valorant',title:'Valorant',currency:'VP',status:'soon'},
    {key:'yalla_ludo',title:'Yalla Ludo',currency:'Diamonds',status:'soon'},
    {key:'last_war',title:'Last War',currency:'Coins',status:'soon'},
    {key:'efootball',title:'eFootball',currency:'Coins',status:'soon'}
  ];
  const DEFAULT_PRODUCTS=[
    {game:'pubg',cat:'uc',name:'60 UC',price:50,uc:60,type:'شدات PUBG'},
    {game:'pubg',cat:'uc',name:'325 UC',price:235,uc:325,type:'شدات PUBG'},
    {game:'pubg',cat:'uc',name:'660 UC',price:435,uc:660,type:'شدات PUBG'},
    {game:'pubg',cat:'uc',name:'1800 UC',price:1120,uc:1800,type:'شدات PUBG'},
    {game:'pubg',cat:'uc',name:'3850 UC',price:2170,uc:3850,type:'شدات PUBG'},
    {game:'pubg',cat:'uc',name:'8100 UC',price:4350,uc:8100,type:'شدات PUBG'},
    {game:'freefire',cat:'freefire_diamonds',name:'50 💎',price:40,uc:50,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_diamonds',name:'100 💎',price:70,uc:100,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_diamonds',name:'210 💎',price:130,uc:210,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_diamonds',name:'310 💎',price:180,uc:310,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_diamonds',name:'583 💎',price:300,uc:583,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_diamonds',name:'1,188 💎',price:590,uc:1188,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_diamonds',name:'2,420 💎',price:1140,uc:2420,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_diamonds',name:'6,160 💎',price:2800,uc:6160,type:'جواهر فري فاير'},
    {game:'freefire',cat:'freefire_memberships',name:'عضوية اسبوعية',price:130,uc:0,type:'عضوية'},
    {game:'freefire',cat:'freefire_memberships',name:'عضوية شهرية',price:570,uc:0,type:'عضوية'},
    {game:'freefire',cat:'freefire_memberships',name:'تصريح بوياه',price:180,uc:0,type:'تصريح'}
  ];
  const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=t=>String(t||'').toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/\s+/g,' ').trim();
  const money=n=>Number(n||0).toLocaleString('ar-EG')+' جنيه';
  const qs=(s,r=document)=>r.querySelector(s);
  function body(){return qs('#pharaohChatBody')||qs('.pharaoh-chat-body')||qs('#pharaohChatPanel')}
  function openPanel(){const p=qs('#pharaohChatPanel');const f=qs('#pharaohAssistantFab'); if(p){p.classList.add('show');p.removeAttribute('aria-hidden')} else if(f)f.click();}
  function add(type,html){openPanel();const b=body();if(!b)return;const m=document.createElement('div');m.className='pharaoh-msg '+type+' pharaoh-v181-msg';m.innerHTML=html;const ty=qs('#pharaohTyping',b); if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m); b.scrollTop=b.scrollHeight;}
  function bot(html){setTimeout(()=>add('bot',html),80)}
  function user(t){add('user',esc(t))}
  function digits(t){return (String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).match(/\d+/g)||[]).map(Number).pop()||0}
  function looksBudget(t){const s=norm(t);return digits(s)&&/(معايا|معي|ميزانيه|ميزانية|فلوس|رشح|ترشيح|باقه|باقة|اشحن|شحن|عايز|عاوز|جنيه|جنيه|جم|egp)/i.test(s)}
  async function getCatalog(){
    try{
      const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); const s=d.settings||{};
      const games=(Array.isArray(s.game_settings)&&s.game_settings.length?s.game_settings:DEFAULT_GAMES).filter(g=>g&&g.active!==false).map(g=>({key:g.key||g.id||'pubg',title:g.title||GAME_NAMES[g.key]||g.key,currency:g.currency||'',status:g.status||'available'}));
      const products=(Array.isArray(s.dynamic_products)&&s.dynamic_products.length?s.dynamic_products:DEFAULT_PRODUCTS).filter(p=>p&&p.name&&!p.hidden&&p.active!==false).map(p=>({game:p.game||'pubg',cat:p.cat||'uc',name:p.name,price:Number(p.sale_price&&p.sale_price<p.price?p.sale_price:p.price||0),uc:Number(p.uc||0),type:p.type||'',status:p.status||'available'})).filter(p=>p.price>0);
      return {games,products};
    }catch(e){return {games:DEFAULT_GAMES,products:DEFAULT_PRODUCTS};}
  }
  function gameChooseCard(amount,games){
    localStorage.setItem('pharaoh_v181_budget',String(amount));
    const available=games.filter(g=>g.status!=='disabled'&&g.status!=='hidden');
    return `<div class="pharaoh-v85-card pharaoh-v181-budget-card"><b>تمام معاك ${amount.toLocaleString('en-US')} جنيه</b><small>اختار اللعبة الأول، وبعدها هرشحلك أفضل حاجة بنفس الميزانية دي.</small><div class="pharaoh-v181-games">${available.map(g=>`<button type="button" data-v181-budget-game="${esc(g.key)}">${esc(g.title)}<small>${esc(g.currency||'')}</small></button>`).join('')}</div><div class="pharaoh-v85-note">ممكن تكتب اسم اللعبة بدل ما تدوس، مثال: فري فاير أو ببجي.</div></div>`;
  }
  function greedyCombos(products,amount){
    const list=products.filter(p=>p.price<=amount&&p.status!=='disabled'&&p.status!=='hidden').sort((a,b)=>b.price-a.price||b.uc-a.uc);
    if(!list.length)return [];
    const exact=list.slice(0,4).map(p=>({items:[p],total:p.price,left:amount-p.price,score:p.price}));
    const combos=[];
    for(const start of list.slice(0,5)){
      let left=amount, items=[];
      const sorted=list.slice().sort((a,b)=>b.price-a.price);
      for(const p of [start,...sorted]){while(p.price<=left && items.length<5){items.push(p);left-=p.price; if(p.price===start.price)break;}}
      if(items.length)combos.push({items,total:amount-left,left,score:amount-left});
    }
    return [...exact,...combos].sort((a,b)=>a.left-b.left||b.score-a.score).slice(0,5);
  }
  async function recommendGame(gameKey,amount){
    amount=Number(amount||localStorage.getItem('pharaoh_v181_budget')||0);
    const {games,products}=await getCatalog(); const g=games.find(x=>x.key===gameKey)||{key:gameKey,title:GAME_NAMES[gameKey]||gameKey,currency:''};
    const ps=products.filter(p=>(p.game||'pubg')===gameKey);
    if(!amount)return bot(gameChooseCard(500,games));
    if(!ps.length)return bot(`<div class="pharaoh-v85-card"><b>${esc(g.title)}</b><small>اللعبة موجودة بس لسه مفيش منتجات متاحة ليها في اللوحة.</small><div class="pharaoh-v85-actions"><button type="button" data-v181-open-game="${esc(gameKey)}">افتح اللعبة</button></div></div>`);
    const combos=greedyCombos(ps,amount);
    if(!combos.length)return bot(`<div class="pharaoh-v85-card"><b>${esc(g.title)} - الميزانية قليلة</b><small>أقل منتج متاح في اللعبة دي أعلى من ${money(amount)}.</small><div class="pharaoh-v85-actions"><button type="button" data-v181-budget-back>اختار لعبة تانية</button></div></div>`);
    bot(`<div class="pharaoh-v85-card pharaoh-v181-budget-card"><b>ترشيحات ${esc(g.title)} لميزانية ${money(amount)}</b><small>اخترتلك أقرب اختيارات تحت نفس المبلغ.</small>${combos.map((c,i)=>`<div class="pharaoh-v90-combo" data-v181-pick-combo="${i}" data-game="${esc(gameKey)}"><b>${i+1}) ${c.items.map(p=>esc(p.name)).join(' + ')}</b><small>الإجمالي: <strong>${money(c.total)}</strong>${c.left?` | المتبقي: ${money(c.left)}`:''}</small></div>`).join('')}<div class="pharaoh-v85-actions"><button class="gold" type="button" data-v181-open-game="${esc(gameKey)}">افتح منتجات ${esc(g.title)}</button><button type="button" data-v181-budget-back>اختار لعبة تانية</button></div></div>`);
  }
  async function handleBudgetText(t){const amount=digits(t); if(!amount)return false; const {games}=await getCatalog(); user(t); bot(gameChooseCard(amount,games)); return true;}
  function detectGame(t){const s=norm(t); const map={pubg:['ببجي','بابجي','pubg','uc'],freefire:['فري فاير','فرى فاير','free fire','freefire','جواهر'],tiktok:['تيك توك','tiktok'],roblox:['روبلوكس','roblox'],valorant:['فالورانت','valorant'],yalla_ludo:['يلا لودو','ludo'],last_war:['last war','لاست وار'],efootball:['efootball','بيس','ايفوتبول']}; for(const [k,arr] of Object.entries(map)){if(arr.some(x=>s.includes(norm(x))))return k} return ''}
  function openGame(game){try{window.activeGame=game;if(typeof window.mobaShowView==='function')window.mobaShowView('game');else document.body.dataset.page='game'; if(typeof window.renderProducts==='function')window.renderProducts(); document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}}
  document.addEventListener('keydown',function(e){
    if(!(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'))return;
    const t=String(e.target.value||'').trim(); if(!t)return;
    const game=detectGame(t), amount=digits(t)||Number(localStorage.getItem('pharaoh_v181_budget')||0);
    if(looksBudget(t)){
      e.preventDefault(); e.stopImmediatePropagation(); e.target.value=''; handleBudgetText(t); return false;
    }
    if(game&&amount&&/(رشح|ترشيح|معايا|ميزانيه|ميزانية|اشحن|شحن|عايز|عاوز|فري|ببجي|pubg|free)/i.test(t)){
      e.preventDefault(); e.stopImmediatePropagation(); e.target.value=''; user(t); recommendGame(game,amount); return false;
    }
  },true);
  document.addEventListener('click',function(e){
    const g=e.target.closest&&e.target.closest('[data-v181-budget-game]'); if(g){e.preventDefault();e.stopImmediatePropagation(); recommendGame(g.dataset.v181BudgetGame,Number(localStorage.getItem('pharaoh_v181_budget')||0)); return false;}
    const back=e.target.closest&&e.target.closest('[data-v181-budget-back]'); if(back){e.preventDefault();e.stopImmediatePropagation(); getCatalog().then(c=>bot(gameChooseCard(Number(localStorage.getItem('pharaoh_v181_budget')||0)||500,c.games))); return false;}
    const open=e.target.closest&&e.target.closest('[data-v181-open-game]'); if(open){e.preventDefault();e.stopImmediatePropagation();openGame(open.dataset.v181OpenGame); return false;}
  },true);
  const st=document.createElement('style'); st.textContent=`.pharaoh-v181-games{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.pharaoh-v181-games button{border:1px solid rgba(39,216,255,.28);background:rgba(39,216,255,.08);color:#fff;border-radius:14px;padding:10px;font-weight:900;text-align:right;cursor:pointer}.pharaoh-v181-games button small{display:block;color:#ffe28a;margin-top:3px}.pharaoh-v181-budget-card .pharaoh-v90-combo{cursor:pointer;border:1px solid rgba(255,216,107,.26);border-radius:14px;padding:10px;margin:8px 0;background:rgba(255,216,107,.055)}@media(max-width:520px){.pharaoh-v181-games{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();


/* moba-v182-pharaoh-clean-start-smart-games */
(function(){
  if(window.__mobaV182PharaohCleanSmart)return; window.__mobaV182PharaohCleanSmart=true;
  const SUPPORT='https://t.me/MOFR3OON';
  const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=t=>String(t||'').toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/\s+/g,' ').trim();
  const money=n=>Number(n||0).toLocaleString('ar-EG')+' جنيه';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const body=()=>qs('#pharaohChatBody');
  const input=()=>qs('#pharaohChatInput');
  function digits(t){return (String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).match(/\d+/g)||[]).map(Number).pop()||0}
  function openPanel(){const p=qs('#pharaohChatPanel'); if(p){p.classList.add('show');p.removeAttribute('aria-hidden')} else qs('#pharaohAssistantFab')?.click();}
  function add(type,html){openPanel();const b=body();if(!b)return;const m=document.createElement('div');m.className='pharaoh-msg '+type+' pharaoh-v182-msg';m.innerHTML=html;const ty=qs('#pharaohTyping',b); if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m); b.scrollTop=b.scrollHeight; pruneInitial();}
  function bot(html){setTimeout(()=>add('bot',html),60)}
  function user(t){add('user',esc(t))}
  function card(title,sub,inside='',buttons=[]){return `<div class="pharaoh-v85-card pharaoh-v182-card"><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}${inside||''}<div class="pharaoh-v85-actions">${buttons.map(b=>b.href?`<a href="${esc(b.href)}" target="_blank" rel="noopener">${esc(b.t)}</a>`:`<button type="button" class="${esc(b.cls||'')}" data-v182-act="${esc(b.a||'')}" ${b.v!=null?`data-v="${esc(b.v)}"`:''} ${b.game?`data-game="${esc(b.game)}"`:''}>${esc(b.t)}</button>`).join('')}</div></div>`}
  function home(){return card('أنا معاك يا بطل','اختار اللي محتاجه وفرعون يكملك خطوة بخطوة','<div class="pharaoh-v85-note">شحن جديد، متابعة طلب، فحص طلب، أو مشكلة؟</div>',[
    {t:'تابع طلبي',a:'track',cls:'green'},{t:'ابدأ الشحن',a:'start',cls:'gold'},{t:'افحص طلبي',a:'check'},{t:'مشكلة في الطلب',a:'problem'}
  ])}
  function pruneInitial(){
    const b=body(); if(!b)return;
    // اخفاء كارت الدفع اللي كان بيظهر اول فتح بسبب سكريبتات قديمة
    qsa('.pharaoh-msg.bot',b).forEach((m,i)=>{
      const tx=(m.textContent||'').trim();
      if(/تمام اختارت طريقة الدفع|تمام اخترت طريقة الدفع|بعد الاختيار راجع سكرين واضح|او التحويل من رقم تاني/.test(tx) && !b.dataset.v182PaymentAllowed){m.remove();}
    });
    const msgs=qsa('.pharaoh-msg',b).filter(m=>!m.id && !m.classList.contains('pharaoh-typing'));
    const hasUser=msgs.some(m=>m.classList.contains('user'));
    if(!hasUser){
      // خليه يظهر كارت البداية فقط بدل تكرارات الترحيب القديمة
      const bots=qsa('.pharaoh-msg.bot',b).filter(m=>!m.classList.contains('pharaoh-typing'));
      bots.forEach((m,i)=>{ if(i>0 && !m.classList.contains('pharaoh-v182-home-only')) m.remove(); });
    }
  }
  const DEFAULT_GAMES=[
    {key:'pubg',title:'PUBG Mobile',currency:'UC',status:'available'}, {key:'freefire',title:'Free Fire',currency:'💎',status:'available'},
    {key:'roblox',title:'Roblox',currency:'Robux',status:'available'}, {key:'tiktok',title:'TikTok',currency:'Coins',status:'available'},
    {key:'valorant',title:'Valorant',currency:'VP',status:'available'}, {key:'yalla_ludo',title:'Yalla Ludo',currency:'Diamonds',status:'available'},
    {key:'last_war',title:'Last War',currency:'Coins',status:'available'}, {key:'efootball',title:'eFootball',currency:'Coins',status:'available'},
    {key:'blood_mena',title:'Blood Strike MENA',currency:'Top Up',status:'available'}, {key:'kingshot',title:'King Shot',currency:'Top Up',status:'available'}, {key:'8ball',title:'8 Ball Pool',currency:'Coins',status:'available'}
  ];
  const DEFAULT_PRODUCTS=[
    {game:'pubg',name:'60 UC',price:50,score:60},{game:'pubg',name:'325 UC',price:235,score:325},{game:'pubg',name:'660 UC',price:435,score:660},{game:'pubg',name:'1800 UC',price:1120,score:1800},{game:'pubg',name:'3850 UC',price:2170,score:3850},{game:'pubg',name:'8100 UC',price:4350,score:8100},
    {game:'freefire',name:'50 💎',price:40,score:50},{game:'freefire',name:'100 💎',price:70,score:100},{game:'freefire',name:'210 💎',price:130,score:210},{game:'freefire',name:'310 💎',price:180,score:310},{game:'freefire',name:'583 💎',price:300,score:583},{game:'freefire',name:'1,188 💎',price:590,score:1188},{game:'freefire',name:'2,420 💎',price:1140,score:2420},{game:'freefire',name:'6,160 💎',price:2800,score:6160},{game:'freefire',name:'عضوية اسبوعية',price:130,score:0},{game:'freefire',name:'عضوية شهرية',price:570,score:0},{game:'freefire',name:'تصريح بوياه',price:180,score:0}
  ];
  async function catalog(){
    try{const r=await fetch('/api/settings?ts='+Date.now(),{cache:'no-store'});const d=await r.json();const s=d.settings||{};
      const games=(Array.isArray(s.game_settings)&&s.game_settings.length?s.game_settings:DEFAULT_GAMES).filter(g=>g&&g.hidden!==true&&g.active!==false).map(g=>({key:g.key||g.id||norm(g.title),title:g.title||g.name||g.key,currency:g.currency||'',status:g.status||'available'}));
      const products=(Array.isArray(s.dynamic_products)&&s.dynamic_products.length?s.dynamic_products:DEFAULT_PRODUCTS).filter(p=>p&&p.name&&!p.hidden&&p.active!==false).map(p=>({game:p.game||p.game_key||'pubg',name:p.name||p.title,price:Number((p.sale_price&&Number(p.sale_price)>0)?p.sale_price:p.price||0),score:Number(p.uc||p.amount||p.value||0),status:p.status||'available'})).filter(p=>p.price>0);
      return {games,products};
    }catch(e){return {games:DEFAULT_GAMES,products:DEFAULT_PRODUCTS};}
  }
  function chooseGame(amount,games){localStorage.setItem('pharaoh_v182_budget',String(amount||0));return card('تمام معاك '+money(amount),'اختار اللعبة الأول، وبعدها هرشحلك نفس الميزانية عليها.',`<div class="pharaoh-v182-games">${games.filter(g=>g.status!=='hidden'&&g.status!=='disabled').map(g=>`<button type="button" data-v182-game="${esc(g.key)}"><b>${esc(g.title)}</b><small>${esc(g.currency||'متاح')}</small></button>`).join('')}</div><div class="pharaoh-v85-note">تقدر تكتب اسم اللعبة كمان: ببجي، فري فاير، تيك توك، روبلوكس...</div>`,[{t:'أرخص حاجة',a:'cheap'},{t:'أفضل قيمة',a:'best'}])}
  function combos(products,amount,mode){
    let list=products.filter(p=>p.price<=amount&&p.status!=='disabled'&&p.status!=='hidden').sort((a,b)=>mode==='cheap'?a.price-b.price:b.price-a.price||b.score-a.score);
    if(!list.length)return [];
    if(mode==='cheap')return list.slice(0,5).map(p=>({items:[p],total:p.price,left:amount-p.price}));
    const out=list.slice(0,5).map(p=>({items:[p],total:p.price,left:amount-p.price}));
    for(const first of list.slice(0,4)){let left=amount,items=[];for(const p of list){while(p.price<=left&&items.length<6){items.push(p);left-=p.price;if(p===first)break;}} if(items.length)out.push({items,total:amount-left,left});}
    return out.sort((a,b)=>a.left-b.left||b.total-a.total).slice(0,5);
  }
  async function recommend(game,amount,mode='best'){
    const c=await catalog(); amount=Number(amount||localStorage.getItem('pharaoh_v182_budget')||0)||0;
    const g=c.games.find(x=>x.key===game)||c.games.find(x=>norm(x.title).includes(norm(game)))||{key:game,title:game,currency:''};
    const ps=c.products.filter(p=>(p.game||'pubg')===g.key);
    if(!amount){bot(chooseGame(500,c.games));return;}
    if(!ps.length){bot(card(g.title,'اللعبة موجودة بس لسه مفيش منتجات ليها في لوحة التحكم.','',[{t:'اختار لعبة تانية',a:'budgetBack'}]));return;}
    const res=combos(ps,amount,mode);
    if(!res.length){bot(card(g.title+' - الميزانية قليلة','أقل منتج في اللعبة دي أعلى من '+money(amount),'',[{t:'اختار لعبة تانية',a:'budgetBack'},{t:'زود الميزانية',a:'budget'}]));return;}
    bot(card('ترشيحات '+g.title+' لميزانية '+money(amount),mode==='cheap'?'أرخص اختيارات متاحة':'أقرب اختيارات تصرف الميزانية صح',res.map((r,i)=>`<div class="pharaoh-v182-combo"><b>${i+1}) ${r.items.map(p=>esc(p.name)).join(' + ')}</b><small>الإجمالي: ${money(r.total)}${r.left?' | المتبقي: '+money(r.left):''}</small></div>`).join(''),[{t:'افتح منتجات '+g.title,a:'openGame',game:g.key,cls:'gold'},{t:'اختار لعبة تانية',a:'budgetBack'},{t:'أرخص حاجة',a:'cheap',game:g.key},{t:'أفضل قيمة',a:'best',game:g.key}]));
  }
  function gameOf(t){const s=norm(t),map={pubg:['ببجي','بابجي','pubg','uc','شدات'],freefire:['فري فاير','فرى فاير','free fire','freefire','جواهر'],tiktok:['تيك توك','tiktok'],roblox:['روبلوكس','roblox'],valorant:['فالورانت','valorant'],yalla_ludo:['يلا لودو','ludo'],last_war:['لاست وار','last war'],efootball:['ايفوتبول','بيس','efootball'],kingshot:['كينج شوت','king shot'],blood_mena:['blood','بلود'], '8ball':['بلياردو','8 ball','ball pool']}; for(const [k,a] of Object.entries(map)){if(a.some(x=>s.includes(norm(x))))return k} return ''}
  function looksBudget(t){return digits(t)&&/(معايا|معي|ميزانيه|ميزانية|فلوس|رشح|ترشيح|باقه|باقة|اشحن|شحن|عايز|عاوز|جنيه|جم|egp|ارخص|افضل|أفضل)/.test(norm(t));}
  async function handleText(t){
    const amount=digits(t)||Number(localStorage.getItem('pharaoh_v182_budget')||0)||0, game=gameOf(t);
    if(looksBudget(t)&&!game){const c=await catalog(); user(t); bot(chooseGame(digits(t),c.games)); return true;}
    if(game&&(amount||localStorage.getItem('pharaoh_v182_budget'))){user(t); await recommend(game,amount,/ارخص|أرخص|اقل|أقل/.test(t)?'cheap':'best'); return true;}
    if(/^(ابدأ|ابدا|عايز اشحن|اشحن|شحن جديد)$/.test(norm(t))){user(t); bot(startCard()); return true;}
    return false;
  }
  function startCard(){return card('اختار اللعبة اللي عايز تشحنها','دوس على اللعبة أو اكتب اسمها، ولو معاك ميزانية اكتب مثلًا: معايا 5000ج','<div class="pharaoh-v85-note">بعد اختيار اللعبة هفتحلك منتجاتها أو أرشحلك باقات مناسبة.</div>',[{t:'اختار من الألعاب',a:'games',cls:'gold'},{t:'رشحلي بميزانية',a:'budget'},{t:'تابع طلبي',a:'track',cls:'green'}])}
  function openGame(game){try{window.activeGame=game;if(typeof window.mobaShowView==='function')window.mobaShowView('game');else document.body.dataset.page='game'; if(typeof window.renderProducts==='function')window.renderProducts(); qs('#productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}}
  document.addEventListener('keydown',function(e){if(!(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'))return;const t=String(e.target.value||'').trim();if(!t)return; if(looksBudget(t)||gameOf(t)||/^(ابدأ|ابدا|عايز اشحن|اشحن|شحن جديد)$/.test(norm(t))){e.preventDefault();e.stopImmediatePropagation();e.target.value='';handleText(t);return false;}},true);
  document.addEventListener('click',function(e){
    const pay=e.target.closest&&e.target.closest('[data-v65-act="payment"],[data-v70-act="payment"],[data-v85-act="payment"]'); if(pay){body().dataset.v182PaymentAllowed='1'}
    const g=e.target.closest&&e.target.closest('[data-v182-game]'); if(g){e.preventDefault();e.stopImmediatePropagation();recommend(g.dataset.v182Game,Number(localStorage.getItem('pharaoh_v182_budget')||0)||500);return false;}
    const b=e.target.closest&&e.target.closest('[data-v182-act]'); if(!b)return; const a=b.dataset.v182Act, v=b.dataset.v, game=b.dataset.game;
    e.preventDefault();e.stopImmediatePropagation();
    if(a==='start')return bot(startCard());
    if(a==='budget')return bot(card('اكتب ميزانيتك','مثال: معايا 5000ج','',[{t:'500 جنيه',a:'budgetPick',v:500},{t:'1000 جنيه',a:'budgetPick',v:1000},{t:'5000 جنيه',a:'budgetPick',v:5000}]));
    if(a==='budgetPick')return catalog().then(c=>bot(chooseGame(Number(v||0),c.games)));
    if(a==='budgetBack')return catalog().then(c=>bot(chooseGame(Number(localStorage.getItem('pharaoh_v182_budget')||0)||500,c.games)));
    if(a==='cheap'||a==='best')return game?recommend(game,0,a):catalog().then(c=>bot(chooseGame(Number(localStorage.getItem('pharaoh_v182_budget')||0)||500,c.games)));
    if(a==='openGame')return openGame(game);
    if(a==='games'){try{qs('#gamesHome')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){} return bot('اختار اللعبة من قدامك، ولو معاك مبلغ اكتبه وأنا أرشحلك عليها 👑')}
    if(a==='track'||a==='check'){try{qs('#trackOrder')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){} return bot(card('متابعة الطلب','اكتب رقم الموبايل اللي عملت بيه الطلب في خانة المتابعة.','',[{t:'الدعم المباشر',href:SUPPORT}]))}
    if(a==='problem')return bot(card('حل مشكلة الطلب','اختار نوع المشكلة أو كلم الدعم مباشرة.','',[{t:'ID غلط',a:'badid'},{t:'سكرين غير واضح',a:'badshot'},{t:'الطلب اتأخر',a:'late'},{t:'الدعم المباشر',href:SUPPORT}]))
  },true);
  const mo=new MutationObserver(()=>pruneInitial());
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(pruneInitial,250); const b=body(); if(b)mo.observe(b,{childList:true,subtree:false});});
  setTimeout(pruneInitial,800);
  const st=document.createElement('style'); st.textContent=`.pharaoh-v182-games{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.pharaoh-v182-games button{border:1px solid rgba(39,216,255,.28);background:rgba(39,216,255,.08);color:#fff;border-radius:14px;padding:10px;text-align:right;font-weight:900;cursor:pointer}.pharaoh-v182-games button small{display:block;color:#ffe28a;margin-top:3px}.pharaoh-v182-combo{border:1px solid rgba(255,216,107,.25);background:rgba(255,216,107,.06);border-radius:14px;padding:10px;margin:8px 0}.pharaoh-v182-combo small{display:block;color:#ccecff;margin-top:4px}@media(max-width:520px){.pharaoh-v182-games{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
})();

/* moba-v183-pharaoh-multigame-budget-clean-selector */
(function(){
  if(window.__mobaV183PharaohMultiGameBudget)return;
  window.__mobaV183PharaohMultiGameBudget=true;
  const TTL=30*60*1000;
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function esc(t){return String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function norm(t){return String(t||'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).toLowerCase().trim()}
  function money(n){return Number(n||0).toLocaleString('en-US')+' جنيه'}
  function body(){return qs('#pharaohChatBody')}
  function add(type,html){const b=body(),ty=qs('#pharaohTyping');if(!b)return;const m=document.createElement('div');m.className='pharaoh-msg '+type+' pharaoh-v183-msg';m.innerHTML=html;if(ty&&ty.parentElement===b)b.insertBefore(m,ty);else b.appendChild(m);b.scrollTop=b.scrollHeight;cleanupNoiseSoon()}
  function bot(html){add('bot',html)}
  function user(t){add('user',esc(t))}
  function amountFrom(text){const s=norm(text);const nums=(s.match(/\d{2,6}/g)||[]).map(Number).filter(n=>n>=20&&n<=200000);if(!nums.length)return 0;if(/^(\d{2,6})\s*(ج|جنيه|جنية|جم|egp)?$/.test(s)||/(معايا|معي|معاي|ميزانيه|ميزانية|فلوس|رصيد|رشح|ترشيح|اقترح|باقه|باقة|اشحن|شحن|عايز|عاوز|اريد|ابغي|جنيه|جنية|جم|egp)/.test(s))return nums[nums.length-1];return 0}
  const aliasMap={
    pubg:['pubg','ببجي','بابجي','بوبجي','شدات','uc','يوسي'],
    freefire:['free fire','freefire','فري فاير','فرى فاير','فاير','جواهر','diamonds'],
    tiktok:['tiktok','تيك توك','تيكتوك','عملات تيك'],
    roblox:['roblox','روبلوكس','روبوكس','robux'],
    valorant:['valorant','فالورانت','فالورنت','vp'],
    yallaludo:['yalla ludo','yalla','يلا لودو','لودو'],
    lastwar:['last war','لاست وار','لاست'],
    efootball:['efootball','pes','بيس','اي فوتبول','e-football'],
    bloodstrike:['blood strike','بلود سترايك'],
    kingshot:['king shot','كينج شوت'],
    ballpool:['8 ball','ball pool','بلياردو','بلياردوا']
  };
  const pretty={pubg:'PUBG Mobile',freefire:'Free Fire',tiktok:'TikTok',roblox:'Roblox',valorant:'Valorant',yallaludo:'Yalla Ludo',lastwar:'Last War',efootball:'eFootball',bloodstrike:'Blood Strike',kingshot:'King Shot',ballpool:'8 Ball Pool'};
  const currency={pubg:'UC',freefire:'💎',tiktok:'Coins',roblox:'Robux',valorant:'VP',yallaludo:'Coins',lastwar:'Top Up',efootball:'Coins',bloodstrike:'Top Up',kingshot:'Top Up',ballpool:'Coins'};
  function canonicalGame(g){
    const s=norm(g).replace(/[\s_\-]+/g,'');
    for(const [key,arr] of Object.entries(aliasMap)){
      if(key===s)return key;
      if(arr.some(a=>s.includes(norm(a).replace(/[\s_\-]+/g,''))||norm(a).replace(/[\s_\-]+/g,'').includes(s)))return key;
    }
    if(s.includes('pubg'))return 'pubg';
    if(s.includes('free'))return 'freefire';
    return s||'pubg';
  }
  function detectGame(text){
    const s=norm(text);
    for(const [key,arr] of Object.entries(aliasMap)){
      if(arr.some(a=>s.includes(norm(a))))return key;
    }
    return '';
  }
  function allProducts(){
    const src=window.mobaProducts||{};
    const out=[];
    Object.keys(src).forEach(cat=>{(src[cat]||[]).forEach((p,i)=>{if(!p||p.hidden||p.active===false)return;out.push({...p,cat,i,price:Number(p.price||p.sale_price||0),game:canonicalGame(p.game||p.game_key||cat||'pubg')})})});
    return out.filter(p=>p.price>0);
  }
  function gameList(){
    const map=new Map();
    try{(window.mobaGameSettings||[]).forEach(g=>{const k=canonicalGame(g.key||g.game||g.code||g.name); if(k)map.set(k,{key:k,name:g.name||pretty[k]||k,currency:g.currency||currency[k]||''})})}catch(e){}
    allProducts().forEach(p=>{const k=canonicalGame(p.game||p.cat); if(k&&!map.has(k))map.set(k,{key:k,name:pretty[k]||p.game||k,currency:currency[k]||''})});
    ['pubg','freefire','tiktok','roblox','valorant','yallaludo','lastwar','efootball'].forEach(k=>{if(!map.has(k))map.set(k,{key:k,name:pretty[k],currency:currency[k]})});
    return [...map.values()].filter(g=>g&&g.key);
  }
  function saveBudget(amount){try{localStorage.setItem('pharaoh_pending_budget_v183',JSON.stringify({amount:Number(amount),time:Date.now()}))}catch(e){} window.__pharaohPendingBudgetV183=Number(amount)}
  function getBudget(){try{const x=JSON.parse(localStorage.getItem('pharaoh_pending_budget_v183')||'{}'); if(x.amount&&Date.now()-Number(x.time||0)<TTL)return Number(x.amount)}catch(e){} return Number(window.__pharaohPendingBudgetV183||0)}
  function cleanupBudgetNoise(){
    const b=body(); if(!b)return;
    qsa('.pharaoh-msg.bot',b).forEach(m=>{
      if(m.classList.contains('pharaoh-v183-msg'))return;
      const txt=(m.textContent||'').replace(/\s+/g,' ');
      if(/فهمت (إن |ان )?معاك|فهمت ميزانيتك|هختارلك أفضل باقات|أفضل ترشيحات لميزانية|اختار ترشيح مناسب|دي أفضل تركيبات تحت/.test(txt))m.remove();
    });
  }
  function cleanupNoiseSoon(){cleanupBudgetNoise();setTimeout(cleanupBudgetNoise,80);setTimeout(cleanupBudgetNoise,250);setTimeout(cleanupBudgetNoise,650)}
  function gameSelector(amount){
    saveBudget(amount);cleanupBudgetNoise();
    const games=gameList();
    return `<div class="pharaoh-v85-card pharaoh-v183-selector"><b>معاك ${money(amount)} 👑</b><small>تحب تشحن انهي لعبة؟ اختار لعبة من المتاح، أو اكتب اسمها في الشات زي: ببجي / فري فاير / تيك توك.</small><div class="pharaoh-v183-games">${games.map((g,i)=>`<button type="button" class="${i===0?'gold':''}" data-v183-game="${esc(g.key)}">${esc(g.name)}${g.currency?` <span>${esc(g.currency)}</span>`:''}</button>`).join('')}</div><div class="pharaoh-v85-note">بعد ما تختار اللعبة هرشحلك باقات مناسبة لنفس الميزانية من غير ما أخلط ألعاب ببعض.</div></div>`;
  }
  function gameProducts(game){
    const g=canonicalGame(game);
    return allProducts().filter(p=>canonicalGame(p.game||p.cat)===g).sort((a,b)=>b.price-a.price);
  }
  function buildCombosForBudget(game,amount,mode){
    const products=gameProducts(game).filter(p=>p.price>0 && p.price<=amount).sort((a,b)=>Number(a.price)-Number(b.price));
    if(!products.length)return [];
    const out=[]; const seen=new Set();
    function addCombo(items){
      const total=items.reduce((sum,p)=>sum+Number(p.price||0),0);
      if(total<=0 || total>amount)return;
      const key=items.map(p=>(p.cat||'')+'|'+(p.name||p.title)+'|'+p.price).sort().join(' + ');
      if(seen.has(key))return; seen.add(key);
      const score=items.reduce((sum,p)=>sum+Number(p.uc||p.score||0),0);
      out.push({items,total,left:amount-total,score});
    }
    products.forEach(p=>{
      addCombo([p]);
      const max=Math.min(12,Math.floor(amount/Number(p.price||1)));
      for(let q=2;q<=max;q++) addCombo(Array(q).fill(p));
    });
    for(let i=0;i<products.length;i++)for(let j=i;j<products.length;j++)for(let k=j;k<products.length;k++){
      addCombo([products[i],products[j]]);
      addCombo([products[i],products[j],products[k]]);
    }
    const byType=new Map();
    out.sort((a,b)=>a.left-b.left||b.total-a.total||b.score-a.score);
    for(const c of out){const type=c.items.map(p=>p.cat||p.type||'x').sort().join('|'); if(!byType.has(type))byType.set(type,c);}
    const diverse=[...byType.values()].sort((a,b)=>a.left-b.left||b.total-a.total||b.score-a.score);
    const final=[...diverse,...out].filter((c,i,arr)=>arr.findIndex(x=>x.items.map(p=>p.name).join('+')===c.items.map(p=>p.name).join('+')&&x.total===c.total)===i);
    if(mode==='cheap')return products.slice(0,3).map(p=>({items:[p],total:p.price,left:amount-p.price,score:Number(p.uc||0)}));
    if(mode==='value')return final.sort((a,b)=>(b.score/Math.max(1,b.total))-(a.score/Math.max(1,a.total))||a.left-b.left).slice(0,3);
    return final.sort((a,b)=>a.left-b.left||b.total-a.total||b.score-a.score).slice(0,3);
  }
  function comboTitle(c){
    const counts=new Map();
    c.items.forEach(p=>{const n=p.name||p.title||'منتج';counts.set(n,(counts.get(n)||0)+1)});
    return [...counts.entries()].map(([n,q])=>q>1?`${q}× ${n}`:n).join(' + ');
  }
  function recommendGame(game,amount,mode){
    game=canonicalGame(game); amount=Number(amount||getBudget()||0); if(!amount)return gameSelector(500);
    saveBudget(amount);cleanupBudgetNoise();
    const name=pretty[game]||game; const cur=currency[game]||'';
    const picks=buildCombosForBudget(game,amount,mode);
    if(!picks.length){
      const cheapest=gameProducts(game).sort((a,b)=>a.price-b.price)[0];
      return `<div class="pharaoh-v85-card pharaoh-v183-rec"><b>${name}</b><small>الميزانية ${money(amount)} أقل من أقل منتج متاح${cheapest?`، أقل حاجة تقريبا ${money(cheapest.price)}`:''}.</small><div class="pharaoh-v85-actions"><button type="button" class="gold" data-v183-change-game>اختار لعبة تانية</button><button type="button" data-v183-open-game="${esc(game)}">افتح منتجات ${esc(name)}</button></div></div>`;
    }
    return `<div class="pharaoh-v85-card pharaoh-v183-rec"><b>أفضل 3 ترشيحات ${esc(name)} لميزانية ${money(amount)}</b><small>الاختيارات دي أقرب حاجة للمبلغ، وممكن تجمع منتجين أو أكثر من نفس اللعبة عشان تستغل الميزانية صح.</small>${picks.map((c,i)=>`<div class="pharaoh-v90-combo"><b>${i+1}) ${esc(comboTitle(c))}</b><small>الإجمالي: <strong>${money(c.total)}</strong>${c.left?` | المتبقي: ${money(c.left)}`:' | بدون متبقي'}${c.score?` | القيمة: ${Number(c.score).toLocaleString('en-US')} ${esc(cur)}`:''}</small><span class="pick-hint">افتح منتجات اللعبة واختار نفس الباقة أو المجموعة.</span></div>`).join('')}<div class="pharaoh-v85-actions"><button type="button" class="gold" data-v183-open-game="${esc(game)}">افتح منتجات ${esc(name)}</button><button type="button" data-v183-mode="cheap" data-game="${esc(game)}">أرخص حاجة</button><button type="button" data-v183-mode="value" data-game="${esc(game)}">أفضل قيمة</button><button type="button" data-v183-change-game>اختار لعبة تانية</button></div></div>`;
  }
  function openGame(game){
    try{if(typeof window.mobaShowView==='function')window.mobaShowView('game');else location.hash='#productsSection';}catch(e){location.hash='#productsSection'}
    const g=canonicalGame(game);
    setTimeout(()=>{
      try{
        const tabs=qsa('.tab');
        const candidates=gameProducts(g).map(p=>p.cat).filter(Boolean);
        const target=tabs.find(t=>candidates.includes(t.dataset.cat)||norm(t.textContent).includes(norm(pretty[g]||g)));
        (target||tabs[0])?.click();
        qs('#productsSection')?.scrollIntoView({behavior:'smooth',block:'start'});
      }catch(e){}
    },250);
  }
  function process(text,showUser){
    const raw=String(text||'').trim(); if(!raw)return false;
    const amount=amountFrom(raw); const game=detectGame(raw); const pending=getBudget();
    if(amount){ if(showUser)user(raw); bot(gameSelector(amount)); return true; }
    if(game&&pending){ if(showUser)user(raw); bot(recommendGame(game,pending)); return true; }
    return false;
  }
  function patchApi(){
    const api=window.__pharaohV91;
    if(api&&!api.__v183MultiGame){
      api.__v183MultiGame=true;
      const oldStart=api.start;
      api.start=function(text){const amount=amountFrom(text);if(amount){api.state=api.state||{};api.state.active=false;bot(gameSelector(amount));return true}return oldStart.apply(this,arguments)};
      const oldConsume=api.consumeText;
      api.consumeText=function(text){if(process(text,false))return true;return oldConsume.apply(this,arguments)};
    }
    const oldPriority=window.__pharaohPriorityTextV97;
    if(!window.__pharaohPriorityTextV183){
      window.__pharaohPriorityTextV183=true;
      window.__pharaohPriorityTextV97=function(text){if(process(text,true))return true;return typeof oldPriority==='function'?oldPriority(text):false};
    }
    const oldForce=window.__pharaohForceSendV69;
    if(!window.__pharaohForceSendV183){
      window.__pharaohForceSendV183=true;
      window.__pharaohForceSendV69=function(){const inp=qs('#pharaohChatInput');const text=inp&&inp.value.trim();if(text&&process(text,true)){inp.value='';return}if(typeof oldForce==='function')return oldForce()};
    }
  }
  document.addEventListener('click',function(e){
    const g=e.target.closest&&e.target.closest('[data-v183-game]');
    if(g){e.preventDefault();e.stopImmediatePropagation();bot(recommendGame(g.dataset.v183Game,getBudget()));return false}
    const mode=e.target.closest&&e.target.closest('[data-v183-mode]');
    if(mode){e.preventDefault();e.stopImmediatePropagation();bot(recommendGame(mode.dataset.game,getBudget(),mode.dataset.v183Mode));return false}
    const ch=e.target.closest&&e.target.closest('[data-v183-change-game]');
    if(ch){e.preventDefault();e.stopImmediatePropagation();bot(gameSelector(getBudget()||500));return false}
    const op=e.target.closest&&e.target.closest('[data-v183-open-game]');
    if(op){e.preventDefault();e.stopImmediatePropagation();openGame(op.dataset.v183OpenGame);bot(`<div class="pharaoh-v85-card"><b>فتحتلك منتجات ${esc(pretty[canonicalGame(op.dataset.v183OpenGame)]||op.dataset.v183OpenGame)}</b><small>اختار المنتج المناسب وكمل الطلب من الكارت.</small></div>`);return false}
  },true);
  document.addEventListener('keydown',function(e){if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'){patchApi();const text=e.target.value.trim();if(process(text,true)){e.target.value='';e.preventDefault();e.stopImmediatePropagation();return false}}},true);
  document.addEventListener('click',function(e){const send=e.target.closest&&e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)');if(send){patchApi();const inp=qs('#pharaohChatInput'),text=inp&&inp.value.trim();if(process(text,true)){inp.value='';e.preventDefault();e.stopImmediatePropagation();return false}}},true);
  patchApi();
  document.addEventListener('DOMContentLoaded',patchApi);
  setInterval(patchApi,700);
})();


/* moba-v186-pharaoh-clickable-budget-and-clean-recommendations */
(function(){
  if(window.__mobaV186PharaohBudgetPick)return; window.__mobaV186PharaohBudgetPick=true;
  const TTL=1000*60*20;
  const pretty={pubg:'PUBG Mobile',freefire:'Free Fire',roblox:'Roblox',tiktok:'TikTok',valorant:'Valorant',yalla_ludo:'Yalla Ludo',last_war:'Last War',efootball:'eFootball',blood_global:'Blood Strike Global',blood_mena:'Blood Strike MENA',kingshot:'King Shot','8ball':'8 Ball Pool',goal_battle:'Goal Battle'};
  const currency={pubg:'UC',freefire:'💎',roblox:'Robux',tiktok:'Coins',valorant:'VP',yalla_ludo:'Diamonds',last_war:'Coins',efootball:'Coins',blood_global:'Gold',blood_mena:'Gold',kingshot:'Top Up','8ball':'Coins',goal_battle:'Top Up'};
  const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const qs=(s,r=document)=>r.querySelector(s); const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const norm=t=>String(t||'').toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  const money=n=>Number(n||0).toLocaleString('ar-EG')+' جنيه';
  function body(){return qs('#pharaohChatBody')||qs('.pharaoh-chat-body')||qs('#pharaohChatPanel')}
  function bot(html){const b=body(); if(!b)return; const m=document.createElement('div'); m.className='pharaoh-msg bot pharaoh-v186-msg'; m.innerHTML=html; const ty=qs('#pharaohTyping',b); if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m); b.scrollTop=b.scrollHeight; cleanupNoise();}
  function user(t){const b=body(); if(!b)return; const m=document.createElement('div'); m.className='pharaoh-msg user pharaoh-v186-msg'; m.textContent=String(t||''); const ty=qs('#pharaohTyping',b); if(ty&&ty.parentElement===b)b.insertBefore(m,ty); else b.appendChild(m); b.scrollTop=b.scrollHeight;}
  function amountFrom(t){const s=String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); const nums=s.match(/\d+/g)||[]; return nums.length?Number(nums[nums.length-1]):0}
  function isBudgetText(t){const a=amountFrom(t); return a && /(معايا|معي|ميزانيه|ميزانية|فلوس|رشح|ترشيح|باقه|باقة|اشحن|شحن|عايز|عاوز|جنيه|ج|egp)/i.test(norm(t));}
  function canonGame(g){let s=norm(g); const map={pubg:['pubg','ببجي','بابجي','شدات','uc'],freefire:['freefire','free fire','فري فاير','فرى فاير','جواهر'],roblox:['roblox','روبلوكس'],tiktok:['tiktok','تيك توك'],valorant:['valorant','فالورانت'],yalla_ludo:['يلا لودو','ludo','لودو'],last_war:['last war','لاست وار'],efootball:['efootball','ايفوتبول','بيس'],blood_global:['blood strike global','بلود سترايك جلوبال'],blood_mena:['blood strike mena','بلود سترايك مينا'],kingshot:['king shot','كينج شوت'],'8ball':['8 ball','بلياردو','ball pool'],goal_battle:['goal battle','جول باتل']}; for(const [k,arr] of Object.entries(map)){if(arr.some(x=>s.includes(norm(x))))return k} return ''}
  function saveBudget(a){try{sessionStorage.setItem('pharaoh_budget_v186',JSON.stringify({a:Number(a),t:Date.now()}));localStorage.setItem('pharaoh_pending_budget_v183',JSON.stringify({amount:Number(a),time:Date.now()}));}catch(e){} window.__pharaohBudgetV186=Number(a)}
  function getBudget(){try{const x=JSON.parse(sessionStorage.getItem('pharaoh_budget_v186')||'{}'); if(x.a&&Date.now()-Number(x.t||0)<TTL)return Number(x.a)}catch(e){} return Number(window.__pharaohBudgetV186||0)}
  function rawProducts(){
    const arr=[];
    try{if(Array.isArray(window.mobaPharaohDynamicProducts))arr.push(...window.mobaPharaohDynamicProducts)}catch(e){}
    try{if(window.mobaProducts&&typeof window.mobaProducts==='object')Object.entries(window.mobaProducts).forEach(([cat,list])=>(list||[]).forEach(p=>arr.push({...p,cat:p.cat||cat})))}catch(e){}
    const def=[
      {game:'pubg',cat:'uc',name:'60 UC',price:50,uc:60,type:'شدات PUBG'},{game:'pubg',cat:'uc',name:'325 UC',price:235,uc:325,type:'شدات PUBG'},{game:'pubg',cat:'uc',name:'660 UC',price:435,uc:660,type:'شدات PUBG'},{game:'pubg',cat:'uc',name:'1800 UC',price:1120,uc:1800,type:'شدات PUBG'},{game:'pubg',cat:'uc',name:'3850 UC',price:2170,uc:3850,type:'شدات PUBG'},{game:'pubg',cat:'uc',name:'8100 UC',price:4350,uc:8100,type:'شدات PUBG'},
      {game:'freefire',cat:'freefire_diamonds',name:'50 💎',price:40,uc:50,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_diamonds',name:'100 💎',price:70,uc:100,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_diamonds',name:'210 💎',price:130,uc:210,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_diamonds',name:'310 💎',price:180,uc:310,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_diamonds',name:'583 💎',price:300,uc:583,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_diamonds',name:'1,188 💎',price:590,uc:1188,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_diamonds',name:'2,420 💎',price:1140,uc:2420,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_diamonds',name:'6,160 💎',price:2800,uc:6160,type:'جواهر فري فاير'},{game:'freefire',cat:'freefire_memberships',name:'عضوية اسبوعية',price:130,uc:0,type:'عضوية'},{game:'freefire',cat:'freefire_memberships',name:'عضوية شهرية',price:570,uc:0,type:'عضوية'},{game:'freefire',cat:'freefire_memberships',name:'تصريح بوياه',price:180,uc:0,type:'تصريح'}
    ];
    if(!arr.length)arr.push(...def);
    const seen=new Set(), out=[];
    arr.forEach(p=>{const game=canonGame(p.game||p.category||p.cat)||String(p.game||'pubg'); const price=Number((p.sale_price&&p.sale_price<p.price)?p.sale_price:p.price||0); const name=String(p.name||p.product||p.title||'').trim(); if(!name||!price||p.hidden||p.active===false||['disabled','unavailable','soon'].includes(String(p.status||'available')))return; const key=game+'|'+(p.cat||'')+'|'+norm(name)+'|'+price; if(seen.has(key))return; seen.add(key); out.push({...p,game,price,name,cat:p.cat||'default',uc:Number(p.uc||p.value||0),type:p.type||p.cat||'',currency:p.currency||currency[game]||''});});
    return out;
  }
  function gameList(){const games=new Map(); rawProducts().forEach(p=>games.set(p.game,{key:p.game,name:pretty[p.game]||p.game,currency:currency[p.game]||p.currency||''})); ['pubg','freefire','roblox','tiktok','valorant','yalla_ludo','last_war','efootball'].forEach(k=>{if(!games.has(k))games.set(k,{key:k,name:pretty[k]||k,currency:currency[k]||''})}); return [...games.values()];}
  function gameSelector(amount){saveBudget(amount);cleanupNoise(); const games=gameList(); return `<div class="pharaoh-v85-card pharaoh-v186-selector"><b>معاك ${money(amount)} 👑</b><small>تحب تشحن انهي لعبة؟ اختار لعبة أو اكتب اسمها، وبعدها هرشحلك 3 اختيارات قريبة من ميزانيتك.</small><div class="pharaoh-v181-games">${games.map(g=>`<button type="button" data-v186-game="${esc(g.key)}"><b>${esc(g.name)}</b><small>${esc(g.currency||'متاح')}</small></button>`).join('')}</div></div>`}
  function productsFor(game){game=canonGame(game)||game; return rawProducts().filter(p=>p.game===game&&p.price>0).sort((a,b)=>a.price-b.price)}
  function comboKey(items){const m=new Map();items.forEach(p=>m.set(p.name+'|'+p.price,(m.get(p.name+'|'+p.price)||0)+1));return [...m.entries()].sort().map(([k,q])=>q+'x'+k).join('+')}
  function comboTitle(items){const m=new Map();items.forEach(p=>m.set(p.name,(m.get(p.name)||0)+1));return [...m.entries()].map(([n,q])=>q>1?`${q}× ${n}`:n).join(' + ')}
  function buildCombos(game,amount,mode){
    const ps=productsFor(game).filter(p=>p.price<=amount); if(!ps.length)return [];
    const out=[], seen=new Set();
    function add(items){const total=items.reduce((s,p)=>s+p.price,0); if(!total||total>amount)return; const key=comboKey(items); if(seen.has(key))return; seen.add(key); const value=items.reduce((s,p)=>s+Number(p.uc||0),0); out.push({items,total,left:amount-total,value});}
    ps.forEach(p=>{add([p]); const max=Math.min(20,Math.floor(amount/p.price)); for(let q=2;q<=max;q++)add(Array(q).fill(p));});
    for(let i=0;i<ps.length;i++)for(let j=i;j<ps.length;j++){add([ps[i],ps[j]]); for(let k=j;k<ps.length;k++)add([ps[i],ps[j],ps[k]]);}
    for(const a of ps)for(const b of ps)for(const c of ps)for(const d of ps){const sum=a.price+b.price+c.price+d.price; if(sum<=amount && amount-sum<Math.max(80,amount*.08))add([a,b,c,d]);}
    let sorted=out;
    if(mode==='cheap')sorted=out.sort((a,b)=>a.total-b.total||a.left-b.left);
    else if(mode==='value')sorted=out.sort((a,b)=>(b.value/Math.max(1,b.total))-(a.value/Math.max(1,a.total))||a.left-b.left);
    else sorted=out.sort((a,b)=>a.left-b.left||b.total-a.total||b.value-a.value);
    return sorted.slice(0,3);
  }
  function recCard(game,amount,mode){game=canonGame(game)||game; amount=Number(amount||getBudget()||0)||0; saveBudget(amount); cleanupNoise(); const name=pretty[game]||game, cur=currency[game]||''; const picks=buildCombos(game,amount,mode); window.__pharaohV186Combos=picks.map(c=>({game,amount,...c}));
    if(!picks.length){const ch=productsFor(game)[0];return `<div class="pharaoh-v85-card pharaoh-v186-rec"><b>${esc(name)}</b><small>الميزانية ${money(amount)} أقل من أقل منتج${ch?`، أقل حاجة ${money(ch.price)}`:''}.</small><div class="pharaoh-v85-actions"><button type="button" data-v186-change-game>اختار لعبة تانية</button><button type="button" data-v186-open-game="${esc(game)}">افتح منتجات اللعبة</button></div></div>`;}
    return `<div class="pharaoh-v85-card pharaoh-v186-rec"><b>أفضل 3 ترشيحات ${esc(name)} لميزانية ${money(amount)}</b><small>دوس على أي ترشيح عشان أبدأ معاك الطلب مباشرة. الترشيحات أقرب حاجة للمبلغ وممكن تجمع نفس المنتج أكثر من مرة.</small>${picks.map((c,i)=>`<button type="button" class="pharaoh-v186-combo" data-v186-pick="${i}"><b>${i+1}) ${esc(comboTitle(c.items))}</b><small>الإجمالي: <strong>${money(c.total)}</strong>${c.left?` | المتبقي: ${money(c.left)}`:' | بدون متبقي'}${c.value?` | القيمة: ${Number(c.value).toLocaleString('en-US')} ${esc(cur)}`:''}</small><span>دوس هنا لاختيار الترشيح</span></button>`).join('')}<div class="pharaoh-v85-actions"><button type="button" data-v186-open-game="${esc(game)}">افتح منتجات ${esc(name)}</button><button type="button" data-v186-mode="cheap" data-game="${esc(game)}">أرخص حاجة</button><button type="button" data-v186-mode="value" data-game="${esc(game)}">أفضل قيمة</button><button type="button" data-v186-change-game>اختار لعبة تانية</button></div></div>`;
  }
  function cleanupNoise(){const b=body(); if(!b)return; qsa('.pharaoh-msg.bot',b).forEach(m=>{if(m.classList.contains('pharaoh-v186-msg'))return; const tx=(m.textContent||'').replace(/\s+/g,' '); if(/فهمتلك المنتج ده|فهمتلك المنتج دا|لقيتلك المنتج ده|لقيتلك المنتج دا|اخترتلك المنتج ده|اختار المنتج المناسب|freefire_diamonds/.test(tx) && /افتح المنتجات|اختار المنتج|منتجات/.test(tx))m.remove(); if(/فهمت (إن |ان )?معاك|فهمت ميزانيتك|أفضل ترشيحات لميزانية|اختار ترشيح مناسب/.test(tx))m.remove();});}
  function startCombo(i){const c=(window.__pharaohV186Combos||[])[Number(i)]; if(!c)return; cleanupNoise(); const api=window.__pharaohV91; const items=c.items.map(p=>({product:p.name,type:p.type||p.cat||'',price:p.price,uc:Number(p.uc||0),qty:1,qtyTotal:1,ucTotal:Number(p.uc||0),game:p.game,currency:p.currency||currency[p.game]||'',cat:p.cat,noQty:!!p.noQty}));
    if(api){api.state=api.state||{}; api.state.active=true; api.state.startedAt=Date.now(); api.state.step='id'; api.state.items=items;}
    bot(`<div class="pharaoh-v85-card"><b>تمام اخترت الترشيح ✅</b><small>${esc(comboTitle(c.items))}<br>الإجمالي: ${money(c.total)}. هكمل معاك خطوات الطلب دلوقتي.</small><div class="pharaoh-v85-note">اكتب ID الحساب الخاص باللعبة.</div></div>`);
    try{window.__mobaV109SingleFlow&&document.querySelector('#pharaohChatInput')?.focus()}catch(e){}
    setTimeout(()=>{try{const input=qs('#pharaohChatInput'); if(input)input.placeholder='اكتب ID الحساب هنا...'}catch(e){}},50);
  }
  function openGame(game){game=canonGame(game)||game; window.activeGame=game; const p=productsFor(game)[0]; if(p&&p.cat)window.activeCat=p.cat; try{if(typeof window.mobaShowView==='function')window.mobaShowView('game');else document.getElementById('productsSection')?.scrollIntoView({behavior:'smooth'}); if(typeof window.renderProducts==='function')setTimeout(()=>window.renderProducts(),70);}catch(e){} }
  function process(text,withUser){const raw=String(text||'').trim(); if(!raw)return false; const amount=amountFrom(raw), game=canonGame(raw), pending=getBudget(); if(isBudgetText(raw)){if(withUser)user(raw); bot(gameSelector(amount)); return true;} if(game&&pending){if(withUser)user(raw); bot(recCard(game,pending)); return true;} return false;}
  window.addEventListener('keydown',function(e){if(e.target&&e.target.id==='pharaohChatInput'&&e.key==='Enter'){const text=e.target.value.trim(); if(process(text,true)){e.target.value='';e.preventDefault();e.stopImmediatePropagation();return false}}},true);
  window.addEventListener('click',function(e){
    const send=e.target.closest&&e.target.closest('#pharaohSendBtn,#pharaohChatForm button:not(#pharaohMicBtn)'); if(send){const inp=qs('#pharaohChatInput'),text=inp&&inp.value.trim(); if(text&&process(text,true)){inp.value='';e.preventDefault();e.stopImmediatePropagation();return false}}
    const g=e.target.closest&&e.target.closest('[data-v186-game]'); if(g){e.preventDefault();e.stopImmediatePropagation();bot(recCard(g.dataset.v186Game,getBudget()));return false;}
    const pick=e.target.closest&&e.target.closest('[data-v186-pick]'); if(pick){e.preventDefault();e.stopImmediatePropagation();startCombo(pick.dataset.v186Pick);return false;}
    const ch=e.target.closest&&e.target.closest('[data-v186-change-game]'); if(ch){e.preventDefault();e.stopImmediatePropagation();bot(gameSelector(getBudget()||500));return false;}
    const mode=e.target.closest&&e.target.closest('[data-v186-mode]'); if(mode){e.preventDefault();e.stopImmediatePropagation();bot(recCard(mode.dataset.game,getBudget(),mode.dataset.v186Mode));return false;}
    const op=e.target.closest&&e.target.closest('[data-v186-open-game]'); if(op){e.preventDefault();e.stopImmediatePropagation();openGame(op.dataset.v186OpenGame);bot(`<div class="pharaoh-v85-card"><b>فتحتلك منتجات ${esc(pretty[canonGame(op.dataset.v186OpenGame)]||'اللعبة')}</b><small>اختار المنتج أو ارجع للترشيحات لو عايز أبدأهولك مباشرة.</small></div>`);return false;}
  },true);
  setInterval(cleanupNoise,900);
  const st=document.createElement('style'); st.textContent=`.pharaoh-v186-combo{display:block;width:100%;text-align:right;border:1px solid rgba(255,216,107,.28);background:rgba(255,216,107,.06);color:#fff;border-radius:14px;padding:10px;margin:8px 0;cursor:pointer}.pharaoh-v186-combo:hover{border-color:rgba(255,216,107,.7);transform:translateY(-1px)}.pharaoh-v186-combo b,.pharaoh-v186-combo small,.pharaoh-v186-combo span{display:block}.pharaoh-v186-combo span{color:#ffe28a;font-size:12px;margin-top:4px}.pharaoh-v186-selector .pharaoh-v181-games button{cursor:pointer}`; document.head.appendChild(st);
})();
