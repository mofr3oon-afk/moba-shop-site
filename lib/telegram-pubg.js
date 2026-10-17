import { lookupPubgPlayer, normalizePubgId, InvalidPubgId, PubgLookupUnavailable } from './pubg-lookup.js';
import { LOOKUP_BUTTON, mainKeyboard as buildKeyboard } from './telegram-menu.js';

export const PUBG_LOOKUP_BUTTON = LOOKUP_BUTTON;
export const PUBG_LOOKUP_PROMPT = 'ابعت PUBG Mobile ID بالأرقام علشان أجيب اسم اللاعب جوه اللعبة.\nللإلغاء اكتب /cancel';

// Stateless: Telegram carries the reply context, so Vercel cold starts do not lose it.
// Numeric IDs and /pubg ID also work without replying to a previous prompt.
export async function handlePubgMessage(msg,{send,limit,lookup=lookupPubgPlayer,botId,admin=false}={}){
  if(msg?.chat?.type !== 'private' || !msg.from || typeof msg.text !== 'string') return false;
  const text = msg.text.trim();
  const [rawCmd,...args] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0];
  const mainKeyboard=buildKeyboard(admin);
  const sendText = (message,markup)=>send('sendMessage',{
    chat_id:msg.chat.id,text:message,...(markup?{reply_markup:markup}:{})
  });
  if(cmd === '/start'){
    await sendText('🎮 فحص PUBG Mobile\nاضغط «🔎 فحص PUBG ID» وابعت رقم اللاعب لمعرفة اسمه داخل اللعبة.',mainKeyboard);
    return true;
  }
  if(cmd === '/cancel'){
    await sendText('تم إلغاء البحث. اضغط زر البحث لو حابب تبدأ من جديد.',mainKeyboard);
    return true;
  }
  if([PUBG_LOOKUP_BUTTON,'🔎 معرفة اسم لاعب PUBG'].includes(text) || (cmd === '/pubg' && !args.length)){
    await sendText(PUBG_LOOKUP_PROMPT,{force_reply:true,input_field_placeholder:'مثال: 5285527481'});
    return true;
  }
  const reply = msg.reply_to_message;
  const repliesToPrompt = reply?.text === PUBG_LOOKUP_PROMPT && reply?.from?.is_bot === true &&
    String(reply.from.id) === String(botId);
  const numericText = /^[0-9٠-٩۰-۹]+$/.test(text);
  if(cmd !== '/pubg' && !repliesToPrompt && !numericText) return false;
  // Preserve all existing administration commands, including when replying to this prompt.
  if(text.startsWith('/') && cmd !== '/pubg') return false;
  let id;
  try{
    id = normalizePubgId(cmd === '/pubg' ? args.join(' ') : text);
  }catch(error){
    if(!(error instanceof InvalidPubgId)) throw error;
    await sendText('❌ ابعت PUBG ID صحيح: من 5 لـ15 رقم، من غير حروف.',{force_reply:true});
    return true;
  }
  try{
    await limit(msg.from.id);
  }catch(error){
    if(error.statusCode !== 429) throw error;
    await sendText('⏳ استنى شوية قبل البحث تاني. المسموح 6 محاولات في الدقيقة.');
    return true;
  }
  try{
    const player = await lookup(id);
    // Telegram copy_text copies the exact Unicode nickname, independent of formatting.
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    await send('sendMessage',{
      chat_id:msg.chat.id,
      text:`✅ <b>نتيجة فحص PUBG Mobile</b>\n\n👤 <b>اسم اللاعب</b>\n<code>${escape(player.nickname)}</code>\n\n🆔 <b>PUBG ID</b>\n<code>${escape(player.id)}</code>`,
      parse_mode:'HTML',
      reply_markup:{inline_keyboard:[[{text:'📋 نسخ اسم اللاعب',copy_text:{text:player.nickname}}]]}
    });
    // A message can have either inline or reply markup, so restore the single-button
    // keyboard separately after Telegram's ForceReply prompt.
    await sendText('لفحص لاعب تاني، اضغط الزر تحت 👇',mainKeyboard);
  }catch(error){
    if(error instanceof InvalidPubgId){
      await sendText('❌ ملقيتش لاعب بالـID ده. راجع الرقم وجرب تاني.',mainKeyboard);
    }else if(error instanceof PubgLookupUnavailable){
      await sendText('⚠️ خدمة معرفة الاسم مش متاحة دلوقتي. جرّب كمان شوية.',mainKeyboard);
    }else{
      throw error;
    }
  }
  return true;
}
