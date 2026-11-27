# CHANGELOG

## 2.7.0 — 2026-11-26 (qulaylik va jilo: `js/fx.js`)
- **Kursor nuri** (sichqonchali qurilmada): kursor atrofida yumshoq binafsha nur; kartalarning chegarasi kursor ostida yonadi.
- **Kartalar 3D qiyaligi:** o'yin va yangilik kartalari kursorga qarab sal buriladi, ichidagi rasm parallaks bilan siljiydi. Sensorli ekranlarda yo'q.
- **Scroll'da paydo bo'lish:** kartalar va statistikalar birin-ketin yumshoq chiqadi; bosh sahifadagi **raqamlar 0 dan sanab chiqadi**. Animatsiya faqat konteyner birinchi marta to'lganda (qidiruv/filtr qayta chizganda miltillamaydi); tugagach `.rv/.in` sinflari olib tashlanadi, shuning uchun hover va qiyalik buzilmaydi.
- **Skeleton / piksel-loader:** ma'lumot kelguncha kartalar va statistikalar o'rnida logotip bloklaridek birin-ketin yonadigan loader (bosh sahifa, o'yinlar, yangiliklar). Haqiqiy ma'lumot ustidan yozadi; ekran o'qigich uchun "Yuklanmoqda…".
- **Mikro-javob:** tugmalarda bosish effekti; sevimli (yurakcha) bosilganda yurakcha "sakraydi" va piksel uchqunlari tarqaladi.
- **Klaviatura yorliqlari:** `?` — yordam oynasi, `G` so'ng `H/G/N/S/A/C` — sahifalarga o'tish (kiritish maydonida va ochiq oynada ishlamaydi). `/` va `Ctrl+K` (qidiruv) avval ham bor edi; endi `/` boshqa oyna ochiq turganda uning ustidan qidiruvni ochmaydi. Pastki qismda "Klaviatura yorliqlari" havolasi (faqat kursor/klaviatura bor qurilmada).
- **Scroll chizig'i va "tepaga" tugmasi:** sahifa tepasida o'qish chizig'i; 700px pastga tushilganda "↑" tugmasi (Mini App xavfsiz maydonini hisobga oladi).
- `prefers-reduced-motion`: kursor nuri, qiyalik, paydo bo'lish, sanash va uchqunlar o'chadi; klaviatura yorliqlari, scroll chizig'i va tugma qoladi. `admin.html`da fx yuklanmaydi. Yangi Yil mavzusi bilan birga ishlaydi.
- Yangi: `js/fx.js` (core.js boot'da yuklaydi), `style.css` oxiriga fx bo'limi, `core.js`da `skelFill()` va `loadFx()`, `dict.js`da 5 ta yangi kalit (`ui.top`, `kb.*`), Service Worker `pc-v2.7.0`.
- Testlar: `tests/fx.test.js` (42), `tests/fx.e2e.js` (53).

## 2.6.0 — 2026-11-26 (Yangi yil mavzusi)
- **Yangi: mavsumiy Yangi yil mavzusi** (`newyear.css`, `js/newyear.js`). Brend (qora + binafsha neon + piksel mark) saqlandi; ustiga faqat bezak qo'shildi:
  piksel-qor (kanvas, sahifa bosishlariga xalaqit bermaydi), navigatsiya tagida miltillovchi chiroqlar, logotipga piksel-qalpoq (sarlavha, hero, pastki qism; hero'da logotip bilan birga suzadi va aylanadi),
  pastki qismda qor uyumi va piksel archalar, fon ranglariga muzdek-ko'k va oltin nur, favicon'ga qalpoq.
- **Bosh sahifa:** haqiqiy **"Yangi yilgacha" hisoblagichi** (tashrif buyuruvchining soati bo'yicha, 3 tilda); 1-yanvardan 15-yanvargacha tabrik ("Yangi 2027-yil bilan!"); sahifa ochiq turganda yarim tunda piksel-salyut. Logotipni bossangiz ham salyut.
- **Avtomatik mavsum:** `links.js` → `NEWYEAR = { enabled, from: "11-26", to: "01-15" }`. Shu oraliqda yoqiladi va har yili o'zi takrorlanadi; mavsumdan tashqarida mavzu fayllari umuman yuklanmaydi. Sinash: `?ny=1`, o'chirish: `?ny=0`.
- **Foydalanuvchi nazorati:** pastki qismdagi "Yangi yil bezagi: yoqiq/o'chiq" tugmasi (tanlov `localStorage["pc-ny"]` da). `prefers-reduced-motion`: qor harakatsiz, salyut yo'q, chiroqlar miltillamaydi.
- Admin panelida (`admin.html`) mavzu yo'q. Mini App (Telegram) ichida ishlaydi.
- `js/core.js`: `nyState()` va `initNewYear()` (mavzu faylini kerak bo'lsa yuklaydi). `js/dict.js`: 10 ta yangi `ny.*` kalit (uz/ru/en). `privacy.html` (3 til): bezakni o'chirish tanlovi saqlanishi haqida jumla.
- Service Worker `pc-v2.6.0`; yangi fayllar keshga qo'shildi.
- Testlar: yangi `tests/newyear.test.js` (38 tekshiruv) va `tests/newyear.e2e.js` (41 tekshiruv: mavsum chegaralari, tugma, yarim tunda tabrik, reduced-motion, 3 til, mobil).
- **Mavzuni olib tashlash kerak bo'lsa:** `links.js` da `enabled: false` (yoki `newyear.css`, `js/newyear.js`, `core.js` dagi `nyState`/`initNewYear` va `ny.*` kalitlarini o'chiring).

## 2.5.0 — 2026-11-09
- **Bot**: buyurtma berish (force_reply, xizmat nomi tekshiriladi, adminga HTML-escape qilib yuboriladi), yangiliklarga obuna/`/stop`, `/id`, `/help`; admin: `/stats`, `/broadcast` (oldindan ko'rish + tasdiqlash, faqat `TELEGRAM_ADMIN_ID`).
- **Yangi `api/_fs.js`**: kutubxonasiz Firestore REST + service account JWT (RS256). **Yangi `api/notify.js`**: sayt formalaridan adminga Telegram xabari (matn Firestore'dan o'qiladi, qayta yuborilmaydi).
- `js/pages.js`: aloqa va fikr formasi yuborilgach `/api/notify` chaqiriladi (xato bo'lsa foydalanuvchiga ta'sir qilmaydi).
- `firestore.rules`: `tg_subscribers` mijozlarga yopiq. `privacy.html` (3 til): obuna va xabarnoma haqida.
- Env: `TELEGRAM_ADMIN_ID`, `FIREBASE_SERVICE_ACCOUNT` (faqat Vercel). SW `pc-v2.5.0`.
- Testlar: `tests/bot.test.js` (kengaytirildi), yangi `tests/fs.test.js`, `tests/notify.test.js`, `tests/tg.e2e.js` [13].

## 2.4.3 — 2026-11-09
- Bot: bosh menyudagi 6 ta alohida xizmat tugmasi olib tashlandi (xizmatlar "Barcha xizmatlar va narxlar" ichida).

## 2.4.2 — 2026-11-09
- Bot: "Barcha xizmatlar va narxlar" tugmasi endi chat ichida (callback + editMessageText) xizmatlar, narxlar va murojaat tugmalarini (admin, buyurtma formasi, kanal, orqaga) ko'rsatadi. Narxlar links.js bilan testda solishtiriladi.

## 2.4.1 — 2026-11-09
- **Yangi: `api/bot.js`** — bot `/start` ga javob beradi (salom, ilova tugmasi, xizmatlar va buyurtma tugmalari). Sirlar faqat Vercel env'da. Test: `tests/bot.test.js`. `.gitignore` ga `.env*` qo'shildi.

## 2.4.0 — 2026-11-08 (Telegram Mini App, A bosqichi — sirsiz)
- **Yangi: `js/tg.js`** — sayt Telegram ichida Mini App sifatida ishlaydi. Rejim faqat `Telegram.WebApp.initData` bo'sh bo'lmasa yoqiladi; oddiy brauzerda hech narsa o'zgarmaydi. Kirish hozirgidek email/parol, serverda yangi sir kerak emas.
- `ready()`, `expand()`, vertikal surishni o'chirish (7.7+), sarlavha/fon/pastki panel rangi sayt fon rangiga (`#06040c`) moslanadi (versiya tekshiruvi bilan). Dizayn o'zgarmadi.
- Xavfsiz zonalar (`--tg-safe-area-inset-*`, `--tg-content-safe-area-inset-*`) `style.css` oxiridagi `html.tg` qoidalarida.
- Mini App ichida: PWA tugmasi va Service Worker o'chirilgan (eskisi o'chiriladi), cookie paneli suzib chiqmaydi (statistika ruxsat berilmaguncha o'chiq, "Cookie sozlamalari" havolasi qoladi), reklama oynasi chiqmaydi.
- BackButton: ichki sahifalarda ko'rinadi; avval ochiq dialogni yopadi.
- Havolalar: tashqi https va yuklab olish (APK/EXE/DMG) -> `openLink`; `t.me` -> `openTelegramLink`; `mailto:`/tashqi `http:` tegilmaydi.
- Deep link: `startapp=game_<id>`, `news_<id>`, `games|news|services|about|contact`; faqat `[A-Za-z0-9_-]`, sessiyada bir marta, faqat bosh sahifada.
- "Ulashish": Mini App ichida `t.me/share/url`; `links.js` -> `TG_APP` to'ldirilsa `t.me/<bot>/<app>?startapp=...`.
- Til: `?lang=` > localStorage > Telegram `language_code` (faqat taklif, saqlanmaydi) > brauzer tili.
- `vercel.json`: `X-Frame-Options: DENY` olib tashlandi, o'rniga majburiy `Content-Security-Policy: frame-ancestors https://web.telegram.org`; (hisobot rejimidagi) CSP `script-src` ga `https://telegram.org` qo'shildi.
- `privacy.html` (3 til): telegram.org skripti yuklanishi haqida yozuv.
- Kichik mustahkamlash: `app.html` da URL'dan kelgan `id` HTML/havolada `esc`/`encodeURIComponent` bilan chiqariladi.
- Testlar: yangi `tests/tg.e2e.js` (95 tekshiruv). `tests/fake-firebase.js` ga `firebase.appCheck` qo'shildi (busiz mavjud e2e boshidan yiqilar edi). `tests/e2e.js` da telegram.org skripti marshrutlandi.
- Service Worker versiyasi `pc-v2.4.0`.

## 2.3.1 — 2026-11-03
- **YouTube** havolasi "Bizni kuzating" bo'limlariga qo'shildi (sayt pastki qismi va Aloqa sahifasi). `links.js` dagi `LINKS.youtube` ga kanal havolasini yozasiz; bo'sh bo'lsa, hech qayerda ko'rinmaydi.
- Havolalar `safeUrl` orqali tekshiriladi (faqat http/https).
- Service Worker versiyasi `pc-v2.3.1` ga oshirildi: foydalanuvchilarga "Yangi versiya tayyor" xabari chiqadi.

## 2.3.0 — 2026-11-03
- **Yangi: xizmatlar reklamasi** — xizmatlaringizni (tasodifiy bittasini) ko'rsatadigan kichik oyna. 12 soniyadan keyin chiqadi, sessiyada 1 marta, yopilsa 3 kun chiqmaydi, cookie paneli ochiq bo'lsa kutadi, xizmatlar/aloqa/profil/admin sahifalarida chiqmaydi. Sozlash va o'chirish: `links.js` → `PROMO`. Bu o'zimizning xizmatlar reklamasi, uchinchi tomon reklamasi emas (pul keltirmaydi, mijoz keltiradi).
- **Tuzatildi (jiddiy):** sahifa ochilishidagi animatsiya `position: fixed` elementlarni (cookie paneli, reklama, xabarlar, fon animatsiyasi) ekran o'rniga butun sahifaga nisbatan joylashtirib qo'ygan edi — cookie paneli ko'rinmay qolishi mumkin edi. Animatsiya faqat xiralashuvga o'zgartirildi, testga qo'shildi.
- **Tuzatildi:** `.sec` va `.page-top` yon bo'sh joyni (padding) o'chirib yuborgan, telefonda matn ekran chetiga yopishib qolgan. Mobil testga qo'shildi.
- Maxfiylik siyosati va cookie matniga reklama oynasi yopilgani saqlanishi qo'shildi.

## 2.2.0 — 2026-11-03
- **Xizmatlar 6 taga yetdi:** veb-sayt, Telegram bot, taqdimot, maqola/matn, test tuzish, hujjat ishlari. Narxlar "dan" ko'rinishida, tilga moslab.
- **"Barcha xizmatlar AI yordamida" bloki** va unga mos savol-javob.
- **Narx paketlari:** veb-sayt (3 ta) va Telegram bot (3 ta), "Ommabop" belgisi, domen/hosting haqida izoh. Paket tanlanganda aloqa formasi paket nomi bilan to'ldiriladi.
- **Portfolio ("Ishlarimiz"):** `links.js` dagi `PORTFOLIO` dan; hozir faqat shu saytning o'zi (haqiqiy ish). Bo'sh bo'lsa bo'lim yashirin.
- Narxlarni belgilash uchun O'zbekiston bozori ko'rib chiqildi: [PRICING_NOTES.md](PRICING_NOTES.md).

## 2.1.0 — 2026-11-03
- **Yangi: Xizmatlar sahifasi** (`services.html`): veb-sayt va Telegram bot yaratish xizmatlari, narx bloki ("Kelishiladi" yoki `links.js` dagi narx), buyurtma tugmasi (Telegram), jarayon bosqichlari, afzalliklar, savollar. Bosh sahifada ham qisqa blok. Aloqa formasi xizmatdan kelganda oldindan to'ldiriladi (`contact.html?service=web|bot`).
- **Olib tashlandi:** Roadmap va Devlog sahifalari, menyu/footer havolalari, bosh sahifadagi roadmap bloki, admin paneldagi Roadmap bo'limi. Eski havolalar `vercel.json` orqali yo'naltiriladi (`/roadmap.html` → `/services.html`, `/devlog.html` → `/news.html`). `roadmap` kolleksiyasidagi ma'lumotlar bazada qoladi (o'chirilmagan), qoidalarni qayta joylashtirish shart emas.
- Eski "devlog" kategoriyali yangiliklar o'chmaydi: "Hammasi" ro'yxatida ko'rinadi.
- Sitemap va Service Worker keshi yangilandi.

## 2.0.0 — 2026-10-31
### Dizayn
- Yangi dizayn tizimi: qora, to'q binafsha va neon binafsha; piksel zarrachali fon, hover/glow effektlari, sahifalar orasida silliq o'tish (View Transitions + fade), `prefers-reduced-motion` hurmat qilinadi.
- Logotip, favicon.svg, ikonkalar (maskable bilan), apple-touch-icon va OG rasm yangi ranglarda qayta yaratildi.
- Eski **yorug' mavzu o'chirildi** (dizayn qora/binafsha ekanligi uchun) — ongli qaror, ishlamay qolgani uchun emas.

### Sahifalar (yangi/yangilangan)
- Bosh sahifa: Hero, statistika (haqiqiy ma'lumotdan), Featured o'yin, yangi loyihalar, studio haqida, texnologiyalar, hamkorlar (bo'sh bo'lsa yashirin), yangiliklar, roadmap, "Bilasizmi?".
- `games.html` (qidiruv, janr/platforma/holat filtri, saralash, Popular/Latest), `app.html` (cover, video, galereya + lightbox, xususiyatlar, min/rec talablar, changelog, o'xshash o'yinlar, sharhlar, ulashish).
- `news.html`, `article.html`, `devlog.html` (kategoriya, qidiruv, izohlar), `about.html` (jamoa, texnologiyalar, dasturlar, press-kit), `roadmap.html`, `contact.html` (aloqa formasi, Bug Report / Taklif / Savol, FAQ), `profile.html`, `404.html`, `offline.html`.

### PixelCore ID
- Foydalanuvchi nomi, 12 ta piksel-avatar, email tasdiqlash, parolni tiklash, profilni tahrirlash, hisobni o'chirish (o'z ma'lumotlari bilan), sevimlilar, faoliyat tarixi, daraja va yutuqlar (haqiqiy faoliyatdan hisoblanadi, soxtalashtirib bo'lmaydi).
- **Maxfiylik tuzatildi:** sharhlarda endi email prefiksi emas, foydalanuvchi nomi ko'rsatiladi.

### Admin panel (to'liq qayta yozildi)
- Dashboard, o'yinlar / yangiliklar / roadmap / jamoa CRUD (uz/ru/en maydonlar), skrinshot va cover, media manager (egasiz rasmlarni topish), sharh va izohlarni moderatsiya, xabarlar (filtr bilan), foydalanuvchilar (bloklash), faoliyat tarixi, qidiruv va filtrlar.
- Admin huquqi **serverdan** tekshiriladi (faqat admin o'qiy oladigan kolleksiyani o'qish orqali), frontend ro'yxati faqat tugma uchun.

### Xavfsizlik
- `firestore.rules` qayta yozildi: maydonlar ro'yxati (`hasOnly`), uzunlik chegaralari, bloklangan foydalanuvchi yozolmaydi va blokni o'zi olib tashlay olmaydi, kontaktlar `created == request.time`, statistika faqat +1.
- Barcha foydalanuvchi matni `esc()` orqali chiqariladi; havolalar `safeUrl()` bilan tekshiriladi; YouTube faqat `youtube-nocookie` va ID regex bilan.
- Xavfsizlik sarlavhalari (`vercel.json`), CSP (hozircha Report-Only).

### Tarjimalar
- Qo'lda matn-almashtirish tizimi o'rniga kalit asosidagi tizim (`js/dict.js`, ~380 kalit × 3 til), til `localStorage` va `?lang=` bilan saqlanadi. Kontent uchun `*_ru`, `*_en` maydonlari (bo'sh bo'lsa o'zbekcha ko'rsatiladi). Test tarjimalarning to'liqligini tekshiradi.

### SEO / texnik
- Barcha URL'lar `pixelcore-delta.vercel.app` ga o'tkazildi (canonical, OG, Twitter, JSON-LD, robots, sitemap). Dinamik `/sitemap.xml` (`api/sitemap.js`), hreflang.
- Service Worker qayta yozildi: versiyali kesh, offline sahifa, yangilanishni aniqlash ("Yangi versiya tayyor"), o'rnatish tugmasi. Manifest: maskable ikonka, shortcuts.
- Cookie sozlamalari (zarur / statistika), ixtiyoriy tashriflar hisoblagichi.
- Global qidiruv (`Ctrl+K` yoki `/`).

### Olib tashlandi (o'rniga yangisi bor)
`script.js`, `app.js`, `admin.js` (ildizda), eski `i18n.js`, eski statik `sitemap.xml`, eski `SETUP.md`, `pixelcore.code-workspace`. `.git`, `__MACOSX`, `.DS_Store` arxivga kiritilmadi. **Hech qanday Firebase ma'lumoti o'chirilmagan.**
