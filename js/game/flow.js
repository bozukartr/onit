/**
 * onit — game/flow.js
 * Oyun akışı: ana menü ↔ yeni oyun.
 */
import { REQ } from '../core/config.js';
import { KEYS, store } from '../core/storage.js';
import { startDay } from './day.js';
import { addStaff } from './staff.js';
import { g, newState, now } from './state.js';
import { cam, camSnap } from '../render/viewport.js';
import { el, hud } from '../ui/hud.js';
import { hideMenu, showMenu } from '../ui/menu.js';
import { closeOv, curtain } from '../ui/overlays.js';
import { unlockPass } from '../world/map.js';

export function startMenu(){
  closeOv();
  document.body.classList.add('menu');
  el.teams.innerHTML='';el.hint.classList.remove('show');el.banner.classList.remove('show');el.toast.classList.remove('show');
  newState('menu');g.day=6;g.dayT=.34;
  unlockPass(now+.25,true);
  for(const k of REQ)for(let i=0;i<(k==='H'||k==='K'?2:1);i++)addStaff(k,now+1.4+Math.random()*.9);
  camSnap();cam.s*=1.18;
  g.spawnT=1.6;
  showMenu();
}
export function newGame(){
  closeOv();
  curtain(()=>{
    newState('play');document.body.classList.remove('menu');hideMenu();
    el.teams.innerHTML='';
    g.tut=store.get(KEYS.tutorial,0)>=2?null:{step:0,t:0};
    startDay(1);camSnap();
    for(const k in hud)delete hud[k];
  });
}
