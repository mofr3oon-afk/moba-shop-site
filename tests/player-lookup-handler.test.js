import test,{beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
Object.assign(process.env,{SUPABASE_URL:'https://lookup-db.test',SUPABASE_SERVICE_ROLE_KEY:'fake'});
const {default:handler}=await import('../lib/handlers/player-lookup.js');
const original=globalThis.fetch;let calls=[],providerStatus=200,providerBody;
beforeEach(()=>{
  globalThis.__MOBA_RATE_LIMIT__?.clear();calls=[];providerStatus=200;providerBody={message:'Success',data:{username:'MO FR3OON'}};
  globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});
    if(String(url).startsWith('https://lookup-db.test/'))return new Response('[]',{status:200});
    if(String(url)==='https://gopay.co.id/games/v1/order/user-account')return new Response(JSON.stringify(providerBody),{status:providerStatus});
    throw new Error('Unexpected outbound URL');
  };
});
after(()=>{globalThis.fetch=original;});
async function invoke(body,method='POST'){
  const res={headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(d){this.data=d}};
  await handler({method,body,headers:{'x-forwarded-for':'192.0.2.1'}},res);return res;
}
test('player API reuses bot provider, normalizes digits and returns only ID/name',async()=>{
  const r=await invoke({id:'٥٢٨٥٥٢٧٤٨١',url:'https://evil.test'});
  assert.equal(r.statusCode,200);assert.deepEqual(r.data,{ok:true,id:'5285527481',nickname:'MO FR3OON'});
  assert.equal(r.headers['Cache-Control'],'no-store');
  assert.equal(calls.filter(c=>c.url.includes('gopay')).length,1);
  assert.equal(JSON.parse(calls.find(c=>c.url.includes('gopay')).options.body).data.userId,'5285527481');
});
test('invalid inputs/method never reach provider',async()=>{
  assert.equal((await invoke({id:'bad'})).statusCode,400);
  assert.equal((await invoke({id:'5285527481'},'GET')).statusCode,405);
  assert.equal(calls.length,0);
});
test('not-found and upstream outage are distinguishable without leaking provider response',async()=>{
  providerStatus=404;providerBody={message:'Invalid user account'};
  assert.equal((await invoke({id:'5285527481'})).data.code,'invalid_id');
  providerStatus=500;providerBody={message:'secret upstream error'};
  const r=await invoke({id:'5285527481'});assert.equal(r.statusCode,503);assert.equal(r.data.code,'unavailable');assert.equal(JSON.stringify(r.data).includes('secret'),false);
});
test('rate limit rejects seventh lookup before provider call',async()=>{
  for(let i=0;i<6;i++)assert.equal((await invoke({id:'5285527481'})).statusCode,200);
  assert.equal((await invoke({id:'5285527481'})).statusCode,429);
  assert.equal(calls.filter(c=>c.url.includes('gopay')).length,6);
});
