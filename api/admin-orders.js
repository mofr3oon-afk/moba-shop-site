import { json, supabaseReady, supabaseRequest, STATUS_LABELS, OPEN_STATUSES } from '../lib/_utils.js';
import { rateLimit, safeError } from '../lib/_security.js';
import { requireAdmin, requireRole, logAdminEvent } from '../lib/admin-auth.js';

function orderByRecent(a,b){ return new Date(b.created_at||0)-new Date(a.created_at||0); }
function issueTypeFromNote(note){
  const t=String(note||'');
  if(/screen|shot|screenshot|سكرين|صورة/i.test(t)) return 'bad_screen';
  if(/amount|price|money|paid|مبلغ|فلوس|ناقص|دفع|تحويل/i.test(t)) return 'bad_amount';
  if(/\bID\b|ايدي|أيدي|اى دى|اي دي|حساب/i.test(t)) return 'bad_id';
  if(/phone|mobile|رقم|موبايل|فون/i.test(t)) return 'bad_phone';
  return 'general';
}
function customerStatusText(status,note){
  if(status === 'needs_fix'){
    const type=issueTypeFromNote(note);
    return ({
      bad_screen:'السكرين غير واضح. ارفع سكرين تحويل أوضح يظهر فيه المبلغ والرقم ووقت التحويل.',
      bad_amount:'المبلغ غير مطابق للطلب. راجع التحويل أو تواصل مع الدعم لتأكيد الفرق.',
      bad_id:'ID أو اسم الحساب محتاج تعديل. اكتب البيانات الصحيحة قبل التنفيذ.',
      bad_phone:'رقم المتابعة محتاج تعديل. اكتب رقم موبايل صحيح يبدأ بـ 01.',
      general: note || 'الطلب محتاج تعديل. راجع البيانات واكتب التعديل المطلوب.'
    })[type];
  }
  if(status === 'on_hold') return note || 'الطلب متوقف مؤقتا للمراجعة. تابع الحالة أو تواصل مع الدعم.';
  if(status === 'cancelled') return note || 'تم إلغاء الطلب. لو محتاج مساعدة تواصل مع الدعم.';
  return STATUS_LABELS[status] || status;
}

function missingColumnFromSupabaseError(err){
  const msg=String(err?.message||err||'');
  const m=msg.match(/Could not find the '([^']+)' column/i) || msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+.*does not exist/i);
  return m ? m[1] : '';
}
async function supabasePatchWithSchemaFallback(path, patch){
  const clean={...(patch||{})};
  for(let i=0;i<10;i++){
    try{return await supabaseRequest(path,{method:'PATCH',body:JSON.stringify(clean)});}catch(err){
      const col=missingColumnFromSupabaseError(err);
      if(col && Object.prototype.hasOwnProperty.call(clean,col)){delete clean[col];continue;}
      throw err;
    }
  }
  return await supabaseRequest(path,{method:'PATCH',body:JSON.stringify(clean)});
}
async function streamTelegramPhoto(res,fileId){
  if(!process.env.BOT_TOKEN) return json(res,500,{ok:false,error:'BOT_TOKEN missing'});
  const meta=await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`).then(r=>r.json()).catch(()=>null);
  const filePath=meta?.result?.file_path;
  if(!filePath) return json(res,404,{ok:false,error:'screenshot not found'});
  const img=await fetch(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`);
  if(!img.ok) return json(res,404,{ok:false,error:'cannot load screenshot'});
  const buf=Buffer.from(await img.arrayBuffer());
  res.statusCode=200;
  res.setHeader('Content-Type', img.headers.get('content-type') || 'image/jpeg');
  res.setHeader('Cache-Control','private, max-age=120');
  return res.end(buf);
}


export default async function handler(req,res){
  let admin;
  try{ rateLimit(req,'admin-orders',60,60_000); admin=requireAdmin(req); }
  catch(e){ return safeError(res,e,e.statusCode||401); }
  try{
    if(!supabaseReady()) return json(res,200,{ok:false,error:'Supabase غير مفعل'});
    if(req.method === 'GET'){
      const screenshotId = String(req.query?.screenshot || '').trim();
      if(screenshotId) return await streamTelegramPhoto(res, screenshotId);
      const status = String(req.query?.status || '').trim();
      const q = String(req.query?.q || '').trim();
      const limit = Math.min(150, Math.max(20, Number(req.query?.limit || 80)));
      let path = `orders?select=*&order=created_at.desc&limit=${limit}`;
      if(status && status !== 'all') path = `orders?status=eq.${encodeURIComponent(status)}&select=*&order=created_at.desc&limit=${limit}`;
      let rows = await supabaseRequest(path).catch(()=>[]);
      if(q){
        const low=q.toLowerCase();
        rows=(rows||[]).filter(o=>String(o.order_code||o.id||'').toLowerCase().includes(low) || String(o.phone||'').includes(q) || JSON.stringify(o.items||[]).toLowerCase().includes(low));
      }
      const open=(rows||[]).filter(o=>OPEN_STATUSES.includes(String(o.status||''))).length;
      return json(res,200,{ok:true,orders:(rows||[]).sort(orderByRecent),meta:{count:(rows||[]).length,open,labels:STATUS_LABELS}});
    }
    if(req.method === 'POST'){
      requireRole(admin, ['owner','staff']);
      const body = await new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}});req.on('error',reject);});
      const id=String(body.id||'').trim();
      const status=String(body.status||'').trim();
      const note=String(body.note||'').trim();
      if(!id || !status) return json(res,400,{ok:false,error:'بيانات ناقصة'});
      const allowed=['pending','claimed','processing','delivered','on_hold','needs_fix','rejected','cancelled','archived'];
      if(!allowed.includes(status)) return json(res,400,{ok:false,error:'حالة غير صحيحة'});
      const rows=await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}&select=*`);
      const order=rows&&rows[0];
      if(!order) return json(res,404,{ok:false,error:'الطلب غير موجود'});
      const history=Array.isArray(order.status_history)?order.status_history:[];
      history.push({status,label:STATUS_LABELS[status]||status,at:new Date().toISOString(),by:'admin_panel',role:admin?.role||'owner'});
      const adminName = admin?.role === 'owner' ? 'Owner' : 'Staff';
      const customerText=customerStatusText(status,note);
      const patch={status,status_text:STATUS_LABELS[status]||status,admin_status_text:STATUS_LABELS[status]||status,customer_status_text:customerText,last_status_by: adminName,last_status_at:new Date().toISOString(),updated_at:new Date().toISOString(),status_history:history.slice(-50)};
      if(status === 'claimed' || status === 'processing') patch.handler = adminName;
      if(status === 'pending' && /إلغاء استلام|Unclaim/i.test(note)) patch.handler = null;
      if(status === 'needs_fix') patch.fix_type=issueTypeFromNote(note);
      if(note) patch.note = String(order.note||'').trim() ? String(order.note||'').trim() + `\n${note}` : note;
      const updated=await supabasePatchWithSchemaFallback(`orders?id=eq.${encodeURIComponent(id)}`, patch);
      await logAdminEvent('order_status_update', req, {orderId:id,status,note}).catch(()=>null);
      return json(res,200,{ok:true,order:updated&&updated[0]});
    }
    return json(res,405,{ok:false,error:'Method not allowed'});
  }catch(e){ return safeError(res,e,e.statusCode||500); }
}
