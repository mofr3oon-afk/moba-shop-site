export function customerWhatsAppUrl(phone){
  const value=String(phone||'').trim();
  return /^01\d{9}$/.test(value)?`https://wa.me/2${value}`:'';
}
