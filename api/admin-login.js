import { json, escapeHtml } from '../lib/_utils.js';
import { readJsonBody } from '../lib/request-body.js';
import { rateLimit, persistentRateLimit, safeError } from '../lib/_security.js';
import { currentAdminSession, setSessionCookie, clearSessionCookie, makeSession, checkFailedLock, recordLoginAttempt, getAdminSecret, timingSafeEquals, otpEnabled, createOtpChallenge, verifyOtp, sendAdminTelegram, logAdminEvent, shouldForceOtpForDevice, isAllowedAdminUsername } from '../lib/admin-auth.js';

const LOGIN_ERROR = 'بيانات الدخول غير صحيحة';
export const config = { api:{bodyParser:false} };
const LOGIN_LOCK_ERROR = 'محاولات كثيرة، جرب بعد قليل';

export default async function handler(req,res){
  try{
    rateLimit(req,'admin-login',20,15*60_000);
    await persistentRateLimit(req,'admin-login-persistent',30,15*60_000);
    if(req.method === 'GET'){
      const s = currentAdminSession(req);
      return json(res,200,{ok:true,authenticated:!!s,session:s?{role:s.role,username:s.username,deviceId:s.deviceId,exp:s.exp,ip:s.ip}:null,otpEnabled:otpEnabled()});
    }
    if(req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    if(!/^application\/json(?:\s*;|$)/i.test(String(req.headers['content-type']||'')))return json(res,415,{ok:false,error:'JSON request required'});
    if(req.headers.origin&&new URL(req.headers.origin).host!==String(req.headers.host||''))return json(res,403,{ok:false,error:'مصدر الطلب غير مسموح'});
    const body = await readJsonBody(req);
    if(body.action === 'logout'){
      clearSessionCookie(res);
      await logAdminEvent('logout',req,{});
      return json(res,200,{ok:true});
    }
    checkFailedLock(req);
    const expected = getAdminSecret();
    if(!expected) return json(res,500,{ok:false,error:'حصلت مشكلة مؤقتة، جرب مرة تانية أو تواصل مع الدعم.'});
    const deviceId = String(body.deviceId || '').slice(0,120);

    if(body.challenge){
      const verified = await verifyOtp(req,body.challenge,body.otp);
      const okOtp = Boolean(verified&&isAllowedAdminUsername(verified.username));
      recordLoginAttempt(req, okOtp);
      if(!okOtp){ await logAdminEvent('otp_failed',req,{deviceId}); return json(res,401,{ok:false,error:LOGIN_ERROR}); }
      const {role,username,deviceId:verifiedDeviceId} = verified;
      const session = makeSession(req,{role,username,deviceId:verifiedDeviceId});
      setSessionCookie(res, session);
      await logAdminEvent('login_success_otp',req,{role,username,deviceId});
      return json(res,200,{ok:true,authenticated:true,session});
    }

    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || body.secret || '');
    if(!isAllowedAdminUsername(username)){
      recordLoginAttempt(req, false);
      await logAdminEvent('login_failed',req,{deviceId});
      return json(res,401,{ok:false,error:LOGIN_ERROR});
    }
    const role = 'owner';
    const ok = timingSafeEquals(password,expected);
    recordLoginAttempt(req, ok);
    if(!ok){ await logAdminEvent('login_failed',req,{deviceId}); return json(res,401,{ok:false,error:LOGIN_ERROR}); }
    const needsOtp = shouldForceOtpForDevice();
    if(needsOtp){
      const {challenge,code} = await createOtpChallenge(req,{role,username,deviceId});
      let delivery;
      try{delivery=await sendAdminTelegram(`🔐 <b>MOBA SHOP Admin Login Code</b>
الكود: <code>${code}</code>
المستخدم: <b>${escapeHtml(username)}</b>
الصلاحية: <b>${role}</b>
Device: <code>${escapeHtml(deviceId || '-')}</code>
ينتهي خلال 5 دقائق.`);}catch(error){
        await logAdminEvent('otp_delivery_failed',req,{username,reason:error.reason||'unavailable'});
        throw error;
      }
      await logAdminEvent('otp_sent',req,{role,username,deviceId,accepted:delivery.accepted,recipients:delivery.total});
      return json(res,200,{ok:true,needsOtp:true,challenge,role,message:'تم إرسال كود الدخول على تليجرام'});
    }
    const session = makeSession(req,{role,username,deviceId});
    setSessionCookie(res, session);
    await logAdminEvent('login_success',req,{role,username,deviceId});
    return json(res,200,{ok:true,authenticated:true,role,session});
  }catch(e){
    if(e.statusCode === 429) return json(res,429,{ok:false,error:LOGIN_LOCK_ERROR});
    if(['OTP_DELIVERY_NOT_CONFIGURED','OTP_DELIVERY_FAILED'].includes(e.code))return json(res,503,{ok:false,code:e.code,error:'تعذر إرسال كود التحقق على تليجرام. راجع إعدادات البوت وحساب الاستقبال.'});
    return safeError(res,e,e.statusCode||500);
  }
}
