import test,{beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';

Object.assign(process.env,{SUPABASE_URL:'https://auth.test',SUPABASE_SERVICE_ROLE_KEY:'fake-db',ADMIN_PANEL_SECRET:'shared-test-password',ADMIN_SESSION_SECRET:'fake-session',BOT_TOKEN:'fake-bot-token',ADMIN_IDS:'111',ADMIN_LOGIN_OTP:'true'});
const {default:handler}=await import('../api/admin-login.js');
const {makeSession,setSessionCookie,currentAdminSession}=await import('../lib/admin-auth.js');
const originalFetch=globalThis.fetch;after(()=>{globalThis.fetch=originalFetch;});
let settings,telegramCalls,mode;
beforeEach(()=>{
  settings=new Map();telegramCalls=[];mode='success';
  Object.assign(process.env,{BOT_TOKEN:'fake-bot-token',ADMIN_IDS:'111',ADMIN_USERS:'',ADMIN_LOGIN_OTP:'true'});delete process.env.ADMIN_CHAT_ID;
  globalThis.__MOBA_RATE_LIMIT__?.clear();globalThis.__MOBA_ADMIN_FAILED__?.clear();
  globalThis.fetch=async(input,opts={})=>{
    const url=new URL(input),body=opts.body?JSON.parse(opts.body):null,method=opts.method||'GET';
    const reply=(data,status=200)=>new Response(JSON.stringify(data),{status});
    if(url.hostname==='api.telegram.org'){
      telegramCalls.push(body);
      if(mode==='network')throw new Error('Error with fake-bot-token');
      if(mode==='rejected')return reply({ok:false,error_code:400,description:'chat not found'});
      if(mode==='forbidden'||(mode==='partial'&&body.chat_id==='222'))return reply({ok:false,error_code:403},403);
      if(mode==='bad-token')return reply({ok:false,error_code:401},401);
      if(mode==='bad-json')return new Response('unavailable',{status:502});
      return reply({ok:true,result:{message_id:123}});
    }
    assert.equal(url.hostname,'auth.test','No unmocked requests allowed');
    assert.ok(url.pathname.endsWith('/settings'));
    const key=url.searchParams.get('key')?.slice(3);
    if(method==='POST'){
      const rows=Array.isArray(body)?body:[body];
      if(rows.some(r=>settings.has(r.key))&&!String(opts.headers?.Prefer).includes('merge-duplicates'))return reply({message:'duplicate 23505'},409);
      rows.forEach(r=>settings.set(r.key,r.value));return reply(rows);
    }
    if(method==='PATCH'){
      const old=settings.get(key),expected=url.searchParams.get('value')?.slice(3);
      if(old===undefined||(expected!==undefined&&expected!==old))return reply([]);
      settings.set(key,body.value);return reply([body]);
    }
    return reply(settings.has(key)?[{key,value:settings.get(key)}]:[]);
  };
});
async function login(username,password='shared-test-password'){
  const req=Readable.from([Buffer.from(JSON.stringify({username,password}))]);
  Object.assign(req,{method:'POST',query:{},headers:{'content-type':'application/json','x-forwarded-for':'127.0.0.1','user-agent':'auth-test'}});
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(data){this.data=data;},end(s){if(s)this.data=JSON.parse(s);}};
  await handler(req,res);return res;
}
test('only the three requested usernames use the unchanged shared password',async()=>{
  for(const username of ['moamen','basant','jana']){
    const res=await login(username);assert.equal(res.statusCode,200);assert.equal(res.data.needsOtp,true);assert.equal(res.headers['Set-Cookie'],undefined);
  }
  assert.equal(telegramCalls.length,3);
});
test('unknown names are rejected even when ADMIN_USERS is missing or broader',async()=>{
  process.env.ADMIN_USERS='admin,outsider';
  for(const username of ['admin','outsider','', 'moamen-other'])assert.equal((await login(username)).statusCode,401);
  assert.equal(telegramCalls.length,0);
});
test('a permitted username cannot bypass the shared password',async()=>{
  assert.equal((await login('moamen','wrong')).statusCode,401);assert.equal(telegramCalls.length,0);
});
test('missing bot token produces no false sent message or OTP challenge response',async()=>{
  delete process.env.BOT_TOKEN;const res=await login('moamen');
  assert.equal(res.statusCode,503);assert.equal(res.data.code,'OTP_DELIVERY_NOT_CONFIGURED');assert.equal(res.data.needsOtp,undefined);assert.equal(res.data.challenge,undefined);assert.equal(telegramCalls.length,0);
});
test('missing recipients fails closed without a login session',async()=>{
  process.env.ADMIN_IDS='';const res=await login('moamen');assert.equal(res.statusCode,503);assert.equal(res.headers['Set-Cookie'],undefined);assert.equal(telegramCalls.length,0);
});
test('Telegram HTTP 200 with ok:false is still a delivery failure',async()=>{
  mode='rejected';const res=await login('moamen');assert.equal(res.statusCode,503);assert.equal(res.data.code,'OTP_DELIVERY_FAILED');assert.equal(res.data.needsOtp,undefined);
  const logs=[...settings.values()].filter(v=>String(v).includes('otp_delivery_failed'));assert.ok(logs.length);
  assert.equal([...settings.values()].some(v=>String(v).includes('"type":"otp_sent"')),false);
});
test('Telegram forbidden, bad token, invalid JSON and network errors never claim success',async()=>{
  for(const failure of ['forbidden','bad-token','bad-json','network']){
    mode=failure;const res=await login('moamen');assert.equal(res.statusCode,503);assert.equal(res.data.challenge,undefined);assert.equal(JSON.stringify(res.data).includes('fake-bot-token'),false);
  }
});
test('at least one configured recipient must be accepted by Telegram',async()=>{
  process.env.ADMIN_IDS='111,222';mode='partial';const res=await login('jana');assert.equal(res.statusCode,200);assert.equal(res.data.needsOtp,true);assert.equal(telegramCalls.length,2);
});
test('ADMIN_CHAT_ID remains a supported fallback when ADMIN_IDS is blank',async()=>{
  process.env.ADMIN_IDS=' ';process.env.ADMIN_CHAT_ID='111';const res=await login('basant');assert.equal(res.statusCode,200);assert.equal(telegramCalls[0].chat_id,'111');
});
test('older signed sessions belonging to other usernames no longer authorize access',()=>{
  const res={headers:{},setHeader(k,v){this.headers[k]=v;}};
  setSessionCookie(res,makeSession({headers:{}},{role:'owner',username:'admin'}));
  assert.equal(currentAdminSession({headers:{cookie:res.headers['Set-Cookie'].split(';')[0]}}),null);
  setSessionCookie(res,makeSession({headers:{}},{role:'owner',username:'moamen'}));
  assert.equal(currentAdminSession({headers:{cookie:res.headers['Set-Cookie'].split(';')[0]}}).username,'moamen');
});
