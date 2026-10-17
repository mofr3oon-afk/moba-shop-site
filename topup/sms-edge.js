// Run this transformation ON THE PHONE, before signing or forwarding anything.
// Never send the raw SMS text to the service. Only one tested receipt template is accepted.
export function receiptFieldsOnDevice({sender,text,eventId,occurredAt,recipient}){
  if(sender!=='VF-CASH'||typeof text!=='string'||/OTP|PIN|password|رمز|كود|سري|سرى|verification/i.test(text)) return null;
  const normalized=text.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660));
  const amount=normalized.match(/(?:تم استلام|تم استقبال) مبلغ\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:جنيه|جنية)/);
  const phone=normalized.match(/من (?:رقم|محفظة)\s*(01[0-9]{9})/);
  const reference=normalized.match(/(?:رقم العملية|الرقم المرجعي)\s*[:：]?\s*([A-Za-z0-9-]{4,80})/);
  if(!amount||!phone) return null;
  const [whole,fraction='']=amount[1].split('.');
  return {event_id:eventId,observed_sender:'VF-CASH',recipient,
    sender_phone:phone[1],amount_minor:Number(whole)*100+Number(fraction.padEnd(2,'0')),
    currency:'EGP',occurred_at:occurredAt,reference:reference?.[1]||null};
}
