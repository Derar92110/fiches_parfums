# Convertit photos/brut/* en site/img/<n>.webp (max 300x400) et écrit photos/parfumo.json {clé: {img, src}}
import json,os,glob
from PIL import Image
os.makedirs('site/img',exist_ok=True)
m=json.load(open('photos/parfumo.json')) if os.path.exists('photos/parfumo.json') else {}
for p in glob.glob('parts/*/part.json')+(['photos/part.json'] if os.path.exists('photos/part.json') else []):
    d=json.load(open(p));base=os.path.dirname(p)
    for k,v in d.items():
        if 'f' not in v: m.setdefault(k,v);continue
        src=os.path.join(base,'brut',v['f'])
        try:
            im=Image.open(src).convert('RGB');im.thumbnail((300,400))
            name=v['f'].replace('.img','.webp');im.save('site/img/'+name,'WEBP',quality=78)
            m[k]={'img':'img/'+name,'src':v['src']}
        except Exception as e: m[k]={'nf':'conv','src':v.get('src')}
json.dump(m,open('photos/parfumo.json','w'),ensure_ascii=False)
print(len(m),sum(1 for v in m.values() if 'img' in v))
