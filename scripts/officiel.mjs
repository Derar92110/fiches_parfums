// Cherche les vidéos officielles (mp4/m3u8/vimeo) sur les pages publiques des marques. Pas de YouTube.
import fs from 'fs';
const d = JSON.parse(fs.readFileSync('officiel/demande.json'));
const UA = {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','accept-language':'fr-FR,fr;q=0.9,en;q=0.8'};
const vus = new Set(), videos = new Set(), log = [];
async function page(url, depth) {
  if (vus.has(url) || vus.size > 60) return; vus.add(url);
  let html = '';
  try { const r = await fetch(url, {headers: UA, redirect: 'follow'}); html = await r.text(); log.push(`${r.status} ${url} (${html.length})`); } catch (e) { log.push(`ERR ${url} ${e.message}`); return; }
  const h = html.replace(/\\u002F/g,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&');
  for (const m of h.matchAll(/https?:\/\/[^"'\s<>()\\]+?\.(?:mp4|m3u8|webm|mov)(?:\?[^"'\s<>\\]*)?/gi)) videos.add(m[0]);
  for (const m of h.matchAll(/https?:\/\/(?:player\.)?vimeo\.com\/(?:video\/)?\d+[^"'\s<>\\]*/gi)) videos.add(m[0]);
  for (const m of h.matchAll(/https?:\/\/[^"'\s<>\\]*(?:brightcove|jwplayer|jwpcdn|scene7|cloudinary|mux\.com|wistia)[^"'\s<>\\]*/gi)) videos.add(m[0]);
  if (depth <= 0) return;
  const base = new URL(url);
  for (const m of h.matchAll(/href="([^"#]+)"/g)) {
    let u; try { u = new URL(m[1], base); } catch { continue; }
    if (u.host === base.host && d.motsLiens.some(k => u.pathname.toLowerCase().includes(k))) await page(u.href, depth - 1);
  }
}
for (const u of d.pages) await page(u, d.profondeur ?? 1);
fs.writeFileSync('officiel/trouve.json', JSON.stringify({pages: log, videos: [...videos]}, null, 1));
console.log(log.join('\n')); console.log([...videos].join('\n'));
