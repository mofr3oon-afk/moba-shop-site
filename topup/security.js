import crypto from 'node:crypto';

export class ShopError extends Error {
  constructor(code,status=400){super(code);this.code=code;this.status=status;}
}
export function insist(condition,code,status=400){if(!condition) throw new ShopError(code,status);}
export function money(value){
  const text=String(value).trim();
  insist(/^\d{1,7}(\.\d{1,2})?$/.test(text),'INVALID_AMOUNT');
  const [pounds,piastres='']=text.split('.');
  return Number(pounds)*100+Number(piastres.padEnd(2,'0'));
}
export function phone(value){
  const text=String(value).trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660))
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0)).replace(/^\+?20/,'0');
  insist(/^01[0-9]{9}$/.test(text),'INVALID_PHONE');return text;
}
export function digest(secret,value){return crypto.createHmac('sha256',secret).update(value).digest('hex');}
export class Vault {
  constructor({keys,currentKeyId='v1',fingerprintKey}){
    this.keys=Object.fromEntries(Object.entries(keys).map(([id,key])=>[id,Buffer.from(key,'base64')]));
    insist(Object.values(this.keys).every(k=>k.length===32)&&this.keys[currentKeyId],'INVALID_ENCRYPTION_KEY');
    insist(typeof fingerprintKey==='string'&&fingerprintKey.length>=32,'INVALID_FINGERPRINT_KEY');
    this.currentKeyId=currentKeyId;this.fingerprintKey=fingerprintKey;
  }
  hash(value){return digest(this.fingerprintKey,value);}
  seal(value,aad){
    const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',this.keys[this.currentKeyId],iv);
    cipher.setAAD(Buffer.from(aad));
    const data=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
    return JSON.stringify({key:this.currentKeyId,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')});
  }
  open(box,aad){
    try{
      const data=JSON.parse(box);const cipher=crypto.createDecipheriv('aes-256-gcm',this.keys[data.key],Buffer.from(data.iv,'base64'));
      cipher.setAAD(Buffer.from(aad));cipher.setAuthTag(Buffer.from(data.tag,'base64'));
      return Buffer.concat([cipher.update(Buffer.from(data.data,'base64')),cipher.final()]).toString('utf8');
    }catch{throw new ShopError('DECRYPTION_FAILED',500);}
  }
}
// Signature covers the exact body, route, timestamp, and single-use nonce.
export function signEnvelope(secret,method,path,timestamp,nonce,body){
  return digest(secret,`${method}\n${path}\n${timestamp}\n${nonce}\n${body}`);
}
export function verifyEnvelope(secret,{method,path,headers,body,now=Date.now()}){
  insist(typeof secret==='string'&&secret.length>=32,'AUTH_NOT_CONFIGURED',503);
  const timestamp=headers['x-shop-timestamp'];const nonce=headers['x-shop-nonce'];const sig=headers['x-shop-signature'];
  insist(/^\d{13}$/.test(String(timestamp))&&Math.abs(now-Number(timestamp))<=300000,'STALE_REQUEST',401);
  insist(/^[A-Za-z0-9_-]{16,100}$/.test(String(nonce))&&/^[a-f0-9]{64}$/.test(String(sig)),'BAD_SIGNATURE',401);
  const expected=signEnvelope(secret,method,path,timestamp,nonce,body);
  insist(crypto.timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(expected,'hex')),'BAD_SIGNATURE',401);
  return {nonce,expires:now+600000};
}
