/**
 * onit — game/guests.js
 * Ambiyans: lobiden odalara yürüyen misafirler.
 */
import { TAU, rnd } from '../core/utils.js';
import { g, now } from './state.js';
import { GUEST_COLS } from '../render/palette.js';
import { at } from '../world/map.js';
import { buildLeg } from '../world/route.js';

function spawnGuest(){
  const rooms=g.rooms.filter(r=>r.unlocked&&now>r.appear+.6);if(!rooms.length)return;
  const r=rooms[Math.floor(Math.random()*rooms.length)],lob=at(5,13),ent={x:5.5,y:14.6};
  const ip={x:r.door.x+.5+(r.x-r.door.x)*.45,y:r.door.y+.5+(r.y-r.door.y)*.45};
  const off=rnd(-.2,.2),inward=Math.random()<.55;
  const L=inward?buildLeg(ent,lob,r.door,ip,off):buildLeg(ip,r.door,lob,ent,off);
  if(L)g.guests.push({L,s:0,v:rnd(1,1.4),col:GUEST_COLS[Math.floor(Math.random()*GUEST_COLS.length)],bag:Math.random()<.4,ph:Math.random()*TAU});
}
export function stepGuests(dt){
  g.guestT-=dt;if(g.guestT<=0){g.guestT=g.mode==='menu'?rnd(.8,2):rnd(2.5,6);spawnGuest();}
  for(const gu of g.guests)gu.s+=gu.v*dt;
  g.guests=g.guests.filter(gu=>gu.s<gu.L.len);
}
