/**
 * onit — game/save.js
 * Vardiya kaydı. Oyun iki anda otomatik kontrol noktası alır:
 *   'day'     → her günün başında (geliştirme uygulanmış, yeni kanat açık)
 *   'summary' → gün bitip özet açıldığında (aynı 3 geliştirme seçeneği korunur)
 * Gün ortasında çıkılırsa o günün başından devam edilir. Oyun bitince kayıt silinir.
 */
import { EVENTS } from '../core/config.js';
import { KEYS, bumpRecords, store } from '../core/storage.js';
import { g } from './state.js';

const SAVE_VERSION = 1;

/** @returns {object|null} geçerli kayıt */
export function loadSave() {
  const s = store.get(KEYS.save, null);
  return s && s.v === SAVE_VERSION && s.day >= 1 && (s.at === 'day' || s.at === 'summary') ? s : null;
}
export const clearSave = () => store.del(KEYS.save);
export const eventByName = n => (n && EVENTS.find(e => e.name === n)) || null;

function snapshot(at, extra) {
  const staff = {};
  for (const s of g.staff) staff[s.team] = (staff[s.team] || 0) + 1;
  return {
    v: SAVE_VERSION, at, day: g.day, savedAt: Date.now(),
    rating: g.rating, score: g.score, served: g.served, complaints: g.complaints, runBest: g.runBest || 0,
    maxStops: g.maxStops, owned: { ...g.owned }, spd: { ...g.spd }, trn: { ...g.trn }, pat: g.pat,
    staff, seen: { ...g.seen }, lastSpeed: g.lastSpeed || 1, event: g.event ? g.event.name : null,
    ...extra,
  };
}

/** Kontrol noktası yaz (yalnızca gerçek oyunda). */
export function saveCheckpoint(at, extra = {}) {
  if (!g || g.mode !== 'play') return;
  store.set(KEYS.save, snapshot(at, extra));
  bumpRecords(g.score, g.day);
}

/** Kayıttaki sayısal durumu yeni oluşturulmuş oyun durumuna uygular (personel hariç). */
export function applySave(s) {
  Object.assign(g, {
    rating: s.rating, score: s.score, shown: s.score, served: s.served, complaints: s.complaints, runBest: s.runBest || 0,
    maxStops: s.maxStops, owned: { ...s.owned }, spd: { ...s.spd }, trn: { ...s.trn }, pat: s.pat,
    seen: { ...s.seen }, lastSpeed: s.lastSpeed || 1, speed: s.lastSpeed || 1,
  });
}
