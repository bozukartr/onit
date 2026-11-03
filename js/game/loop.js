/**
 * onit — game/loop.js
 * Simülasyon adımı, görsel yumuşatma ve palet geçişi.
 */
import { DAY_LEN, DWELL } from '../core/config.js';
import { clamp, eInOut, mixc } from '../core/utils.js';
import { checkRush, endDay } from './day.js';
import { demoAI } from './demo.js';
import { stepGuests } from './guests.js';
import { failReq, hourNow, nextInterval, spawnReq, trySpawn } from './requests.js';
import { computeAssign, layoutIdle, stepStaff } from './staff.js';
import { g, now } from './state.js';
import { tutStep } from './tutorial.js';
import { addStop, deselect, refreshPreview } from '../input/input.js';
import { PD, PK, PN, pal } from '../render/palette.js';
import { tiles } from '../world/map.js';

export function step(dt){
  g.time+=dt;
  if(g.mode==='play'){g.dayT+=dt/DAY_LEN;if(g.dayT>=1){g.dayT=1;endDay();return;}checkRush();}
  if(g.mode==='menu')demoAI(dt);
  tutStep(dt);
  g.spawnT-=dt;if(g.spawnT<=0){trySpawn();g.spawnT=nextInterval();}
  for(let i=g.pending.length-1;i>=0;i--){const p=g.pending[i];if(g.time>=p.at){g.pending.splice(i,1);if(p.room.requests.length<3&&!p.room.requests.some(q=>q.type===p.type))spawnReq(p.type,p.room);}}
  for(const st of g.staff)stepStaff(st,dt);
  const fails=[];
  for(const r of g.rooms){if(!r.requests.length)continue;for(const q of r.requests){if(q.serving)continue;q.t+=dt;if(q.t>=q.patience)fails.push(q);}}
  for(const q of fails){failReq(q);if(g.phase!=='day')return;}
  stepGuests(dt);
}
export function visuals(rdt){
  computeAssign();layoutIdle();
  const kI=1-Math.exp(-rdt*9),kO=Math.exp(-rdt*8),kS=1-Math.exp(-rdt*10),kV=1-Math.exp(-rdt*12);
  for(const st of g.staff){
    if(st.snap){st.x=st.tx;st.y=st.ty;st.ox=st.oy=0;st.snap=false;st.px=st.x;st.py=st.y;}
    if(st.state==='idle'){st.x+=(st.tx-st.x)*kI;st.y+=(st.ty-st.y)*kI;st.ox=st.oy=0;}
    else{if(st.reblend){st.ox=st.x-st.tx;st.oy=st.y-st.ty;st.reblend=false;}st.ox*=kO;st.oy*=kO;st.x=st.tx+st.ox;st.y=st.ty+st.oy;}
    st.sc+=((st.state==='idle'?st.idleSc:1)-st.sc)*kS;
    /* hız → esneme + iz */
    if(rdt>0){const vx=(st.x-st.px)/rdt,vy=(st.y-st.py)/rdt;st.vx+=(vx-st.vx)*kV;st.vy+=(vy-st.vy)*kV;}
    st.px=st.x;st.py=st.y;
    const sp=Math.hypot(st.vx,st.vy);
    st.str+=(clamp(sp*.025,0,.13)*(st.state==='move'?1:0)-st.str)*kV;
    if(sp>.2)st.ang=Math.atan2(st.vy,st.vx);
    st.trailT+=rdt;
    if(st.state==='move'&&st.trailT>.035){st.trailT=0;st.trail.push({x:st.x,y:st.y});if(st.trail.length>6)st.trail.shift();}
    else if(st.state!=='move'&&st.trail.length&&st.trailT>.04){st.trailT=0;st.trail.shift();}
  }
  for(const t of tiles){if(t.shake>0)t.shake=Math.max(0,t.shake-rdt*2.2);if(t.flash>0)t.flash=Math.max(0,t.flash-rdt*1.4);}
  g.shake=Math.max(0,g.shake-rdt*3.2);g.redFlash=Math.max(0,g.redFlash-rdt*1.6);
  g.kPos=1-Math.exp(-rdt*14);g.rdt=rdt;
  if(g.drag&&g.drag.hover&&now-g.drag.hover.t0>DWELL)addStop(g.drag.hover.room);
  if(g.drag&&g.drag.stops.length&&g.drag.mode==='new'&&g.drag.staff.state!=='idle')refreshPreview();
  if(g.sel&&g.sel.state==='idle'&&!g.sel.plan&&now-g.selT>8)deselect();
}
export function updatePalette(rdt){
  let dt=0,night=g.nightT;
  if(g.mode==='play'){
    if(g.phase==='day'){const h=hourNow();dt=h<8?(8-h)*.3:h>18?eInOut(clamp((h-18)/3,0,1)):0;night=Math.max(night,h>21?(h-21)/2*.28:0);}
    else dt=1-g.nightT;
  }else night=0;
  if(g.dusk===undefined)g.dusk=dt;
  g.dusk+=(dt-g.dusk)*(1-Math.exp(-rdt*2));
  const dusk=g.dusk;
  pal.dusk=dusk;pal.night=night;pal.light=clamp(night*1.1+dusk*.3,0,1);pal.t=Math.max(night,dusk*.3);
  for(const k in PD)pal[k]=mixc(mixc(PD[k],PK[k],dusk),PN[k],night);
}
