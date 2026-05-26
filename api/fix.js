import { rateLimit, safeError } from '../lib/_security.js';
// moba-v40-security
export const config = { api: { bodyParser: false } };
import { json, supabaseRequest, telegramForm, telegramJson, buildTelegramText, telegramKeyboard, STATUS_LABELS, supportUrl } from '../lib/_utils.js';

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
async function getLatestFixOrder(phone){
  const rows=await supabaseRequest(`orders?phone=eq.${encodeURIComponent(phone)}&status=eq.needs_fix&select=*&order=updated_at.desc&limit=1`);
  return rows?.[0]||null;
}
export default async function handler(req,res){
  try{ rateLimit(req,'fix.js',40,60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  if(req.method!=='POST') return json(res,405,{ok:false,error:'Method not allowed'});
  try{
    const raw=await readRawBody(req); const {fields,files}=parseMultipart(raw,req.headers['content-type']);
    const phone=String(fields.phone||'').trim();
    const fixType=String(fields.fixType||'').trim();
    if(!/^01\d{9}$/.test(phone)) return json(res,400,{ok:false,error:'اكتب رقم موبايل صحيح'});
    const order=await getLatestFixOrder(phone);
    if(!order) return json(res,404,{ok:false,error:'مفيش طلب محتاج تعديل على الرقم ده'});
    if(Number(order.fix_attempts||0)>=1) return json(res,409,{ok:false,error:'تم استخدام فرصة التعديل بالفعل. تواصل مع الدعم: '+supportUrl()});
    if(order.fix_type && fixType && order.fix_type!==fixType) return json(res,400,{ok:false,error:'نوع التعديل غير مطابق للطلب'});
    let fixText='';
    const payload={};
    if(order.fix_type==='badshot'){
      if(!files.screenshot || files.screenshot.buffer.length<50) return json(res,400,{ok:false,error:'ارفع سكرين تحويل واضح'});
      fixText='📸 تم رفع سكرين جديد من العميل';
    }else if(order.fix_type==='badid'){
      const newData=String(fields.newIdData||'').trim();
      if(newData.length<5) return json(res,400,{ok:false,error:'اكتب ID واسم الحساب الصحيح'});
      fixText=`🆔 تعديل ID من العميل:\n${newData}`;
      payload.fix_payload={newIdData:newData};
    }else if(order.fix_type==='badphone'){
      const newPhone=String(fields.newPhone||'').trim();
      if(!/^01\d{9}$/.test(newPhone)) return json(res,400,{ok:false,error:'اكتب رقم موبايل صحيح'});
      fixText=`📱 تعديل رقم المتابعة من العميل: ${newPhone}`;
      payload.phone=newPhone; payload.customer_phone=newPhone; payload.fix_payload={newPhone};
    }else{
      const note=String(fields.fixNote||'').trim();
      if(note.length<3) return json(res,400,{ok:false,error:'اكتب التعديل المطلوب'});
      fixText=`⚠️ تعديل من العميل:\n${note}`;
      payload.fix_payload={note};
    }
    const history=Array.isArray(order.status_history)?order.status_history:[];
    history.push({status:'pending',label:'✅ تم استلام التعديل من العميل للمراجعة',at:new Date().toISOString(),by:'customer'});
    const adminNote=[order.internal_note||'', fixText].filter(Boolean).join('\n\n');
    Object.assign(payload,{status:'pending',status_text:STATUS_LABELS.pending,customer_status_text:'✅ تم استلام التعديل من العميل للمراجعة',admin_status_text:'تم استلام تعديل من العميل',fix_attempts:Number(order.fix_attempts||0)+1,fix_submitted_at:new Date().toISOString(),internal_note:adminNote,status_history:history,updated_at:new Date().toISOString()});
    await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
    const groupId=order.telegram_chat_id||process.env.ORDER_GROUP_ID;
    if(groupId && order.telegram_message_id){
      await telegramJson('sendMessage',{chat_id:groupId,reply_to_message_id:order.telegram_message_id,text:`✅ تم استلام تعديل من العميل\n🧾 الطلب: ${order.order_code||order.id}\n${fixText}`});
      if(order.fix_type==='badshot' && files.screenshot){
        const pf=new FormData(); pf.append('chat_id',groupId); pf.append('reply_to_message_id',String(order.telegram_message_id)); pf.append('caption',`📸 Screenshot جديد للطلب ${order.order_code||order.id}`); pf.append('photo',new Blob([files.screenshot.buffer],{type:files.screenshot.contentType}),files.screenshot.filename||'new_screenshot.jpg');
        await telegramForm('sendPhoto',pf);
      }
      const rows=await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}&select=*&limit=1`).catch(()=>[]);
      const updated=rows?.[0];
      if(updated) await telegramJson('editMessageText',{chat_id:groupId,message_id:order.telegram_message_id,text:buildTelegramText(updated),parse_mode:'HTML',reply_markup:telegramKeyboard(order.id,updated.status)});
    }
    return json(res,200,{ok:true,message:'تم إرسال التعديل بنجاح'});
  }catch(error){return json(res,500,{ok:false,error:error.message||'Server error'});}
}
