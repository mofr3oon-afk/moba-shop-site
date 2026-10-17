import { Store } from './store.js';
import { Shop } from './engine.js';
import { Vault } from './security.js';
import { randomBytes } from 'node:crypto';

// Entirely offline: generated fake codes, fake wallets and fake payment references.
const store=new Store(':memory:');
const shop=new Shop({store,vault:new Vault({keys:{v1:randomBytes(32).toString('base64')},fingerprintKey:randomBytes(32).toString('hex')}),adminIds:['111']});
shop.configure('111',{enabled:true,price:5000});
shop.importCodes('111',Array.from({length:5},(_,i)=>({code:`SIM-DEMO-${i}`,cost:4000})));
const purchases=[];
for(let i=0;i<5;i++){
  const buyer=String(100+i);const order=shop.createOrder({buyer,chat:buyer,playerId:'5285527481',nickname:'SIMULATED PLAYER'});
  shop.confirmPlayer(order.id,buyer);shop.setSender(order.id,buyer,'01000000001');
  shop.confirmPayment('111',order.id,{reference:`SIM-PAYMENT-${i}`,amount:5000,sender:'01000000001',source:'simulation'});
  const result=await shop.fulfillOne();purchases.push({order:order.id,state:result.state,receipt:result.receipt});
}
console.log(JSON.stringify({mode:'simulation',realMoneyUsed:false,realCodesUsed:false,purchases,report:shop.report('111')},null,2));store.close();
