/**
 * onit — game/flow.js
 * Oyun akışı: ana menü ↔ yeni vardiya / kayıttan devam.
 */
import { REQ } from '../core/config.js';
import { KEYS, store } from '../core/storage.js';
import { startDay } from './day.js';
import { applySave, clearSave, eventByName, loadSave } from './save.js';
import { addStaff } from './staff.js';
import { g, newState, now } from './state.js';
import { cam, camSnap } from '../render/viewport.js';
import { el, ensureChips, hud, setSpeed } from '../ui/hud.js';
import { hideMenu, showMenu } from '../ui/menu.js';
import { closeOv, curtain, showSummary } from '../ui/overlays.js';
import { unlockPass } from '../world/map.js';

export function startMenu(){
  closeOv();
  document.body.classList.add('menu');
  el.teams.innerHTML='';el.hint.classList.remove('show');el.banner.classList.remove('show');el.toast.classList.remove('show');
  newState('menu');g.day=6;g.dayT=.34;g.menuT0=now;
  unlockPass(now+.25,true);
  for(const k of REQ)for(let i=0;i<(k==='H'||k==='K'?2:1);i++)addStaff(k,now+1.4+Math.random()*.9);
  camSnap();cam.s*=1.18;
  g.spawnT=1.6;
  showMenu();
}

/** Perde arkasında temiz bir oyun durumu kurar, ardından `setup` çalışır. */
function beginRun(setup){
  closeOv();
  curtain(()=>{
    newState('play');document.body.classList.remove('menu');hideMenu();
    el.teams.innerHTML='';
    for(const k in hud)delete hud[k];
    setup();
    camSnap();
  });
}

/** Sıfırdan yeni vardiya (varsa eski kayıt silinir). */
export function newGame(){
  clearSave();
  beginRun(()=>{
    g.runBest=(store.get(KEYS.best,null)||{}).score||0;
    g.tut=store.get(KEYS.tutorial,0)>=2?null:{step:0,t:0};
    startDay(1);
  });
}

/** Kayıtlı vardiyaya devam: gün başına ya da gün sonu özetine döner. */
export function continueGame(){
  const s=loadSave();
  if(!s){newGame();return;}
  beginRun(()=>{
    g.tut=null;
    applySave(s);
    g.day=s.day;
    for(const k in s.staff)for(let i=0;i<s.staff[k];i++)addStaff(k,now+.9+i*.12);
    if(s.at==='summary'){
      /* özet ekranı: gün bitmiş, gece; aynı seçenekler */
      unlockPass(now+.15,false);
      ensureChips();setSpeed(g.lastSpeed);
      Object.assign(g,{phase:'night',dayT:1,nightT:1,nightTarget:1,dayStats:s.dayStats,event:eventByName(s.event),
        summaryPlan:{nextEvent:eventByName(s.nextEvent),picks:s.picks}});
      setTimeout(showSummary,700);
    }else{
      g.nextEvent=eventByName(s.event);
      startDay(s.day,{resume:true});
    }
  });
}
