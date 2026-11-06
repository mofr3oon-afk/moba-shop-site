import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCatalogItems,savingsPercent} from '../js/catalog-controls.js';
const items=[{id:'a',name:'شدات 60',price:70,salePrice:55},{id:'b',name:'شدات 325',price:200,status:'hidden'},{id:'c',name:'جواهر 100',price:40,status:'disabled'}];
test('Arabic search handles digit variants and letter forms',()=>{
  assert.equal(selectCatalogItems(items,{query:'٦٠'})[0].id,'a');
  assert.equal(selectCatalogItems([{id:'d',name:'أسبوعية',price:20}],{query:'اسبوعية'})[0].id,'d');
});
test('status filters preserve hidden rows for admins without mixing sale and availability',()=>{
  assert.deepEqual(selectCatalogItems(items,{filter:'hidden'}).map(p=>p.id),['b']);
  assert.deepEqual(selectCatalogItems(items,{filter:'available'}).map(p=>p.id),['a']);
  assert.deepEqual(selectCatalogItems(items,{filter:'sale'}).map(p=>p.id),['a']);
});
test('sorting uses sale prices, stays stable, and never mutates the source',()=>{
  const before=items.map(p=>p.id);assert.deepEqual(selectCatalogItems(items,{sort:'low'}).map(p=>p.id),['c','a','b']);assert.deepEqual(items.map(p=>p.id),before);
  assert.deepEqual(selectCatalogItems(items,{sort:'high'}).map(p=>p.id),['b','a','c']);
});
test('discount badges never invent savings for zero, invalid, or higher sale prices',()=>{
  assert.equal(savingsPercent(items[0]),21);for(const p of [{price:0,salePrice:5},{price:10,salePrice:20},{price:10,salePrice:0},{price:NaN,salePrice:3}])assert.equal(savingsPercent(p),0);
});
