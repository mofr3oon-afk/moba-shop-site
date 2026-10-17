import { lookupPubgPlayer, normalizePubgId, InvalidPubgId, PubgLookupUnavailable } from './pubg-lookup.js';

export const PUBG_LOOKUP_BUTTON = '🔎 معرفة اسم لاعب PUBG';
export const PUBG_LOOKUP_PROMPT = 'ابعت PUBG Mobile ID بالأرقام علشان أجيب اسم اللاعب جوه اللعبة.\nللإلغاء اكتب /cancel';
const mainKeyboard = {keyboard:[[{text:PUBG_LOOKUP_BUTTON}]],resize_keyboard:true};

// Stateless: Telegram carries the reply context, so Vercel cold starts do not lose it.
// Numeric IDs and /pubg ID also work without replying to a previous prompt.
export async function handlePubgMessage(msg,{send,limit,lookup=lookupPubgPlayer,botId}={}){
  if(msg?.chat?.type !== 'private' || !msg.from || typeof msg.text !== 'string') return false;
  const text = msg.text.trim();
  const [rawCmd,...args] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0];
  const sendText = (message,markup)=>send('sendMessage',{
    chat_id:msg.chat.id,text:message,...(markup?{reply_markup:markup}:{})
  });
  if(cmd === '/start'){
    await sendText('أهلًا بيك في MOBA SHOP 🔥\nاختار الخدمة من الزر اللي تحت.\nللإدارة استخدم /admin.',mainKeyboard);
    return true;
  }
  if(cmd === '/cancel'){
    await sendText('تم إلغاء البحث. اضغط زر البحث لو حابب تبدأ من جديد.',mainKeyboard);
    return true;
  }
  if(text === PUBG_LOOKUP_BUTTON || (cmd === '/pubg' && !args.length)){
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
    // Plain text prevents nicknames from becoming Telegram HTML or Markdown.
    await sendText(`✅ اسم اللاعب داخل اللعبة: ${player.nickname}\n🆔 PUBG ID: ${player.id}`,mainKeyboard);
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
