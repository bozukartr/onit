/**
 * onit — ui/logo.js
 * Onaylı logonun (assets/logo.png) vektör karşılığı + açılış animasyonu.
 *
 * Geometri logo.png'nin 1254×1254 koordinatlarında çizildi; viewBox yalnızca
 * yazı + noktayı kırpar. Harfler currentColor kullanır → tema rengini alır.
 * Animasyon: harfler sırayla yaylanır, turuncu nokta "i"nin üstünde belirir,
 * esneyip kalkar, kesikli izi bırakarak sağ üstteki yerine kayar.
 */
import { clamp, eBack, eInOut, eOut } from '../core/utils.js';

export const BRAND = { ink: '#26282E', cream: '#F3EEE4', dot: '#E89B13', night: '#1B1E27', inkNight: '#ECE8E1' };
export const LOGO_VIEWBOX = '220 380 812 428';

const TRAIL = 'M766 528Q778 476 828 452';
const MOTION = 'M767 512Q774 470 828 452Q852 444 875 430';
const DOT = { x: 875, y: 430, r: 40 };
let uid = 0;

/** Satır içi SVG logo. `animated` ise başlangıç durumunda (gizli) üretilir. */
export function logoSVG({ cls = '', animated = false, label = 'onit' } = {}) {
  const id = `lgm${++uid}`;
  return `<svg class="onit-logo${animated ? ' lg-anim' : ''} ${cls}" viewBox="${LOGO_VIEWBOX}" role="img" aria-label="${label}">
  <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="700" y="380" width="260" height="200"><path class="lg-reveal" d="${TRAIL}" fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round"/></mask></defs>
  <g fill="none" stroke="currentColor" stroke-width="78" stroke-linecap="round" stroke-linejoin="round">
    <g class="lg-l" style="--i:0"><circle cx="356" cy="672" r="86"/></g>
    <g class="lg-l" style="--i:1"><path d="M530 758V660a71 71 0 0 1 142 0v98"/></g>
    <g class="lg-l" style="--i:2"><path d="M768 597v161"/></g>
    <g class="lg-l" style="--i:3"><path d="M887 546v142a70 70 0 0 0 70 70q14 0 26-6"/><path d="M855 598h127"/></g>
  </g>
  <path class="lg-trail" d="${TRAIL}" mask="url(#${id})" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-dasharray="14 24"/>
  <path class="lg-motion" d="${MOTION}" fill="none" stroke="none"/>
  <ellipse class="lg-dot" cx="${DOT.x}" cy="${DOT.y}" rx="${DOT.r}" ry="${DOT.r}" fill="${BRAND.dot}"/>
</svg>`;
}

const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Açılış animasyonunu oynatır. Tekrar çağrılırsa baştan başlar.
 * @param {SVGSVGElement} svg logoSVG({animated:true}) ile üretilmiş öğe
 * @param {{delay?:number,onLand?:Function}} opt
 */
export function playLogoIntro(svg, { delay = 0, onLand } = {}) {
  if (!svg) return;
  const dot = svg.querySelector('.lg-dot'), motion = svg.querySelector('.lg-motion'), reveal = svg.querySelector('.lg-reveal');
  const ML = motion.getTotalLength(), RL = reveal.getTotalLength();
  const place = (x, y, sx = 1, sy = 1) => { dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('rx', DOT.r * sx); dot.setAttribute('ry', DOT.r * sy); };
  reveal.style.strokeDasharray = `${RL} ${RL}`;
  const setReveal = f => { reveal.style.strokeDashoffset = String(RL * (1 - f)); };

  svg._lgRun = (svg._lgRun || 0) + 1;
  const run = svg._lgRun;
  svg.classList.remove('lg-in'); void svg.getBoundingClientRect(); svg.classList.add('lg-in');

  if (reduceMotion()) { place(DOT.x, DOT.y); setReveal(1); svg.classList.add('lg-done'); onLand && onLand(); return; }
  svg.classList.remove('lg-done');

  const start = motion.getPointAtLength(0);
  place(start.x, start.y, 0, 0); setReveal(0);
  const T = { pop: 420, popD: 320, crouch: 820, launch: 980, fly: 560, settle: 650 };
  let t0 = null, landed = false;
  const tick = ms => {
    if (svg._lgRun !== run || !svg.isConnected) return;
    if (t0 == null) t0 = ms + delay;
    const t = ms - t0;
    if (t < T.pop) { place(start.x, start.y, 0, 0); }
    else if (t < T.crouch) { const s = eBack(clamp((t - T.pop) / T.popD, 0, 1)); place(start.x, start.y, s, s); }
    else if (t < T.launch) { /* esneyip çömel */
      const k = Math.sin(clamp((t - T.crouch) / (T.launch - T.crouch), 0, 1) * Math.PI);
      place(start.x, start.y + 10 * k, 1 + .16 * k, 1 - .2 * k);
    } else if (t < T.launch + T.fly) { /* yola çık */
      const f = eInOut(clamp((t - T.launch) / T.fly, 0, 1)), p = motion.getPointAtLength(ML * f);
      const st = Math.sin(f * Math.PI) * .14;
      place(p.x, p.y, 1 - st, 1 + st);
      setReveal(clamp(f / .78, 0, 1));
    } else { /* in + sönümlü yay */
      if (!landed) { landed = true; setReveal(1); onLand && onLand(); }
      const u = (t - T.launch - T.fly) / T.settle;
      if (u >= 1) { place(DOT.x, DOT.y); svg.classList.add('lg-done'); return; }
      const w = Math.exp(-u * 5) * Math.cos(u * 14) * .22 * (1 - eOut(u) * .2);
      place(DOT.x, DOT.y + 4 * w, 1 + w, 1 - w);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
