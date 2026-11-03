/**
 * onit — game/state.js
 * Oyun durumu (g), zaman (now) ve efekt havuzları (fx).
 */
import { buildMap, tiles } from '../world/map.js';

export let g=null, now=performance.now()/1000;
/** Kare başına ana döngü tarafından güncellenir (saniye). */
export const setNow=t=>{now=t;};
export const fx={parts:[],floats:[],ghosts:[],ripples:[],coins:[]};
export function newState(mode){
  g={mode,phase:'day',day:1,dayT:0,time:0,speed:1,lastSpeed:1,rating:5,score:0,shown:0,complaints:0,
     staff:[],rooms:[],maxStops:3,owned:{},spd:{},trn:{},pat:0,event:null,nextEvent:null,
     spawnT:2,pending:[],drag:null,sel:null,dayStats:null,tut:null,guests:[],guestT:1.2,
     nightT:0,nightTarget:0,demoT:0,guide:null,kPos:.2,sid:0,rid:0,served:0,
     combo:0,lastDone:-99,shake:0,redFlash:0,rushDone:{},seen:{}};
  buildMap();g.rooms=tiles.filter(t=>t.type==='room');
  for(const k in fx)fx[k].length=0;
}
export const teamUnlocked=k=>g.staff.some(s=>s.team===k);
export const matches=(st,q)=>st.team==='J'||st.team===q.type;
export const speedMul=k=>1+.25*(g.spd[k]||0);
