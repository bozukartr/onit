/**
 * onit — core/storage.js
 * localStorage sarmalayıcı + anahtar sabitleri.
 * Eski "vardiya_*" anahtarları ilk açılışta "onit_*" anahtarlarına taşınır.
 */
export const KEYS = {
  best: 'onit_best',     // {score, day}
  sound: 'onit_snd',     // boolean
  tutorial: 'onit_tut',  // 2 = tamamlandı
  stats: 'onit_stats',   // {shifts, served, days}
};

export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli mod / kota */ } },
};

/** vardiya_* → onit_* (bir kez, sessizce) */
export function migrateLegacyKeys() {
  try {
    for (const [key, legacy] of [[KEYS.best, 'vardiya_best'], [KEYS.sound, 'vardiya_snd'], [KEYS.tutorial, 'vardiya_tut']]) {
      const old = localStorage.getItem(legacy);
      if (old != null && localStorage.getItem(key) == null) localStorage.setItem(key, old);
      localStorage.removeItem(legacy);
    }
  } catch (e) { /* depolama yok */ }
}

/** Kariyer istatistikleri (ana menüde gösterilir) */
export function recordShift({ served = 0, days = 0 } = {}) {
  const s = store.get(KEYS.stats, { shifts: 0, served: 0, days: 0 });
  s.shifts += 1; s.served += served; s.days = Math.max(s.days, days);
  store.set(KEYS.stats, s);
  return s;
}
