import crypto from 'node:crypto';

function config(){
  const bucket=process.env.ORDER_RECEIPTS_BUCKET;
  if(!bucket||!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw unavailable();
  return {bucket,base:process.env.SUPABASE_URL.replace(/\/$/,''),headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`}};
}
function unavailable(){const e=new Error('حفظ إثبات الدفع غير متاح حاليا. تواصل مع الدعم قبل إعادة المحاولة.');e.statusCode=503;return e;}
export async function saveReceipt(orderId,file){
  const {bucket,base,headers}=config();
  const metadata=await fetch(`${base}/storage/v1/bucket/${encodeURIComponent(bucket)}`,{headers});
  if(!metadata.ok||(await metadata.json()).public!==false)throw unavailable();
  const ext=String(file.contentType).includes('png')?'png':String(file.contentType).includes('webp')?'webp':'jpg';
  const path=`${orderId}/${crypto.randomUUID()}.${ext}`;
  const response=await fetch(`${base}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`,{method:'POST',headers:{...headers,'Content-Type':file.contentType,'x-upsert':'false'},body:file.buffer});
  if(!response.ok)throw unavailable();
  return path;
}
export async function loadReceipt(path){
  if(!/^MOBA-[a-zA-Z0-9-]+\/[a-f0-9-]+\.(png|jpg|webp)$/.test(String(path)))throw unavailable();
  const {bucket,base,headers}=config();
  const response=await fetch(`${base}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`,{headers});
  if(!response.ok)throw unavailable();return response;
}
