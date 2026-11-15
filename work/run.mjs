import fs from 'fs';
fs.mkdirSync('work/out',{recursive:true});
const D=["www.tizianaterenzi.com","tizianaterenzi.it","www.nishane.com","www.montaleparfums.com","www.liquidesimaginaires.com","www.boadiceathevictorious.com","www.clivechristian.com","www.dior.com","www.hermes.com","www.dolcegabbana.com","www.calvinklein.fr","www.acquadiparma.com","www.cartier.com","www.bulgari.com","www.chloe.com","www.prada-beauty.com","www.carolinaherrera.com","www.guerlain.com","www.givenchybeauty.com","www.rabanne.com","shl777.com","www.maisonmargiela-fragrances.com","www.fredericmalle.com","www.sephora.fr","www.chanel.com","www.electimuss.com","www.armanibeauty.fr","www.christianlouboutin.com"];
const UA={'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','accept':'text/html,application/xml,*/*','accept-language':'fr-FR,fr;q=0.9,en;q=0.8'};
const get=async u=>{const r=await fetch(u,{headers:UA,signal:AbortSignal.timeout(25000)});return [r.status,await r.text()]};
const res={};
await Promise.all(D.map(async d=>{const urls=new Set();let log=[];
 try{let maps=[];const [s,t]=await get(`https://${d}/robots.txt`);log.push('robots '+s);if(s==200)maps=[...t.matchAll(/sitemap:\s*(\S+)/gi)].map(m=>m[1]);if(!maps.length)maps=[`https://${d}/sitemap.xml`];
  const seen=new Set();let q=[...maps];let n=0;
  while(q.length&&n<120){const u=q.shift();if(seen.has(u))continue;seen.add(u);n++;
   try{const [s2,x]=await get(u);log.push(s2+' '+u);if(s2!=200)continue;const locs=[...x.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([^<\]]+)/g)].map(m=>m[1].trim().replace(/&amp;/g,'&'));
    if(/<sitemapindex/i.test(x)){for(const l of locs){if(/product|produit|fragrance|parfum|perfume|beauty|fr|en/i.test(l)||locs.length<15)q.push(l)}}else locs.forEach(l=>urls.add(l));}catch(e){log.push('ERR '+u)}}
 }catch(e){log.push('ERR '+e.message)}
 res[d]={n:urls.size,log:log.slice(0,15)};fs.writeFileSync(`work/out/sm_${d}.txt`,[...urls].join('\n'));}));
fs.writeFileSync('work/out/_sm.json',JSON.stringify(res,null,1));
