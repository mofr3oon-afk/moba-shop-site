import { lookupPubgPlayer } from '../lib/pubg-lookup.js';
import { money, insist, ShopError } from './security.js';
import { parseStockFile } from './import.js';

export const BUY_BUTTON='🛒 شحن 60 UC';
const keyboard={keyboard:[[{text:'🔎 فحص PUBG ID'}],[{text:BUY_BUTTON}]],resize_keyboard:true};
const buttons=rows=>({inline_keyboard:rows.map(row=>row.map(([text,action])=>({text,callback_data:`shop:${action}`})))});
const funds=n=>(n/100).toFixed(2);
const panel=buttons([
  [['📥 جديدة / معلقة','orders'],['✅ مكتملة','completed']],
  [['📦 المخزون','stock'],['➕ إضافة أكواد','import']],
  [['💰 سعر البيع','price'],['⏯ البيع','sales']],
  [['📊 المبيعات والأرباح','report'],['⚠️ الأخطاء والتنبيهات','alerts']],
  [['🧪 اختبار','mode_sim'],['🔒 تشغيل حقيقي','mode_live']],
  [['🔔 حد تنبيه المخزون','threshold']]
]);
export class TelegramShop {
  constructor({shop,lookup=lookupPubgPlayer,downloadFile}){this.shop=shop;this.lookup=lookup;this.downloadFile=downloadFile;}
  accepts(update){
    const m=update.message||update.callback_query?.message;
    if(m?.chat?.type!=='private') return false;
    if(update.callback_query) return String(update.callback_query.data||'').startsWith('shop:');
    if(!update.message?.from) return false;
    const text=String(m.text||'').trim();const user=m.from.id;
    if(text==='🔎 فحص PUBG ID'||text==='🔎 معرفة اسم لاعب PUBG'||/^\/pubg(?:@\w+)?(?:\s|$)/.test(text)){
      this.shop.session(user,null);return false;
    }
    if(/^\/start(?:@\w+)?(?:\s|$)/.test(text)||text===BUY_BUTTON||/^\/shop(?:admin|_\w+)?(?:@\w+)?(?:\s|$)/.test(text)) return true;
    return Boolean(this.shop.session(user))&&!/^\/(?!cancel\b)/.test(text);
  }
  accept(update){
    insist(Number.isSafeInteger(update.update_id)&&update.update_id>=0,'UPDATE_ID_REQUIRED');
    if(!this.accepts(update)) return false;
    const id=String(update.update_id);
    this.shop.s.run('INSERT OR IGNORE INTO inbox VALUES(?,?,?,0,?)',id,this.shop.v.seal(JSON.stringify(update),`inbox:${id}`),'pending',this.shop.now());
    return true;
  }
  async processOne(){
    const {s,v}=this.shop;
    const row=s.get("SELECT * FROM inbox WHERE state='pending' AND attempts<5 ORDER BY rowid LIMIT 1");if(!row) return false;
    s.run("UPDATE inbox SET state='processing',attempts=attempts+1,updated=? WHERE id=?",this.shop.now(),row.id);
    const update=JSON.parse(v.open(row.box,`inbox:${row.id}`));
    try{
      await this.apply(update);
      s.run("UPDATE inbox SET state='done',updated=? WHERE id=?",this.shop.now(),row.id);
    }catch(error){
      const code=error instanceof ShopError?error.code:'ACTION_FAILED';
      this.shop.audit('telegram','action_error',row.id,{code});
      const chat=update.message?.chat.id||update.callback_query?.message.chat.id;
      this.shop.notify(`inbox-error:${row.id}`,chat,`⚠️ العملية لم تكتمل: ${code}. استخدم /shopadmin للإدارة أو /cancel للرجوع.`);
      // Business validation errors are terminal. Unexpected failures are retried from durable inbox.
      s.run('UPDATE inbox SET state=?,updated=? WHERE id=?',error instanceof ShopError?'done':row.attempts>=4?'failed':'pending',this.shop.now(),row.id);
    }
    return true;
  }
  async apply(update){
    const shop=this.shop;const callback=update.callback_query;
    const m=update.message||callback.message;const actor=String((update.message?.from||callback.from).id);
    const chat=String(m.chat.id);insist(/^\d{1,20}$/.test(actor)&&chat===actor,'PRIVATE_CHAT_REQUIRED',403);
    let serial=0;const say=(text,markup=keyboard)=>shop.notify(`tg:${update.update_id}:${serial++}`,chat,text,markup);
    const text=String(m.text||'').trim();const cmd=text.split(/\s+/)[0].split('@')[0];
    if(callback){
      const action=String(callback.data).slice(5);
      if(action.startsWith('confirm:')){
        const id=action.slice(8);const order=shop.confirmPlayer(id,actor);
        if(order.state==='awaiting_wallet'){
          shop.session(actor,{step:'wallet',order:id});
          say(`💰 السعر: ${funds(order.price)} جنيه\n💳 الدفع: فودافون كاش\nابعت رقم المحفظة اللي هتحوّل منها (11 رقم).\n${order.mode==='simulation'?'🧪 محاكاة فقط — ممنوع تحويل فلوس.':''}`);
        }
        return;
      }
      if(action.startsWith('cancel:')){shop.cancel(action.slice(7),actor);shop.session(actor,null);say('تم إلغاء الطلب غير المدفوع.');return;}
      shop.admin(actor);
      if(action==='stock'){say(`📦 60 UC (${shop.mode()})\n${JSON.stringify(shop.stockCounts())}`,panel);return;}
      if(action==='import'){shop.session(actor,{step:'import'});say(`➕ ابعت الأكواد كسطور أو ارفع TXT/CSV بحد أقصى 256KB.\nCSV: code,cost_egp\nالوضع: ${shop.mode()}. ${shop.mode()==='simulation'?'أكواد SIM- فقط.':''}`,panel);return;}
      if(['price','threshold'].includes(action)){shop.session(actor,{step:action});say(action==='price'?'ابعت سعر 60 UC بالجنيه، مثال 50.00':'ابعت حد تنبيه المخزون كعدد صحيح.',panel);return;}
      if(action==='sales'){const enabled=!shop.s.setting('enabled');shop.configure(actor,{enabled});say(enabled?'✅ البيع مفتوح.':'⏸ البيع متوقف مؤقتًا.',panel);return;}
      if(action==='mode_sim'||action==='mode_live'){shop.configure(actor,{mode:action==='mode_sim'?'simulation':'live'});say(`الوضع: ${shop.mode()}. التفعيل الحقيقي التلقائي غير متصل؛ الطلبات الحقيقية للمراجعة اليدوية فقط.`,panel);return;}
      if(action==='report'){say(`📊 المبالغ بالجنيه (ربح إجمالي قبل الرسوم):\n${shop.report(actor).map(r=>`${r.mode}: ${r.completed} طلب، مبيعات ${funds(r.revenue)}، تكلفة ${funds(r.cost)}، ربح ${funds(r.gross_profit)}`).join('\n')}`,panel);return;}
      if(action==='alerts'){say(shop.s.all("SELECT action,entity,detail FROM audit WHERE action IN ('action_error','fulfillment_result','simulation_reconciled') ORDER BY id DESC LIMIT 10").map(r=>`${r.entity}: ${r.detail}`).join('\n')||'لا توجد أخطاء مسجلة.',panel);return;}
      if(action==='orders'||action==='completed'){
        const rows=shop.s.all(`SELECT id,state,price,mode FROM orders WHERE ${action==='completed'?"state='completed'":"state!='completed' AND state!='cancelled'"} ORDER BY created DESC LIMIT 15`);
        for(const o of rows){
          const b=o.mode==='simulation'&&['awaiting_payment','payment_review'].includes(o.state)?buttons([[['🧪 محاكاة دفع صحيح',`simulate:${o.id}`]]]):panel;
          say(`${o.id}\n${o.state} | ${o.mode} | ${funds(o.price)} جنيه`,b);
        }
        if(!rows.length) say('لا يوجد طلبات.',panel);return;
      }
      if(action.startsWith('simulate:')){
        const id=action.slice(9);const o=shop.order(id,actor);insist(o.mode==='simulation','SIMULATION_ONLY');
        const raw=shop.s.get('SELECT sender_box FROM orders WHERE id=?',id);
        const sender=shop.v.open(raw.sender_box,`order:${id}`);
        shop.confirmPayment(actor,id,{reference:`SIM-${id}`,amount:o.price,sender,source:'simulation'});
        say('🧪 تم إثبات دفع افتراضي وإضافة الطلب لطابور التنفيذ.',panel);return;
      }
      throw new ShopError('UNKNOWN_ACTION');
    }
    if(cmd==='/start'){shop.session(actor,null);say(`أهلًا بيك في MOBA SHOP.\nالوضع: ${shop.mode()}. ${shop.mode()==='simulation'?'🧪 لا تحول فلوس حقيقية.':''}`);return;}
    if(cmd==='/cancel'){
      const session=shop.session(actor);
      if(session?.order) shop.cancel(session.order,actor);
      shop.session(actor,null);say('تم الرجوع للقائمة. الطلب المدفوع لا يُلغى تلقائيًا.');return;
    }
    if(cmd==='/shopadmin'){shop.admin(actor);shop.session(actor,null);say(`🛠 إدارة الشحن | ${shop.mode()}\nالبيع: ${shop.s.setting('enabled')?'مفتوح':'متوقف'}\nسعر 60 UC: ${funds(shop.s.setting('price'))} جنيه\nلتأكيد تحويل حقيقي بعد مراجعة كشف مستقل: /shop_verify ORDER REF AMOUNT PHONE\nإعادة محاولة طلب مدفوع بلا مخزون: /shop_requeue ORDER`,panel);return;}
    if(cmd==='/shop_requeue'){shop.admin(actor);shop.requeueOutOfStock(actor,text.split(/\s+/)[1]);say('تمت مراجعة توفر المخزون للطلب.',panel);return;}
    if(cmd==='/shop_verify'){
      shop.admin(actor);const [,id,reference,amount,sender]=text.split(/\s+/);
      shop.confirmPayment(actor,id,{reference,amount:money(amount),sender,source:'manual_verified_statement'});
      say('تم تسجيل تحقق المسؤول من كشف مستقل. التفعيل الحقيقي يظل مراجعة يدوية.',panel);return;
    }
    if(text===BUY_BUTTON||cmd==='/shop'){
      insist(shop.s.setting('enabled'),'SALES_PAUSED',409);
      shop.session(actor,{step:'player'});say('🎮 شحن 60 UC\nابعت PUBG ID. هنفحص الاسم قبل تأكيد الطلب.');return;
    }
    const session=shop.session(actor);insist(session,'SESSION_EXPIRED',409);
    if(session.step==='player'){
      const player=await this.lookup(text);
      const o=shop.createOrder({buyer:actor,chat,playerId:player.id,nickname:player.nickname,idempotencyKey:String(update.update_id)});
      shop.session(actor,{step:'confirmation',order:o.id});
      say(`🎮 PUBG Mobile — 60 UC\n👤 اللاعب: ${o.nickname}\n🆔 ${o.player_id}\n💰 ${funds(o.price)} جنيه\n🧾 ${o.id}\nهل ده اللاعب الصحيح؟`,buttons([[['✅ تأكيد',`confirm:${o.id}`],['❌ إلغاء',`cancel:${o.id}`]]]));return;
    }
    if(session.step==='wallet'){
      const o=shop.setSender(session.order,actor,text);shop.session(actor,null);
      say(o.mode==='simulation'?`🧪 طلب اختبار ${o.id}\nالمبلغ الافتراضي ${funds(o.price)} جنيه. لا تحول فلوس. انتظر محاكاة تأكيد الدفع من الإدارة.`:
        `🧾 ${o.id}\nحوّل ${funds(o.price)} جنيه لمحفظة Vodafone Cash: ${shop.receiverWallet}\nالطلب ينتظر تأكيد موثوق. SMS وحدها لا تؤكد الدفع.`);
      shop.notifyAdmins(`new:${o.id}`,`📥 طلب 60 UC جديد: ${o.id} | ${o.mode} | ${funds(o.price)} جنيه. راجعه من /shopadmin.`);return;
    }
    shop.admin(actor);
    if(session.step==='price'){shop.configure(actor,{price:money(text)});shop.session(actor,null);say('تم تغيير سعر البيع. الطلبات السابقة تحتفظ بسعرها.',panel);return;}
    if(session.step==='threshold'){insist(/^\d{1,5}$/.test(text),'INVALID_THRESHOLD');shop.configure(actor,{low_stock:Number(text)});shop.session(actor,null);say('تم تحديث حد التنبيه.',panel);return;}
    if(session.step==='import'){
      let contents=text;let name='codes.txt';
      if(m.document){
        insist(m.document.file_size<=256*1024&&/\.(txt|csv)$/i.test(m.document.file_name||''),'INVALID_IMPORT_FILE');
        insist(this.downloadFile,'FILE_DOWNLOAD_UNAVAILABLE',503);
        contents=await this.downloadFile(m.document.file_id);name=m.document.file_name;
      }
      const result=shop.importCodes(actor,parseStockFile(contents,name));
      shop.session(actor,null);say(`✅ أضيف ${result.added}، مكرر ${result.duplicates}. الأكواد محفوظة مشفرة.`,panel);return;
    }
    say('استخدم زر تأكيد اللاعب أو /cancel للرجوع.');
  }
}
