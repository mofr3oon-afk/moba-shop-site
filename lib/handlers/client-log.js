import { json, supabaseReady, supabaseRequest } from '../_utils.js';
import { rateLimit, getClientIp, safeError } from '../_security.js';

function normalizeValue(v){
  if(typeof v === 'string'){
    const t=v.trim();
    if((t.startsWith('[')&&t.endsWith(']'))||(t.startsWith('{')&&t.endsWith('}'))){ try{return JSON.parse(t)}catch{} }
  }
  return v;
}
function ipMatches(ip, list=[]){
  const value=String(ip||'').trim();
  if(!value) return false;
  return (Array.isArray(list)?list:[]).some(x=>{
    const rule=String(x||'').trim();
    if(!rule) return false;
    if(rule===value) return true;
    if(rule.endsWith('*')) return value.startsWith(rule.slice(0,-1));
    return false;
  });
}
async function readSetting(key){
  if(!supabaseReady()) return null;
  const rows=await supabaseRequest(`settings?key=eq.${encodeURIComponent(key)}&select=value&limit=1`).catch(()=>[]);
  return normalizeValue(rows?.[0]?.value);
}

export default async function handler(req,res){
  try{ rateLimit(req,'client-log',100,60_000); }catch(e){ return safeError(res,e,e.statusCode||429); }
  try{
    if(req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const ip=getClientIp(req);
    const ua=String(req.headers['user-agent']||'').slice(0,180);
    if(body.type === 'visitor_ping'){
      const blockedIps=await readSetting('blacklist_ips').catch(()=>[]);
      if(ipMatches(ip, blockedIps)){
        return json(res,403,{ok:false,blocked:true,error:'تم حظر هذا الجهاز من استخدام الموقع. تواصل مع الدعم لو تعتقد إن ده حصل بالخطأ.'});
      }
      const now=new Date().toISOString();
      const rawId=String(body.deviceId||'').replace(/[^a-zA-Z0-9_:-]/g,'').slice(0,80);
      const id=rawId || ('ip_'+Buffer.from((ip||'unknown')+'|'+ua).toString('base64').replace(/[^a-zA-Z0-9]/g,'').slice(0,40));
      let presence={};
      if(supabaseReady()){
        const key='visitor_presence';
        const rows=await supabaseRequest(`settings?key=eq.${key}&select=value&limit=1`).catch(()=>[]);
        try{presence=rows?.[0]?.value?JSON.parse(rows[0].value):{}}catch{presence={}}
        const cutoff=Date.now()-5*60*1000;
        for(const [k,v] of Object.entries(presence||{})){
          const t=Date.parse(v?.at||0);
          if(!t || t<cutoff) delete presence[k];
        }
        presence[id]={at:now,ip,ua,page:String(body.page||'site').slice(0,80)};
        await supabaseRequest('settings',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([{key,value:JSON.stringify(presence),updated_at:now}])}).catch(()=>null);
      }
      const active=Object.values(presence||{}).filter(v=>Date.now()-Date.parse(v?.at||0)<2*60*1000).length;
      return json(res,200,{ok:true,activeVisitors:active});
    }
    const entry = {at:new Date().toISOString(),ip,ua,page:String(body.page||'site').slice(0,50),message:String(body.message||'').slice(0,400),source:String(body.source||'').slice(0,180),lineno:body.lineno||0,colno:body.colno||0,stack:String(body.stack||'').slice(0,1000)};
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
