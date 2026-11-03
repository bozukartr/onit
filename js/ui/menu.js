/**
 * onit — ui/menu.js
 * Ana menü = oyun başlık ekranı.
 *  - Arkada gerçek simülasyon demo yapay zekâsıyla oynar (game/flow.js → startMenu);
 *    kamera menuFreeArea() ile logo ve düğme arasında kalan alana, hafif yakın plan sığar.
 *  - Büyük 3B "OYNA" / "DEVAM ET" düğmesi (kayıt varsa gün etiketi), köşe ikonları
 *    (yükle, ses, nasıl oynanır), rekor kupası, yeni sürüm bildirimi.
 *  - Düğme sesleri menüde de çalar (AU.ui); oyuna geçiş düğmeden açılan dairesel perdeyle.
 */
import { AU } from '../audio/audio.js';
import { DAY_NAMES } from '../core/config.js';
import { KEYS, store } from '../core/storage.js';
import { $, fmt1, haptic } from '../core/utils.js';
import { continueGame, newGame } from '../game/flow.js';
import { loadSave } from '../game/save.js';
import { canInstall, isIOS, onPWA, promptInstall, applyUpdate } from '../pwa/pwa.js';
import { muteIcon } from './hud.js';
import { logoSVG, playLogoIntro } from './logo.js';
import { openOv, closeOv, setCurtainOrigin, showHelp } from './overlays.js';

const SIDE_MQ = '(orientation: landscape) and (max-height: 560px), (min-width: 900px) and (min-aspect-ratio: 5/4)';
let root = null, ui = null, frame = null, bound = false, leaving = false;

const ICON_SOUND_ON = '<svg viewBox="0 0 14 14"><path d="M2 5h2.2L7.5 2.2v9.6L4.2 9H2z" fill="currentColor"/><path d="M9.6 4.6a3.4 3.4 0 0 1 0 4.8M11.2 3a5.6 5.6 0 0 1 0 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 14 14"><path d="M2 5h2.2L7.5 2.2v9.6L4.2 9H2z" fill="currentColor"/><path d="M9.5 5l3 3M12.5 5l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/** Menüde kameranın kullanabileceği ekran alanı (px). */
export function menuFreeArea(VW, VH) {
  if (!root || !ui) return null;
  if (frame && frame.w === VW && frame.h === VH) return frame.area;
  let area;
  if (window.matchMedia(SIDE_MQ).matches) {
    const right = ui.col.offsetLeft + ui.col.offsetWidth;
    const short = VH <= 560;
    area = { left: right - 30, right: VW - 10, top: short ? 50 : 70, bottom: VH - (short ? 8 : 24), zoom: short ? 1.02 : 1.06 };
  } else {
    /* logo ile düğme arası; perdelerin altına biraz taşar → tam ekran sahne hissi */
    const top = ui.col.offsetTop + ui.head.offsetTop + ui.head.offsetHeight + 4;
    const bottom = ui.col.offsetTop + ui.cta.offsetTop + 34;
    area = { left: 0, right: VW, top, bottom: Math.max(top + 140, bottom), zoom: 1.04 };
  }
  frame = { w: VW, h: VH, area };
  return area;
}
export const invalidateMenuLayout = () => { frame = null; };

function refreshCTA() {
  const best = store.get(KEYS.best, null) || {};
  const st = store.get(KEYS.stats, null) || {};
  const day = Math.max(best.day || 0, st.days || 0);
  ui.trophy.hidden = !best.score;
  ui.best.textContent = best.score || 0;
  ui.day.textContent = day ? `· ${day}. gün` : '';

  const save = loadSave();
  ui.newRun.hidden = !save; resetNewRun();
  ui.badge.hidden = !save;
  if (save) {
    ui.playTitle.textContent = 'DEVAM ET';
    ui.badge.textContent = save.at === 'summary' ? `${save.day}. GÜN SONU` : `${save.day}. GÜN`;
    ui.playSub.textContent = `${DAY_NAMES[(save.day - 1) % 7]} · ${save.score} talep · ${fmt1(save.rating)}★`;
  } else {
    const tutDone = store.get(KEYS.tutorial, 0) >= 2;
    ui.playTitle.textContent = 'OYNA';
    ui.playSub.textContent = tutDone ? '1. gün · Pazartesi 07:00' : 'Kısa bir eğitimle başlar';
  }
}

/* "Yeni vardiya" iki dokunuşla onaylanır: kayıtlı vardiya silinir */
let newRunTO = 0;
function resetNewRun() {
  clearTimeout(newRunTO);
  ui.newRun.classList.remove('warn');
  ui.newRun.textContent = 'Yeni vardiya başlat';
}

function startRun(fn) {
  if (leaving) return; leaving = true;
  AU.init(); AU.ui('start'); haptic(12);
  const r = ui.play.getBoundingClientRect();
  setCurtainOrigin(r.left + r.width / 2, r.top + r.height / 2);
  ui.play.classList.add('press');
  setTimeout(() => { ui.play.classList.remove('press'); root.classList.add('m-out'); fn(); }, 110);
}

function refreshSound() {
  ui.sound.querySelector('.m-ic').innerHTML = AU.on ? ICON_SOUND_ON : ICON_SOUND_OFF;
  ui.sound.classList.toggle('off', !AU.on);
  ui.sound.setAttribute('aria-pressed', String(AU.on));
  ui.sound.title = AU.on ? 'Ses açık' : 'Ses kapalı';
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
  $('#iosOk').onclick = () => { AU.ui('click'); closeOv(); };
}

function bind() {
  if (bound) return; bound = true;
  ui.play.addEventListener('click', () => startRun(loadSave() ? continueGame : newGame));
  ui.newRun.addEventListener('click', () => {
    AU.init();
    if (!ui.newRun.classList.contains('warn')) {
      AU.ui('no');
      ui.newRun.classList.add('warn');
      ui.newRun.textContent = 'Emin misin? Kayıt silinecek · tekrar dokun';
      clearTimeout(newRunTO); newRunTO = setTimeout(resetNewRun, 3500);
      return;
    }
    resetNewRun(); startRun(newGame);
  });
  ui.how.addEventListener('click', () => { AU.init(); AU.ui('click'); showHelp({ fromMenu: true }); });
  ui.sound.addEventListener('click', () => {
    AU.init(); AU.on = !AU.on; store.set(KEYS.sound, AU.on); refreshSound(); muteIcon(); AU.ui('click'); haptic(6);
  });
  ui.install.addEventListener('click', async () => {
    AU.init(); AU.ui('click');
    const r = await promptInstall();
    if (r === 'ios' || (r === 'unavailable' && isIOS())) showIOSInstall();
    refreshInstall();
  });
  ui.update.addEventListener('click', () => { ui.update.disabled = true; applyUpdate(); });
  /* klavye: Enter / Space → oyna */
  window.addEventListener('keydown', e => {
    if (!document.body.classList.contains('menu') || leaving || document.querySelector('#ov.show')) return;
    if ((e.key === 'Enter' || e.code === 'Space') && document.activeElement === document.body) { e.preventDefault(); ui.play.click(); }
  });
  ui.logo.addEventListener('click', () => { AU.init(); AU.ui('vip'); playLogoIntro(ui.logo.querySelector('svg')); });
  onPWA('installable', refreshInstall);
  onPWA('installed', refreshInstall);
  onPWA('update-ready', () => { ui.update.hidden = false; requestAnimationFrame(() => ui.update.classList.add('show')); });
  window.addEventListener('resize', invalidateMenuLayout);
  window.addEventListener('orientationchange', invalidateMenuLayout);
}

export function initMenu() {
  root = $('#menu');
  ui = {
    col: $('#menu .m-col'), head: $('#menu .m-head'), cta: $('#mPanel'), logo: $('#mLogo'),
    play: $('#mPlay'), playSub: $('#mPlaySub'), playTitle: $('#mPlayTitle'), badge: $('#mBadge'), newRun: $('#mNew'),
    how: $('#mHow'), sound: $('#mSound'), install: $('#mInstall'), update: $('#mUpdate'),
    trophy: $('#mTrophy'), best: $('#msBest'), day: $('#msDay'),
  };
  [...root.querySelectorAll('.m-icons .m-ib')].forEach((b, i) => b.style.setProperty('--k', i));
  ui.logo.innerHTML = logoSVG({ animated: true }) + '<span class="sr">onit</span>';
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
  refreshCTA(); refreshSound(); refreshInstall();
  playLogoIntro(ui.logo.querySelector('svg'), { delay: 180, onLand: () => AU.ui('coin') });
}

export function hideMenu() {
  if (!root) return;
  root.setAttribute('inert', '');
}
