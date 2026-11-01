# PixelCore Studio 2.0

Mustaqil o'yin studiyasi sayti: **o'yinlar katalogi, yangiliklar/devlog, roadmap, PixelCore ID (profil), admin panel, PWA, 3 tilli (uz/ru/en)**.
Toza HTML + CSS + JavaScript, backend sifatida mavjud **Firebase** (Auth + Firestore). Build bosqichi yo'q, faqat bepul xizmatlar (Vercel Hobby, Firebase Spark).

Domen: https://pixelcore-delta.vercel.app/

## Tezkor ishga tushirish
1. **Firebase qoidalarini yangilang** — [SETUP.md](SETUP.md) 1-qadam (bu majburiy, aks holda yangi funksiyalar ishlamaydi).
2. Loyihani GitHub'ga yuklang, Vercel'da "Import Project" qiling (Framework: *Other*, build buyrug'i va output papkasi **bo'sh**).
3. Firebase → Authentication → Authorized domains ga `pixelcore-delta.vercel.app` ni qo'shing.
4. Admin hisobi bilan kiring (email tasdiqlangan bo'lishi shart) va `admin.html` orqali kontent qo'shing.

Mahalliy ko'rish: `npx serve .` yoki VSCodium'da Live Server (Service Worker faqat `localhost` yoki https'da ishlaydi).

## Tuzilma
```
index.html games.html app.html news.html devlog.html article.html about.html
roadmap.html contact.html profile.html admin.html privacy.html 404.html offline.html
style.css                 — butun dizayn tizimi (qora / to'q binafsha / neon binafsha)
firebase.js               — Firebase sozlamasi (MAVJUD loyiha), ADMIN_EMAILS (faqat tugma uchun)
links.js                  — havolalar, TECH / SOFTWARE / PARTNERS ro'yxatlari (o'zingiz tahrirlaysiz)
js/dict.js                — barcha tarjimalar [uz, ru, en]
js/i18n.js  js/core.js    — til tizimi; layout, auth, qidiruv, cookie, PWA, fon animatsiyasi
js/pages.js               — barcha ommaviy sahifalar mantiqi
js/admin.js               — admin panel
sw.js manifest.webmanifest offline.html
api/sitemap.js            — Vercel funksiyasi: dinamik /sitemap.xml
firestore.rules           — Firestore Security Rules
vercel.json robots.txt
tests/                    — i18n tekshiruvi, E2E (Playwright + soxta Firebase), sitemap testi
tools/gen-pages.py        — HTML sahifalarni bir qolipdan qayta yaratadi (ixtiyoriy)
```

## Muhim qoidalar
- **Matn qo'shish:** `js/dict.js` ga `"kalit": ["uz","ru","en"]` yozing, HTMLda `data-i18n="kalit"`, JS'da `t("kalit")`. `node tests/check-i18n.js` yetishmayotganini topadi.
- **Admin:** huquq `firestore.rules` dagi email bilan beriladi (serverda tekshiriladi). `firebase.js` dagi `ADMIN_EMAILS` faqat "Admin" tugmasini ko'rsatadi.
- **Yangi versiya chiqarish:** `sw.js` dagi `VERSION` ni oshiring — foydalanuvchilarga "Yangi versiya tayyor" xabari chiqadi.
- **Head qismini o'zgartirish:** `tools/gen-pages.py` ni tahrirlab `python3 tools/gen-pages.py` ishga tushiring (yoki 13 ta faylni qo'lda).
- **Testlar:** `node tests/check-i18n.js`, `node tests/sitemap.test.js`, `node tests/e2e.js` (Playwright kerak). Nima sinalgani va sinalmagani — [TEST_REPORT.md](TEST_REPORT.md).

## Ma'lumotlar modeli (Firestore)
`games`, `images`, `news`, `reviews`, `feedback`, `users`, `scores` — **mavjud**, tuzilmasi saqlangan (yangi maydonlar ixtiyoriy).
Yangi: `roadmap`, `team`, `comments`, `contacts`, `stats/site`, `activity`. Batafsil: [MIGRATION.md](MIGRATION.md).
