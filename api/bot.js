/* PixelCore Studio — Telegram bot webhook (Vercel funksiyasi).
   /start va boshqa xabarlarga: salom matni + "Ilovani ochish" + xizmatlar tugmalari bilan javob beradi.
   SIRLAR faqat Vercel Environment Variables'da: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET. Kodda va repoda sir YO'Q. */
const crypto = require("crypto");
const fsMod = require("./_fs.js");
const businessMod = require("./business.js");
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
const HELP = "ℹ️ Buyruqlar:\n/start — bosh menyu\n/help — yordam\n/services — xizmatlar\n/portfolio — portfolio\n/contact — aloqa\n/order — buyurtma berish\n/about — PixelCore Studio haqida\n/stop — yangiliklar obunasini bekor qiliş\n/id — Telegram ID'ingiz";

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
      if (ctx.fs.configured) {
        try { await ctx.fs.patch("tg_order_sessions", String(chat), { chatId: chat, stage: "name", service: PRICES[+om[1]][1], updatedAt: new Date(ctx.now()) }); } catch (e) {}
      }
      await ctx.call("sendMessage", { chat_id: chat, text: "📝 Buyurtma: " + PRICES[+om[1]][1] + "\n\n1/4. Ismingizni yozing:", reply_markup: { force_reply: true, input_field_placeholder: "Ismingiz" } });
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

  // Ko'p bosqichli buyurtma: holat Firestore'da saqlanadi, restartdan keyin ham davom etadi.
  if (!cm && ctx.fs.configured && typeof ctx.fs.get === "function") {
    try {
      const session = await ctx.fs.get("tg_order_sessions", String(chat));
      if (session && session.stage) {
        const value = m.text.trim();
        if (value.length < 2 || value.length > 1000) { await reply("Iltimos, 2–1000 belgi oralig'ida javob yuboring."); return true; }
        const fields = { updatedAt: new Date(ctx.now()) };
        const next = { name: "service", service: "details", details: "contact", contact: "done" }[session.stage];
        fields[session.stage] = value;
        if (next !== "done") {
          fields.stage = next;
          await ctx.fs.patch("tg_order_sessions", String(chat), fields);
          const prompts = { service: "2/4. Qaysi xizmat kerak? (masalan: sayt, mobil o'yin, Telegram bot)", details: "3/4. Loyiha haqida qisqacha ma'lumot bering:", contact: "4/4. Bog'lanish uchun Telegram username yoki boshqa aloqa ma'lumotini yuboring:" };
          await reply(prompts[next]);
        } else {
          const orderId = crypto.createHash("sha256").update(String(chat) + ":" + String(ctx.now()) + ":" + value).digest("hex");
          const order = { chatId: chat, customerName: session.name || "", service: session.service || "", details: session.details || "", contact: value, status: "new", createdAt: new Date(ctx.now()) };
          await ctx.fs.createOnce("tg_orders", orderId, order);
          await ctx.fs.patch("tg_order_sessions", String(chat), { stage: "", completedAt: new Date(ctx.now()) });
          if (env.TELEGRAM_ADMIN_ID) await ctx.call("sendMessage", { chat_id: env.TELEGRAM_ADMIN_ID, text: "🆕 Yangi buyurtma\\nIsm: " + esc(order.customerName) + "\\nXizmat: " + esc(order.service) + "\\nTavsif: " + esc(order.details) + "\\nAloqa: " + esc(order.contact) + "\\nChat ID: " + chat, parse_mode: "HTML" });
          await reply("✅ Buyurtmangiz qabul qilindi. Tez orada siz bilan bog'lanamiz!");
        }
        return true;
      }
    } catch (e) { console.error("order session error", e && e.name); }
  }

  // Buyurtma: eski reply usuli ham orqaga moslik uchun saqlanadi.
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
  if (cmd === "services") { await reply(SERVICES_TEXT, { parse_mode: "HTML" }); return true; }
  if (cmd === "about") { await reply("🚀 PixelCore Studio — mustaqil o'yin va dasturiy mahsulotlar studiyasi.\\n\\n🌍 " + SITE + "\\n📢 " + CHANNEL + "\\n📸 https://www.instagram.com/esalimniyazov?igsh=MWx1YW14anFrenczOQ==\\n▶️ https://www.youtube.com/@pixelcorestudioyoutube"); return true; }
  if (cmd === "portfolio") { await reply("🎮 Portfolio va loyihalar: " + SITE + "games.html\\n🌐 Web loyiha: " + SITE); return true; }
  if (cmd === "contact") { await reply("📩 Aloqa: " + ADMIN + "\\n🌍 " + SITE + "contact.html"); return true; }
  if (cmd === "order") { await reply("📝 Buyurtma berish uchun xizmatni tanlang:", { reply_markup: orderKeyboard() }); return true; }
  if (cmd === "stop") {
    if (ctx.fs.configured) { try { await ctx.fs.patch("tg_subscribers", String(chat), { chatId: chat, subscribed: false, updated: new Date(ctx.now()) }); } catch (e) {} }
    await reply("🔕 Yangiliklar obunasi bekor qilindi."); return true;
  }
  if (isAdmin(env, m.from && m.from.id)) {
    if (cmd === "business_on" || cmd === "business_off") {
      if (!ctx.fs.configured) { await reply("⚠️ Firestore sozlanmagan."); return true; }
      try { await ctx.fs.patch("tg_business_settings", "global", { enabled: cmd === "business_on", updatedAt: new Date(ctx.now()) }); await reply(cmd === "business_on" ? "✅ Business avtomatik javoblari yoqildi." : "🔕 Business avtomatik javoblari o'chirildi."); }
      catch (e) { await reply("⚠️ Sozlamani saqlab bo'lmadi."); }
      return true;
    }
    if (cmd === "business_status") {
      try {
        const st = await ctx.fs.get("tg_business_settings", "global") || {};
        const conns = await ctx.fs.list("tg_business_connections", 100);
        const customers = await ctx.fs.list("tg_business_customers", 100);
        await reply("📊 Business holati\\nAvtomatik javob: " + (st.enabled === false ? "o'chiq" : "yoqilgan") + "\\nUlangan akkauntlar: " + conns.filter(x => x.enabled && x.canReply).length + "\\nMijozlar: " + customers.length);
      } catch (e) { await reply("⚠️ Business ma'lumotlarini o'qib bo'lmadi."); }
      return true;
    }
    if (cmd === "business_greeting") {
      if (!arg || arg.length > 3500) { await reply("Foydalanish: /business_greeting <yangi salomlashuv matni>"); return true; }
      try { await ctx.fs.patch("tg_business_settings", "global", { greetingText: arg, updatedAt: new Date(ctx.now()) }); await reply("✅ Salomlashuv matni saqlandi."); }
      catch (e) { await reply("⚠️ Saqlab bo'lmadi."); }
      return true;
    }
    if (cmd === "business_services") {
      if (!arg || arg.length > 3500) { await reply("Foydalanish: /business_services <xizmatlar matni>"); return true; }
      try { await ctx.fs.patch("tg_business_settings", "global", { servicesText: arg, updatedAt: new Date(ctx.now()) }); await reply("✅ Xizmatlar matni saqlandi."); }
      catch (e) { await reply("⚠️ Saqlab bo'lmadi."); }
      return true;
    }
    if (cmd === "business_customers") {
      try {
        const customers = await ctx.fs.list("tg_business_customers", 30);
        await reply(customers.length ? "👥 Oxirgi mijozlar:\\n" + customers.map((c, i) => (i + 1) + ". " + (c.firstName || "Mijoz") + (c.username ? " (@" + c.username + ")" : "") + " — chat " + c.chatId + (c.adminPaused ? " [admin pauza]" : "")).join("\\n") : "Mijozlar tarixi bo'sh.");
      } catch (e) { await reply("⚠️ Mijozlar tarixini o'qib bo'lmadi."); }
      return true;
    }
    if (cmd === "business_resume") {
      if (!/^\d+$/.test(arg)) { await reply("Foydalanish: /business_resume <chat_id>"); return true; }
      try {
        const customers = await ctx.fs.list("tg_business_customers", 200);
        const matches = customers.filter(x => String(x.chatId) === arg);
        for (const c of matches) {
          const id = crypto.createHash("sha256").update(String(c.connectionId) + ":" + arg).digest("hex");
          await ctx.fs.patch("tg_business_customers", id, { adminPaused: false, updatedAt: new Date(ctx.now()) });
        }
        await reply(matches.length ? "✅ " + matches.length + " ta chat uchun avtomatik javob qayta yoqildi." : "Chat topilmadi.");
      } catch (e) { await reply("⚠️ Chat holatini yangilab bo'lmadi."); }
      return true;
    }
    if (cmd === "business_history") {
      if (!/^\d+$/.test(arg)) { await reply("Foydalanish: /business_history <chat_id>"); return true; }
      try {
        const events = await ctx.fs.list("tg_business_events", 100);
        const history = events.filter(x => String(x.chatId) === arg).sort((a, b) => Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0)).slice(-20);
        await reply(history.length ? "🗂 Mijoz murojaatlari tarixi (oxirgi 20):\\n" + history.map((x, i) => (i + 1) + ". " + (x.fromAdmin ? "ADMIN" : "MIJOZ") + ": " + String(x.text || "").slice(0, 250)).join("\\n") : "Bu chat bo'yicha tarix topilmadi.");
      } catch (e) { await reply("⚠️ Murojaatlar tarixini o'qib bo'lmadi."); }
      return true;
    }
    if (cmd === "business_links") {
      const parts = arg.split("|").map(x => x.trim());
      const valid = parts.length === 3 && /^https:\/\/t\.me\/[A-Za-z0-9_]+\/?$/.test(parts[0]) &&
        /^https:\/\/www\.instagram\.com\/[A-Za-z0-9_.]+\/?$/.test(parts[1]) &&
        /^https:\/\/(www\.)?youtube\.com\//.test(parts[2]);
      if (!valid) { await reply("Foydalanish: /business_links https://t.me/kanal | https://www.instagram.com/username/ | https://www.youtube.com/@kanal"); return true; }
      try { await ctx.fs.patch("tg_business_settings", "global", { telegramUrl: parts[0], instagramUrl: parts[1], youtubeUrl: parts[2], updatedAt: new Date(ctx.now()) }); await reply("✅ Ijtimoiy tarmoq havolalari yangilandi."); }
      catch (e) { await reply("⚠️ Havolalarni saqlab bo'lmadi."); }
      return true;
    }
    if (cmd === "business_greeting_default") {
      try { await ctx.fs.patch("tg_business_settings", "global", { greetingText: "", updatedAt: new Date(ctx.now()) }); await reply("✅ Standart salomlashuv qayta tiklandi."); }
      catch (e) { await reply("⚠️ Sozlamani yangilab bo'lmadi."); }
      return true;
    }
    if (cmd === "orders") {
      try {
        const a = await ctx.fs.list("tg_orders", 20), b = await ctx.fs.list("tg_business_orders", 20);
        const all = a.map(x => Object.assign({ source: "Bot" }, x)).concat(b.map(x => Object.assign({ source: "Business" }, x))).sort((x, y) => Date.parse(y.createdAt || 0) - Date.parse(x.createdAt || 0)).slice(0, 20);
        await reply(all.length ? "🧾 Oxirgi buyurtmalar:\\n" + all.map((o, i) => (i + 1) + ". [" + o.source + "] " + (o.customerName || o.name || "Mijoz") + " — " + String(o.service || "").slice(0, 100) + "\\n" + String(o.details || "").slice(0, 180)).join("\\n\\n") : "Hozircha buyurtmalar yo'q.");
      } catch (e) { await reply("⚠️ Buyurtmalarni o'qib bo'lmadi."); }
      return true;
    }
    if (cmd === "business_orders") {
      try {
        const orders = await ctx.fs.list("tg_business_orders", 20);
        await reply(orders.length ? "🧾 Oxirgi buyurtmalar:\\n" + orders.map((o, i) => (i + 1) + ". " + (o.customerName || "Mijoz") + (o.username ? " (@" + o.username + ")" : "") + " — " + String(o.details || "").slice(0, 220)).join("\\n\\n") : "Hozircha Business buyurtmalari yo'q.");
      } catch (e) { await reply("⚠️ Buyurtmalarni o'qib bo'lmadi."); }
      return true;
    }
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
    const fs = (deps && deps.fs) || fsMod.create({ env: env, fetch: doFetch });
    const ctx = {
      env: env, fs: fs, fetch: doFetch, now: (deps && deps.now) || Date.now, sleep: (deps && deps.sleep) || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },
      call: async function (method, payload) {
        const r = await doFetch("https://api.telegram.org/bot" + token + "/" + method, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok) console.error(method + " status", r.status); // token logga yozilmaydi
        return { ok: r.ok, status: r.status };
      },
    };
    const update = req.body || {};
    if (update.business_connection || update.business_message) {
      await businessMod.process(update, ctx);
    } else {
      await handle(update, ctx);
    }
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
