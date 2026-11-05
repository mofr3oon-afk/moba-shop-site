import test from 'node:test';
import assert from 'node:assert/strict';
import {imageSource,mergeCatalogRows,validateCatalogDraft,gameTile,productFace} from '../js/catalog-presentation.js';

test('editor merge preserves hidden rows and fields not exposed by the editor',()=>{
  const rows=mergeCatalogRows([{id:'one',name:'A',price:55,custom_fields:[{key:'zoneId'}]}],[{id:'one',status:'hidden'}]);
  assert.equal(rows.length,1);assert.equal(rows[0].status,'hidden');assert.equal(rows[0].price,55);assert.equal(rows[0].custom_fields[0].key,'zoneId');
});
test('catalog edits normalize Arabic amounts and reject invalid or misleading prices',()=>{
  assert.equal(validateCatalogDraft('product',{name:'UC',price:'٥٥',salePrice:'٥٠',order:'٢'}).price,55);
  for(const price of ['-1','NaN','Infinity','0'])assert.throws(()=>validateCatalogDraft('product',{name:'UC',price,salePrice:0}));
  assert.throws(()=>validateCatalogDraft('product',{name:'UC',price:55,salePrice:60}));
  assert.equal(validateCatalogDraft('product',{name:'UC',price:55,salePrice:0,cost:''}).cost,null);
  assert.doesNotMatch(productFace({id:'one',name:'UC',price:'٥٥',salePrice:'٤٩'}),/NaN|ليس/);
});
test('image inputs and shared cards reject executable image URLs and escape content',()=>{
  assert.equal(imageSource('javascript:alert(1)'),'/assets/moba-shop-logo-256.png');
  assert.equal(imageSource('data:image/svg+xml,<svg/>'),'/assets/moba-shop-logo-256.png');
  assert.equal(imageSource('/assets/game-covers/pubg.webp'),'/assets/game-covers/pubg.webp');
  assert.doesNotMatch(gameTile({slug:'pubg',name:'<script>',cover:'javascript:alert(1)',status:'available'}),/<script>|javascript:/);
  const card=productFace({id:'" onclick="bad',name:'<img onerror=bad>',price:55,salePrice:50,status:'hidden'},{editor:true});
  assert.doesNotMatch(card,/<img onerror/);assert.match(card,/مخفي/);assert.match(card,/<del>/);
});
