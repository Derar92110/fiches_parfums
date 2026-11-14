import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const all=[];
for(let p=1;p<20;p++){const r=await fetch('https://www.tomfordbeauty.com/products.json?limit=250&page='+p,{headers:{'User-Agent':UA}});if(r.status!==200){console.log('st',r.status);break}const j=await r.json();if(!j.products.length)break;
for(const x of j.products)all.push({t:x.title,h:x.handle,ty:x.product_type,tags:x.tags,img:(x.images||[]).map(i=>i.src).slice(0,4)});await new Promise(r=>setTimeout(r,1500))}
fs.mkdirSync('tf/out',{recursive:true});fs.writeFileSync('tf/out/produits.json',JSON.stringify(all,null,0));console.log(all.length);
