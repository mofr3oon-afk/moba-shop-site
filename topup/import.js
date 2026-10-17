import { insist, money } from './security.js';

// Small RFC4180 reader: quoted cells, escaped quotes, CRLF and commas in cells.
export function parseStockFile(text,name='codes.txt'){
  insist(typeof text==='string'&&Buffer.byteLength(text)<=256*1024,'IMPORT_TOO_LARGE');
  insist(/\.(txt|csv)$/i.test(name),'IMPORT_FILE_TYPE');
  text=text.replace(/^\uFEFF/,'');
  if(/\.txt$/i.test(name)) return text.split(/\r?\n/).map(code=>code.trim()).filter(Boolean).map(code=>({code}));
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<=text.length;i++){
    const c=text[i];
    if(c==='"'){
      if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
    }else if(!quoted&&(c===','||c==='\n'||c===undefined)){
      row.push(cell.replace(/\r$/,''));cell='';
      if(c!==','){if(row.some(x=>x.trim())) rows.push(row);row=[];}
    }else if(c!==undefined) cell+=c;
  }
  insist(!quoted,'INVALID_CSV');
  const header=rows.shift()?.map(x=>x.trim().toLowerCase());
  insist(header?.includes('code')&&header.every(x=>['code','cost_egp'].includes(x))&&new Set(header).size===header.length,'CSV_HEADER_REQUIRED');
  return rows.map(r=>{
    insist(r.length===header.length,'INVALID_CSV');const cost=r[header.indexOf('cost_egp')];
    return {code:r[header.indexOf('code')].trim(),...(cost?.trim()?{cost:money(cost.trim())}:{})};
  });
}
