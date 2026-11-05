import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesGame,normalizeDigits,productIsAvailable,escapeText} from '../js/interface-utils.js';
import {readCart} from '../js/store.js';
import {orderMutationPath,nextOrderTimestamp} from '../lib/order-concurrency.js';

test('Arabic and English game searches find the same game',()=>{
  const game={slug:'pubg',name:'PUBG Mobile',subtitle:'UC'};
  for(const query of ['PUBG','ببجي','شَدّات',' pubg '])assert.equal(matchesGame(game,query),true);
  assert.equal(matchesGame(game,'Roblox'),false);
});
test('Arabic and Persian digits normalize without changing account names',()=>{
  assert.equal(normalizeDigits('٠١٠٩٨٧٦٥٤٣٢'),'01098765432');
  assert.equal(normalizeDigits('۱۲۳۴۵۶'),'123456');assert.equal(normalizeDigits('MO FR3OON'),'MO FR3OON');
});
test('expired, future, hidden and disabled products cannot be selected',()=>{
  const now=Date.parse('2026-11-05T12:00:00Z');
  assert.equal(productIsAvailable({status:'available'},now),true);
  for(const product of [{status:'disabled'},{status:'soon'},{hidden:true},{endsAt:'2026-11-04T12:00:00Z'},{startsAt:'2026-11-06T12:00:00Z'},{startsAt:'invalid'}])assert.equal(productIsAvailable(product,now),false);
});
test('damaged legacy cart data does not crash customer navigation',()=>{
  const saved=globalThis.localStorage;
  try{
    for(const raw of ['{}','null','"old cart"','not-json']){globalThis.localStorage={getItem:()=>raw};assert.deepEqual(readCart(),[]);}
    globalThis.localStorage={getItem:()=>JSON.stringify([{productId:'ok',qty:2,price:50},{productId:'bad',qty:'<img>',price:10},{productId:'bad2',qty:1,price:'NaN'}])};
    assert.equal(readCart().length,1);assert.equal(readCart()[0].qty,2);
  }finally{globalThis.localStorage=saved;}
});
test('status mutations include original state and timestamp for conflict detection',()=>{
  const order={id:'order 1',status:'pending',updated_at:'2026-11-05T12:00:00.000Z'};
  const url=new URL('https://db.test/'+orderMutationPath(order));
  assert.equal(url.searchParams.get('id'),'eq.order 1');assert.equal(url.searchParams.get('status'),'eq.pending');assert.equal(url.searchParams.get('updated_at'),'eq.'+order.updated_at);
  assert.ok(+new Date(nextOrderTimestamp(order))>+new Date(order.updated_at));
});
test('display values cannot inject markup into new dialog or cards',()=>{
  assert.equal(escapeText('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
});
