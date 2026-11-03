/**
 * onit — game/upgrades.js
 * Gün sonu geliştirmeleri: ikonlar, açıklamalar, rastgele seçim.
 */
import { REQ, TEAMS } from '../core/config.js';
import { rgba, wpick } from '../core/utils.js';
import { addStaff } from './staff.js';
import { g, now, teamUnlocked } from './state.js';
import { shapeD } from '../render/shapes.js';
import { ensureChips } from '../ui/hud.js';

const ICON={
  hire:k=>{const t=TEAMS[k];return `<svg viewBox="0 0 44 44"><circle cx="20" cy="26.5" r="13" fill="${rgba(t.dark)}"/><circle cx="20" cy="25" r="13" fill="${t.color}"/><path transform="translate(20 25)" d="${shapeD(t.shape,13)}" fill="#fff"/><circle cx="33" cy="11" r="8" fill="#26282E"/><path d="M33 7.2v7.6M29.2 11h7.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;},
  cart:()=>`<svg viewBox="0 0 44 44"><path d="M5 31h9q4 0 4-4v-8q0-4 4-4h9q4 0 4 4v12h4" fill="none" stroke="#26282E" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>${[[9,31],[18,22],[27,15],[35,25]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.3" fill="#fff" stroke="#26282E" stroke-width="2"/>`).join('')}</svg>`,
  spd:k=>{const t=TEAMS[k];return `<svg viewBox="0 0 44 44"><path d="M5 17h12M3 23h13M6 29h11" stroke="${t.color}" stroke-width="3" stroke-linecap="round" opacity=".55"/><circle cx="28" cy="24.5" r="11" fill="${rgba(t.dark)}"/><circle cx="28" cy="23" r="11" fill="${t.color}"/><path transform="translate(28 23)" d="${shapeD(t.shape,11)}" fill="#fff"/></svg>`;},
  trn:k=>{const t=TEAMS[k];return `<svg viewBox="0 0 44 44"><circle cx="22" cy="25" r="13" fill="none" stroke="${t.color}" stroke-width="3.4"/><path d="M22 25V17.5M22 25l5 3" stroke="#26282E" stroke-width="2.6" stroke-linecap="round"/><path d="M18 7h8M22 7v5" stroke="#26282E" stroke-width="2.6" stroke-linecap="round"/></svg>`;},
  pat:()=>`<svg viewBox="0 0 44 44"><path d="M22 36s-12.5-7.6-12.5-16.4A7 7 0 0 1 22 15.2a7 7 0 0 1 12.5 4.4C34.5 28.4 22 36 22 36z" fill="#E4513F"/><path d="M15 20a4 4 0 0 1 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/></svg>`,
  corr:s=>{const x=s==='W'?8:36;return `<svg viewBox="0 0 44 44"><path d="M8 10h28M8 22h28M8 34h28" stroke="#DCD3C3" stroke-width="5" stroke-linecap="round"/><path d="M${x} 10V34" stroke="#26282E" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="22" r="3" fill="#26282E" opacity=".25"/></svg>`;}
};
function describeUpg(p){
  switch(p.kind){
    case'hire':return{title:`+1 ${TEAMS[p.k].name}`,desc:`${TEAMS[p.k].long} ekibine yeni personel.`,icon:ICON.hire(p.k),apply(){addStaff(p.k,now+.35);ensureChips();}};
    case'cart':return{title:'Servis Arabası',desc:`Bir personelin sırasında ${g.maxStops+1} oda olabilir.`,icon:ICON.cart(),apply(){g.maxStops++;}};
    case'spd':return{title:'Hızlı Adım',desc:`${TEAMS[p.k].name} ekibi %25 daha hızlı yürür.`,icon:ICON.spd(p.k),apply(){g.spd[p.k]=(g.spd[p.k]||0)+1;}};
    case'trn':return{title:'Ekip Eğitimi',desc:`${TEAMS[p.k].name} işleri %30 daha kısa sürer.`,icon:ICON.trn(p.k),apply(){g.trn[p.k]=(g.trn[p.k]||0)+1;}};
    case'pat':return{title:'Karşılama İkramı',desc:'Misafirlerin sabrı %15 artar.',icon:ICON.pat(),apply(){g.pat++;}};
    case'corr':return{title:`${p.side==='W'?'Batı':'Doğu'} Servis Koridoru`,desc:'Katlar arasında kestirme yol açılır.',icon:ICON.corr(p.side),apply(){g.owned['corr'+p.side]=true;}};
    case'joker':return{title:'Çok Yönlü Eleman',desc:'Her talebe bakar ama %30 yavaş çalışır.',icon:ICON.hire('J'),apply(){g.owned.joker=true;}};
  }
}
export function genChoices(){
  const act=REQ.filter(k=>teamUnlocked(k)),pool=[];
  for(const k of act){const n=g.staff.filter(s=>s.team===k).length;pool.push({w:1+((g.dayStats.req[k]||0)/Math.max(1,n))*.12,kind:'hire',k});}
  if(g.maxStops<5)pool.push({w:1.1,kind:'cart'});
  for(const k of act){if((g.spd[k]||0)<2)pool.push({w:.42,kind:'spd',k});if((g.trn[k]||0)<2)pool.push({w:.42,kind:'trn',k});}
  if(g.pat<2)pool.push({w:.8,kind:'pat'});
  if(g.day>=2){if(!g.owned.corrW)pool.push({w:.7,kind:'corr',side:'W'});if(!g.owned.corrE)pool.push({w:.7,kind:'corr',side:'E'});}
  if(g.day>=2&&!g.owned.joker)pool.push({w:.65,kind:'joker'});
  const out=[wpick(pool.filter(p=>p.kind==='hire'),p=>p.w)];
  while(out.length<3){
    const rest=pool.filter(p=>!out.includes(p)&&!(p.kind==='corr'&&out.some(o=>o.kind==='corr'))&&!(p.kind==='hire'&&out.filter(o=>o.kind==='hire').length>=2));
    const c=wpick(rest,p=>p.w);if(!c)break;out.push(c);
  }
  return out.filter(Boolean).map(describeUpg);
}
