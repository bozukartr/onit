# onit — Otel Operasyon Oyunu

Bu dosya Claude Code için proje bağlamıdır. Kullanıcı (Burak) Türkçe konuşur; yanıtlar ve oyun içi metinler Türkçedir.

## Konsept
Mini Metro estetiğinde, tile tabanlı 2D mobil oyun (PWA). Oyuncu bir otelin **operasyon müdürü**: misafir taleplerini doğru ekip üyesine yönlendirir, oyun gün gün ilerler.

- **İsim:** `onit` (her zaman küçük harf). "I'm on it!" ifadesinden geliyor. Eski çalışma adı "VARDİYA" artık marka olarak kullanılmıyor; "vardiya" yalnızca cins isim (iş vardiyası) olarak metinlerde geçer.
- **Logo:** `assets/brand/logo.png` **onaylı nihai logo.** Kalın, yuvarlak uçlu geometrik küçük harf "onit"; kömür #26282E yazı, krem #F3EEE4 zemin; "i"nin noktası turuncu #E89B13 bir daire olarak sağ üste "yola çıkmış", arkasında kesikli kavisli bir iz var (anlamı: personel çoktan yola çıktı). `assets/brand/logo-draft.svg` ilk taslak, referans amaçlı. Vektör karşılığı `js/ui/logo.js` içinde (logo.png koordinatlarında, birebir üst üste bindirilerek doğrulandı); dosya varyasyonları `assets/brand/` altında: `onit-logo.svg`, `-transparent`, `-dark`, `-dark-transparent`, uygulama ikonu `onit-mark*.svg` (i gövdesi + kesikli iz + turuncu nokta).

## Teknik
- Vanilla JS **ES modülleri** + ayrı CSS dosyaları; derleme adımı ve harici bağımlılık yok. Canvas 2D.
- **PWA:** `manifest.webmanifest` + `sw.js` (sürümlü önbellek, tamamen çevrimdışı, "Yeni sürüm hazır · Yenile" akışı, `?action=play` kısayolu). Yayında `sw.js` içindeki `VERSION` artırılır; yeni css/js dosyası eklenirse `PRECACHE` listesine yazılır (`npm run check` doğrular).
- ES modülleri `file://` üzerinden açılmaz → `npm start` (http-server, port 8080).
- Mobil öncelikli (dikey). Masaüstü ve yatay da destekleniyor.
- `window.__V` geliştirici kancası: durumu konsoldan incelemek ve test etmek için (`g`, `startDay`, `spawnReq`, `commitPlan`, `appendPlan`, `step` …).
- Test: Playwright (Chromium) ile menü (4 ekran boyutu), oyun akışı (sürükle-gönder, gün sonu, geliştirme, oyun sonu, menüye dönüş), SW + çevrimdışı yeniden yükleme doğrulandı; konsol hatası yok. `npm test` = precache kontrolü + ESLint.

### Dosya yapısı
```
index.html              HUD + ana menü iskeleti, meta/PWA etiketleri
manifest.webmanifest    PWA manifesti (ikonlar, kısayol, ekran görüntüleri)
sw.js                   service worker
css/  base · hud · menu · overlays · responsive
js/main.js              giriş noktası + ana döngü
js/core/                utils (matematik/renk/DOM), config (sabitler, ekipler), storage (localStorage, onit_* anahtarları)
js/world/               map (tile haritası, BFS), route (yumuşak rota geometrisi)
js/game/                state (g, now, fx), staff, requests, guests, demo, day, upgrades, tutorial, flow, loop, save (vardiya kaydı)
js/render/              viewport (canvas+kamera), palette, shapes, effects, routes, tiles, actors, renderer
js/ui/                  hud, overlays, menu (ana menü), logo (vektör logo + açılış animasyonu)
js/input/input.js       sürükle-bırak / dokun-seç
js/audio/audio.js       WebAudio sentez sesleri
js/pwa/pwa.js           SW kaydı, güncelleme, yükleme istemi
assets/brand · icons · screenshots
```
- Modüller arası paylaşılan durum `export let` canlı bağlarıyla okunur; yalnızca sahibi modül yeniden atar (`g` → state.newState, `now` → setNow, `tiles` → map.buildMap, `ovOpen` → overlays). Yan etkiler `initHUD/initInput/initMenu/initPWA` içinde, `main.js` sırayla çağırır.

## Ana menü
- Arkada gerçek simülasyon demo yapay zekâsıyla oynar (6. gün oteli); kamera `menuFreeArea()` ile panellerin dışında kalan alana sığar, çok yavaş sinematik kayma.
- Üstte animasyonlu logo (harfler yaylanır → nokta "i"nin üstünde belirir, çömelir, kesikli iz bırakarak yerine uçar, sönümlü yayla oturur; logoya dokununca tekrar oynar). `prefers-reduced-motion` desteklenir.
- Cam panel: ekip jetonları, "Vardiyaya başla" (turuncu nokta düğmesi), kariyer (rekor talep, en uzun gün, vardiya sayısı — `onit_stats`), Nasıl oynanır / Ses / Yükle (yalnızca yüklenebilirken; iOS'ta talimat kartı).
- Masaüstü ve yatay telefonda sol sütun, otel sağda. Oyun içi "?" katmanından "Ana menüye dön" ile dönülebilir.
- Kayıt varsa ana düğme **"Devam et"** olur (gün, talep, puan gösterir); altında "Yeni vardiya başlat" iki dokunuşla onaylanır (kayıt silinir).

## Kayıt (game/save.js, `onit_save`)
- Otomatik kontrol noktaları: **her gün başı** (`startDay` sonunda, geliştirme uygulanmış) ve **gün sonu özeti** (aynı olay + aynı 3 geliştirme seçeneği saklanır).
- Gün ortasında çıkılırsa/uygulama kapanırsa o **günün başından** devam edilir (rotalar ve talepler kaydedilmez — bilinçli tercih).
- Kaydedilenler: gün, puan, skor, şikayet, ekip başına personel sayısı, geliştirmeler (maxStops, owned, spd, trn, pat), görülmüş ipuçları, hız, günün olayı, `runBest`.
- Oyun bitince kayıt silinir; rekor/en uzun gün kontrol noktalarında da güncellenir. `?action=play` kısayolu kayıt varsa devam eder.

## Oynanış
- **Harita:** 11×15 tile ızgara. Lobi altta, merkez omurga koridoru, katlar halinde yatay koridorlar, iki yanda odalar. Her gün yeni kanat açılır (koridorlar çizilerek, odalar yaylanarak belirir, kamera uzaklaşır). 6. günde 37 oda.
- **Ekipler / talep şekilleri:**
  | Ekip | Şekil | Renk | Açılış |
  |---|---|---|---|
  | Kat Hizmetleri (Temizlik) | daire | #2F7DD1 | 1. gün |
  | Oda Servisi | kare | #E4513F | 1. gün |
  | Teknik Servis | üçgen | #E89B13 | 2. gün |
  | Bellboy (Bagaj) | elmas | #2E9E5E | 3. gün |
  | Güvenlik | beşgen | #8656B8 | 5. gün |
  | Joker (geliştirme) | yıldız | #DB5A96 | her talebe bakar, %30 yavaş |
- **Kontroller:**
  - **Departman karesinden / ekip kartından yönlendirme her zaman açık** (kullanıcının isteği): boşta personel → üsse dönen → rotası olan ve sırasında yer bulunan (en kısa sıra) personel seçilir; çizgi onun kuyruğunun sonuna eklenir (`staff.pickDispatch`). Herkesin sırası doluysa uyarı verilir. Departmandan başlayan sürükleme yine departmana bırakılırsa vazgeçilmiş sayılır (rota iptal edilmez).
  - Personeli (haritadan, üssünden ya da alttaki ekip kartından) odaya sürükle. Bırakmadan birkaç odadan geçersen çok duraklı rota olur. Talebi uyan oda anında eklenir; diğerleri kısa bekleme (dwell) ya da üstünde bırakma ile.
  - **Yoldaki personeli sürükle → yeni duraklar rotanın SONUNA eklenir** (kullanıcının özel isteği). Rotanın son durağından çekmek de aynı.
  - Personele **dokun → seçilir**, sonra odalara dokunarak sıraya eklenir; boşa dokununca seçim kalkar.
  - Personeli **kendi üssüne bırak → rota iptal**, üsse döner.
  - Sırada en fazla 3 oda (Servis Arabası ile artar).
- **Baskı:** Oda çevresinde sabır çizgisi; dolarsa şikayet, puan düşer. Yanlış ekip gönderilirse sabır azalır. Puan 5★ başlar, **2,5★ altı = oyun biter.**
- **Gün döngüsü:** 07:00–23:00 (~112 sn gerçek zaman, 1x). Saatlere göre talep yoğunluğu değişir (sabah bagaj, öğle/akşam oda servisi, gece güvenlik). Yoğun saat duyuruları çıkar. 4. günden itibaren rastgele günlük olaylar (Fırtına, Konferans Grubu, Düğün…).
- **Gün sonu:** Özet (sayarak artan rakamlar, ekip dağılımı, "Kusursuz Gün" rozeti + konfeti, en uzun seri) ve 3 geliştirmeden biri: +1 personel, Servis Arabası, Hızlı Adım, Ekip Eğitimi, Karşılama İkramı, Batı/Doğu Servis Koridoru (kestirme tile'lar), Çok Yönlü Eleman.
- **Eğlence:** Hızlı arka arkaya işler = SERİ ×n (rozet, artan ses perdesi, küçük puan bonusu). VIP odalar: altın, kısa sabır, 2 puan. Teknik sonrası bazen temizlik talebi zincirlenir.
- **Denge:** Simülasyon botları 7–9. günde düşüyor; ilk 3–4 gün öğretici/sakin.

## Görsel dil
- Gündüz: zemin #F3EEE4, yazı #26282E, ikincil #8F887C, oda #FFFFFF, oda kenarı #D7CBB7, kabartma #E4D9C6, koridor #E6DDCC, lobi #DCCEB8, ağaç #93C48C/#6FA56E, havuz #9ED7E7.
- Gün batımı: zemin #F4DCC6, koridor #ECD2B8, oda #FFF6EC.
- Gece: zemin #1B1E27, koridor #2A2F3B, oda #2F3442, yazı #ECE8E1; pencere ışığı #F7C46B.
- Vurgular: VIP #D4A63A, yıldız #E2A21B, hata #E04B3A, uyarı #EC9236, seri #F4B63A→#E8863A.
- Kabartmalı tile'lar, yumuşak gölgeler, bahçe/havuz dekoru, personelde gölge + iz + esneme, akan rota çizgileri, ripple/konfeti/skora uçan jetonlar, gece oda ışıkları kademeli yanar.
- Animasyonlar her zaman zaman-tabanlı ve yumuşak (eBack/eOut, sönümlü yaylar). Kullanıcı "süper akıcı" ve "juicy" hissi önemsiyor.

## Sıradaki işler
1. Personel yola çıkınca küçük "on it!" baloncuğu (markayla uyumlu mikro-etkileşim).
2. Uygulama ikonu şu an i gövdesi + iz + nokta; "sadece nokta + iz" isteniyorsa `assets/brand/onit-mark*.svg` güncellenip PNG'ler yeniden üretilmeli.

### Tamamlananlar
- onit olarak yeniden markalama (başlık, `<title>`, gömülü vektör logo, `vardiya_*` → `onit_*` anahtarları — eski kayıtlar ilk açılışta otomatik taşınır).
- Açılış logo animasyonu, logo varyasyonları, uygulama ikonları.
- Tek dosyadan modüler yapıya geçiş (kullanıcının yeni isteği) + PWA + yeni ana menü.
