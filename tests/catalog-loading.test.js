import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../js/catalog.js';
import {gameStartingPrice} from '../js/storefront-studio.js';
const original=globalThis.fetch;after(()=>{globalThis.fetch=original;});
const fixture=settings=>{globalThis.fetch=async()=>new Response(JSON.stringify({ok:true,settings}));};
test('hidden flags and sparse tombstones never resurrect base products',async()=>{
  fixture({dynamic_products:[{id:'pubg_60',hidden:true},{id:'pubg_325',status:'hidden'}]});
  const catalog=await loadCatalog();assert.ok(!catalog.products.some(p=>['pubg_60','pubg_325'].includes(p.id)));
});
test('partial overrides preserve base game, section and price; hidden sections remove their packages',async()=>{
  fixture({dynamic_products:[{id:'pubg_60',name:'Renamed'}]});
  let catalog=await loadCatalog();const p=catalog.products.find(p=>p.id==='pubg_60');assert.equal(p.price,50);assert.equal(p.game,'pubg');
  fixture({dynamic_sections:[{game:'pubg',slug:'uc',name:'UC',status:'hidden'}]});catalog=await loadCatalog();assert.ok(!catalog.products.some(p=>p.game==='pubg'));
});
test('failed or malformed settings do not display fallback prices',async()=>{
  globalThis.fetch=async()=>new Response('{"ok":false}',{status:503});await assert.rejects(loadCatalog);
  globalThis.fetch=async()=>{throw new Error('offline');};await assert.rejects(loadCatalog);
});
test('starting prices exclude expired, disabled and absent-section packages',()=>{
  const catalog={sections:[{game:'g',slug:'s',status:'available'}],products:[{id:'one',game:'g',section:'s',price:50},{id:'two',game:'g',section:'s',price:1,status:'disabled'},{id:'three',game:'g',section:'missing',price:2}]};
  assert.equal(gameStartingPrice(catalog,{slug:'g'}),50);
});
