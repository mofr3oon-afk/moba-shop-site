const paths = {
  home:'<path d="m3 10 8-7a1.5 1.5 0 0 1 2 0l8 7v8a2 2 0 0 1-2 2h-4v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5H5a2 2 0 0 1-2-2z"/>',
  cart:'<rect x="4" y="8" width="16" height="13" rx="3"/><path fill="none" d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  orders:'<path d="M6 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2z"/><path fill="none" d="M8 8h8m-8 4h6"/>',
  chat:'<path d="M7 4h10a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-6l-6 4v-5a4 4 0 0 1-2-3V8a4 4 0 0 1 4-4z"/><path fill="none" d="M8 11h.01m4 0h.01m4 0h.01"/>',
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  arrow:'<path d="M20 12H4m6-6-6 6 6 6"/>',
  gem:'<path d="m4 8 4-4h8l4 4-8 12zM4 8h16m-11 0 3 12 3-12"/>',
  bolt:'<path d="m13 2-8 12h6l-1 8 9-12h-6z"/>',
  box:'<path d="m12 3 8 4v10l-8 4-8-4V7zm-8 4 8 4 8-4m-8 4v10"/>',
  edit:'<path d="m4 15 11-11 5 5-11 11H4zm8-8 5 5"/>',
  refresh:'<path d="M20 9a8 8 0 1 0-1 8M20 3v6h-6"/>',
  shield:'<path d="m12 3 8 3v6c0 5-4 8-8 10-4-2-8-5-8-10V6zm-4 9 3 3 5-6"/>'
};

export function storeIcon(name){
  return `<svg class="shop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||''}</svg>`;
}

export function mountStoreIcons(root){
  for(const node of root.querySelectorAll('[data-shop-icon]')){
    node.insertAdjacentHTML('afterbegin',storeIcon(node.dataset.shopIcon));
    node.removeAttribute('data-shop-icon');
  }
}
