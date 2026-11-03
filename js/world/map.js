/**
 * onit — world/map.js
 * Tile haritası: oluşturma, kademeli açılma, kenarlar ve BFS yol bulma.
 */
import { GH, GW } from '../core/config.js';
import { TAU, rnd } from '../core/utils.js';
import { g } from '../game/state.js';

export let tiles=[], grid=[], edges=[], decor=[];
const pathCache=new Map();
export const at=(x,y)=>(x<0||y<0||x>=GW||y>=GH)?null:grid[x+y*GW];
const isWalkType=t=>!!t&&(t.type==='corr'||t.type==='lobby');
export const isWalk=t=>isWalkType(t)&&t.unlocked;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
export const center=t=>({x:t.x+.5,y:t.y+.5});
export const interior=r=>({x:r.door.x+.5+(r.x-r.door.x)*.6,y:r.door.y+.5+(r.y-r.door.y)*.6});

export function buildMap(){
  tiles=[];grid=new Array(GW*GH).fill(null);
  const add=(x,y,type,day,ex)=>{const t=Object.assign({id:tiles.length,x,y,type,day,unlocked:false,appear:1e9,requests:[],shake:0,flash:0,bumpT:-9,puffed:false,lit:Math.random()<.72,lightAt:rnd(.12,.8)},ex||{});tiles.push(t);grid[x+y*GW]=t;return t;};
  for(let y=12;y<=13;y++)for(let x=4;x<=6;x++)add(x,y,'lobby',1);
  add(5,11,'corr',1);
  for(let x=1;x<=6;x++)add(x,10,'corr',1);
  for(let x=7;x<=9;x++)add(x,10,'corr',2);
  for(const x of[1,2,3]){add(x,9,'room',1);add(x,11,'room',1);}
  for(const x of[7,8,9]){add(x,9,'room',2);add(x,11,'room',2);}
  add(4,11,'dept',1,{team:'H',dx:4,dy:10});
  add(6,11,'dept',1,{team:'K',dx:6,dy:10});
  add(6,9,'dept',2,{team:'T',dx:6,dy:10});
  add(4,9,'dept',99,{team:'J',dx:4,dy:10});
  for(let y=6;y<=9;y++)add(5,y,'corr',3);
  for(let x=1;x<=9;x++)if(x!==5)add(x,6,'corr',3);
  for(const x of[1,2,3,7,8,9])add(x,7,'room',3);
  add(3,13,'dept',3,{team:'B',dx:4,dy:13});
  for(const x of[1,2,3,7,8,9])add(x,5,'room',4,{vip:x===8});
  for(let y=2;y<=5;y++)add(5,y,'corr',5);
  for(let x=1;x<=9;x++)if(x!==5)add(x,2,'corr',5);
  for(const x of[1,2,3,7,8,9])add(x,3,'room',5,{vip:x===2});
  add(7,13,'dept',5,{team:'G',dx:6,dy:13});
  for(const x of[1,2,3,5,7,8,9])add(x,1,'room',6,{vip:x===2||x===8||x===5,suite:x===5});
  for(let y=2;y<=10;y++){add(0,y,'corr',99,{svc:'W'});add(10,y,'corr',99,{svc:'E'});}
  for(const t of tiles){
    if(t.type==='dept')t.door=at(t.dx,t.dy);
    else if(t.type==='room'){for(const[dx,dy]of[[0,1],[0,-1],[-1,0],[1,0]]){const n=at(t.x+dx,t.y+dy);if(n&&n.type==='corr'&&!n.svc){t.door=n;break;}}}
    if(t.vip)t.lit=true;
  }
  const fl={11:1,9:2,7:3,5:4,3:5,1:6};
  const rooms=tiles.filter(t=>t.type==='room');
  for(const r of rooms){const row=rooms.filter(o=>o.y===r.y).sort((a,b)=>a.x-b.x);r.num=fl[r.y]*100+row.indexOf(r)+1;}
  edges=[];pathCache.clear();
  /* dekor: bahçe, havuz, ağaçlar */
  const D=(k,x,y,day,ex)=>({k,x,y,day,ph:Math.random()*TAU,appear:1e9,...(ex||{})});
  decor=[
    D('tree',1.1,12.7,1,{r:.3}),D('tree',1.9,13.4,1,{r:.24}),D('tree',.55,13.7,1,{r:.2}),D('bush',2.75,12.45,1,{r:.15}),D('bush',2.7,14.15,1,{r:.13}),D('bush',1.1,14.35,1,{r:.12}),
    D('planter',4.62,14.45,1),D('planter',6.38,14.45,1),
    D('pool',8.1,12.22,2,{w:1.8,h:1.28}),D('lounger',8.35,13.85,2),D('lounger',8.95,13.85,2),D('tree',10.25,12.55,2,{r:.3}),D('tree',9.95,13.8,2,{r:.22}),D('bush',7.55,12.3,2,{r:.14}),
    D('tree',4.25,7.55,3,{r:.2}),D('tree',6.75,7.6,3,{r:.22}),D('bush',4.4,8.35,3,{r:.13}),D('bush',6.6,8.4,3,{r:.13}),
    D('tree',4.25,4.45,5,{r:.22}),D('tree',6.75,4.5,5,{r:.2}),D('fountain',5.5,0,99),
    D('tree',.45,.7,6,{r:.26}),D('tree',10.45,.65,6,{r:.3}),D('tree',4.15,.55,6,{r:.17}),D('tree',6.85,.5,6,{r:.19}),D('bush',.4,1.55,6,{r:.13})
  ];
}
function topRow(){return g.day>=5?2:g.day>=3?6:10;}
function shouldUnlock(t){
  if(t.svc)return !!g.owned['corr'+t.svc]&&t.y>=topRow()&&t.y<=10;
  if(t.team==='J')return !!g.owned.joker;
  return t.day<=g.day;
}
export function unlockPass(t0,slow){
  for(const d of decor)if(d.appear>1e8&&d.day<=g.day)d.appear=t0+.6+Math.random()*.7;
  const fresh=tiles.filter(t=>!t.unlocked&&shouldUnlock(t));
  if(!fresh.length)return;
  const old=tiles.filter(t=>t.unlocked&&isWalkType(t));
  fresh.forEach(t=>t.unlocked=true);
  const dist=new Map(),q=[];
  if(old.length)old.forEach(t=>{dist.set(t,0);q.push(t);});
  else{const s=at(5,13);dist.set(s,0);q.push(s);}
  for(let i=0;i<q.length;i++){const c=q[i];for(const[dx,dy]of DIRS){const n=at(c.x+dx,c.y+dy);if(isWalk(n)&&!dist.has(n)){dist.set(n,dist.get(c)+1);q.push(n);}}}
  const step=slow?.075:.055;
  for(const t of fresh)if(isWalkType(t))t.appear=t.type==='lobby'?t0:t0+.2+(dist.get(t)||0)*step;
  for(const t of fresh)if(!isWalkType(t)){const base=t.door.appear>t0?t.door.appear:t0+.15;t.appear=base+.14+Math.random()*.14;}
  rebuildEdges();pathCache.clear();
}
function rebuildEdges(){
  edges=[];
  for(const t of tiles){if(!isWalk(t))continue;
    for(const[dx,dy]of[[1,0],[0,1]]){const n=at(t.x+dx,t.y+dy);if(!isWalk(n))continue;if(t.type==='lobby'&&n.type==='lobby')continue;
      const[a,b]=t.appear<=n.appear?[t,n]:[n,t];edges.push({a,b});}}
}
export function findPath(a,b){
  if(!a||!b)return null;if(a===b)return[a];
  const key=a.id*1000+b.id;if(pathCache.has(key))return pathCache.get(key);
  const prev=new Map([[a,null]]),q=[a];
  for(let i=0;i<q.length;i++){const c=q[i];if(c===b)break;for(const[dx,dy]of DIRS){const n=at(c.x+dx,c.y+dy);if(isWalk(n)&&!prev.has(n)){prev.set(n,c);q.push(n);}}}
  let res=null;if(prev.has(b)){res=[];for(let c=b;c;c=prev.get(c))res.push(c);res.reverse();}
  pathCache.set(key,res);return res;
}
