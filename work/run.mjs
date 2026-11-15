import fs from 'fs';import {execSync} from 'child_process';
fs.mkdirSync('work/out/raw',{recursive:true});
const P=JSON.parse(fs.readFileSync('work/pages.json'));
const UA={'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','accept':'text/html,*/*','accept-language':'fr-FR,fr;q=0.9,en;q=0.8'};
const res={};
for(let k=0;k<P.length;k+=6){await Promise.all(P.slice(k,k+6).map(async([key,u],j)=>{const id=String(k+j).padStart(3,'0');const r={u,im:[],st:''};res[id]={key,...r};
 try{const x=await fetch(u,{headers:UA,signal:AbortSignal.timeout(30000)});r.st=x.status;const h=await x.text();
  const ims=new Set();for(const m of h.matchAll(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)/gi))ims.add(m[1]);
  for(const m of h.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/gi))ims.add(m[1]);
  for(const m of h.matchAll(/"image"\s*:\s*\[?\s*"([^"]+)"/g))ims.add(m[1].replace(/\\\//g,'/'));
  r.im=[...ims].map(s=>s.startsWith('//')?'https:'+s:s).filter(s=>/^https?:/.test(s)).slice(0,3);
  let n=0;for(const im of r.im){try{const y=await fetch(im,{headers:UA,signal:AbortSignal.timeout(30000)});if(y.ok){fs.writeFileSync(`work/out/raw/${id}_${n}.img`,Buffer.from(await y.arrayBuffer()));n++}}catch(e){}}
 }catch(e){r.st='ERR '+e.message}
 res[id]={key,...r};}))}
fs.writeFileSync('work/out/pages_res.json',JSON.stringify(res,null,1));
execSync('pip install -q pillow pillow-avif-plugin || pip install -q pillow');
fs.writeFileSync('work/rs.py',`import glob,os
from PIL import Image
try:
  import pillow_avif
except Exception: pass
os.makedirs('work/out/img',exist_ok=True)
for p in glob.glob('work/out/raw/*.img'):
  try:
    im=Image.open(p).convert('RGB');im.thumbnail((400,520));im.save('work/out/img/'+os.path.basename(p)[:-4]+'.jpg',quality=85)
  except Exception as e: print('ko',p,e)
`);
console.log(execSync('python3 work/rs.py').toString());
fs.rmSync('work/out/raw',{recursive:true,force:true});
