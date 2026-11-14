import fs from 'node:fs';
const P=JSON.parse(fs.readFileSync('tf/out/produits.json','utf8')),M=JSON.parse(fs.readFileSync('tf/map.json','utf8'));
const by=Object.fromEntries(P.map(p=>[p.h,p]));fs.mkdirSync('tf/out/brut',{recursive:true});const out={};
for(const h of new Set(Object.values(M))){const p=by[h];if(!p){out[h]=null;continue}for(const [k,src] of p.img.entries()){const u=src.split('?')[0]+'?width=800';const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'}});if(r.ok)fs.writeFileSync('tf/out/brut/'+h+'_'+k+'.img',Buffer.from(await r.arrayBuffer()));await new Promise(r=>setTimeout(r,300))}continue;
 const u=p.img[0].split('?')[0]+'?width=800';const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'}});
 if(r.ok){fs.writeFileSync('tf/out/brut/'+h+'.img',Buffer.from(await r.arrayBuffer()));out[h]=u}else out[h]='ERR '+r.status;await new Promise(r=>setTimeout(r,500))}
fs.writeFileSync('tf/out/images.json',JSON.stringify(out,null,1));console.log(out);
