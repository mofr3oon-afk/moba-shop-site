export const config = { api: { bodyParser: false } };
import { json, escapeHtml, supabaseReady, supabaseRequest, telegramForm, telegramKeyboard, buildTelegramText, cairoDateKey, STATUS_LABELS, OPEN_STATUSES } from './_utils.js';

function readRawBody(req){return new Promise((resolve,reject)=>{const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject);});}
function parseMultipart(buffer,contentType){
  const m=/boundary=(?:(?:"([^"]+)")|([^;]+))/i.exec(contentType||''); if(!m) return {fields:{},files:{}};
  const boundary=m[1]||m[2], bb=Buffer.from(`--${boundary}`); const fields={}, files={}; let start=buffer.indexOf(bb);
  while(start!==-1){start+=bb.length; if(buffer[start]===45&&buffer[start+1]===45) break; if(buffer[start]===13&&buffer[start+1]===10) start+=2;
    const he=buffer.indexOf(Buffer.from('\r\n\r\n'),start); if(he===-1) break; const ht=buffer.slice(start,he).toString('utf8'); const ps=he+4; let nb=buffer.indexOf(bb,ps); if(nb===-1) break; let pe=nb; if(buffer[pe-2]===13&&buffer[pe-1]===10) pe-=2; const content=buffer.slice(ps,pe);
    const nm=/name="([^"]+)"/i.exec(ht), fm=/filename="([^"]*)"/i.exec(ht), tm=/Content-Type:\s*([^\r\n]+)/i.exec(ht);
    if(nm){const name=nm[1]; if(fm&&fm[1]) files[name]={filename:fm[1],contentType:tm?tm[1].trim():'application/octet-stream',buffer:content}; else fields[name]=content.toString('utf8');}
    start=nb;
  }
  return {fields,files};
}
async function nextDailyIdentity(){
  const orderDate=cairoDateKey(); let dailyNumber=1001;
  if(supabaseReady()){
    const rows=await supabaseRequest(`orders?order_date=eq.${encodeURIComponent(orderDate)}&select=daily_number&order=daily_number.desc&limit=1`).catch(()=>[]);
    const last=Number(rows?.[0]?.daily_number || 1000); dailyNumber=Number.isFinite(last)?last+1:1001;
  } else dailyNumber=1000+Number(String(Date.now()).slice(-3));
  return { id:`MOBA-${orderDate.replaceAll('-','')}-${dailyNumber}`, order_code:`MOBA ${dailyNumber}`, order_date:orderDate, daily_number:dailyNumber };
}
async function findOpenOrderByPhone(phone){
  if(!supabaseReady()) return null;
  const rows=await supabaseRequest(`orders?phone=eq.${encodeURIComponent(phone)}&status=in.(${OPEN_STATUSES.join(',')})&select=id,order_code,status,created_at&order=created_at.desc&limit=1`).catch(()=>[]);
  return rows?.[0] || null;
}
async function findOpenOrderByPubgId(cart){
  if(!supabaseReady()) return null;
  const rows=await supabaseRequest(`orders?status=in.(${OPEN_STATUSES.join(',')})&select=id,order_code,phone,status,items,created_at&order=created_at.desc&limit=50`).catch(()=>[]);
  const ids=new Set(cart.map(x=>String(x.pubgId)));
  return (rows||[]).find(o=>(Array.isArray(o.items)?o.items:[]).some(it=>ids.has(String(it.pubgId)))) || null;
}

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{ok:false,error:'Method not allowed'});
  try{
    const groupId=process.env.ORDER_GROUP_ID; if(!groupId) throw new Error('ORDER_GROUP_ID missing');
    const raw=await readRawBody(req); const {fields,files}=parseMultipart(raw,req.headers['content-type']);
    const cart=JSON.parse(fields.cart||'[]');
    const customerPhone=String(fields.customerPhone||'').trim();
    const paymentMethod=String(fields.paymentMethod||'').trim();
    const customerName='غير محدد';
    const note=String(fields.note||'').trim();
    const transferMode=String(fields.transferMode||'').trim(); // same | other
    const transferLast3=String(fields.transferLast3||'').trim();
    const total=cart.reduce((s,item)=>s+Number(item.price||0),0);
    if(!/^01\d{9}$/.test(customerPhone)) return json(res,400,{ok:false,error:'رقم الموبايل غير صحيح'});
    if(!paymentMethod) return json(res,400,{ok:false,error:'اختار طريقة الدفع'});
    if(!['same','other'].includes(transferMode)) return json(res,400,{ok:false,error:'حدد هل التحويل من نفس رقم المتابعة ولا من رقم/محل تاني'});
    if(transferMode==='other' && !/^\d{3}$/.test(transferLast3)) return json(res,400,{ok:false,error:'اكتب آخر 3 أرقام من رقم التحويل عشان نقدر نراجع الدفع'});

    if(!Array.isArray(cart)||!cart.length) return json(res,400,{ok:false,error:'سلة الطلبات فاضية'});
    for(const item of cart){ if(!item.product || !/^\d{5,15}$/.test(String(item.pubgId)) || String(item.pubgName||'').trim().length<2) return json(res,400,{ok:false,error:'راجع المنتج و PUBG ID واسم الحساب في السلة'}); }
    if(!files.screenshot || files.screenshot.buffer.length<50) return json(res,400,{ok:false,error:'ارفع سكرين التحويل'});

    const openPhone=await findOpenOrderByPhone(customerPhone);
    if(openPhone) return json(res,409,{ok:false,error:'عندك طلب مفتوح بالفعل. تابع حالته برقم الموبايل أو كلم الدعم لو محتاج تعديل.'});

    const identity=await nextDailyIdentity();
    const order={
      id:identity.id, order_code:identity.order_code, order_date:identity.order_date, daily_number:identity.daily_number,
      phone:customerPhone, customer_phone:customerPhone, customer_name:customerName, payment_method:paymentMethod, total,
      status:'pending', status_text:STATUS_LABELS.pending, customer_status_text:STATUS_LABELS.pending, admin_status_text:STATUS_LABELS.pending,
      handler:null, items:cart, note, transfer_mode:transferMode, transfer_last3:transferMode==='other'?transferLast3:'', transfer_confirm_text:transferMode==='same'?'نفس رقم المتابعة':`آخر 3 أرقام: ${transferLast3}`, telegram_chat_id:String(groupId), source:'website', order_type:'cart',
      raw_data:{userAgent:req.headers['user-agent']||''}, status_history:[{status:'pending',label:STATUS_LABELS.pending,at:new Date().toISOString(),by:'website'}]
    };
    const message=buildTelegramText(order); order.telegram_text=message; order.order_summary=`${identity.order_code} | ${customerPhone} | ${total}`;
    if(supabaseReady()) await supabaseRequest('orders',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(order)});

    const msgForm=new FormData(); msgForm.append('chat_id',groupId); msgForm.append('text',message); msgForm.append('parse_mode','HTML'); msgForm.append('reply_markup',JSON.stringify(telegramKeyboard(order.id,'pending')));
    const msgData=await telegramForm('sendMessage',msgForm);
    const messageId=msgData?.result?.message_id || null;
    if(supabaseReady()) await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({telegram_message_id:messageId,admin_message_id:String(messageId||''),message_id:String(messageId||''),updated_at:new Date().toISOString()})});

    const photoForm=new FormData(); photoForm.append('chat_id',groupId); if(messageId) photoForm.append('reply_to_message_id',String(messageId)); photoForm.append('caption',`📸 Screenshot for ${order.order_code}`); photoForm.append('photo',new Blob([files.screenshot.buffer],{type:files.screenshot.contentType}),files.screenshot.filename||'screenshot.jpg');
    const photoData=await telegramForm('sendPhoto',photoForm);
    if(supabaseReady()) await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({telegram_photo_file_id:photoData?.result?.photo?.slice(-1)?.[0]?.file_id||null,screenshot_file_name:files.screenshot.filename||'screenshot.jpg',updated_at:new Date().toISOString()})});

    return json(res,200,{ok:true,statusTracking:supabaseReady()});
  }catch(error){return json(res,500,{ok:false,error:error.message||'Server error'});}
}
