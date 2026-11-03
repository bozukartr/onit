/**
 * onit — game/requests.js
 * Misafir talepleri: üretim, tamamlama, şikayet, yanlış ekip.
 */
import { AU } from '../audio/audio.js';
import { FAIL_AT, REQ, TEAMS, UNLOCK } from '../core/config.js';
import { fmt1, gauss, haptic, rnd, wpick } from '../core/utils.js';
import { gameOver } from './day.js';
import { fx, g, now, teamUnlocked } from './state.js';
import { confettiBurst, floatText, sparkle } from '../render/effects.js';
import { GOLD, RED, pal } from '../render/palette.js';
import { toScreen } from '../render/viewport.js';
import { comboPop, hint, hitRating } from '../ui/hud.js';

export const hourNow=()=>7+g.dayT*16;
function todWeight(k,h){
  switch(k){
    case'H':return .6+1.1*gauss(h,10.5,1.8);
    case'K':return .45+.9*gauss(h,8,.9)+1.0*gauss(h,13,1)+1.2*gauss(h,20,1.3);
    case'T':return .8+.4*gauss(h,19,2.5);
    case'B':return .3+1.3*gauss(h,9,1.2)+1.1*gauss(h,16,1.4);
    case'G':return .25+1.6*gauss(h,22,1.2);
  }return 1;
}
function patienceFor(room){
  if(g.mode==='menu')return 60;
  let p=Math.max(16,30*Math.pow(.94,g.day-1))*(1+.15*g.pat)*((g.event&&g.event.pat)||1);
  return p*(room.vip?.72:1);
}
export function nextInterval(){
  if(g.mode==='menu')return rnd(1.2,2.4);
  const h=hourNow(),base=Math.max(.95,4.6*Math.pow(.83,g.day-1));
  const inten=.72+.35*gauss(h,9.5,1.4)+.3*gauss(h,13,1.1)+.42*gauss(h,20.5,1.5)-(h>22?.25:0);
  return base/(inten*((g.event&&g.event.rate)||1))*rnd(.55,1.45);
}
export function trySpawn(){
  const h=hourNow();if(g.mode==='play'&&h>22.4)return;
  const types=REQ.filter(k=>UNLOCK[k]<=g.day&&teamUnlocked(k));
  const k=wpick(types,t=>todWeight(t,h)*((g.event&&g.event.mult&&g.event.mult[t])||1));
  if(!k)return;
  const rooms=g.rooms.filter(r=>r.unlocked&&now>r.appear+.6&&r.requests.length<3&&!r.requests.some(q=>q.type===k));
  const room=wpick(rooms,r=>(r.requests.length===0?3:r.requests.length===1?1:.35)*(r.vip?1.4:1));
  if(room)spawnReq(k,room);
}
export function spawnReq(k,room){
  const q={id:g.rid++,type:k,room,t:0,patience:patienceFor(room),serving:null,assigned:null,born:now,lx:undefined,ly:undefined};
  room.requests.push(q);room.bumpT=now;
  fx.ripples.push({x:room.x+.5,y:room.y+.5,t0:now,col:room.vip?GOLD:pal.ink,dur:.7,r0:.42,r1:.9});
  if(room.vip){sparkle(room.x+.5,room.y+.5,GOLD,7);}
  if(g.dayStats)g.dayStats.req[k]=(g.dayStats.req[k]||0)+1;
  if(room.vip)AU.vip();else AU.spawn();
  return q;
}
function removeReq(q){const a=q.room.requests,i=a.indexOf(q);if(i>=0){a.splice(i,1);return true;}return false;}
export function reqWorldPos(q){const r=q.room;return{x:r.x+.5+(q.lx||0),y:r.y+.5+(q.ly||0)};}
export function completeReq(q,st){
  if(!removeReq(q))return;
  const p=reqWorldPos(q),tc=TEAMS[st.team];
  fx.ghosts.push({x:p.x,y:p.y,shape:TEAMS[q.type].shape,col:tc.rgb,t0:now,kind:'done',s:.28});
  confettiBurst(p.x,p.y,tc.rgb,TEAMS[q.type].shape);
  fx.ripples.push({x:q.room.x+.5,y:q.room.y+.5,t0:now,col:tc.rgb,dur:.55,r0:.45,r1:.8});
  q.room.bumpT=now;
  if(g.mode!=='play')return;
  const vip=!!q.room.vip,pts=vip?2:1;
  g.score+=pts;g.served++;g.dayStats.served++;g.dayStats.byTeam[st.team]=(g.dayStats.byTeam[st.team]||0)+1;
  const fast=q.t/q.patience<.5;
  if(fast&&g.time-g.lastDone<8)g.combo++;else g.combo=fast?1:0;
  g.lastDone=g.time;g.dayStats.bestCombo=Math.max(g.dayStats.bestCombo||0,g.combo);
  let bonus=(fast?.02:.01)*(vip?1.6:1);
  if(g.combo>=2)bonus+=Math.min(.03,.006*g.combo);
  g.rating=Math.min(5,g.rating+bonus);
  const sp=toScreen(q.room.x+.5,q.room.y+.5);
  fx.coins.push({x0:sp.x,y0:sp.y,t0:now,dur:.75+Math.random()*.15,col:tc.rgb,pts});
  if(g.combo>=2){floatText(q.room.x+.5,q.room.y-.15,`SERİ ×${g.combo}`,'#E8863A',13+Math.min(7,g.combo),'combo');AU.combo(g.combo);comboPop();}
  else floatText(q.room.x+.5,q.room.y+.05,vip?'+2 VIP':'+1',tc.color,13);
  AU.done(st.team);
  if(q.type==='T'&&teamUnlocked('H')&&Math.random()<.45)g.pending.push({at:g.time+1.4,type:'H',room:q.room});
}
export function failReq(q){
  if(!removeReq(q))return;
  const p=reqWorldPos(q);
  fx.ghosts.push({x:p.x,y:p.y,shape:TEAMS[q.type].shape,col:RED,t0:now,kind:'fail',s:.28});
  if(g.mode!=='play')return;
  const r=q.room,pen=r.vip?.5:.3;
  g.rating=Math.max(0,g.rating-pen);g.complaints++;g.dayStats.complaints++;
  r.shake=1;r.flash=1;g.shake=1;g.redFlash=1;
  if(g.combo>=3)floatText(r.x+.5,r.y-.35,'Seri bozuldu','#8F887C',11.5);
  g.combo=0;
  floatText(r.x+.5,r.y+.05,`Şikayet −${fmt1(pen)}★`,'#E04B3A',12.5);
  for(let i=0;i<6;i++)fx.parts.push({x:r.x+.5,y:r.y+.3,vx:rnd(-1.2,1.2),vy:rnd(-2.4,-1),g:5,life:rnd(.6,.9),max:.9,col:RED,r:rnd(.03,.05),shape:'star'});
  hitRating();AU.fail();haptic([18,40,18]);
  if(g.tut&&!g.tut.sawFail){g.tut.sawFail=true;hint('Oda çevresindeki çizgi misafirin <b>sabrı</b>. Dolarsa şikayet gelir, otel puanı düşer.',6000);}
  if(g.rating<FAIL_AT)gameOver();
}
export function annoy(room,st){
  for(const q of room.requests)if(!q.serving)q.t=Math.min(q.patience*.98,q.t+q.patience*.14);
  floatText(st.x,st.y-.2,'?','#26282E',15,'bubble');
  room.shake=.6;
  if(g.mode!=='play')return;
  g.rating=Math.max(0,g.rating-.05);
  floatText(room.x+.5,room.y+.1,'Yanlış ekip','#8F887C',11.5);
  AU.no();
  if(!g.seen.wrong){g.seen.wrong=1;hint('Yanlış ekip geldi: misafirin sabrı azaldı. Şekil ile ekip eşleşmeli.',4500);}
  if(g.rating<FAIL_AT)gameOver();
}
