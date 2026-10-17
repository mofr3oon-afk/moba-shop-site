export const LOOKUP_BUTTON = '🔎 معرفة اسم لاعب PUBG';
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
  const b=MENU_BUTTONS;
  return keyboard(admin ? [[LOOKUP_BUTTON],[b.pending,b.open],[b.customer,b.reports],[b.status]] : [[LOOKUP_BUTTON]]);
}

const normalizeDigits = value=>String(value).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660))
  .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));

// Reuse the existing admin handlers; no duplicated order or payment logic.
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
  if(['/admin','/help'].includes(cmd) || text===b.home){
    await say('🛠 لوحة MOBA SHOP\nاختار اللي محتاجه من الأزرار تحت.\nكل الأوامر الإضافية لسه متاحة من /commands.',mainKeyboard(true));
    return true;
  }
  if(cmd==='/commands'){await run('/admin');return true;}
  if(text===b.reports){
    await say('📊 اختار التقرير:',keyboard([[b.today,b.week],[b.month,b.stats],[b.home]]));
    return true;
  }
  if(text===b.status){
    await say('🏪 حالة المتجر\nاختار عرض الحالة أو تغييرها. تغيير الحالة مش بيوقف استقبال الطلبات.',
      keyboard([[b.current],[b.available,b.busy],[b.closed],[b.home]]));
    return true;
  }
  const commands={
    [b.pending]:'/pending',[b.today]:'/today',[b.week]:'/week',[b.month]:'/month',
    [b.stats]:'/stats',[b.current]:'/status_now',[b.available]:'/available',
    [b.busy]:'/busy',[b.closed]:'/closed'
  };
  if(commands[text]){await run(commands[text]);return true;}
  const input=text===b.open?'open':text===b.customer?'customer':null;
  if(input){await say(INPUT_PROMPTS[input],{force_reply:true,selective:true});return true;}
  // Slash commands always remain available, even when replying to an input prompt.
  if(prompt && !text.startsWith('/')){
    const value=normalizeDigits(text);
    if(prompt==='customer' && !/^01[0-9]{9}$/.test(value)){
      await say('❌ الرقم لازم 11 رقم ويبدأ بـ01. اضغط سجل عميل وجرب تاني.',mainKeyboard(true));
      return true;
    }
    if(prompt==='open' && (value.length>100 || !/^[\p{L}\p{N} _-]+$/u.test(value))){
      await say('❌ رقم الطلب مش واضح. اضغط فتح طلب وجرب تاني.',mainKeyboard(true));
      return true;
    }
    await run(`${prompt==='open'?'/open':'/customer'} ${value}`);
    await say('اختار خدمة تانية من القائمة:',mainKeyboard(true));
    return true;
  }
  return false;
}
