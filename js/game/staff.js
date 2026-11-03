/**
 * onit — game/staff.js
 * Personel: rota planlama, ekleme, iptal, hareket ve atama.
 */
import { AU } from '../audio/audio.js';
import { LANE, SPEED, TEAMS } from '../core/config.js';
import { PI, TAU } from '../core/utils.js';
import { annoy, completeReq } from './requests.js';
import { g, matches, now, speedMul } from './state.js';
import { floatText } from '../render/effects.js';
import { at, center, interior, isWalk, tiles } from '../world/map.js';
import { buildLeg, sampleLeg } from '../world/route.js';

export function addStaff(k,popAt){
  const base=tiles.find(t=>t.type==='dept'&&t.team===k);
  const c=center(base);
  const st={id:g.sid++,team:k,base,state:'idle',x:c.x,y:c.y,tx:c.x,ty:c.y,cx:c.x,cy:c.y,ox:0,oy:0,sc:.8,idleSc:.8,
    plan:null,nextPlan:null,leg:null,serve:null,atRoom:null,pop:popAt==null?now:popAt,reblend:false,snap:true,
    px:c.x,py:c.y,vx:0,vy:0,ang:0,str:0,walk:0,trail:[],trailT:0};
  g.staff.push(st);return st;
}
function slotPos(b,i,n){
  const cx=b.x+.5,cy=b.y+.5;
  const L={1:[[0,0]],2:[[-.17,0],[.17,0]],3:[[-.17,.11],[.17,.11],[0,-.17]],4:[[-.16,-.16],[.16,-.16],[-.16,.16],[.16,.16]]}[n];
  if(L)return{x:cx+L[i][0],y:cy+L[i][1]};
  const a=i/n*TAU-PI/2;return{x:cx+Math.cos(a)*.23,y:cy+Math.sin(a)*.23};
}
export function layoutIdle(){
  const m=new Map();
  for(const st of g.staff)if(st.state==='idle'){let a=m.get(st.base);if(!a)m.set(st.base,a=[]);a.push(st);}
  for(const[b,a]of m){a.sort((x,y)=>x.id-y.id);const n=a.length;a.forEach((st,i)=>{const p=slotPos(b,i,n);st.tx=p.x;st.ty=p.y;st.idleSc=n<=2?.84:n<=4?.66:.54;});}
}
function anchor(st){
  if(st.state==='idle')return{pt:center(st.base),tile:st.base.door};
  if(st.atRoom)return{pt:{x:st.cx,y:st.cy},tile:st.atRoom.door};
  const t=at(Math.floor(st.cx),Math.floor(st.cy));
  if(isWalk(t))return{pt:{x:st.cx,y:st.cy},tile:t};
  const L=st.leg,cand=[L&&L.fromTile,L&&L.toDoor].filter(Boolean);
  let best=cand[0]||st.base.door,bd=1e9;
  for(const d of cand){const dd=(d.x+.5-st.cx)**2+(d.y+.5-st.cy)**2;if(dd<bd){bd=dd;best=d;}}
  return{pt:{x:st.cx,y:st.cy},tile:best};
}
function setLeg(st,L){
  st.leg=L;L.s=0;st.state='move';st.atRoom=null;st.serve=null;
  const p=sampleLeg(L,0);st.tx=p.x;st.ty=p.y;st.cx=p.cx;st.cy=p.cy;st.reblend=true;
}
export function toIdle(st){
  st.state='idle';st.leg=null;st.plan=null;st.nextPlan=null;st.atRoom=null;st.serve=null;
  st.cx=st.base.x+.5;st.cy=st.base.y+.5;
}
export const laneOf=st=>TEAMS[st.team].lane*LANE;
function beginStopLeg(st){
  const P=st.plan,room=P.stops[P.idx];
  if(st.atRoom===room){arriveRoom(st,room);return;}
  let L=null;
  const prev=P.idx>0?P.stops[P.idx-1]:null;
  if(prev&&st.atRoom===prev&&P.legs[P.idx-1])L=P.legs[P.idx-1];
  else if(P.idx===0&&P.lead&&P.leadFrom&&st.atRoom===P.leadFrom)L=P.lead;
  const A=anchor(st);
  if(!L)L=buildLeg(A.pt,A.tile,room.door,interior(room),laneOf(st));
  if(!L){proceed(st);return;}
  L.kind='stop';L.room=room;L.toDoor=room.door;L.fromTile=A.tile;
  setLeg(st,L);
}
function beginBaseLeg(st){
  const P=st.plan;st.plan=null;
  let L=null;
  if(P&&P.home&&st.atRoom&&st.atRoom===P.stops[P.stops.length-1])L=P.home;
  const A=anchor(st);
  if(!L)L=buildLeg(A.pt,A.tile,st.base.door,center(st.base),laneOf(st));
  if(!L){toIdle(st);return;}
  L.kind='base';L.toDoor=st.base.door;L.fromTile=A.tile;
  setLeg(st,L);
}
function arriveRoom(st,room){
  st.atRoom=room;st.leg=null;
  const cand=room.requests.filter(q=>!q.serving&&matches(st,q));
  if(cand.length){
    cand.sort((a,b)=>b.t/b.patience-a.t/a.patience);
    const q=cand[0];q.serving=st;st.state='serve';
    const mul=st.team==='J'?1.3:Math.pow(.7,g.trn[st.team]||0);
    st.serve={req:q,t:0,dur:TEAMS[q.type].service*mul*(room.vip?1.12:1)};
    room.bumpT=now;
    AU.serve(st.team);return;
  }
  const intended=st.plan&&st.plan.intended?st.plan.intended[st.plan.idx]:false;
  if(!intended&&room.requests.length)annoy(room,st);
  st.state='wait';
  proceed(st);
}
function proceed(st){
  if(st.nextPlan){st.plan=st.nextPlan;st.nextPlan=null;st.plan.idx=0;beginStopLeg(st);return;}
  if(st.plan){st.plan.idx++;if(st.plan.idx<st.plan.stops.length){beginStopLeg(st);return;}}
  beginBaseLeg(st);
}
/* aktif rota: personel bir odaya gidiyorsa ya da hizmet veriyorsa */
export function busyPlan(st){
  if(st.nextPlan)return st.nextPlan;
  if(!st.plan)return null;
  if(st.state==='serve'||(st.state==='move'&&st.leg&&st.leg.kind==='stop'))return st.plan;
  return null;
}
export function queueRooms(st){
  const P=busyPlan(st);if(!P)return[];
  if(P===st.nextPlan)return P.stops.slice();
  return P.stops.slice(P.idx+(st.state==='serve'?1:0));
}
export function lastStopOf(st){
  const q=queueRooms(st);if(q.length)return q[q.length-1];
  if(st.state==='serve')return st.atRoom;
  return null;
}
export function planLegs(st,stops){
  const lane=laneOf(st),A=anchor(st),out={lead:null,legs:[],home:null,leadFrom:null};
  if(!stops.length)return out;
  const here=st.atRoom&&st.state!=='idle'?st.atRoom:null;
  if(here!==stops[0]){out.lead=buildLeg(A.pt,A.tile,stops[0].door,interior(stops[0]),lane);out.leadFrom=here;}
  for(let i=0;i<stops.length-1;i++)out.legs.push(buildLeg(interior(stops[i]),stops[i].door,stops[i+1].door,interior(stops[i+1]),lane));
  const last=stops[stops.length-1];
  out.home=buildLeg(interior(last),last.door,st.base.door,center(st.base),lane);
  return out;
}
/* yeni rota (boştaki ya da üsse dönen personel) */
export function commitPlan(st,stops){
  const intended=stops.map(r=>r.requests.some(q=>matches(st,q)));
  const pl=planLegs(st,stops);
  const plan={stops,intended,idx:0,legs:pl.legs,home:pl.home,lead:pl.lead,leadFrom:pl.leadFrom};
  if(st.state==='serve'){st.nextPlan=plan;return;}
  st.nextPlan=null;
  const inStub=st.state==='move'&&st.leg&&st.leg.kind==='stop'&&st.leg.room===stops[0]&&!isWalk(at(Math.floor(st.cx),Math.floor(st.cy)));
  st.plan=plan;
  if(inStub)return;
  if(pl.lead&&st.atRoom!==stops[0]){const A=anchor(st);const L=pl.lead;L.kind='stop';L.room=stops[0];L.toDoor=stops[0].door;L.fromTile=A.tile;setLeg(st,L);}
  else beginStopLeg(st);
}
/* yoldaki personel: yeni duraklar rotanın SONUNA eklenir */
export function appendPlan(st,rooms){
  const P=busyPlan(st);
  if(!P){commitPlan(st,rooms);return;}
  const lane=laneOf(st),n0=P.stops.length;
  for(const r of rooms){P.stops.push(r);P.intended.push(r.requests.some(q=>matches(st,q)));}
  for(let k=Math.max(0,n0-1);k<P.stops.length-1;k++){
    if(k===n0-1||!P.legs[k])P.legs[k]=buildLeg(interior(P.stops[k]),P.stops[k].door,P.stops[k+1].door,interior(P.stops[k+1]),lane);
  }
  const last=P.stops[P.stops.length-1];
  P.home=buildLeg(interior(last),last.door,st.base.door,center(st.base),lane);
}
export function cancelRoute(st){
  const lane=laneOf(st);
  if(st.state==='serve'&&st.plan){
    st.nextPlan=null;const P=st.plan;
    P.stops.length=P.idx+1;P.intended.length=P.idx+1;P.legs.length=P.idx;
    P.home=buildLeg(interior(st.atRoom),st.atRoom.door,st.base.door,center(st.base),lane);
  }else if(st.state==='move'&&st.leg&&st.leg.kind==='stop'){st.plan=null;beginBaseLeg(st);}
  else return false;
  floatText(st.x,st.y-.25,'Üsse dönüyor',TEAMS[st.team].color,12);
  AU.tick(0,true);return true;
}
export function stepStaff(st,dt){
  if(st.state==='move'){
    const L=st.leg,v=SPEED*speedMul(st.team)*(g.mode==='menu'?.85:1);
    const acc=Math.min(1,.28+L.s/.42),dec=Math.min(1,.2+(L.len-L.s)/.5);
    const ds=v*Math.min(acc,dec)*dt;
    L.s=Math.min(L.len,L.s+ds);st.walk+=ds;
    const p=sampleLeg(L,L.s);st.tx=p.x;st.ty=p.y;st.cx=p.cx;st.cy=p.cy;
    if(L.s>=L.len){if(L.kind==='stop')arriveRoom(st,L.room);else toIdle(st);}
  }else if(st.state==='serve'){
    const S=st.serve;S.t+=dt;
    if(S.t>=S.dur){const q=S.req;st.serve=null;completeReq(q,st);proceed(st);}
  }
}
export function pickFor(team,idleOnly){
  const mine=g.staff.filter(s=>s.team===team&&now>s.pop);
  const idle=mine.filter(s=>s.state==='idle').sort((a,b)=>a.id-b.id);
  if(idle.length)return idle[0];
  if(idleOnly)return null;
  const home=mine.filter(s=>s.state==='move'&&s.leg&&s.leg.kind==='base').sort((a,b)=>(a.leg.len-a.leg.s)-(b.leg.len-b.leg.s));
  return home[0]||null;
}
export function computeAssign(){
  for(const r of g.rooms)for(const q of r.requests)q.assigned=null;
  for(const st of g.staff)if(st.serve)st.serve.req.assigned=st;
  for(const st of g.staff){
    let stops=[];
    if(st.nextPlan)stops=st.nextPlan.stops;
    else if(st.plan)stops=st.plan.stops.slice(st.plan.idx+(st.state==='serve'?1:0));
    for(const room of stops){
      const c=room.requests.filter(q=>!q.assigned&&matches(st,q));
      if(c.length){c.sort((a,b)=>b.t/b.patience-a.t/a.patience);c[0].assigned=st;}
    }
  }
}
