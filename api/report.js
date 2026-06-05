import dailyReportHandler from '../lib/handlers/daily-report.js';
import { json } from '../lib/_utils.js';

export default async function handler(req,res){
  const action = String(req.query?.action || 'daily').trim();
  if(action === 'daily' || action === 'report') return dailyReportHandler(req,res);
  return json(res,404,{ok:false,error:'Unknown report action'});
}
