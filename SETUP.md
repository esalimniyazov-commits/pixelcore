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
| Kirmagan: `create /contacts/x` (to'g'ri maydonlar, `created=request.time`) | Ruxsat |
| Kirmagan: `read /contacts/x` | Rad |
| Admin (email_verified=true): `write /news/x` | Ruxsat |

## 4. Vercel
1. Loyihani GitHub'ga yuklang → vercel.com → **Add New → Project → Import**.
2. **Framework Preset: Other**; Build Command va Output Directory — **bo'sh**. Deploy.
3. `vercel.json` sarlavhalar va `/sitemap.xml → /api/sitemap` yo'naltirishini o'z ichiga oladi. `api/sitemap.js` Vercel Hobby'da bepul ishlaydi (Node 18+).
4. Deploy'dan so'ng tekshiring: `/sitemap.xml` (o'yin va yangilik sahifalari ro'yxatda bo'lsin), `/robots.txt`, `/manifest.webmanifest`.
5. Google Search Console'da `https://pixelcore-delta.vercel.app/sitemap.xml` ni yuboring.

## 5. Kontentni to'ldirish (admin.html)
- **O'yinlar:** mavjud o'yinlaringiz o'zgarishsiz ko'rinadi. Yangi maydonlar (janr, cover, video, xususiyatlar, tavsiya etilgan talablar, ru/en tavsif) ixtiyoriy — tahrirlash orqali to'ldiring. `Janr` bo'sh bo'lsa, filtr va "o'xshash o'yinlar" ishlamaydi.
- **Roadmap, Jamoa, Yangiliklar** — hozircha bo'sh; saytda "hali yo'q" xabari ko'rinadi (soxta kontent qo'shilmagan).
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
