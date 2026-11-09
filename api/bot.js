/* PixelCore Studio — Telegram bot webhook (Vercel funksiyasi).
   /start va boshqa xabarlarga: salom matni + "Ilovani ochish" + xizmatlar tugmalari bilan javob beradi.
   SIRLAR faqat Vercel Environment Variables'da: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET. Kodda va repoda sir YO'Q. */
const crypto = require("crypto");
const SITE = "https://pixelcore-delta.vercel.app";
const ADMIN = "https://t.me/esalimniyazov";
const CHANNEL = "https://t.me/PixelCoreStudio";
const SERVICES = [["web", "🌐 Veb-sayt"], ["bot", "🤖 Telegram bot"], ["ppt", "📊 Taqdimot"], ["art", "✍️ Maqola"], ["test", "📝 Test"], ["doc", "📄 Hujjat"]];
// Narxlar links.js dagi SERVICES bilan BIR XIL bo'lishi kerak (tests/bot.test.js buni tekshiradi). Matnlar js/dict.js (uz) dan.
const PRICES = [
  ["🌐", "Veb-sayt yaratiş", "Biznesingiz, xizmatingiz yoki şaxsiy loyihangiz uçun oddiy, çiroyli va tez işlaydigan sayt.", 700000, ""],
  ["🤖", "Telegram bot yaratiş", "Mijozlar bilan işlaşni osonlaştiradigan bot: savollarga javob beriş, buyurtma qabul qiliş.", 500000, ""],
  ["📊", "Taqdimot (prezentatsiya)", "Biznes, öqiş yoki tadbir uçun çiroyli va tuşunarli slaydlar.", 30000, "1 slayd"],
  ["✍️", "Maqola va matn yoziş", "Sayt, ijtimoiy tarmoq va bloglar uçun maqolalar, postlar va tavsiflar.", 30000, "1000 belgi"],
  ["📝", "Test va savollar tuziş", "Dars, kurs yoki tanlov uçun test savollari: javob variantlari va töğri javoblar bilan.", 2000, "1 savol"],
  ["📄", "Hujjat işlari", "Rezyume, ariza, hisobot va boşqa hujjatlarni tayyorlaş va rasmiylaştiriş.", 30000, "1 hujjat"],
];
const money = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
const SERVICES_TEXT = "💼 <b>Xizmatlarimiz va narxlar</b>\n\n" + PRICES.map(function (p) {
  return p[0] + " <b>" + p[1] + "</b> — " + money(p[3]) + " söm'dan" + (p[4] ? " (" + p[4] + ")" : "") + "\n<i>" + p[2] + "</i>";
}).join("\n\n") + "\n\n📩 Buyurtma berişdan oldin narx va muddatni kelişib olamiz. Murojaat uçun pastdagi tugmalardan birini tanlang 👇";
const TEXT = "👋 PixelCore Studio'ga xuş kelibsiz!\n\nBu yerda öyinlarimiz va yangiliklarni körişingiz, şuningdek xizmatlarimizga buyurtma berişingiz mumkin:\n🌐 sayt • 🤖 Telegram bot • 📊 taqdimot • ✍️ maqola • 📝 test • 📄 hujjat\n\nPastdagi tugmalardan birini tanlang 👇";

function keyboard() {
  const rows = [[{ text: "🎮 Ilovani oçiş", web_app: { url: SITE + "/" } }], [{ text: "🛠 Barcha xizmatlar va narxlar", callback_data: "srv" }]];
  for (let i = 0; i < SERVICES.length; i += 2) {
    rows.push(SERVICES.slice(i, i + 2).map(function (s) { return { text: s[1], web_app: { url: SITE + "/contact.html?service=" + s[0] } }; }));
  }
  rows.push([{ text: "💬 Adminga yozing", url: ADMIN }]);
  return { inline_keyboard: rows };
}
function servicesKeyboard() {
  return { inline_keyboard: [
    [{ text: "💬 Adminga yozing (buyurtma)", url: ADMIN }],
    [{ text: "📝 Buyurtma formasi", web_app: { url: SITE + "/contact.html" } }, { text: "📣 Telegram kanal", url: CHANNEL }],
    [{ text: "⬅️ Orqaga", callback_data: "menu" }],
  ] };
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
// Faqat shaxsiy chat. call(method, payload) — Telegram API'ni chaqiradi (sinashda almashtiriladi).
async function handle(update, call) {
  const q = update && update.callback_query;
  if (q && q.message && q.message.chat && q.message.chat.type === "private" && (q.data === "srv" || q.data === "menu")) {
    await call("answerCallbackQuery", { callback_query_id: q.id });
    const menu = q.data === "menu";
    await call("editMessageText", { chat_id: q.message.chat.id, message_id: q.message.message_id, text: menu ? TEXT : SERVICES_TEXT, parse_mode: "HTML", reply_markup: menu ? keyboard() : servicesKeyboard() });
    return true;
  }
  const m = update && update.message;
  if (!m || !m.chat || m.chat.type !== "private" || typeof m.text !== "string") return false;
  await call("sendMessage", { chat_id: m.chat.id, text: TEXT, reply_markup: keyboard() });
  return true;
}
async function handler(req, res, deps) {
  const env = (deps && deps.env) || process.env, doFetch = (deps && deps.fetch) || fetch;
  const token = env.TELEGRAM_BOT_TOKEN, secret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return res.status(500).json({ ok: false });           // sozlanmagan: ishlamaydi (ochiq qolmaydi)
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!safeEqual(req.headers["x-telegram-bot-api-secret-token"], secret)) return res.status(401).json({ ok: false }); // Telegram'dan emas
  try {
    await handle(req.body, async function (method, payload) {
      const r = await doFetch("https://api.telegram.org/bot" + token + "/" + method, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) console.error(method + " status", r.status); // token logga yozilmaydi
    });
  } catch (e) { console.error("bot error", e && e.name); }
  return res.status(200).json({ ok: true }); // doim 200: Telegram qayta-qayta yubormasin
}
module.exports = function (req, res) { return handler(req, res); };
module.exports.handler = handler;
module.exports.keyboard = keyboard;
module.exports.PRICES = PRICES;
module.exports.SERVICES_TEXT = SERVICES_TEXT;
module.exports.handle = handle;
