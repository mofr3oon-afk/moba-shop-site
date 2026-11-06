// Local QA only. Fake database, fake bot and fake receipts; all outbound fetches intercepted.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
Object.assign(process.env,{SUPABASE_URL:'https://preview.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake',BOT_TOKEN:'fake',ORDER_GROUP_ID:'111',ADMIN_IDS:'111',ADMIN_PANEL_SECRET:'preview-password',ADMIN_SESSION_SECRET:'preview-session',ORDER_ACCESS_SECRET:'preview-orders',ADMIN_LOGIN_OTP:'false',ORDER_RECEIPTS_BUCKET:'preview'});
const root=path.resolve(import.meta.dirname,'..');
const settings=new Map([
  ['dynamic_sections',JSON.stringify([{key:'qr',title:'PUBG QR — معاينة تجريبية',game:'pubg',status:'available'}])],
  ['dynamic_products',JSON.stringify([{id:'qa-qr',game:'pubg',section:'qr',cat:'qr',name:'باقة QR تجريبية — غير معروضة للبيع',price:120,checkoutMethod:'manual',status:'available',cost:90}])],
  ['support_phone','201061707294'],['brand_settings','{}'],
  ['payment_settings',JSON.stringify({instapay:{enabled:false,status:'disabled',user:'demo-only',name:'اختبار فقط'},wallet:{enabled:true,status:'available',phone:'01000000000',name:'محفظة تجريبية — لا تحول أموالًا',message:'بيانات وهمية للمعاينة فقط'}})]
]);
let orders=[];
const receipts=new Map();
globalThis.fetch=async(input,opts={})=>{
  const url=new URL(input),method=opts.method||'GET';
  const body=typeof opts.body==='string'?JSON.parse(opts.body):null;
  const reply=data=>new Response(JSON.stringify(data),{status:200});
  if(url.hostname==='api.telegram.org')return reply({ok:true,result:{message_id:1,photo:[{file_id:'preview'}]}});
  if(url.hostname==='gopay.co.id'){
    const id=body?.data?.userId;
    if(id==='00000')return new Response(JSON.stringify({message:'Invalid user account'}),{status:404});
    if(id==='99999')return new Response('{}',{status:503});
    if(id==='11111')await new Promise(resolve=>setTimeout(resolve,1200));
    return reply({message:'Success',data:{username:id==='22222'?'لاعب المعاينة الثاني':'MO FR3OON — معاينة فقط'}});
  }
  if(url.hostname!=='preview.invalid')throw new Error('Preview blocks external requests');
  if(url.pathname.includes('/storage/')){
    if(url.pathname.includes('/bucket/'))return reply({public:false});
    if(method==='POST'){receipts.set(url.pathname,opts.body);return reply({ok:true});}
    return new Response(receipts.get(url.pathname)||Buffer.alloc(0),{headers:{'content-type':'image/png'}});
  }
  if(url.pathname.endsWith('/settings')){
    const filter=url.searchParams.get('key');const key=filter?.startsWith('eq.')?filter.slice(3):null;
    if(method==='POST'){
      const rows=Array.isArray(body)?body:[body];
      if(rows.some(r=>settings.has(r.key))&&!String(opts.headers?.Prefer).includes('merge-duplicates'))return new Response('duplicate 23505',{status:409});
      for(const r of rows)settings.set(r.key,r.value);return reply(rows);
    }
    if(method==='PATCH'){
      const expected=url.searchParams.get('value')?.slice(3);
      if(expected!==undefined&&settings.get(key)!==expected)return reply([]);
      settings.set(key,body.value);return reply([body]);
    }
    let rows=[...settings].map(([key,value])=>({key,value}));
    if(key)rows=rows.filter(r=>r.key===key);
    else if(filter?.startsWith('in.')){const names=filter.slice(4,-1).split(',');rows=rows.filter(r=>names.includes(r.key));}
    return reply(rows);
  }
  if(url.pathname.endsWith('/orders')){
    const id=url.searchParams.get('id')?.slice(3);
    if(method==='POST'){
      if(orders.some(o=>o.id===body.id))return new Response('duplicate 23505',{status:409});
      const row={...body,created_at:new Date().toISOString()};orders.push(row);return reply([row]);
    }
    let rows=orders.filter(o=>!id||o.id===id);
    const phone=url.searchParams.get('phone');if(phone)rows=rows.filter(o=>o.phone===phone.slice(3));
    const status=url.searchParams.get('status');if(status?.startsWith('eq.'))rows=rows.filter(o=>o.status===status.slice(3));
    if(status?.startsWith('in.'))rows=rows.filter(o=>status.slice(4,-1).split(',').includes(o.status));
    if(method==='PATCH'){for(const row of rows)Object.assign(row,body);return reply(rows);}
    if(method==='DELETE')throw new Error('Deleting data is disabled in preview');
    return reply(rows.slice(Number(url.searchParams.get('offset')||0),Number(url.searchParams.get('limit')||1000)));
  }
  if(url.pathname.endsWith('/reviews'))return reply([]);
  throw new Error('Unsupported preview endpoint');
};
const names=['admin-login','admin-orders','order','manual-order','public','settings','health'];
const handlers=Object.fromEntries(await Promise.all(names.map(async name=>[name,(await import(`../api/${name}.js`)).default])));
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1:4318');req.query=Object.fromEntries(url.searchParams);
    for(const [key,value] of Object.entries(config.routes[0].headers))res.setHeader(key,value);
    res.setHeader('Cache-Control','no-store');
    res.status=n=>{res.statusCode=n;return res;};res.json=data=>res.end(JSON.stringify(data));
    if(url.pathname.startsWith('/api/')){
      if(url.pathname==='/api/settings'&&req.method==='POST'){
        const {readJsonBody}=await import('../lib/request-body.js');req.body=await readJsonBody(req);
      }
      const handler=handlers[url.pathname.slice(5)];if(!handler){res.statusCode=404;return res.end('{}');}
      return await handler(req,res);
    }
    const requested=url.pathname==='/admin'?'admin.html':url.pathname.replace(/^\//,'');
    let file=path.resolve(root,requested||'index.html');
    if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.statusCode=403;return res.end();}
    if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');
    if(!/\.(html|js|css|png|webp|jpg|svg|ico|webmanifest)$/.test(file)){res.statusCode=404;return res.end();}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  }catch(e){res.statusCode=500;res.end(JSON.stringify({ok:false,error:e.message}));}
}).listen(4318,'127.0.0.1',()=>console.log('Isolated QA preview: http://127.0.0.1:4318 — fake password: preview-password'));
