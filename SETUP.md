# SETUP — Firebase, Vercel va qo'lda bajariladigan ishlar

Sandbox'da haqiqiy Firebase hisobingizga kira olmaganim uchun quyidagilarni **siz** bajarasiz. Har biri 1–3 daqiqa.

## 1. Firestore Security Rules (MAJBURIY)
1. Firebase Console → loyiha `pixelcore-96f17` → **Firestore Database → Rules**.
2. Eski qoidalarni **zaxira sifatida bir joyga nusxalab qo'ying**, so'ng `firestore.rules` mazmunini to'liq joylashtiring.
3. Agar admin emailingiz `esalimniyazov@gmail.com` bo'lmasa, faylda `request.auth.token.email in [...]` ni o'zgartiring (`firebase.js` dagi `ADMIN_EMAILS` ni ham).
4. **Rules Playground** orqali tekshiring (3-bo'limdagi ro'yxat) va **Publish** bosing.

Qoidalar ma'lumotlarni o'chirmaydi va o'zgartirmaydi; faqat kimga nima ruxsat berilishini belgilaydi.

## 2. Authentication
- **Sign-in method:** Email/Password yoqilgan bo'lsin (allaqachon).
- **Settings → Authorized domains:** `pixelcore-delta.vercel.app` ni qo'shing (Vercel preview domenlari kerak bo'lsa ularni ham).
- **Admin hisob:** admin emailingiz bilan ro'yxatdan o'tgan va **emailni tasdiqlagan** bo'lishi shart. Tasdiqlanmagan bo'lsa: kiring → Profil → "Xatni qayta yuborish".

## 2.1 App Check (spam va soxta so'rovlarni kamaytirish)
1. Google Cloud Console → **Security → Fraud Defense → Keys** → score-based **Web** key yarating. Faqat production domenini (`pixelcore-delta.vercel.app`) qo'shing; `localhost` ni production key'ga qo'shmang. Firebase loyihasi va Cloud loyihasi bir xil (`pixelcore-96f17`) bo'lishi kerak.
2. Yaratilgan **site key** ni Firebase Console → **App Check → Apps → pixelcore-web → Register → Fraud Defense** ichida ro'yxatdan o'tkazing.
3. Shu site key'ni `firebase.js` dagi `FIREBASE_APP_CHECK_SITE_KEY` ga ham yozib deploy qiling. Bu key ommaviy frontend sozlamasidir; maxfiy kalit emas.
4. Deploydan keyin App Check metrikalarini kuzating. Haqiqiy so'rovlar tasdiqlanayotganini tekshirgachgina Firebase Console'da **Cloud Firestore** enforcement'ni yoqing. Enforcement yoqilmasa, App Check tokenlari tekshiruvdan o'tkazilmaydi.

App Check anonim aloqa formasi va hisoblagichlarga soxta skriptlardan keladigan yozuvlarni kamaytiradi; u qat'iy IP/user rate-limit emas va haqiqiy brauzer avtomatizatsiyasini to'liq bartaraf etmaydi. Qat'iy limit kerak bo'lsa, server funksiyasi va rate-limit saqlagichi kerak bo'ladi.

**Narx:** key yaratish va Cloud API'ni yoqishning o'zi to'lovni anglatmaydi. Narxlar va bepul kvotalar o'zgarishi mumkin — Google Cloud Console'da reCAPTCHA Enterprise API uchun amaldagi narxlar, kvota va billing holatini tekshiring. Bepul kvotadan oshgan foydalanish uchun to'lov olinishi mumkin. Billing yoki free trial'ni alohida ruxsatsiz yoqmang. Firebase Spark rejasida so'rovlar soniga cheklovlar bo'lishi mumkin.

## 3. Rules Playground'da tekshirish (tavsiya)
| Sinov | Kutiladigan natija |
|---|---|
| Kirmagan: `get /games/x` | Ruxsat |
| Kirmagan: `create /games/x` | Rad |
| Oddiy user: `update /games/x {downloads: +1}` | Ruxsat |
| Oddiy user: `update /games/x {title:"a"}` | Rad |
| Oddiy user: `create /users/{uid} {email, username:"ab"}` | Rad (3 belgidan kam) |
| Oddiy user: `update /users/{uid} {banned:false}` | Rad |
| Oddiy user: `read /feedback/{boshqaning}` | Rad |
| Oddiy user: `delete /feedback/{o'ziniki}` | Ruxsat |
| Kirmagan: `create /contacts/x` (to'g'ri maydonlar, `created=request.time`) | Ruxsat |
| Kirmagan: `read /contacts/x` | Rad |
| Admin (email_verified=true): `write /news/x` | Ruxsat |

## 4. Vercel
1. Loyihani GitHub'ga yuklang → vercel.com → **Add New → Project → Import**.
2. **Framework Preset: Other**; Build Command va Output Directory — **bo'sh**. Deploy.
3. `vercel.json` sarlavhalar, `/sitemap.xml → /api/sitemap` va ijtimoiy tarmoq botlari uchun dinamik sahifa preview yo'naltirishlarini o'z ichiga oladi. `api/sitemap.js` va `api/share.js` Vercel Hobby'da bepul ishlaydi (Node 18+).
4. Deploy'dan so'ng tekshiring: `/sitemap.xml` (o'yin va yangilik sahifalari ro'yxatda bo'lsin), `/robots.txt`, `/manifest.webmanifest`.
5. Google Search Console'da `https://pixelcore-delta.vercel.app/sitemap.xml` ni yuboring.

## 5. Kontentni to'ldirish (admin.html)
- **O'yinlar:** mavjud o'yinlaringiz o'zgarishsiz ko'rinadi. Yangi maydonlar (janr, cover, video, xususiyatlar, tavsiya etilgan talablar, ru/en tavsif) ixtiyoriy — tahrirlash orqali to'ldiring. `Janr` bo'sh bo'lsa, filtr va "o'xshash o'yinlar" ishlamaydi.
- **Jamoa, Yangiliklar** — hozircha bo'sh; saytda "hali yo'q" xabari ko'rinadi (soxta kontent qo'shilmagan).
- **Xizmatlar:** matn va narxlar `links.js` (`SERVICES`) va `js/dict.js` (`srv.*`) da; o'zgartirgach `git push`. Narx ko'rsatilmasa "Kelishiladi" chiqadi. Buyurtma tugmasi `LINKS.support` (Telegram) ga olib boradi.
- **links.js:** `TECH`, `SOFTWARE` (haqiqatan ishlatadiganlaringizni qoldiring; men faqat saytning o'zi ishlatadigan texnologiyalar va SETUPdagi VSCodium'ni yozdim), `PARTNERS` (bo'sh bo'lsa bo'lim yashirin).

## 6. Bepul tarif limitlari (Firebase Spark)
- Kuniga 50 000 o'qish / 20 000 yozish. Har sahifa ochilishida o'yinlar (va kerak bo'lsa yangiliklar) to'liq o'qiladi: ~20 o'yin va kuniga ~1 000 sahifa ko'rish uchun yetarli. Trafik oshsa — o'yinlar ro'yxatini sahifalash yoki keshlash kerak bo'ladi.
- Rasmlar Firestore hujjatlarida base64 (siqilgan) saqlanadi — Firebase Storage kerak emas (u ham bepul, lekin karta talab qilishi mumkin). Hujjat chegarasi 1 MB: admin panel rasmlarni avtomatik kichraytiradi, skrinshot soni 8 tagacha.
- Firestore bilan ishlaganda `where` + `orderBy` kombinatsiyasi ishlatilmagan, shuning uchun **maxsus indeks kerak emas**.

## 7. Bu versiyaga kiritilmagan narsalar (halol ro'yxat)
- **Push-bildirishnomalar:** FCM `vapidKey` + `messagingSenderId` kerak va xabarni Console'dan qo'lda yuborasiz. Sozlamasiz ishlamaydi, shuning uchun soxta tugma qo'shmadim. Kerak bo'lsa alohida qo'shiladi.
- **Foydalanuvchini Firebase Auth'dan to'liq o'chirish/o'chirib qo'yish:** faqat Admin SDK yoki Console orqali. Admin panelda "bloklash" bor (sharh/izoh/xabar yozolmaydi), hisobni o'zi o'chirsa bo'ladi (Profil → Hisobni o'chirish).
- **Server tomonda SEO (SSR):** kontent Firestore'dan JavaScript bilan yuklanadi. Google JS'ni bajaradi, lekin Telegram/Facebook havola ko'rinishi (OG) o'yin/yangilik sahifalari uchun umumiy rasm va matn ko'rsatadi.
- **CSP:** `Content-Security-Policy-Report-Only` sifatida yoqilgan (bloklamaydi). Konsolda ogohlantirish chiqmasligini tekshirib, `vercel.json` da `-Report-Only` ni olib tashlab yoqishingiz mumkin.
- **Google Fonts** tashqi xizmat (bepul); maxfiylik siyosatida eslatilgan.


# Telegram Mini App (2.4.0, A bosqichi) — sizning ishlaringiz

## 1. BotFather (bepul)
1. Telegram'da @BotFather -> `/newbot` (yoki mavjud bot: `/mybots`). Nom va `...bot` bilan tugaydigan username bering. **Bot tokenini hech qayerga (kod, GitHub, chat) yozmang** — A bosqichida token umuman kerak emas.
2. `/newapp` -> botni tanlang -> sarlavha -> qisqa tavsif -> **640x360 rasm** -> demo GIF (yo'q bo'lsa `/empty`) -> **URL: `https://pixelcore-delta.vercel.app/`** -> **qisqa nom** (masalan `site`). Bu tartib va 640x360 o'lchami bir nechta ikkinchi darajali qo'llanmalarda bir xil; rasmiy `core.telegram.org/bots/webapps` sahifasida `/newapp` bosqichlari yozilmagan, shuning uchun BotFather o'zi so'rayotgan joriy talablarni ustun deb biling.
3. Menu tugmasi: `/mybots` -> bot -> Bot Settings -> Menu Button -> Configure menu button -> URL: sayt manzili, matn: masalan "PixelCore".
4. Ixtiyoriy: Bot Settings -> Configure Mini App -> Enable Mini App (asosiy Mini App; profilda "Launch app" tugmasi).
5. Ishga tushirish havolasi: `https://t.me/<bot>/<qisqa_nom>`. Deep link: `https://t.me/<bot>/<qisqa_nom>?startapp=game_<o'yin_id>` yoki `news_<yangilik_id>`, `games`, `news`, `services`.
6. `links.js` oxiridagi `TG_APP = { bot: "<bot username (@siz)>", app: "<qisqa nom>" }` ni to'ldiring (sir emas) — "Ulashish" tugmasi to'g'ri havola beradi. Keyin deploy qiling.
7. Test: havolani o'zingizga yuboring va ochib, pastdagi qo'lda tekshirish ro'yxatidan o'ting.

## 2. Vercel — DIQQAT: tarif
Vercel rasmiy hujjati (fair use guidelines) bo'yicha **Hobby tarifi faqat shaxsiy, notijorat foydalanish uchun**; har qanday tijorat foydalanish Pro yoki Enterprise talab qiladi (Vercel tijorat deb "loyihada ishtirok etgan istalgan kishining moliyaviy foydasi uchun ishlatilgan deployment"ni hisoblaydi). Saytingiz pullik xizmatlar (sayt, bot, taqdimot) narxlari va buyurtma tugmalarini ko'rsatadi, shuning uchun **Hobby yetarli deb hisoblamang** — ehtimol shartlarga zid. Pro pullik (taxminan oyiga $20, joriy narxni vercel.com/pricing'da tekshiring). Bepul muqobil (Cloudflare Pages, Firebase Hosting va h.k.) shartlari **men tomonimdan tekshirilmadi**; qaror qilishdan oldin ularning joriy shartlarini o'qing. Eslatma: `api/sitemap.js` va `api/share.js` Vercel funksiyalari — boshqa hostingga o'tsangiz ular qayta yozilishi kerak. Qo'shimcha: Vercel Environment Variables A bosqichida kerak emas.

## 3. Firebase Spark kvotalari (rasmiy sahifalar bo'yicha)
Firestore bepul kvota: **50 000 o'qish/kun, 20 000 yozish/kun, 20 000 o'chirish/kun, 1 GiB, 10 GiB/oy chiqish trafigi**; kvota tugasa operatsiyalar keyingi nollanishgacha (taxminan Tinch okeani vaqti yarim tuni) xato beradi — sayt ro'yxatlarni bo'sh ko'rsatadi. Hisob: bosh sahifa bir sessiyada barcha `games` hujjatlari + oxirgi 60 gacha `news` hujjatini o'qiydi. Masalan 10 o'yin + 20 yangilik = ~30 o'qish/sessiya -> ~1 600 sessiya/kun chegarasi; 40 o'yin + 60 yangilik bo'lsa ~100 o'qish/sessiya -> ~500 sessiya/kun. Telegram trafigi oshsa birinchi bo'lib o'qish kvotasi tugaydi. reCAPTCHA Enterprise bepul kvotasi va Authentication limitlari men tomonimdan rasmiy manbada tekshirilmadi.

## 4. Telegram Web uchun CSP (muhim)
`vercel.json`: majburiy `Content-Security-Policy: frame-ancestors https://web.telegram.org`. Rasmiy hujjat bu ro'yxatni bermaydi; `web.telegram.org` ni `telegram-web-app.js` manbasi (faqat shu origin'ga ishonadi) va Telegram hujjatidagi `Access-Control-Allow-Origin: https://web.telegram.org` eslatmasi asosida qo'ydim. Agar Telegram Web'da sayt bo'sh ochilsa, brauzer konsolida "frame-ancestors" buzilishini qidiring va ko'rsatilgan origin'ni qo'shing (taxmin qilmadim). Telegram Desktop/mobil iframe emas, ta'sir qilmaydi.

## 5. Qo'lda tekshirish ro'yxati (haqiqiy Telegram)
Android, iOS, Desktop (Windows, macOS), Web K va Web A'da: (1) sayt ochiladi, qora fon, sarlavha rangi mos; (2) email/parol bilan kirish, chiqish, sahifani qayta ochganda sessiya saqlanadi; (3) o'yinlar va yangiliklar ro'yxati yuklanadi (Firestore); (4) App Check/reCAPTCHA konsolda xato bermaydi; (5) ichki sahifada BackButton, bosh sahifada yo'q; (6) Instagram/YouTube tashqi brauzerda, "Telegram" va xizmat buyurtmasi Telegram ichida ochiladi; (7) APK/EXE/DMG yuklab olish tashqi brauzerda boshlanadi; (8) `?startapp=game_<id>` va `news_<id>` to'g'ri sahifani ochadi; (9) "Ulashish" Telegram ulashish oynasini ochadi; (10) tilni Telegram'dan taklif qiladi, tanlangan til esa ustun; (11) cookie paneli va reklama chiqmaydi, pastda "Cookie sozlamalari" bor; (12) pastki elementlar kesilmaydi (iPhone chuqurchasi, to'liq ekran).

## 6. B bosqichi
Bajarilmadi (sizning alohida tasdig'ingiz kutilmoqda, bot tokeni va Firebase service account kerak bo'ladi).


# Bot javoblari (/start) — api/bot.js
Bot `/start` va har qanday shaxsiy xabarga salom matni, "Ilovani ochish", "Xizmatlar va narxlar", 6 ta xizmat buyurtmasi (Mini App ichidagi aloqa formasi, xizmat oldindan tanlangan) va "Adminga yozing" tugmalari bilan javob beradi.
1. **Vercel -> Project -> Settings -> Environment Variables:** `TELEGRAM_BOT_TOKEN` (BotFather tokeni) va `TELEGRAM_WEBHOOK_SECRET` (o'zingiz o'ylab topgan uzun tasodifiy qator, faqat `A-Z a-z 0-9 _ -`). Keyin qayta deploy qiling.
2. **Webhook'ni ulang** (o'z kompyuteringiz terminalida, qiymatlarni o'zingiz qo'ying; tokenni hech kimga yubormang):
`curl "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=https://pixelcore-delta.vercel.app/api/bot" -d "secret_token=<SECRET>"`
Natija `"ok":true` bo'lishi kerak.
3. Botga `/start` yozib sinang. Test: `node tests/bot.test.js`.
Xavfsizlik: maxfiy sarlavha `crypto.timingSafeEqual` bilan tekshiriladi (noto'g'ri bo'lsa 401); env bo'sh bo'lsa funksiya ishlamaydi; token logga yozilmaydi. So'rov cheklovi (rate limit) yo'q.


# Buyurtma, xabarnoma va ommaviy xabar (2.5.0)
Nima qo'shildi: (1) botda "Buyurtma berish" — mijoz xizmatni tanlab tavsif yozadi, sizga Telegram'da keladi; (2) saytdagi aloqa/fikr formasi yuborilsa, sizga Telegram'da xabar keladi (`api/notify.js`); (3) botda "Yangiliklarga obuna" va admin `/broadcast` buyrug'i (`api/bot.js`, `api/_fs.js`).

## Siz qiladigan ishlar
**1. O'zingizning Telegram ID'ingizni bilib oling.** Botga `/id` yozing, javobdagi raqamni yozib oling (bu maxfiy emas).

**2. Firestore uchun ALOHIDA service account oching** (asosiy Admin SDK kalitini ishlatmang — u juda keng huquqli):
Google Cloud Console (console.cloud.google.com) -> loyiha `pixelcore-96f17` -> IAM va administratsiya -> Service accounts -> Create service account (nom: `pixelcore-bot`) -> rol: **Cloud Datastore User** (boshqa rol bermang) -> Done. Keyin shu hisobni oching -> Keys -> Add key -> Create new key -> JSON. Fayl kompyuteringizga tushadi. **Uni GitHub'ga, chatga yoki menga bermang.**

**3. Vercel -> Settings -> Environment Variables** (3 ta yangi):
- `TELEGRAM_ADMIN_ID` = 1-qadamdagi raqam.
- `FIREBASE_SERVICE_ACCOUNT` = 2-qadamdagi JSON faylning **butun matni** (faylni Bloknot'da ochib, hammasini nusxalab qo'ying).
- (`TELEGRAM_BOT_TOKEN` va `TELEGRAM_WEBHOOK_SECRET` allaqachon bor.)
Saqlagach **Redeploy** qiling. JSON fayl endi kompyuteringizdan o'chirilishi mumkin (kerak bo'lsa Google Cloud'dan yangisini ochasiz).

**4. (Ixtiyoriy) `firestore.rules` ni Firebase Console -> Firestore -> Rules ga joylang.** Yangi `tg_subscribers` bloki mijozlarga kirishni yopadi (qoida bo'lmasa ham standart holatda yopiq, lekin aniq yozilgani yaxshi).

## Ishlatish
- Mijoz: botda `/start` -> "Barcha xizmatlar va narxlar" -> "Buyurtma berish" -> xizmat -> botning so'roviga **reply** qilib tavsif yozadi. Sizga "Yangi buyurtma" xabari keladi (mijoz ismi bosilsa, profili ochiladi).
- Obuna: "Yangiliklarga obuna" tugmasi; `/stop` — bekor qilish. Faqat chat ID va sana saqlanadi (privacy.html yangilandi).
- Siz (faqat `TELEGRAM_ADMIN_ID` egasi): `/stats` — obunachilar soni; `/broadcast Matn...` — oldindan ko'rish chiqadi, **Yuborish** bosilganda hamma faol obunachilarga ketadi (oxirida "/stop" eslatmasi avtomatik qo'shiladi).
- Sayt formasi yuborilsa, sizga "Yangi murojaat (sayt)" xabari keladi.

## Cheklovlar (halol)
- `/broadcast`: bir buyruqda ~8 soniya ichida yuboradi (Vercel funksiya vaqti), soniyasiga ~25 xabar, shuning uchun taxminan **200 obunachigacha** bir martada yetadi; yetmasa, adminga "N ta yuborilmadi" deb yoziladi. Katta ro'yxat uchun keyin sahifalash kerak bo'ladi.
- Bot bloklagan foydalanuvchi (403) avtomatik obunadan chiqariladi.
- `api/notify.js` dagi so'rov cheklovi server nusxasi xotirasida (to'liq himoya emas). Spam bo'lsa, Cloudflare/Vercel Firewall yoki reCAPTCHA kerak bo'ladi.
- Buyurtmalar Firestore'da saqlanmaydi, faqat sizning Telegram'ingizga yuboriladi.
- `/broadcast` tasdiqlash tugmasini ikki marta tez bossangiz, ikki marta ketishi mumkin (past ehtimol).


# Telegram Business Assistant (yangi integratsiya)
Yangi kod mavjud webhook'ga ulangan: `api/bot.js` → `api/business.js`. Alohida bot yoki alohida hosting talab qilinmaydi. Ma'lumotlar mavjud Firestore service account orqali saqlanadi.

## 1. Vercel Environment Variables
Mavjud `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_ID`, `FIREBASE_SERVICE_ACCOUNT` qiymatlarini saqlang. Quyidagilarni qo'shing:

- `TELEGRAM_BUSINESS_ALLOWED_CHAT_IDS` — `*` (tasdiqlangan Business akkauntning barcha mijoz private chatlariga ruxsat, egasining `user_chat_id` shaxsiy chatidan tashqari) yoki vergul bilan ajratilgan aniq chat ID'lar. Bo'sh bo'lsa, Business avtomatizatsiyasi xavfsizlik uchun hech kimga javob bermaydi.
- `TELEGRAM_BUSINESS_GREETING_DAYS` — `0` bo'lsa har bir mijozga faqat bir marta salomlashadi; `30` kabi qiymat yangi davrdan keyin salomlashuvni qayta yuboradi.

`FIREBASE_SERVICE_ACCOUNT` service account'ida Firestore uchun Cloud Datastore User ruxsati bo'lishi kerak. Kod ichiga token yoki JSON kalit joylamang. `.env` Git'dan chetlatilgan.

## 2. Telegram Business akkauntni ulash
1. Telegram Business mavjud akkaunt sozlamalaridan **Chatbots** bo'limiga kiring.
2. Mavjud `@pixelcorestudio_bot` botini ulang.
3. Xabarlarni qabul qilish va javob berish uchun kerakli Business bot ruxsatlarini bering (`can_reply`).
4. Ulanish yangilanishi kelishi uchun webhook faol bo'lishi kerak. Kod `business_connection` ichidagi `user.id` ni `TELEGRAM_ADMIN_ID` bilan solishtiradi; mos kelmasa, ulanish rad etiladi.
5. Bot faqat `is_enabled=true`, `can_reply=true`, admin ID mos va allow-list ichidagi chatlarga javob beradi. Business akkaunt egasining `user_chat_id` shaxsiy chatiga javob bermaydi.

## 3. Webhook'ni yangilash
Avvalgi webhook URL va secret o'zgarmaydi. `allowed_updates` ro'yxatiga Business update'larini qo'shing. Token va secretni faqat o'zingizning terminalingizda almashtiring:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://pixelcore-delta.vercel.app/api/bot" \
  -d "secret_token=<SECRET>" \
  -d 'allowed_updates=["message","callback_query","business_connection","business_message"]'
```

Telegram Bot API hujjatida Business uchun `business_connection` va `business_message` update'lari, javob yuborishda esa `sendMessage.business_connection_id` qo'llanadi: https://core.telegram.org/bots/api

## 4. Ishlatish
Mijoz Business chatga birinchi marta yozganda avtomatik salomlashuv yuboriladi. Keyingi xabarlarda takrorlanmaydi. `/services`, `/portfolio`, `/contact`, `/order`, `/about`, `/help` tayyor javoblari mavjud. `/order` bosqichma-bosqich ism, xizmat, loyiha tavsifi va aloqa ma'lumotini yig'adi; buyurtma Firestore'ga yozilib, mavjud bot orqali adminga yuboriladi.

Admin buyruqlari (faqat `TELEGRAM_ADMIN_ID`):
- `/business_on` va `/business_off` — Business avtomatik javoblarini yoqish/o'chirish.
- `/business_status` — Business ulanishlari va mijozlar soni.
- `/business_greeting <matn>` — salomlashuvni o'zgartirish.
- `/business_services <matn>` — xizmatlar javobini o'zgartirish.
- `/business_links <telegram> | <instagram> | <youtube>` — uchta ijtimoiy havolani yangilash.
- `/business_greeting_default` — standart salomlashuvni qayta tiklash (custom greeting o'rniga).
- `/orders` — bot va Business buyurtmalarining umumiy ro'yxati.
- `/business_orders` — Business buyurtmalari.
- `/business_customers` — mijozlar ro'yxati.
- `/business_history <chat_id>` — mijozning oxirgi murojaatlari.
- `/business_resume <chat_id>` — admin pauzasini botning shaxsiy chatidan bekor qilish.

Admin Business chatda o'zi javob yozsa, shu mijoz uchun avtomatik javoblar pauzaga o'tadi. Shu mijoz chatida `/resume` yuborish avtomatik javobni qayta yoqadi. Eslatma: `/resume` Business akkaunt nomidan yuborilgan xabar sifatida mijozga ko'rinishi mumkin; avtomatizatsiyani qayta yoqishda ehtiyot bo'ling.

## 5. Ijtimoiy havolalar bo'yicha tekshiruv
Business salomlashuvdagi havolalar repository `links.js` dan tekshirildi: Telegram `@PixelCoreStudio`, Instagram esa hozircha repository'da `esalimniyazov` shaxsiy username'iga, YouTube `@pixelcorestudioyoutube` ga yo'naltirilgan. Agar yangi `@pixelcore_studio` sahifasi rasmiy manzil bo'lsa, deploydan oldin `api/business.js` dagi Instagram URL'ni va `links.js` dagi `LINKS.instagram` ni bir xil to'g'ri manzilga yangilang. Repo ichidagi eski URL'ni yashirincha boshqa manzilga almashtirmadim.

## 6. Saqlash va cheklovlar
Yangi Firestore kolleksiyalari: `tg_business_connections`, `tg_business_events`, `tg_business_customers`, `tg_business_orders`, `tg_business_settings`, `tg_order_sessions`, `tg_orders`. Ular mavjud kolleksiyalarga tegmaydi. Event ID hujjati orqali qayta yuborilgan webhook update'lari deduplikatsiya qilinadi.

Vercel serverless arxitekturasi sababli xotiradagi queue ishlatilmaydi; mijoz, sozlama va buyurtmalar Firestore'da saqlanadi. Telegram 429/5xx xatolarida Business javobi cheklangan retry qiladi. Webhook'ga 200 qaytarish strategiyasi mavjud botdagi kabi saqlangan: muvaffaqiyatsiz event Telegram tomonidan qayta yuborilmasligi mumkin. Shu sababli Telegram/Firestore vaqtinchalik uzilishlaridan keyingi mutlaq yetkazib berish kafolatlanmaydi; monitoring va haqiqiy Telegram sinovi zarur.
