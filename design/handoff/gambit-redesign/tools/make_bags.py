import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
U='/mnt/user-data/uploads/'
LAB={'salt':'Gambit_Salt_Plantain_Chips.png','bbq':'Gambit_BBQ_Plantain_Chips_Packaging.png','churro':'Gambit_Churro_Plantain_Chips.png'}
W,H=800,1280; S=2  # supersample
def rr_mask(w,h,r_top,r_bot):
    m=Image.new('L',(w*S,h*S),0); d=ImageDraw.Draw(m)
    d.rounded_rectangle((0,0,w*S-1,h*S-1),radius=r_bot*S,fill=255)
    d.rectangle((0,0,w*S-1,r_bot*S*2),fill=0); d.rounded_rectangle((0,0,w*S-1,(r_bot*2+40)*S),radius=r_top*S,fill=255)
    return m.resize((w,h),Image.LANCZOS)
rng=np.random.default_rng(7)
def pouch():
    x=np.linspace(0,1,W)[None,:]; y=np.linspace(0,1,H)[:,None]
    base=np.full((H,W),20.0)
    # broad soft sheen left of center + darker pillowed edges
    sheen=np.exp(-((x-.33)/.20)**2)*16 + np.exp(-((x-.80)/.08)**2)*6
    edge=-(np.clip(1-np.minimum(x,1-x)/.09,0,1)**2)*12
    vert=-(np.clip((y-.86)/.14,0,1)**2)*8 + (np.clip(1-(y-.06)/.06,0,1))*0
    L=base+sheen*(0.6+0.4*(1-y))+edge+vert
    # top seal band with crimp lines
    seal=(np.arange(H)<120)[:,None]*np.ones((1,W))
    crimp=((np.arange(H)%5)<2)[:,None]*np.ones((1,W))*(np.arange(H)[:,None]>18)*(np.arange(H)[:,None]<96)
    L=L+seal*7+crimp*seal*7; L[118:121,:]-=7; L[121:123,:]+=6
    # side seals
    side=((x<.022)|(x>.978))*np.ones((H,1)); L=L+side*4
    # zipper ridge
    for yy,dv in [(156,14),(157,12),(158,9),(160,-8),(161,-10),(162,-8)]: L[yy,:]+=dv
    L=L+rng.normal(0,1.6,(H,W))
    L=cv2.GaussianBlur(L,(0,0),.6)
    rgb=np.dstack([L*1.0,L*0.97,L*0.95])
    return np.clip(rgb,0,255)
for f,fn in LAB.items():
    body=pouch()
    img=Image.fromarray(body.astype(np.uint8)).convert('RGBA')
    m=rr_mask(W,H,10,30)
    # tear notches
    d=ImageDraw.Draw(m); 
    for xx in (0,W-1):
        s=1 if xx==0 else -1; d.polygon([(xx,64),(xx+s*14,72),(xx,80)],fill=0)
    img.putalpha(m)
    # label
    lab=Image.open(U+fn).convert('RGB'); lw=int(W*.84); lh=int(lw*1.5); lab=lab.resize((lw,lh),Image.LANCZOS)
    la=np.asarray(lab).astype(np.float32)
    xx=np.linspace(0,1,lw)[None,:]; yy=np.linspace(0,1,lh)[:,None]
    shade=1+0.05*np.exp(-((xx-.32)/.25)**2)-0.07*np.clip(1-np.minimum(xx,1-xx)/.08,0,1)**2-0.05*np.clip((yy-.85)/.15,0,1)
    gloss=np.clip(1-np.abs((xx*0.6+yy*0.4)-0.32)/0.08,0,1)*10*(1-yy)
    la=np.clip(la*shade[...,None]+gloss[...,None],0,255)
    lab=Image.fromarray(la.astype(np.uint8)).convert('RGBA')
    lm=Image.new('L',(lw*S,lh*S),0); ImageDraw.Draw(lm).rounded_rectangle((0,0,lw*S-1,lh*S-1),radius=20*S,fill=255); lm=lm.resize((lw,lh),Image.LANCZOS)
    lab.putalpha(lm)
    lx=(W-lw)//2; ly=H-lh-58
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); shm=Image.new('L',(W,H),0); shm.paste(lm,(lx,ly+3)); shm=shm.filter(ImageFilter.GaussianBlur(5))
    sh.putalpha(shm.point(lambda v:int(v*.75)))
    out=Image.alpha_composite(img,sh); out.alpha_composite(lab,(lx,ly))
    a=np.asarray(out).copy(); a[...,3]=np.minimum(a[...,3],np.asarray(m)); out=Image.fromarray(a)
    out.save(f'out13/bag-{f}.webp','WEBP',quality=90,method=6)
# preview: bags on cream next to the bowls
bg=Image.new('RGB',(1500,700),(246,240,230))
for i,f in enumerate(['salt','bbq','churro']):
    b=Image.open(f'out13/bag-{f}.webp'); b=b.resize((250,400),Image.LANCZOS)
    sh=Image.new('RGBA',(330,90),(0,0,0,0)); ImageDraw.Draw(sh).ellipse((20,20,310,70),fill=(34,19,11,110)); sh=sh.filter(ImageFilter.GaussianBlur(14))
    x=40+i*490; bg.paste(sh,(x-30,560),sh); bg.paste(b,(x+0,190),b)
    d=Image.open(f'out12/disc-{f}.webp').resize((330,330),Image.LANCZOS); bg.paste(d,(x+130,300),d)
bg.save('pack_check.jpg',quality=90)
