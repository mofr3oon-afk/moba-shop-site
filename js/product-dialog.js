import {escapeText as esc,normalizeDigits} from './interface-utils.js';

export function collectAccountDetails({product,game,quantity,fields,initial={},money}){
  const dialog=document.createElement('dialog');dialog.className='product-dialog';
  dialog.setAttribute('aria-labelledby','productDialogTitle');
  dialog.innerHTML=`<form method="dialog" id="productDetailsForm">
    <div class="dialog-heading"><div><span class="eyebrow">بيانات الشحن</span><h2 id="productDialogTitle">${esc(product.name)}</h2></div><button type="button" class="close-dialog" aria-label="إغلاق">×</button></div>
    <div class="dialog-summary"><span>${esc(game.name)} · الكمية ${quantity}</span><strong>${money((Number(product.salePrice)||product.price)*quantity)}</strong></div>
    <p class="muted">اكتب البيانات المطلوبة للشحن. لن نطلب كلمة مرور حسابك.</p>
    <div class="fields-grid">
      <div class="field"><label for="dialogAccountId">${esc(game.idLabel||'ID الحساب')}</label><input id="dialogAccountId" name="accountId" value="${esc(initial.id||'')}" required maxlength="100" autocomplete="off" dir="auto"></div>
      <div class="field"><label for="dialogAccountName">${esc(game.nameLabel||'اسم الحساب')}</label><input id="dialogAccountName" name="accountName" value="${esc(initial.name||'')}" required minlength="2" maxlength="100" autocomplete="off" dir="auto"></div>
      ${fields.map((f,index)=>`<div class="field"><label for="dialogExtra${index}">${esc(f.label||f.key)}</label><input id="dialogExtra${index}" data-dialog-extra="${esc(f.key)}" value="${esc(initial.extraFields?.[f.key]||'')}" ${f.required?'required':''} ${f.type==='number'?'inputmode="numeric" pattern="[0-9٠-٩۰-۹]+"':''} maxlength="200" autocomplete="off" dir="auto"></div>`).join('')}
    </div>
    <div class="dialog-footer"><button type="submit" class="primary">تأكيد البيانات وإضافة للسلة</button><button type="button" class="ghost-btn close-dialog">رجوع للباقات</button></div>
    <p class="small-note">راجع ID الحساب قبل تأكيد الطلب النهائي.</p>
  </form>`;
  document.body.append(dialog);
  const previous=document.activeElement;
  return new Promise(resolve=>{
    let settled=false;
    const finish=value=>{if(settled)return;settled=true;dialog.close();dialog.remove();if(previous?.isConnected)previous.focus();resolve(value);};
    dialog.querySelectorAll('.close-dialog').forEach(button=>button.addEventListener('click',()=>finish(null)));
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});
    dialog.addEventListener('close',()=>finish(null));
    dialog.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>input.setCustomValidity('')));
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)finish(null);}});
    dialog.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();const extraFields={};
      const idInput=dialog.querySelector('[name="accountId"]'),nameInput=dialog.querySelector('[name="accountName"]');
      const id=normalizeDigits(idInput.value).trim(),name=nameInput.value.trim();
      if(!id||name.length<2){const input=!id?idInput:nameInput;input.setCustomValidity('اكتب بيانات الحساب بشكل صحيح.');input.reportValidity();return;}
      dialog.querySelectorAll('[data-dialog-extra]').forEach(input=>extraFields[input.dataset.dialogExtra]=input.value.trim());
      finish({id,name,extraFields});
    });
    dialog.showModal();
  });
}
