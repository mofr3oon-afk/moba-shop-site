const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);
export function validOrderAccess(id,value){return validId(id)&&value&&typeof value==='object'&&/^[a-f0-9]{64}$/.test(value.token)&&typeof value.phone==='string'&&/^(?:01\d{9})?$/.test(value.phone);}
export function trackingLink(origin,id,access){
  if(!validOrderAccess(id,access))throw new Error('بيانات المتابعة غير مكتملة');
  const url=new URL('/track',origin);
  url.hash=new URLSearchParams({id,key:access.token,phone:access.phone}).toString();
  return url.href;
}
export function parseTrackingLink(hash){
  if(typeof hash!=='string'||hash.length>500)return null;
  const params=new URLSearchParams(hash.replace(/^#/,''));
  const id=params.get('id'),access={token:params.get('key'),phone:params.get('phone')||''};
  return validOrderAccess(id,access)?{id,...access}:null;
}
