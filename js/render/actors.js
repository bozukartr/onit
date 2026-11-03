/**
 * onit — render/actors.js
 * Personel, misafir, dekor, ışık ve parçacık çizimleri.
 */
import { TEAMS } from '../core/config.js';
import { PI, TAU, clamp, eBack, eInOut, eOut, lerp, mixc, rgba } from '../core/utils.js';
import { busyPlan } from '../game/staff.js';
import { fx, g, now } from '../game/state.js';
import { tileAtW } from '../input/input.js';
import { WHITE, glowSprite, pal } from './palette.js';
import { legLine, marker, strokeRange } from './routes.js';
import { rrect, shapePath } from './shapes.js';
import { lightOf } from './tiles.js';
import { ctx } from './viewport.js';
import { at, decor, interior } from '../world/map.js';
import { sampleLeg } from '../world/route.js';

export function drawStaff(){
  const order=g.staff.slice().sort((a,b)=>(a.state==='idle'?0:1)-(b.state==='idle'?0:1));
  for(const st of order){
    const p=clamp((now-st.pop)/.45,0,1);if(p<=0)continue;
    const tc=TEAMS[st.team],dragged=g.drag&&g.drag.staff===st,sel=g.sel===st,moving=st.state==='move';
    const breathe=st.state==='idle'?1+.03*Math.sin(now*2.2+st.id*1.7):1;
    const s=eBack(p)*st.sc*(dragged?1.14:sel?1.08:1)*breathe,R=.2*s;
    /* iz */
    if(moving&&st.trail.length>1){
      for(let i=0;i<st.trail.length;i++){const tp=st.trail[i],f=(i+1)/st.trail.length;ctx.beginPath();ctx.arc(tp.x,tp.y,R*(.25+.55*f),0,TAU);ctx.fillStyle=rgba(tc.rgb,.13*f);ctx.fill();}
    }
    const bob=moving?Math.abs(Math.sin(st.walk*PI*2.4))*.04:0;
    ctx.beginPath();ctx.ellipse(st.x+.02,st.y+.085,R*(1-bob*2),R*.48*(1-bob*2),0,0,TAU);ctx.fillStyle=rgba(pal.shadow,.3);ctx.fill();
    const by=st.y-bob;
    if(dragged||sel){
      ctx.beginPath();ctx.arc(st.x,by,R+.13+.03*Math.sin(now*7),0,TAU);ctx.fillStyle=rgba(tc.rgb,.18);ctx.fill();
      if(sel){ctx.save();ctx.setLineDash([.09,.07]);ctx.lineDashOffset=-now*.5;ctx.lineWidth=.035;ctx.strokeStyle=tc.color;ctx.beginPath();ctx.arc(st.x,by,R+.19,0,TAU);ctx.stroke();ctx.restore();}
    }
    ctx.save();ctx.translate(st.x,by);ctx.rotate(st.ang);ctx.scale(1+st.str,1-st.str*.55);
    ctx.beginPath();ctx.arc(0,0,R+.032*s,0,TAU);ctx.fillStyle='#fff';ctx.fill();
    ctx.beginPath();ctx.arc(0,.025*s,R,0,TAU);ctx.fillStyle=rgba(tc.dark);ctx.fill();
    ctx.beginPath();ctx.arc(0,0,R*.97,0,TAU);ctx.fillStyle=tc.color;ctx.fill();
    ctx.restore();
    ctx.beginPath();ctx.arc(st.x-R*.32,by-R*.36,R*.32,0,TAU);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fill();
    ctx.fillStyle='#fff';shapePath(ctx,tc.shape,st.x,by-.005,R*1.02);ctx.fill();
    if(st.state==='serve'&&st.serve){
      const pr=clamp(st.serve.t/st.serve.dur,0,1);
      ctx.lineCap='round';ctx.lineWidth=.045;
      ctx.beginPath();ctx.arc(st.x,by,R+.09,0,TAU);ctx.strokeStyle=rgba(tc.rgb,.2);ctx.stroke();
      ctx.beginPath();ctx.arc(st.x,by,R+.09,-PI/2,-PI/2+TAU*pr);ctx.strokeStyle=tc.color;ctx.stroke();
    }
  }
}
export function drawGuide(){
  if(!g.guideOn||!g.guide)return;
  const a=g.guideFade?clamp(1-(now-g.guideFade)/.4,0,1):1;if(a<=0){g.guideOn=false;return;}
  const tc=TEAMS.H;
  ctx.save();ctx.globalAlpha=.6*a;ctx.setLineDash([.16,.17]);ctx.lineDashOffset=-now*.9;
  ctx.strokeStyle=tc.color;ctx.lineWidth=.08;ctx.lineCap='round';ctx.beginPath();strokeRange(g.guide,0,g.guide.len);ctx.stroke();
  ctx.setLineDash([]);
  const b=at(4,11),pu=(now*1.1)%1;
  ctx.globalAlpha=(1-pu)*.55*a;ctx.lineWidth=.06;ctx.beginPath();ctx.arc(b.x+.5,b.y+.5,.45+pu*.4,0,TAU);ctx.stroke();
  ctx.restore();
}
export function drawDrag(){
  const d=g.drag;if(!d)return;
  const tc=TEAMS[d.team];ctx.lineCap='round';ctx.lineJoin='round';
  let lastPt=d.from?interior(d.from):{x:d.staff.x,y:d.staff.y};
  if(d.pv){
    for(const L of d.pv.legs)legLine(L,0,tc.color,.13,.92,false,false);
    lastPt=interior(d.stops[d.stops.length-1]);
  }
  /* imleç odaya mıknatıs gibi yapışır */
  const t=tileAtW(d.w);let tx=d.w.x,ty=d.w.y;
  if(t&&t.type==='room'&&t.unlocked){tx=lerp(d.w.x,t.x+.5,.55);ty=lerp(d.w.y,t.y+.5,.55);}
  const k=1-Math.exp(-g.rdt*22);d.mx+=(tx-d.mx)*k;d.my+=(ty-d.my)*k;
  const overBase=t===d.staff.base&&!d.stops.length&&busyPlan(d.staff)&&!d.fromBase;
  ctx.save();ctx.globalAlpha=.55;ctx.setLineDash([.12,.12]);ctx.lineDashOffset=-now*.8;
  ctx.strokeStyle=overBase?'#8F887C':tc.color;ctx.lineWidth=.07;ctx.beginPath();ctx.moveTo(lastPt.x,lastPt.y);
  const mx=(lastPt.x+d.mx)/2,my=(lastPt.y+d.my)/2-.12;ctx.quadraticCurveTo(mx,my,d.mx,d.my);ctx.stroke();ctx.restore();
  ctx.beginPath();ctx.arc(d.mx,d.my,.2+.02*Math.sin(now*9),0,TAU);ctx.lineWidth=.05;ctx.strokeStyle=rgba(tc.rgb,.6);ctx.stroke();
  ctx.beginPath();ctx.arc(d.mx,d.my,.07,0,TAU);ctx.fillStyle=tc.color;ctx.fill();
  if(overBase){const b=d.staff.base;ctx.save();ctx.translate(b.x+.5,b.y+.5);ctx.strokeStyle='#E04B3A';ctx.lineWidth=.07;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-.16,-.16);ctx.lineTo(.16,.16);ctx.moveTo(.16,-.16);ctx.lineTo(-.16,.16);ctx.stroke();ctx.restore();}
  if(d.pv)for(const L of d.pv.legs)marker(L,tc.color,true);
}
export function drawFx(rdt){
  for(const p of fx.parts){p.life-=rdt;p.vy+=(p.g||0)*rdt;p.x+=p.vx*rdt;p.y+=p.vy*rdt;p.vx*=Math.pow(.08,rdt);if(!p.g)p.vy*=Math.pow(.08,rdt);if(p.vr)p.rot+=p.vr*rdt;}
  fx.parts=fx.parts.filter(p=>p.life>0);
  for(const p of fx.parts){
    const f=clamp(p.life/p.max*1.5,0,1);ctx.fillStyle=rgba(p.col,f);
    if(p.shape&&p.shape!=='circle'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot||0);shapePath(ctx,p.shape,0,0,p.r*2.4*(.4+.6*f));ctx.fill();ctx.restore();}
    else{ctx.beginPath();ctx.arc(p.x,p.y,p.r*(.4+.6*f)+.004,0,TAU);ctx.fill();}
  }
  fx.ripples=fx.ripples.filter(r=>now-r.t0<r.dur);
  for(const r of fx.ripples){const t=(now-r.t0)/r.dur,rr=lerp(r.r0,r.r1,eOut(t));ctx.beginPath();rrect(ctx,r.x-rr,r.y-rr,rr*2,rr*2,rr*.42);ctx.lineWidth=.05*(1-t)+.01;ctx.strokeStyle=rgba(r.col,.55*(1-t));ctx.stroke();}
  fx.ghosts=fx.ghosts.filter(gh=>now-gh.t0<(gh.kind==='fail'?.9:.55));
  for(const gh of fx.ghosts){
    const t=(now-gh.t0)/(gh.kind==='fail'?.9:.55);
    let s=gh.s,a=1-t,y=gh.y;
    if(gh.kind==='done'){s*=1+eOut(t)*.9;a=1-eOut(t);}
    else if(gh.kind==='fail'){y+=eInOut(t)*.45;a=1-t*t;s*=1-t*.3;}
    else{s*=1-t*.5;a=(1-t)*.8;}
    ctx.globalAlpha=clamp(a,0,1);ctx.fillStyle=rgba(gh.col);
    shapePath(ctx,gh.shape,gh.x+(gh.kind==='fail'?Math.sin(t*30)*.04*(1-t):0),y,s);
    if(gh.kind==='done'){ctx.lineWidth=.035;ctx.strokeStyle=rgba(gh.col);ctx.stroke();}else ctx.fill();
    ctx.globalAlpha=1;
  }
}
export function drawGuests(){
  for(const gu of g.guests){
    const L=gu.L,p=sampleLeg(L,gu.s),a=clamp(Math.min(gu.s/.35,(L.len-gu.s)/.35),0,1);
    const bob=Math.abs(Math.sin(gu.s*9+gu.ph))*.025;
    ctx.globalAlpha=.85*a;
    ctx.beginPath();ctx.ellipse(p.x,p.y+.06,.06,.03,0,0,TAU);ctx.fillStyle=rgba(pal.shadow,.3);ctx.fill();
    if(gu.bag){ctx.fillStyle=rgba(mixc(gu.col,[60,50,40],.35));ctx.beginPath();rrect(ctx,p.x+.05,p.y-.02-bob,.07,.08,.015);ctx.fill();}
    ctx.beginPath();ctx.arc(p.x,p.y-bob,.068,0,TAU);ctx.fillStyle=rgba(mixc(gu.col,pal.bg,pal.night*.4));ctx.fill();
  }
  ctx.globalAlpha=1;
}
export function drawDecor(){
  for(const d of decor){
    const p=clamp((now-d.appear)/.6,0,1);if(p<=0)continue;
    const s=eBack(p);
    ctx.save();ctx.translate(d.x,d.y);ctx.scale(s,s);
    if(d.k==='tree'||d.k==='bush'){
      const r=d.r,sw=1+.03*Math.sin(now*1.3+d.ph);
      ctx.beginPath();ctx.ellipse(.04,r*.75,r*.95,r*.42,0,0,TAU);ctx.fillStyle=rgba(pal.shadow,.18);ctx.fill();
      ctx.scale(sw,1/sw);
      ctx.beginPath();ctx.arc(0,r*.12,r,0,TAU);ctx.fillStyle=rgba(pal.tree2);ctx.fill();
      ctx.beginPath();ctx.arc(-r*.08,0,r*.9,0,TAU);ctx.fillStyle=rgba(pal.tree);ctx.fill();
      ctx.beginPath();ctx.arc(-r*.32,-r*.3,r*.34,0,TAU);ctx.fillStyle=rgba(mixc(pal.tree,WHITE,.25*(1-pal.night)));ctx.fill();
    }else if(d.k==='planter'){
      ctx.beginPath();ctx.arc(0,.05,.17,0,TAU);ctx.fillStyle=rgba(pal.lip);ctx.fill();
      ctx.beginPath();ctx.arc(0,0,.15,0,TAU);ctx.fillStyle=rgba(pal.tree);ctx.fill();
      ctx.beginPath();ctx.arc(-.05,-.05,.06,0,TAU);ctx.fillStyle=rgba(mixc(pal.tree,WHITE,.25*(1-pal.night)));ctx.fill();
    }else if(d.k==='pool'){
      const w=d.w,h=d.h;
      ctx.beginPath();rrect(ctx,-.05,-.05,w+.1,h+.1,.3);ctx.fillStyle=rgba(pal.lip);ctx.fill();
      ctx.beginPath();rrect(ctx,0,0,w,h,.26);ctx.fillStyle=rgba(pal.pool);ctx.fill();
      ctx.save();ctx.beginPath();rrect(ctx,0,0,w,h,.26);ctx.clip();
      ctx.strokeStyle=rgba(WHITE,.45-.25*pal.night);ctx.lineWidth=.035;ctx.lineCap='round';
      for(let i=0;i<5;i++){const yy=.2+i*.22,xo=(Math.sin(now*.9+i*1.7)*.25+(i%2)*.4);ctx.beginPath();ctx.moveTo(.25+xo,yy);ctx.quadraticCurveTo(.4+xo,yy-.05,.55+xo,yy);ctx.stroke();}
      if(pal.light>.2){ctx.globalAlpha=pal.light*.5;ctx.drawImage(glowSprite,w*.15,h*.05,w*.7,h*.9);ctx.globalAlpha=1;}
      ctx.restore();
      ctx.strokeStyle=rgba(pal.rs);ctx.lineWidth=.03;ctx.beginPath();ctx.moveTo(w-.25,-.04);ctx.lineTo(w-.25,.18);ctx.moveTo(w-.15,-.04);ctx.lineTo(w-.15,.18);ctx.stroke();
    }else if(d.k==='lounger'){
      ctx.beginPath();rrect(ctx,-.17,-.07,.34,.15,.05);ctx.fillStyle=rgba(pal.lip);ctx.fill();
      ctx.beginPath();rrect(ctx,-.17,-.09,.34,.15,.05);ctx.fillStyle=rgba(mixc(pal.room,[240,160,120],.25));ctx.fill();
      ctx.beginPath();rrect(ctx,-.17,-.09,.1,.15,.04);ctx.fillStyle=rgba(mixc(pal.room,[240,160,120],.45));ctx.fill();
    }
    ctx.restore();
  }
}
export function drawGlows(){
  if(pal.light<.03)return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const t of g.rooms){if(!t.unlocked||now<t.appear)continue;const lo=lightOf(t);if(lo<=0)continue;ctx.globalAlpha=lo*.32*(.92+.08*Math.sin(now*3+t.id));ctx.drawImage(glowSprite,t.x+.5-1.05,t.y+.5-1.05,2.1,2.1);}
  const lb=at(5,12);if(lb.unlocked){ctx.globalAlpha=pal.light*.4;ctx.drawImage(glowSprite,5.5-2,13-1.6,4,3.2);}
  ctx.restore();
}
