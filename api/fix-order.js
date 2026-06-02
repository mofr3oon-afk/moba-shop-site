import { rateLimit, safeError } from '../lib/_security.js';

export const config = { api: { bodyParser: false } };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ORDER_GROUP_ID = process.env.ORDER_GROUP_ID;

function json(res,status,obj){res.status(status).json(obj);}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

async function supa(path,opts={}){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
    ...opts,
    headers:{
      apikey:SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'return=representation',
      ...(opts.headers||{})
    }
  });
  const text=await r.text();
  let data; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}

async function tg(method,payload){
  if(!BOT_TOKEN) return null;
  const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  return r.json().catch(()=>null);
}

async function tgForm(method,form){
  if(!BOT_TOKEN) return null;
  const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,{
    method:'POST',
    body:form
  });
  return r.json().catch(()=>null);
}

function readRawBody(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>resolve(Buffer.concat(chunks)));
    req.on('error',reject);
  });
}

function parseMultipart(buffer,contentType){
  const m=/boundary=(?:(?:"([^"]+)")|([^;]+))/i.exec(contentType||'');
  if(!m) return {fields:{},files:{}};
  const boundary=m[1]||m[2];
  const marker=Buffer.from(`--${boundary}`);
  const fields={}, files={};
  let start=buffer.indexOf(marker);
  while(start!==-1){
    start+=marker.length;
    if(buffer[start]===45 && buffer[start+1]===45) break;
    if(buffer[start]===13 && buffer[start+1]===10) start+=2;
    const headerEnd=buffer.indexOf(Buffer.from('\r\n\r\n'),start);
    if(headerEnd===-1) break;
    const headers=buffer.slice(start,headerEnd).toString('utf8');
    const partStart=headerEnd+4;
    let next=buffer.indexOf(marker,partStart);
    if(next===-1) break;
    let partEnd=next;
    if(buffer[partEnd-2]===13 && buffer[partEnd-1]===10) partEnd-=2;
    const content=buffer.slice(partStart,partEnd);
    const name=/name="([^"]+)"/i.exec(headers);
    const filename=/filename="([^"]*)"/i.exec(headers);
    const type=/Content-Type:\s*([^\r\n]+)/i.exec(headers);
    if(name){
      if(filename && filename[1]){
        files[name[1]]={filename:filename[1],contentType:type?type[1].trim():'application/octet-stream',buffer:content};
      }else{
        fields[name[1]]=content.toString('utf8');
      }
    }
    start=next;
  }
  return {fields,files};
}

function validateFixImage(file){
  if(!file || !file.buffer || file.buffer.length<2000){
    const err=new Error('ارفع صورة سكرين واضحة بحجم مناسب');
    err.statusCode=400;
    throw err;
  }
  const type=String(file.contentType||'').toLowerCase();
  const name=String(file.filename||'').toLowerCase();
  const okType=['image/jpeg','image/png','image/webp','image/jpg'].includes(type);
  const okExt=['.jpg','.jpeg','.png','.webp'].some(ext=>name.endsWith(ext));
  if(!okType || !okExt){
    const err=new Error('السكرين لازم يكون صورة فقط JPG أو PNG أو WEBP');
    err.statusCode=400;
    throw err;
  }
  const max=Number(process.env.MAX_SCREENSHOT_SIZE || 5*1024*1024);
  if(file.buffer.length>max){
    const err=new Error('حجم السكرين كبير. ارفع صورة أقل من 5MB');
    err.statusCode=400;
    throw err;
  }
  return true;
}

async function getOrder(id,phone){
  let rows=await supa(`orders?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  if(rows && rows[0]) return rows[0];
  rows=await supa(`orders?order_code=eq.${encodeURIComponent(id)}&phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`);
  return rows && rows[0];
}

function history(order,label){
  const h=Array.isArray(order.status_history)?order.status_history:[];
  h.push({at:new Date().toISOString(),status:'pending',label,by:'customer'});
  return h.slice(-20);
}

function appendNote(order, text){
  const current=String(order.note||'').trim();
  return current ? `${current}\n${text}` : text;
}

export default async function handler(req,res){
  try{ rateLimit(req,'fix-order',20,60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  try{
    if(req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    const raw=await readRawBody(req);
    const {fields,files}=parseMultipart(raw,req.headers['content-type']);
    const orderId=String(fields.orderId||'').trim();
    const phone=String(fields.phone||'').trim();
    const fixValue=String(fields.fixValue||fields.newIdData||fields.newPhone||'').trim();
    const fixFile=files.fixFile || files.screenshot || null;
    if(!orderId) return json(res,400,{ok:false,error:'رقم الطلب غير موجود'});
    if(!phone) return json(res,400,{ok:false,error:'رقم الموبايل غير موجود'});

    const order=await getOrder(orderId,phone);
    if(!order) return json(res,404,{ok:false,error:'الطلب غير موجود'});
    if(order.status !== 'needs_fix') return json(res,400,{ok:false,error:'الطلب لا يحتاج تعديل حاليا'});
    const count=Number(order.fix_count||0);
    if(count>=2) return json(res,403,{ok:false,error:'تم استخدام فرص التعديل. برجاء التواصل مع الدعم'});

    const fixType=order.fix_type || 'general';
    if(fixType==='bad_screen'){
      if(!fixFile || !fixFile.filename) return json(res,400,{ok:false,error:'ارفع صورة السكرين الجديدة'});
      validateFixImage(fixFile);
    }
    if(fixType==='bad_phone' && !/^01[0-9]{9}$/.test(fixValue)) return json(res,400,{ok:false,error:'رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01'});
    if(fixType==='bad_id' && !/(ID:\s*)?[0-9]{5,15}/i.test(fixValue)) return json(res,400,{ok:false,error:'اكتب ID صحيح وأي اسم حساب واضح'});
    if(fixType!=='bad_screen' && fixValue.length<2) return json(res,400,{ok:false,error:'اكتب التعديل المطلوب'});

    const fileName=fixFile?.filename || '';
    const noteAppend=`[تعديل العميل ${count+1}/2 - ${new Date().toLocaleString('en-GB')}]\n${fixType==='bad_screen' ? 'تم رفع سكرين جديد: '+fileName : fixValue}`;
    const patch={
      status:'pending',
      status_text:'تم إرسال تعديل من العميل للمراجعة',
      customer_status_text:'تم إرسال التعديل للمراجعة',
      admin_status_text:'العميل أرسل تعديل جديد',
      fix_count:count+1,
      customer_fix_note:fixValue || fileName,
      last_status_by:'العميل',
      last_status_at:new Date().toISOString(),
      note:appendNote(order,noteAppend),
      status_history:history(order,'العميل أرسل تعديل جديد'),
      updated_at:new Date().toISOString()
    };

    if(fixType==='bad_screen' && fixFile?.buffer){
      try{
        const photoForm=new FormData();
        photoForm.append('chat_id',ORDER_GROUP_ID);
        if(order.telegram_message_id || order.admin_message_id) photoForm.append('reply_to_message_id',String(order.telegram_message_id||order.admin_message_id));
        photoForm.append('caption',`📸 Screenshot update for ${order.order_code || order.id}`);
        photoForm.append('photo',new Blob([fixFile.buffer],{type:fixFile.contentType}),fixFile.filename||'fix-screenshot.jpg');
        const photoData=await tgForm('sendPhoto',photoForm);
        const photoId=photoData?.result?.photo?.slice(-1)?.[0]?.file_id || null;
        if(photoId){
          patch.telegram_photo_file_id=photoId;
          patch.screenshot_file_name=fixFile.filename||'fix-screenshot.jpg';
          patch.raw_data={...(order.raw_data||{}),telegram_photo_file_id:photoId,screenshot_file_name:patch.screenshot_file_name,last_customer_fix_screenshot_at:new Date().toISOString()};
        }
      }catch(e){
        patch.raw_data={...(order.raw_data||{}),fix_screenshot_pending:true,fix_screenshot_error:String(e?.message||e).slice(0,220),screenshot_file_name:fixFile.filename||'fix-screenshot.jpg'};
      }
    }

    const rows=await supa(`orders?id=eq.${encodeURIComponent(order.id)}`,{method:'PATCH',body:JSON.stringify(patch)});
    const updated=rows && rows[0];
    if(ORDER_GROUP_ID){
      await tg('sendMessage',{
        chat_id:ORDER_GROUP_ID,
        text:`🔔 تعديل جديد من العميل
━━━━━━━━━━━━━━
🧾 الطلب: ${escapeHtml(order.order_code || order.id)}
📱 الرقم: ${escapeHtml(order.phone || phone)}
📌 نوع المشكلة: ${escapeHtml(fixType)}
🔢 فرصة التعديل: ${count+1}/2

${escapeHtml(fixType==='bad_screen' ? 'تم رفع سكرين جديد: '+fileName : fixValue)}`,
        parse_mode:'HTML'
      });
    }
    return json(res,200,{ok:true,order:updated});
  }catch(e){
    return json(res,e.statusCode||400,{ok:false,error:String(e.message||e)});
  }
}
