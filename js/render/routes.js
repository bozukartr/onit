/**
 * onit — render/routes.js
 * Rota çizgileri ve durak işaretleri.
 */
import { TEAMS } from '../core/config.js';
import { TAU, clamp, eOut, lerp, mixc, rgba } from '../core/utils.js';
import { busyPlan } from '../game/staff.js';
import { g, now } from '../game/state.js';
import { ORANGE, RED, pal } from './palette.js';
import { ctx } from './viewport.js';
import { sampleLeg } from '../world/route.js';

export function ringColor(p){
  if(p<.5)return rgba(pal.muted,.8);
  if(p<.8)return rgba(mixc(pal.muted,ORANGE,(p-.5)/.3));
  return rgba(mixc(ORANGE,RED,clamp((p-.8)/.15,0,1)));
}
export function strokeRange(L,s0,s1){
  if(!L||s1<=s0)return;
  const p=sampleLeg(L,s0);ctx.moveTo(p.x,p.y);
  let lo=0,hi=L.cum.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(L.cum[m]<=s0)lo=m;else hi=m;}
  for(let i=hi;i<L.o.length&&L.cum[i]<s1;i++)ctx.lineTo(L.o[i].x,L.o[i].y);
  const q=sampleLeg(L,s1);ctx.lineTo(q.x,q.y);
}
export function legLine(L,s,col,w,a,flow,anim){
  if(!L)return;
  let s1=L.len;
  if(anim){const p=eOut(clamp((now-L.born)/.42,0,1));s1=lerp(s,L.len,p);}
  if(s1<=s)return;
  ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();strokeRange(L,s,s1);ctx.stroke();
  if(flow){ctx.globalAlpha=a*.55;ctx.strokeStyle='#fff';ctx.lineWidth=w*.34;ctx.setLineDash([.04,.22]);ctx.lineDashOffset=-now*1.1;ctx.beginPath();strokeRange(L,s,s1);ctx.stroke();ctx.setLineDash([]);}
  ctx.globalAlpha=1;
}
export function marker(L,col,big){if(!L)return;const p=L.o[L.o.length-1];ctx.beginPath();ctx.arc(p.x,p.y,big?.12:.095,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=.045;ctx.strokeStyle=col;ctx.stroke();}

export function drawRoutes(){
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const st of g.staff){
    const col=TEAMS[st.team].color,mk=[];
    const focus=(g.sel===st)||(g.drag&&g.drag.staff===st);
    const W=focus?.15:.12;
    if(focus){/* seçili personelin rotasına hafif hale */
      ctx.globalAlpha=.16;ctx.strokeStyle=col;ctx.lineWidth=.36;ctx.beginPath();
      if(st.state==='move'&&st.leg&&st.leg.kind==='stop')strokeRange(st.leg,st.leg.s,st.leg.len);
      const P=busyPlan(st);if(P){if(P===st.nextPlan&&P.lead)strokeRange(P.lead,0,P.lead.len);for(let k=(P===st.nextPlan?0:P.idx);k<P.legs.length;k++)if(P.legs[k])strokeRange(P.legs[k],0,P.legs[k].len);}
      ctx.stroke();ctx.globalAlpha=1;
    }
    if(st.state==='move'&&st.leg){
      const home=st.leg.kind==='base';
      legLine(st.leg,st.leg.s,col,home?.07:W,home?.3:1,!home,true);
      if(!home)mk.push(st.leg);
    }
    if(st.nextPlan){
      const P=st.nextPlan;
      if(P.lead){legLine(P.lead,0,col,W,.9,true,true);mk.push(P.lead);}
      for(const L of P.legs){legLine(L,0,col,W,.9,true,true);mk.push(L);}
      legLine(P.home,0,col,.07,.28,false,true);
    }else if(st.plan){
      const P=st.plan;
      for(let k=P.idx;k<P.legs.length;k++){legLine(P.legs[k],0,col,W,1,true,true);mk.push(P.legs[k]);}
      legLine(P.home,0,col,.07,.28,false,true);
    }
    st._mk=mk;
  }
}
export function drawMarkers(){for(const st of g.staff)if(st._mk){const big=g.sel===st;for(const L of st._mk)marker(L,TEAMS[st.team].color,big);}}
