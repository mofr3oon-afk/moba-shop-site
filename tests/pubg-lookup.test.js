import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePubgId, parsePubgAccount, lookupPubgPlayer, InvalidPubgId, PubgLookupUnavailable } from '../lib/pubg-lookup.js';
import { handlePubgMessage, PUBG_LOOKUP_BUTTON, PUBG_LOOKUP_PROMPT } from '../lib/telegram-pubg.js';

const message = (text, extra={})=>({chat:{id:42,type:'private'},from:{id:42},text,...extra});
function setup(overrides={}){
  const sent=[], queried=[], limited=[];
  return {sent,queried,limited,options:{
    botId:'123',send:async (method,payload)=>sent.push({method,...payload}),
    limit:async id=>limited.push(id),lookup:async id=>{queried.push(id);return {id,nickname:'MOĪFR3OON'};},...overrides
  }};
}

test('normalizes English, Arabic, and Persian decimal IDs',()=>{
  for(const id of ['5285527481',' ٥٢٨٥٥٢٧٤٨١ ','۵۲۸۵۵۲۷۴۸۱']) assert.equal(normalizePubgId(id),'5285527481');
  for(const id of ['',null,'123','a12345','528 5527481','1'.repeat(16)]) assert.throws(()=>normalizePubgId(id),InvalidPubgId);
});
test('accepts verified nickname and distinguishes bad ID from provider errors',()=>{
  assert.equal(parsePubgAccount(201,{message:'Success',data:{username:'MOĪFR3OON'}}),'MOĪFR3OON');
  assert.throws(()=>parsePubgAccount(404,{message:'Invalid user account'}),InvalidPubgId);
  for(const [status,body] of [[404,{message:'Not Found'}],[429,{}],[500,{}],[200,[]],
    [200,{message:'Success',data:{}}],[200,{success:false,data:{username:'Fake'}}]]){
    assert.throws(()=>parsePubgAccount(status,body),PubgLookupUnavailable);
  }
});
test('provider request sends only account validation and has a deadline',async()=>{
  let called;
  const result=await lookupPubgPlayer('٥٢٨٥٥٢٧٤٨١',{fetchImpl:async (url,opts)=>{
    called={url,opts};return new Response(JSON.stringify({message:'Success',data:{username:'MOĪFR3OON'}}),{status:201});
  }});
  assert.equal(result.nickname,'MOĪFR3OON');
  assert.match(called.url,/\/user-account$/);
  assert.equal(called.opts.method,'POST');assert.ok(called.opts.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(called.opts.body),{code:'PUBG_ID',data:{userId:'5285527481',zoneId:''}});
});
test('network failure and non-JSON become service unavailable',async()=>{
  for(const fetchImpl of [async()=>{throw new Error('timeout');},async()=>new Response('<html>bad</html>')]){
    await assert.rejects(lookupPubgPlayer('5285527481',{fetchImpl}),PubgLookupUnavailable);
  }
});
test('start shows the exact new button; button prompts for ID',async()=>{
  const s=setup();
  assert.equal(await handlePubgMessage(message('/start'),s.options),true);
  assert.equal(s.sent[0].reply_markup.keyboard[0][0].text,PUBG_LOOKUP_BUTTON);
  await handlePubgMessage(message(PUBG_LOOKUP_BUTTON),s.options);
  assert.equal(s.sent[1].text,PUBG_LOOKUP_PROMPT);assert.equal(s.sent[1].reply_markup.force_reply,true);
  assert.equal(s.queried.length,0);
});
test('numeric message and explicit command work without a stored session',async()=>{
  for(const text of ['5285527481','٥٢٨٥٥٢٧٤٨١','/pubg 5285527481','/pubg@MobaShopDigitalBot 5285527481']){
    const s=setup();assert.equal(await handlePubgMessage(message(text),s.options),true);
    assert.deepEqual(s.queried,['5285527481']);assert.match(s.sent[0].text,/MOĪFR3OON/);
    assert.deepEqual(s.limited,[42]);
  }
});
test('bad ID in reply to this bot prompt gives validation message',async()=>{
  const s=setup();
  await handlePubgMessage(message('abc',{reply_to_message:{text:PUBG_LOOKUP_PROMPT,from:{id:123,is_bot:true}}}),s.options);
  assert.match(s.sent[0].text,/5.*15/);assert.equal(s.queried.length,0);
  assert.equal(await handlePubgMessage(message('abc',{reply_to_message:{text:PUBG_LOOKUP_PROMPT,from:{id:999,is_bot:true}}}),s.options),false);
});
test('group traffic and existing admin commands pass through unchanged',async()=>{
  const s=setup();
  for(const msg of [message('5285527481',{chat:{id:-1,type:'group'}}),message('/admin'),message('/today'),
    message('/find_id 5285527481'),message('/coupon TEST fixed 10'),
    message('/admin',{reply_to_message:{text:PUBG_LOOKUP_PROMPT,from:{id:123,is_bot:true}}})]){
    assert.equal(await handlePubgMessage(msg,s.options),false);
  }
  assert.equal(s.sent.length,0);assert.equal(s.queried.length,0);
});
test('lookup failure and invalid account produce separate helpful messages',async()=>{
  for(const [error,pattern] of [[new InvalidPubgId(),/ملقيتش/],[new PubgLookupUnavailable(),/مش متاحة/]]){
    const s=setup({lookup:async()=>{throw error;}});
    await handlePubgMessage(message('5285527481'),s.options);assert.match(s.sent[0].text,pattern);
  }
});
test('rate limit prevents provider call',async()=>{
  const s=setup({limit:async()=>{throw Object.assign(new Error(),{statusCode:429});}});
  await handlePubgMessage(message('5285527481'),s.options);
  assert.equal(s.queried.length,0);assert.match(s.sent[0].text,/6 محاولات/);
});
test('nickname remains plain text and cancel restores the keyboard',async()=>{
  const s=setup({lookup:async id=>({id,nickname:'<b>Name & Player</b>'})});
  await handlePubgMessage(message('5285527481'),s.options);
  assert.equal(s.sent[0].parse_mode,undefined);assert.match(s.sent[0].text,/<b>Name & Player<\/b>/);
  await handlePubgMessage(message('/cancel'),s.options);
  assert.equal(s.sent[1].reply_markup.keyboard[0][0].text,PUBG_LOOKUP_BUTTON);
});
