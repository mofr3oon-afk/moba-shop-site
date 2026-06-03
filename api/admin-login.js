import { json } from '../lib/_utils.js';
import { rateLimit, persistentRateLimit, safeError } from '../lib/_security.js';
import { currentAdminSession, setSessionCookie, makeSession, checkFailedLock, recordLoginAttempt, getAdminSecret, timingSafeEquals, otpEnabled, createOtpChallenge, verifyOtp, sendAdminTelegram, logAdminEvent, resolveAdminRole, readTrustedAdminSettings, shouldForceOtpForDevice, trustAdminDevice } from '../lib/admin-auth.js';

async function readBody(req){
  return await new Promise((resolve,reject)=>{let s=''; req.on('data',c=>s+=c); req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}}); req.on('error',reject);});
}
export default async function handler(req,res){
  try{
    rateLimit(req,'admin-login',20,15*60_000);
    await persistentRateLimit(req,'admin-login-persistent',30,15*60_000);
    if(req.method === 'GET'){
      const s = currentAdminSession(req);
      return json(res,200,{ok:true,authenticated:!!s,session:s?{role:s.role,exp:s.exp,ip:s.ip}:null,otpEnabled:otpEnabled()});
    }
    if(req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    checkFailedLock(req);
    const body = await readBody(req);
    const expected = getAdminSecret();
    if(!expected) return json(res,500,{ok:false,error:'ADMIN_PANEL_SECRET غير موجود في Vercel'});
    const deviceId = String(body.deviceId || '').slice(0,120);
    const trustDevice = Boolean(body.trustDevice);

    if(body.challenge){
      const okOtp = verifyOtp(body.challenge, body.otp);
      recordLoginAttempt(req, okOtp);
      if(!okOtp){ await logAdminEvent('otp_failed',req,{deviceId}); return json(res,401,{ok:false,error:'كود التحقق غلط أو انتهى'}); }
      const role = String(body.role || 'owner');
      setSessionCookie(res, makeSession(req,{role,deviceId}));
      if(trustDevice && deviceId) await trustAdminDevice(deviceId, req);
      await logAdminEvent('login_success_otp',req,{role,deviceId});
      return json(res,200,{ok:true,authenticated:true});
    }

    const username = String(body.username || '').trim();
    const password = String(body.password || body.secret || '');
    const allowedUsers = ['okatoka','Bobo','jojo'];
    if(!username || !allowedUsers.map(x=>x.toLowerCase()).includes(username.toLowerCase())){
      recordLoginAttempt(req, false);
      await logAdminEvent('login_failed_username',req,{username,deviceId});
      return json(res,401,{ok:false,error:'اسم المستخدم غير مسموح'});
    }
    const role = resolveAdminRole(password);
    const ok = Boolean(role);
    recordLoginAttempt(req, ok);
    if(!ok){ await logAdminEvent('login_failed',req,{deviceId}); return json(res,401,{ok:false,error:'مفتاح الأدمن غلط'}); }
    const trusted = await readTrustedAdminSettings();
    const needsOtp = shouldForceOtpForDevice({deviceId, ip:req.headers['x-forwarded-for'], trusted});
    if(needsOtp){
      const {challenge,code} = createOtpChallenge(req);
      await sendAdminTelegram(`🔐 <b>MOBA SHOP Admin Login Code</b>
الكود: <code>${code}</code>
الصلاحية: <b>${role}</b>
Device: <code>${deviceId || '-'}</code>
ينتهي خلال 5 دقائق.`);
      await logAdminEvent('otp_sent',req,{role,deviceId});
      return json(res,200,{ok:true,needsOtp:true,challenge,role,message:'تم إرسال كود الدخول على تليجرام'});
    }
    setSessionCookie(res, makeSession(req,{role,deviceId}));
    await logAdminEvent('login_success',req,{role,deviceId});
    return json(res,200,{ok:true,authenticated:true,role});
  }catch(e){ return safeError(res,e,e.statusCode||500); }
}
