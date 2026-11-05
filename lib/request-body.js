export function readRawBody(req,maxBytes=4*1024*1024){
  return new Promise((resolve,reject)=>{
    let size=0;const chunks=[];
    const tooLarge=()=>{const e=new Error('حجم الطلب كبير. قلل حجم الصورة.');e.statusCode=413;return e;};
    if(Number(req.headers['content-length']||0)>maxBytes){req.resume?.();reject(tooLarge());return;}
    req.on('data',chunk=>{
      chunk=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
      size+=chunk.length;
      if(size>maxBytes){chunks.length=0;reject(tooLarge());return;}
      chunks.push(chunk);
    });
    req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject);
  });
}
export async function readJsonBody(req,maxBytes=64*1024){
  const raw=await readRawBody(req,maxBytes);
  try{return JSON.parse(raw.toString('utf8')||'{}');}
  catch{const e=new Error('بيانات الطلب غير صالحة');e.statusCode=400;throw e;}
}
export function validateImageBytes(file){
  const b=file?.buffer;
  if(b?.length>3*1024*1024){const e=new Error('الحد الأقصى للصورة 3MB');e.statusCode=413;throw e;}
  const type=String(file?.contentType||'').replace('image/jpg','image/jpeg').toLowerCase();
  const png=b?.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg=b?.length>=4&&b[0]===255&&b[1]===216&&b[2]===255;
  const webp=b?.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
  if(!((type==='image/png'&&png)||(type==='image/jpeg'&&jpg)||(type==='image/webp'&&webp))){
    const e=new Error('محتوى الملف لا يطابق صورة JPG أو PNG أو WEBP.');e.statusCode=400;throw e;
  }
}

export async function parseForm(buffer,contentType){
  let form;try{form=await new Request('http://localhost/',{method:'POST',headers:{'content-type':contentType||''},body:buffer}).formData();}
  catch{const e=new Error('بيانات النموذج غير صالحة');e.statusCode=400;throw e;}
  const fields=Object.create(null),files=Object.create(null);let count=0;
  for(const [key,value] of form){
    if(Object.hasOwn(fields,key)||Object.hasOwn(files,key)||['__proto__','constructor','prototype'].includes(key)){
      const e=new Error('حقول النموذج مكررة أو غير صالحة');e.statusCode=400;throw e;
    }
    if(typeof value==='string')fields[key]=value;
    else if(value.size){count++;files[key]={filename:value.name,contentType:value.type,buffer:Buffer.from(await value.arrayBuffer())};}
  }
  if(count>1){const e=new Error('ارفع صورة واحدة فقط');e.statusCode=400;throw e;}
  return {fields,files};
}
