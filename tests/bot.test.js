const bot = require("../api/bot.js");
let failures = 0; const check = (c, l) => { console.log(c ? "  ✓" : "  ✗ FAIL:", l); if (!c) failures++; };
const mkRes = () => { const r = { code: 0, status(c) { r.code = c; return r; }, json() { return r; } }; return r; };
(async () => {
  const env = { TELEGRAM_BOT_TOKEN: "123:TESTTOKEN", TELEGRAM_WEBHOOK_SECRET: "sec_ret-1" };
  const upd = { message: { chat: { id: 5, type: "private" }, text: "/start" } };
  let calls = []; const fetchOk = async (u, o) => { calls.push([u, JSON.parse(o.body)]); return { ok: true, status: 200 }; };
  let extra = {};
  const run = async (req, e, f) => { const res = mkRes(); calls = []; await bot.handler(req, res, Object.assign({ env: e || env, fetch: f || fetchOk }, extra)); return res; };
  let r = await run({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "sec_ret-1" }, body: upd });
  check(r.code === 200 && calls.length === 1 && calls[0][0] === "https://api.telegram.org/bot123:TESTTOKEN/sendMessage" && calls[0][1].chat_id === 5, "to'g'ri maxfiy sarlavha -> /start ga javob yuboriladi");
  const kb = calls[0][1].reply_markup.inline_keyboard.flat();
  check(kb[0].web_app.url === "https://pixelcore-delta.vercel.app/" && kb.some(b => b.callback_data === "srv") && kb.length === 4 && kb.some(b => b.callback_data === "sub") && !kb.some(b => b.web_app && /contact\.html/.test(b.web_app.url)) && kb.every(b => b.callback_data || (b.web_app ? b.web_app.url : b.url).startsWith("https://")), "bosh menyu: ilova, xizmatlar, obuna, admin (6 ta xizmat tugmasi yo'q) — hammasi https");
  check(JSON.stringify(calls[0][1]).indexOf("TESTTOKEN") < 0, "token xabar ichida yo'q");
  r = await run({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "wrong" }, body: upd }); check(r.code === 401 && calls.length === 0, "noto'g'ri maxfiy sarlavha -> 401, hech narsa yuborilmaydi");
  r = await run({ method: "POST", headers: {}, body: upd }); check(r.code === 401 && calls.length === 0, "sarlavha yo'q -> 401");
  r = await run({ method: "GET", headers: {}, body: null }); check(r.code === 405, "GET -> 405");
  r = await run({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "x" }, body: upd }, {}); check(r.code === 500 && calls.length === 0, "env sozlanmagan -> 500, ochiq ishlamaydi");
  const hdr = { "x-telegram-bot-api-secret-token": "sec_ret-1" };
  r = await run({ method: "POST", headers: hdr, body: { message: { chat: { id: 1, type: "group" }, text: "/start" } } }); check(r.code === 200 && calls.length === 0, "guruhdagi xabarga javob berilmaydi");
  r = await run({ method: "POST", headers: hdr, body: { callback_query: {} } }); check(r.code === 200 && calls.length === 0, "boshqa update turlari e'tiborsiz");
  r = await run({ method: "POST", headers: hdr, body: null }); check(r.code === 200 && calls.length === 0, "bo'sh body'da yiqilmaydi");
  r = await run({ method: "POST", headers: hdr, body: upd }, env, async () => { throw new Error("network"); }); check(r.code === 200, "Telegram API xatosida ham 200 (qayta yuborishni to'xtatadi)");
  // --- xizmatlar chat ichida (callback) ---
  const cb = (data) => ({ callback_query: { id: "cq1", data, message: { message_id: 77, chat: { id: 5, type: "private" } } } });
  r = await run({ method: "POST", headers: hdr, body: cb("srv") });
  check(r.code === 200 && calls.length === 2 && calls[0][0].endsWith("/answerCallbackQuery") && calls[0][1].callback_query_id === "cq1", "xizmatlar tugmasi: avval answerCallbackQuery");
  check(calls[1][0].endsWith("/editMessageText") && calls[1][1].message_id === 77 && calls[1][1].parse_mode === "HTML" && calls[1][1].text.includes("Xizmatlarimiz va narxlar"), "xizmatlar shu xabarning o'zida (editMessageText) ko'rsatiladi");
  const kb2 = calls[1][1].reply_markup.inline_keyboard.flat();
  check(kb2.some(b => b.url === "https://t.me/esalimniyazov") && kb2.some(b => b.callback_data === "ord") && kb2.some(b => b.callback_data === "menu") && kb2.every(b => b.callback_data || (b.web_app ? b.web_app.url : b.url).startsWith("https://")), "pastida: admin, forma, kanal, orqaga");
  r = await run({ method: "POST", headers: hdr, body: cb("menu") }); check(calls.length === 2 && calls[1][1].text.includes("xuş kelibsiz"), "'Orqaga' bosh menyuga qaytaradi");
  r = await run({ method: "POST", headers: hdr, body: cb("evil") }); check(r.code === 200 && calls.length === 0, "noma'lum callback_data e'tiborsiz");
  r = await run({ method: "POST", headers: hdr, body: { callback_query: { id: "x", data: "srv", message: { message_id: 1, chat: { id: 1, type: "group" } } } } }); check(calls.length === 0, "guruhdagi callback e'tiborsiz");
  // narxlar links.js bilan bir xilmi
  const vm = require("vm"), fs = require("fs"); const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(__dirname + "/../links.js", "utf8").replace(/\bconst (\w+) =/g, "var $1 ="), ctx);
  check(ctx.SERVICES.length === bot.PRICES.length && ctx.SERVICES.every((s, i) => s.from === bot.PRICES[i][3]), "bot narxlari links.js dagi SERVICES narxlariga teng");
  check(bot.SERVICES_TEXT.length < 4000, "xabar Telegram chegarasidan (4096) kichik: " + bot.SERVICES_TEXT.length);

  // ================== buyurtma / obuna / admin ommaviy xabar ==================
  const ADMIN_ID = "999", ADM = { TELEGRAM_BOT_TOKEN: "123:TESTTOKEN", TELEGRAM_WEBHOOK_SECRET: "sec_ret-1", TELEGRAM_ADMIN_ID: ADMIN_ID };
  const store = {}; const subs = () => Object.values(store).filter(x => x.subscribed);
  const fakeFs = { configured: true, async patch(col, id, o) { store[id] = Object.assign({}, store[id], o); return true; }, async subscribers() { return subs(); } };
  let clock = 0; extra = { fs: fakeFs, now: () => clock, sleep: async (ms) => { clock += ms; } };
  const msg = (text, from, rep) => ({ message: { chat: { id: from, type: "private" }, from: { id: from, first_name: "Ali <b>", username: "ali" }, text, reply_to_message: rep } });
  const sendTo = (id) => calls.filter(c => c[0].endsWith("/sendMessage") && String(c[1].chat_id) === String(id));
  // 1) buyurtma tanlash -> force_reply
  r = await run({ method: "POST", headers: hdr, body: cb("ord") }); check(calls[1][1].text.includes("Qaysi xizmatga") && calls[1][1].reply_markup.inline_keyboard.flat().filter(b => /^o:[0-5]$/.test(b.callback_data || "")).length === 6, "'Buyurtma berish' -> 6 ta xizmat tanlash tugmasi");
  r = await run({ method: "POST", headers: hdr, body: cb("o:2") }); const prompt = calls[1][1];
  check(prompt.text.startsWith(bot.ORDER_PREFIX + "Taqdimot (prezentatsiya)") && prompt.reply_markup.force_reply === true, "xizmat tanlangach force_reply so'rovi chiqadi");
  r = await run({ method: "POST", headers: hdr, body: cb("o:9") }); check(calls.length === 0, "noto'g'ri xizmat indeksi e'tiborsiz");
  // 2) buyurtma matni adminga boradi
  r = await run({ method: "POST", headers: hdr, body: msg("Taqdimot kerak, 10 slayd <script>", 55, { text: prompt.text }) });
  const toAdmin = sendTo(ADMIN_ID); check(toAdmin.length === 0, "ADMIN sozlanmagan bo'lsa adminga yuborilmaydi va mijozga tushuntiriladi (" + calls[0][1].text.slice(0, 30) + ")");
  const envA = Object.assign({}, ADM);
  const runA = async (body) => { const res = mkRes(); calls = []; await bot.handler({ method: "POST", headers: hdr, body }, res, Object.assign({ env: envA, fetch: fetchOk }, extra)); return res; };
  await runA(msg("Taqdimot kerak, 10 slayd <script>", 55, { text: prompt.text }));
  const a = sendTo(ADMIN_ID)[0], u = sendTo(55)[0];
  check(a && a[1].parse_mode === "HTML" && a[1].text.includes("Taqdimot (prezentatsiya)") && a[1].text.includes("tg://user?id=55") && a[1].text.includes("&lt;script&gt;") && a[1].text.includes("Ali &lt;b&gt;") && !a[1].text.includes("<script>"), "buyurtma adminga yuboriladi: xizmat, mijoz havolasi, matn HTML-escape qilingan");
  check(u && u[1].text.includes("qabul qilindi"), "mijozga tasdiq yuboriladi");
  await runA(msg("x", 55, { text: prompt.text })); check(sendTo(ADMIN_ID).length === 0 && sendTo(55)[0][1].text.includes("3 dan 2000"), "juda qisqa tavsif rad etiladi");
  await runA(msg("Hack", 55, { text: bot.ORDER_PREFIX + "Soxta xizmat\n..." })); check(sendTo(ADMIN_ID).length === 0, "noma'lum xizmat nomi bilan buyurtma adminga bormaydi");
  // 3) obuna
  await runA(cb("sub")); check(store["5"] && store["5"].subscribed === true && calls[0][0].endsWith("/answerCallbackQuery"), "obuna: chat ID saqlandi (subscribed=true)");
  store["6"] = { chatId: 6, subscribed: true }; store["7"] = { chatId: 7, subscribed: true };
  await runA(msg("/stop", 6)); check(store["6"].subscribed === false, "/stop obunani bekor qiladi");
  await runA(msg("/id", 6)); check(calls[0][1].text.includes("6"), "/id foydalanuvchi ID'sini ko'rsatadi");
  // 4) admin buyruqlari faqat admin uchun
  await runA(msg("/broadcast Salom hammaga", 55)); check(calls[0][1].text.includes("Xuş kelibsiz") || calls[0][1].text.includes("xuş kelibsiz"), "oddiy foydalanuvchi /broadcast qila olmaydi (menyu chiqadi)");
  await runA(msg("/stats", 55)); check(!/Obunachilar/.test(calls[0][1].text), "oddiy foydalanuvchi /stats ko'ra olmaydi");
  await runA(msg("/stats", 999)); check(calls[0][1].text === "📊 Obunachilar: 2", "admin /stats: faqat faol obunachilar sanaladi");
  await runA(msg("/broadcast", 999)); check(calls[0][1].text.startsWith("Foydalanish"), "bo'sh /broadcast -> yo'riqnoma");
  await runA(msg("/broadcast Yangi o'yin chiqdi!", 999));
  const pv = calls[0][1]; check(pv.text === "Yangi o'yin chiqdi!" && pv.reply_markup.inline_keyboard[0][0].text.includes("2 obunachi") && !pv.parse_mode, "admin /broadcast -> oldindan ko'rish (matn aynan o'zi) va tasdiqlash tugmalari");
  const bcb = (data, from) => ({ callback_query: { id: "b1", data, from: { id: from }, message: { message_id: 9, text: "Yangi o'yin chiqdi!", chat: { id: from, type: "private" } } } });
  await runA(bcb("bc_go", 55)); check(calls.length === 0 || !calls.some(c => String(c[1].chat_id) === "7" ), "admin bo'lmagan odam tasdiqlay olmaydi (hech kimga yuborilmaydi)");
  await runA(bcb("bc_no", 999)); check(calls[calls.length - 1][1].text.includes("Bekor"), "'Bekor' yuborishni to'xtatadi");
  await runA(bcb("bc_go", 999));
  const got = calls.filter(c => c[0].endsWith("/sendMessage")).map(c => String(c[1].chat_id)).sort();
  check(got.join() === "5,7" && calls.find(c => String(c[1].chat_id) === "7")[1].text.includes("/stop"), "tasdiqlangach faqat faol obunachilarga (5, 7) yuboriladi, /stop eslatmasi bilan");
  check(calls[calls.length - 1][1].text.includes("Yuborildi: 2"), "natija hisoboti adminga yozildi");
  // bloklagan foydalanuvchi o'chiriladi, 429 to'xtatadi
  store["7"].subscribed = true; const f403 = async (u, o) => { calls.push([u, JSON.parse(o.body)]); return { ok: !(JSON.parse(o.body).chat_id === 7), status: JSON.parse(o.body).chat_id === 7 ? 403 : 200 }; };
  { const res = mkRes(); calls = []; await bot.handler({ method: "POST", headers: hdr, body: bcb("bc_go", 999) }, res, Object.assign({ env: envA, fetch: f403 }, extra)); }
  check(store["7"].subscribed === false, "bot bloklangan (403) obunachi avtomatik o'chiriladi");
  for (let i = 100; i < 160; i++) store[i] = { chatId: i, subscribed: true };
  let t = 0; extra.now = () => t; extra.sleep = async () => { t += 5000; };
  { const res = mkRes(); calls = []; await bot.handler({ method: "POST", headers: hdr, body: bcb("bc_go", 999) }, res, Object.assign({ env: envA, fetch: fetchOk }, extra)); }
  check(/yuborilmadi/.test(calls[calls.length - 1][1].text) && calls.filter(c => /\/sendMessage/.test(c[0])).length < 61, "vaqt chegarasidan oshsa yuborish to'xtaydi va qolgani haqida ogohlantiriladi");
  console.log(failures ? "\nFAIL" : "\nOK"); process.exit(failures ? 1 : 0);
})();
