const paths = {
  home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-6h6v6"/>',
  cart:'<path d="M2 4h3l3 11h10l3-8H6"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/>',
  orders:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8m-8 4h8m-8 4h5"/>',
  chat:'<path d="M4 4h16v12H9l-5 4zM8 9h8m-8 3h5"/>',
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
