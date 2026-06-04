import adminHealthHandler from '../lib/handlers/admin-health.js';

export default async function handler(req,res){
  return adminHealthHandler(req,res);
}
