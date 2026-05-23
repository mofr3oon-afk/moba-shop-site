function itemQty(item){ return Math.max(1, Number(item.qty || 1)); }
function itemLineTotal(item){ return Number(item.price||0) * itemQty(item); }
function extractUc(productName){ const m=String(productName||'').match(/(\d+)\s*UC/i); return m ? Number(m[1]) : 0; }
function itemUcTotal(item){ return extractUc(item.product) * itemQty(item); }

import { json, supabaseRequest, telegramJson, isAdmin, adminName, STATUS_LABELS, telegramKeyboard, buildTelegramText, reportsKeyboard, supportUrl } from './_utils.js';
const ACTION_REPLY={claimed:'🙋 تم استلام الطلب',processing:'🔄 تم بدء التنفيذ',delivered:'✅ تم الشحن بنجاح',on_hold:'⏸ تم تعليق الطلب',needs_fix:'⚠️ الطلب محتاج مراجعة',rejected:'❌ تم رفض الطلب'};
function readJson(req){return new Promise((resolve,reject)=>{const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'))}catch(e){reject(e)}});req.on('error',reject);});}
async function answerCallback(id,text,showAlert=false){return telegramJson('answerCallbackQuery',{callback_query_id:id,text,show_alert:Boolean(showAlert)});}
async function getOrder(orderId){const rows=await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`);return rows?.[0]||null;}
async function updateOrder(orderId,payload){return supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...payload,updated_at:new Date().toISOString()})});}
function itemSummary(items=[]){return (Array.isArray(items)?items:[]).map((x,i)=>`${i+1}) ${x.product}\nID: ${x.pubgId}\nName: ${x.pubgName || '-'}\nQty: ${itemQty(x)}\nUC Total: ${itemUcTotal(x)} UC\nTotal: ${itemLineTotal(x)} جنيه`).join('\n\n') || 'لا يوجد';}) ${x.product}\nID: ${x.pubgId}\nName: ${x.pubgName || '-'}\nQty: ${itemQty(x)}\nUC Total: ${itemUcTotal(x)} UC\nTotal: ${itemLineTotal(x)} جنيه`).join('\n\n') || 'لا يوجد';}) ${x.product}\nID: ${x.pubgId}\nName: ${x.pubgName || '-'}\nPrice: ${x.price}`).join('\n\n') || 'لا يوجد';}
async function customerHistoryText(phone){
  const rows=await supabaseRequest(`orders?phone=eq.${encodeURIComponent(phone)}&select=id,order_code,status,total,items,created_at,payment_method&order=created_at.desc&limit=10`).catch(()=>[]);
  const delivered=(rows||[]).filter(x=>x.status==='delivered').length;
  const totalValue=(rows||[]).reduce((s,x)=>s+Number(x.total||0),0);
  const last=(rows||[]).slice(0,5).map((o,i)=>`${i+1}) ${o.order_code||o.id} | ${STATUS_LABELS[o.status]||o.status} | ${o.total} جنيه`).join('\n') || 'لا يوجد';
  return `📊 سجل العميل\n━━━━━━━━━━━━━━\nرقم العميل: ${phone}\nعدد الطلبات المعروضة: ${(rows||[]).length}\nتم الشحن ضمن آخر 10: ${delivered}\nإجمالي آخر 10 طلبات: ${totalValue} جنيه\n\nآخر الطلبات:\n${last}`;
}
function periodStart(kind){const d=new Date(); if(kind==='today') d.setUTCHours(0,0,0,0); if(kind==='week') d.setUTCDate(d.getUTCDate()-7); if(kind==='month') d.setUTCDate(d.getUTCDate()-30); return d.toISOString();}
async function reportText(kind){
  const from=periodStart(kind); const title=kind==='today'?'تقرير اليوم':kind==='week'?'تقرير الاسبوع':'تقرير الشهر';
  const rows=await supabaseRequest(`orders?created_at=gte.${encodeURIComponent(from)}&select=status,total,payment_method,items,phone,created_at&order=created_at.desc&limit=1000`).catch(()=>[]);
  const counts={}; const payments={}; const products={}; let total=0;
  for(const o of rows||[]){counts[o.status]=(counts[o.status]||0)+1; payments[o.payment_method||'غير محدد']=(payments[o.payment_method||'غير محدد']||0)+1; total+=Number(o.total||0); for(const it of (Array.isArray(o.items)?o.items:[])){products[it.product]=(products[it.product]||0)+1;}}
  const c=s=>counts[s]||0; const prod=Object.entries(products).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}: ${v}`).join('\n')||'لا يوجد'; const pay=Object.entries(payments).map(([k,v])=>`${k}: ${v}`).join('\n')||'لا يوجد';
  return `📊 ${title} | MOBA SHOP\n━━━━━━━━━━━━━━\nإجمالي الطلبات: ${(rows||[]).length}\nتم الشحن: ${c('delivered')}\nجاري التنفيذ: ${c('processing')}\nمعلق/مشكلة: ${c('on_hold')+c('needs_fix')}\nمرفوض: ${c('rejected')}\n\nإجمالي قيمة الطلبات: ${total} جنيه\n\nالمنتجات:\n${prod}\n\nطرق الدفع:\n${pay}`;
}
async function handleCommand(msg){
  const userId=msg.from?.id; if(!isAdmin(userId)) return;
  const text=String(msg.text||'').trim(); const chat_id=msg.chat.id;
  let reply='';
  if(text==='/today') reply=await reportText('today');
  else if(text==='/week') reply=await reportText('week');
  else if(text==='/month') reply=await reportText('month');
  else if(text.startsWith('/customer')||text.startsWith('/orders')){const phone=(text.split(/\s+/)[1]||'').trim(); reply=/^01\d{9}$/.test(phone)?await customerHistoryText(phone):'استخدمها كده: /customer 010xxxxxxxx';}
  else if(text==='/pending'){const rows=await supabaseRequest(`orders?status=in.(pending,claimed,processing,on_hold,needs_fix)&select=order_code,phone,status,total,created_at&order=created_at.desc&limit=20`).catch(()=>[]); reply='📌 الطلبات المفتوحة\n━━━━━━━━━━━━━━\n'+((rows||[]).map(o=>`${o.order_code} | ${o.phone} | ${STATUS_LABELS[o.status]||o.status} | ${o.total} جنيه`).join('\n')||'لا يوجد');}
  else if(text==='/delivered') {const rows=await supabaseRequest(`orders?status=eq.delivered&created_at=gte.${encodeURIComponent(periodStart('today'))}&select=order_code,phone,total&order=created_at.desc&limit=50`).catch(()=>[]); reply='✅ تم الشحن اليوم\n━━━━━━━━━━━━━━\n'+((rows||[]).map(o=>`${o.order_code} | ${o.phone} | ${o.total} جنيه`).join('\n')||'لا يوجد');}
  else if(text==='/help'||text==='/admin'||text==='/reports') {
    await telegramJson('sendMessage',{chat_id,reply_to_message_id:msg.message_id,text:'🛠 اوامر MOBA SHOP\n/today تقرير اليوم\n/week تقرير الاسبوع\n/month تقرير الشهر\n/customer 010xxxxxxxx سجل عميل\n/orders 010xxxxxxxx طلبات رقم\n/pending الطلبات المفتوحة\n/delivered تم الشحن اليوم\n\nاو استخدم الازرار:',reply_markup:reportsKeyboard()});
    return;
  }
  if(reply) await telegramJson('sendMessage',{chat_id,reply_to_message_id:msg.message_id,text:reply});
}
export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{ok:false});
  if(process.env.TELEGRAM_WEBHOOK_SECRET && req.query.secret!==process.env.TELEGRAM_WEBHOOK_SECRET) return json(res,403,{ok:false});
  let cb=null;
  try{
    const update=await readJson(req);
    if(update.message?.text?.startsWith('/')){await handleCommand(update.message); return json(res,200,{ok:true});}
    cb=update.callback_query; if(!cb) return json(res,200,{ok:true});
    if(!isAdmin(cb.from?.id)){await answerCallback(cb.id,'مش مصرح لك',true); return json(res,200,{ok:true});}

    if(String(cb.data||'').startsWith('webreport_')){
      const action=String(cb.data).replace('webreport_','');
      let reply='';
      if(['today','week','month'].includes(action)) reply=await reportText(action);
      else if(action==='pending'){
        const rows=await supabaseRequest(`orders?status=in.(pending,claimed,processing,on_hold,needs_fix)&select=order_code,phone,status,total,created_at&order=created_at.desc&limit=20`).catch(()=>[]);
        reply='📌 الطلبات المفتوحة\n━━━━━━━━━━━━━━\n'+((rows||[]).map(o=>`${o.order_code} | ${o.phone} | ${STATUS_LABELS[o.status]||o.status} | ${o.total} جنيه`).join('\n')||'لا يوجد');
      }else if(action==='delivered'){
        const rows=await supabaseRequest(`orders?status=eq.delivered&created_at=gte.${encodeURIComponent(periodStart('today'))}&select=order_code,phone,total&order=created_at.desc&limit=50`).catch(()=>[]);
        reply='✅ تم الشحن اليوم\n━━━━━━━━━━━━━━\n'+((rows||[]).map(o=>`${o.order_code} | ${o.phone} | ${o.total} جنيه`).join('\n')||'لا يوجد');
      }
      if(reply) await telegramJson('sendMessage',{chat_id:cb.message.chat.id,reply_to_message_id:cb.message.message_id,text:reply});
      await answerCallback(cb.id,'تم إرسال التقرير'); return json(res,200,{ok:true});
    }

    const data=String(cb.data||''); if(!data.startsWith('web_')) return json(res,200,{ok:true});
    const [,action,...rest]=data.split('_'); const orderId=rest.join('_'); const order=await getOrder(orderId);
    if(!order){await answerCallback(cb.id,'الطلب مش موجود',true); return json(res,200,{ok:true});}
    if(action==='data'){await telegramJson('sendMessage',{chat_id:cb.message.chat.id,reply_to_message_id:cb.message.message_id,text:`📋 بيانات الطلب ${order.order_code||order.id}\n━━━━━━━━━━━━━━\nPhone: ${order.phone}\nPayment: ${order.payment_method}\nTotal: ${order.total}\nNote: ${order.note||'-'}\n\n${itemSummary(order.items)}`}); await answerCallback(cb.id,'تم إرسال البيانات'); return json(res,200,{ok:true});}
    if(action==='history'){await telegramJson('sendMessage',{chat_id:cb.message.chat.id,reply_to_message_id:cb.message.message_id,text:await customerHistoryText(order.phone)}); await answerCallback(cb.id,'تم إرسال سجل العميل'); return json(res,200,{ok:true});}
    const actionToStatus={claim:'claimed',processing:'processing',delivered:'delivered',hold:'on_hold',fix:'needs_fix',badshot:'needs_fix',badid:'needs_fix',badphone:'needs_fix',reject:'rejected'};
    const fixInfo={
      badshot:{type:'badshot',label:'📸 السكرين غير واضح. تقدر ترفع سكرين واضح مرة واحدة من حالة الطلب.'},
      badid:{type:'badid',label:'🆔 الايدي أو اسم الحساب محتاج مراجعة. تقدر تبعت البيانات الصحيحة مرة واحدة من حالة الطلب.'},
      badphone:{type:'badphone',label:'📱 رقم المتابعة محتاج تعديل. تقدر تبعت الرقم الصحيح مرة واحدة من حالة الطلب.'}
    };
    let newStatus=actionToStatus[action]; if(!newStatus){await answerCallback(cb.id,'امر غير معروف',true); return json(res,200,{ok:true});}
    const name=adminName(cb.from); const history=Array.isArray(order.status_history)?order.status_history:[];
    let label=STATUS_LABELS[newStatus]; const payloadExtra={};
    if(fixInfo[action]){
      if(Number(order.fix_attempts||0)>=1){
        newStatus='rejected';
        label=`❌ تم رفض الطلب بسبب ${action==='badshot'?'سكرين غير واضح':action==='badid'?'مشكلة في ID':'مشكلة في الرقم'}. برجاء التواصل مع الدعم: ${supportUrl()}`;
        payloadExtra.rejection_reason=label;
      }else{
        label=fixInfo[action].label;
        payloadExtra.fix_type=fixInfo[action].type;
        payloadExtra.fix_reason=label;
        payloadExtra.fix_requested_at=new Date().toISOString();
      }
    }
    if(action==='reject') label=`❌ تم رفض الطلب. برجاء التواصل مع الدعم: ${supportUrl()}`;
    history.push({status:newStatus,label,at:new Date().toISOString(),by:name,admin_id:String(cb.from.id)});
    const payload={status:newStatus,status_text:STATUS_LABELS[newStatus],customer_status_text:label,admin_status_text:STATUS_LABELS[newStatus],handler:name,handler_id:String(cb.from.id),admin_id:String(cb.from.id),admin_name:name,last_status_at:new Date().toISOString(),last_status_by:name,status_history:history,...payloadExtra};
    if(newStatus==='claimed') Object.assign(payload,{claimed_by:String(cb.from.id),claimed_by_name:name,claimed_at:new Date().toISOString()});
    await updateOrder(orderId,payload);
    const updated={...order,...payload};
    await telegramJson('editMessageText',{chat_id:cb.message.chat.id,message_id:cb.message.message_id,text:buildTelegramText(updated),parse_mode:'HTML',reply_markup:telegramKeyboard(orderId,newStatus)});
    await telegramJson('sendMessage',{chat_id:cb.message.chat.id,reply_to_message_id:cb.message.message_id,text:`${ACTION_REPLY[newStatus]||'تم تحديث الطلب'}\n👨‍💻 بواسطة: ${name}\n🧾 الطلب: ${order.order_code||orderId}\n${fixInfo[action]&&newStatus==='needs_fix'?'🔧 العميل يقدر يبعت تعديل مرة واحدة من حالة الطلب.':''}`});
    await answerCallback(cb.id,`تم تحديث الحالة: ${STATUS_LABELS[newStatus]}`); return json(res,200,{ok:true});
  }catch(error){try{if(cb?.id) await answerCallback(cb.id,error.message||'حصل خطأ',true)}catch{} return json(res,200,{ok:false,error:error.message});}
}
