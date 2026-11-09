/* Sayt formasi (aloqa / fikr) yuborilgach adminga Telegram'da xabar yuboradi.
   Brauzerdan faqat hujjat ID keladi; matnni server o'zi Firestore'dan o'qiydi (soxta matn yuborib bo'lmaydi).
   Sirlar (Vercel env): TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID, FIREBASE_SERVICE_ACCOUNT. */
const fsMod = require("./_fs.js");
const SITE = "https://pixelcore-delta.vercel.app";
const KINDS = { contact: "contacts", feedback: "feedback" };
const hits = new Map(); // IP bo'yicha taxminiy cheklov (har bir server nusxasida alohida — to'liq himoya emas)
const esc = (x) => String(x == null ? "" : x).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cut = (x, n) => { x = String(x == null ? "" : x); return x.length > n ? x.slice(0, n) + "…" : x; };

function limited(ip, now) {
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 6;
}
function render(kind, d) {
  if (kind === "contact") return "📩 <b>Yangi murojaat (sayt)</b>\n\n<b>Ism:</b> " + esc(cut(d.name, 80)) + "\n<b>Email:</b> " + esc(cut(d.email, 120)) + "\n<b>Til:</b> " + esc(cut(d.lang, 5)) + "\n\n" + esc(cut(d.message, 2000));
  return "💡 <b>Yangi fikr/xato xabari (sayt)</b>\n\n<b>Turi:</b> " + esc(cut(d.type, 20)) + "\n<b>Email:</b> " + esc(cut(d.email, 120)) + (d.gameId ? "\n<b>O'yin:</b> " + esc(cut(d.gameId, 60)) : "") + "\n\n" + esc(cut(d.text, 1000));
}
async function handler(req, res, deps) {
  const env = (deps && deps.env) || process.env, doFetch = (deps && deps.fetch) || fetch, now = ((deps && deps.now) || Date.now)();
  const fs = (deps && deps.fs) || fsMod.create({ env, fetch: doFetch });
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_ID || !fs.configured) return res.status(503).json({ ok: false });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const origin = req.headers.origin; // faqat o'z saytimiz (origin bo'lmasa ham o'tadi: serverdan-serverga emas, lekin xavfsizlik asosiy tekshiruvlarda)
  if (origin && origin !== SITE && !/^http:\/\/localhost(:\d+)?$/.test(origin)) return res.status(403).json({ ok: false });
  const ip = String((req.headers["x-forwarded-for"] || "").split(",")[0] || "x").trim();
  if (limited(ip, now)) return res.status(429).json({ ok: false });
  const b = req.body && typeof req.body === "object" ? req.body : {};
  if (!KINDS[b.kind] || typeof b.id !== "string" || !/^[A-Za-z0-9]{10,40}$/.test(b.id)) return res.status(400).json({ ok: false });
  try {
    const col = KINDS[b.kind], d = await fs.get(col, b.id);
    if (!d) return res.status(404).json({ ok: false });
    if (d.notified) return res.status(200).json({ ok: true, dup: true });                 // qayta yuborilmaydi
    if (!d.created || now - Date.parse(d.created) > 15 * 60000) return res.status(410).json({ ok: false }); // eski hujjat uchun xabar yo'q
    const r = await doFetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: env.TELEGRAM_ADMIN_ID, parse_mode: "HTML", text: render(b.kind, d), disable_web_page_preview: true }) });
    if (!r.ok) { console.error("notify telegram status", r.status); return res.status(502).json({ ok: false }); }
    await fs.patch(col, b.id, { notified: true });
    return res.status(200).json({ ok: true });
  } catch (e) { console.error("notify error", e && e.message); return res.status(500).json({ ok: false }); }
}
module.exports = function (req, res) { return handler(req, res); };
module.exports.handler = handler;
module.exports.render = render;
