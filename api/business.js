/* PixelCore Studio — Telegram Business automation.
 * Webhook updates: business_connection and business_message.
 * Requires explicit allow-list + verified owner ID + Firestore persistence.
 */
const crypto = require("crypto");
const LINKS = {
  site: "https://pixelcore-delta.vercel.app/",
  channel: "https://t.me/PixelCoreStudio",
  instagram: "https://www.instagram.com/esalimniyazov?igsh=MWx1YW14anFrenczOQ==",
  youtube: "https://www.youtube.com/@pixelcorestudioyoutube",
};
const GREETING = `Assalomu alaykum! 👋

Siz PixelCore Studio asoschisiga murojaat qildingiz.

Hozirda adminimiz offline yoki boshqa ishlar bilan band. Xabaringiz muvaffaqiyatli qabul qilindi. Sizga imkon qadar tezroq javob beramiz!

🚀 PIXELCORE STUDIO

Bizning xizmatlarimiz:

🎮 Game Development
💻 Software Development
🌐 Web Development
🤖 Telegram Bot Development
🎨 Digital Design

🌍 Rasmiy sayt:
${LINKS.site}

📢 Telegram: ${LINKS.channel}
📸 Instagram: ${LINKS.instagram}
▶️ YouTube: ${LINKS.youtube}

Ishonchingiz uchun rahmat! ❤️

— PixelCore Studio`;
const SERVICES = `🚀 PixelCore Studio xizmatlari

🌐 Veb-sayt yaratish
🤖 Telegram bot yaratish
📊 Taqdimot (prezentatsiya) tayyorlash
✍️ Maqola va matn yozish
📝 Test va savollar tuzish
📄 Hujjatlarni tayyorlash

Shuningdek: 🎮 Game Development, 💻 Software Development va 🎨 Digital Design yo'nalishlari.

Batafsil: ${LINKS.site}services.html`;
const ABOUT = `🚀 PixelCore Studio — mustaqil o'yin va dasturiy mahsulotlar studiyasi.\n\nSayt: ${LINKS.site}\nTelegram: ${LINKS.channel}\nInstagram: ${LINKS.instagram}\nYouTube: ${LINKS.youtube}`;
const esc = (v) => String(v == null ? "" : v).replace(/[&<>]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" }[c]));
const hash = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const truthy = (v) => v === true || v === "true" || v === "1";
function allowedChats(env) {
  return String(env.TELEGRAM_BUSINESS_ALLOWED_CHAT_IDS || "").split(",").map(x => x.trim()).filter(x => x === "*" || /^-?\d+$/.test(x));
}
function make(ctx) {
  const env = ctx.env, fs = ctx.fs;
  const adminId = String(env.TELEGRAM_ADMIN_ID || "");
  const allow = allowedChats(env);
  const configured = !!(fs && fs.configured && adminId && allow.length);
  async function send(connectionId, chatId, text, extra) {
    const payload = Object.assign({ business_connection_id: connectionId, chat_id: chatId, text, disable_web_page_preview: true }, extra || {});
    // Telegram 429 va vaqtinchalik server xatolarida faqat cheklangan retry.
    for (let attempt = 0; attempt < 3; attempt++) {
      let r;
      try {
        r = await ctx.fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
      } catch (_) {
        if (attempt < 2) { await ctx.sleep(500 * (attempt + 1)); continue; }
        return false;
      }
      if (r.ok) return true;
      if (r.status !== 429 && r.status < 500) return false;
      let wait = 500 * (attempt + 1);
      try { const j = await r.json(); if (j.parameters && j.parameters.retry_after) wait = Math.min(3000, j.parameters.retry_after * 1000); } catch (_) {}
      if (attempt < 2) await ctx.sleep(wait);
    }
    return false;
  }
  async function handleConnection(c) {
    if (!configured || !c || !c.id || !c.user || String(c.user.id) !== adminId) return false;
    const canReply = !!(c.rights && c.rights.can_reply);
    await fs.patch("tg_business_connections", hash(c.id), {
      connectionId: c.id, ownerId: String(c.user.id), userChatId: String(c.user_chat_id || ""),
      enabled: !!c.is_enabled, canReply, updatedAt: new Date(ctx.now())
    });
    return true;
  }
  async function handleMessage(m, updateId) {
    if (!configured || !m || !m.business_connection_id || !m.chat || m.chat.type !== "private") return false;
    const connectionId = m.business_connection_id, chatId = String(m.chat.id);
    if (!allow.includes("*") && !allow.includes(chatId)) return false;
    const connection = await fs.get("tg_business_connections", hash(connectionId));
    if (!connection || !truthy(connection.enabled) || !truthy(connection.canReply) || String(connection.ownerId) !== adminId) return false;
    // Business akkaunt egasining o'ziga tegishli shaxsiy chatiga bot hech qachon javob bermaydi.
    if (connection.userChatId && chatId === String(connection.userChatId)) return false;
    const settings = await fs.get("tg_business_settings", "global") || {};
    if (settings.enabled === false) return true;

    // Barcha Business xabarlarini tarix va deduplikatsiya uchun saqlash.
    const eventKey = hash(String(updateId || "") + ":" + String(m.message_id || ""));
    const fresh = await fs.createOnce("tg_business_events", eventKey, {
      createdAt: new Date(ctx.now()), chatId, connectionId,
      senderId: String(m.from && m.from.id || ""), fromAdmin: !!(m.from && String(m.from.id) === adminId),
      text: String(m.text || m.caption || "[matn bo'lmagan xabar]").slice(0, 3000),
      messageId: Number(m.message_id || 0)
    });
    if (!fresh) return true;

    // Adminning Business akkaunti orqali yuborgan xabari: suhbatni qo'lda boshqarishga o'tkazish.
    if (m.from && String(m.from.id) === adminId) {
      const customerKey = hash(connectionId + ":" + chatId);
      const text = String(m.text || "").trim().toLowerCase();
      if (text === "/resume" || text === "/autoresume") {
        await fs.patch("tg_business_customers", customerKey, { adminPaused: false, updatedAt: new Date(ctx.now()) });
      } else {
        await fs.patch("tg_business_customers", customerKey, { adminPaused: true, adminPausedAt: new Date(ctx.now()), updatedAt: new Date(ctx.now()) });
      }
      return true;
    }
    if (!m.from || String(m.from.id) === adminId) return false;
    const key = hash(connectionId + ":" + chatId);
    let customer = await fs.get("tg_business_customers", key);
    const now = ctx.now();
    if (!customer) {
      customer = { chatId, connectionId, firstName: m.from.first_name || "", username: m.from.username || "", greeted: false, adminPaused: false };
      await fs.patch("tg_business_customers", key, Object.assign({}, customer, { firstContactAt: new Date(now), lastContactAt: new Date(now) }));
    } else {
      await fs.patch("tg_business_customers", key, { lastContactAt: new Date(now), firstName: m.from.first_name || customer.firstName || "", username: m.from.username || customer.username || "" });
    }
    if (truthy(customer.adminPaused)) return true;

    const text = String(m.text || "").trim();
    const lower = text.toLowerCase();
    const cooldownDays = Math.max(0, Math.min(365, Number(env.TELEGRAM_BUSINESS_GREETING_DAYS || 0)));
    const lastGreeting = customer.greetedAt ? Date.parse(customer.greetedAt) : 0;
    const shouldGreet = !truthy(customer.greeted) || (cooldownDays > 0 && lastGreeting && now - lastGreeting >= cooldownDays * 86400000);
    if (shouldGreet) {
      const greeting = settings.greetingText || GREETING
        .replace(LINKS.channel, settings.telegramUrl || LINKS.channel)
        .replace(LINKS.instagram, settings.instagramUrl || LINKS.instagram)
        .replace(LINKS.youtube, settings.youtubeUrl || LINKS.youtube);
      const ok = await send(connectionId, chatId, greeting);
      if (ok) await fs.patch("tg_business_customers", key, { greeted: true, greetedAt: new Date(now), greetingCount: Number(customer.greetingCount || 0) + 1 });
      return true;
    }
    if (/^\/(start|help)(@\w+)?$/.test(lower)) { await send(connectionId, chatId, "ℹ️ Mavjud buyruqlar: /services, /portfolio, /contact, /order, /about"); return true; }
    if (/^\/(services)(@\w+)?$/.test(lower) || /xizmat/.test(lower)) { await send(connectionId, chatId, settings.servicesText || SERVICES); return true; }
    if (/^\/(about)(@\w+)?$/.test(lower)) { await send(connectionId, chatId, ABOUT); return true; }
    if (/^\/(contact)(@\w+)?$/.test(lower)) { await send(connectionId, chatId, "📩 Aloqa: " + LINKS.site + "contact.html\nTelegram: " + LINKS.channel); return true; }
    if (/^\/(portfolio)(@\w+)?$/.test(lower) || /portfolio|namunalar/.test(lower)) {
      await send(connectionId, chatId, "🎮 PixelCore Studio portfoliоsi va mavjud loyihalar:\n" + LINKS.site + "games.html\n\nWeb loyiha: " + LINKS.site);
      return true;
    }
    if (/^\/order(@\w+)?$/.test(lower) || /buyurtma/.test(lower)) {
      await fs.patch("tg_business_customers", key, { orderPending: true, orderStage: "name", updatedAt: new Date(now) });
      await send(connectionId, chatId, "📝 Buyurtma berishni boshlaymiz.\n1/4. Ismingizni yozing:");
      return true;
    }
    if (truthy(customer.orderPending)) {
      if (text.length < 2 || text.length > 1500) { await send(connectionId, chatId, "Iltimos, javobni 2–1500 belgi oralig'ida yuboring."); return true; }
      const stage = customer.orderStage || "name";
      const next = { name: "service", service: "details", details: "contact" }[stage];
      if (next) {
        const field = { name: "orderName", service: "orderService", details: "orderDetails" }[stage];
        await fs.patch("tg_business_customers", key, { [field]: text, orderStage: next, updatedAt: new Date(now) });
        const prompts = { service: "2/4. Qaysi xizmat kerak?", details: "3/4. Loyiha haqida qisqacha ma'lumot bering:", contact: "4/4. Bog'lanish uchun Telegram username yoki boshqa aloqa ma'lumotini yuboring:" };
        await send(connectionId, chatId, prompts[next]);
      } else {
        const orderId = hash(connectionId + ":" + chatId + ":" + now);
        const order = { chatId, connectionId, customerName: customer.orderName || m.from.first_name || "",
          username: m.from.username || "", service: customer.orderService || "", details: customer.orderDetails || "",
          contact: text, status: "new", createdAt: new Date(now) };
        await fs.createOnce("tg_business_orders", orderId, order);
        await fs.patch("tg_business_customers", key, { orderPending: false, orderStage: "", lastOrderAt: new Date(now) });
        await ctx.call("sendMessage", { chat_id: adminId, text: "🆕 Yangi Business buyurtma\\nIsm: " + esc(order.customerName) + (order.username ? " (@" + esc(order.username) + ")" : "") + "\\nXizmat: " + esc(order.service) + "\\nLoyiha: " + esc(order.details) + "\\nAloqa: " + esc(order.contact) + "\\nChat ID: " + chatId, parse_mode: "HTML" });
        await send(connectionId, chatId, "✅ Buyurtmangiz qabul qilindi. Tez orada siz bilan bog'lanamiz!");
      }
      return true;
    }
    return true; // Business chatga ruxsat bor, ammo avtomatik javob talab qilinmaydi.
  }
  return { configured, handleConnection, handleMessage };
}
async function process(update, ctx) {
  const b = make(ctx);
  if (update && update.business_connection) return b.handleConnection(update.business_connection);
  if (update && update.business_message) return b.handleMessage(update.business_message, update.update_id);
  return false;
}
module.exports = { process, make, GREETING, SERVICES, ABOUT, allowedChats };
