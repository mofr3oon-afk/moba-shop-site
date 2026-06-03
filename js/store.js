const CART_KEY = 'moba_clean_cart';
const DEVICE_KEY = 'moba_device_id';
export function money(n){ return `${Number(n||0).toLocaleString('en-US')} جنيه`; }
export function readCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch{return []} }
export function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); window.dispatchEvent(new Event('cart:changed')); }
export function clearCart(){ saveCart([]); }
export function cartTotal(cart=readCart()){ return cart.reduce((s,x)=>s + Number(x.price||0)*Math.max(1,Number(x.qty||1)),0); }
export function cartUnits(cart=readCart()){ return cart.reduce((s,x)=>s + Math.max(1,Number(x.qty||1)),0); }
export function addCartItem(item){
  const cart = readCart();
  const same = cart.find(x=>x.productId===item.productId && x.pubgId===item.pubgId && x.pubgName===item.pubgName && JSON.stringify(x.extraFields||{})===JSON.stringify(item.extraFields||{}));
  if(same && item.noQty) return saveCart(cart);
  if(same && !item.noQty) same.qty = Math.min(20, Number(same.qty||1)+Number(item.qty||1));
  else cart.push({...item, qty: Math.max(1, Number(item.qty||1))});
  saveCart(cart);
}
export function updateCartItem(index, patch){
  const cart = readCart();
  if(cart[index]) cart[index] = {...cart[index], ...patch};
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
