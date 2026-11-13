const business = require("../api/business.js");
let failures = 0;
const check = (v, label) => { console.log(v ? "  ✓" : "  ✗ FAIL:", label); if (!v) failures++; };
(async () => {
  const store = {};
  const fs = {
    configured: true,
    async get(col, id) { return store[col + "/" + id] || null; },
    async patch(col, id, obj) { store[col + "/" + id] = Object.assign({}, store[col + "/" + id], obj); return true; },
    async createOnce(col, id, obj) { const k = col + "/" + id; if (store[k]) return false; store[k] = obj; return true; },
    async list(col) { return Object.keys(store).filter(k => k.startsWith(col + "/")).map(k => store[k]); }
  };
  const sent = [], admin = [];
  const ctx = {
    env: { TELEGRAM_ADMIN_ID: "900", TELEGRAM_BUSINESS_ALLOWED_CHAT_IDS: "*", TELEGRAM_BOT_TOKEN: "123:TEST" },
    fs, now: () => 1000000, sleep: async () => {},
    fetch: async (url, init) => { sent.push(JSON.parse(init.body)); return { ok: true, status: 200 }; },
    call: async (method, payload) => { admin.push({ method, payload }); return { ok: true, status: 200 }; }
  };
  await business.process({ business_connection: { id: "conn", user: { id: 900 }, user_chat_id: 900, is_enabled: true, rights: { can_reply: true } } }, ctx);
  check(!!store["tg_business_connections/" + require("crypto").createHash("sha256").update("conn").digest("hex")], "business connection owner/permissions persist");
  const msg = (id, chat, from, text) => ({ update_id: id, business_message: { business_connection_id: "conn", message_id: id, chat: { id: chat, type: "private" }, from: { id: from, first_name: "Test" }, text } });
  await business.process(msg(1, 55, 55, "Salom"), ctx);
  check(sent.length === 1 && sent[0].text.includes("Assalomu alaykum") && sent[0].business_connection_id === "conn", "new allowed customer gets greeting via business_connection_id");
  await business.process(msg(2, 55, 55, "Yana savolim bor"), ctx);
  check(sent.length === 1, "repeat customer does not get greeting again");
  await business.process(msg(2, 55, 55, "Yana savolim bor"), ctx);
  check(sent.length === 1, "duplicate update is idempotent");
  await business.process(msg(3, 900, 900, "Shaxsiy suhbat"), ctx);
  check(sent.length === 1, "owner's personal chat is never auto-replied");
  await business.process(msg(4, 55, 900, "Admin javobi"), ctx);
  const customerKey = require("crypto").createHash("sha256").update("conn:55").digest("hex");
  check(store["tg_business_customers/" + customerKey].adminPaused === true, "admin's manual message pauses automation");
  await business.process(msg(5, 55, 55, "Mijoz yana yozdi"), ctx);
  check(sent.length === 1, "automation stays paused after admin joins");
  await business.process(msg(6, 55, 900, "/resume"), ctx);
  check(store["tg_business_customers/" + customerKey].adminPaused === false, "/resume restores automation");
  await business.process(msg(7, 55, 55, "/services"), ctx);
  check(sent.length === 2 && sent[1].text.includes("Game Development"), "prewritten services reply works");
  await business.process(msg(9, 55, 55, "/order"), ctx);
  await business.process(msg(10, 55, 55, "Ali"), ctx);
  await business.process(msg(11, 55, 55, "Mobil o'yin"), ctx);
  await business.process(msg(12, 55, 55, "2D platformer loyiha"), ctx);
  await business.process(msg(13, 55, 55, "@ali_contact"), ctx);
  const savedOrders = Object.keys(store).filter(k => k.startsWith("tg_business_orders/"));
  check(savedOrders.length === 1 && store[savedOrders[0]].customerName === "Ali" && store[savedOrders[0]].service === "Mobil o'yin" && store[savedOrders[0]].contact === "@ali_contact", "business order wizard collects name, service, details and contact");
  check(admin.length === 1 && admin[0].payload.text.includes("Yangi Business buyurtma"), "business order is forwarded to the existing bot admin");
  const strict = Object.assign({}, ctx, { env: Object.assign({}, ctx.env, { TELEGRAM_BUSINESS_ALLOWED_CHAT_IDS: "77" }) });
  const before = sent.length;
  await business.process(msg(8, 55, 55, "ruxsatsiz chat"), strict);
  check(sent.length === before, "chat outside allow-list is ignored");
  console.log(failures ? "\nFAIL" : "\nOK");
  process.exit(failures ? 1 : 0);
})();
