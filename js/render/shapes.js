/**
 * onit — render/shapes.js
 * Talep şekilleri: canvas path, SVG path ve HTML jeton üreticileri.
 */
import { TEAMS } from '../core/config.js';
import { PI, TAU } from '../core/utils.js';

export function rrect(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
export function rrRing(c,x,y,w,h,r){
  c.moveTo(x+w/2,y);c.lineTo(x+w-r,y);c.arc(x+w-r,y+r,r,-PI/2,0);c.lineTo(x+w,y+h-r);c.arc(x+w-r,y+h-r,r,0,PI/2);
  c.lineTo(x+r,y+h);c.arc(x+r,y+h-r,r,PI/2,PI);c.lineTo(x,y+r);c.arc(x+r,y+r,r,PI,PI*1.5);c.lineTo(x+w/2,y);
}
function polyPts(shape,s){
  if(shape==='triangle'){const R=s*.62,o=s*.09;return [0,1,2].map(i=>{const a=-PI/2+i*TAU/3;return[Math.cos(a)*R,o+Math.sin(a)*R];});}
  if(shape==='diamond'){const R=s*.6;return[[0,-R],[R*.8,0],[0,R],[-R*.8,0]];}
  if(shape==='pentagon'){const R=s*.56;return [0,1,2,3,4].map(i=>{const a=-PI/2+i*TAU/5;return[Math.cos(a)*R,s*.03+Math.sin(a)*R];});}
  if(shape==='star'){const R=s*.62,r=R*.46;return [...Array(10)].map((_,i)=>{const a=-PI/2+i*PI/5,q=i%2?r:R;return[Math.cos(a)*q,s*.03+Math.sin(a)*q];});}
  return null;
}
export function shapePath(c,shape,x,y,s){
  c.beginPath();
  if(shape==='circle'){c.arc(x,y,s*.5,0,TAU);return;}
  if(shape==='square'){const h=s*.42;rrect(c,x-h,y-h,h*2,h*2,s*.09);return;}
  const P=polyPts(shape,s);P.forEach((p,i)=>i?c.lineTo(x+p[0],y+p[1]):c.moveTo(x+p[0],y+p[1]));c.closePath();
}
export function shapeD(shape,s){
  if(shape==='circle'){const r=s*.5;return `M${-r} 0a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;}
  if(shape==='square'){const h=s*.42,r=s*.09;return `M${-h+r} ${-h}H${h-r}Q${h} ${-h} ${h} ${-h+r}V${h-r}Q${h} ${h} ${h-r} ${h}H${-h+r}Q${-h} ${h} ${-h} ${h-r}V${-h+r}Q${-h} ${-h} ${-h+r} ${-h}Z`;}
  return 'M'+polyPts(shape,s).map(p=>p[0].toFixed(2)+' '+p[1].toFixed(2)).join('L')+'Z';
}
export const shapeSVG=(shape,fill,px,s=12)=>`<svg width="${px}" height="${px}" viewBox="-10 -10 20 20" aria-hidden="true"><path d="${shapeD(shape,s)}" fill="${fill}"/></svg>`;
export const tok=(k,px)=>`<span class="tok" style="width:${px}px;height:${px}px;background:${TEAMS[k].color}">${shapeSVG(TEAMS[k].shape,'#fff',Math.round(px*.62),11)}</span>`;
export const rq=(k,px=13)=>`<span class="rq">${shapeSVG(TEAMS[k].shape,'currentColor',px,15)}</span>`;
