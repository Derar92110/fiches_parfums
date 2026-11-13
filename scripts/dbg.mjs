import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const U=['https://www.parfumo.com/Perfumes/Trussardi/Donna','https://www.parfumo.com/Perfumes/Versace/Blue_Jeans','https://www.parfumo.com/Perfumes/Hugo_Boss/Boss_Orange_Man','https://www.parfumo.com/Perfumes/Afnan_Perfumes/Arabian_Gems_Blue'];
let o='';
for(const u of U){const r=await fetch(u,{headers:{'User-Agent':UA,'Accept-Language':'en-US,en;q=0.9','Referer':'https://www.parfumo.com/'}});const h=await r.text();
const t=(h.match(/<title>([^<]*)/)||[])[1];const og=[...h.matchAll(/<meta[^>]+og:image[^>]*>/g)].map(m=>m[0]);const im=[...new Set(h.match(/https:\/\/media\.parfumo\.com\/perfumes\/[^"' )]+/g)||[])].slice(0,5);
o+=`${u}\n status ${r.status} final ${r.url}\n title ${t}\n og ${og.join(' || ')}\n media ${im.join('\n   ')}\n\n`;await new Promise(r=>setTimeout(r,2500))}
fs.writeFileSync('photos/dbg/out.txt',o);console.log(o);
