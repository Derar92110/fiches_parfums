import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const U=['https://www.tomfordbeauty.com/','https://www.tomfordbeauty.fr/','https://www.tomfordbeauty.co.uk/','https://www.tomfordbeauty.com/sitemap.xml','https://www.tomfordbeauty.fr/sitemap.xml','https://www.tomfordbeauty.com/fragrance','https://www.tomfordbeauty.fr/parfum','https://www.tomfordbeauty.com/product/lost-cherry-eau-de-parfum'];
let o='';fs.mkdirSync('tf/out',{recursive:true});
for(const [i,u] of U.entries()){try{const r=await fetch(u,{headers:{'User-Agent':UA,'Accept-Language':'fr-FR,fr;q=0.9,en;q=0.8','Accept':'text/html,application/xhtml+xml,application/xml'}});const h=await r.text();fs.writeFileSync('tf/out/'+i+'.html',h.slice(0,400000));
const imgs=[...new Set(h.match(/https?:\/\/[^"' )]+\.(?:png|jpg|jpeg|webp)/gi)||[])].slice(0,15);
o+=`${u}\n ${r.status} ${r.url} len ${h.length} title ${(h.match(/<title>([^<]*)/)||[])[1]}\n ${imgs.join('\n ')}\n\n`}catch(e){o+=u+' ERR '+e.message+'\n'}}
fs.writeFileSync('tf/out/resume.txt',o);console.log(o);
