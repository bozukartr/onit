/**
 * onit — input/input.js
 * Girdi: sürükle-bırak rota, dokun-seç, rota sonuna ekleme, iptal.
 */
import { AU } from '../audio/audio.js';
import { TEAMS } from '../core/config.js';
import { haptic } from '../core/utils.js';
import { appendPlan, busyPlan, cancelRoute, commitPlan, laneOf, lastStopOf, pickFor, planLegs, queueRooms } from '../game/staff.js';
import { fx, g, matches, now } from '../game/state.js';
import { tok } from '../render/shapes.js';
import { cam, cv, toWorld } from '../render/viewport.js';
import { el, hint } from '../ui/hud.js';
import { ovOpen } from '../ui/overlays.js';
import { at, interior } from '../world/map.js';
import { buildLeg } from '../world/route.js';

/* ---------- girdi ----------
   • Personeli sürükle → odaların üstünden geç → bırak (rota)
   • Yoldaki personeli sürükle → yeni duraklar rotanın sonuna eklenir
   • Personele dokun → seçilir; sonra odalara dokunarak sıradaki durakları ekle
   • Personeli kendi üssüne bırak → rota iptal, üsse döner                 */
export const canDrag=()=>g&&g.mode==='play'&&g.phase==='day'&&!ovOpen;
function hitStaff(w){let best=null,bd=Math.max(.42,22/cam.s);for(const st of g.staff){if(now<st.pop+.15)continue;const d=Math.hypot(st.x-w.x,st.y-w.y);if(d<bd){bd=d;best=st;}}return best;}
function hitRouteEnd(w){
  let best=null,bd=.3;
  for(const st of g.staff){const q=queueRooms(st);if(!q.length)continue;const p=interior(q[q.length-1]);const d=Math.hypot(p.x-w.x,p.y-w.y);if(d<bd){bd=d;best=st;}}
  return best;
}
export const tileAtW=w=>at(Math.floor(w.x),Math.floor(w.y));
export function beginDrag(st,e){
  const w=toWorld(e.clientX,e.clientY);
  const mode=busyPlan(st)?'append':'new';
  g.drag={staff:st,team:st.team,mode,from:mode==='append'?lastStopOf(st):null,stops:[],pid:e.pointerId,w,sx:e.clientX,sy:e.clientY,moved:0,pv:null,full:false,hover:null,mx:w.x,my:w.y,t0:now};
  cv.style.cursor='grabbing';AU.pick(st.team);haptic(6);
  if(g.guideOn&&st.team==='H')g.guideFade=now;
}
const dragCap=d=>g.maxStops-(d.mode==='append'?queueRooms(d.staff).length:0);
export function refreshPreview(){
  const d=g.drag;if(!d)return;
  if(!d.stops.length){d.pv=null;return;}
  const lane=laneOf(d.staff);
  if(d.mode==='append'&&d.from){
    const legs=[];let prev=d.from;
    for(const r of d.stops){legs.push(buildLeg(interior(prev),prev.door,r.door,interior(r),lane));prev=r;}
    d.pv={legs};
  }else{const pl=planLegs(d.staff,d.stops);d.pv={legs:[pl.lead,...pl.legs].filter(Boolean)};}
}
export function addStop(t){
  const d=g.drag;if(!d||d.stops.includes(t))return false;
  if(d.stops.length>=dragCap(d)){if(!d.full){d.full=true;AU.no();hint(`Bir personelin sırasında en fazla <b>${g.maxStops}</b> oda olabilir. <b>Servis Arabası</b> bu sınırı artırır.`,3200);}return false;}
  d.stops.push(t);d.full=false;d.hover=null;refreshPreview();AU.tick(d.stops.length+(d.mode==='append'?queueRooms(d.staff).length:0));haptic(5);
  fx.ripples.push({x:t.x+.5,y:t.y+.5,t0:now,col:TEAMS[d.team].rgb,dur:.4,r0:.4,r1:.7});
  return true;
}
function dragMove(e){
  const d=g.drag;d.w=toWorld(e.clientX,e.clientY);
  d.moved=Math.max(d.moved,Math.hypot(e.clientX-d.sx,e.clientY-d.sy));
  const t=tileAtW(d.w);
  if(t&&t.type==='room'&&t.unlocked&&now>t.appear+.3){
    const last=d.stops[d.stops.length-1];
    if(t===last){d.hover=null;return;}
    if(d.stops.length>=2&&t===d.stops[d.stops.length-2]){d.stops.pop();d.hover=null;refreshPreview();AU.tick(d.stops.length,true);return;}
    if(d.stops.includes(t)){d.hover=null;return;}
    if(!d.stops.length&&t===d.from){d.hover=null;return;}
    if(d.mode==='append'&&queueRooms(d.staff).includes(t)){d.hover=null;return;}
    if(t.requests.some(q=>matches(d.staff,q)))addStop(t);
    else if(!d.hover||d.hover.room!==t)d.hover={room:t,t0:now};
  }else{
    d.hover=null;
    if(d.stops.length===1){
      const o=d.staff;
      if(Math.hypot(d.w.x-o.x,d.w.y-o.y)<.38||(t&&t===o.base)){d.stops.pop();refreshPreview();AU.tick(0,true);}
    }
  }
}
function commitDrag(){
  const d=g.drag;if(!d)return;
  if(d.hover)addStop(d.hover.room);
  g.drag=null;cv.style.cursor='';
  const st=d.staff;
  if(!d.stops.length){
    if(d.moved<10&&now-d.t0<.6){toggleSelect(st);return;}
    const t=tileAtW(d.w);
    if(t===st.base&&busyPlan(st)){cancelRoute(st);return;}
    if(d.moved<12)hint('Personeli <b>sürükle</b> ve talebi olan bir odanın üstünde bırak — ya da dokunup seç.',3000);
    return;
  }
  if(d.mode==='append'){
    appendPlan(st,d.stops);
    if(!g.seen.append){g.seen.append=1;hint('Yeni durak rotanın <b>sonuna</b> eklendi. İptal etmek için personeli kendi üssüne bırak.',4500);}
    if(g.tut)g.tut.appended=true;
  }else commitPlan(st,d.stops);
  AU.go(d.team);haptic(9);
  if(g.tut&&g.tut.step===1)g.tut.dispatched=true;
}
export function cancelDrag(){if(g&&g.drag){g.drag=null;cv.style.cursor='';}}
function toggleSelect(st){
  if(g.sel===st){deselect();AU.tick(0,true);return;}
  g.sel=st;g.selT=now;AU.pick(st.team);haptic(8);
  syncChipSel();
  if(!g.seen.sel){g.seen.sel=1;hint(`${tok(st.team,18)} seçildi. Odalara <b>dokunarak</b> sıradaki durakları ekle. Boş yere dokunursan seçim kalkar.`,5200);}
}
export function deselect(){if(g&&g.sel){g.sel=null;syncChipSel();}}
function syncChipSel(){for(const c of el.teams.children)c.classList.toggle('sel',!!(g.sel&&g.sel.team===c.dataset.team));}
function tapAppend(st,room){
  const q=queueRooms(st);
  if(q.includes(room)||lastStopOf(st)===room){AU.no();room.shake=.4;return;}
  if(q.length>=g.maxStops){AU.no();hint(`Sırada en fazla <b>${g.maxStops}</b> oda olabilir. Personel bir odayı bitirince yer açılır.`,3000);return;}
  const wasBusy=!!busyPlan(st);
  appendPlan(st,[room]);
  fx.ripples.push({x:room.x+.5,y:room.y+.5,t0:now,col:TEAMS[st.team].rgb,dur:.45,r0:.4,r1:.75});
  AU.tick(q.length+1);haptic(7);
  if(g.tut){if(g.tut.step===1)g.tut.dispatched=true;if(wasBusy)g.tut.appended=true;}
}
/** Canvas ve pencere girdi dinleyicilerini bağlar (main.js). */
export function initInput(){
  cv.addEventListener('pointerdown',e=>{
    AU.init();
    if(!canDrag())return;
    const w=toWorld(e.clientX,e.clientY);
    const st=hitStaff(w);
    if(st){e.preventDefault();beginDrag(st,e);return;}
    const t=tileAtW(w);
    if(g.sel&&t&&t.type==='room'&&t.unlocked&&now>t.appear+.3){tapAppend(g.sel,t);return;}
    if(t&&t.type==='dept'&&t.unlocked){
      if(g.sel&&g.sel.base===t&&busyPlan(g.sel)){cancelRoute(g.sel);deselect();return;}
      const p=pickFor(t.team);
      if(!p){t.shake=1;AU.no();hint('Bu ekipte boşta personel yok. Yoldaki personeli tutup sırasına durak ekleyebilirsin.',3500);return;}
      e.preventDefault();beginDrag(p,e);return;
    }
    const re=hitRouteEnd(w);
    if(re){e.preventDefault();beginDrag(re,e);return;}
    if(g.sel)deselect();
  });
  window.addEventListener('pointermove',e=>{
    if(g&&g.drag&&e.pointerId===g.drag.pid){dragMove(e);return;}
    if(e.pointerType==='mouse'&&canDrag()&&e.target===cv){
      const w=toWorld(e.clientX,e.clientY),t=tileAtW(w);
      cv.style.cursor=(hitStaff(w)||(t&&t.type==='dept'&&t.unlocked)||hitRouteEnd(w))?'grab':(g.sel&&t&&t.type==='room'&&t.unlocked)?'pointer':'';
    }
  });
  window.addEventListener('pointerup',e=>{if(g&&g.drag&&e.pointerId===g.drag.pid)commitDrag();});
  window.addEventListener('pointercancel',e=>{if(g&&g.drag&&e.pointerId===g.drag.pid)commitDrag();});
  document.addEventListener('gesturestart',e=>e.preventDefault());
  document.addEventListener('contextmenu',e=>e.preventDefault());
}
