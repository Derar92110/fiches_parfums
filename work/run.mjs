import fs from 'fs';import {execSync} from 'child_process';
fs.mkdirSync('work/out/raw',{recursive:true});
const L=JSON.parse(fs.readFileSync('work/dl.json'));let ok=0,ko=[];
const UA={'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','accept':'image/avif,image/webp,image/*,*/*','referer':'https://www.sephora.fr/'};
for(let k=0;k<L.length;k+=8){await Promise.all(L.slice(k,k+8).map(async([n,u])=>{try{const r=await fetch(u+'?scaleWidth=500&scaleHeight=500&scaleMode=fit',{headers:UA,signal:AbortSignal.timeout(30000)});if(!r.ok)throw r.status;fs.writeFileSync('work/out/raw/'+n+'.img',Buffer.from(await r.arrayBuffer()));ok++}catch(e){ko.push(n+' '+e)}}))}
fs.writeFileSync('work/out/dl_log.json',JSON.stringify({ok,ko}));
execSync('pip install -q pillow');
fs.writeFileSync('work/rs.py',`import glob,os
from PIL import Image
os.makedirs('work/out/img',exist_ok=True)
for p in glob.glob('work/out/raw/*.img'):
  try:
    im=Image.open(p).convert('RGB');im.thumbnail((400,520));im.save('work/out/img/'+os.path.basename(p)[:-4]+'.jpg',quality=85)
  except Exception as e: print('ko',p,e)
`);console.log(execSync('python3 work/rs.py').toString());fs.rmSync('work/out/raw',{recursive:true,force:true});
