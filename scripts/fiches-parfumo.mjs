// Récupère notes, accords, tenue, sillage... pour chaque parfum (Parfumo) -> fiches/fiches.json
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const pushProgress = () => { if (!process.env.CI || process.env.SHARD) return; try { execSync('git fetch -q origin $GITHUB_REF_NAME && git reset -q FETCH_HEAD && git add fiches/fiches.json fiches/etat.txt && git commit -qm "Fiches parfum (en cours)" && git push -q origin HEAD:$GITHUB_REF_NAME', { stdio: 'inherit', shell: '/bin/bash' }) } catch (e) {} };
const keys = JSON.parse(fs.readFileSync('images/requetes.json', 'utf8'));
const F = 'fiches/fiches.json';
const out = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const H = { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', 'Accept': 'text/html' };
const txt = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
const ST = {};
const T0 = Date.now(), BUDGET = 325 * 60 * 1000;
let pause = 0;
async function get(u) {
  for (let t = 0; t < 6; t++) {
    try {
      const r = await fetch(u, { headers: H }); ST[r.status] = (ST[r.status] || 0) + 1;
      await sleep(6000); // rythme poli : une page toutes les 6 secondes
      if (r.status === 200) { const h = await r.text(); if (!h.includes('Just a moment')) return h; ST.cf = (ST.cf || 0) + 1 }
      else if (r.status === 404) return null;
      await sleep(10 * 60 * 1000); // bloqué : pause de 10 minutes
    } catch (e) { ST.err = (ST.err || 0) + 1; await sleep(5000) }
  }
  return undefined;
}
function brandOf(k){return k}
const MARQ = JSON.parse(fs.readFileSync('images/marques.json', 'utf8'));
const STOP = new Set(['parfum', 'parfums', 'perfume', 'perfumes', 'paris', 'london', 'fragrances', 'the', 'and', 'de', 'des']);
const toks = s => decodeURIComponent(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !STOP.has(t));
async function search(q, brand) {
  const h = await get('https://www.parfumo.com/s_perfumes_x.php?in=1&filter=' + encodeURIComponent(q));
  if (h === undefined) return undefined;
  if (!h) return null;
  const links = [...new Set([...h.matchAll(/href="(https:\/\/www\.parfumo\.com\/Perfumes\/([^\/"]+)\/([^"#?]+))"/g)].filter(m => !['Tops','Trends','Dupes','New'].includes(m[2])).map(m => m[1]))];
  const bt = toks(brand);
  return links.find(l => { const pt = toks(l.split('/')[4].replace(/_/g, ' ')); return pt.some(t => bt.includes(t)) || norm(brand).startsWith(norm(l.split('/')[4]).slice(0, 5)) }) || null;
}
const OVR = { 'Maison Francis Kurkdjian MFK Baccarat Rouge 540': 'Baccarat Rouge 540', 'Armaf Club De Nuit Intense M Parfum': 'Club de Nuit Intense Man Parfum' };
async function find(k) {
  const brand = MARQ[k] || k.split(' ')[0];
  let name = OVR[k] || k.slice(brand.length).trim().replace(/\s+\b[MW]\b\s*$/, '').replace(/\bCPO\b/, '').trim();
  const q1 = (brand + ' ' + name).trim();
  let u = await search(q1, brand);
  if (u === null) {
    const short = name.replace(/\b(Parfum|Extrait|EDP|EDT|Eau de Parfum|Eau de Toilette|Intense|Elixir|Le Parfum|Edition|Limited|Collection|M|W)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    if (short && short !== name) u = await search(short, brand);
    else if (name.split(' ').length > 2) u = await search(name.split(' ').slice(0, 2).join(' '), brand);
  }
  return u;
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
const PRIO = ['Nishane','Xerjoff','Parfums De Marly','Initio','Creed','Maison Francis Kurkdjian','Kilian','Amouage','Tom Ford','Memo','Tiziana Terenzi','Mancera','Montale Paris','Byredo','Lattafa','Armaf','Christian Dior','Chanel','Yves Saint Laurent','Giorgio Armani','Paco Rabanne','Jean Paul Gaultier','Carolina Herrera','Versace','Gucci','Prada','Valentino','Hermès','Guerlain','Givenchy','Bvlgari','Afnan','Rasasi','Ajmal','Al Haramain','Swiss Arabian','Arabian Oud','French Avenue'];
const pr = k => { const i = PRIO.findIndex(b => k.startsWith(b + ' ')); return i < 0 ? 99 : i };
const P3 = !!process.env.PASSE3;
const [SI, SN] = (process.env.SHARD || '0/1').split('/').map(Number);
const BASE = JSON.stringify(out);
const mine = (arr) => arr.filter((_, i) => i % SN === SI);
const savePart = () => { if (!process.env.SHARD) return; const b = JSON.parse(BASE), p = {}; for (const k in out) if (JSON.stringify(out[k]) !== JSON.stringify(b[k])) p[k] = out[k]; fs.writeFileSync('fiches/part.json', JSON.stringify(p)) };
const BS = {}; { const c = {}; for (const k in out) if (out[k] && out[k].url) { const b = MARQ[k] || k.split(' ')[0], s = out[k].url.split('/')[4]; c[b] = c[b] || {}; c[b][s] = (c[b][s] || 0) + 1 } for (const b in c) BS[b] = Object.entries(c[b]).sort((x, y) => y[1] - x[1])[0][0] }
const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function coreName(k, brand) {
  let n = k.slice(brand.length).trim();
  n = n.split(/\s\+|\+\d|\s\(|\bSet\b|\d+(?:\.\d+)?\s?ml|\b\d+\s?[x×]\b|\bDeo\b|\bRefill|\bRecharge|\bTravel\b|\bBundle\b/i)[0];
  const bw = brand.split(' ')[0]; if (n.toLowerCase().startsWith(bw.toLowerCase() + ' ')) n = n.slice(bw.length + 1);
  n = n.replace(/^(EM|AB|MTL|TC|ADC|OC|LG)\.?\s*/i, '').replace(/^[A-Z]{2,4}\.\s*/, '').replace(/\b(W|M|PH|PF|CPO|Unbox|Tester|Mini)\b/g, ' ').replace(/\s+/g, ' ').trim();
  n = n.replace(/\b(The Carnal Blends Collection|The Carnal Blends|The Absolutes|Anniversary Collection|Casamorati 1888|Royal Essence|Blends|Collection|Pocket|Gourmand Edition)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  return n;
}
async function find3(k) {
  const brand = MARQ[k] || k.split(' ')[0]; const n = coreName(k, brand); if (!n) return null;
  const bs = BS[brand] || brand.replace(/[^A-Za-z0-9]+/g, '_');
  for (const u of ['https://www.parfumo.com/Perfumes/' + bs + '/' + slug(n), 'https://www.parfumo.com/Perfumes/' + bs + '/' + slug(n) + '-eau-de-parfum']) {
    const h = await get(u); if (h === undefined) return undefined; if (h && h.includes('Main accords') || h && h.includes('clickable_note_img')) return { u, h };
  }
  const h = await get('https://www.parfumo.com/s_perfumes_x.php?in=1&filter=' + encodeURIComponent(n));
  if (h === undefined) return undefined; if (!h) return null;
  const nb = norm(bs);
  const l = [...new Set([...h.matchAll(/href="(https:\/\/www\.parfumo\.com\/Perfumes\/([^\/"]+)\/([^"#?]+))"/g)].filter(m => norm(m[2]) === nb || toks(m[2].replace(/_/g, ' ')).some(t => toks(brand).includes(t))).map(m => m[1]))][0];
  if (!l) return null; const h2 = await get(l); return h2 ? { u: l, h: h2 } : (h2 === undefined ? undefined : null);
}
if (P3) {
  const todo3 = mine(Object.keys(out).filter(k => out[k] && out[k].nf === 2 && keys.includes(k)).sort((a, b) => pr(a) - pr(b)));
  let d3 = 0, ok3 = 0;
  for (const k of todo3) {
    if (Date.now() - T0 > BUDGET) break;
    let r; try { r = await find3(k) } catch (e) { r = undefined }
    if (r === undefined) continue;
    if (r) { out[k] = parse(r.h, r.u); ok3++ } else out[k] = { nf: 3 };
    d3++; if (d3 % 50 === 0) { console.log('passe3', d3, '/', todo3.length, ok3, JSON.stringify(ST)); fs.writeFileSync(F, JSON.stringify(out)); fs.writeFileSync('fiches/etat.txt', 'passe3 ' + d3 + ' / ' + todo3.length + ' trouves ' + ok3 + ' ' + JSON.stringify(ST)); savePart(); execSync('git add fiches/etat.txt'); pushProgress() }
  }
  fs.writeFileSync(F, JSON.stringify(out));
  fs.writeFileSync('fiches/etat.txt', 'passe3 fini ' + d3 + ' / ' + todo3.length + ' trouves ' + ok3 + ' reste ' + Object.keys(out).filter(k => out[k] && out[k].nf === 2).length + ' ' + JSON.stringify(ST));
  console.log('passe3 fini', d3, ok3); savePart(); if (!process.env.SHARD) process.exit(0);
}
for (const k in out) if (!out[k] || (out[k].nf === 1 && process.env.RETENTER)) delete out[k]; // les { nf: 1 } (introuvables) ne sont pas retentés // on retente les échecs
const todo = mine(keys.filter(k => !(k in out)).sort((a, b) => pr(a) - pr(b)));
let done = 0, ok = 0;
const N = 1;
await Promise.all([...Array(N)].map(async (_, w) => {
  for (let i = w; i < todo.length; i += N) {
    if (Date.now() - T0 > BUDGET) break;
    const k = todo[i]; let r = null;
    let nf = false;
    try { const u = await find(k); if (u === null) nf = true; else if (u) { const h = await get(u); if (h) r = parse(h, u) } } catch (e) {}
    if (r) { out[k] = r; ok++ } else if (nf) out[k] = { nf: 2 }; done++;
    if (done % 100 === 0) { console.log(done, '/', todo.length, 'fiches', ok, JSON.stringify(ST)); fs.writeFileSync(F, JSON.stringify(out)); if (done % 100 === 0) { fs.writeFileSync('fiches/etat.txt', done + ' / ' + todo.length + ' fiches ' + ok + ' ' + JSON.stringify(ST)); savePart(); execSync('git add fiches/etat.txt'); pushProgress() } }
  }
}));
fs.writeFileSync(F, JSON.stringify(out));
console.log('fini', done, 'fiches', ok, JSON.stringify(ST));
fs.writeFileSync('fiches/etat.txt', 'total ' + Object.keys(out).length + ' / ' + keys.length + ' ' + JSON.stringify(ST));
fs.writeFileSync('fiches/reste.txt', String(keys.filter(k => !(k in out)).length - (todo.length - done)));
savePart();
