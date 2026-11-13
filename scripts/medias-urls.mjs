// Télécharge des photos produits depuis des adresses connues : medias/urls.json {id: [url, ...]} -> medias/<id>/uNN.jpg
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('medias/urls.json', 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
for (const [id, us] of Object.entries(d)) {
  fs.mkdirSync('medias/' + id, {recursive: true}); let n = 0;
  for (const u of us) {
    try { const r = await fetch(u, {headers: {'User-Agent': UA}}); const b = Buffer.from(await r.arrayBuffer());
      console.log(id, r.status, b.length, u.slice(0, 90));
      if (r.ok && b.length > 5000) fs.writeFileSync(`medias/${id}/u${String(++n).padStart(2, '0')}.jpg`, b);
    } catch (e) { console.log(id, 'ERR', e.message); }
  }
}
