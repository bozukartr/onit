/**
 * onit — core/utils.js
 * Küçük yardımcılar: matematik, easing, renk, DOM, titreşim.
 */

export const $=s=>document.querySelector(s);
export const TAU=Math.PI*2, PI=Math.PI;
export const clamp=(v,a,b)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const eOut=t=>1-Math.pow(1-t,3);
export const eInOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const eBack=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
export const rnd=(a,b)=>a+Math.random()*(b-a);
export const gauss=(x,c,w)=>Math.exp(-((x-c)*(x-c))/(2*w*w));
export const hex=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};
export const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
export const rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
export const fmt1=x=>x.toFixed(1).replace('.',',');
export function wpick(items,wf){let tot=0;const ws=items.map(i=>{const w=Math.max(0,wf(i));tot+=w;return w;});if(tot<=0)return null;let r=Math.random()*tot;for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i];}return items[items.length-1];}

export const haptic=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}};
