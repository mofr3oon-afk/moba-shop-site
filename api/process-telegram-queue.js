import { json, supabaseReady, supabaseRequest, telegramJson, telegramKeyboard, buildTelegramText } from '../lib/_utils.js';
import { requireInternalSecret, rateLimit, persistentRateLimit, safeError } from '../lib/_security.js';

async function patchOrder(id, patch){
  return supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`,{
    method:'PATCH',
    headers:{Prefer:'return=minimal'},
    body:JSON.stringify(patch)
  });
}

export default async function handler(req,res){
  try{
    rateLimit(req,'telegram-queue',20,60_000);
    await persistentRateLimit(req,'telegram-queue-persistent',30,60_000);
    requireInternalSecret(req);
    if(req.method !== 'GET' && req.method !== 'POST') return json(res,405,{ok:false,error:'Method not allowed'});
    if(!supabaseReady()) return json(res,200,{ok:false,error:'Supabase غير مفعل'});

    const rows = await supabaseRequest('orders?select=*&order=created_at.desc&limit=80').catch(()=>[]);
    const pending = (rows||[]).filter(o => o?.raw_data?.telegramPending === true || (o.telegram_chat_id && !o.telegram_message_id)).slice(0,10);
    const results = [];
    for(const order of pending){
      try{
        const groupId = order.telegram_chat_id || process.env.ORDER_GROUP_ID;
        if(!groupId) throw new Error('ORDER_GROUP_ID missing');
        const data = await telegramJson('sendMessage',{
          chat_id:groupId,
          text:order.telegram_text || buildTelegramText(order),
          parse_mode:'HTML',
          reply_markup:telegramKeyboard(order.id,'pending')
        });
        const messageId = data?.result?.message_id || null;
        await patchOrder(order.id,{
          telegram_message_id:messageId,
          admin_message_id:String(messageId||''),
          message_id:String(messageId||''),
          updated_at:new Date().toISOString(),
          raw_data:{...(order.raw_data||{}),telegramOk:true,telegramPending:false,queueProcessedAt:new Date().toISOString(),queueNote:'Message resent without screenshot. Check original order row/admin panel.'}
        });
        results.push({id:order.id,ok:true,messageId});
      }catch(error){
        await patchOrder(order.id,{
          updated_at:new Date().toISOString(),
          raw_data:{...(order.raw_data||{}),telegramOk:false,telegramPending:true,queueLastError:String(error?.message||error).slice(0,220),queueLastTryAt:new Date().toISOString()}
        }).catch(()=>null);
        results.push({id:order.id,ok:false,error:String(error?.message||error)});
      }
    }
    return json(res,200,{ok:true,checked:(rows||[]).length,processed:results.length,results});
  }catch(e){
    return safeError(res,e,e.statusCode||500);
  }
}
