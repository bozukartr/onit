/**
 * onit — sw.js (service worker)
 *
 * Strateji
 *  - Kurulum: uygulama kabuğunun tamamı önbelleğe alınır → oyun tamamen çevrimdışı çalışır.
 *  - Gezinme ve statik dosyalar: sürümlü önbellekten (cache-first) → tüm dosyalar
 *    her zaman aynı sürümden gelir, modüller karışmaz. Önbellekte olmayan aynı
 *    kaynaklı GET istekleri ağdan alınıp önbelleğe eklenir.
 *  - Güncelleme: sw.js değişince yeni sürüm arka planda iner ve "waiting" bekler;
 *    menüdeki "Yeni sürüm hazır · Yenile" SKIP_WAITING gönderir, sayfa yenilenir.
 *
 * Yayın yaparken VERSION değerini artırın (scripts/check-precache.mjs listeyi doğrular).
 */
const VERSION = '1.1.0';
const CACHE = `onit-${VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/hud.css',
  './css/menu.css',
  './css/overlays.css',
  './css/responsive.css',
  './js/main.js',
  './js/audio/audio.js',
  './js/core/config.js',
  './js/core/storage.js',
  './js/core/utils.js',
  './js/game/day.js',
  './js/game/demo.js',
  './js/game/flow.js',
  './js/game/guests.js',
  './js/game/loop.js',
  './js/game/requests.js',
  './js/game/save.js',
  './js/game/staff.js',
  './js/game/state.js',
  './js/game/tutorial.js',
  './js/game/upgrades.js',
  './js/input/input.js',
  './js/pwa/pwa.js',
  './js/render/actors.js',
  './js/render/effects.js',
  './js/render/palette.js',
  './js/render/renderer.js',
  './js/render/routes.js',
  './js/render/shapes.js',
  './js/render/tiles.js',
  './js/render/viewport.js',
  './js/ui/hud.js',
  './js/ui/logo.js',
  './js/ui/menu.js',
  './js/ui/overlays.js',
  './js/world/map.js',
  './js/world/route.js',
  './assets/icons/favicon.svg',
  './assets/icons/favicon-32.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-192.png',
  './assets/icons/maskable-512.png',
  './assets/brand/onit-mark.svg',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })));
    /* ilk kurulumda hemen etkinleş; güncellemede sayfadaki "Yenile" onayını bekle */
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('onit-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    /* gezinme → uygulama kabuğu (sorgu parametreleri ?action=play vb. yok sayılır) */
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
      try { return await fetch(req); } catch (e) { return Response.error(); }
    }
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (e) {
      return Response.error();
    }
  })());
});
