/* PixelCore Studio — Telegram bot webhook (Vercel funksiyasi).
   /start va boshqa xabarlarga: salom matni + "Ilovani ochish" + xizmatlar tugmalari bilan javob beradi.
   SIRLAR faqat Vercel Environment Variables'da: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET. Kodda va repoda sir YO'Q. */
const crypto = require("crypto");
const fsMod = require("./_fs.js");
const SITE = "https://pixelcore-delta.vercel.app";
const ADMIN = "https://t.me/esalimniyazov";
const CHANNEL = "https://t.me/PixelCoreStudio";
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

const esc = function (x) { return String(x == null ? "" : x).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
const ORDER_PREFIX = "📝 Buyurtma: ";
const FOOTER = "\n\n— /stop: obunani bekor qiliş";
const HELP = "ℹ️ Buyruqlar:\n/start — bosh menyu\n/stop — yangiliklar obunasini bekor qiliş\n/id — Telegram ID'ingiz";

function keyboard() {
  return { inline_keyboard: [
    [{ text: "🎮 Ilovani oçiş", web_app: { url: SITE + "/" } }],
    [{ text: "🛠 Barcha xizmatlar va narxlar", callback_data: "srv" }],
    [{ text: "🔔 Yangiliklarga obuna", callback_data: "sub" }],
    [{ text: "💬 Adminga yozing", url: ADMIN }],
  ] };
}
function servicesKeyboard() {
  return { inline_keyboard: [
    [{ text: "🛒 Buyurtma beriş", callback_data: "ord" }],
    [{ text: "💬 Adminga yozing", url: ADMIN }],
    [{ text: "📝 Buyurtma formasi (sayt)", web_app: { url: SITE + "/contact.html" } }, { text: "📣 Telegram kanal", url: CHANNEL }],
    [{ text: "⬅️ Orqaga", callback_data: "menu" }],
  ] };
}
function orderKeyboard() {
  const rows = [];
  for (let i = 0; i < PRICES.length; i += 2) rows.push(PRICES.slice(i, i + 2).map(function (p, j) { return { text: p[0] + " " + p[1].split(" ")[0], callback_data: "o:" + (i + j) }; }));
  rows.push([{ text: "⬅️ Orqaga", callback_data: "srv" }]);
  return { inline_keyboard: rows };
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
const isAdmin = function (env, id) { return !!env.TELEGRAM_ADMIN_ID && String(id) === String(env.TELEGRAM_ADMIN_ID); };
const nameOf = function (u) { return [u.first_name, u.last_name].filter(Boolean).join(" ") || "—"; };

async function broadcast(ctx, text) {
  const t0 = ctx.now(), list = await ctx.fs.subscribers(500), out = { sent: 0, blocked: 0, failed: 0, left: 0, total: list.length };
  for (let i = 0; i < list.length; i += 25) {
    if (ctx.now() - t0 > 8000) { out.left = list.length - i; break; } // Vercel vaqt chegarasi: qolganini bildiramiz
    const batch = list.slice(i, i + 25); let limited = false;
    await Promise.all(batch.map(async function (u) {
      const r = await ctx.call("sendMessage", { chat_id: u.chatId, text: text + FOOTER });
      if (r.ok) out.sent++;
      else if (r.status === 403) { out.blocked++; try { await ctx.fs.patch("tg_subscribers", String(u.chatId), { subscribed: false }); } catch (e) {} } // bot bloklangan
      else { out.failed++; if (r.status === 429) limited = true; }
    }));
    if (limited) { out.left = list.length - i - batch.length; break; }
    if (i + 25 < list.length) await ctx.sleep(1100); // Telegram: ~30 xabar/soniya
  }
  return out;
}

// Faqat shaxsiy chat. ctx: { call(method, payload) -> {ok,status}, fs, env, now(), sleep(ms) }
async function handle(update, ctx) {
  const env = ctx.env, q = update && update.callback_query;
  if (q && q.message && q.message.chat && q.message.chat.type === "private" && typeof q.data === "string") {
    const chat = q.message.chat.id, mid = q.message.message_id, edit = function (text, kb, html) { return ctx.call("editMessageText", { chat_id: chat, message_id: mid, text: text, parse_mode: html ? "HTML" : undefined, reply_markup: kb }); };
    const ans = function (text) { return ctx.call("answerCallbackQuery", { callback_query_id: q.id, text: text, show_alert: false }); };
    if (q.data === "srv") { await ans(); await edit(SERVICES_TEXT, servicesKeyboard(), true); return true; }
    if (q.data === "menu") { await ans(); await edit(TEXT, keyboard()); return true; }
    if (q.data === "ord") { await ans(); await edit("🛒 Qaysi xizmatga buyurtma bermoqchisiz?", orderKeyboard()); return true; }
    const om = /^o:([0-5])$/.exec(q.data);
    if (om && PRICES[+om[1]]) {
      await ans();
      await ctx.call("sendMessage", { chat_id: chat, text: ORDER_PREFIX + PRICES[+om[1]][1] + "\n\nNima kerakligini qisqa yozing (vazifa, muddat, qo'şimça talablar). Telefon raqam yoki @username qoldirsangiz, tezroq bog'lanamiz.\n\n⬇️ Şu xabarga javob (reply) qilib yozing.", reply_markup: { force_reply: true, input_field_placeholder: "Tavsifni yozing..." } });
      return true;
    }
    if (q.data === "sub") {
      if (!ctx.fs.configured) { await ans("Obuna hozircha mavjud emas."); return true; }
      try { await ctx.fs.patch("tg_subscribers", String(chat), { chatId: chat, subscribed: true, updated: new Date(ctx.now()) }); await ans("🔔 Obuna bo'ldingiz. Bekor qiliş: /stop"); } catch (e) { await ans("Xatolik. Keyinroq urinib ko'ring."); }
      return true;
    }
    if ((q.data === "bc_go" || q.data === "bc_no") && isAdmin(env, q.from && q.from.id)) {
      if (q.data === "bc_no") { await ans(); await edit("❌ Bekor qilindi."); return true; }
      const text = q.message.text || ""; await ans(); await edit("⏳ Yuborilmoqda...");
      try { const r = await broadcast(ctx, text); await edit("✅ Yuborildi: " + r.sent + " ta (jami " + r.total + "). Bloklagan: " + r.blocked + ", xato: " + r.failed + (r.left ? ". ⚠️ Vaqt/limit tufayli " + r.left + " ta yuborilmadi." : ".")); }
      catch (e) { await edit("⚠️ Xatolik: obunachilar ro'yxatini olib bo'lmadi."); }
      return true;
    }
    return false;
  }
  const m = update && update.message;
  if (!m || !m.chat || m.chat.type !== "private" || typeof m.text !== "string") return false;
  const chat = m.chat.id, reply = function (text, extra) { return ctx.call("sendMessage", Object.assign({ chat_id: chat, text: text }, extra)); };
  const cm = /^\/(\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/.exec(m.text);
  const cmd = cm ? cm[1].toLowerCase() : "", arg = cm && cm[2] ? cm[2].trim() : "";

  // Buyurtma: bot so'ragan xabarga reply (holat saqlanmaydi, xizmat nomi xabar matnidan olinadi va tekshiriladi)
  const rp = m.reply_to_message;
  if (!cm && rp && typeof rp.text === "string" && rp.text.indexOf(ORDER_PREFIX) === 0) {
    const svc = PRICES.find(function (p) { return rp.text.split("\n")[0] === ORDER_PREFIX + p[1]; });
    if (svc) {
      const txt = m.text.trim();
      if (txt.length < 3 || txt.length > 2000) { await reply("Tavsif 3 dan 2000 belgigacha bo'lsin. Qaytadan yozing."); return true; }
      if (!env.TELEGRAM_ADMIN_ID) { await reply("Buyurtma qabul qiliş hozircha sozlanmagan. Adminga yozing: " + ADMIN); return true; }
      const u = m.from || {}, uname = u.username ? " (@" + u.username + ")" : "";
      const r = await ctx.call("sendMessage", { chat_id: env.TELEGRAM_ADMIN_ID, parse_mode: "HTML", text: "🆕 <b>Yangi buyurtma (bot)</b>\n\n<b>Xizmat:</b> " + esc(svc[0] + " " + svc[1]) + "\n<b>Mijoz:</b> <a href=\"tg://user?id=" + Number(u.id || chat) + "\">" + esc(nameOf(u)) + "</a>" + esc(uname) + "\n<b>ID:</b> " + Number(u.id || chat) + "\n\n<b>Tavsif:</b>\n" + esc(txt) });
      await reply(r.ok ? "✅ Buyurtmangiz qabul qilindi. Tez orada siz bilan bog'lanamiz." : "⚠️ Yuborib bo'lmadi. Iltimos, adminga yozing: " + ADMIN);
      return true;
    }
  }
  if (cmd === "id") { await reply("Sizning Telegram ID'ingiz: " + chat); return true; }
  if (cmd === "help") { await reply(HELP); return true; }
  if (cmd === "stop") {
    if (ctx.fs.configured) { try { await ctx.fs.patch("tg_subscribers", String(chat), { chatId: chat, subscribed: false, updated: new Date(ctx.now()) }); } catch (e) {} }
    await reply("🔕 Yangiliklar obunasi bekor qilindi."); return true;
  }
  if (isAdmin(env, m.from && m.from.id)) {
    if (cmd === "stats") {
      try { const l = await ctx.fs.subscribers(500); await reply("📊 Obunachilar: " + l.length); } catch (e) { await reply("⚠️ Firestore'ga ulanib bo'lmadi."); }
      return true;
    }
    if (cmd === "broadcast") {
      if (!arg || arg.length > 3500) { await reply("Foydalanish: /broadcast <matn> (1–3500 belgi)"); return true; }
      let n = 0; try { n = (await ctx.fs.subscribers(500)).length; } catch (e) { await reply("⚠️ Firestore'ga ulanib bo'lmadi."); return true; }
      await reply(arg, { reply_markup: { inline_keyboard: [[{ text: "✅ Yuborish (" + n + " obunachi)", callback_data: "bc_go" }, { text: "❌ Bekor", callback_data: "bc_no" }]] } });
      return true;
    }
  }
  await reply(TEXT, { reply_markup: keyboard() });
  return true;
}
async function handler(req, res, deps) {
  const env = (deps && deps.env) || process.env, doFetch = (deps && deps.fetch) || fetch;
  const token = env.TELEGRAM_BOT_TOKEN, secret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return res.status(500).json({ ok: false });           // sozlanmagan: ishlamaydi (ochiq qolmaydi)
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!safeEqual(req.headers["x-telegram-bot-api-secret-token"], secret)) return res.status(401).json({ ok: false }); // Telegram'dan emas
  try {
    await handle(req.body, {
      env: env, fs: (deps && deps.fs) || fsMod.create({ env: env, fetch: doFetch }), now: (deps && deps.now) || Date.now, sleep: (deps && deps.sleep) || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },
      call: async function (method, payload) {
        const r = await doFetch("https://api.telegram.org/bot" + token + "/" + method, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok) console.error(method + " status", r.status); // token logga yozilmaydi
        return { ok: r.ok, status: r.status };
      },
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
module.exports.ORDER_PREFIX = ORDER_PREFIX;
