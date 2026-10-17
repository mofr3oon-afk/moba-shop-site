import crypto from 'node:crypto';
import { insist, phone, ShopError } from './security.js';
import { SimulationRedeemer, ManualReviewRedeemer } from './redeemer.js';

const uuid=()=>crypto.randomUUID();
const product='pubg-60';
export class Shop {
  constructor({store,vault,adminIds,now=Date.now,simulationRedeemer=new SimulationRedeemer(),allowManualPayment=false,allowRealStock=false,receiverWallet=null}){
    insist(adminIds?.length&&adminIds.every(x=>/^\d+$/.test(String(x))),'ADMIN_IDS_REQUIRED');
    this.s=store;this.v=vault;this.adminIds=adminIds.map(String);this.now=now;
    this.simulationRedeemer=simulationRedeemer;this.liveRedeemer=new ManualReviewRedeemer();
    this.allowManualPayment=allowManualPayment;this.allowRealStock=allowRealStock;
    this.receiverWallet=receiverWallet?phone(receiverWallet):null;
    if(!this.s.get('SELECT key FROM settings WHERE key=?','mode')){
      this.s.tx(()=>{this.s.set('mode','simulation');this.s.set('enabled',false);this.s.set('price',5000);this.s.set('price_confirmed',false);this.s.set('cost',4000);this.s.set('low_stock',5);});
    }
  }
  admin(actor){insist(this.adminIds.includes(String(actor)),'ADMIN_ONLY',403);}
  mode(){return this.s.setting('mode');}
  audit(actor,action,entity,detail={}){
    // Call sites supply only safe metadata, never codes, SMS bodies or credentials.
    this.s.run('INSERT INTO audit(at,actor,action,entity,detail) VALUES(?,?,?,?,?)',this.now(),String(actor),action,entity,JSON.stringify(detail));
  }
  configure(actor,values){
    this.admin(actor);
    const allowed=new Set(['enabled','price','cost','low_stock','mode']);
    for(const [key,value] of Object.entries(values)){
      insist(allowed.has(key),'INVALID_SETTING');
      if(key==='mode') insist(['simulation','live'].includes(value),'INVALID_MODE');
      else if(key==='enabled') insist(typeof value==='boolean','INVALID_SETTING');
      else insist(Number.isSafeInteger(value)&&value>=0&&value<=100000000&&(key!=='price'||value>0),'INVALID_SETTING');
    }
    // Live payment intake requires explicit deployment configuration; fulfillment stays manual.
    if(values.mode==='live') insist(this.allowManualPayment&&this.receiverWallet&&(values.price>0||this.s.setting('price_confirmed',false)),'LIVE_MODE_NOT_APPROVED',409);
    this.s.tx(()=>{for(const [key,value] of Object.entries(values)) this.s.set(key,value);if(values.price) this.s.set('price_confirmed',true);this.audit(actor,'settings','shop',values);});
  }
  notify(key,chat,text,reply_markup){
    this.s.run('INSERT OR IGNORE INTO outbox VALUES(?,?,?,?,?,0)',key,String(chat),JSON.stringify({chat_id:String(chat),text,...(reply_markup?{reply_markup}:{})}),'pending',this.now());
  }
  notifyAdmins(key,text){for(const id of this.adminIds) this.notify(`${key}:${id}`,id,text);}
  stockCounts(mode=this.mode()){
    return Object.fromEntries(this.s.all('SELECT state,count(*) AS n FROM stock WHERE mode=? AND product=? GROUP BY state',mode,product).map(r=>[r.state,r.n]));
  }
  lowStock(){
    const mode=this.mode();const n=this.stockCounts(mode).available||0;
    if(n<=this.s.setting('low_stock',5)) this.notifyAdmins(`stock:${mode}:${Math.floor(this.now()/60000)}:${n}`,`⚠️ مخزون 60 UC (${mode}): ${n} كود متاح.`);
  }
  importCodes(actor,rows,{mode=this.mode()}={}){
    this.admin(actor);insist(['simulation','live'].includes(mode),'INVALID_MODE');
    insist(mode==='simulation'||this.allowRealStock,'REAL_STOCK_IMPORT_DISABLED',409);
    insist(Array.isArray(rows)&&rows.length>0&&rows.length<=10000,'INVALID_IMPORT');
    const prepared=rows.map(row=>{
      const code=String(row.code||'').trim();
      insist(/^[A-Za-z0-9_-]{4,200}$/.test(code),'INVALID_CODE_FORMAT');
      insist(mode!=='simulation'||code.startsWith('SIM-'),'SIMULATION_CODES_ONLY');
      insist(mode!=='live'||!code.startsWith('SIM-'),'LIVE_CODE_REQUIRED');
      insist(mode!=='live'||row.cost!==undefined,'REAL_COST_REQUIRED');
      const cost=row.cost??this.s.setting('cost');insist(Number.isSafeInteger(cost)&&cost>=0,'INVALID_COST');
      const fingerprint=this.v.hash(code.toUpperCase());
      return {id:uuid(),fingerprint,cost,box:this.v.seal(code,`stock:${mode}:${product}:${fingerprint}`)};
    });
    return this.s.tx(()=>{
      let added=0;
      for(const c of prepared) added+=Number(this.s.run('INSERT OR IGNORE INTO stock VALUES(?,?,?,?,?,?,?,NULL,NULL)',c.id,mode,product,c.fingerprint,c.box,c.cost,'available').changes);
      this.audit(actor,'stock_import',product,{mode,added,duplicates:rows.length-added});
      this.lowStock();return {added,duplicates:rows.length-added};
    });
  }
  createOrder({buyer,chat,playerId,nickname,idempotencyKey}){
    insist(this.s.setting('enabled',false),'SALES_PAUSED',409);
    insist(/^\d{5,15}$/.test(playerId)&&typeof nickname==='string'&&nickname.trim().length>0&&nickname.length<=200,'INVALID_PLAYER');
    const id=`UC-${(idempotencyKey?this.v.hash(`order:${buyer}:${idempotencyKey}`).slice(0,16):crypto.randomBytes(8).toString('hex')).toUpperCase()}`;
    const existing=this.s.get('SELECT id,player_id FROM orders WHERE id=?',id);
    if(existing){insist(existing.player_id===playerId,'IDEMPOTENCY_CONFLICT',409);return this.order(id,buyer);}
    const mode=this.mode();const price=this.s.setting('price');
    insist(mode!=='live'||(this.allowManualPayment&&this.receiverWallet&&this.s.setting('price_confirmed',false)),'LIVE_MODE_NOT_APPROVED',409);
    insist(Number.isSafeInteger(price)&&price>0,'PRICE_NOT_SET',409);
    const recent=this.s.get('SELECT count(*) AS n FROM orders WHERE buyer=? AND created>?',String(buyer),this.now()-3600000).n;
    insist(recent<20,'ORDER_RATE_LIMIT',429);
    this.s.run('INSERT INTO orders(id,buyer,chat,mode,product,player_id,nickname,price,state,created,expires) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      id,String(buyer),String(chat),mode,product,playerId,nickname,price,'player_confirmation',this.now(),this.now()+30*60000);
    return this.order(id,buyer);
  }
  order(id,actor){
    const row=this.s.get('SELECT * FROM orders WHERE id=?',id);insist(row,'ORDER_NOT_FOUND',404);
    insist(row.buyer===String(actor)||this.adminIds.includes(String(actor)),'ORDER_FORBIDDEN',403);
    // No encrypted codes or sender phone boxes can escape through a response.
    const {sender_box,sender_hash,...safe}=row;return safe;
  }
  confirmPlayer(id,buyer){
    return this.s.tx(()=>{
      const o=this.order(id,buyer);insist(o.buyer===String(buyer),'ORDER_FORBIDDEN',403);
      if(['awaiting_wallet','awaiting_payment'].includes(o.state)) return o;
      insist(o.state==='player_confirmation'&&o.expires>this.now(),'INVALID_ORDER_STATE',409);
      this.s.run('UPDATE orders SET state=? WHERE id=?','awaiting_wallet',id);return this.order(id,buyer);
    });
  }
  setSender(id,buyer,value){
    const sender=phone(value);
    return this.s.tx(()=>{
      const o=this.order(id,buyer);insist(o.buyer===String(buyer),'ORDER_FORBIDDEN',403);
      if(o.state==='awaiting_payment'&&this.s.get('SELECT sender_hash FROM orders WHERE id=?',id).sender_hash===this.v.hash(sender)) return o;
      insist(o.state==='awaiting_wallet'&&o.expires>this.now(),'INVALID_ORDER_STATE',409);
      this.s.run('UPDATE orders SET sender_hash=?,sender_box=?,state=? WHERE id=?',this.v.hash(sender),this.v.seal(sender,`order:${id}`),'awaiting_payment',id);
      this.audit(buyer,'order_waiting_payment',id,{mode:o.mode,price:o.price});return this.order(id,buyer);
    });
  }
  cancel(id,buyer){
    return this.s.tx(()=>{
      const o=this.order(id,buyer);insist(o.buyer===String(buyer),'ORDER_FORBIDDEN',403);
      insist(['player_confirmation','awaiting_wallet','awaiting_payment'].includes(o.state),'CANNOT_CANCEL_PAID_ORDER',409);
      this.s.run('UPDATE orders SET state=? WHERE id=?','cancelled',id);
    });
  }
  acceptNonce(namespace,nonce,expires){
    this.s.tx(()=>{
      this.s.run('DELETE FROM nonces WHERE expires<?',this.now());
      insist(!this.s.get('SELECT nonce FROM nonces WHERE namespace=? AND nonce=?',namespace,nonce),'REPLAY_DETECTED',409);
      this.s.run('INSERT INTO nonces VALUES(?,?,?)',namespace,nonce,expires);
    });
  }
  ingestSms(event){
    const allowed=['event_id','observed_sender','recipient','sender_phone','amount_minor','currency','occurred_at','reference'];
    insist(event&&Object.keys(event).every(k=>allowed.includes(k)),'SMS_FIELDS_NOT_ALLOWED');
    insist(event.observed_sender==='VF-CASH'&&event.currency==='EGP','INVALID_SMS_RECEIPT');
    insist(/^[A-Za-z0-9_-]{8,100}$/.test(event.event_id),'INVALID_EVENT_ID');
    const sender=phone(event.sender_phone);const recipient=phone(event.recipient);
    insist(this.receiverWallet&&recipient===this.receiverWallet,'WRONG_RECIPIENT',409);
    insist(Number.isSafeInteger(event.amount_minor)&&event.amount_minor>0,'INVALID_AMOUNT');
    const occurred=Date.parse(event.occurred_at);insist(Number.isFinite(occurred)&&occurred<=this.now()+60000&&occurred>=this.now()-86400000,'INVALID_SMS_TIME');
    insist(event.reference===null||/^[A-Za-z0-9_-]{4,100}$/.test(event.reference),'INVALID_REFERENCE');
    const ref=event.reference?`sms:${recipient}:${event.reference}`:`unreferenced:${this.v.hash(JSON.stringify([recipient,sender,event.amount_minor,occurred]))}`;
    return this.s.tx(()=>{
      if(this.s.get('SELECT id FROM sms_events WHERE id=? OR reference=?',event.event_id,ref)) return {status:'duplicate',trusted:false};
      // SMS is evidence only, regardless of signature, sender label or uniqueness.
      const candidates=this.s.all(`SELECT id FROM orders WHERE mode='live' AND state IN ('awaiting_payment','payment_review') AND sender_hash=? AND price=? AND created<=? AND expires>=?`,
        this.v.hash(sender),event.amount_minor,occurred+120000,occurred);
      const id=candidates.length===1?candidates[0].id:null;
      if(id) this.s.run('UPDATE orders SET state=? WHERE id=?','payment_review',id);
      this.s.run('INSERT INTO sms_events VALUES(?,?,?,?)',event.event_id,ref,this.now(),candidates.length===1?'review':candidates.length>1?'ambiguous':'unmatched');
      this.audit('sms','payment_evidence',id||event.event_id,{candidateCount:candidates.length,amount:event.amount_minor,hasReference:Boolean(event.reference)});
      this.notifyAdmins(`sms:${event.event_id}`,`💳 إشعار SMS للمراجعة فقط. ${id||'لا توجد مطابقة وحيدة'}. لا يُعد إثبات دفع موثوقًا.`);
      return {status:id?'review':candidates.length>1?'ambiguous':'unmatched',orderId:id,trusted:false};
    });
  }
  confirmPayment(actor,id,{reference,amount,sender,occurred=this.now(),source}){
    this.admin(actor);sender=phone(sender);
    insist(/^[A-Za-z0-9_-]{4,100}$/.test(reference),'REFERENCE_REQUIRED');
    insist(Number.isSafeInteger(amount)&&amount>0&&Number.isSafeInteger(occurred),'INVALID_AMOUNT');
    return this.s.tx(()=>{
      const o=this.order(id,actor);
      const trusted=o.mode==='simulation'?source==='simulation':source==='manual_verified_statement'&&this.allowManualPayment;
      insist(trusted,'TRUSTED_PAYMENT_REQUIRED',409);
      const existing=this.s.get('SELECT * FROM payments WHERE mode=? AND reference=?',o.mode,reference);
      if(existing){insist(existing.order_id===id&&existing.amount===amount&&existing.sender_hash===this.v.hash(sender),'TRANSFER_ALREADY_USED',409);return this.order(id,actor);}
      insist(['awaiting_payment','payment_review'].includes(o.state),'INVALID_ORDER_STATE',409);
      insist(o.price===amount,'PAYMENT_AMOUNT_MISMATCH',409);
      const raw=this.s.get('SELECT sender_hash FROM orders WHERE id=?',id);
      insist(raw.sender_hash===this.v.hash(sender),'PAYMENT_SENDER_MISMATCH',409);
      insist(occurred>=o.created-120000&&occurred<=o.expires&&occurred<=this.now()+60000&&this.now()<=o.expires,'PAYMENT_TIME_MISMATCH',409);
      this.s.run('INSERT INTO payments VALUES(?,?,?,?,?,?,?,?,?)',uuid(),o.mode,reference,amount,this.v.hash(sender),occurred,source,1,id);
      this.s.run('UPDATE orders SET state=?,payment_reference=? WHERE id=?','paid',reference,id);
      this.audit(actor,'trusted_payment',id,{source,amount});
      this.reserveInternal(id);return this.order(id,actor);
    });
  }
  reserveInternal(id){
    const o=this.s.get('SELECT * FROM orders WHERE id=?',id);
    if(this.s.get('SELECT id FROM jobs WHERE order_id=?',id)) return;
    const c=this.s.get('SELECT id FROM stock WHERE mode=? AND product=? AND state=? ORDER BY rowid LIMIT 1',o.mode,o.product,'available');
    if(!c){
      this.s.run('UPDATE orders SET state=? WHERE id=?','paid_out_of_stock',id);
      this.notifyAdmins(`out-stock:${id}`,`⚠️ طلب مدفوع بدون مخزون: ${id}. يحتاج متابعة أو رد المبلغ.`);return;
    }
    this.s.run('UPDATE stock SET state=?,reserved_order=?,reserved_until=? WHERE id=? AND state=?','reserved',id,this.now()+15*60000,c.id,'available');
    this.s.run('UPDATE orders SET state=?,code_id=? WHERE id=?','queued',c.id,id);
    this.s.run('INSERT INTO jobs VALUES(?,?,?,?,NULL,?)',uuid(),id,c.id,'queued',this.now());this.lowStock();
  }
  requeueOutOfStock(actor,id){
    this.admin(actor);this.s.tx(()=>{const o=this.order(id,actor);insist(o.state==='paid_out_of_stock','INVALID_ORDER_STATE',409);this.reserveInternal(id);});
  }
  setSimulationOutcome(actor,id,outcome){
    this.admin(actor);insist(this.order(id,actor).mode==='simulation'&&['success','failure','unknown','timeout'].includes(outcome),'SIMULATION_ONLY');
    this.s.set(`outcome:${id}`,outcome);
  }
  claimJob(){
    return this.s.tx(()=>{
      const j=this.s.get("SELECT * FROM jobs WHERE state='queued' ORDER BY rowid LIMIT 1");if(!j) return null;
      const stock=this.s.get('SELECT * FROM stock WHERE id=?',j.code_id);
      if(stock.reserved_until<this.now()){
        this.s.run('UPDATE jobs SET state=?,updated=? WHERE id=?','manual_review',this.now(),j.id);
        this.s.run('UPDATE orders SET state=?,error=? WHERE id=?','manual_review','RESERVATION_EXPIRED',j.order_id);return null;
      }
      // Persist BEFORE any provider request. A crash from now on is UNKNOWN, never auto-retry.
      this.s.run('UPDATE jobs SET state=?,started=?,updated=? WHERE id=?','running',this.now(),this.now(),j.id);
      this.s.run('UPDATE orders SET state=? WHERE id=?','fulfilling',j.order_id);
      return {...j,stock};
    });
  }
  async fulfillOne({afterClaim}={}){
    const job=this.claimJob();if(!job) return null;
    if(afterClaim) await afterClaim(job); // test-only crash boundary
    const o=this.s.get('SELECT * FROM orders WHERE id=?',job.order_id);
    let result;
    try{
      if(o.mode==='live') result=await this.liveRedeemer.redeem();
      else{
        const code=this.v.open(job.stock.box,`stock:${o.mode}:${o.product}:${job.stock.fingerprint}`);
        result=await this.simulationRedeemer.redeem({code,playerId:o.player_id,idempotencyKey:job.id,outcome:this.s.setting(`outcome:${o.id}`,'success')});
      }
    }catch{result={state:'unknown',verified:false};}
    this.s.tx(()=>{
      let state='unknown';
      if(result.state==='success'&&result.verified===true&&result.consumed===true&&typeof result.receipt==='string'&&result.receipt.startsWith('SIM-')&&o.mode==='simulation'){
        state='completed';this.s.run('UPDATE stock SET state=? WHERE id=?','used',job.code_id);
        this.s.run('UPDATE orders SET receipt=? WHERE id=?',result.receipt,o.id);
      }else if(result.state==='failed'&&result.verified===true&&result.consumed===false){
        state='fulfillment_failed';this.s.run('UPDATE stock SET state=?,reserved_order=NULL,reserved_until=NULL WHERE id=?','available',job.code_id);
      }else if(result.state==='manual_review') state='manual_review';
      else this.s.run('UPDATE stock SET state=? WHERE id=?','quarantined',job.code_id);
      this.s.run('UPDATE orders SET state=?,error=? WHERE id=?',state,state==='completed'?null:state.toUpperCase(),o.id);
      this.s.run('UPDATE jobs SET state=?,updated=? WHERE id=?',state,this.now(),job.id);
      this.audit('worker','fulfillment_result',o.id,{state,mode:o.mode});
      this.notify(`result:${job.id}`,o.chat,state==='completed'?`🧪 تم تنفيذ شحن 60 UC افتراضيًا للطلب ${o.id}. لم تُستهلك أموال أو أكواد حقيقية.`:`⚠️ الطلب ${o.id} قيد المراجعة. لم يتم تأكيد الشحن.`);
      if(state!=='completed') this.notifyAdmins(`review:${o.id}`,`⚠️ ${o.id}: ${state}. ممنوع تكرار التفعيل حتى التأكد من حالة الكود.`);
    });
    return this.order(o.id,this.adminIds[0]);
  }
  recover(){
    this.s.tx(()=>{
      for(const j of this.s.all("SELECT * FROM jobs WHERE state='running'")){
        this.s.run('UPDATE jobs SET state=?,updated=? WHERE id=?','unknown',this.now(),j.id);
        this.s.run('UPDATE orders SET state=?,error=? WHERE id=?','unknown','WORKER_INTERRUPTED',j.order_id);
        this.s.run('UPDATE stock SET state=? WHERE id=?','quarantined',j.code_id);
        this.notifyAdmins(`recovery:${j.id}`,`⚠️ تنفيذ غير محسوم بعد إعادة التشغيل: ${j.order_id}. الكود محجوز للمراجعة ولن يُعاد استخدامه.`);
      }
      this.s.run("UPDATE inbox SET state='pending' WHERE state='processing'");
      this.s.run("UPDATE outbox SET state='pending' WHERE state='sending'");
    });
  }
  resolveSimulation(actor,id,consumed){
    this.admin(actor);
    this.s.tx(()=>{
      const o=this.order(id,actor);insist(o.mode==='simulation'&&o.state==='unknown'&&typeof consumed==='boolean','SIMULATION_RECONCILIATION_ONLY',409);
      if(consumed){
        this.s.run('UPDATE stock SET state=? WHERE id=?','used',o.code_id);
        this.s.run('UPDATE orders SET state=?,receipt=?,error=NULL WHERE id=?','completed',`SIM-RECONCILED-${id}`,id);
      }else{
        this.s.run('UPDATE stock SET state=?,reserved_order=NULL,reserved_until=NULL WHERE id=?','available',o.code_id);
        this.s.run('UPDATE orders SET state=?,error=NULL WHERE id=?','fulfillment_failed',id);
      }
      this.s.run('UPDATE jobs SET state=?,updated=? WHERE order_id=?',consumed?'completed':'fulfillment_failed',this.now(),id);
      this.audit(actor,'simulation_reconciled',id,{consumed});
    });
  }
  report(actor){
    this.admin(actor);return ['simulation','live'].map(mode=>{
      const sums=this.s.get(`SELECT count(*) AS completed,coalesce(sum(o.price),0) AS revenue,coalesce(sum(s.cost),0) AS cost FROM orders o JOIN stock s ON s.id=o.code_id WHERE o.mode=? AND o.state='completed'`,mode);
      return {mode,...sums,gross_profit:sums.revenue-sums.cost,stock:this.stockCounts(mode)};
    });
  }
  session(user,value){
    if(value===undefined){const row=this.s.get('SELECT box FROM sessions WHERE user=?',String(user));return row?JSON.parse(this.v.open(row.box,`session:${user}`)):null;}
    if(value===null) return this.s.run('DELETE FROM sessions WHERE user=?',String(user));
    this.s.run('INSERT INTO sessions VALUES(?,?,?) ON CONFLICT(user) DO UPDATE SET box=excluded.box,updated=excluded.updated',String(user),this.v.seal(JSON.stringify(value),`session:${user}`),this.now());
  }
}
