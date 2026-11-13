// Photo produit Parfumo de chaque parfum ayant une fiche, avec vérification que la page reçue est bien la bonne
import fs from 'node:fs';
const F = JSON.parse(fs.readFileSync('fiches/fiches.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const [si, sn] = (process.env.SHARD || '0/1').split('/').map(Number);
const LIMIT = +(process.env.LIMIT || 0), PAUSE = +(process.env.PAUSE || 4000);
let keys = Object.keys(F).filter(k => F[k] && F[k].url).sort().filter((k, i) => i % sn === si);
if (LIMIT) keys = keys.slice(0, LIMIT);
fs.mkdirSync('photos/brut', { recursive: true });
const out = {}, ST = {};
const T0 = Date.now(), BUDGET = 320 * 60 * 1000;
const tok = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const okSlug = (url, slug) => { const n = tok(url.replace(/\/$/, '').split('/').pop()), s = new Set(tok(slug)); return n.length && n.every(t => s.has(t)) };
async function get(u, bin) {
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.parfumo.com/' } });
      ST[r.status] = (ST[r.status] || 0) + 1;
      if (r.status === 200) { if (bin) return Buffer.from(await r.arrayBuffer()); return { h: await r.text(), url: r.url } }
      if (r.status === 404) return null;
      await sleep(bin ? 3000 : 60000);
    } catch (e) { ST.err = (ST.err || 0) + 1; await sleep(4000) }
  }
  return undefined;
}
let n = 0, bad = 0;
for (const k of keys) {
  if (Date.now() - T0 > BUDGET) break;
  let res = null;
  for (let a = 0; a < 3; a++) {
    const r = await get(F[k].url); await sleep(PAUSE);
    if (!r) { res = { nf: r === null ? 404 : 'err' }; break }
    const og = (r.h.match(/property="og:image"\s+content="([^"]+)"/) || [])[1] || '';
    const m = og.match(/perfume_social\/([0-9a-f]{2})\/([0-9a-f]{6}[-_](.+?))_\d+\.jpg/);
    if (!m) { res = { nf: 'noimg' }; break }
    if (!okSlug(F[k].url, m[3]) && !okSlug(r.url, m[3])) { ST.mauvaisePage = (ST.mauvaisePage || 0) + 1; await sleep(30000 * (a + 1)); res = { nf: 'mauvaise' }; continue }
    res = { src: 'https://media.parfumo.com/perfumes/' + m[1] + '/' + m[2] + '_1200.jpg?width=720&aspect_ratio=3:4', slug: m[3] }; break;
  }
  if (!res.src) { out[k] = res; if (res.nf === 'mauvaise' && ++bad > 30) { console.log('trop de mauvaises pages, arrêt'); break } continue }
  bad = 0;
  const b = await get(res.src, true);
  if (!b) { out[k] = { nf: 'dl', src: res.src }; continue }
  const f = (si * 100000 + n++) + '.img'; fs.writeFileSync('photos/brut/' + f, b); out[k] = { f, src: res.src, slug: res.slug };
  if (n % 50 === 0) console.log(n, '/', keys.length, JSON.stringify(ST));
}
fs.writeFileSync('photos/part.json', JSON.stringify(out));
console.log('fini', n, '/', keys.length, JSON.stringify(ST));
