// Free GoPay Games validation protocol researched from triyatna/php-valid-game.
// No orders, redemption, subscription, or payment endpoints are used.
export const PUBG_ACCOUNT_URL = 'https://gopay.co.id/games/v1/order/user-account';

export class InvalidPubgId extends Error {}
export class PubgLookupUnavailable extends Error {}

export function normalizePubgId(value){
  const id = String(value ?? '').trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660))
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));
  if(!/^[0-9]{5,15}$/.test(id)) throw new InvalidPubgId('Invalid PUBG Mobile ID');
  return id;
}

export function parsePubgAccount(status, body){
  if(!body || typeof body !== 'object' || Array.isArray(body)){
    throw new PubgLookupUnavailable('Unexpected provider response');
  }
  if(status === 404 && body.message === 'Invalid user account'){
    throw new InvalidPubgId('Player not found');
  }
  if(status < 200 || status >= 300) throw new PubgLookupUnavailable(`Provider HTTP ${status}`);
  const success = body.message === 'Success' || body.success === true || body.status === true;
  const name = body.data?.username || body.data?.userAccount;
  if(!success || typeof name !== 'string' || !name.trim() || name.length > 200){
    throw new PubgLookupUnavailable('Missing verified nickname');
  }
  return name.trim();
}

export async function lookupPubgPlayer(value, {fetchImpl=fetch}={}){
  const id = normalizePubgId(value);
  try{
    const response = await fetchImpl(PUBG_ACCOUNT_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json',Accept:'application/json','User-Agent':'Mozilla/5.0'},
      body:JSON.stringify({code:'PUBG_ID',data:{userId:id,zoneId:''}}),
      signal:AbortSignal.timeout(10_000)
    });
    const body = await response.json();
    return {id, nickname:parsePubgAccount(response.status,body)};
  }catch(error){
    if(error instanceof InvalidPubgId || error instanceof PubgLookupUnavailable) throw error;
    throw new PubgLookupUnavailable('Could not contact nickname provider');
  }
}
