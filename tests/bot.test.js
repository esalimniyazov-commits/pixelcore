const bot = require("../api/bot.js");
let failures = 0; const check = (c, l) => { console.log(c ? "  ✓" : "  ✗ FAIL:", l); if (!c) failures++; };
const mkRes = () => { const r = { code: 0, status(c) { r.code = c; return r; }, json() { return r; } }; return r; };
(async () => {
  const env = { TELEGRAM_BOT_TOKEN: "123:TESTTOKEN", TELEGRAM_WEBHOOK_SECRET: "sec_ret-1" };
  const upd = { message: { chat: { id: 5, type: "private" }, text: "/start" } };
  let calls = []; const fetchOk = async (u, o) => { calls.push([u, JSON.parse(o.body)]); return { ok: true, status: 200 }; };
  const run = async (req, e, f) => { const res = mkRes(); calls = []; await bot.handler(req, res, { env: e || env, fetch: f || fetchOk }); return res; };
  let r = await run({ method: "POST", headers: { "x-telegram-bot-api-secret-token": "sec_ret-1" }, body: upd });
  check(r.code === 200 && calls.length === 1 && calls[0][0] === "https://api.telegram.org/bot123:TESTTOKEN/sendMessage" && calls[0][1].chat_id === 5, "to'g'ri maxfiy sarlavha -> /start ga javob yuboriladi");
  const kb = calls[0][1].reply_markup.inline_keyboard.flat();
  check(kb[0].web_app.url === "https://pixelcore-delta.vercel.app/" && kb.some(b => b.callback_data === "srv") && kb.filter(b => b.web_app && /contact\.html\?service=/.test(b.web_app.url)).length === 6 && kb.every(b => b.callback_data || (b.web_app ? b.web_app.url : b.url).startsWith("https://")), "tugmalar: ilova, xizmatlar (callback), 6 ta xizmat buyurtmasi, admin — hammasi https");
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
  check(kb2.some(b => b.url === "https://t.me/esalimniyazov") && kb2.some(b => b.callback_data === "menu") && kb2.every(b => b.callback_data || (b.web_app ? b.web_app.url : b.url).startsWith("https://")), "pastida: admin, forma, kanal, orqaga");
  r = await run({ method: "POST", headers: hdr, body: cb("menu") }); check(calls.length === 2 && calls[1][1].text.includes("xuş kelibsiz"), "'Orqaga' bosh menyuga qaytaradi");
  r = await run({ method: "POST", headers: hdr, body: cb("evil") }); check(r.code === 200 && calls.length === 0, "noma'lum callback_data e'tiborsiz");
  r = await run({ method: "POST", headers: hdr, body: { callback_query: { id: "x", data: "srv", message: { message_id: 1, chat: { id: 1, type: "group" } } } } }); check(calls.length === 0, "guruhdagi callback e'tiborsiz");
  // narxlar links.js bilan bir xilmi
  const vm = require("vm"), fs = require("fs"); const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(__dirname + "/../links.js", "utf8").replace(/\bconst (\w+) =/g, "var $1 ="), ctx);
  check(ctx.SERVICES.length === bot.PRICES.length && ctx.SERVICES.every((s, i) => s.from === bot.PRICES[i][3]), "bot narxlari links.js dagi SERVICES narxlariga teng");
  check(bot.SERVICES_TEXT.length < 4000, "xabar Telegram chegarasidan (4096) kichik: " + bot.SERVICES_TEXT.length);
  console.log(failures ? "\nFAIL" : "\nOK"); process.exit(failures ? 1 : 0);
})();
