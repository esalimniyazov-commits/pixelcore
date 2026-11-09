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
