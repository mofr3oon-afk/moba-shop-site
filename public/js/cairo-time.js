const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'});
export function cairoDateKey(date){
  const p=formatter.formatToParts(date);return ['year','month','day'].map(type=>p.find(x=>x.type===type).value).join('-');
}
export function cairoDayStart(day){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('تاريخ غير صالح');
  const utc=Date.parse(day+'T00:00:00Z');
  if(!Number.isFinite(utc)||new Date(utc).toISOString().slice(0,10)!==day)throw new Error('تاريخ غير صالح');
  // Find the first millisecond of the Cairo calendar day, including DST transitions.
  let lo=utc-86400000,hi=utc+86400000;
  while(lo<hi){const mid=Math.floor((lo+hi)/2);if(cairoDateKey(new Date(mid))<day)lo=mid+1;else hi=mid;}
  return new Date(lo);
}
export function cairoDayEnd(day){
  const next=new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString().slice(0,10);
  return new Date(+cairoDayStart(next)-1);
}
