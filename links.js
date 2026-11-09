// Havolalar va sayt mazmunini shu yerda o'zgartiring. Bu fayl Firebase'ga bog'liq emas.
const LINKS = {
  telegram: "https://t.me/PixelCoreStudio",
  instagram: "https://www.instagram.com/esalimniyazov?igsh=MWx1YW14anFrenczOQ==",
  support: "https://t.me/esalimniyazov",
  youtube: "https://www.youtube.com/@pixelcorestudioyoutube",
  email: "esalimniyazov@gmail.com",
};
// Texnologiyalar: d — tarjima kaliti yoki oddiy matn. Faqat haqiqatan ishlatiladiganlarni qoldiring.
const TECH = [
  { n: "HTML5 / CSS3 / JavaScript", d: "tech.web" },
  { n: "Firebase Authentication", d: "tech.auth" },
  { n: "Cloud Firestore", d: "tech.fs" },
  { n: "Vercel", d: "tech.vercel" },
  { n: "PWA", d: "tech.pwa" },
];
// Foydalaniladigan dasturlar
const SOFTWARE = [
  { n: "VSCodium", d: "sw.code" },
  { n: "Git & GitHub", d: "sw.git" },
];
// Hamkorlar: [{ n: "Nomi", u: "https://..." }]. Bo'sh bo'lsa, bo'lim sahifada ko'rinmaydi.
const PARTNERS = [];

// ===== XIZMATLAR =====
// t, d, f — tarjima kaliti (js/dict.js) yoki oddiy matn.
// Narx: from — "dan" narx (so'm), per — birlik kaliti (masalan "unit.slide"). from bo'lmasa "Kelishiladi" ko'rinadi.
const SERVICES = [
  { id: "web", icon: "🌐", t: "srv.web.t", d: "srv.web.d", f: ["srv.web.f1", "srv.web.f2", "srv.web.f3", "srv.web.f4"], from: 700000 },
  { id: "bot", icon: "🤖", t: "srv.bot.t", d: "srv.bot.d", f: ["srv.bot.f1", "srv.bot.f2", "srv.bot.f3", "srv.bot.f4"], from: 500000 },
  { id: "ppt", icon: "📊", t: "srv.ppt.t", d: "srv.ppt.d", f: ["srv.ppt.f1", "srv.ppt.f2", "srv.ppt.f3", "srv.ppt.f4"], from: 30000, per: "unit.slide" },
  { id: "art", icon: "✍️", t: "srv.art.t", d: "srv.art.d", f: ["srv.art.f1", "srv.art.f2", "srv.art.f3", "srv.art.f4"], from: 30000, per: "unit.k" },
  { id: "test", icon: "📝", t: "srv.test.t", d: "srv.test.d", f: ["srv.test.f1", "srv.test.f2", "srv.test.f3", "srv.test.f4"], from: 2000, per: "unit.question" },
  { id: "doc", icon: "📄", t: "srv.doc.t", d: "srv.doc.d", f: ["srv.doc.f1", "srv.doc.f2", "srv.doc.f3", "srv.doc.f4"], from: 30000, per: "unit.doc" },
];
// Narx paketlari (so'm, "dan"). hot: true — "Ommabop" belgisi.
const PACKAGES = [
  { group: "web", items: [
    { id: "web-start", n: "pkg.web.start", price: 700000, f: ["pw.s1", "pw.s2", "pw.s3", "pw.s4"] },
    { id: "web-std", n: "pkg.web.std", price: 1500000, hot: true, f: ["pw.m1", "pw.m2", "pw.m3", "pw.m4", "pw.s4"] },
    { id: "web-pro", n: "pkg.web.pro", price: 3000000, f: ["pw.p1", "pw.p2", "pw.p3", "pw.p4", "pw.p5"] },
  ] },
  { group: "bot", items: [
    { id: "bot-start", n: "pkg.bot.start", price: 500000, f: ["pb.s1", "pb.s2", "pb.s3"] },
    { id: "bot-std", n: "pkg.bot.std", price: 1200000, hot: true, f: ["srv.bot.f1", "pb.m2", "srv.bot.f3", "pb.m4"] },
    { id: "bot-pro", n: "pkg.bot.pro", price: 2500000, f: ["pb.p1", "pb.p2", "pb.p3", "pb.p4"] },
  ] },
];
// Portfolio: faqat HAQIQIY ishlaringizni qo'shing. Ro'yxat bo'sh bo'lsa, bo'lim ko'rinmaydi.
// img — loyiha rasmi (sayt papkasidagi fayl yoki https havola), u — havola, tag: web | bot | ppt | text | test | doc
const PORTFOLIO = [
  { t: "port.site.t", d: "port.site.d", u: "https://pixelcore-delta.vercel.app/", img: "og.png", tag: "web" },
];

// ===== REKLAMA (xizmatlaringiz haqida avtomatik chiqadigan kichik oyna) =====
// enabled: false — butunlay o'chirish. delaySec — saytga kirgandan necha soniyadan keyin chiqsin.
// hideDays — foydalanuvchi yopsa, necha kun qayta chiqmasin. Bir sessiyada ko'pi bilan 1 marta chiqadi.
const PROMO = { enabled: true, delaySec: 12, hideDays: 3 };

// ===== TELEGRAM MINI APP =====
// BotFather'da Mini App yaratgach shu yerga yozing (sir EMAS, ochiq nom): bot — bot username'i (@siz), app — /newapp dagi qisqa nom.
// Mini App ichidagi "Ulashish" tugmasi t.me/<bot>/<app>?startapp=game_<id> havolasini beradi. Bo'sh bo'lsa, oddiy sayt havolasi ishlatiladi.
const TG_APP = { bot: "pixelcorestudio_bot", app: "site" };