import {normalizeDigits} from './interface-utils.js';

export function mountPlayerLookup(dialog,game){
  if(game.slug!=='pubg')return ()=>{};
  dialog.classList.add('pubg-quick-dialog');
  const idInput=dialog.querySelector('[name=accountId]'),nameInput=dialog.querySelector('[name=accountName]'),submit=dialog.querySelector('[type=submit]');
  idInput.inputMode='numeric';idInput.dir='ltr';idInput.placeholder='اكتب PUBG ID';idInput.maxLength=15;
  nameInput.closest('.field').hidden=true;nameInput.type='hidden';nameInput.value='';nameInput.readOnly=true;
  const block=document.createElement('div');block.className='player-identity';block.setAttribute('role','status');block.setAttribute('aria-live','polite');
  block.innerHTML='<span class="player-identity-icon" aria-hidden="true">◇</span><div><small>اسم اللاعب</small><strong data-player-name>هيظهر تلقائيًا بعد كتابة الـID</strong></div>';
  idInput.after(block);
  const name=block.querySelector('[data-player-name]');name.dir='auto';
  let timer,controller,version=0,verifiedId='',active=true,pending=false;
  const reset=()=>{verifiedId='';nameInput.value='';submit.disabled=true;submit.textContent='إضافة للسلة';block.dataset.state='idle';};
  async function lookup(){
    clearTimeout(timer);timer=null;controller?.abort();pending=false;const seq=++version;
    const id=normalizeDigits(idInput.value).trim();reset();
    if(!/^\d{5,15}$/.test(id)){name.textContent='اكتب الـID كاملًا بالأرقام';return;}
    controller=new AbortController();pending=true;block.dataset.state='loading';name.textContent='جاري جلب اسم اللاعب…';submit.textContent='جاري البحث…';
    try{
      const response=await fetch('/api/public?action=player-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id}),signal:controller.signal});
      const data=await response.json();if(!active||seq!==version)return;
      if(!response.ok||!data.ok){block.dataset.state='error';name.textContent=data.code==='invalid_id'?'الـID غير صحيح، راجع الرقم':data.code==='rate_limited'?'محاولات كتير، حاول بعد دقيقة':'تعذر جلب الاسم. عدّل الـID وحاول تاني.';return;}
      if(data.id!==id||typeof data.nickname!=='string'||data.nickname.trim().length<2)throw new Error('Invalid response');
      nameInput.value=data.nickname;verifiedId=id;name.textContent=data.nickname;block.dataset.state='ready';submit.disabled=false;
    }catch(error){if(active&&seq===version&&error.name!=='AbortError'){block.dataset.state='error';name.textContent='تعذر جلب الاسم. عدّل الـID وحاول تاني.';}}
    finally{if(seq===version){pending=false;submit.textContent='إضافة للسلة';}}
  }
  const changed=()=>{
    clearTimeout(timer);timer=null;controller?.abort();++version;pending=false;reset();
    name.textContent='هيظهر تلقائيًا بعد كتابة الـID';
    if(/^\d{5,15}$/.test(normalizeDigits(idInput.value).trim()))timer=setTimeout(lookup,500);
  };
  idInput.addEventListener('input',changed);
  idInput.addEventListener('blur',()=>{if(timer)lookup();});
  dialog.querySelector('form').addEventListener('submit',event=>{
    if(pending||timer||!verifiedId||verifiedId!==normalizeDigits(idInput.value).trim()){
      event.preventDefault();event.stopImmediatePropagation();if(timer)lookup();
    }
  },true);
  reset();if(idInput.value)changed();
  return ()=>{active=false;clearTimeout(timer);controller?.abort();};
}
