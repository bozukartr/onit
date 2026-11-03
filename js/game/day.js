/**
 * onit — game/day.js
 * Gün akışı: başlangıç, bitiş, oyun sonu, olaylar ve yoğun saatler.
 */
import { AU } from '../audio/audio.js';
import { saveCheckpoint } from './save.js';
import { EVENTS, REQ, RUSH, START_STAFF, TEAMS, UNLOCK, WINGS, dayName } from '../core/config.js';
import { hourNow, reqWorldPos } from './requests.js';
import { addStaff, toIdle } from './staff.js';
import { fx, g, now, teamUnlocked } from './state.js';
import { cancelDrag, deselect } from '../input/input.js';
import { pal } from '../render/palette.js';
import { rq, tok } from '../render/shapes.js';
import { banner, el, ensureChips, hint, setSpeed, toast } from '../ui/hud.js';
import { showOver, showSummary } from '../ui/overlays.js';
import { unlockPass } from '../world/map.js';

export function chooseEvent(d){
  if(d<4||Math.random()<.35)return null;
  const c=EVENTS.filter(e=>UNLOCK[e.need]<=d);
  return c[Math.floor(Math.random()*c.length)]||null;
}
export function dayInfo(d,fut){
  const w=WINGS[d];
  let s=w?`<b>${w[0]}</b> ${d===1?'':fut?'açılıyor':'açıldı'} · ${w[1]}`:`Otel tam kapasite · talepler ${fut?'hızlanacak':'hızlanıyor'}`;
  const nt=REQ.find(k=>UNLOCK[k]===d&&d>1);
  if(nt)s+=`<br>Yeni ekip: ${tok(nt,16)} <b>${TEAMS[nt].long}</b>`;
  if(d===1)s+=`<br>${tok('H',16)} Kat Hizmetleri · ${tok('K',16)} Oda Servisi göreve hazır`;
  return s;
}
/** @param {{resume?:boolean}} opt resume: kayıttan dönülüyor, personel zaten eklendi */
export function startDay(d,opt={}){
  g.day=d;g.dayT=0;g.phase='day';g.nightTarget=0;g.rushDone={};g.combo=0;
  g.event=d===1?null:(g.nextEvent!==undefined?g.nextEvent:chooseEvent(d));g.nextEvent=undefined;
  g.dayStats={served:0,complaints:0,byTeam:{},req:{},r0:g.rating,bestCombo:0};
  unlockPass(now+.15,d===1);
  if(!opt.resume){
    for(const k of REQ)if(UNLOCK[k]===d)for(let i=0;i<START_STAFF[k];i++)addStaff(k,now+1+i*.15);
    if(g.owned.joker&&!teamUnlocked('J'))addStaff('J',now+1);
  }
  if(d===1&&g.tut){g.spawnT=1e9;}else g.spawnT=2.2;
  ensureChips();
  let sub=dayInfo(d,false);
  if(g.event)sub+=`<br><span style="color:#B4581B"><b style="color:#B4581B">${g.event.name}</b> · ${g.event.desc}</span>`;
  banner(`${dayName(d)} · ${d}. GÜN`,sub,4600);
  const nt=REQ.find(k=>UNLOCK[k]===d&&d>1);
  if(nt)setTimeout(()=>{if(g&&g.phase==='day')hint(`${rq(nt)} taleplerine ${tok(nt,18)} <b>${TEAMS[nt].long}</b> bakar · ${TEAMS[nt].what}`,6500);},4800);
  setSpeed(g.lastSpeed||1);
  saveCheckpoint('day');
}
export function endDay(){
  g.phase='night';g.nightT=Math.max(g.nightT,pal.night);g.nightTarget=1;cancelDrag();deselect();g.guideOn=false;el.hint.classList.remove('show');el.toast.classList.remove('show');
  for(const r of g.rooms){for(const q of r.requests){const p=reqWorldPos(q);fx.ghosts.push({x:p.x,y:p.y,shape:TEAMS[q.type].shape,col:pal.ink,t0:now,kind:'fade',s:.26});}r.requests.length=0;}
  g.pending.length=0;
  for(const st of g.staff){toIdle(st);st.pop=now+.25;st.snap=true;st.trail.length=0;}
  AU.day();
  setTimeout(showSummary,1250);
}
export function gameOver(){
  if(g.phase!=='day')return;
  g.phase='over';g.nightT=Math.max(g.nightT,pal.night);cancelDrag();deselect();g.nightTarget=1;g.guideOn=false;el.hint.classList.remove('show');el.toast.classList.remove('show');
  AU.over();
  setTimeout(showOver,1100);
}
export function checkRush(){
  if(g.mode!=='play'||(g.tut&&g.tut.step<4&&g.day===1))return;
  const h=hourNow();
  for(const r of RUSH){
    if(g.rushDone[r.h]||h<r.h||h>r.h+.6)continue;
    g.rushDone[r.h]=1;
    if(!teamUnlocked(r.k))continue;
    toast(`${tok(r.k,22)}<b>${r.t}</b><span class="m">· ${r.d}</span>`,3400);
  }
}
