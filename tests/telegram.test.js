import test, {beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';

// All credentials are fake and every fetch is intercepted; no live Telegram or database calls.
process.env.BOT_TOKEN='123:test-only';
process.env.ADMIN_IDS='111';
process.env.TELEGRAM_WEBHOOK_SECRET='test-secret';
process.env.SUPABASE_URL='https://database.test';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
const {default:handler}=await import('../api/telegram.js');
const originalFetch=globalThis.fetch;
after(()=>{globalThis.fetch=originalFetch;});
let calls, buckets;
const order={id:'order-1',order_code:'MOBA 1001',status:'pending',phone:'01012345678',total:50,
  items:[{product:'60 UC',pubgId:'5285527481',qty:1,price:50}]};
beforeEach(()=>{
  calls=[];buckets=new Map();globalThis.__MOBA_RATE_LIMIT__.clear();
  globalThis.fetch=async (url,opts={})=>{
    url=String(url);const body=opts.body?JSON.parse(opts.body):null;
    calls.push({url,method:opts.method||'GET',body});
    const reply=data=>new Response(JSON.stringify(data),{status:200});
    if(url.startsWith('https://api.telegram.org/')) return reply({ok:true,result:{message_id:1}});
    if(url.startsWith('https://gopay.co.id/')) return reply({message:'Success',data:{username:'MOĪFR3OON'}});
    if(url.includes('/rest/v1/settings')){
      if(body){buckets.set(body.key,body.value);return reply([body]);}
      const key=new URL(url).searchParams.get('key')?.slice(3);
      return reply(buckets.has(key)?[{value:buckets.get(key)}]:[]);
    }
    if(url.includes('/rest/v1/orders')) return reply([{...order,...(body||{})}]);
    throw new Error('Unexpected network request');
  };
});
const msg=(text,id=42)=>({message:{chat:{id,type:'private'},from:{id},message_id:50,text}});
async function invoke(body,{header=true,secret='test-secret'}={}){
  const req={method:'POST',headers:{'x-forwarded-for':'127.0.0.1',...(header?{'x-telegram-bot-api-secret-token':secret}:{})},query:header?{}:{secret},body};
  const res={setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};
  await handler(req,res);return res;
}
const telegramCalls=()=>calls.filter(x=>x.url.startsWith('https://api.telegram.org/'));

test('header-authenticated webhook accepts public start and ID lookup',async()=>{
  assert.equal((await invoke(msg('/start'))).code,200);
  assert.match(telegramCalls()[0].body.reply_markup.keyboard[0][0].text,/معرفة اسم لاعب PUBG/);
  assert.equal((await invoke(msg('5285527481'))).code,200);
  assert.match(telegramCalls().at(-1).body.text,/MOĪFR3OON/);
  assert.equal(calls.filter(x=>x.url.includes('/orders')).length,0);
});
test('legacy query secret still works',async()=>{
  assert.equal((await invoke(msg('/start'),{header:false})).code,200);
});
test('wrong secret rejected before any network or database call',async()=>{
  const originalError=console.error;console.error=()=>{};
  try{assert.equal((await invoke(msg('/start'),{secret:'wrong'})).code,401);}
  finally{console.error=originalError;}
  assert.equal(calls.length,0);
});
test('admin help and order-ID search remain available',async()=>{
  await invoke(msg('/admin',111));assert.match(telegramCalls().at(-1).body.text,/أوامر MOBA SHOP/);
  await invoke(msg('/find_id 5285527481',111));
  assert.ok(calls.some(x=>x.url.includes('/orders?items=')));
  assert.equal(calls.filter(x=>x.url.startsWith('https://gopay.co.id/')).length,0);
});
test('non-admin cannot use order administration',async()=>{
  await invoke(msg('/admin'));await invoke(msg('/find_id 5285527481'));
  assert.equal(telegramCalls().length,0);assert.equal(calls.filter(x=>x.url.includes('/orders')).length,0);
});
test('existing and legacy admin order buttons still update the order',async()=>{
  for(const data of ['delivered:order-1','web_delivered_order-1']){
    const res=await invoke({callback_query:{id:'cb',from:{id:111},message:{chat:{id:111},message_id:7},data}});
    assert.equal(res.code,200);
  }
  assert.equal(calls.filter(x=>x.method==='PATCH' && x.body.status==='delivered').length,2);
  assert.ok(telegramCalls().some(x=>x.url.endsWith('/editMessageReplyMarkup')));
});
test('public lookup rate limit survives clearing the local instance cache',async()=>{
  for(let i=0;i<7;i++){
    globalThis.__MOBA_RATE_LIMIT__.clear();
    await invoke(msg('5285527481'));
  }
  assert.equal(calls.filter(x=>x.url.startsWith('https://gopay.co.id/')).length,6);
  assert.match(telegramCalls().at(-1).body.text,/6 محاولات/);
});
