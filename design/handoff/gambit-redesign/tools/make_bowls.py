import cv2, numpy as np, json
from PIL import Image
U='/mnt/user-data/uploads/'
E=json.load(open('ellipses.json'))
src={'salt':U+'IMG_2576.JPG','bbq':U+'IMG_2582.JPG','churro':U+'about-churro-bowl.jpg'}
K={'salt':1.0,'bbq':1.03,'churro':1.012}
sat={'salt':1.0,'bbq':0.9,'churro':1.0}; warm={'salt':3,'bbq':0,'churro':1}
def grade(out,f,mask):
  lab=cv2.cvtColor(out,cv2.COLOR_BGR2LAB).astype(np.float32)
  L=lab[...,0]/255; med=np.median(L[mask]); g=np.clip(np.log(0.55)/np.log(max(med,1e-3)),.76 if f=='salt' else .8,1.3)
  L=L**g; L=np.clip((L-.5)*1.08+.5,0,1); L=0.03+L*0.97; lab[...,0]=L*255
  lab[...,1]=128+(lab[...,1]-128)*sat[f]+1; lab[...,2]=128+(lab[...,2]-128)*sat[f]+warm[f]
  out=cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8),cv2.COLOR_LAB2BGR)
  bl=cv2.GaussianBlur(out,(0,0),1.4); return cv2.addWeighted(out,1.3,bl,-.3,0)
discs=[]
for f in ['salt','bbq','churro']:
  im=cv2.imread(src[f]); e=E[f]; k=K[f]
  a,b=e['MA']*k,e['ma']*k; t=np.deg2rad(e['ang'])
  N=1200 if f!='churro' else 960
  M=np.array([[np.cos(t),-np.sin(t)],[np.sin(t),np.cos(t)]])@np.diag([a/2,b/2])
  A=M/(N/2); off=np.array([e['cx'],e['cy']])-A@np.array([N/2,N/2])
  out=cv2.warpAffine(im,np.hstack([A,off[:,None]]),(N,N),flags=cv2.WARP_INVERSE_MAP|cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REFLECT)
  yy,xx=np.mgrid[0:N,0:N]; rr=np.hypot(xx-N/2+.5,yy-N/2+.5)/(N/2)
  out=grade(out,f,rr<.8)
  alpha=np.clip((1.0-rr)*N/2/2.0,0,1)
  Image.fromarray(np.dstack([cv2.cvtColor(out,cv2.COLOR_BGR2RGB),(alpha*255).astype(np.uint8)])).save(f'out12/disc-{f}.webp','WEBP',quality=88,method=6)
  # scene (context) shot, graded with the same curve, 2000 wide
  sc=grade(im,f,(slice(None),))if False else None
  h,w=im.shape[:2]; m=np.zeros((h,w),bool); cv2.ellipse(m.view(np.uint8),((e['cx'],e['cy']),(e['MA']*.8,e['ma']*.8),e['ang']),1,-1)
  sc=grade(im,f,m.astype(bool)); W=min(2000,w); sc=cv2.resize(sc,(W,int(h*W/w)),interpolation=cv2.INTER_AREA)
  Image.fromarray(cv2.cvtColor(sc,cv2.COLOR_BGR2RGB)).save(f'out12/scene-{f}.webp','WEBP',quality=86,method=6)
  discs.append(Image.open(f'out12/disc-{f}.webp'))
bg=Image.new('RGB',(1500,520),(246,240,230))
for i,d in enumerate(discs): r=d.resize((480,480)); bg.paste(r,(10+i*500,20),r)
bg.save('discs_check.jpg',quality=85)
