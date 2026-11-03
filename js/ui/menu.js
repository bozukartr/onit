/**
 * onit — ui/menu.js
 * Ana menü: animasyonlu logo, canlı otel demosu üstünde cam panel,
 * kariyer istatistikleri, nasıl oynanır, ses, uygulama yükleme ve
 * yeni sürüm bildirimi.
 *
 * Arka planda game/flow.js → startMenu() gerçek simülasyonu demo yapay
 * zekâsıyla oynatır; kamera menuFreeArea() ile panellerin dışında kalan
 * bölgeye sığdırılır.
 */
import { AU } from '../audio/audio.js';
import { REQ, TEAMS } from '../core/config.js';
import { KEYS, store } from '../core/storage.js';
import { $, clamp, eOut } from '../core/utils.js';
import { newGame } from '../game/flow.js';
import { canInstall, isIOS, onPWA, promptInstall, applyUpdate } from '../pwa/pwa.js';
import { shapeSVG } from '../render/shapes.js';
import { muteIcon } from './hud.js';
import { logoSVG, playLogoIntro } from './logo.js';
import { openOv, closeOv, showHelp } from './overlays.js';

const SIDE_MQ = '(min-width: 900px), (orientation: landscape) and (max-height: 560px)';
let root = null, ui = null, frame = null, bound = false, leaving = false;

/** Menüde kameranın kullanabileceği serbest ekran alanı (px). */
export function menuFreeArea(VW, VH) {
  if (!root || !ui) return null;
  if (frame && frame.w === VW && frame.h === VH) return frame.area;
  const side = window.matchMedia(SIDE_MQ).matches;
  const col = ui.col, head = ui.head, panel = ui.panel;
  let area;
  if (side) {
    const right = col.offsetLeft + col.offsetWidth;
    area = { left: right + 8, right: VW - 16, top: 24, bottom: VH - 24, zoom: 1.04 };
  } else {
    const top = col.offsetTop + head.offsetTop + head.offsetHeight + 14;
    const bottom = col.offsetTop + panel.offsetTop + 26;
    area = { left: 10, right: VW - 10, top, bottom: Math.max(top + 120, bottom), zoom: 1 };
  }
  frame = { w: VW, h: VH, area };
  return area;
}
export const invalidateMenuLayout = () => { frame = null; };

function fmtNum(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + 'B' : String(n); }

function countTo(node, to, delay) {
  if (!to) { node.textContent = '—'; return; }
  const t0 = performance.now() + delay;
  const tick = () => {
    const t = clamp((performance.now() - t0) / 900, 0, 1);
    node.textContent = fmtNum(Math.round(to * eOut(t)));
    if (t < 1) requestAnimationFrame(tick);
  };
  node.textContent = '0';
  requestAnimationFrame(tick);
}

function refreshStats() {
  const best = store.get(KEYS.best, null) || {};
  const st = store.get(KEYS.stats, null) || {};
  const fresh = !best.score && !st.shifts;
  ui.stats.classList.toggle('empty', fresh);
  if (!fresh) {
    countTo(ui.best, best.score || 0, 900);
    countTo(ui.day, Math.max(best.day || 0, st.days || 0), 1000);
    countTo(ui.shifts, st.shifts || 0, 1100);
  }
  const tutDone = store.get(KEYS.tutorial, 0) >= 2;
  ui.playSub.textContent = tutDone ? '1. gün · Pazartesi 07:00' : 'Kısa bir eğitimle başlar';
}

function refreshSound() {
  ui.sound.querySelector('.m-ic').innerHTML = AU.on
    ? '<svg viewBox="0 0 14 14"><path d="M2 5h2.2L7.5 2.2v9.6L4.2 9H2z" fill="currentColor"/><path d="M9.6 4.6a3.4 3.4 0 0 1 0 4.8M11.2 3a5.6 5.6 0 0 1 0 8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 14 14"><path d="M2 5h2.2L7.5 2.2v9.6L4.2 9H2z" fill="currentColor"/><path d="M9.5 5l3 3M12.5 5l-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  ui.sound.querySelector('.m-lb').textContent = AU.on ? 'Ses açık' : 'Ses kapalı';
  ui.sound.setAttribute('aria-pressed', String(AU.on));
}

function refreshInstall() { ui.install.hidden = !canInstall(); }

function showIOSInstall() {
  openOv(`<div class="card">
    <div class="eyebrow">ANA EKRANA EKLE</div>
    <h2>onit'i uygulama gibi oyna</h2>
    <ol class="how ios">
      <li><span class="n">1</span><span>Safari'de alttaki <b>Paylaş</b> düğmesine dokun <svg class="ios-ic" viewBox="0 0 20 20"><path d="M10 2v11M6 6l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 9H4v9h12V9h-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span></li>
      <li><span class="n">2</span><span><b>Ana Ekrana Ekle</b>'yi seç.</span></li>
      <li><span class="n">3</span><span>onit tam ekran açılır ve <b>çevrimdışı</b> da çalışır.</span></li>
    </ol>
    <button class="cta" id="iosOk">Tamam</button>
  </div>`);
  $('#iosOk').onclick = () => { AU.click(); closeOv(); };
}

function buildTeams() {
  ui.teams.innerHTML = REQ.map((k, i) => {
    const t = TEAMS[k];
    return `<li style="--i:${i};--c:${t.color}" title="${t.long}"><span class="m-tk">${shapeSVG(t.shape, '#fff', 13, 12)}</span><span class="m-tn">${t.name}</span></li>`;
  }).join('');
}

function bind() {
  if (bound) return; bound = true;
  ui.play.addEventListener('click', () => {
    if (leaving) return; leaving = true;
    AU.init(); AU.click();
    root.classList.add('m-out');
    newGame();
  });
  ui.how.addEventListener('click', () => { AU.init(); AU.click(); showHelp({ fromMenu: true }); });
  ui.sound.addEventListener('click', () => {
    AU.init(); AU.on = !AU.on; store.set(KEYS.sound, AU.on); refreshSound(); muteIcon(); AU.click();
  });
  ui.install.addEventListener('click', async () => {
    AU.init(); AU.click();
    const r = await promptInstall();
    if (r === 'ios' || (r === 'unavailable' && isIOS())) showIOSInstall();
    refreshInstall();
  });
  ui.update.addEventListener('click', () => { ui.update.disabled = true; applyUpdate(); });
  /* klavye: Enter → oyna */
  window.addEventListener('keydown', e => {
    if (!document.body.classList.contains('menu') || leaving || document.querySelector('#ov.show')) return;
    if (e.key === 'Enter' && document.activeElement === document.body) { e.preventDefault(); ui.play.click(); }
  });
  ui.logo.addEventListener('click', () => { AU.init(); playLogoIntro(ui.logo.querySelector('svg')); });
  onPWA('installable', refreshInstall);
  onPWA('installed', refreshInstall);
  onPWA('update-ready', () => { ui.update.hidden = false; requestAnimationFrame(() => ui.update.classList.add('show')); });
  window.addEventListener('resize', invalidateMenuLayout);
  window.addEventListener('orientationchange', invalidateMenuLayout);
}

export function initMenu() {
  root = $('#menu');
  ui = {
    col: $('#menu .m-col'), head: $('#menu .m-head'), panel: $('#mPanel'), logo: $('#mLogo'),
    teams: $('#mTeams'), play: $('#mPlay'), playSub: $('#mPlaySub'), how: $('#mHow'), sound: $('#mSound'),
    install: $('#mInstall'), stats: $('#menu .m-stats'), update: $('#mUpdate'), best: $('#msBest'), day: $('#msDay'), shifts: $('#msShifts'),
  };
  ui.logo.innerHTML = logoSVG({ animated: true }) + '<span class="sr">onit</span>';
  buildTeams();
  bind();
}

/** Ana menüyü gösterir (oyun akışı startMenu() tarafından çağrılır). */
export function showMenu() {
  if (!root) initMenu();
  leaving = false;
  root.classList.remove('m-out', 'm-in');
  void root.offsetWidth;
  root.classList.add('m-in');
  root.removeAttribute('inert');
  invalidateMenuLayout();
  refreshStats(); refreshSound(); refreshInstall();
  playLogoIntro(ui.logo.querySelector('svg'), { delay: 180 });
}

export function hideMenu() {
  if (!root) return;
  root.setAttribute('inert', '');
}
