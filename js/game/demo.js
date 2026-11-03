/**
 * onit — game/demo.js
 * Ana menü arkasında oynayan otomatik demo.
 */
import { appendPlan, busyPlan, commitPlan, computeAssign, lastStopOf, pickFor, queueRooms } from './staff.js';
import { g } from './state.js';

export function demoAI(dt){
  g.demoT-=dt;if(g.demoT>0)return;g.demoT=.45;
  computeAssign();
  const open=[];for(const r of g.rooms)for(const q of r.requests)if(!q.assigned&&!q.serving)open.push(q);
  open.sort((a,b)=>b.t-a.t);
  for(const q of open){
    if(q.assigned)continue;
    const busy=g.staff.find(s=>s.team===q.type&&busyPlan(s)&&queueRooms(s).length<2&&!queueRooms(s).includes(q.room)&&lastStopOf(s)!==q.room);
    const st=pickFor(q.type,true);
    if(st){commitPlan(st,[q.room]);q.assigned=st;}
    else if(busy&&Math.random()<.6){appendPlan(busy,[q.room]);q.assigned=busy;}
  }
}
