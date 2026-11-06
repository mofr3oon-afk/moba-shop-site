import {normalizeDigits} from './interface-utils.js';

export function mountPlayerLookup(dialog,game){
  if(game.slug!=='pubg')return ()=>{};
  const idInput=dialog.querySelector('[name=accountId]'),nameInput=dialog.querySelector('[name=accountName]');
  idInput.inputMode='numeric';
  const block=document.createElement('div');block.className='player-lookup';
  block.innerHTML='<p role="status" aria-live="polite" data-player-status>اكتب PUBG ID لعرض اسم اللاعب تلقائيًا. يتم التحقق عبر خدمة GoPay الخارجية.</p><label hidden data-player-confirm><input type="checkbox"> أؤكد إن ده الحساب المقصود للشحن</label><button type="button" class="ghost-btn" data-player-retry>تحقق من الاسم</button>';
  dialog.querySelector('.fields-grid').after(block);
  const status=block.querySelector('[data-player-status]'),label=block.querySelector('label'),confirm=block.querySelector('input');
  let timer,controller,version=0,verifiedId='',active=true,pending=false;
  const reset=()=>{verifiedId='';confirm.checked=false;confirm.required=false;confirm.setCustomValidity('');label.hidden=true;nameInput.readOnly=false;};
  confirm.addEventListener('change',()=>confirm.setCustomValidity(confirm.checked?'':'أكد إن ده الحساب المقصود للشحن.'));
  async function lookup(){
    clearTimeout(timer);timer=null;controller?.abort();pending=false;idInput.setCustomValidity('');const seq=++version;
    const id=normalizeDigits(idInput.value).trim();reset();
    if(!/^\d{5,15}$/.test(id)){status.textContent='اكتب PUBG ID صحيحًا بالأرقام لعرض الاسم.';return;}
    controller=new AbortController();pending=true;status.textContent='جاري التحقق من اسم اللاعب…';
    try{
      const response=await fetch('/api/public?action=player-lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id}),signal:controller.signal});
      const data=await response.json();if(!active||seq!==version)return;
      if(!response.ok||!data.ok){
        status.textContent=data.error||'تعذر التحقق. اكتب الاسم يدويًا وراجع الـID.';
        if(data.code==='invalid_id'){idInput.setCustomValidity('راجع الـID؛ الحساب غير موجود.');nameInput.value='';}
        return;
      }
      if(data.id!==id||typeof data.nickname!=='string'||!data.nickname.trim())throw new Error('Invalid response');
      nameInput.value=data.nickname;nameInput.readOnly=true;verifiedId=id;
      status.textContent=`اسم الحساب: ${data.nickname} — راجعه وأكد إنه حسابك.`;
      label.hidden=false;confirm.required=true;confirm.setCustomValidity('أكد إن ده الحساب المقصود للشحن.');
    }catch(error){if(active&&seq===version&&error.name!=='AbortError')status.textContent='خدمة التحقق غير متاحة. اكتب الاسم يدويًا وراجع الـID.';}
    finally{if(seq===version)pending=false;}
  }
  const changed=()=>{
    clearTimeout(timer);timer=null;controller?.abort();++version;pending=false;
    if(verifiedId)nameInput.value='';reset();idInput.setCustomValidity('');
    status.textContent='اكتب الـID كاملًا، وهيظهر اسم اللاعب هنا.';
    if(/^\d{5,15}$/.test(normalizeDigits(idInput.value).trim()))timer=setTimeout(lookup,650);
  };
  idInput.addEventListener('input',changed);block.querySelector('button').onclick=lookup;
  const guard=event=>{if(pending||timer){event.preventDefault();event.stopImmediatePropagation();status.textContent='انتظر انتهاء التحقق من الاسم أولًا.';return;}if(verifiedId&&(!confirm.checked||verifiedId!==normalizeDigits(idInput.value).trim())){event.preventDefault();event.stopImmediatePropagation();confirm.reportValidity();}};
  dialog.querySelector('form').addEventListener('submit',guard,true);
  if(idInput.value)changed();
  return ()=>{active=false;clearTimeout(timer);controller?.abort();};
}
