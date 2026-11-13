// Télécharge la photo officielle Parfumo de chaque parfum ayant une fiche -> photos/brut/<n>.jpg + photos/part.json
import fs from 'node:fs';
const F = JSON.parse(fs.readFileSync('fiches/fiches.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const [si, sn] = (process.env.SHARD || '0/1').split('/').map(Number);
const LIMIT = +(process.env.LIMIT || 0);
let keys = Object.keys(F).filter(k => F[k] && F[k].url).sort().filter((k, i) => i % sn === si);
if (LIMIT) keys = keys.slice(0, LIMIT);
fs.mkdirSync('photos/brut', { recursive: true });
const out = {}, ST = {};
const T0 = Date.now(), BUDGET = 330 * 60 * 1000;
async function get(u, bin) {
  for (let t = 0; t < 5; t++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.parfumo.com/' } });
      ST[r.status] = (ST[r.status] || 0) + 1;
      if (r.status === 200) { if (bin) return Buffer.from(await r.arrayBuffer()); const h = await r.text(); if (!h.includes('Just a moment')) return h; ST.cf = (ST.cf || 0) + 1 }
      else if (r.status === 404) return null;
      await sleep(bin ? 3000 : 5 * 60 * 1000);
    } catch (e) { ST.err = (ST.err || 0) + 1; await sleep(4000) }
  }
  return undefined;
}
let n = 0;
for (const k of keys) {
  if (Date.now() - T0 > BUDGET) break;
  const h = await get(F[k].url); await sleep(2500);
  if (!h) { out[k] = { nf: h === null ? 404 : 'err' }; continue }
  let img = (h.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) || h.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/) || [])[1];
  if (!img || /logo|default|placeholder/i.test(img)) { const m = h.match(/https:\/\/pimages\.parfumo\.de\/[^"' )]+\.(?:jpg|jpeg|png|webp)/i); img = m && m[0] }
  if (!img) { out[k] = { nf: 'noimg' }; if (n < 3) fs.writeFileSync('photos/debug_' + n + '.html', h.slice(0, 20000)); continue }
  const b = await get(img, true);
  if (!b) { out[k] = { nf: 'dl', src: img }; continue }
  const f = (si * 100000 + n++) + '.img'; fs.writeFileSync('photos/brut/' + f, b); out[k] = { f, src: img };
  if (n % 50 === 0) console.log(n, '/', keys.length, JSON.stringify(ST));
}
fs.writeFileSync('photos/part.json', JSON.stringify(out));
console.log('fini', n, '/', keys.length, JSON.stringify(ST));
