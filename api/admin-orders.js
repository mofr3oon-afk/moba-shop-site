import { json, supabaseReady, supabaseRequest, STATUS_LABELS, OPEN_STATUSES } from '../lib/_utils.js';
import { rateLimit, safeError } from '../lib/_security.js';
import { requireAdmin, requireRole, logAdminEvent } from '../lib/admin-auth.js';

function orderByRecent(a,b){ return new Date(b.created_at||0)-new Date(a.created_at||0); }

export default async function handler(req,res){
  let admin;
  try{ rateLimit(req,'admin-orders',60,60_000); admin=requireAdmin(req); }
  catch(e){ return safeError(res,e,e.statusCode||401); }
  try{
    if(!supabaseReady()) return json(res,200,{ok:false,error:'Supabase غير مفعل'});
    if(req.method === 'GET'){
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
      const patch={status,status_text:STATUS_LABELS[status]||status,admin_status_text:STATUS_LABELS[status]||status,customer_status_text:STATUS_LABELS[status]||status,last_status_by: adminName,last_status_at:new Date().toISOString(),updated_at:new Date().toISOString(),status_history:history.slice(-50)};
      if(status === 'claimed' || status === 'processing') patch.handler = adminName;
      if(status === 'pending' && /إلغاء استلام|Unclaim/i.test(note)) patch.handler = null;
      if(status === 'needs_fix'){
        if(/سكرين/i.test(note)) patch.fix_type='bad_screen';
        else if(/ID|ايدي|أيدي/i.test(note)) patch.fix_type='bad_id';
        else if(/رقم|موبايل|فون/i.test(note)) patch.fix_type='bad_phone';
        else patch.fix_type='general';
      }
      if(note) patch.note = String(order.note||'') + `\n[Admin Panel] ${note}`;
      const updated=await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(patch)});
      await logAdminEvent('order_status_update', req, {orderId:id,status,note}).catch(()=>null);
      return json(res,200,{ok:true,order:updated&&updated[0]});
    }
    return json(res,405,{ok:false,error:'Method not allowed'});
  }catch(e){ return json(res,500,{ok:false,error:String(e.message||e)}); }
}
