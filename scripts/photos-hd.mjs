// Re-télécharge les photos Parfumo en grand : photo produit (/perfumes/) sinon carte sociale (à recadrer)
import fs from 'node:fs';
const P = JSON.parse(fs.readFileSync('photos/parfumo.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const [si, sn] = (process.env.SHARD || '0/1').split('/').map(Number);
const LIMIT = +(process.env.LIMIT || 0);
let keys = Object.keys(P).filter(k => P[k].src && P[k].src.includes('/perfume_social/')).sort().filter((k, i) => i % sn === si);
if (LIMIT) keys = keys.slice(0, LIMIT);
fs.mkdirSync('photos/hd', { recursive: true });
const out = {}, ST = {};
async function get(u) {
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA, 'Referer': 'https://www.parfumo.com/' } });
      ST[r.status] = (ST[r.status] || 0) + 1;
      if (r.status === 200) { const b = Buffer.from(await r.arrayBuffer()); return { b, ct: r.headers.get('content-type') || '' } }
      if (r.status === 404 || r.status === 403) return null;
      await sleep(3000);
    } catch (e) { ST.err = (ST.err || 0) + 1; await sleep(3000) }
  }
  return null;
}
for (const k of keys) {
  const s = P[k].src.split('?')[0];
  const n = P[k].img.match(/(\d+)\.webp/)[1];
  const cands = [[s.replace('/perfume_social/', '/perfumes/') + '?width=720&aspect_ratio=3:4', 'p'], [s.replace('/perfume_social/', '/perfumes/'), 'p'], [s + '?format=jpg&quality=95', 's']];
  let done = false;
  for (const [u, t] of cands) {
    const r = await get(u); await sleep(300);
    if (r && r.b.length > 3000 && /image/.test(r.ct)) { fs.writeFileSync('photos/hd/' + n + '.' + t, r.b); out[k] = { n, t, u }; done = true; break }
  }
  if (!done) out[k] = { n, t: 'x' };
}
fs.writeFileSync('photos/hd.json', JSON.stringify(out));
console.log('fini', keys.length, JSON.stringify(ST), JSON.stringify(Object.values(out).reduce((a, o) => (a[o.t] = (a[o.t] || 0) + 1, a), {})));
