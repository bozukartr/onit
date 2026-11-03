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
  save: 'onit_save',     // devam eden vardiya (bkz. game/save.js)
};

export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli mod / kota */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* depolama yok */ } },
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

/** Rekor ve en uzun günü günceller (kontrol noktalarında ve oyun sonunda). */
export function bumpRecords(score, day) {
  const best = store.get(KEYS.best, { score: 0, day: 0 }) || { score: 0, day: 0 };
  if (score > (best.score || 0)) store.set(KEYS.best, { score, day });
  const s = store.get(KEYS.stats, { shifts: 0, served: 0, days: 0 });
  if (day > (s.days || 0)) { s.days = day; store.set(KEYS.stats, s); }
}
