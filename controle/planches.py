import json,urllib.request,io
from PIL import Image,ImageDraw
L=json.load(open('controle/liste.json'))
W,H,C=180,225,8
for b in range(0,len(L),48):
    part=L[b:b+48];rows=(len(part)+C-1)//C
    sheet=Image.new('RGB',(C*W,rows*(H+20)),'white');d=ImageDraw.Draw(sheet)
    for k,x in enumerate(part):
        try:
            u='https://ts1.mm.bing.net/th?id=OIP.'+x['ph']+'&pid=15.1&w=360&h=450'
            im=Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read())).convert('RGB')
            im.thumbnail((W-6,H-6))
        except Exception as e:
            im=Image.new('RGB',(W-6,H-6),'red')
        c,r=k%C,k//C;sheet.paste(im,(c*W+3,r*(H+20)+3))
        d.text((c*W+4,r*(H+20)+H),str(b+k),fill='black')
    sheet.save(f'controle/planche_{b//48}.jpg',quality=80)
