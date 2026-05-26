import { json, supabaseReady, supabaseRequest } from '../lib/_utils.js';
import { rateLimit, getClientIp, safeError } from '../lib/_security.js';

export default async function handler(req,res){
  try{ rateLimit(req,'client-log',20,60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  try{
    if(req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const entry = {at:new Date().toISOString(),ip:getClientIp(req),ua:String(req.headers['user-agent']||'').slice(0,180),page:String(body.page||'site').slice(0,50),message:String(body.message||'').slice(0,400),source:String(body.source||'').slice(0,180),lineno:body.lineno||0,colno:body.colno||0,stack:String(body.stack||'').slice(0,1000)};
    if(supabaseReady()){
      const key='client_error_logs';
      const rows=await supabaseRequest(`settings?key=eq.${key}&select=value&limit=1`).catch(()=>[]);
      let list=[];try{list=rows?.[0]?.value?JSON.parse(rows[0].value):[]}catch{}
      list.unshift(entry); list=list.slice(0,100);
      await supabaseRequest('settings',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([{key,value:JSON.stringify(list),updated_at:new Date().toISOString()}])}).catch(()=>null);
    }
    return json(res,200,{ok:true});
  }catch(e){ return safeError(res,e,e.statusCode||500); }
}
