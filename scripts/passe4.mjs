// Passe 4 : liste toutes les pages Parfumo de chaque marque, puis rapproche les noms localement
import fs from 'node:fs';
const keys = JSON.parse(fs.readFileSync('images/requetes.json', 'utf8'));
const MARQ = JSON.parse(fs.readFileSync('images/marques.json', 'utf8'));
const out = JSON.parse(fs.readFileSync('fiches/fiches.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const H = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', 'Accept': 'text/html' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
const STOP = new Set(['parfum', 'parfums', 'perfume', 'perfumes', 'paris', 'london', 'fragrances', 'the', 'and', 'de', 'des', 'eau', 'edp', 'edt', 'extrait', 'for', 'pour', 'women', 'men', 'homme', 'femme', 'intense', 'pure', 'cologne', 'spray']);
const toks = s => decodeURIComponent(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(t => (t.length >= 2 || /\d/.test(t)) && !STOP.has(t));
const ST = {};
async function get(u) {
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch(u, { headers: H }); ST[r.status] = (ST[r.status] || 0) + 1;
      await sleep(6000);
      if (r.status === 200) return await r.text();
      if (r.status === 404) return null;
      await sleep(10 * 60 * 1000);
    } catch (e) { await sleep(5000) }
  }
  return null;
}
function coreName(k, brand) {
  let n = k.slice(brand.length).trim();
  n = n.split(/\s\+|\+\d|\s\(|\bSet\b|\d+(?:\.\d+)?\s?ml|\b\d+\s?[x×]\b|\bDeo\b|\bRefill|\bRecharge|\bTravel\b|\bBundle\b/i)[0];
  const bw = brand.split(' ')[0]; if (n.toLowerCase().startsWith(bw.toLowerCase() + ' ')) n = n.slice(bw.length + 1);
  n = n.replace(/^(EM|AB|MTL|TC|ADC|OC|LG)(\.\s*|\s+)/, '').replace(/^[A-Z]{2,4}\.\s*/, '').replace(/\b(W|M|PH|PF|CPO|Unbox|Tester|Mini)\b/g, ' ').replace(/\s+/g, ' ').trim();
  n = n.replace(/\b(The Carnal Blends Collection|The Carnal Blends|The Absolutes|Anniversary Collection|Casamorati 1888|Royal Essence|Blends|Collection|Pocket|Gourmand Edition)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  return n;
}

function parse(h, url) {
  const f = { url };
  const notes = { t: [], m: [], b: [], n: [] };
  for (const m of h.matchAll(/class="clickable_note_img[^"]*" data-nt="(\w)"[\s\S]*?alt="([^"]*)"/g)) { if (notes[m[1]] && !notes[m[1]].includes(m[2])) notes[m[1]].push(m[2]) }
  for (const k of ['t', 'm', 'b', 'n']) if (notes[k].length) f[k] = notes[k].map(x => txt(x));
  const ac = h.split('Main accords')[1];
  if (ac) f.a = [...ac.slice(0, 4000).matchAll(/<div class="text-xs grey">([^<]+)<\/div>/g)].map(m => txt(m[1])).slice(0, 6);
  for (const m of h.matchAll(/data-type="(\w+)"[\s\S]{0,700}?rating-score[^>]*>([\d.]+)<\/span>[\s\S]{0,80}?rating-count[^>]*>([\d,]+) Ratings/g)) f['r_' + m[1]] = [+m[2], +m[3].replace(/,/g, '')];
  const y = h.match(/released in <a[^>]*>(\d{4})<\/a>/); if (y) f.y = +y[1];
  const g = h.match(/perfume by [^<]{0,80}? for (women and men|women|men)/); if (g) f.g = g[1];
  const p = [...h.matchAll(/href="https:\/\/www\.parfumo\.com\/Perfumers\/[^"]+"[^>]*>([^<]+)<\/a>/g)].map(m => txt(m[1])); if (p.length) f.p = [...new Set(p)].slice(0, 3);
  const d = h.match(/The scent is ([^.]+)\./); if (d) f.s = txt(d[1]);
  return f;
}


const [SI, SN] = (process.env.SHARD || '0/1').split('/').map(Number);
const BS = {}; { const c = {}; for (const k in out) if (out[k] && out[k].url) { const b = MARQ[k] || k.split(' ')[0], s = out[k].url.split('/')[4]; c[b] = c[b] || {}; c[b][s] = (c[b][s] || 0) + 1 } for (const b in c) BS[b] = Object.entries(c[b]).sort((x, y) => y[1] - x[1])[0][0] }
const todo = keys.filter(k => out[k] && out[k].nf);
const byB = {}; for (const k of todo) { const b = MARQ[k] || k.split(' ')[0]; (byB[b] = byB[b] || []).push(k) }
const brands = Object.keys(byB).sort().filter((_, i) => i % SN === SI);
async function brandSlug(b) {
  if (BS[b]) return BS[b];
  const g = b.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const h = await get('https://www.parfumo.com/s_perfumes_x.php?in=1&filter=' + encodeURIComponent(b));
  if (h) { const bt = toks(b); const c = {}; for (const m of h.matchAll(/href="https:\/\/www\.parfumo\.com\/Perfumes\/([^\/"]+)\/[^"#?]+"/g)) { const pt = toks(m[1].replace(/_/g, ' ')); if (pt.length && pt.every(t => bt.includes(t))) c[m[1]] = (c[m[1]] || 0) + 1 } const best = Object.entries(c).sort((x, y) => y[1] - x[1])[0]; if (best) return best[0] }
  return g;
}
async function listBrand(bs) {
  const L = new Map(); const seen = new Set(); const q = ['https://www.parfumo.com/Perfumes/' + bs];
  while (q.length && seen.size < 25) {
    const u = q.shift(); if (seen.has(u)) continue; seen.add(u);
    const h = await get(u); if (!h) continue;
    for (const m of h.matchAll(new RegExp('href="(https://www\\.parfumo\\.com/Perfumes/' + bs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/([^"#?/]+))"', 'g'))) L.set(m[1], m[2]);
    for (const m of h.matchAll(new RegExp('href="(https://www\\.parfumo\\.com/Perfumes/' + bs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^"]*(?:page|current_page)=\\d+[^"]*)"', 'g'))) { const v = m[1].replace(/&amp;/g, '&'); if (!seen.has(v)) q.push(v) }
  }
  return L;
}
const part = {}; let ok = 0, n = 0;
for (const b of brands) {
  const bs = await brandSlug(b); const L = await listBrand(bs);
  console.log(b, '->', bs, L.size, 'parfums');
  const cand = [...L].map(([u, s]) => ({ u, t: toks(s.replace(/-/g, ' ')) }));
  for (const k of byB[b]) {
    n++;
    const ct = [...new Set(toks(coreName(k, b)))].filter(t => !toks(b).includes(t));
    if (!ct.length) continue;
    const m = cand.filter(c => ct.every(t => c.t.includes(t))).sort((x, y) => x.t.length - y.t.length)[0];
    if (!m) continue;
    const h = await get(m.u); if (!h) continue;
    const f = parse(h, m.u); if (f.t || f.m || f.b || f.n || f.a) { part[k] = f; ok++; console.log('  ok', k, '->', m.u.split('/').pop()) }
  }
  fs.writeFileSync('fiches/part.json', JSON.stringify(part));
}
console.log('fini', n, 'trouves', ok, JSON.stringify(ST));
fs.writeFileSync('fiches/part.json', JSON.stringify(part));
