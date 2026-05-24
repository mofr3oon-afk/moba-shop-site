
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(res,status,obj){res.status(status).json(obj);}
async function supa(path,opts={}){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
    ...opts,
    headers:{
      apikey:SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'return=representation',
      ...(opts.headers||{})
    }
  });
  const text = await r.text();
  let data; try{data=text?JSON.parse(text):null;}catch{data=text;}
  if(!r.ok) throw new Error(typeof data==='string'?data:JSON.stringify(data));
  return data;
}
export default async function handler(req,res){
  try{
    if(req.method !== 'GET') return json(res,405,{ok:false,error:'Method not allowed'});
    const rows = await supa('settings?select=key,value');
    const settings = {};
    for(const r of rows || []){
      let v = r.value;
      if(v === 'true') v = true;
      if(v === 'false') v = false;
      settings[r.key] = v;
    }
    return json(res,200,{ok:true,settings});
  }catch(e){
    return json(res,500,{ok:false,error:String(e.message||e)});
  }
}
