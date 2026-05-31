import crypto from 'node:crypto';

export function json(res,status,obj){
  try{
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.status(status).json(obj);
  }catch(e){
    res.status(status).end(JSON.stringify(obj));
  }
}

export function safeError(res, err, status=500){
  console.error('[SECURE_ERROR]', err && (err.stack || err.message || err));
  return json(res,status,{ok:false,error:'حصل خطأ مؤقت. حاول تاني أو تواصل مع الدعم.'});
}

export function getClientIp(req){
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}

const mem = globalThis.__MOBA_RATE_LIMIT__ || new Map();
globalThis.__MOBA_RATE_LIMIT__ = mem;

export function rateLimit(req, key='global', limit=30, windowMs=60_000){
  const ip = getClientIp(req) || 'unknown';
  const id = `${key}:${ip}`;
  const now = Date.now();
  const bucket = mem.get(id) || {count:0, reset:now+windowMs};
  if(now > bucket.reset){
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }
  bucket.count++;
  mem.set(id,bucket);
  if(bucket.count > limit){
    const err = new Error('RATE_LIMITED');
    err.statusCode = 429;
    throw err;
  }
}

function supabaseReady(){
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseSettingsUpsert(row){
  const url = `${process.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/settings`;
  const response = await fetch(url,{
    method:'POST',
    headers:{
      apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'resolution=merge-duplicates,return=representation'
    },
    body:JSON.stringify(row)
  });
  if(!response.ok) throw new Error('PERSISTENT_RATE_LIMIT_FAILED');
  return response.json().catch(()=>null);
}

async function supabaseSettingsRead(key){
  const url = `${process.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/settings?key=eq.${encodeURIComponent(key)}&select=value&limit=1`;
  const response = await fetch(url,{
    headers:{
      apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json'
    }
  });
  if(!response.ok) return null;
  const rows = await response.json().catch(()=>[]);
  return rows?.[0]?.value || null;
}

export async function persistentRateLimit(req, key='global', limit=30, windowMs=60_000){
  if(!supabaseReady()) return false;
  const ip = getClientIp(req) || 'unknown';
  const hash = crypto.createHash('sha256').update(`${key}:${ip}`).digest('hex').slice(0,32);
  const settingKey = `rl_${hash}`;
  const now = Date.now();
  let bucket = null;
  const raw = await supabaseSettingsRead(settingKey).catch(()=>null);
  try{ bucket = typeof raw === 'string' ? JSON.parse(raw) : raw; }catch{ bucket = null; }
  if(!bucket || now > Number(bucket.reset || 0)){
    bucket = {count:0, reset:now + windowMs};
  }
  bucket.count = Number(bucket.count || 0) + 1;
  bucket.key = key;
  bucket.updated_at = new Date().toISOString();
  await supabaseSettingsUpsert({key:settingKey,value:JSON.stringify(bucket),updated_at:new Date().toISOString()}).catch(()=>null);
  if(bucket.count > limit){
    const err = new Error('RATE_LIMITED');
    err.statusCode = 429;
    throw err;
  }
  return true;
}

export function isAdminId(id){
  const admins = String(process.env.ADMIN_IDS || '').split(',').map(x=>x.trim()).filter(Boolean);
  return admins.includes(String(id));
}

export function requireSetupSecret(req){
  const expected = process.env.SETUP_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || '';
  const got = String(req.query?.key || req.headers['x-setup-secret'] || '');
  if(!expected || got !== expected){
    const err = new Error('UNAUTHORIZED_SETUP');
    err.statusCode = 401;
    throw err;
  }
}

export function requireInternalSecret(req){
  const expected = process.env.INTERNAL_API_SECRET || process.env.SETUP_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || '';
  const cronSecret = process.env.CRON_SECRET || '';
  const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i,'');
  const got = String(req.query?.key || req.headers['x-internal-secret'] || auth || '');
  const ok = (expected && got === expected) || (cronSecret && got === cronSecret);
  if(!ok){
    const err = new Error('UNAUTHORIZED_INTERNAL');
    err.statusCode = 401;
    throw err;
  }
}

export function requireTelegramSecret(req){
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  const got = String(req.query?.secret || req.headers['x-telegram-bot-api-secret-token'] || '');
  const allowUnsecured = String(process.env.ALLOW_UNSECURED_TELEGRAM_WEBHOOK || '').toLowerCase();
  if(!expected && allowUnsecured !== 'true' && allowUnsecured !== '1'){
    const err = new Error('TELEGRAM_WEBHOOK_SECRET_MISSING');
    err.statusCode = 401;
    throw err;
  }
  if(expected && got !== expected){
    const err = new Error('BAD_TELEGRAM_SECRET');
    err.statusCode = 401;
    throw err;
  }
}

export function validatePhone(phone){
  const p = String(phone || '').trim();
  if(!/^01[0-9]{9}$/.test(p)){
    const err = new Error('رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01');
    err.statusCode = 400;
    throw err;
  }
  return p;
}

export function validatePubgId(id){
  const v = String(id || '').trim();
  if(!/^[0-9]{5,15}$/.test(v)){
    const err = new Error('PUBG ID لازم يكون أرقام فقط من 5 لـ 15 رقم');
    err.statusCode = 400;
    throw err;
  }
  return v;
}

export function validateTransferInfo({samePhone, transferLast3, transferPhone}={}){
  const same = String(samePhone || '').toLowerCase();
  if(same === 'same' || same === 'yes' || same === 'true' || same === 'نعم نفس الرقم') return true;
  const last3 = String(transferLast3 || '').trim();
  const phone = String(transferPhone || '').trim();
  if(/^[0-9]{3}$/.test(last3)) return true;
  if(/^01[0-9]{9}$/.test(phone)) return true;
  const err = new Error('لازم تكتب رقم الموبايل المحول منه أو آخر 3 أرقام منه');
  err.statusCode = 400;
  throw err;
}

export function validateImageMeta(file){
  if(!file || !file.size){
    const err = new Error('لازم ترفع صورة السكرين');
    err.statusCode = 400;
    throw err;
  }
  const max = Number(process.env.MAX_SCREENSHOT_SIZE || 5 * 1024 * 1024);
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  const allowedTypes = ['image/jpeg','image/png','image/webp'];
  const allowedExt = ['.jpg','.jpeg','.png','.webp'];
  const extOk = allowedExt.some(ext => name.endsWith(ext));
  if(!allowedTypes.includes(type) || !extOk){
    const err = new Error('السكرين لازم يكون صورة فقط JPG أو PNG أو WEBP');
    err.statusCode = 400;
    throw err;
  }
  if(file.size > max){
    const mb = Math.round(max / 1024 / 1024);
    const err = new Error(`حجم الصورة كبير. الحد الأقصى ${mb}MB`);
    err.statusCode = 400;
    throw err;
  }
  return true;
}

export function validateSingleImageFromForm(form){
  const files = [];
  for(const [key, value] of form.entries()){
    if(value && typeof value === 'object' && 'arrayBuffer' in value && value.size > 0){
      files.push({key,file:value});
    }
  }
  const imageFiles = files.filter(x => String(x.file.type||'').startsWith('image/'));
  if(files.length !== 1 || imageFiles.length !== 1){
    const err = new Error('لازم ترفع صورة واحدة فقط للسكرين، وممنوع أي ملفات أو فيديوهات');
    err.statusCode = 400;
    throw err;
  }
  validateImageMeta(imageFiles[0].file);
  return imageFiles[0];
}
