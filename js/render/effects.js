/**
 * onit — render/effects.js
 * Parçacık efektleri: konfeti, parıltı, toz, uçan yazılar.
 */
import { TAU, rnd } from '../core/utils.js';
import { fx, now } from '../game/state.js';
import { WHITE, pal } from './palette.js';

export function confettiBurst(x,y,col,shape){
  for(let i=0;i<10;i++){const a=rnd(0,TAU),v=rnd(1.4,3);fx.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.2,g:4.5,life:rnd(.45,.75),max:.75,col:i%3?col:WHITE,r:rnd(.035,.06),shape:i%2?shape:'circle',rot:rnd(0,TAU),vr:rnd(-8,8)});}
}
export function sparkle(x,y,col,n){for(let i=0;i<n;i++){const a=rnd(0,TAU),v=rnd(.6,1.6);fx.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0,life:rnd(.5,.9),max:.9,col,r:rnd(.04,.07),shape:'star',rot:0,vr:rnd(-4,4)});}}
export function puff(x,y){for(let i=0;i<6;i++){const a=rnd(0,TAU),v=rnd(.4,1);fx.parts.push({x:x+Math.cos(a)*.35,y:y+Math.sin(a)*.35,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0,life:rnd(.35,.6),max:.6,col:pal.lane,r:rnd(.05,.09),shape:'circle'});}}
export function floatText(x,y,text,color,size,kind){fx.floats.push({x,y,text,color,size,t0:now,dur:kind==='bubble'?.9:kind==='combo'?1.4:1.25,kind:kind||''});}
