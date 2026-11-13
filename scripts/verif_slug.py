import json,re,unicodedata,sys
def tok(s):
  s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
  return [t for t in re.split(r'[^a-z0-9]+',s) if t]
def accord(url,src):
  m=re.search(r'/[0-9a-f]{6}[-_](.+?)_\d+\.jpg',src or '')
  if not m: return False
  name=url.rstrip('/').split('/')[-1]
  nt=set(tok(name)); st=set(tok(m.group(1)))
  return bool(nt) and nt<=st
if __name__=='__main__':
  F=json.load(open('fiches/fiches.json'));p=json.load(open('photos/parfumo.json'))
  ok=[k for k,v in p.items() if 'src' in v and '/perfume_social/' in v['src'] and accord(F[k]['url'],v['src'])]
  print(len(ok),'/',sum(1 for v in p.values() if '/perfume_social/' in v.get('src','')))
  for k in ok[:15]: print(k,F[k]['url'].split('/')[-1],p[k]['src'].split('/')[-1][:60])
