/**
 * onit — world/route.js
 * Yumuşak rota geometrisi: köşe yuvarlama, şerit ofseti, örnekleme.
 */
import { PI, clamp } from '../core/utils.js';
import { now } from '../game/state.js';
import { center, findPath } from './map.js';

function smoothPts(p,R){
  const n=p.length;if(n<3)return p.slice();
  const out=[p[0]];
  for(let i=1;i<n-1;i++){
    const a=p[i-1],b=p[i],c=p[i+1];
    let ux=b.x-a.x,uy=b.y-a.y;const l1=Math.hypot(ux,uy);ux/=l1;uy/=l1;
    let vx=c.x-b.x,vy=c.y-b.y;const l2=Math.hypot(vx,vy);vx/=l2;vy/=l2;
    const dot=clamp(ux*vx+uy*vy,-1,1);
    if(dot>.9999){out.push(b);continue;}
    const th=Math.acos(dot);
    let d=R*Math.tan(Math.min(th,3.0)/2);
    const m1=i===1?l1:l1/2,m2=i===n-2?l2:l2/2;
    d=Math.min(d,m1*.999,m2*.999);
    const s0={x:b.x-ux*d,y:b.y-uy*d},s1={x:b.x+vx*d,y:b.y+vy*d};
    const steps=Math.max(5,Math.ceil(th/(PI/16)));
    for(let k=0;k<=steps;k++){const t=k/steps,it=1-t;out.push({x:it*it*s0.x+2*it*t*b.x+t*t*s1.x,y:it*it*s0.y+2*it*t*b.y+t*t*s1.y});}
  }
  out.push(p[n-1]);
  const q=[out[0]];for(let i=1;i<out.length;i++){const l=q[q.length-1];if(Math.hypot(out[i].x-l.x,out[i].y-l.y)>1e-4)q.push(out[i]);}
  if(q.length<2)q.push({x:q[0].x+1e-3,y:q[0].y});
  return q;
}
function offsetPts(p,off){
  if(Math.abs(off)<1e-6)return p.map(o=>({x:o.x,y:o.y}));
  const n=p.length,out=new Array(n);
  for(let i=0;i<n;i++){const a=p[Math.max(0,i-1)],b=p[Math.min(n-1,i+1)];let tx=b.x-a.x,ty=b.y-a.y;const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;out[i]={x:p[i].x-ty*off,y:p[i].y+tx*off};}
  return out;
}
export function buildLeg(pt,tile,goal,endPt,lane){
  const tp=findPath(tile,goal);if(!tp)return null;
  const cs=tp.map(center);
  if(cs.length>=2){const a=cs[0],b=cs[1];if((b.x-a.x)*(pt.x-a.x)+(b.y-a.y)*(pt.y-a.y)>1e-4)cs.shift();}
  const pts=[{x:pt.x,y:pt.y},...cs];if(endPt)pts.push({x:endPt.x,y:endPt.y});
  const q=[pts[0]];for(let i=1;i<pts.length;i++){const p=pts[i],l=q[q.length-1];if(Math.hypot(p.x-l.x,p.y-l.y)>1e-3)q.push(p);}
  if(q.length<2)q.push({x:q[0].x+1e-3,y:q[0].y});
  const c=smoothPts(q,.42),o=offsetPts(c,lane),cum=[0];
  for(let i=1;i<o.length;i++)cum.push(cum[i-1]+Math.hypot(o[i].x-o[i-1].x,o[i].y-o[i-1].y));
  return{c,o,cum,len:cum[cum.length-1],s:0,born:now};
}
export function sampleLeg(L,s){
  const cum=L.cum,o=L.o,c=L.c,n=cum.length;
  if(s<=0)return{x:o[0].x,y:o[0].y,cx:c[0].x,cy:c[0].y};
  if(s>=L.len)return{x:o[n-1].x,y:o[n-1].y,cx:c[n-1].x,cy:c[n-1].y};
  let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=s)lo=m;else hi=m;}
  const f=(s-cum[lo])/((cum[hi]-cum[lo])||1);
  return{x:o[lo].x+(o[hi].x-o[lo].x)*f,y:o[lo].y+(o[hi].y-o[lo].y)*f,cx:c[lo].x+(c[hi].x-c[lo].x)*f,cy:c[lo].y+(c[hi].y-c[lo].y)*f};
}
