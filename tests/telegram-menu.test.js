import test from 'node:test';
import assert from 'node:assert/strict';
import {handleMenuMessage,mainKeyboard,MENU_BUTTONS as b,INPUT_PROMPTS} from '../lib/telegram-menu.js';
import {handlePubgMessage,PUBG_LOOKUP_BUTTON} from '../lib/telegram-pubg.js';

const msg=(text,extra={})=>({chat:{id:111,type:'private'},from:{id:111},text,...extra});
const reply=kind=>({text:INPUT_PROMPTS[kind],from:{id:123,is_bot:true}});
function setup(admin=true){
  const sent=[],commands=[];
  return {sent,commands,opts:{admin,botId:'123',send:async(method,payload)=>sent.push(payload),runCommand:async message=>commands.push(message)}};
}
test('admin home replaces stale package keyboard with useful actions',async()=>{
  const s=setup();await handleMenuMessage(msg('/admin'),s.opts);
  const texts=s.sent[0].reply_markup.keyboard.flat().map(x=>x.text);
  assert.deepEqual(texts,[PUBG_LOOKUP_BUTTON,b.pending,b.open,b.customer,b.reports,b.status]);
  assert.equal(s.sent[0].reply_markup.is_persistent,true);
  assert.ok(!texts.some(x=>/Prime|UC Total|Back|Cancel Order/.test(x)));
});
test('admin start, cancel, and successful lookup retain the full admin keyboard',async()=>{
  for(const text of ['/start','/cancel','5285527481']){
    const s=setup();
    await handlePubgMessage(msg(text),{...s.opts,limit:async()=>{},lookup:async id=>({id,nickname:'MOĪFR3OON'})});
    assert.deepEqual(s.sent.at(-1).reply_markup,mainKeyboard(true));
  }
});
test('reports and status open concise submenus with a home button',async()=>{
  for(const button of [b.reports,b.status]){
    const s=setup();await handleMenuMessage(msg(button),s.opts);
    assert.ok(s.sent[0].reply_markup.keyboard.flat().some(x=>x.text===b.home));
    assert.equal(s.commands.length,0);
  }
});
test('action buttons run the existing commands with the same sender',async()=>{
  const pairs=[[b.pending,'/pending'],[b.today,'/today'],[b.week,'/week'],[b.month,'/month'],
    [b.stats,'/stats'],[b.current,'/status_now'],[b.available,'/available'],[b.busy,'/busy'],[b.closed,'/closed']];
  for(const [button,cmd] of pairs){
    const s=setup();assert.equal(await handleMenuMessage(msg(button),s.opts),true);
    assert.equal(s.commands[0].text,cmd);assert.equal(s.commands[0].from.id,111);
  }
});
test('open-order and customer replies use existing searches rather than PUBG lookup',async()=>{
  for(const [kind,button,input,command] of [['open',b.open,'MOBA ١٠٠١','/open MOBA 1001'],
    ['customer',b.customer,'٠١٠١٢٣٤٥٦٧٨','/customer 01012345678']]){
    const s=setup();await handleMenuMessage(msg(button),s.opts);
    assert.equal(s.sent[0].reply_markup.force_reply,true);
    assert.equal(s.sent[0].text,INPUT_PROMPTS[kind]);
    assert.equal(await handleMenuMessage(msg(input,{reply_to_message:reply(kind)}),s.opts),true);
    assert.equal(s.commands[0].text,command);assert.deepEqual(s.sent.at(-1).reply_markup,mainKeyboard(true));
  }
});
test('invalid search input is rejected without calling order handlers',async()=>{
  for(const [kind,input] of [['customer','123'],['open','?'.repeat(120)]]){
    const s=setup();await handleMenuMessage(msg(input,{reply_to_message:reply(kind)}),s.opts);
    assert.equal(s.commands.length,0);assert.match(s.sent[0].text,/❌/);
  }
});
test('ordinary users cannot invoke admin menus, actions, or input replies',async()=>{
  for(const text of ['/admin','/commands',b.pending,b.closed,b.reports,'01012345678']){
    const s=setup(false);await handleMenuMessage(msg(text,{reply_to_message:reply('customer')}),s.opts);
    assert.equal(s.commands.length,0);assert.deepEqual(s.sent[0].reply_markup,mainKeyboard(false));
  }
});
test('unknown replies, group messages, and existing slash commands are not intercepted',async()=>{
  const s=setup();
  for(const message of [msg('5285527481'),msg('/today'),msg('/cancel',{reply_to_message:reply('open')}),
    msg('MOBA 1',{reply_to_message:{...reply('open'),from:{id:999,is_bot:true}}}),
    msg('/admin',{chat:{id:-5,type:'group'}})]){
    assert.equal(await handleMenuMessage(message,s.opts),false);
  }
  assert.equal(s.commands.length,0);
});
test('full command list remains available as an advanced option',async()=>{
  const s=setup();await handleMenuMessage(msg('/commands'),s.opts);
  assert.equal(s.commands[0].text,'/admin');
});
