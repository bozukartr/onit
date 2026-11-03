/**
 * onit — render/tiles.js
 * Oda ve departman tile çizimleri.
 */
import { DWELL, TEAMS } from '../core/config.js';
import { PI, TAU, clamp, eBack, mixc, rgba } from '../core/utils.js';
import { queueRooms } from '../game/staff.js';
import { g, matches, now } from '../game/state.js';
import { GOLD, RED, WARM, pal } from './palette.js';
import { ringColor } from './routes.js';
import { rrRing, rrect, shapePath } from './shapes.js';
import { ctx } from './viewport.js';

export function lightOf(t){return t.lit?clamp((pal.light-t.lightAt)/.14,0,1):0;}
export function drawRoom(t){
  const reqs=t.requests,has=reqs.length>0,d=g.drag,actor=d?d.staff:g.sel;
  let urg=0;for(const q of reqs)if(!q.serving)urg=Math.max(urg,q.t/q.patience);
  const lo=lightOf(t);
  const bt=(now-t.bumpT)/.34,press=bt>=0&&bt<1?Math.sin(bt*PI)*.055:0;
  if(actor&&reqs.some(q=>matches(actor,q)&&(!q.assigned||q.assigned===actor))){
    ctx.beginPath();rrect(ctx,-.58,-.56,1.16,1.2,.3);ctx.fillStyle=rgba(TEAMS[actor.team].rgb,.15+.08*Math.sin(now*6));ctx.fill();
  }
  /* gölge + kabartma */
  ctx.beginPath();rrect(ctx,-.38,-.29,.8,.8,.19);ctx.fillStyle=rgba(pal.shadow,.2);ctx.fill();
  ctx.beginPath();rrect(ctx,-.4,-.325,.8,.8,.17);ctx.fillStyle=rgba(t.vip?mixc(pal.lip,GOLD,.4):pal.lip);ctx.fill();
  ctx.save();ctx.translate(0,press);
  ctx.beginPath();rrect(ctx,-.4,-.4,.8,.8,.17);ctx.fillStyle=rgba(lo>0?mixc(pal.room,WARM,lo*.3):pal.room);ctx.fill();
  if(lo>.01){ctx.beginPath();rrect(ctx,-.29,-.29,.58,.58,.11);ctx.fillStyle=rgba(WARM,.78*lo);ctx.fill();}
  if(!has&&lo<.6){
    const a=(1-lo/.6)*.9,bc=mixc(pal.room,pal.rs,.75);
    ctx.globalAlpha=a;ctx.fillStyle=rgba(bc);
    ctx.beginPath();rrect(ctx,-.15,-.13,.3,.27,.06);ctx.fill();
    ctx.fillStyle=rgba(pal.room);ctx.beginPath();rrect(ctx,-.115,-.1,.23,.075,.03);ctx.fill();
    ctx.globalAlpha=1;
  }
  const inStops=d&&d.stops.includes(t),queued=actor&&queueRooms(actor).includes(t);
  ctx.beginPath();rrect(ctx,-.4,-.4,.8,.8,.17);
  ctx.lineWidth=has||inStops||queued?.062:.036;
  ctx.strokeStyle=inStops||queued?TEAMS[actor.team].color:has?rgba(pal.ink):rgba(pal.rs);ctx.stroke();
  if(t.vip){
    ctx.beginPath();rrect(ctx,-.31,-.31,.62,.62,.1);ctx.lineWidth=.03;ctx.strokeStyle=rgba(GOLD,.9);ctx.stroke();
    ctx.save();ctx.translate(.27,-.27);ctx.rotate(Math.sin(now*1.5+t.id)*.15);ctx.fillStyle=rgba(GOLD);shapePath(ctx,'star',0,0,t.suite?.21:.16);ctx.fill();ctx.restore();
  }
  if(t.flash>0){ctx.beginPath();rrect(ctx,-.4,-.4,.8,.8,.17);ctx.lineWidth=.1;ctx.strokeStyle=rgba(RED,t.flash);ctx.stroke();}
  if(d&&d.hover&&d.hover.room===t){
    const hp=clamp((now-d.hover.t0)/DWELL,0,1),per=4*(.8-.34)+TAU*.17;
    ctx.setLineDash([per*hp,per+1]);ctx.beginPath();rrRing(ctx,-.4,-.4,.8,.8,.17);ctx.lineWidth=.07;ctx.strokeStyle=TEAMS[d.team].color;ctx.stroke();ctx.setLineDash([]);
  }
  if(has){
    const pad=.1,w=.8+pad*2,r=.17+pad,per=4*(w-2*r)+TAU*r;
    ctx.lineWidth=.06;
    ctx.beginPath();rrRing(ctx,-w/2,-w/2,w,w,r);ctx.strokeStyle=rgba(pal.ink,.07);ctx.stroke();
    if(urg>0){ctx.setLineDash([per*urg,per+1]);ctx.beginPath();rrRing(ctx,-w/2,-w/2,w,w,r);ctx.strokeStyle=ringColor(urg);ctx.stroke();ctx.setLineDash([]);}
  }
  const n=reqs.length;
  const LAY=n===1?[[0,0,.3]]:n===2?[[-.15,0,.24],[.15,0,.24]]:[[-.15,-.1,.22],[.15,-.1,.22],[0,.14,.22]];
  reqs.forEach((q,i)=>{
    const[tx,ty,sz]=LAY[i]||[0,0,.22];
    if(q.lx===undefined){q.lx=tx;q.ly=ty;q.sz=sz;}
    q.lx+=(tx-q.lx)*g.kPos;q.ly+=(ty-q.ly)*g.kPos;q.sz+=(sz-q.sz)*g.kPos;
    let sc=eBack(clamp((now-q.born)/.42,0,1));
    if(q.serving)sc*=1+.13*Math.sin(now*13);
    const u=q.serving?0:q.t/q.patience,wob=u>.72?Math.sin(now*19+q.id)*.22*((u-.72)/.28):0;
    ctx.save();ctx.translate(q.lx,q.ly);ctx.rotate(wob);
    ctx.fillStyle=q.assigned?TEAMS[q.assigned.team].color:rgba(pal.ink);
    shapePath(ctx,TEAMS[q.type].shape,0,0,q.sz*sc);ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}
export function drawDept(t){
  const tc=TEAMS[t.team];
  ctx.beginPath();rrect(ctx,-.41,-.32,.86,.86,.23);ctx.fillStyle=rgba(pal.shadow,.2);ctx.fill();
  ctx.beginPath();rrect(ctx,-.43,-.355,.86,.86,.22);ctx.fillStyle=rgba(mixc(tc.dark,pal.bg,.15));ctx.fill();
  ctx.beginPath();rrect(ctx,-.43,-.43,.86,.86,.22);ctx.fillStyle=rgba(mixc(pal.room,tc.rgb,.18));ctx.fill();
  ctx.lineWidth=.065;ctx.strokeStyle=tc.color;ctx.stroke();
  if(!g.staff.some(s=>s.base===t&&s.state==='idle'&&now>s.pop)){
    ctx.globalAlpha=.42;ctx.lineWidth=.04;ctx.strokeStyle=tc.color;shapePath(ctx,tc.shape,0,0,.34);ctx.stroke();ctx.globalAlpha=1;
  }
}
