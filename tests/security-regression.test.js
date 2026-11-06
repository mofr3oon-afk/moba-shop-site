import test, {beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import crypto from 'node:crypto';

// Fake credentials and intercepted requests only. No live database or bot.
Object.assign(process.env,{SUPABASE_URL:'https://database.test',SUPABASE_SERVICE_ROLE_KEY:'fake',BOT_TOKEN:'fake',ORDER_GROUP_ID:'111',ADMIN_IDS:'111',ADMIN_PANEL_SECRET:'owner-test',ADMIN_VIEWER_SECRET:'viewer-test',ADMIN_SESSION_SECRET:'session-test',ADMIN_LOGIN_OTP:'true',ORDER_RECEIPTS_BUCKET:'test-receipts'});
const {default:login}=await import('../api/admin-login.js');
const {default:publicApi}=await import('../api/public.js');
const {default:settingsApi}=await import('../api/settings.js');
const {default:orderApi}=await import('../api/order.js');
const {default:manualApi,handoffDetails}=await import('../api/manual-order.js');
const {makeSession,setSessionCookie,createOtpChallenge}=await import('../lib/admin-auth.js');
const {newOrderAccess}=await import('../lib/customer-access.js');
const {default:adminOrders}=await import('../api/admin-orders.js');
const {cairoDayStart,cairoDayEnd}=await import('../js/cairo-time.js');
const {adminReport}=await import('../lib/admin-report.js');
const {cartAmount}=await import('../lib/server-catalog.js');
const {customerWhatsAppUrl}=await import('../js/contact-links.js');
const originalFetch=globalThis.fetch;
after(()=>{globalThis.fetch=originalFetch;});
let calls,settings,orders,code,failStorage,failTelegram,fixture,orderConflict;
beforeEach(()=>{
  calls=[];settings=new Map();orders=[];code='';failStorage=false;failTelegram=false;orderConflict=false;
  fixture={id:'MOBA-test-1001',phone:'01087654321',status:'needs_fix',fix_type:'bad_id',fix_count:0,items:[],raw_data:{},total:50};
  globalThis.__MOBA_RATE_LIMIT__?.clear();globalThis.__MOBA_ADMIN_FAILED__?.clear();globalThis.__MOBA_ADMIN_OTP__?.clear();
  globalThis.fetch=async(input,opts={})=>{
    const url=new URL(input),method=opts.method||'GET';
    const body=typeof opts.body==='string'?JSON.parse(opts.body):null;
    calls.push({url:url.href,method,body});
    const reply=data=>new Response(JSON.stringify(data),{status:200});
    if(url.hostname==='api.telegram.org'){
      if(failTelegram)throw new Error('Fake Telegram outage');
      if(body?.text?.includes('Admin Login Code'))code=body.text.match(/<code>(\d{6})<\/code>/)?.[1]||'';
      return reply({ok:true,result:{message_id:1,photo:[{file_id:'fake-photo'}]}});
    }
    assert.equal(url.hostname,'database.test','Unexpected network request');
    if(url.pathname.includes('/storage/'))return failStorage?new Response('{}',{status:503}):reply(url.pathname.includes('/bucket/')?{public:false}:{Key:'fake'});
    if(url.pathname.endsWith('/settings')){
      const filter=url.searchParams.get('key'),key=filter?.startsWith('eq.')?filter.slice(3):null;
      if(method==='POST'){
        const rows=Array.isArray(body)?body:[body];
        if(rows.some(r=>settings.has(r.key))&&!String(opts.headers?.Prefer).includes('merge-duplicates'))return new Response('duplicate 23505',{status:409});
        for(const row of rows)settings.set(row.key,row.value);return reply(rows);
      }
      if(method==='PATCH'){
        const old=settings.get(key),expected=url.searchParams.get('value')?.slice(3);
        if(old===undefined||(expected!==undefined&&expected!==old))return reply([]);
        settings.set(key,body.value);return reply([{key,value:body.value}]);
      }
      if(key)return reply(settings.has(key)?[{key,value:settings.get(key)}]:[]);
      return reply([...settings].map(([key,value])=>({key,value})));
    }
    if(url.pathname.endsWith('/orders')){
      const id=url.searchParams.get('id')?.slice(3);
      if(method==='POST'){
        if(orders.some(o=>o.id===body.id))return new Response('duplicate 23505',{status:409});
        orders.push(body);return reply([body]);
      }
      if(method==='PATCH'){if(orderConflict)return reply([]);const o=orders.find(o=>o.id===id)||fixture;Object.assign(o,body);return reply([o]);}
      if(id)return reply(id===fixture.id?[fixture]:orders.filter(o=>o.id===id));
      if(url.searchParams.has('created_at'))return reply(orders);
      if(url.searchParams.has('phone')&&!url.searchParams.has('status'))return reply(url.searchParams.get('phone').slice(3)===fixture.phone?[fixture]:[]);
      return reply([]);
    }
    if(url.pathname.endsWith('/coupons'))return reply([{code:'DELETED',is_active:true,discount_amount:10}]);
    throw new Error('Unexpected URL');
  };
});
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},getHeader(k){return this.headers[k];},status(n){this.statusCode=n;return this;},json(data){this.data=data;},end(text){if(text)this.data=JSON.parse(text);}};}
async function invoke(handler,body,{method='POST',query={},type='application/json',headers={}}={}){
  const req=Readable.from(body===undefined?[]:[Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body))]);
  Object.assign(req,{method,query,headers:{'content-type':type,'x-forwarded-for':'127.0.0.1','user-agent':'test','idempotency-key':crypto.randomUUID(),...headers}});
  if(handler===settingsApi)req.body=body; // Vercel parses JSON for this endpoint.
  const res=response();await handler(req,res);return res;
}
function multipart(fields,{validImage=true}={}){
  const chunks=Object.entries(fields).map(([k,v])=>`--fixture\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`);
  chunks.push('--fixture\r\nContent-Disposition: form-data; name="screenshot"; filename="proof.png"\r\nContent-Type: image/png\r\n\r\n');
  return Buffer.concat([Buffer.from(chunks.join('')),validImage?Buffer.from([137,80,78,71,13,10,26,10]):Buffer.alloc(8),Buffer.alloc(2100),Buffer.from('\r\n--fixture--\r\n')]);
}
function checkout(qty=1,extra={},image={}){return multipart({customerPhone:'01098765432',paymentMethod:'Wallet',termsAccepted:'true',transferMode:'same',cart:JSON.stringify([{productId:'pubg_60',pubgId:'5285527481',pubgName:'Test',qty,price:1}]),...extra},image);}
const formOptions={type:'multipart/form-data; boundary=fixture'};

test('OTP cannot upgrade viewer to owner using client role',async()=>{
  const start=await createOtpChallenge({headers:{'x-forwarded-for':'127.0.0.1','user-agent':'test'}},{username:'basant',role:'viewer',deviceId:'test-device'});
  const done=await invoke(login,{challenge:start.challenge,otp:start.code,role:'owner',username:'forged'});
  assert.equal(done.data.session.role,'viewer');assert.equal(done.data.session.username,'basant');
});
test('phone alone cannot reveal customer order history',async()=>{
  const res=await invoke(publicApi,undefined,{method:'GET',query:{action:'status',phone:fixture.phone,history:'1'}});
  assert.equal(res.statusCode,401);assert.equal(res.data.orders,undefined);
});
test('guessing order ID and arbitrary phone cannot modify an order',async()=>{
  const res=await invoke(publicApi,multipart({orderId:fixture.id,phone:'01099999999',fixValue:'5285527482'}),{...formOptions,query:{action:'fix-order'}});
  assert.equal(res.statusCode,401);assert.equal(calls.some(c=>c.method==='PATCH'&&c.url.includes('/orders')),false);
});
test('public settings never expose product cost or margin',async()=>{
  settings.set('dynamic_products',JSON.stringify([{id:'test',game:'pubg',name:'Test',price:50,cost:30,profit:20}]));
  const res=await invoke(settingsApi,undefined,{method:'GET'});
  assert.equal(res.data.settings.dynamic_products[0].cost,undefined);assert.equal(res.data.settings.dynamic_products[0].profit,undefined);
});
test('fractional quantity cannot create an order',async()=>{
  const res=await invoke(orderApi,checkout(1.5),formOptions);assert.equal(res.statusCode,400);assert.equal(orders.length,0);
});
test('unavailable products cannot be ordered through direct API',async()=>{
  settings.set('dynamic_products',[{id:'pubg_60',game:'pubg',name:'UC 60',price:50,status:'disabled'}]);
  const res=await invoke(orderApi,checkout(),formOptions);assert.equal(res.statusCode,400);assert.equal(orders.length,0);
});
test('deleted legacy coupon cannot be resurrected at checkout',async()=>{
  const res=await invoke(orderApi,checkout(1,{coupon_code:'DELETED'}),formOptions);assert.equal(res.statusCode,400);assert.equal(orders.length,0);
});
test('direct checkout uses server price and persists private proof before notification',async()=>{
  const res=await invoke(orderApi,checkout(2,{testOrder:'true'}),formOptions);
  assert.equal(res.statusCode,200);assert.equal(res.data.total,100);assert.equal(orders.length,1);
  assert.equal(orders[0].items[0].price,50);assert.equal(orders[0].order_type,'cart');assert.equal(orders[0].raw_data.paymentVerified,false);
  assert.ok(orders[0].raw_data.receiptPath);assert.equal(res.data.trackingToken.length,64);assert.equal(res.data.raw_data,undefined);
});
test('retry with the same key returns one order without new notification',async()=>{
  const options={...formOptions,headers:{'idempotency-key':crypto.randomUUID()}};
  const first=await invoke(orderApi,checkout(),options);const count=calls.filter(c=>c.url.includes('api.telegram.org')).length;
  const again=await invoke(orderApi,checkout(),options);
  assert.equal(again.statusCode,200);assert.equal(again.data.orderId,first.data.orderId);assert.equal(again.data.trackingToken,first.data.trackingToken);
  assert.equal(orders.length,1);assert.equal(calls.filter(c=>c.url.includes('api.telegram.org')).length,count);
});
test('storage outage does not create an order without its receipt',async()=>{
  failStorage=true;const res=await invoke(orderApi,checkout(),formOptions);assert.equal(res.statusCode,503);assert.equal(orders.length,0);
});
test('Telegram outage leaves receipt and order available in admin',async()=>{
  failTelegram=true;const res=await invoke(orderApi,checkout(),formOptions);assert.equal(res.statusCode,200);assert.equal(res.data.telegramOk,false);assert.ok(orders[0].raw_data.receiptPath);
});
test('OTP survives instance cache reset and cannot be replayed',async()=>{
  const start=await invoke(login,{username:'moamen',password:'owner-test'});const otp=code;globalThis.__MOBA_ADMIN_OTP__.clear();
  assert.equal((await invoke(login,{challenge:start.data.challenge,otp})).statusCode,200);assert.equal((await invoke(login,{challenge:start.data.challenge,otp})).statusCode,401);
});
test('invalid quantities are rejected without saving',async()=>{
  for(const qty of ['NaN','Infinity',0,-1,21]){globalThis.__MOBA_RATE_LIMIT__.clear();const res=await invoke(orderApi,checkout(qty),formOptions);assert.equal(res.statusCode,400);assert.equal(orders.length,0);}
});
test('spoofed image MIME and extension do not bypass signature validation',async()=>{
  const res=await invoke(orderApi,checkout(1,{}, {validImage:false}),formOptions);assert.equal(res.statusCode,400);assert.equal(orders.length,0);
});
test('oversized body is rejected before collecting input',async()=>{
  const res=await invoke(orderApi,checkout(),{...formOptions,headers:{'content-length':'9000000'}});assert.equal(res.statusCode,413);assert.equal(orders.length,0);
});
test('authorized tracking returns only customer fields',async()=>{
  const access=newOrderAccess();fixture.raw_data={trackingTokenHash:access.hash,secret:'private'};fixture.internal_note='private';fixture.note='internal';
  const res=await invoke(publicApi,undefined,{method:'GET',headers:{'x-order-token':access.token},query:{action:'status',orderId:fixture.id,phone:fixture.phone}});
  assert.equal(res.statusCode,200);assert.equal(res.data.order.id,fixture.id);assert.equal(res.data.order.raw_data,undefined);assert.equal(res.data.order.note,undefined);assert.equal(res.data.order.internal_note,undefined);
});
test('wrong tracking token cannot modify the order',async()=>{
  fixture.raw_data={trackingTokenHash:newOrderAccess().hash};
  const res=await invoke(publicApi,multipart({orderId:fixture.id,phone:fixture.phone,fixValue:'5285527482'}),{...formOptions,headers:{'x-order-token':'a'.repeat(64)},query:{action:'fix-order'}});
  assert.equal(res.statusCode,401);assert.equal(calls.some(c=>c.method==='PATCH'&&c.url.includes('/orders')),false);
});
test('viewer cannot moderate reviews',async()=>{
  const cookieRes=response();setSessionCookie(cookieRes,makeSession({headers:{}},{role:'viewer',username:'basant'}));
  const res=await invoke(publicApi,{id:1,action:'approve'},{method:'PATCH',headers:{cookie:cookieRes.headers['Set-Cookie'].split(';')[0]},query:{action:'reviews'}});assert.equal(res.statusCode,403);
});
test('manual orders use server prices without account or OTP and remain unpaid',async()=>{
  settings.set('dynamic_products',JSON.stringify([{id:'qr-test',game:'pubg',section:'qr',name:'QR fixture',price:120,checkoutMethod:'manual'}]));
  const res=await invoke(manualApi,{cart:[{productId:'qr-test',price:1,qty:2}],channel:'whatsapp',termsAccepted:true});
  assert.equal(res.statusCode,200);assert.equal(res.data.total,240);assert.equal(orders[0].status,'pending');assert.equal(orders[0].raw_data.handoffStatus,'awaiting_contact');assert.equal(orders[0].raw_data.paymentVerified,false);
  const link=new URL(res.data.whatsappUrl);assert.equal(link.hostname,'wa.me');assert.ok(link.searchParams.get('text').includes('240'));assert.equal(link.searchParams.get('text').includes(res.data.trackingToken),false);
});
test('parallel manual retries create one order with one reference',async()=>{
  settings.set('dynamic_products',[{id:'manual-test',game:'pubg',name:'Manual fixture',price:50,checkoutMethod:'manual'}]);
  const body={cart:[{productId:'manual-test',qty:1}],channel:'telegram',termsAccepted:true},options={headers:{'idempotency-key':crypto.randomUUID()}};
  const results=await Promise.all([invoke(manualApi,body,options),invoke(manualApi,body,options)]);
  assert.equal(orders.length,1);assert.equal(results[0].data.orderId,results[1].data.orderId);assert.equal(new URL(results[0].data.telegramUrl).search,'');
});
test('quote ignores client prices and applies scoped coupon by product ID',async()=>{
  settings.set('coupon_rules',JSON.stringify([{code:'SAVE',active:true,type:'percent',value:10,products:['pubg_60']}]));
  const res=await invoke(publicApi,{cart:[{productId:'pubg_60',price:1,product:'Fake',qty:2}],total:1,coupon_code:'SAVE'},{query:{action:'quote'}});
  assert.equal(res.statusCode,200);assert.equal(res.data.subtotal,100);assert.equal(res.data.total,90);assert.equal(res.data.coupon.discount_amount,10);
});
test('handoff links omit account IDs, customer phone, tracking secrets and proof',()=>{
  const detail=handoffDetails({order_code:'TEST',items:[{product:'QR fixture',qty:1,price:50,pubgId:'secret'}],total:50,phone:'secret',trackingToken:'secret'},{whatsapp:'201000000000',telegram:'MOFR3OON'});
  assert.equal(detail.message.includes('secret'),false);assert.equal(detail.telegramUrl,'https://t.me/MOFR3OON');
});

test('a viewer cannot update an order and cross-site owner updates are denied',async()=>{
  for(const role of ['viewer','owner']){
    const cookieRes=response();setSessionCookie(cookieRes,makeSession({headers:{}},{role,username:role==='owner'?'moamen':'basant'}));
    const headers={cookie:cookieRes.headers['Set-Cookie'].split(';')[0]};
    if(role==='owner')Object.assign(headers,{host:'shop.test',origin:'https://attacker.test'});
    const res=await invoke(adminOrders,{id:fixture.id,status:'delivered',paymentVerified:true},{headers});
    assert.equal(res.statusCode,403);
  }
});
test('admin cannot mark delivery without confirming payment',async()=>{
  const cookieRes=response();setSessionCookie(cookieRes,makeSession({headers:{}},{role:'owner',username:'moamen'}));
  const headers={cookie:cookieRes.headers['Set-Cookie'].split(';')[0]};
  const denied=await invoke(adminOrders,{id:fixture.id,status:'delivered'},{headers});assert.equal(denied.statusCode,400);
  const allowed=await invoke(adminOrders,{id:fixture.id,status:'delivered',paymentVerified:true},{headers});assert.equal(allowed.statusCode,200);assert.equal(fixture.raw_data.paymentVerified,true);
});
test('mandatory Mobile Legends zone cannot be omitted through the API',async()=>{
  const body=checkout(1,{cart:JSON.stringify([{productId:'ml_56',qty:1,pubgId:'5285527481',pubgName:'Test'}])});
  const res=await invoke(orderApi,body,formOptions);assert.equal(res.statusCode,400);assert.equal(orders.length,0);
});
test('Cairo report dates respect summer and winter time',()=>{
  assert.equal(cairoDayStart('2026-07-01').toISOString(),'2026-06-30T21:00:00.000Z');
  assert.equal(cairoDayStart('2026-11-05').toISOString(),'2026-11-04T22:00:00.000Z');
  assert.equal(+cairoDayEnd('2026-11-05')-+cairoDayStart('2026-11-05'),86400000-1);
});
test('sales count delivered orders only and profit excludes unknown costs',async()=>{
  orders=[{id:'known',status:'delivered',total:100,raw_data:{costTotal:40}},{id:'unknown',status:'delivered',total:50,raw_data:{costTotal:null}},{id:'pending',status:'pending',total:1000,raw_data:{costTotal:10}}];
  const report=await adminReport('2026-11-01T00:00:00Z','2026-11-05T23:59:59Z');
  assert.equal(report.count,3);assert.equal(report.revenue,150);assert.equal(report.knownCostProfit,60);assert.equal(report.unknownCostOrders,1);
});
test('money arithmetic uses integer cents and rejects unsafe totals',()=>{
  assert.equal(cartAmount([{price:0.1,qty:3},{price:0.2,qty:1}]),0.5);
  assert.throws(()=>cartAmount([{price:Number.MAX_SAFE_INTEGER,qty:20}]));
});
test('customer WhatsApp links preserve Egypt country code and reject empty numbers',()=>{
  assert.equal(customerWhatsAppUrl('01098765432'),'https://wa.me/201098765432');
  assert.equal(customerWhatsAppUrl(''),'');assert.equal(customerWhatsAppUrl('javascript:alert(1)'),'');
});
test('explicitly clearing a sale price does not revive a legacy discount',async()=>{
  settings.set('dynamic_products',[{id:'pubg_60',game:'pubg',name:'UC 60',price:50,salePrice:0,sale_price:20}]);
  const res=await invoke(publicApi,{cart:[{productId:'pubg_60',qty:1}]},{query:{action:'quote'}});
  assert.equal(res.statusCode,200);assert.equal(res.data.total,50);
});
test('customer status can be checked without putting a phone or token in the URL',async()=>{
  const access=newOrderAccess();fixture.raw_data.trackingTokenHash=access.hash;
  const res=await invoke(publicApi,{orderId:fixture.id,phone:fixture.phone,history:'1'},{headers:{'x-order-token':access.token},query:{action:'status'}});
  assert.equal(res.statusCode,200);assert.equal(res.data.orders[0].id,fixture.id);
});
test('Arabic customer phone and account digits create a canonical direct order',async()=>{
  const res=await invoke(orderApi,checkout(1,{customerPhone:'٠١٠٩٨٧٦٥٤٣٢',cart:JSON.stringify([{productId:'pubg_60',qty:1,pubgId:'٥٢٨٥٥٢٧٤٨١',pubgName:'Test'}])}),formOptions);
  assert.equal(res.statusCode,200);assert.equal(orders[0].phone,'01098765432');assert.equal(orders[0].items[0].pubgId,'5285527481');
});
test('manual fulfillment does not force account fields intended for direct charging',async()=>{
  settings.set('dynamic_products',[{id:'ml_56',game:'mobile-legends',name:'Manual test',price:60,checkoutMethod:'manual'}]);
  const res=await invoke(manualApi,{cart:[{productId:'ml_56',qty:1}],channel:'telegram',termsAccepted:true});assert.equal(res.statusCode,200);assert.equal(orders[0].raw_data.paymentVerified,false);
});
test('admin sees a conflict instead of overwriting a concurrently updated order',async()=>{
  const cookieRes=response();setSessionCookie(cookieRes,makeSession({headers:{}},{role:'owner',username:'moamen'}));
  orderConflict=true;
  const res=await invoke(adminOrders,{id:fixture.id,status:'processing'},{headers:{cookie:cookieRes.headers['Set-Cookie'].split(';')[0]}});
  assert.equal(res.statusCode,409);assert.equal(fixture.status,'needs_fix');
  assert.ok(calls.find(c=>c.method==='PATCH'&&c.url.includes('/orders'))?.url.includes('status=eq.needs_fix'));
});
test('an unrelated malformed cookie does not break the login status endpoint',async()=>{
  const res=await invoke(login,undefined,{method:'GET',headers:{cookie:'other=%E0%A4%A'}});assert.equal(res.statusCode,200);assert.equal(res.data.authenticated,false);
});

test('catalog save preserves game ownership when only unrelated sections are stored',async()=>{
  const cookieRes=response();setSessionCookie(cookieRes,makeSession({headers:{}},{role:'owner',username:'moamen'}));
  const headers={cookie:cookieRes.headers['Set-Cookie'].split(';')[0]};
  const res=await invoke(settingsApi,{settings:{dynamic_sections:[{game:'pubg',slug:'qr_stable',name:'اسم عربي متغير'}],dynamic_products:[{id:'ff_50',game:'freefire',section:'diamonds',name:'50 diamonds',price:55}]}},{headers});
  assert.equal(res.statusCode,200);const product=res.data.settings.dynamic_products.find(p=>p.id==='ff_50');assert.equal(product.game,'freefire');assert.equal(product.section,'diamonds');
  assert.equal(res.data.settings.dynamic_sections[0].key,'qr_stable');assert.equal(res.data.settings.dynamic_sections[0].slug,'qr_stable');
});
test('catalog API preserves sparse hidden product tombstones',async()=>{
  settings.set('dynamic_products',JSON.stringify([{id:'pubg_60',hidden:true}]));
  const res=await invoke(settingsApi,undefined,{method:'GET'});assert.equal(res.data.settings.dynamic_products[0].status,'hidden');
});
