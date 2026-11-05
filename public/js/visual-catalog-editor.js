import { DEFAULT_CATALOG } from './catalog.js';
import { escapeText as esc } from './interface-utils.js';
import { gameTile, productFace, imageSource, mergeCatalogRows, validateCatalogDraft, gameAccent } from './catalog-presentation.js';

const catalogSessions=new WeakMap();
export function mountVisualCatalog(root,{local,onSave,onDraft,onAdvanced}){
  let gameId='',sectionId='',saving=false;
  let session=catalogSessions.get(local);
  if(!session){session={dirty:false,snapshot:JSON.stringify({games:local.games||[],sections:local.sections||[],products:local.products||[]})};catalogSessions.set(local,session);}
  const games=()=>mergeCatalogRows(DEFAULT_CATALOG.games,local.games||[],'slug');
  const sections=()=>mergeCatalogRows(DEFAULT_CATALOG.sections.map(s=>({...s,id:s.game+'|'+(s.slug||s.key)})),(local.sections||[]).map(s=>({...s,slug:s.slug||s.key,name:s.name||s.title,id:s.game+'|'+(s.slug||s.key)})));
  const products=()=>mergeCatalogRows(DEFAULT_CATALOG.products,local.products||[]);
  const draft=()=>{session.dirty=true;onDraft();};
  const syncFlag=()=>{const label=root.querySelector('[data-save-state]');if(label)label.textContent=saving?'جاري الحفظ…':session.dirty?'مسودة — لم تُنشر بعد':'كل التعديلات محفوظة';};
  const put=(kind,row)=>{
    const key=kind==='game'?'slug':'id',list=kind==='game'?'games':kind==='section'?'sections':'products';
    if(kind==='section'){local.sections=[...(local.sections||[]).filter(s=>!(s.game===row.game&&(s.slug||s.key)===row.slug)),row];}
    else local[list]=[...(local[list]||[]).filter(p=>p[key]!==row[key]),row];
    draft();render();
  };
  function render(){
    const allGames=games(),game=allGames.find(g=>g.slug===gameId),allProducts=products(),gameSections=sections().filter(s=>s.game===gameId);
    const shown=allProducts.filter(p=>p.game===gameId&&(!sectionId||(p.section||p.cat)===sectionId));
    root.innerHTML=`<div class="visual-editor-head"><div><span class="eyebrow">الكتالوج المرئي</span><h1>${game?esc(game.name):'رتّب متجرك بعين العميل'}</h1><p>اضغط على الصورة أو الباقة لتعديلها. راجع المسودة ثم احفظها على الموقع.</p></div><div class="admin-actions"><button class="primary" data-visual-save ${saving?'disabled':''}>حفظ على الموقع</button><span data-save-state role="status"></span></div></div><div class="visual-toolbar">${game?'<button class="ghost-btn" data-visual-back>← كل الألعاب</button><button class="ghost-btn" data-visual-edit-game>تعديل صورة وبيانات اللعبة</button><button class="ghost-btn" data-visual-new-product>+ باقة</button><button class="ghost-btn" data-visual-new-section>+ قسم</button>':'<button class="ghost-btn" data-visual-new-game>+ لعبة جديدة</button>'}<button class="ghost-btn" data-visual-advanced>الإعدادات المتقدمة</button><button class="ghost-btn" data-visual-discard ${session.dirty?'':'disabled'}>تراجع عن المسودة</button></div><div class="visual-workspace">${game?`<div class="visual-game-banner">${gameTile(game,{attribute:'data-visual-edit-banner',editor:true})}</div><div class="visual-sections"><button class="ghost-btn ${!sectionId?'active':''}" data-visual-section="">كل الباقات</button>${gameSections.map(s=>`<span><button class="ghost-btn ${sectionId===s.slug?'active':''}" data-visual-section="${esc(s.slug)}">${esc(s.name)}${s.status==='hidden'?' · مخفي':''}</button><button class="mini" data-visual-edit-section="${esc(s.slug)}" aria-label="تعديل قسم ${esc(s.name)}">✎</button></span>`).join('')}</div><div class="visual-packages">${shown.map(p=>productFace(p,{game,editor:true})).join('')||'<p class="notice">لا توجد باقات. أضف أول باقة لهذا القسم.</p>'}</div>`:`<div class="visual-games">${allGames.map(g=>gameTile(g,{attribute:'data-visual-game',editor:true,count:allProducts.filter(p=>p.game===g.slug&&p.status!=='hidden').length})).join('')}</div>`}</div><p class="small-note">الألعاب والباقات المخفية تظهر هنا لإمكانية استعادتها؛ لا تظهر للعميل. السعر بعملة الجنيه المصري.</p>`;
    syncFlag();
    root.querySelectorAll('[data-visual-game]').forEach(b=>b.onclick=()=>{gameId=b.dataset.visualGame;sectionId='';render();});
    root.querySelectorAll('[data-visual-product]').forEach(b=>b.onclick=()=>edit('product',allProducts.find(p=>p.id===b.dataset.visualProduct)));
    root.querySelectorAll('[data-visual-section]').forEach(b=>b.onclick=()=>{sectionId=b.dataset.visualSection;render();});
    root.querySelectorAll('[data-visual-edit-section]').forEach(b=>b.onclick=()=>edit('section',gameSections.find(s=>s.slug===b.dataset.visualEditSection)));
    root.querySelector('[data-visual-back]')?.addEventListener('click',()=>{gameId='';render();});
    for(const selector of ['[data-visual-edit-game]','[data-visual-edit-banner]'])root.querySelector(selector)?.addEventListener('click',()=>edit('game',game));
    root.querySelector('[data-visual-new-game]')?.addEventListener('click',()=>edit('game',{slug:'game-'+crypto.randomUUID().slice(0,8),name:'لعبة جديدة',status:'hidden',order:allGames.length+1,defaultSection:'main',cover:'/assets/moba-shop-logo-256.png'}));
    root.querySelector('[data-visual-new-section]')?.addEventListener('click',()=>edit('section',{id:crypto.randomUUID(),game:gameId,slug:'section-'+crypto.randomUUID().slice(0,8),name:'قسم جديد',status:'available',order:gameSections.length+1}));
    root.querySelector('[data-visual-new-product]')?.addEventListener('click',()=>edit('product',{id:'p_'+crypto.randomUUID(),game:gameId,section:sectionId||gameSections[0]?.slug||'main',name:'باقة جديدة',price:0,salePrice:0,status:'hidden',checkoutMethod:'direct',order:shown.length+1}));
    root.querySelector('[data-visual-advanced]').onclick=()=>onAdvanced();
    root.querySelector('[data-visual-discard]').onclick=()=>{if(!confirm('إلغاء تعديلات المسودة والعودة لآخر نسخة محفوظة؟'))return;Object.assign(local,JSON.parse(session.snapshot));session.dirty=false;onDraft();render();};
    root.querySelector('[data-visual-save]').onclick=async()=>{
      if(saving)return;saving=true;render();const pendingButton=root.querySelector('[data-visual-save]');
      try{await onSave();session.dirty=false;session.snapshot=JSON.stringify({games:local.games||[],sections:local.sections||[],products:local.products||[]});}
      catch(e){alert('لم يتم النشر. مسودتك محفوظة على الجهاز. '+e.message);}
      finally{saving=false;if(root.contains(pendingButton))render();}
    };
  }
  function edit(kind,original){
    const d=structuredClone(original),isGame=kind==='game',isProduct=kind==='product',imageKey=isGame?'cover':'image';
    if(isGame)d.accent=gameAccent(d);
    let uploadedImage=String(d[imageKey]||'').startsWith('data:')?d[imageKey]:'';
    const dialog=document.createElement('dialog');dialog.className='visual-edit-dialog';
    const field=(key,label,type='text')=>`<label class="field"><span>${label}</span><input name="${key}" type="${type}" ${['price','salePrice','cost'].includes(key)?'inputmode="decimal"':''} value="${esc(d[key]??'')}" ${key==='name'?'required maxlength="100"':''}></label>`;
    const status=d.status||'available';
    dialog.innerHTML=`<form class="visual-edit-form"><div class="visual-dialog-heading"><div><span class="eyebrow">تعديل ${isGame?'اللعبة':isProduct?'الباقة':'القسم'}</span><h2>${esc(d.name)}</h2></div><button type="button" class="ghost-btn" data-close aria-label="إغلاق">×</button></div><div class="visual-edit-layout"><div class="visual-fields">${field('name','الاسم الظاهر للعميل')}${isGame?field('subtitle','وصف اللعبة')+field('accent','لون بطاقة اللعبة','color'):''}${isProduct?`<div class="visual-field-row">${field('price','السعر الأساسي · ج.م')}${field('salePrice','سعر العرض · صفر لإلغائه')}</div>${field('description','وصف قصير للباقة')}<label class="field"><span>القسم</span><select name="section">${sections().filter(s=>s.game===gameId).map(s=>`<option value="${esc(s.slug)}" ${(d.section||d.cat)===s.slug?'selected':''}>${esc(s.name)}</option>`).join('')||'<option value="main">منتجات</option>'}</select></label><label class="field"><span>طريقة إتمام الطلب</span><select name="checkoutMethod"><option value="direct" ${(d.checkoutMethod||d.checkout_method||'direct')==='direct'?'selected':''}>بيانات الحساب وإثبات التحويل</option><option value="manual" ${(d.checkoutMethod||d.checkout_method)==='manual'?'selected':''}>استكمال الطلب في الشات</option></select></label><label><input name="noQty" type="checkbox" ${d.noQty?'checked':''}> باقة بكمية واحدة</label>`:''}<div class="visual-field-row"><label class="field"><span>الحالة</span><select name="status">${[['available','متاح'],['soon','قريبًا'],['disabled','موقوف'],['hidden','مخفي']].map(([v,l])=>`<option value="${v}" ${v===status?'selected':''}>${l}</option>`).join('')}</select></label>${field('order','ترتيب الظهور','number')}</div>${kind!=='section'?`<label class="field"><span>الصورة</span><input name="${imageKey}" value="${esc(uploadedImage?'':d[imageKey]||'')}" placeholder="رابط HTTPS أو ارفع صورة"><small>صور صغيرة تُعرض كأيقونة دون تمديد.</small></label><label class="image-upload-control">استبدال الصورة من جهازك<input type="file" accept="image/jpeg,image/png,image/webp" data-image-upload></label><button type="button" class="ghost-btn" data-reset-image>استخدام الصورة الافتراضية</button>`:''}<details><summary>إعدادات إضافية</summary>${isProduct?`${field('cost','التكلفة الداخلية · لا تظهر للعميل')}${field('unit','الوحدة')}`:''}${isGame?`${field('idLabel','عنوان خانة ID')}${field('idPlaceholder','مثال داخل خانة ID')}${field('nameLabel','عنوان اسم الحساب')}`:''}<p class="small-note">معرّف الرابط ثابت لحماية ارتباط المنتجات والطلبات.</p></details></div><aside class="visual-live-preview"><span class="eyebrow">هكذا يظهر للعميل</span><div data-preview></div><p class="small-note">معاينة للمسودة؛ التغييرات تظهر بعد الحفظ على الموقع.</p></aside></div><p class="message err" data-error role="alert" hidden></p><div class="visual-dialog-footer"><button class="primary" type="submit">تطبيق على المسودة</button><button class="ghost-btn" type="button" data-close>إلغاء</button></div></form>`;
    document.body.append(dialog);const form=dialog.querySelector('form'),preview=dialog.querySelector('[data-preview]'),error=dialog.querySelector('[data-error]');
    const read=()=>({...d,...Object.fromEntries(new FormData(form)),[imageKey]:form.elements[imageKey]?.value||uploadedImage,...(isProduct?{noQty:form.elements.noQty.checked}:{})});
    const refresh=()=>{const p=read();preview.innerHTML=isGame?gameTile(p,{editor:true}):isProduct?productFace(p,{game:games().find(g=>g.slug===gameId),editor:true}):`<span class="section-pill">${esc(p.name)}</span>`;preview.querySelectorAll('button').forEach(b=>{b.disabled=true;});};
    form.addEventListener('input',refresh);form.addEventListener('change',refresh);
    dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>dialog.close());
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    dialog.querySelector('[data-reset-image]')?.addEventListener('click',()=>{uploadedImage='';form.elements[imageKey].value=isGame?(DEFAULT_CATALOG.games.find(g=>g.slug===d.slug)?.cover||''):'';refresh();});
    let uploadPending=false;
    dialog.querySelector('[data-image-upload]')?.addEventListener('change',async e=>{
      const file=e.target.files[0];if(!file)return;uploadPending=true;
      try{
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('اختر صورة JPG أو PNG أو WebP أقل من 5 ميجابايت.');
        const bitmap=await createImageBitmap(file);const scale=Math.min(1,800/bitmap.width,800/bitmap.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
        const encoded=canvas.toDataURL('image/webp',.82);if(encoded.length>280000)throw new Error('الصورة كبيرة بعد التحسين؛ جرّب صورة أبسط.');uploadedImage=encoded;form.elements[imageKey].value='';form.elements[imageKey].placeholder='صورة مرفوعة جاهزة';error.hidden=true;refresh();
      }catch(e){error.textContent=e.message;error.hidden=false;}finally{uploadPending=false;}
    });
    form.onsubmit=e=>{e.preventDefault();try{if(uploadPending)throw new Error('انتظر تجهيز الصورة.');const row=validateCatalogDraft(kind,read());if(row[imageKey]&&imageSource(row[imageKey])!==String(row[imageKey]).trim())throw new Error('رابط الصورة لازم يكون HTTPS أو صورة مرفوعة.');if(isGame&&!sections().some(s=>s.game===row.slug))local.sections=[...(local.sections||[]),{game:row.slug,slug:'main',name:'الباقات',status:'available',order:1}];put(kind,row);dialog.close();}catch(e){error.textContent=e.message;error.hidden=false;}};
    refresh();dialog.showModal();form.elements.name.focus();
  }
  render();
}
