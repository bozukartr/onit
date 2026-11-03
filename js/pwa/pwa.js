/**
 * onit — pwa/pwa.js
 * Service worker kaydı, güncelleme akışı ve "uygulamayı yükle" desteği.
 *
 * Olaylar (onPWA ile dinlenir):
 *   installable  → tarayıcı yükleme istemi sundu (beforeinstallprompt)
 *   installed    → uygulama yüklendi
 *   update-ready → yeni sürüm indirildi, applyUpdate() ile etkinleştirilebilir
 */
const bus = new EventTarget();
let deferredPrompt = null;
let registration = null;
let reloading = false;

export const onPWA = (type, fn) => bus.addEventListener(type, fn);
const emit = type => bus.dispatchEvent(new Event(type));

export const isStandalone = () =>
  (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
  (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
  window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Menüde "Yükle" düğmesi gösterilsin mi? */
export const canInstall = () => !isStandalone() && (!!deferredPrompt || isIOS());

/** @returns {Promise<'accepted'|'dismissed'|'ios'|'unavailable'>} */
export async function promptInstall() {
  if (deferredPrompt) {
    const p = deferredPrompt; deferredPrompt = null;
    p.prompt();
    const { outcome } = await p.userChoice.catch(() => ({ outcome: 'dismissed' }));
    return outcome;
  }
  return isIOS() ? 'ios' : 'unavailable';
}

/** Bekleyen service worker'ı etkinleştirir; kontrol değişince sayfa yenilenir. */
export function applyUpdate() {
  const w = registration && registration.waiting;
  if (w) w.postMessage({ type: 'SKIP_WAITING' });
  else window.location.reload();
}

function trackInstalling(reg) {
  const sw = reg.installing;
  if (!sw) return;
  sw.addEventListener('statechange', () => {
    if (sw.state === 'installed' && navigator.serviceWorker.controller) emit('update-ready');
  });
}

export function initPWA() {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; emit('installable'); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; emit('installed'); });

  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      if (registration.waiting && navigator.serviceWorker.controller) emit('update-ready');
      registration.addEventListener('updatefound', () => trackInstalling(registration));
      /* uzun oturumlarda saatte bir güncelleme kontrolü */
      setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
    } catch (err) {
      console.warn('[onit] service worker kaydedilemedi:', err);
    }
  });
  /* ilk kurulumda (clients.claim) yenileme yapma; yalnızca güncellemede */
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return; reloading = true; window.location.reload();
  });
}
