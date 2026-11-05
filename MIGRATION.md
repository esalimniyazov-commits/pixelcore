# MIGRATION — ma'lumotlarni yo'qotmasdan 1.x → 2.0

**Ma'lumotlar bazasini ko'chirish (skript) kerak emas.** 2.0 mavjud hujjatlarni o'zgarishsiz o'qiydi; yangi maydonlar ixtiyoriy.

## Tartib
1. Firebase Console → Firestore → (ixtiyoriy) **Export/Backup** yoki eski qoidalarni nusxalab qo'ying.
2. `firestore.rules` ni joylashtiring (SETUP.md 1-qadam). Bu ma'lumotni o'zgartirmaydi.
3. Yangi kodni deploy qiling.
4. Admin → O'yinlar → har birini ochib yangi maydonlarni to'ldiring (ixtiyoriy).

## Mavjud kolleksiyalar bilan moslik
| Kolleksiya | 2.0'da | Eslatma |
|---|---|---|
| `games` | o'zgarishsiz o'qiladi | `status` qiymatlari `Chiqarilgan` / `Tez orada` saqlangan, yangisi `Ishlab chiqilmoqda`. Eski `link` maydoni Android havolasi sifatida o'qiladi. Yangi: `genre`, `tagline`, `cover`, `video`, `features`, `reqRec`, `*_ru`, `*_en`. |
| `images` | o'zgarishsiz | `kind` maydoni yo'q = skrinshot. |
| `news` | o'zgarishsiz | `category` yo'q bo'lsa "Yangilik" deb ko'rsatiladi. |
| `reviews` | o'zgarishsiz | ID `gameId_uid` saqlangan. Eski sharhlardagi `name` (email prefiksi bo'lishi mumkin) o'zgartirilmaydi — foydalanuvchi sharhni qayta yuborsa, yangi nom yoziladi. Admin ularni o'chirishi mumkin. |
| `feedback` | o'zgarishsiz | Eski turlar (`Xato`, `G'oya`, `Savol`) ham ko'rsatiladi. Yangi turlar: `bug`, `suggestion`, `question`. |
| `users` | o'zgarishsiz | `{email, favs}` + yangi `username`, `avatar`, `created`. Birinchi kirishda `created`/`avatar` avtomatik qo'shiladi. `banned` faqat admin yozadi. |
| `scores` | qoidalarda saqlangan | UI yo'q (eski kodda ham yo'q edi). |
| **yangi** | `team`, `comments`, `contacts`, `stats/site`, `activity` | admin panelidan to'ldiriladi. |
| `roadmap` | 2.1 dan ishlatilmaydi | agar yozgan bo'lsangiz, ma'lumot bazada qoladi, saytda ko'rinmaydi. |

## Eski foydalanuvchilar
Parol/akkauntlar o'zgarmaydi. Eski foydalanuvchi birinchi kirganda profil hujjati yangilanadi (nom yo'q bo'lsa email prefiksi ko'rsatiladi; Profil sahifasida o'zgartiradi).
**Admin hisobi `email_verified` bo'lishi shart** — eski qoidalarda ham shunday edi.

## Orqaga qaytish
Eski qoidalarni qayta joylashtirsangiz, eski sayt ishlayveradi; yangi kolleksiyalardagi ma'lumotlar shunchaki ishlatilmay qoladi.
