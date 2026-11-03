/**
 * onit — ui/overlays.js
 * Katmanlar: nasıl oynanır, gün sonu özeti, oyun sonu, perde geçişi.
 */
import { AU } from '../audio/audio.js';
import { ORDER, REQ, TEAMS, dayName } from '../core/config.js';
import { KEYS, recordShift, store } from '../core/storage.js';
import { $, clamp, eOut, fmt1, rnd } from '../core/utils.js';
import { chooseEvent, dayInfo, startDay } from '../game/day.js';
import { newGame, startMenu } from '../game/flow.js';
import { g, teamUnlocked } from '../game/state.js';
import { describeUpg, genPicks } from '../game/upgrades.js';
import { clearSave, saveCheckpoint } from '../game/save.js';
import { rq, tok } from '../render/shapes.js';
import { hud } from './hud.js';

const ov=$('#ov');export let ovOpen=false;
export function openOv(html,cls){ov.className='ov'+(cls?' '+cls:'');ov.innerHTML=html;delete ov.dataset.lock;void ov.offsetWidth;ov.classList.add('show');ovOpen=true;}
export function closeOv(){ov.classList.remove('show');ovOpen=false;const h=ov.innerHTML;setTimeout(()=>{if(!ovOpen&&ov.innerHTML===h)ov.innerHTML='';},500);}
function countUp(root){
  root.querySelectorAll('[data-to]').forEach((n,i)=>{
    const to=parseFloat(n.dataset.to),dec=+(n.dataset.dec||0),t0=performance.now()+250+i*90;
    const fmt=v=>dec?v.toFixed(dec).replace('.',','):Math.round(v);
    n.textContent=fmt(0);
    const tick=()=>{const t=clamp((performance.now()-t0)/750,0,1),v=to*eOut(t);n.textContent=fmt(v);if(t<1)requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  });
}
function confettiHTML(n=46){
  const cols=ORDER.map(k=>TEAMS[k].color).concat(['#F4B63A','#F4B63A']);
  let s='<div class="confetti">';
  for(let i=0;i<n;i++)s+=`<i class="${i%3===0?'r':''}" style="--x:${rnd(2,96).toFixed(1)}%;--c:${cols[i%cols.length]};--d:${rnd(.15,.9).toFixed(2)}s;--t:${rnd(1.5,2.4).toFixed(2)}s;--dx:${rnd(-70,70).toFixed(0)}px;--r:${rnd(-540,540).toFixed(0)}deg"></i>`;
  return s+'</div>';
}

function howHTML(){
  return `<ul class="how">
    <li><span class="n">1</span><span>Odalarda beliren <b>şekiller</b> misafir talepleridir. Şekil, hangi ekibin gerektiğini söyler.</span></li>
    <li><span class="n">2</span><span>Personeli odaya <b>sürükle</b>. Bırakmadan birkaç odadan geçersen tek bir <b>rota</b> olur. Ya da personele <b>dokun</b>, sonra odalara dokun.</span></li>
    <li><span class="n">3</span><span><b>Yoldaki</b> personeli sürükle ya da seçip odaya dokun: yeni durak rotanın <b>sonuna eklenir</b>. Personeli kendi üssüne bırakırsan rota iptal olur.</span></li>
    <li><span class="n">4</span><span>Oda çevresindeki çizgi <b>sabrı</b> gösterir. Hızlı işler <b>seri</b> yapar; şikayetler puanı düşürür. <b>2,5★</b> altı = vardiya biter.</span></li>
  </ul>
  <div class="legend">${REQ.map(k=>`<span>${rq(k,13)}→${tok(k,22)}<i style="font-style:normal">${TEAMS[k].long}</i></span>`).join('')}</div>`;
}

export function showHelp({fromMenu=false}={}){
  const inRun=!fromMenu&&g&&g.mode==='play';
  openOv(`<div class="card"><div class="eyebrow">NASIL OYNANIR</div>${howHTML()}
    <button class="cta" id="resume">${fromMenu?'Anladım':'Devam et'}</button>
    ${inRun?'<button class="ghostbtn" id="quit">Ana menüye dön · kaldığın günün başından devam edersin</button>':''}
    ${fromMenu&&store.get(KEYS.tutorial,0)>=2?'<button class="ghostbtn" id="retut">Eğitimi yeniden oynat</button>':''}
  </div>`);
  $('#resume').onclick=()=>{AU.click();closeOv();};
  const q=$('#quit');if(q)q.onclick=()=>{AU.click();closeOv();curtain(()=>startMenu());};
  const r=$('#retut');if(r)r.onclick=()=>{store.set(KEYS.tutorial,0);r.textContent='Eğitim bir sonraki vardiyada oynanacak ✓';r.disabled=true;};
}
export function showSummary(){
  if(!g||g.phase!=='night')return;
  const d=g.day,S=g.dayStats,dr=g.rating-S.r0;
  /* kayıttan dönülüyorsa aynı olay + aynı seçenekler */
  const plan=g.summaryPlan||{nextEvent:chooseEvent(d+1),picks:genPicks()};g.summaryPlan=null;
  g.nextEvent=plan.nextEvent;
  const ch=plan.picks.map(describeUpg);
  saveCheckpoint('summary',{dayStats:S,nextEvent:plan.nextEvent?plan.nextEvent.name:null,picks:plan.picks});
  const perfect=S.complaints===0&&S.served>=5;
  const row=ORDER.filter(k=>teamUnlocked(k)).map(k=>`<div class="tm">${tok(k,20)}<b>${S.byTeam[k]||0}</b></div>`).join('');
  const ev=g.nextEvent?`<div class="evt"><b>${g.nextEvent.name}</b> · ${g.nextEvent.desc}</div>`:'';
  const bdg=[];
  if(perfect)bdg.push(`<span class="badge gold" style="--d:.5s">★ KUSURSUZ GÜN</span>`);
  if(S.bestCombo>=3)bdg.push(`<span class="badge soft" style="--d:.6s">En uzun seri ×${S.bestCombo}</span>`);
  openOv(`<div class="card">${perfect?confettiHTML():''}
    <div class="eyebrow">${dayName(d)} · ${d}. GÜN</div>
    <h2>Vardiya tamamlandı</h2>
    <div class="stats">
      <div><b data-to="${S.served}">0</b><span>talep</span></div>
      <div><b data-to="${S.complaints}">0</b><span>şikayet</span></div>
      <div><b><span data-to="${g.rating.toFixed(1)}" data-dec="1" style="font:inherit;letter-spacing:0;color:inherit;text-transform:none">0</span><em>★</em></b><span class="${dr>=-.001?'pos':'neg'}">${dr>=-.001?'+':'−'}${fmt1(Math.abs(dr))}</span></div>
    </div>
    ${bdg.length?`<div class="badges">${bdg.join('')}</div>`:''}
    <div class="teamrow">${row}</div>
    <div class="next"><div class="eyebrow">YARIN · ${dayName(d+1)}</div><div class="nx">${dayInfo(d+1,true)}</div>${ev}</div>
    <div class="eyebrow c">BİR GELİŞTİRME SEÇ</div>
    <div class="ups">${ch.map((c,i)=>`<button class="up" data-i="${i}" style="--d:${(.35+i*.08).toFixed(2)}s">${c.icon}<h4>${c.title}</h4><p>${c.desc}</p></button>`).join('')}</div>
  </div>`);
  countUp(ov);
  if(perfect)setTimeout(()=>AU.perfect(),300);
  ov.querySelectorAll('.up').forEach(b=>b.addEventListener('click',()=>{
    if(ov.dataset.lock)return;ov.dataset.lock='1';
    const c=ch[+b.dataset.i];b.classList.add('picked');
    ov.querySelectorAll('.up').forEach(o=>{if(o!==b)o.classList.add('fade');});
    AU.init();AU.pickUp();c.apply();
    setTimeout(()=>{closeOv();startDay(d+1);},560);
  }));
}
export function showOver(){
  clearSave();
  recordShift({served:g.score,days:g.day});
  const best=store.get(KEYS.best,{score:0,day:0});
  /* rekor: bu vardiya başlamadan önceki en iyi skordan yüksekse */
  const isBest=g.score>(g.runBest||0);
  if(g.score>(best.score||0))store.set(KEYS.best,{score:g.score,day:g.day});
  openOv(`<div class="card over">${isBest&&g.score>0?confettiHTML(36):''}
    <div class="eyebrow">${dayName(g.day)} · ${g.day}. GÜN · ${hud.ts||''}</div>
    <h2>Vardiya sona erdi</h2>
    <p class="lead">Otel puanı kritik seviyenin altına indi: <b>${fmt1(g.rating)}★</b>. Genel müdür operasyonu devraldı.</p>
    <div class="stats">
      <div><b data-to="${g.day}">0</b><span>gün</span></div>
      <div><b data-to="${g.score}">0</b><span>talep</span></div>
      <div><b data-to="${g.complaints}">0</b><span>şikayet</span></div>
    </div>
    ${isBest&&g.score>0?'<div class="nb">YENİ REKOR</div>':best.score?`<div class="best">En iyi: <b>${Math.max(best.score,g.score)}</b> talep · ${best.day}. gün</div>`:''}
    <button class="cta" id="again">Yeni vardiya</button>
    <button class="ghostbtn" id="toMenu">Ana menü</button>
  </div>`);
  countUp(ov);
  $('#again').onclick=()=>{AU.click();newGame();};
  $('#toMenu').onclick=()=>{AU.click();curtain(()=>startMenu());};
}
/* dairesel perde: verilen noktadan (yoksa ekran ortasından) açılır, ortada kapanır */
let curtainAt=null;
export const setCurtainOrigin=(x,y)=>{curtainAt={x,y};};
export function curtain(fn){
  const c=$('#curtain'),p=curtainAt;curtainAt=null;
  c.style.setProperty('--cx',p?p.x+'px':'50%');c.style.setProperty('--cy',p?p.y+'px':'50%');
  c.classList.add('on');
  setTimeout(()=>{fn();c.style.setProperty('--cx','50%');c.style.setProperty('--cy','50%');
    setTimeout(()=>requestAnimationFrame(()=>c.classList.remove('on')),120);},470);
}
