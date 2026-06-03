import crypto from 'crypto';
import { json, supabaseReady, supabaseRequest } from './_utils.js';
import { getClientIp } from './_security.js';

const SESSION_COOKIE = 'moba_admin_session';
const SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || 8 * 60 * 60);
const failedMap = globalThis.__MOBA_ADMIN_FAILED__ || new Map();
const otpMap = globalThis.__MOBA_ADMIN_OTP__ || new Map();
globalThis.__MOBA_ADMIN_FAILED__ = failedMap;
globalThis.__MOBA_ADMIN_OTP__ = otpMap;

function secretKey(){
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PANEL_SECRET || process.env.SETUP_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || '';
}
export function getAdminSecret(){
  return process.env.ADMIN_PANEL_SECRET || process.env.SETUP_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || '';
}
export function parseCookies(req){
  const raw = String(req.headers.cookie || '');
  const out = {};
  raw.split(';').forEach(part=>{
    const i = part.indexOf('=');
    if(i > -1) out[part.slice(0,i).trim()] = decodeURIComponent(part.slice(i+1).trim());
  });
  return out;
}
function sign(payload){
  const key = secretKey();
  if(!key) throw new Error('ADMIN_SESSION_SECRET missing');
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', key).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}
function verify(token){
  try{
    const key = secretKey();
    if(!key || !token || !token.includes('.')) return null;
    const [b64,sig] = token.split('.');
    const good = crypto.createHmac('sha256', key).update(b64).digest('base64url');
    if(!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
    const payload = JSON.parse(Buffer.from(b64,'base64url').toString('utf8'));
    if(!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  }catch(e){ return null; }
}
export function setSessionCookie(res, session){
  const token = sign(session);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`);
}
export function clearSessionCookie(res){
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}
export function currentAdminSession(req){
  return verify(parseCookies(req)[SESSION_COOKIE]);
}
export function requireAdmin(req){
  const s = currentAdminSession(req);
  if(!s){ const err = new Error('غير مصرح. سجل دخولك للوحة الأدمن الأول.'); err.statusCode = 401; throw err; }
  return s;
}
export function makeSession(req, extra={}){
  const ip = getClientIp(req) || 'unknown';
  const ua = String(req.headers['user-agent'] || '').slice(0,180);
  const role = extra.role || 'owner';
  const deviceId = String(extra.deviceId || '').slice(0,120);
  return {role, deviceId, ip, ua, iat:Date.now(), exp:Date.now() + SESSION_TTL_SECONDS * 1000};
}
export function checkFailedLock(req){
  const ip = getClientIp(req) || 'unknown';
  const now = Date.now();
  const b = failedMap.get(ip);
  if(b && b.lockUntil && now < b.lockUntil){
    const err = new Error('محاولات دخول كتير غلط. جرب بعد شوية.');
    err.statusCode = 429;
    throw err;
  }
}
export function recordLoginAttempt(req, ok){
  const ip = getClientIp(req) || 'unknown';
  const now = Date.now();
  let b = failedMap.get(ip) || {count:0, first:now, lockUntil:0};
  if(ok){ failedMap.delete(ip); return; }
  if(now - b.first > 15*60*1000) b = {count:0, first:now, lockUntil:0};
  b.count++;
  if(b.count >= 5) b.lockUntil = now + 15*60*1000;
  if(b.count >= 10) b.lockUntil = now + 60*60*1000;
  failedMap.set(ip,b);
}
export function timingSafeEquals(a,b){
  a = String(a||''); b = String(b||'');
  const A = Buffer.from(a); const B = Buffer.from(b);
  if(A.length !== B.length) return false;
  return crypto.timingSafeEqual(A,B);
}

export function resolveAdminRole(secret){
  const s = String(secret || '');
  const owner = getAdminSecret();
  const staff = process.env.ADMIN_STAFF_SECRET || '';
  const viewer = process.env.ADMIN_VIEWER_SECRET || '';
  if(owner && timingSafeEquals(s, owner)) return 'owner';
  if(staff && timingSafeEquals(s, staff)) return 'staff';
  if(viewer && timingSafeEquals(s, viewer)) return 'viewer';
  return '';
}
export function requireRole(session, roles=['owner']){
  if(!session || !roles.includes(String(session.role||''))){
    const err = new Error('صلاحيتك لا تسمح بتنفيذ الإجراء ده.');
    err.statusCode = 403;
    throw err;
  }
  return true;
}
export async function readTrustedAdminSettings(){
  try{
    if(!supabaseReady()) return {devices:[],ips:[]};
    const rows = await supabaseRequest('settings?key=in.(trusted_admin_devices,trusted_admin_ips)&select=key,value').catch(()=>[]);
    const out={devices:[],ips:[]};
    for(const r of rows||[]){
      let v=r.value;
      if(typeof v==='string'){
        const t=v.trim();
        if(t.startsWith('[')){try{v=JSON.parse(t)}catch(e){v=[]}}
        else v=t.split(',').map(x=>x.trim()).filter(Boolean);
      }
      if(r.key==='trusted_admin_devices') out.devices=Array.isArray(v)?v:[];
      if(r.key==='trusted_admin_ips') out.ips=Array.isArray(v)?v:[];
    }
    return out;
  }catch(e){return {devices:[],ips:[]}}
}
export async function trustAdminDevice(deviceId, req){
  try{
    if(!supabaseReady() || !deviceId) return;
    const current = await readTrustedAdminSettings();
    const devices = Array.from(new Set([...(current.devices||[]), String(deviceId).slice(0,120)]));
    const row={key:'trusted_admin_devices',value:JSON.stringify(devices),updated_at:new Date().toISOString()};
    await supabaseRequest('settings',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(row)}).catch(()=>null);
  }catch(e){}
}
export function shouldForceOtpForDevice({deviceId, ip, trusted}){
  if(String(process.env.ADMIN_LOGIN_OTP || '').toLowerCase() === 'false') return false;
  if(otpEnabled()) return true;
  if(!process.env.ADMIN_LOGIN_OTP) return true;
  const strict = String(process.env.ADMIN_DEVICE_APPROVAL || '').toLowerCase();
  if(strict !== 'true' && strict !== '1') return false;
  const dOk = deviceId && (trusted.devices||[]).includes(String(deviceId));
  const ipOk = ip && (trusted.ips||[]).includes(String(ip));
  return !(dOk || ipOk);
}
export function otpEnabled(){ return String(process.env.ADMIN_LOGIN_OTP || '').toLowerCase() === '1' || String(process.env.ADMIN_LOGIN_OTP || '').toLowerCase() === 'true'; }
export function createOtpChallenge(req){
  const challenge = crypto.randomUUID();
  const code = String(Math.floor(100000 + Math.random()*900000));
  otpMap.set(challenge,{code,ip:getClientIp(req)||'unknown',exp:Date.now()+5*60*1000,tries:0});
  return {challenge,code};
}
export function verifyOtp(challenge, code){
  const r = otpMap.get(String(challenge||''));
  if(!r || Date.now() > r.exp) return false;
  r.tries++;
  if(r.tries > 5){ otpMap.delete(String(challenge)); return false; }
  const ok = timingSafeEquals(String(code||''), String(r.code));
  if(ok) otpMap.delete(String(challenge));
  return ok;
}
export async function sendAdminTelegram(text){
  const token = process.env.BOT_TOKEN;
  const ids = String(process.env.ADMIN_IDS || process.env.ADMIN_CHAT_ID || '').split(',').map(x=>x.trim()).filter(Boolean);
  if(!token || !ids.length) return false;
  await Promise.all(ids.map(chat_id => fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id,text,parse_mode:'HTML'})
  }).catch(()=>null)));
  return true;
}
export async function logAdminEvent(type, req, extra={}){
  try{
    if(!supabaseReady()) return;
    const row = {key:`admin_log_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, value:JSON.stringify({type,ip:getClientIp(req),ua:String(req.headers['user-agent']||''),at:new Date().toISOString(),...extra}), updated_at:new Date().toISOString()};
    await supabaseRequest('settings',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(row)}).catch(()=>null);
  }catch(e){}
}
export function adminError(res, err){
  return json(res, err.statusCode || 500, {ok:false,error:err.message || 'خطأ في لوحة الأدمن'});
}
