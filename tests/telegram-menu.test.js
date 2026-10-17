import test from 'node:test';
import assert from 'node:assert/strict';
import {handleMenuMessage,mainKeyboard,MENU_BUTTONS as b,INPUT_PROMPTS,LOOKUP_BUTTON} from '../lib/telegram-menu.js';
import {handlePubgMessage,PUBG_LOOKUP_PROMPT} from '../lib/telegram-pubg.js';

const msg=(text,extra={})=>({chat:{id:111,type:'private'},from:{id:111},text,...extra});
function setup(admin=true){
  const sent=[],commands=[];
  return {sent,commands,opts:{admin,botId:'123',send:async(method,payload)=>sent.push(payload),runCommand:async message=>commands.push(message)}};
}
test('start, admin, and cancel show only the PUBG ID check button',async()=>{
  for(const admin of [true,false]){
    for(const text of ['/start','/admin','/cancel']){
      const s=setup(admin);
      const handled=await handleMenuMessage(msg(text),s.opts);
      if(!handled) await handlePubgMessage(msg(text),s.opts);
      assert.deepEqual(s.sent.at(-1).reply_markup.keyboard,[[{text:'🔎 فحص PUBG ID'}]]);
    }
  }
});
test('stale buttons replace old keyboards without running their actions',async()=>{
  for(const text of Object.values(b)){
    const s=setup();await handleMenuMessage(msg(text),s.opts);
    assert.equal(s.commands.length,0);assert.deepEqual(s.sent[0].reply_markup,mainKeyboard());
  }
});
test('legacy search button still prompts for PUBG ID',async()=>{
  const s=setup();await handlePubgMessage(msg('🔎 معرفة اسم لاعب PUBG'),s.opts);
  assert.equal(s.sent[0].text,PUBG_LOOKUP_PROMPT);
});
test('old admin input replies cannot accidentally become PUBG lookups or order actions',async()=>{
  for(const admin of [true,false]){
    const s=setup(admin);
    assert.equal(await handleMenuMessage(msg('01012345678',{
      reply_to_message:{text:INPUT_PROMPTS.customer,from:{id:123,is_bot:true}}
    }),s.opts),true);
    assert.equal(s.commands.length,0);assert.deepEqual(s.sent[0].reply_markup,mainKeyboard());
  }
});
test('existing slash commands pass through and advanced command list remains admin-only',async()=>{
  const s=setup();
  for(const text of ['/today','/find_id 5285527481','/customer 01012345678']){
    assert.equal(await handleMenuMessage(msg(text),s.opts),false);
  }
  await handleMenuMessage(msg('/commands'),s.opts);assert.equal(s.commands[0].text,'/admin');
  const publicUser=setup(false);await handleMenuMessage(msg('/commands'),publicUser.opts);
  assert.equal(publicUser.commands.length,0);
});
test('result copies exact decorated Unicode nickname and restores the single keyboard',async()=>{
  const name='MOĪFR3OON ♛';
  const s=setup();await handlePubgMessage(msg('5285527481'),{
    ...s.opts,limit:async()=>{},lookup:async id=>({id,nickname:name})
  });
  assert.match(s.sent[0].text,/<code>MOĪFR3OON ♛<\/code>/);
  assert.equal(s.sent[0].reply_markup.inline_keyboard[0][0].copy_text.text,name);
  assert.deepEqual(s.sent[1].reply_markup.keyboard,[[{text:LOOKUP_BUTTON}]]);
});
test('group messages are not intercepted',async()=>{
  const s=setup();assert.equal(await handleMenuMessage(msg('/admin',{chat:{id:-5,type:'group'}}),s.opts),false);
  assert.equal(s.sent.length,0);
});
