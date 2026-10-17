import { createHash } from 'node:crypto';

export class SimulationRedeemer {
  async redeem({code,idempotencyKey,outcome='success'}){
    if(!code.startsWith('SIM-')) return {state:'unknown',verified:false};
    if(outcome==='timeout') throw new Error('SIMULATED_TIMEOUT');
    if(outcome==='unknown') return {state:'unknown',verified:false};
    if(outcome==='failure') return {state:'failed',verified:true,consumed:false,reason:'SIMULATED_REJECTION'};
    return {state:'success',verified:true,consumed:true,
      receipt:`SIM-${createHash('sha256').update(idempotencyKey).digest('hex').slice(0,24)}`};
  }
}
// Deliberately no credentials, cookies, browser automation, or unofficial endpoints.
// Replace only after a permitted vendor integration and sandbox have been verified.
export class ManualReviewRedeemer {
  async redeem(){return {state:'manual_review',verified:false,reason:'APPROVED_VENDOR_INTEGRATION_REQUIRED'};}
}
