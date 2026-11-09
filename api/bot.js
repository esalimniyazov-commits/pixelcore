/* PixelCore Studio — Telegram bot webhook (Vercel funksiyasi).
   /start va boshqa xabarlarga: salom matni + "Ilovani ochish" + xizmatlar tugmalari bilan javob beradi.
   SIRLAR faqat Vercel Environment Variables'da: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET. Kodda va repoda sir YO'Q. */
const crypto = require("crypto");
const SITE = "https://pixelcore-delta.vercel.app";
const ADMIN = "https://t.me/esalimniyazov";
const SERVICES = [["web", "🌐 Veb-sayt"], ["bot", "🤖 Telegram bot"], ["ppt", "📊 Taqdimot"], ["art", "✍️ Maqola"], ["test", "📝 Test"], ["doc", "📄 Hujjat"]];
const TEXT = "👋 PixelCore Studio'ga xuş kelibsiz!\n\nBu yerda öyinlarimiz va yangiliklarni körişingiz, şuningdek xizmatlarimizga buyurtma berişingiz mumkin:\n🌐 sayt • 🤖 Telegram bot • 📊 taqdimot • ✍️ maqola • 📝 test • 📄 hujjat\n\nPastdagi tugmalardan birini tanlang 👇";

function keyboard() {
  const rows = [[{ text: "🎮 Ilovani oçiş", web_app: { url: SITE + "/" } }], [{ text: "🛠 Barcha xizmatlar va narxlar", web_app: { url: SITE + "/services.html" } }]];
  for (let i = 0; i < SERVICES.length; i += 2) {
    rows.push(SERVICES.slice(i, i + 2).map(function (s) { return { text: s[1], web_app: { url: SITE + "/contact.html?service=" + s[0] } }; }));
  }
  rows.push([{ text: "💬 Adminga yozing", url: ADMIN }]);
  return { inline_keyboard: rows };
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
// Faqat shaxsiy chatdagi xabarga javob beradi. send — sinash uchun almashtiriladigan funksiya.
async function handle(update, send) {
  const m = update && update.message;
  if (!m || !m.chat || m.chat.type !== "private" || typeof m.text !== "string") return false;
  await send({ chat_id: m.chat.id, text: TEXT, reply_markup: keyboard() });
  return true;
}
async function handler(req, res, deps) {
  const env = (deps && deps.env) || process.env, doFetch = (deps && deps.fetch) || fetch;
  const token = env.TELEGRAM_BOT_TOKEN, secret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return res.status(500).json({ ok: false });           // sozlanmagan: ishlamaydi (ochiq qolmaydi)
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!safeEqual(req.headers["x-telegram-bot-api-secret-token"], secret)) return res.status(401).json({ ok: false }); // Telegram'dan emas
  try {
    await handle(req.body, async function (payload) {
      const r = await doFetch("https://api.telegram.org/bot" + token + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) console.error("sendMessage status", r.status); // token logga yozilmaydi
    });
  } catch (e) { console.error("bot error", e && e.name); }
  return res.status(200).json({ ok: true }); // doim 200: Telegram qayta-qayta yubormasin
}
module.exports = function (req, res) { return handler(req, res); };
module.exports.handler = handler;
module.exports.keyboard = keyboard;
module.exports.handle = handle;
