/**
 * onit — render/viewport.js
 * Canvas, DPR, güvenli alan ve kamera (dünya ↔ ekran).
 *
 * Kamera, açık tile'ların sınır kutusunu ekrandaki "serbest alana" sığdırır.
 * Oyunda serbest alan üst bar ile ekip kartları arasıdır; ana menüde ise
 * menü panelleri dışında kalan bölgedir (bkz. ui/menu.js → menuFreeArea).
 */
import { $, lerp } from '../core/utils.js';
import { g, now } from '../game/state.js';
import { menuFreeArea } from '../ui/menu.js';
import { tiles } from '../world/map.js';

/** x,y,s: dünya merkezi + ölçek · cx,cy: ekrandaki merkez (px) · t*: hedefler */
export const cam={x:5.5,y:11,s:40,tx:5.5,ty:11,ts:40,cx:0,tcx:0,cy:0,tcy:0};
export let DPR=1,VW=0,VH=0;
const INSET={t:92,b:86};

function readSafe(){const s=getComputedStyle($('#safe'));return{t:parseFloat(s.paddingTop)||0,b:parseFloat(s.paddingBottom)||0};}
export const scy=()=>cam.cy;

export function camTarget(){
  if(!g)return;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const t of tiles)if(t.unlocked){x0=Math.min(x0,t.x);y0=Math.min(y0,t.y);x1=Math.max(x1,t.x+1);y1=Math.max(y1,t.y+1);}
  if(x0>x1)return;
  y1=Math.max(y1,14.7);
  const m=.5;x0-=m;y0-=m;x1+=m;y1+=m;
  let left=10,right=VW-10,top=INSET.t,bottom=VH-INSET.b,zoom=1;
  if(g.mode==='menu'){
    const f=menuFreeArea(VW,VH);
    if(f){({left,right,top,bottom}=f);zoom=f.zoom||1;}
  }
  cam.tcx=(left+right)/2;cam.tcy=(top+bottom)/2;
  const aw=Math.max(40,right-left),ah=Math.max(40,bottom-top);
  cam.ts=Math.min(aw/(x1-x0),ah/(y1-y0),88)*zoom;
  cam.tx=(x0+x1)/2;cam.ty=(y0+y1)/2;
  /* menüde sinematik, çok yavaş bir kayma */
  if(g.mode==='menu'){cam.tx+=Math.sin(now*.11)*.35;cam.ty+=Math.sin(now*.07+1)*.25;}
}
export function camSnap(){camTarget();cam.x=cam.tx;cam.y=cam.ty;cam.s=cam.ts;cam.cx=cam.tcx;cam.cy=cam.tcy;}
export function updateCam(dt){
  const k=1-Math.exp(-dt*2.4);
  cam.cx+=(cam.tcx-cam.cx)*k;cam.cy+=(cam.tcy-cam.cy)*k;
  cam.x+=(cam.tx-cam.x)*k;cam.y+=(cam.ty-cam.y)*k;
  cam.s=Math.exp(lerp(Math.log(cam.s),Math.log(cam.ts),k));
}
export const toWorld=(sx,sy)=>({x:(sx-cam.cx)/cam.s+cam.x,y:(sy-scy())/cam.s+cam.y});
export const toScreen=(wx,wy)=>({x:(wx-cam.x)*cam.s+cam.cx,y:(wy-cam.y)*cam.s+scy()});

/* ---------- canvas ---------- */
export const cv=$('#c'),ctx=cv.getContext('2d');
export function resize(){
  DPR=Math.min(window.devicePixelRatio||1,2);VW=window.innerWidth;VH=window.innerHeight;
  cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR);
  const sa=readSafe();
  if(VH<=500&&VW>VH){INSET.t=sa.t+66;INSET.b=sa.b+64;}
  else{INSET.t=sa.t+(VW<=380?84:92);INSET.b=sa.b+(VW>=700?92:86);}
  if(!cam.cy){cam.cy=cam.tcy=INSET.t+(VH-INSET.t-INSET.b)/2;cam.cx=cam.tcx=VW/2;}
}
