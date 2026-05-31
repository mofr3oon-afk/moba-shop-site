import { json } from '../lib/_utils.js';
import { clearSessionCookie, logAdminEvent } from '../lib/admin-auth.js';
export default async function handler(req,res){
  clearSessionCookie(res);
  await logAdminEvent('logout',req).catch(()=>null);
  return json(res,200,{ok:true});
}
