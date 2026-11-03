/**
 * onit — ui/hud.js
 * HUD: skor, puan, saat, ekip kartları, ipucu/afiş/duyuru, hız kontrolleri.
 */
import { AU } from '../audio/audio.js';
import { DAY_ABBR, ORDER, TEAMS } from '../core/config.js';
import { KEYS, store } from '../core/storage.js';
import { $, TAU, fmt1, lerp, rgba } from '../core/utils.js';
import { hourNow } from '../game/requests.js';
import { busyPlan, pickFor, queueRooms } from '../game/staff.js';
import { fx, g, teamUnlocked } from '../game/state.js';
import { beginDrag, canDrag, deselect } from '../input/input.js';
import { pal } from '../render/palette.js';
import { shapeSVG } from '../render/shapes.js';
import { ovOpen, showHelp } from './overlays.js';

export const el={score:$('#score'),rating:$('#rating'),rfill:$('#rfill'),rbox:$('#ratingBox'),hand:$('#cHand'),prog:$('#cProg'),night:$('#cNight'),cday:$('#cDay'),ctime:$('#cTime'),teams:$('#teams'),hint:$('#hint'),banner:$('#banner'),bT:$('#bTitle'),bS:$('#bSub'),pause:$('#pausePill'),toast:$('#toast'),combo:$('#combo'),comboTx:$('#comboTx')};
function wedge(r,h0,h1){
  const a0=h0/24*TAU,a1=h1/24*TAU,x0=Math.sin(a0)*r,y0=-Math.cos(a0)*r,x1=Math.sin(a1)*r,y1=-Math.cos(a1)*r;
  const large=((h1-h0+24)%24)>12?1:0;
  return `M0 0L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}
function initClock(){
  el.night.setAttribute('d',wedge(26.5,23,7));
  let s='';for(let h=0;h<24;h+=3){const a=h/24*TAU,r0=h%6===0?20.5:22.5,r1=25.5;s+=`<line class="ctk" x1="${(Math.sin(a)*r0).toFixed(2)}" y1="${(-Math.cos(a)*r0).toFixed(2)}" x2="${(Math.sin(a)*r1).toFixed(2)}" y2="${(-Math.cos(a)*r1).toFixed(2)}"/>`;}
  $('#cTicks').innerHTML=s;
}
export const hud={};
let hintTO=0,bannerTO=0,toastTO=0;
export function hint(html,ms=6000){el.hint.innerHTML=html;el.hint.classList.add('show');clearTimeout(hintTO);hintTO=setTimeout(()=>el.hint.classList.remove('show'),ms);}
export function banner(t,s,ms){el.bT.textContent=t;el.bS.innerHTML=s;el.banner.classList.add('show');clearTimeout(bannerTO);bannerTO=setTimeout(()=>el.banner.classList.remove('show'),ms);}
export function toast(html,ms){el.toast.innerHTML=html;el.toast.classList.add('show');clearTimeout(toastTO);toastTO=setTimeout(()=>el.toast.classList.remove('show'),ms);AU.rush();}
export function bumpScore(){el.score.classList.remove('bump');void el.score.offsetWidth;el.score.classList.add('bump');}
export function comboPop(){el.combo.classList.remove('pop');void el.combo.offsetWidth;el.combo.classList.add('pop');}
export function hitRating(){el.rbox.classList.remove('hit');void el.rbox.offsetWidth;el.rbox.classList.add('hit');setTimeout(()=>el.rbox.classList.remove('hit'),600);}
export function ensureChips(){
  for(const k of ORDER){
    if(!teamUnlocked(k)||el.teams.querySelector(`[data-team="${k}"]`))continue;
    const c=document.createElement('div');c.className='chip';c.dataset.team=k;
    c.innerHTML=`<div class="tk" style="background:${TEAMS[k].color}">${shapeSVG(TEAMS[k].shape,'#fff',15,12)}<span class="bd">0/0</span></div><div class="nm">${TEAMS[k].name}</div>`;
    c.addEventListener('pointerdown',ev=>{
      ev.preventDefault();AU.init();if(!canDrag())return;
      let st=pickFor(k);
      if(!st&&g.sel&&g.sel.team===k)st=g.sel;
      if(!st){const busy=g.staff.filter(s=>s.team===k&&busyPlan(s)).sort((a,b)=>queueRooms(a).length-queueRooms(b).length)[0];st=busy||null;}
      if(!st){c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');AU.no();return;}
      beginDrag(st,ev);
    });
    const nextEl=[...el.teams.children].find(o=>ORDER.indexOf(o.dataset.team)>ORDER.indexOf(k));
    el.teams.insertBefore(c,nextEl||null);
  }
}
export function updateHUD(){
  if(!g)return;
  if(Math.abs(pal.t-(hud.nt??-1))>.008){
    hud.nt=pal.t;const r=document.documentElement.style;
    r.setProperty('--bg',rgba(pal.bg));r.setProperty('--ink',rgba(pal.ink));r.setProperty('--muted',rgba(pal.muted));r.setProperty('--chip',rgba(pal.chip));r.setProperty('--veil',rgba(pal.bg,lerp(.5,.3,pal.night)));
    document.querySelector('meta[name=theme-color]').setAttribute('content',`rgb(${pal.bg.map(v=>v|0).join(',')})`);
  }
  if(g.mode!=='play')return;
  if(!fx.coins.length)g.shown=g.score;
  if(hud.s!==g.shown){hud.s=g.shown;el.score.textContent=g.shown;}
  const rt=fmt1(g.rating);if(hud.r!==rt){hud.r=rt;el.rating.textContent=rt;el.rfill.style.width=(g.rating/5*100).toFixed(1)+'%';el.rbox.classList.toggle('low',g.rating<3.2);}
  const cOn=g.combo>=2&&g.time-g.lastDone<8&&g.phase==='day';
  if(hud.c!==cOn){hud.c=cOn;el.combo.classList.toggle('show',cOn);}
  if(cOn&&hud.cn!==g.combo){hud.cn=g.combo;el.comboTx.textContent=`SERİ ×${g.combo}`;}
  const h=hourNow(),deg=(h/24*360).toFixed(2);
  if(hud.deg!==deg){hud.deg=deg;el.hand.setAttribute('transform',`rotate(${deg})`);el.prog.setAttribute('d',h>7.01?wedge(26.5,7,h):'');}
  const mins=Math.floor(h*60/10)*10,ts=`${String(Math.floor(mins/60)%24).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  if(hud.ts!==ts){hud.ts=ts;el.ctime.textContent=ts;}
  const da=DAY_ABBR[(g.day-1)%7];if(hud.da!==da){hud.da=da;el.cday.textContent=da;}
  for(const c of el.teams.children){
    const k=c.dataset.team,mine=g.staff.filter(s=>s.team===k),idle=mine.filter(s=>s.state==='idle').length,txt=`${idle}/${mine.length}`;
    if(c._t!==txt){c._t=txt;c.querySelector('.bd').textContent=txt;c.classList.toggle('empty',idle===0);}
  }
  const ps=g.speed===0&&g.phase==='day'&&!ovOpen;
  if(hud.ps!==ps){hud.ps=ps;el.pause.classList.toggle('show',ps);if(ps)el.toast.classList.remove('show');}
}
export function setSpeed(s){
  if(!g)return;g.speed=s;if(s>0)g.lastSpeed=s;
  $('#bPause').classList.toggle('on',s===0);$('#b1').classList.toggle('on',s===1);$('#b2').classList.toggle('on',s===2);
}
export function muteIcon(){$('#bMute').innerHTML=AU.on?'<svg viewBox="0 0 14 14"><path d="M2 5h2.2L7.5 2.2v9.6L4.2 9H2z" fill="currentColor"/><path d="M9.6 4.6a3.4 3.4 0 0 1 0 4.8M11.2 3a5.6 5.6 0 0 1 0 8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>':'<svg viewBox="0 0 14 14"><path d="M2 5h2.2L7.5 2.2v9.6L4.2 9H2z" fill="currentColor"/><path d="M9.5 5l3 3M12.5 5l-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';}

/** DOM hazır olduğunda bir kez çağrılır (main.js). */
export function initHUD(){
  initClock();
  muteIcon();
  $('#bPause').onclick=()=>{AU.init();setSpeed(g.speed===0?(g.lastSpeed||1):0);AU.click();};
  $('#b1').onclick=()=>{AU.init();setSpeed(1);AU.click();};
  $('#b2').onclick=()=>{AU.init();setSpeed(2);AU.click();};
  $('#bHelp').onclick=()=>{AU.init();if(g&&g.mode==='play'&&g.phase==='day')showHelp();};
  $('#bMute').onclick=()=>{AU.init();AU.on=!AU.on;store.set(KEYS.sound,AU.on);muteIcon();AU.click();};
  window.addEventListener('keydown',e=>{
    if(!g||g.mode!=='play'||g.phase!=='day'||ovOpen)return;
    if(e.code==='Space'){e.preventDefault();setSpeed(g.speed===0?(g.lastSpeed||1):0);}
    else if(e.key==='1')setSpeed(1);else if(e.key==='2')setSpeed(2);
    else if(e.key==='Escape')deselect();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&g&&g.mode==='play'&&g.phase==='day')setSpeed(0);});
}
