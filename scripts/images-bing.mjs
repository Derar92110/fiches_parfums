// Cherche une photo pour chaque parfum (vignette Bing Images) et écrit images/images.json
import fs from 'node:fs';
const keys = JSON.parse(fs.readFileSync('images/requetes.json', 'utf8'));
const out = fs.existsSync('images/images.json') ? JSON.parse(fs.readFileSync('images/images.json', 'utf8')) : {};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dec = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
async function search(k) {
  const q = k.replace(/\s+\b[MW]\b\s*$/, '').replace(/\bCPO\b/, 'perfume oil') + ' perfume';
  const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(q) + '&form=HDRSC2&first=1&qft=+filterui:aspect-tall';
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' } });
      const h = await r.text();
      const res = [...h.matchAll(/ m="(\{[^"]*?\})"/g)].map(m => { try { return JSON.parse(dec(m[1])) } catch { return null } }).filter(x => x && x.turl);
      if (res.length) return { t: res[0].turl, u: res[0].murl, s: res[0].purl };
      if (r.status !== 200) await sleep(5000 * (t + 1));
    } catch (e) { await sleep(3000) }
  }
  return null;
}
let done = 0, found = 0;
const todo = keys.filter(k => !(k in out));
const N = 4;
await Promise.all([...Array(N)].map(async (_, w) => {
  for (let i = w; i < todo.length; i += N) {
    const k = todo[i]; const r = await search(k);
    out[k] = r; done++; if (r) found++;
    if (done % 100 === 0) { console.log(done, '/', todo.length, 'trouvées', found); fs.writeFileSync('images/images.json', JSON.stringify(out)); }
    await sleep(400);
  }
}));
fs.writeFileSync('images/images.json', JSON.stringify(out));
console.log('fini', done, 'trouvées', found);
