// Banque de bruitages : Openverse (licences compatibles usage commercial) + repérage REAL SFX / Earshot
import fs from 'node:fs';
const dem = JSON.parse(fs.readFileSync('sons/demande.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const out = [];
for (const q of dem.openverse) {
  const url = 'https://api.openverse.org/v1/audio/?q=' + encodeURIComponent(q) + '&license_type=commercial,modification&page_size=20&mature=false';
  let j; try { const r = await fetch(url, { headers: { 'User-Agent': 'mediterrana-video/1.0' } }); j = await r.json(); } catch (e) { console.log(q, 'erreur', e.message); continue }
  const res = (j.results || []).filter(x => x.duration == null || x.duration < 30000);
  const dir = 'sons/openverse/' + q.replace(/\W+/g, '-'); fs.mkdirSync(dir, { recursive: true });
  let k = 0;
  for (const x of res) {
    if (k >= 4) break;
    try {
      const r = await fetch(x.url, { headers: { 'User-Agent': UA } }); if (!r.ok) continue;
      const b = Buffer.from(await r.arrayBuffer()); if (b.length < 5000 || b.length > 8e6) continue;
      const ext = (x.filetype || x.url.split('.').pop() || 'mp3').slice(0, 4);
      const f = dir + '/' + String(++k).padStart(2, '0') + '.' + ext; fs.writeFileSync(f, b);
      out.push({ f, q, titre: x.title, auteur: x.creator, licence: x.license, version: x.license_version, licence_url: x.license_url, source: x.source, page: x.foreign_landing_url, attribution: x.attribution, duree_ms: x.duration });
    } catch {}
  }
  console.log(q, res.length, 'résultats,', k, 'téléchargés');
  await sleep(1500);
}
fs.writeFileSync('sons/openverse.json', JSON.stringify(out, null, 1));
// repérage des 2 autres sources
const dec = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const sites = {};
for (const q of dem.sites) {
  try {
    const h = await (await fetch('https://www.bing.com/search?q=' + encodeURIComponent(q), { headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,en;q=0.8' } })).text();
    sites[q] = [...h.matchAll(/<h2><a href="([^"]+)"[^>]*>(.*?)<\/a>/g)].slice(0, 8).map(m => ({ url: dec(m[1]), titre: m[2].replace(/<[^>]+>/g, '') }));
  } catch (e) { sites[q] = String(e) }
}
fs.writeFileSync('sons/sites.json', JSON.stringify(sites, null, 1));
for (const [q, l] of Object.entries(sites)) for (const s of (Array.isArray(l) ? l.slice(0, 3) : [])) {
  try { const h = await (await fetch(s.url, { headers: { 'User-Agent': UA } })).text(); fs.mkdirSync('sons/pages', { recursive: true });
    fs.writeFileSync('sons/pages/' + new URL(s.url).hostname + '.html', h.slice(0, 200000)); } catch {}
}
