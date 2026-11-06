import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {rememberOrder,readOrderAccess,forgetOrderAccess} from '../js/store.js';
const original=globalThis.localStorage;let stored='{}',failWrite=false;
globalThis.localStorage={getItem:()=>stored,setItem:(key,value)=>{if(failWrite)throw new Error('blocked');stored=value;}};
after(()=>{globalThis.localStorage=original;});
test('device access rejects malformed rows, preserves valid legacy orders and forgets keys',()=>{
  stored=JSON.stringify({bad:{token:'guess',phone:'01012345678'},'MOBA-legacy':{token:'a'.repeat(64),phone:'01012345678',orderCode:'old'}});
  assert.deepEqual(Object.keys(readOrderAccess()),['MOBA-legacy']);
  rememberOrder({orderId:'MOBA-new',trackingToken:'b'.repeat(64),phone:'',orderCode:'new'});
  assert.equal(readOrderAccess()['MOBA-new'].orderCode,'new');
  assert.equal(forgetOrderAccess('MOBA-new'),true);assert.equal(readOrderAccess()['MOBA-new'],undefined);
  failWrite=true;assert.equal(forgetOrderAccess('MOBA-legacy'),false);assert.equal(readOrderAccess()['MOBA-legacy'],undefined);
  rememberOrder({orderId:'MOBA-memory',trackingToken:'c'.repeat(64),phone:''});assert.equal(readOrderAccess()['MOBA-memory'].token,'c'.repeat(64));
});
