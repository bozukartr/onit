/**
 * onit — render/renderer.js
 * Kare çizimi: dünya katmanları + ekran uzayı (yazılar, jetonlar).
 */
import { AU } from '../audio/audio.js';
import { FONT, TEAMS } from '../core/config.js';
import { PI, TAU, clamp, eBack, eInOut, eOut, mixc, rgba } from '../core/utils.js';
import { queueRooms } from '../game/staff.js';
import { fx, g, now } from '../game/state.js';
import { drawDecor, drawDrag, drawFx, drawGlows, drawGuests, drawGuide, drawStaff } from './actors.js';
import { puff } from './effects.js';
import { PD, RED, pal } from './palette.js';
import { drawMarkers, drawRoutes } from './routes.js';
import { rrect } from './shapes.js';
import { drawDept, drawRoom } from './tiles.js';
import { DPR, VH, VW, cam, ctx, cv, scy, toScreen } from './viewport.js';
import { bumpScore, el } from '../ui/hud.js';
import { at, edges, tiles } from '../world/map.js';

export function render(rdt){
  const W=cv.width,H=cv.height;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle=rgba(pal.bg);ctx.fillRect(0,0,W,H);
  if(!g)return;
  const shx=g.shake>0?(Math.sin(now*61)*5+Math.sin(now*37)*3)*g.shake:0,shy=g.shake>0?Math.cos(now*53)*4*g.shake:0;
  const S=cam.s*DPR,OX=(cam.cx-cam.x*cam.s+shx)*DPR,OY=(scy()-cam.y*cam.s+shy)*DPR;
  ctx.setTransform(S,0,0,S,OX,OY);
  const px=1/cam.s;
  /* nokta ızgara */
  const x0=Math.floor(-OX/S),x1=Math.ceil((W-OX)/S),y0=Math.floor(-OY/S),y1=Math.ceil((H-OY)/S),dr=1.05*px;
  ctx.fillStyle=rgba(pal.dot,.6-.25*pal.night);ctx.beginPath();
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)ctx.rect(x-dr,y-dr,dr*2,dr*2);
  ctx.fill();
  /* gelecekteki odalar */
  ctx.strokeStyle=rgba(pal.rs,.45);ctx.lineWidth=1.1*px;ctx.setLineDash([3*px,3*px]);ctx.beginPath();
  for(const t of tiles)if(!t.unlocked&&t.type==='room')rrect(ctx,t.x+.13,t.y+.13,.74,.74,.15);
  ctx.stroke();ctx.setLineDash([]);
  drawDecor();
  drawGlows();
  /* lobi */
  const lb=at(5,12);
  if(lb.unlocked){const p=clamp((now-lb.appear)/.6,0,1);if(p>0){const s=eBack(p);ctx.save();ctx.translate(5.5,13);ctx.scale(s,s);
    ctx.beginPath();rrect(ctx,-1.4,-.86,2.84,1.84,.36);ctx.fillStyle=rgba(pal.shadow,.15);ctx.fill();
    ctx.beginPath();rrect(ctx,-1.42,-.92,2.84,1.84,.36);ctx.fillStyle=rgba(pal.lobby);ctx.fill();
    ctx.beginPath();rrect(ctx,-1.2,-.7,2.4,1.4,.24);ctx.lineWidth=.025;ctx.strokeStyle=rgba(pal.ink,.08);ctx.stroke();
    ctx.strokeStyle=rgba(pal.lane);ctx.lineWidth=.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,.45);ctx.lineTo(0,1.62);ctx.stroke();
    /* resepsiyon masası */
    ctx.beginPath();rrect(ctx,-1.18,-.75,.62,.2,.08);ctx.fillStyle=rgba(mixc(pal.lobby,pal.ink,.25));ctx.fill();
    ctx.beginPath();rrect(ctx,-1.18,-.8,.62,.17,.07);ctx.fillStyle=rgba(mixc(pal.lobby,pal.room,.5));ctx.fill();
    /* bitkiler */
    for(const[px2,py2]of[[1.18,-.68],[1.18,.68],[-1.18,.68]]){ctx.beginPath();ctx.arc(px2,py2+.03,.13,0,TAU);ctx.fillStyle=rgba(pal.lip);ctx.fill();ctx.beginPath();ctx.arc(px2,py2,.11,0,TAU);ctx.fillStyle=rgba(pal.tree);ctx.fill();}
    /* döner kapı */
    ctx.save();ctx.translate(0,1.05);
    ctx.beginPath();ctx.arc(0,0,.2,0,TAU);ctx.fillStyle=rgba(mixc(pal.lane,pal.room,.4));ctx.fill();
    ctx.lineWidth=.04;ctx.lineCap='round';ctx.strokeStyle=rgba(pal.ink,.28);
    ctx.beginPath();ctx.arc(0,0,.2,-PI*.8,-PI*.2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,.2,PI*.2,PI*.8);ctx.stroke();
    ctx.rotate(now*.9);ctx.lineWidth=.03;ctx.strokeStyle=rgba(pal.ink,.22);
    ctx.beginPath();for(let i=0;i<3;i++){const a=i*TAU/3;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*.17,Math.sin(a)*.17);}ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,.03,0,TAU);ctx.fillStyle=rgba(pal.ink,.3);ctx.fill();ctx.restore();
    ctx.restore();}}
  /* koridor şeritleri */
  const lane=rgba(pal.lane);
  ctx.strokeStyle=lane;ctx.lineWidth=.6;ctx.lineCap='round';ctx.beginPath();
  for(const e of edges){
    const t0=e.a.appear,t1=Math.max(e.b.appear,e.a.appear+.04)+.12;
    const p=eInOut(clamp((now-t0)/(t1-t0),0,1));if(p<=0)continue;
    const ax=e.a.x+.5,ay=e.a.y+.5;ctx.moveTo(ax,ay);ctx.lineTo(ax+(e.b.x-e.a.x)*p,ay+(e.b.y-e.a.y)*p);
  }
  ctx.stroke();
  ctx.fillStyle=lane;
  for(const t of tiles){if(!t.unlocked||t.type!=='corr')continue;const p=clamp((now-t.appear)/.35,0,1);if(p<=0)continue;ctx.beginPath();ctx.arc(t.x+.5,t.y+.5,.3*eBack(p),0,TAU);ctx.fill();}
  ctx.lineWidth=.24;ctx.lineCap='butt';ctx.beginPath();
  for(const t of tiles){if(!t.unlocked||!t.door||(t.type!=='room'&&t.type!=='dept'))continue;const p=eOut(clamp((now-t.appear)/.3,0,1));if(p<=0)continue;
    const sx=t.door.x+.5,sy=t.door.y+.5;ctx.moveTo(sx,sy);ctx.lineTo(sx+(t.x-t.door.x)*.62*p,sy+(t.y-t.door.y)*.62*p);}
  ctx.stroke();
  drawGuests();
  drawGuide();
  drawRoutes();
  /* oda + departman */
  for(const t of tiles){
    if(!t.unlocked||(t.type!=='room'&&t.type!=='dept'))continue;
    const p=clamp((now-t.appear)/.55,0,1);if(p<=0)continue;
    if(!t.puffed){t.puffed=true;if(g.mode==='play')puff(t.x+.5,t.y+.5);}
    let s=eBack(p);
    let urg=0;for(const q of t.requests)if(!q.serving)urg=Math.max(urg,q.t/q.patience);
    if(urg>.72)s*=1+.04*Math.sin(now*11)*((urg-.72)/.28);
    const sh=t.shake>0?Math.sin(now*62)*.08*t.shake:0;
    ctx.save();ctx.translate(t.x+.5+sh,t.y+.5);ctx.scale(s,s);
    if(t.type==='room')drawRoom(t);else drawDept(t);
    ctx.restore();
  }
  drawMarkers();
  drawDrag();
  drawStaff();
  drawFx(rdt);
  /* ekran uzayı */
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const vg=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.32,VW/2,VH/2,Math.max(VW,VH)*.78);
  const ec=mixc(pal.shadow,RED,g.redFlash*.7),ea=.1+pal.night*.3+g.redFlash*.22;
  vg.addColorStop(0,rgba(ec,0));vg.addColorStop(1,rgba(ec,ea));ctx.fillStyle=vg;ctx.fillRect(0,0,VW,VH);
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(lb.unlocked&&now>lb.appear+.4){
    const e=toScreen(5.5,14.85);ctx.font=`700 ${Math.max(8,Math.min(11,cam.s*.17))}px ${FONT}`;
    ctx.fillStyle=rgba(pal.muted,.85);ctx.fillText('G İ R İ Ş',e.x,e.y);
    const l=toScreen(5.5,13.1);ctx.fillStyle=rgba(pal.ink,.2);ctx.font=`800 ${Math.max(8,Math.min(12,cam.s*.18))}px ${FONT}`;ctx.fillText('L O B İ',l.x,l.y);
  }
  if(cam.s>=50){
    ctx.font=`700 ${Math.round(cam.s*.13)}px ${FONT}`;ctx.fillStyle=rgba(pal.muted,.6);ctx.textAlign='left';
    for(const r of g.rooms){if(!r.unlocked||r.requests.length||now<r.appear+.5)continue;const p=toScreen(r.x+.17,r.y+.24);ctx.fillText(r.num,p.x,p.y);}
    ctx.textAlign='center';
  }
  /* durak sıra numaraları */
  const actor=g.drag?g.drag.staff:g.sel;
  if(actor){
    const tc=TEAMS[actor.team],list=queueRooms(actor).map(r=>[r,.85]);
    if(g.drag)for(const r of g.drag.stops)list.push([r,1]);
    list.forEach(([r,a],i)=>{const p=toScreen(r.x+.86,r.y+.14),rad=Math.max(8,cam.s*.15);
      ctx.globalAlpha=a;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,TAU);ctx.fillStyle=tc.color;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
      ctx.fillStyle='#fff';ctx.font=`800 ${Math.round(rad*1.15)}px ${FONT}`;ctx.fillText(i+1,p.x,p.y+.5);ctx.globalAlpha=1;});
  }
  /* personel üstünde sıra sayısı */
  for(const st of g.staff){const n=queueRooms(st).length;if(n<2||st===actor)continue;const p=toScreen(st.x+.17,st.y-.17),rad=Math.max(6.5,cam.s*.09);
    ctx.beginPath();ctx.arc(p.x,p.y,rad,0,TAU);ctx.fillStyle=rgba(PD.ink);ctx.fill();ctx.fillStyle='#fff';ctx.font=`800 ${Math.round(rad*1.2)}px ${FONT}`;ctx.fillText(n,p.x,p.y+.5);}
  /* uçan metinler */
  fx.floats=fx.floats.filter(f=>now-f.t0<f.dur);
  for(const f of fx.floats){
    const t=(now-f.t0)/f.dur,p=toScreen(f.x,f.y);
    const rise=eOut(t)*(f.kind==='bubble'?14:f.kind==='combo'?34:26),a=t<.7?1:1-(t-.7)/.3;
    ctx.globalAlpha=clamp(a,0,1);
    if(f.kind==='bubble'){const sc=eBack(clamp(t*3,0,1));ctx.beginPath();ctx.arc(p.x,p.y-rise-8,10*sc,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=rgba(PD.ink,.25);ctx.stroke();ctx.fillStyle='#26282E';ctx.font=`800 ${13*sc}px ${FONT}`;ctx.fillText(f.text,p.x,p.y-rise-7.5);}
    else{
      const sc=f.kind==='combo'?eBack(clamp(t*2.5,0,1)):1;
      ctx.save();ctx.translate(p.x,p.y-rise);ctx.scale(sc,sc);if(f.kind==='combo')ctx.rotate(-.06);
      ctx.font=`800 ${f.size}px ${FONT}`;ctx.lineWidth=f.kind==='combo'?5:3.5;ctx.lineJoin='round';ctx.strokeStyle=f.kind==='combo'?'#fff':rgba(pal.bg,.9);ctx.strokeText(f.text,0,0);ctx.fillStyle=f.color;ctx.fillText(f.text,0,0);ctx.restore();
    }
    ctx.globalAlpha=1;
  }
  /* skora uçan jetonlar */
  if(fx.coins.length){
    const rc=el.score.getBoundingClientRect(),txp=rc.left+rc.width*.5,typ=rc.top+rc.height*.55;
    fx.coins=fx.coins.filter(c=>{
      const t=(now-c.t0)/c.dur;
      if(t>=1){g.shown+=c.pts;bumpScore();AU.coin();return false;}
      for(let k=4;k>=0;k--){
        const tt=eInOut(clamp(t-k*.035,0,1)),cx2=c.x0+(txp-c.x0)*.15,cy2=Math.min(c.y0,typ)-90;
        const x=(1-tt)*(1-tt)*c.x0+2*(1-tt)*tt*cx2+tt*tt*txp,y=(1-tt)*(1-tt)*c.y0+2*(1-tt)*tt*cy2+tt*tt*typ;
        const r=(k?4.5-k*.6:7)*(1-.35*tt);
        ctx.globalAlpha=k?.35-k*.06:1;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=rgba(c.col);ctx.fill();
        if(!k){ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();}
      }
      ctx.globalAlpha=1;return true;
    });
  }
}
