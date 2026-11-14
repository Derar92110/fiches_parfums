import fs from 'node:fs';
const P=JSON.parse(fs.readFileSync('tf/out/produits.json','utf8')),M=JSON.parse(fs.readFileSync('tf/map.json','utf8'));
const by=Object.fromEntries(P.map(p=>[p.h,p]));fs.mkdirSync('tf/out/brut',{recursive:true});const out={};
for(const h of new Set(Object.values(M))){const p=by[h];out[h]=[];if(!p){out[h]='absent';continue}
 for(let k=0;k<p.img.length;k++){let u=p.img[k].split('?')[0];if(u.startsWith('//'))u='https:'+u;u+='?width=800';
  try{const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'}});out[h].push(r.status);if(r.ok)fs.writeFileSync(`tf/out/brut/${h}_${k}.img`,Buffer.from(await r.arrayBuffer()))}catch(e){out[h].push(e.message)}
  await new Promise(r=>setTimeout(r,300))}}
fs.writeFileSync('tf/out/images.json',JSON.stringify(out,null,1));console.log(JSON.stringify(out));
