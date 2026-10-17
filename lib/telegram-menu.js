export const LOOKUP_BUTTON = '🔎 فحص PUBG ID';
export const MENU_BUTTONS = {
  pending:'📦 الطلبات المعلقة', open:'🧾 فتح طلب', customer:'👤 سجل عميل',
  reports:'📊 التقارير', status:'🏪 حالة المتجر', home:'🏠 القائمة الرئيسية',
  today:'📅 تقرير اليوم', week:'📆 تقرير الأسبوع', month:'🗓 تقرير الشهر',
  stats:'📈 إحصائيات اليوم', current:'👁 الحالة الحالية',
  available:'🟢 متاح الآن', busy:'🟡 ضغط طلبات', closed:'🔴 خارج المواعيد'
};
export const INPUT_PROMPTS = {
  open:'🧾 ابعت رقم الطلب في رد على الرسالة دي، مثال: MOBA 1001\nللرجوع اكتب /cancel',
  customer:'👤 ابعت رقم موبايل العميل (11 رقم) في رد على الرسالة دي.\nللرجوع اكتب /cancel'
};

const keyboard = rows=>({keyboard:rows.map(row=>row.map(text=>({text}))),resize_keyboard:true,is_persistent:true});
export function mainKeyboard(admin=false){
  return keyboard(process.env.TOPUP_ENABLED==='true'?[[LOOKUP_BUTTON],[ '🛒 شحن 60 UC' ]]:[[LOOKUP_BUTTON]]);
}

// Retain legacy labels only to replace stale keyboards without executing their actions.
export async function handleMenuMessage(msg,{send,runCommand,admin=false,botId}={}){
  if(msg?.chat?.type !== 'private' || !msg.from || typeof msg.text !== 'string') return false;
  const text=msg.text.trim();
  const cmd=text.split(/\s+/)[0].split('@')[0];
  const b=MENU_BUTTONS;
  const adminButton=Object.values(b).includes(text);
  const reply=msg.reply_to_message;
  const ownReply=reply?.from?.is_bot === true && String(reply.from.id)===String(botId);
  const prompt=ownReply && Object.entries(INPUT_PROMPTS).find(([,value])=>value===reply.text)?.[0];
  const adminMenuCommand=['/admin','/help','/commands'].includes(cmd);
  if(!admin){
    if(adminButton || prompt || adminMenuCommand){
      await send('sendMessage',{chat_id:msg.chat.id,text:'القائمة دي خاصة بمسؤول المتجر. تقدر تستخدم معرفة اسم لاعب PUBG.',reply_markup:mainKeyboard()});
      return true;
    }
    return false;
  }
  const say=(message,markup)=>send('sendMessage',{chat_id:msg.chat.id,text:message,...(markup?{reply_markup:markup}:{})});
  const run=text=>runCommand({...msg,text});
  if(['/admin','/help'].includes(cmd) || adminButton || (prompt && !text.startsWith('/'))){
    await say('🎮 فحص PUBG Mobile\nاضغط «🔎 فحص PUBG ID» وابعت رقم اللاعب لمعرفة اسمه داخل اللعبة.',mainKeyboard());
    return true;
  }
  if(cmd==='/commands'){await run('/admin');return true;}
  return false;
}
