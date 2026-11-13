// Télécharge des photos officielles de produits (Bing Images) pour les vidéos : medias/<id>/NN.jpg + sources.json
import fs from 'node:fs';
const dem = JSON.parse(fs.readFileSync('medias/demande.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const dec = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function search(q) {
  const url = 'https://www.bing.com/images/search?q=' + encodeURIComponent(q) + '&form=HDRSC2&first=1&qft=+filterui:imagesize-large';
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' } });
  const h = await r.text();
  return [...h.matchAll(/ m="(\{[^"]*?\})"/g)].map(m => { try { return JSON.parse(dec(m[1])) } catch { return null } }).filter(x => x && x.murl);
}
async function get(u) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: c.signal });
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 15000) return null;
    return b;
  } catch { return null } finally { clearTimeout(t) }
}
for (const [id, qs] of Object.entries(dem)) {
  const dir = 'medias/' + id; fs.mkdirSync(dir, { recursive: true });
  const src = []; let n = 0;
  for (const q of qs) {
    let res = []; try { res = await search(q) } catch {}
    let k = 0;
    for (const x of res) {
      if (k >= 7) break;
      const b = await get(x.murl); if (!b) continue;
      const ext = b[0] === 0x89 ? 'png' : (b.slice(8, 12).toString() === 'WEBP' ? 'webp' : 'jpg');
      const f = String(++n).padStart(2, '0') + '.' + ext;
      fs.writeFileSync(dir + '/' + f, b); src.push({ f, q, u: x.murl, s: x.purl }); k++;
    }
    await sleep(4000);
  }
  fs.writeFileSync(dir + '/sources.json', JSON.stringify(src, null, 1));
  console.log(id, n);
}
