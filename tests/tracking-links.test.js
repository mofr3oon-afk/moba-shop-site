import test from 'node:test';
import assert from 'node:assert/strict';
import {trackingLink,parseTrackingLink,validOrderAccess} from '../js/tracking-links.js';
const access={token:'a'.repeat(64),phone:'01012345678'};
test('private tracking credentials stay in fragment, never request query',()=>{
  const link=new URL(trackingLink('https://shop.test','MOBA-100',access));
  assert.equal(link.pathname,'/track');assert.equal(link.search,'');
  assert.equal(link.href.split('#')[0].includes(access.token),false);
  assert.deepEqual(parseTrackingLink(link.hash),{id:'MOBA-100',...access});
});
test('tracking links validate token, ID and phone; manual orders permit empty phone',()=>{
  for(const token of ['', 'guess','a'.repeat(63)])assert.equal(validOrderAccess('MOBA-1',{...access,token}),false);
  assert.equal(validOrderAccess('../admin',access),false);
  assert.equal(validOrderAccess('__proto__',access),false);
  assert.equal(parseTrackingLink('#id=MOBA-1&key=guess'),null);
  assert.equal(parseTrackingLink('#'+'a'.repeat(501)),null);
  assert.equal(validOrderAccess('MOBA-1',{...access,phone:'not-a-phone'}),false);
  assert.deepEqual(parseTrackingLink(new URL(trackingLink('https://shop.test','MOBA-1',{...access,phone:''})).hash),{id:'MOBA-1',token:access.token,phone:''});
});
