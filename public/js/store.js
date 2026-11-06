import {validOrderAccess} from './tracking-links.js';
const CART_KEY = 'moba_clean_cart';
let memoryOrderAccess={};
const forgottenOrders=new Set();
const DEVICE_KEY = 'moba_device_id';
export function rememberOrder(data){
  if(!validOrderAccess(data.orderId,{token:data.trackingToken,phone:data.phone||''}))return;
  forgottenOrders.delete(data.orderId);
  const saved=readOrderAccess();
  saved[data.orderId]={token:data.trackingToken,phone:data.phone||'',orderCode:data.orderCode||data.orderId};
  memoryOrderAccess=saved;
  try{localStorage.setItem('moba_order_access',JSON.stringify(saved));}catch{}
}
export function readOrderAccess(){
  let saved;try{saved=JSON.parse(localStorage.getItem('moba_order_access')||'{}');}catch{}
  if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
  return Object.fromEntries(Object.entries({...saved,...memoryOrderAccess}).filter(([id,value])=>!forgottenOrders.has(id)&&validOrderAccess(id,value)));
}
export function forgetOrderAccess(id){
  const saved=readOrderAccess();delete saved[id];memoryOrderAccess=saved;
  forgottenOrders.add(id);
  try{localStorage.setItem('moba_order_access',JSON.stringify(saved));return true;}catch{return false;}
}
export function money(n){ return `${Number(n||0).toLocaleString('en-US')} جنيه`; }
export function readCart(){
  try{
    const value=JSON.parse(localStorage.getItem(CART_KEY)||'[]');if(!Array.isArray(value))return [];
    return value.filter(item=>item&&typeof item==='object'&&typeof item.productId==='string'&&item.productId&&Number.isFinite(Number(item.price))&&Number(item.price)>=0&&Number.isSafeInteger(Number(item.qty??1))&&Number(item.qty??1)>=1&&Number(item.qty??1)<=20).slice(0,30).map(item=>({...item,qty:item.noQty?1:Number(item.qty??1),price:Number(item.price)}));
  }catch{return [];}
}
export function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); window.dispatchEvent(new Event('cart:changed')); }
export function clearCart(){ saveCart([]); }
export function cartTotal(cart=readCart()){ return cart.reduce((s,x)=>s + Number(x.price||0)*Math.max(1,Number(x.qty||1)),0); }
export function cartUnits(cart=readCart()){ return cart.reduce((s,x)=>s + Math.max(1,Number(x.qty||1)),0); }
export function addCartItem(item){
  const cart = readCart();
  if(item.noQty && cart.some(x=>x.productId===item.productId)) return saveCart(cart);
  const same = cart.find(x=>x.productId===item.productId && x.pubgId===item.pubgId && x.pubgName===item.pubgName && JSON.stringify(x.extraFields||{})===JSON.stringify(item.extraFields||{}));
  if(same && (item.noQty || same.noQty)) return saveCart(cart);
  if(same && !item.noQty) same.qty = Math.min(20, Number(same.qty||1)+Number(item.qty||1));
  else cart.push({...item, qty: item.noQty ? 1 : Math.max(1, Number(item.qty||1))});
  saveCart(cart);
}
export function updateCartItem(index, patch){
  const cart = readCart();
  if(cart[index]) cart[index] = {...cart[index], ...patch, qty: cart[index].noQty ? 1 : (patch.qty ?? cart[index].qty)};
  saveCart(cart);
}
export function removeCartItem(index){
  const cart = readCart();
  cart.splice(index,1);
  saveCart(cart);
}
export function deviceId(){
  let id = localStorage.getItem(DEVICE_KEY);
  if(!id){ id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(DEVICE_KEY,id); }
  return id;
}
export function toast(text,type='ok'){
  let box = document.querySelector('.toast-box');
  if(!box){ box=document.createElement('div'); box.className='toast-box'; document.body.appendChild(box); }
  const el=document.createElement('div'); el.className=`message ${type==='err'?'err':'ok'}`; el.textContent=text; box.appendChild(el);
  Object.assign(box.style,{position:'fixed',top:'86px',left:'16px',zIndex:80,width:'min(360px,calc(100vw - 32px))'});
  setTimeout(()=>el.remove(),3600);
}
