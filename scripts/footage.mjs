// Récupère des vidéos réelles : stock gratuit Mixkit (licence libre) -> footage/mixkit/<theme>/*.mp4 + liste.json
import fs from 'node:fs';
const dem = JSON.parse(fs.readFileSync('footage/demande.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const out = [];
for (const q of dem.mixkit) {
  const dir = 'footage/mixkit/' + q; fs.mkdirSync(dir, { recursive: true });
  let h = '';
  try { h = await (await fetch('https://mixkit.co/free-stock-video/' + q + '/', { headers: { 'User-Agent': UA } })).text(); } catch (e) { console.log(q, 'erreur', e.message); continue }
  const urls = [...new Set([...h.matchAll(/https:\/\/assets\.mixkit\.co\/videos\/[^"'\s]+?\.mp4/g)].map(m => m[0]))];
  const titles = [...h.matchAll(/<h2[^>]*>\s*([^<]+?)\s*<\/h2>/g)].map(m => m[1]);
  console.log(q, urls.length, 'videos');
  let k = 0;
  for (const u of urls) {
    if (k >= 8) break;
    const u720 = u.replace(/-(360|large|preview)\.mp4$/, '-720.mp4');
    for (const cand of [u720, u]) {
      try { const r = await fetch(cand, { headers: { 'User-Agent': UA } }); if (!r.ok) continue; const b = Buffer.from(await r.arrayBuffer()); if (b.length < 100000) continue;
        const f = dir + '/' + String(++k).padStart(2, '0') + '.mp4'; fs.writeFileSync(f, b); out.push({ f, u: cand, q }); break } catch {}
    }
  }
  if (!urls.length) fs.writeFileSync(dir + '/page.html', h.slice(0, 20000));
}
fs.writeFileSync('footage/liste.json', JSON.stringify(out, null, 1));
