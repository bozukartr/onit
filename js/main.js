/**
 * onit — main.js
 * Giriş noktası: modülleri başlatır, ana döngüyü (requestAnimationFrame) çalıştırır.
 *
 * Katmanlar:
 *   core/    yardımcılar, sabitler, depolama
 *   world/   tile haritası ve rota geometrisi
 *   game/    durum, personel, talepler, gün akışı, eğitim, demo
 *   render/  canvas çizimi, kamera, palet, efektler
 *   ui/      HUD, katmanlar, ana menü, logo
 *   input/   işaretçi / dokunma girdisi
 *   audio/   WebAudio ses efektleri
 *   pwa/     service worker + yükleme
 */
import { migrateLegacyKeys } from './core/storage.js';
import { endDay, startDay } from './game/day.js';
import { newGame, startMenu } from './game/flow.js';
import { step, updatePalette, visuals } from './game/loop.js';
import { spawnReq } from './game/requests.js';
import { appendPlan, busyPlan, cancelRoute, commitPlan, computeAssign, pickFor, queueRooms } from './game/staff.js';
import { g, setNow } from './game/state.js';
import { genChoices } from './game/upgrades.js';
import { initInput } from './input/input.js';
import { initPWA } from './pwa/pwa.js';
import { PD, pal } from './render/palette.js';
import { render } from './render/renderer.js';
import { cam, camTarget, resize, toScreen, updateCam } from './render/viewport.js';
import { initHUD, updateHUD } from './ui/hud.js';
import { initMenu } from './ui/menu.js';
import { ovOpen } from './ui/overlays.js';
import { at, tiles } from './world/map.js';

const VERSION = '1.0.0';

/* ---------- döngü ---------- */
let last = performance.now() / 1000;
function frame(ms) {
  const now = ms / 1000; setNow(now);
  const rdt = Math.min(.05, Math.max(0, now - last)); last = now;
  if (g) {
    const run = g.phase === 'day' && (g.mode === 'menu' || !ovOpen);
    if (run) {
      let gdt = rdt * (g.mode === 'menu' ? 1 : g.speed);
      while (gdt > 1e-6) { const d = Math.min(gdt, 1 / 45); step(d); gdt -= d; if (g.phase !== 'day') break; }
    }
    g.nightT += (g.nightTarget - g.nightT) * (1 - Math.exp(-rdt * 1.5));
    updatePalette(rdt);
    visuals(rdt);
  }
  camTarget(); updateCam(rdt);
  render(rdt);
  updateHUD();
  requestAnimationFrame(frame);
}

/* ---------- açılış ---------- */
function boot() {
  migrateLegacyKeys();
  for (const k in PD) pal[k] = PD[k].slice();
  resize();
  window.addEventListener('resize', resize);
  initHUD();
  initInput();
  initMenu();
  initPWA();
  const ver = document.getElementById('mVer'); if (ver) ver.textContent = 'v' + VERSION;
  startMenu();
  /* manifest kısayolu: ./?action=play → doğrudan yeni vardiya */
  if (new URLSearchParams(location.search).get('action') === 'play') newGame();
  requestAnimationFrame(frame);
  requestAnimationFrame(() => document.documentElement.classList.add('ready'));
}

/* geliştirici kancası (konsoldan durum incelemek için) */
window.__V = {
  version: VERSION,
  get g() { return g; }, at, toScreen, startDay, endDay, spawnReq, commitPlan, appendPlan, queueRooms, busyPlan,
  cancelRoute, step, computeAssign, pickFor, genChoices, get tiles() { return tiles; }, get cam() { return cam; },
};

boot();
