# TEST_REPORT — PixelCore Studio 2.0

Sana: 2026-11-03 (2.3: reklama oynasi, fixed-joylashuv va mobil chet bo'sh joy xatolari tuzatildi). **Muhim:** sandbox'da internet yo'q edi, shuning uchun sayt **haqiqiy Firebase'ga ulanmasdan**, test uchun yozilgan *soxta Firebase* (`tests/fake-firebase.js`) bilan, haqiqiy Chromium (Playwright) brauzerida sinaldi. Bu sayt mantig'ini (UI, oqimlar, tillar, filtrlar, admin CRUD, SW) tekshiradi, lekin **Firebase Security Rules va Firebase serverining haqiqiy xatti-harakatini tekshirmaydi.**

## Natija
| Test | Natija |
|---|---|
| `node tests/check-i18n.js` — ishlatilgan har bir kalit uch tilda mavjud, bo'sh/mos kelmaydigan o'rinbosar yo'q | ✅ o'tdi |
| `node tests/sitemap.test.js` — `api/sitemap.js` (Firestore REST javobi soxta) | ✅ 5/5 |
| `node tests/e2e.js` — brauzer testlari | ✅ **129/129** |
| Barcha JS fayllar `node --check` | ✅ |

## Tekshirilgan (E2E, haqiqiy Chromium'da)
- **13 sahifa × 3 til × desktop (1280px) va mobil (375px):** JS/konsol xatosi yo'q; tarjima qilinmagan kalit ko'rinmaydi; gorizontal scroll yo'q. (404 va noma'lum URL ham.)
- **Bosh sahifa:** statistika bazadan hisoblanadi, Featured, yangi loyihalar, xizmatlar bloki, yangiliklar; bo'sh Hamkorlar bo'limi yashirin.
- **Xizmatlar sahifasi:** 6 ta xizmat kartasi va narx formati (3 tilga mos), AI bloki, narx paketlari (3+3, 2 tasi "Ommabop"), portfolio kartasi, bosqichlar va 4 ta savol; buyurtma tugmasi Telegram'ga olib boradi; aloqa formasi xizmat va paket nomi bilan oldindan to'ldiriladi; roadmap/devlog sahifalari va menyu havolalari yo'q.
- **Katalog:** qidiruv, platforma / janr / holat / sevimlilar filtri, Popular va saralash.
- **O'yin sahifasi:** havola tugmasi, galereya + lightbox, video, xususiyatlar, changelog, min/rec talablar, o'xshash o'yinlar, mavjud bo'lmagan o'yin xabari.
- **Xavfsizlik (UI darajasida):** zararli `<img onerror>` / `<script>` sarlavha va tavsif bajarilmaydi (katalog, bosh sahifa, o'yin sahifasi).
- **Auth:** ro'yxatdan o'tish (qisqa nom rad etiladi), users hujjati yaratiladi, tasdiqlash xati chaqiriladi, chiqish/kirish.
- **Sharh** (hujjat ID `gameId_uid`, nom email emas), **yangilikka izoh**, **taklif/Bug** (URL parametrlari bilan oldindan tanlanadi), **aloqa formasi**, honeypot spamni to'sadi.
- **Profil:** daraja, yutuqlar, faoliyat tarixi, sevimlilar, tahrirlash (nom + avatar), noto'g'ri nom rad etiladi.
- **Admin:** oddiy foydalanuvchi va kirmagan foydalanuvchi uchun panel yopiq; tasdiqlangan admin kiradi; o'yin/yangilik/jamoa qo'shish; tahrirlash rejimi; o'chirish; sharh/izoh/xabarlar ro'yxati va filtri; bloklash/blokdan chiqarish; media manager (egasiz rasm); faoliyat tarixi.
- **Til:** RU ga almashtirish boshqa sahifalarga o'tganda saqlanadi; `?lang=en`; kontent tarjimasi (`desc_ru`).
- **Cookie / statistika:** ruxsatdan keyin tashrif bir marta sanaladi, qayta yuklashda ikki marta emas.
- **Global qidiruv:** o'yin va yangilik topiladi.
- **Mobil:** hamburger menyu ochiladi; tugmalar ≥ 38px.
- **PWA (haqiqiy Service Worker):** ro'yxatdan o'tadi, kesh to'ladi, manifest to'g'ri (maskable ikonka bilan); **server o'chirilganda** oldin ochilgan sahifa keshdan ochiladi, ochilmagan sahifa uchun `offline.html` ko'rsatiladi.

## Sinalmagan / siz tekshirishingiz kerak
| Nima | Nega | Qanday tekshirish |
|---|---|---|
| **Firestore Security Rules** | Emulator/internet yo'q; qoidalar faqat o'qib chiqildi, ishga tushirilmadi | SETUP.md 3-bo'lim jadvali (Rules Playground) |
| Haqiqiy Firebase Auth (email yuborish, parol tiklash, `email_verified`) | Soxta | Ro'yxatdan o'ting, emailni tasdiqlang |
| Admin panelning haqiqiy `permission-denied` oqimi | Soxta Firebase buni oddiy qoida bilan taqlid qiladi | Oddiy akkaunt bilan `admin.html` ni oching |
| Hisobni o'chirish (`user.delete`) haqiqiy akkauntda | Soxta | Test akkaunt bilan |
| Haqiqiy qurilmalar (iOS Safari, Android Chrome) | Faqat Chromium viewport emulyatsiyasi | O'z telefoningizda |
| Firefox / Safari | Faqat Chromium | Qo'lda |
| Lighthouse ball, rasm yuklanish tezligi, Core Web Vitals | Brauzer audit vositasi ishlatilmadi | Vercel'da PageSpeed Insights |
| `<dialog>` va View Transitions eski brauzerlarda | Zamonaviy brauzerlar nazarda tutilgan (2022+); View Transitions bo'lmasa shunchaki fade | — |
| Vercel deploy, `/sitemap.xml` funksiyasi va eski havolalar yo'naltirishi (`/roadmap.html`, `/devlog.html`) | Vercel'ga kira olmadim; yo'naltirish `vercel.json` da, mahalliy serverda sinalmadi | SETUP.md 4-bo'lim, deploydan so'ng eski havolalarni oching |
| Accessibility audit (ekran o'quvchi) | Avtomatik audit yo'q | Tuzilma: skip-link, aria-label, focus ko'rinadi, dialoglar, `lang` atributi; qo'lda tekshirish tavsiya |
| Yuklab olish havolalari | Sizning haqiqiy fayllaringiz; tugma faqat havola kiritilgan bo'lsa chiqadi | Har bir o'yin sahifasida bosing |
| Katta hajm (yuzlab o'yin) | Sinalmagan; har sahifada barcha o'yinlar o'qiladi | SETUP.md 6-bo'lim |

## Ma'lum cheklovlar
- Foydalanuvchi sharh/izohidagi `name` maydonini qoidalar profil nomiga bog'lamaydi (faqat uzunlikni tekshiradi) — foydalanuvchi boshqa ism yozishi mumkin. Moderatsiya admin panelda.
- Aloqa formasi hisobsiz ham ishlaydi (spamga ochiq): honeypot va uzunlik cheklovi bor, rate-limit yo'q. Kerak bo'lsa Firebase App Check qo'shiladi.
- Dinamik sahifalar uchun ijtimoiy tarmoq OG ko'rinishi umumiy (SSR yo'q).
- Push-bildirishnomalar amalga oshirilmagan (SETUP.md 7-bo'lim).

- **Reklama oynasi:** darhol chiqmaydi, 12 soniyadan keyin chiqadi va ekranning ko'rinadigan qismida turadi, xizmat nomi/narxi/tugmalar, xizmatlar sahifasida va cookie paneli ochiqligida chiqmaydi, yopilsa 3 kunga yashirinadi va boshqa sahifada ham chiqmaydi. Cookie paneli ham ekran ichida ekani tekshiriladi.
- **Mobil:** kontent ekran chetiga yopishmaydi (3 til).

## To'liq E2E chiqishi
```

[1] Barcha sahifalar xatosiz ochiladi, kalitlar tarjima qilingan, gorizontal scroll yo'q (3 til × desktop/mobil)
  ✓ [uz/desktop] JS/konsol xatolari yo'q 
  ✓ [uz/desktop] tarjima qilinmagan kalit ko'rinmaydi 
  ✓ [uz/desktop] gorizontal scroll yo'q 
  ✓ [uz/mobil] JS/konsol xatolari yo'q 
  ✓ [uz/mobil] tarjima qilinmagan kalit ko'rinmaydi 
  ✓ [uz/mobil] gorizontal scroll yo'q 
  ✓ [uz/mobil] kontent ekran chetiga yopishmagan (yon bo'sh joy bor) 
  ✓ [ru/desktop] JS/konsol xatolari yo'q 
  ✓ [ru/desktop] tarjima qilinmagan kalit ko'rinmaydi 
  ✓ [ru/desktop] gorizontal scroll yo'q 
  ✓ [ru/mobil] JS/konsol xatolari yo'q 
  ✓ [ru/mobil] tarjima qilinmagan kalit ko'rinmaydi 
  ✓ [ru/mobil] gorizontal scroll yo'q 
  ✓ [ru/mobil] kontent ekran chetiga yopishmagan (yon bo'sh joy bor) 
  ✓ [en/desktop] JS/konsol xatolari yo'q 
  ✓ [en/desktop] tarjima qilinmagan kalit ko'rinmaydi 
  ✓ [en/desktop] gorizontal scroll yo'q 
  ✓ [en/mobil] JS/konsol xatolari yo'q 
  ✓ [en/mobil] tarjima qilinmagan kalit ko'rinmaydi 
  ✓ [en/mobil] gorizontal scroll yo'q 
  ✓ [en/mobil] kontent ekran chetiga yopishmagan (yon bo'sh joy bor) 

[2] Bosh sahifa va katalog
  ✓ statistika 4 ta, haqiqiy ma'lumotdan
  ✓ chiqarilgan o'yinlar soni = 1
  ✓ yuklashlar yig'indisi = 125
  ✓ Featured o'yin ko'rsatildi
  ✓ yangi loyihalar 3 ta
  ✓ oxirgi yangiliklar 3 ta
  ✓ bosh sahifada xizmatlar bo'limi (3 ta karta)
  ✓ Hamkorlar bo'limi bo'sh bo'lgani uchun yashirin
  ✓ XSS: zararli sarlavha ishga tushmadi
  ✓ katalog: 3 ta karta
  ✓ qidiruv ishlaydi
  ✓ platforma filtri (Android)
  ✓ janr filtri (Puzzle)
  ✓ holat filtri (Coming Soon)
  ✓ Popular: ko'p yuklangan birinchi
  ✓ saralash: nom bo'yicha
  ✓ sevimli tugmasi ishlaydi
  ✓ 'Sevimlilar' filtri ishlaydi

[3] O'yin sahifasi
  ✓ o'yin nomi
  ✓ yuklab olish tugmasi haqiqiy havolaga olib boradi
  ✓ screenshot galereyasi (2 ta)
  ✓ gameplay video (YouTube) joylandi
  ✓ xususiyatlar va changelog
  ✓ minimal va tavsiya etilgan talablar
  ✓ o'xshash o'yinlar
  ✓ yuklab olish statistikasi
  ✓ screenshot kattalashtiriladi
  ✓ mavjud bo'lmagan o'yin: xabar chiqadi
  ✓ XSS: o'yin sahifasida ham xavfsiz

[3b] Xizmatlar sahifasi
  ✓ 6 ta xizmat kartasi (sayt, bot, taqdimot, maqola, test, hujjat)
  ✓ barcha xizmat nomlari ko'rinadi
  ✓ narxlar to'g'ri formatda (from 700,000 UZS; from 500,000 UZS; from 30,000 UZS / slide; from 30,000 UZS / 1,000 characters; from 2,000 UZS / question)
  ✓ buyurtma tugmasi Telegram'ga olib boradi
  ✓ AI haqidagi blok ko'rinadi
  ✓ narx paketlari: sayt 3 ta, bot 3 ta, 2 tasi 'Ommabop'
  ✓ sayt paketlari narxi
  ✓ portfolio bo'limi (haqiqiy ish) ko'rinadi
  ✓ jarayon bosqichlari va 4 ta savol
  ✓ xizmatdan kelganda aloqa formasi oldindan to'ldiriladi
  ✓ paket tanlanganda forma paket nomi bilan to'ldiriladi
  ✓ roadmap va devlog sahifalari olib tashlangan
  ✓ menyuda roadmap/devlog yo'q

[3c] YouTube havolasi (Bizni kuzating)
  ✓ YouTube havolasi kiritilmagan bo'lsa, hech qayerda ko'rinmaydi
  ✓ Aloqa sahifasida YouTube kartasi chiqadi va to'g'ri havolaga olib boradi
  ✓ Footer'dagi 'Kuzating' ustunida YouTube havolasi bor

[4] Ro'yxatdan o'tish, profil, sharh, izoh, fikr-mulohaza
  ✓ qisqa foydalanuvchi nomi rad etildi
  ✓ ro'yxatdan o'tgach, headerda foydalanuvchi nomi
  ✓ users hujjati yaratildi (email, username)
  ✓ tasdiqlash xati yuborildi
  ✓ sharh saqlandi (hujjat ID = gameId_uid, ismi email emas)
  ✓ o'rtacha reyting yangilandi
  ✓ yangilikka izoh qoldirildi
  ✓ contact: URL parametrlari bilan oldindan tanlangan
  ✓ taklif (feedback) saqlandi
  ✓ aloqa formasi saqlandi
  ✓ honeypot spamni to'sdi
  ✓ profil: daraja va yutuqlar (haqiqiy faoliyatdan)
  ✓ faoliyat tarixi: sharh + izoh + taklif
  ✓ profilda sevimli o'yin ko'rinadi
  ✓ profil tahrirlandi (username + avatar)
  ✓ header yangi nomni ko'rsatdi
  ✓ noto'g'ri username rad etildi

[5] Admin panel xavfsizligi va CRUD
  ✓ oddiy foydalanuvchi uchun admin panel yopiq
  ✓ kirmagan foydalanuvchi uchun panel yopiq
  ✓ admin (tasdiqlangan email) panelga kirdi
  ✓ dashboard statistikasi (10 ta ko'rsatkich)
  ✓ o'yin qo'shildi (nested links, ru tarjima, created)
  ✓ tahrirlash rejimi
  ✓ o'yin o'chirildi
  ✓ yangilik qo'shildi (kategoriya, EN)
  ✓ jamoa a'zosi qo'shildi
  ✓ sharh va izohlar boshqaruvda ko'rinadi
  ✓ taklif va aloqa xabarlari ko'rinadi
  ✓ xabarlar filtri ishlaydi
  ✓ foydalanuvchi bloklandi
  ✓ blok olib tashlandi (maydon o'chirildi)
  ✓ media manager: rasmlar va egasiz rasm
  ✓ admin faoliyat tarixi yoziladi

[6] Til saqlanishi, cookie, qidiruv, mobil menyu
  ✓ cookie paneli ko'rinadi
  ✓ cookie paneli ekran ichida (position:fixed to'g'ri ishlaydi)
  ✓ til RU ga almashdi
  ✓ boshqa sahifaga o'tganda til saqlandi
  ✓ tagline ko'rinadi
  ✓ kontent tarjimasi (desc_ru) ishlaydi
  ✓ ?lang=en parametri ishlaydi
  ✓ statistika ruxsatidan keyin tashrif hisoblandi
  ✓ bir sessiyada ikki marta sanalmaydi
  ✓ global qidiruv yangilikni topdi
  ✓ global qidiruv o'yinni topdi
  ✓ mobil: hamburger ko'rinadi
  ✓ mobil: menyu ochiladi
  ✓ mobil: tugmalar kamida 38px 

[6b] Reklama oynasi (xizmatlar)
  ✓ reklama darhol chiqmaydi (kechikish bor)
  ✓ 12 soniyadan keyin reklama avtomatik chiqadi
  ✓ reklama ekranning ko'rinadigan qismida (pastki chap burchak)
  ✓ reklamada xizmat nomi ko'rsatilgan: Telegram bot development
  ✓ reklama tugmalari: xizmatlar sahifasi va Telegram
  ✓ reklamada narx ko'rsatilgan
  ✓ xizmatlar sahifasida reklama chiqmaydi
  ✓ cookie paneli ochiq turganda reklama chiqmaydi
  ✓ yopish tugmasi reklamani yopadi
  ✓ yopilgach 3 kun qayta chiqmaslik belgilandi
  ✓ yopilgandan keyin boshqa sahifada ham chiqmaydi

[7] Service Worker / PWA (haqiqiy brauzerda)
  ✓ Service Worker ro'yxatdan o'tdi
  ✓ kesh to'ldirildi (19 fayl)
  ✓ manifest to'g'ri (installable)
  ✓ oflayn: oldin ochilgan sahifa keshdan ochiladi
  ✓ oflayn: ochilmagan sahifa uchun offline.html ko'rsatiladi

NATIJA: 129 o'tdi, 0 muvaffaqiyatsiz
```
