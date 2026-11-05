# PRICING_NOTES — narxlar qanday belgilandi

Sana: 2026-11-03. Valyuta: so'm (UZS). **Bu mening bozor tahlilim, huquqiy yoki moliyaviy maslahat emas.** Narxlarni o'z xarajatingiz, vaqtingiz va mijozlaringizga qarab o'zgartiring.

## Tasdiqlangan bozor ma'lumotlari (Toshkent)
| Xizmat | Bozor | Manba |
|---|---|---|
| Sayt-vizitka | 3–6 mln | saytyaratish.uz, 2026 maqolasi |
| Landing | 4–8 mln | o'sha manba |
| Korporativ sayt | 8–20 mln | o'sha manba |
| Telegram bot (agentlik, CRM bilan) | oddiy "dan" 3,6 mln; murakkab "dan" 9,6 mln; Mini App "dan" 24 mln | icorp.uz/telegram-bot |
| Taqdimot (frilanser, mijoz materiali bilan) | 40 000 / slayd (o'rtacha dizayn), 50 000 (yaxshilangan), 80 000+ (murakkab, animatsiya) | Salexy.uz e'loni (Toshkent) |
| Domen | .uz taxminan 35 000 so'mdan yiliga (2024 maqolasi) | sayt.uz blogi |

Qidiruvda arzon e'lonlar ham ko'rindi (sayt va botga 300 000–1 000 000 so'm atrofida), lekin ularni tekshirib bo'lmadi, shuning uchun taqqoslashda ishlatmadim.

## Tasdiqlanmagan (mening taxminim)
- **Maqola/matn, test, hujjat** uchun O'zbekiston bo'yicha ishonchli narx topilmadi (faqat bitta e'lon 75 000 so'm ko'rsatgan, birligi noaniq). Shuning uchun 30 000 / 1000 belgi, 2 000 / savol, 30 000 / hujjat — taxminiy, bozorga qarab o'zingiz sozlang.
- **Botning arzon (frilanser) narxi** tasdiqlanmadi; 500 000 / 1 200 000 / 2 500 000 agentlik narxidan ancha past ekanini bilgan holda qo'yildi.

## Qo'yilgan narxlar
| Xizmat | Narx | Bozorga nisbatan |
|---|---|---|
| Sayt: Boshlang'ich / Standart / Premium | 700 000 / 1 500 000 / 3 000 000 | vizitka bozori 3–6 mln dan ~75–80% past (Boshlang'ich), Premium korporativ bozorning (8 mln+) ancha pastida |
| Bot: Oddiy / Standart / Kengaytirilgan | 500 000 / 1 200 000 / 2 500 000 | agentlik "dan" 3,6 mln / 9,6 mln dan ancha past |
| Taqdimot | 30 000 / slayd | frilanser 40 000 dan ~25% past |
| Maqola | 30 000 / 1000 belgi | taxmin |
| Test | 2 000 / savol (kamida 10 ta) | taxmin |
| Hujjat | 30 000 / hujjat | taxmin |

## Qanday o'zgartiriladi
`links.js` → `SERVICES` (`from`, `per`) va `PACKAGES` (`price`). Masalan, taqdimotni 40 000 qilish: `from: 40000`. Keyin `git push`.

## Diqqat
- Mijozga **va'da** beradigan jumlalar (`js/dict.js`): "har bir ish topshirishdan oldin ko'rib chiqiladi", "bot uchun serverni sozlab beramiz", "aniq narx va muddat oldindan kelishiladi". Faqat haqiqatan bajara oladiganingizni qoldiring.
- AI yaratgan matn va ma'lumotlarda xato bo'lishi mumkin: topshirishdan oldin o'zingiz o'qib chiqing, "100% noyob" yoki "antiplagiat kafolati" kabi va'dalar bermang.
- **Kurs ishi, diplom, referat kabi o'quv topshiriqlarini mijoz o'z nomidan topshirishi uchun yozib bermang**: bu akademik insofsizlik hisoblanadi va saytda reklama qilinmagan.
