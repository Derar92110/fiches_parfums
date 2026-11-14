import fs from 'fs';
fs.mkdirSync('work/out/img',{recursive:true});
const L=JSON.parse(fs.readFileSync('work/dl.json'));let ok=0,ko=[];
for(let k=0;k<L.length;k+=12){await Promise.all(L.slice(k,k+12).map(async([n,u])=>{try{const r=await fetch(u,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw r.status;fs.writeFileSync('work/out/img/'+n+'.img',Buffer.from(await r.arrayBuffer()));ok++}catch(e){ko.push(n+' '+e)}}))}
console.log(ok,ko);fs.writeFileSync('work/out/dl_log.json',JSON.stringify({ok,ko}));
// v2
