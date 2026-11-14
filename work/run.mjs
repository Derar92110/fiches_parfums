import fs from 'fs';
fs.mkdirSync('work/out',{recursive:true});
const D=["histoiresdeparfums.com","sergelutens.com","vilhelmparfumerie.com","liquidesimaginaires.com","tizianaterenzi.com","boadiceathevictorious.com","ormondejayne.com","etatlibredorange.com","clivechristian.com","electimuss.com","goldfieldandbanks.com","thameenlondon.com","carnerbarcelona.com","floraiku.com","atelierdesors.com","fr.memoparis.com","nishane.com","bdkparfums.com","shl777.com","montaleparfums.com","xerjoff.com","lattafa.com","lattafa-usa.com","mizensir.com","juliettehasagun.com","initioparfums.com","parfums-de-marly.com","rojaparfums.com","amouage.com","fabbricadellamusa.com","ellakparfums.com","fredericmalle.com","atkinsons1799.com","exnihilo-paris.com","byredo.com","jomalone.com","armaf.com","itsnotvape.com","odeurdemarques.com","diptyqueparis.com","acquadiparma.com","christianlouboutin.com","maisonmargiela-fragrances.com","eu.maisonmargiela-fragrances.com"];
const UA={'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','accept':'application/json,text/html'};
const res={};
await Promise.all(D.map(async d=>{const all=[];let st='';
 for(let pg=1;pg<=8;pg++){try{const r=await fetch(`https://${d}/products.json?limit=250&page=${pg}`,{headers:UA,redirect:'follow',signal:AbortSignal.timeout(20000)});st=r.status+' '+r.url;if(!r.ok)break;const j=await r.json();if(!j.products?.length)break;all.push(...j.products.map(p=>({t:p.title,h:p.handle,ty:p.product_type,v:p.vendor,im:p.images.map(i=>i.src)})));}catch(e){st='ERR '+e.message;break}}
 res[d]={st,n:all.length};fs.writeFileSync(`work/out/${d}.json`,JSON.stringify(all));}));
fs.writeFileSync('work/out/_probe.json',JSON.stringify(res,null,1));console.log(res);
