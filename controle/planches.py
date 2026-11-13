import json,urllib.request,io,textwrap
from PIL import Image,ImageDraw,ImageFont
L=json.load(open('controle/liste.json'))
try: FT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
except: FT=ImageFont.load_default()
W,H,C,T=152,170,10,44
def get(u):
    return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read())).convert('RGB')
for b in range(0,len(L),80):
    part=L[b:b+80];rows=(len(part)+C-1)//C
    sheet=Image.new('RGB',(C*W,rows*(H+T)),'white');d=ImageDraw.Draw(sheet)
    for k,x in enumerate(part):
        try:
            u=x['ph'] if x['ph'].startswith('http') else 'https://ts1.mm.bing.net/th?id=OIP.'+x['ph']+'&pid=15.1&w=360&h=400'
            im=get(u);im.thumbnail((W-6,H-6))
        except Exception: im=Image.new('RGB',(W-6,H-6),'red')
        c,r=k%C,k//C;sheet.paste(im,(c*W+3,r*(H+T)+3))
        d.text((c*W+3,r*(H+T)+H),textwrap.shorten(str(b+k)+' '+x['n'],60),font=FT,fill='black') if len(x["n"])<20 else [d.text((c*W+3,r*(H+T)+H+14*j),l,font=FT,fill='black') for j,l in enumerate(textwrap.wrap(str(b+k)+' '+x['n'],21)[:3])]
    sheet.save(f'controle/planche_{b//80:02d}.jpg',quality=82)
