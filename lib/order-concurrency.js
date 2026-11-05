export function orderMutationPath(order){
  let query=`orders?id=eq.${encodeURIComponent(order.id)}&status=eq.${encodeURIComponent(order.status||'')}`;
  if(order.updated_at)query+=`&updated_at=eq.${encodeURIComponent(order.updated_at)}`;
  else if(Object.hasOwn(order,'updated_at'))query+='&updated_at=is.null';
  return query;
}
export function nextOrderTimestamp(order){
  const previous=Date.parse(order.updated_at);return new Date(Math.max(Date.now(),Number.isFinite(previous)?previous+1:0)).toISOString();
}
