// Telegram Mini App testlari: node tests/tg.e2e.js   (Playwright + soxta Firebase + SOXTA Telegram WebApp; internet shart emas)
// MUHIM: bu testlar haqiqiy Telegram ilovasini emas, rasmiy hujjat/skriptdagi API'ga mos yozilgan soxta window.Telegram.WebApp'ni ishlatadi.
let chromium; try { ({ chromium } = require("playwright")); } catch (e) { ({ chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright")); }
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), FAKE = fs.readFileSync(path.join(__dirname, "fake-firebase.js"), "utf8");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404, { "Content-Type": "text/html" }); return r.end(fs.readFileSync(path.join(root, "404.html"))); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); r.end(fs.readFileSync(f));
});
const now = Date.now(), T = (d) => ({ __ts: now - d * 864e5 });
const SEED = {
  games: { g1: { title: "MindIQ", desc: "IQ tests", tagline: "Test your mind", genre: "Puzzle", version: "v1.0.1", status: "Chiqarilgan", featured: true, links: { android: "https://example.com/mindiq.apk", windows: "https://example.com/mindiq.exe" }, downloads: 12, created: T(10) } },
  news: { n1: { title: "Hello world", text: "First post body", category: "news", created: T(5) } },
  roadmap: {}, team: {}, images: {},
};
// Soxta Telegram skripti: window.__TGCFG (init script) yoki sessionStorage.__tgcfg orqali sozlanadi; {off:true} — initData bo'sh (oddiy brauzer).
const TG_STUB = `(function(){
  var C = window.__TGCFG; try { var s = sessionStorage.getItem("__tgcfg"); if (s) C = JSON.parse(s); } catch (e) {}
  C = C || { off: true };
  var calls = window.__tgCalls = [], handlers = {};
  var rec = function (n) { return function () { calls.push([n].concat([].slice.call(arguments))); }; };
  var ver = C.version || "8.0";
  var cmp = function (a, b) { a = String(a).split("."); b = String(b).split("."); for (var i = 0; i < 3; i++) { var x = +a[i] || 0, y = +b[i] || 0; if (x !== y) return x > y ? 1 : -1; } return 0; };
  var back = { show: function () { calls.push(["BackButton.show"]); return back; }, hide: function () { calls.push(["BackButton.hide"]); return back; }, onClick: function (cb) { handlers.back = cb; calls.push(["BackButton.onClick"]); return back; }, offClick: function () { return back; } };
  window.Telegram = { WebApp: {
    initData: C.off ? "" : "query_id=AAHtest&user=%7B%22id%22%3A1%7D&auth_date=1700000000&hash=deadbeef",
    initDataUnsafe: C.off ? {} : { user: C.lang ? { id: 1, language_code: C.lang } : { id: 1 }, start_param: C.start },
    version: ver, platform: "android", colorScheme: "dark", themeParams: {},
    isVersionAtLeast: function (v) { return cmp(ver, v) >= 0; },
    ready: rec("ready"), expand: rec("expand"), disableVerticalSwipes: rec("disableVerticalSwipes"),
    setHeaderColor: rec("setHeaderColor"), setBackgroundColor: rec("setBackgroundColor"), setBottomBarColor: rec("setBottomBarColor"),
    openLink: rec("openLink"), openTelegramLink: rec("openTelegramLink"), onEvent: rec("onEvent"), BackButton: back
  } };
  window.__tgBack = function () { if (handlers.back) handlers.back(); };
})();`;
let pass = 0, fail = 0; const failures = [];
const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m); } else { fail++; failures.push(m); console.log("  ✗ FAIL:", m); } };
async function newCtx(browser, cfg, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 375, height: 740 }, serviceWorkers: "block" }, opts));
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: "text/javascript", body: "" }));
  await ctx.route(/gstatic\.com\/firebasejs.*app-compat/, r => r.fulfill({ contentType: "text/javascript", body: FAKE }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|youtube-nocookie/, r => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  if (cfg === "blocked") await ctx.route(/telegram\.org\/js\/telegram-web-app\.js/, r => r.abort());
  else await ctx.route(/telegram\.org\/js\/telegram-web-app\.js/, r => r.fulfill({ contentType: "text/javascript", body: TG_STUB }));
  await ctx.addInitScript((a) => { window.__SEED = a.seed; window.__TGCFG = a.cfg; window.__AUTOVERIFY = []; }, { seed: SEED, cfg: cfg === "blocked" ? null : cfg });
  return ctx;
}
async function open(ctx, url, errs) {
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (!/ViewTransition/.test(e.message)) errs.push("pageerror: " + e.message); }); // style.css dagi @view-transition navigatsiya uzilganda beradigan zararsiz xato (Mini App'ga aloqasi yo'q)
   page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push("console: " + m.text()); });
  await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(300); return page;
}
const calls = (pg, name) => pg.evaluate(n => (window.__tgCalls || []).filter(c => c[0] === n), name);
(async () => {
  await new Promise(r => srv.listen(4175, r)); const B = "http://localhost:4175/";
  const browser = await chromium.launch(); let errs = [], ctx, pg;

  console.log("\n[1] Mini App rejimini aniqlash va ishga tushirish (yangi klient, Bot API 8.0)");
  ctx = await newCtx(browser, {}); pg = await open(ctx, B, errs);
  ok(await pg.evaluate(() => document.documentElement.classList.contains("tg") && TG.active === true), "initData bor -> Mini App rejimi yoqildi (html.tg, TG.active)");
  ok((await calls(pg, "ready")).length === 1 && (await calls(pg, "expand")).length === 1, "ready() va expand() chaqirildi");
  ok((await calls(pg, "disableVerticalSwipes")).length === 1, "vertikal surish o'chirildi (versiya 7.7+ tekshirilgach)");
  ok(JSON.stringify(await calls(pg, "setHeaderColor")) === '[["setHeaderColor","#06040c"]]' && JSON.stringify(await calls(pg, "setBackgroundColor")) === '[["setBackgroundColor","#06040c"]]' && JSON.stringify(await calls(pg, "setBottomBarColor")) === '[["setBottomBarColor","#06040c"]]', "sarlavha, fon va pastki panel rangi sayt fon rangiga (#06040c) moslandi");
  ok((await pg.evaluate(() => document.documentElement.dataset.tgScheme)) === "dark", "data-tg-scheme belgilandi");
  ok((await calls(pg, "BackButton.show")).length === 0, "bosh sahifada BackButton ko'rsatilmaydi");
  ok(errs.length === 0, "konsolda xato yo'q " + JSON.stringify(errs.slice(0, 2)));
  await ctx.close();

  console.log("\n[2] Eski Telegram klientlari: versiyaga bog'liq metodlar chaqirilmaydi, sayt ishlaydi");
  errs = []; ctx = await newCtx(browser, { version: "6.2" }); pg = await open(ctx, B + "games.html", errs);
  ok((await calls(pg, "ready")).length === 1 && (await calls(pg, "expand")).length === 1, "[6.2] ready/expand ishladi");
  ok((await calls(pg, "disableVerticalSwipes")).length === 0 && (await calls(pg, "setHeaderColor")).length === 0 && (await calls(pg, "setBottomBarColor")).length === 0, "[6.2] 7.7/6.9/7.10 dan eski klientda disableVerticalSwipes, setHeaderColor(hex), setBottomBarColor chaqirilmaydi");
  ok((await calls(pg, "setBackgroundColor")).length === 1 && (await calls(pg, "BackButton.show")).length >= 1, "[6.2] 6.1+ metodlari (setBackgroundColor, BackButton) ishladi");
  ok(await pg.locator("#games .card").count() === 1 && errs.length === 0, "[6.2] katalog ishlaydi, xato yo'q " + JSON.stringify(errs.slice(0, 2)));
  await ctx.close();
  errs = []; ctx = await newCtx(browser, { version: "6.0" }); pg = await open(ctx, B + "games.html", errs);
  ok((await calls(pg, "ready")).length === 1 && (await calls(pg, "setBackgroundColor")).length === 0 && (await calls(pg, "BackButton.show")).length === 0 && (await calls(pg, "BackButton.onClick")).length === 0, "[6.0] 6.1 dan eski klientda faqat ready/expand; BackButton va ranglar ishlatilmaydi");
  ok(await pg.locator("#games .card").count() === 1 && errs.length === 0, "[6.0] sayt ishlaydi, xato yo'q " + JSON.stringify(errs.slice(0, 2)));
  await ctx.close();

  console.log("\n[3] Oddiy brauzerda hech narsa o'zgarmaydi");
  for (const [label, cfg] of [["Telegram skripti bor, initData bo'sh", { off: true }], ["Telegram skripti yuklanmadi (bloklangan)", "blocked"]]) {
    errs = []; ctx = await newCtx(browser, cfg); pg = await open(ctx, B, errs);
    ok(await pg.evaluate(() => !document.documentElement.classList.contains("tg") && TG.active === false), `[${label}] Mini App rejimi YOQILMAGAN`);
    ok((await calls(pg, "ready")).length === 0 && (await calls(pg, "BackButton.show")).length === 0 || cfg === "blocked", `[${label}] Telegram metodlari chaqirilmadi`);
    ok(await pg.locator("#ckBar").count() === 1, `[${label}] cookie paneli ko'rinadi (avvalgidek)`);
    ok(await pg.locator("#installBtn").count() === 1, `[${label}] PWA o'rnatish tugmasi DOM'da bor (avvalgidek)`);
    ok(await pg.evaluate(() => getComputedStyle(document.querySelector(".nav")).paddingTop === "0px"), `[${label}] sarlavha stili o'zgarmagan`);
    ok(errs.length === 0, `[${label}] konsolda xato yo'q ` + JSON.stringify(errs.slice(0, 2)));
    const popupP = pg.waitForEvent("popup", { timeout: 2000 }).catch(() => null);
    await pg.evaluate(() => document.querySelector('footer a[data-link="instagram"]').click());
    ok(!!(await popupP), `[${label}] tashqi havola oddiy brauzerda yangi oynada ochiladi (openLink ishlatilmaydi)`);
    await ctx.close();
  }

  console.log("\n[4] Mini App ichida bezovta qiluvchi elementlar");
  errs = []; ctx = await newCtx(browser, {}); pg = await open(ctx, B, errs);
  ok(await pg.locator("#ckBar").count() === 0, "cookie paneli suzib chiqmaydi");
  ok(await pg.locator("#ckOpen").count() === 1, "'Cookie sozlamalari' havolasi pastki qismda qoldi");
  ok(await pg.locator("#installBtn").count() === 0, "'Ilovani o'rnatish' tugmasi olib tashlandi");
  ok((await pg.evaluate(() => { const c = consent(); return c; })) === null, "ruxsat berilmaguncha statistika yoqilmagan (consent yo'q)");
  await pg.evaluate(() => document.getElementById("ckOpen").click()); ok(await pg.locator("#ckDlg").evaluate(d => d.open), "cookie sozlamalari dialogi ochiladi");
  await pg.waitForTimeout(12800);
  ok(await pg.locator("#promo").count() === 0, "13 soniyadan keyin ham reklama oynasi chiqmadi (Mini App'da o'chirilgan)");
  await ctx.close();
  ctx = await newCtx(browser, {}); await ctx.addInitScript(() => localStorage.setItem("pc-consent", '{"stat":false}'));
  pg = await open(ctx, B, errs); await pg.waitForTimeout(12800);
  ok(await pg.locator("#promo").count() === 0, "cookie tanlangan bo'lsa ham Mini App'da reklama chiqmaydi");
  await ctx.close();

  console.log("\n[5] Orqaga tugmasi (BackButton)");
  errs = []; ctx = await newCtx(browser, {}); pg = await open(ctx, B + "games.html", errs);
  ok((await calls(pg, "BackButton.show")).length >= 1 && (await calls(pg, "BackButton.onClick")).length === 1, "ichki sahifada BackButton ko'rsatildi va tinglovchi qo'yildi");
  await pg.goto(B + "index.html"); await pg.waitForTimeout(200);
  await pg.evaluate(() => document.querySelector('nav a[href="games.html"]').click()); await pg.waitForURL(/games\.html/); await pg.waitForTimeout(200);
  await pg.evaluate(() => window.__tgBack()); await pg.waitForURL(/index\.html$|localhost:4175\/$/); ok(true, "BackButton bosilganda oldingi sahifaga (bosh sahifa) qaytildi");
  await pg.close(); pg = await open(ctx, B + "about.html", errs);
  await pg.evaluate(() => { setTimeout(window.__tgBack, 0); }); await pg.waitForTimeout(700);
  ok(/\/index\.html$/.test(new URL(pg.url()).pathname), "tarix bo'sh bo'lsa BackButton bosh sahifaga olib boradi");
  await pg.close(); pg = await open(ctx, B, errs);
  await pg.evaluate(() => document.getElementById("srchBtn").click()); await pg.waitForTimeout(150);
  ok((await calls(pg, "BackButton.show")).length === 1, "dialog ochilganda bosh sahifada ham BackButton ko'rinadi");
  await pg.evaluate(() => window.__tgBack()); await pg.waitForTimeout(150);
  ok(!(await pg.locator("#srchDlg").evaluate(d => d.open)) && /\/(index\.html)?$/.test(new URL(pg.url()).pathname), "BackButton avval ochiq dialogni yopadi, sahifadan chiqmaydi");
  ok((await calls(pg, "BackButton.hide")).length >= 1, "dialog yopilgach bosh sahifada BackButton yashirildi");
  await ctx.close();

  console.log("\n[6] Deep link (start_param)");
  for (const [sp, want] of [["game_g1", /\/app\.html\?id=g1$/], ["news_n1", /\/article\.html\?id=n1$/], ["games", /\/games\.html$/], ["services", /\/services\.html$/]]) {
    errs = []; ctx = await newCtx(browser, { start: sp }); pg = await open(ctx, B, errs); await pg.waitForTimeout(300);
    ok(want.test(new URL(pg.url()).pathname + new URL(pg.url()).search), `start_param=${sp} -> ${new URL(pg.url()).pathname}${new URL(pg.url()).search}`);
    if (sp === "game_g1") {
      ok((await pg.locator("#app h1").textContent()) === "MindIQ", "deep link ochgan sahifada o'yin yuklandi");
      await pg.evaluate(() => document.querySelector('a.brand').click()); await pg.waitForURL(/\/index\.html$/); await pg.waitForTimeout(500);
      ok(/\/index\.html$/.test(new URL(pg.url()).pathname), "bosh sahifaga qaytganda qayta yo'naltirilmaydi (sessiyada bir marta)");
    }
    await ctx.close();
  }
  for (const bad of ["game_<script>", "game_../../x", "game_a b", "unknown", "GAME_g1", "javascript:alert(1)", "game_" + "a".repeat(65), "x".repeat(70), "game_g1%0A", "news_", ""]) {
    ctx = await newCtx(browser, { start: bad }); pg = await open(ctx, B, []); await pg.waitForTimeout(250);
    ok(/\/index\.html$|\/$/.test(new URL(pg.url()).pathname) && !new URL(pg.url()).search, `noto'g'ri start_param rad etildi: ${JSON.stringify(bad.slice(0, 30))}`);
    await ctx.close();
  }
  ctx = await newCtx(browser, {}); pg = await open(ctx, B, []);
  ok(await pg.evaluate(() => [TG.routeFor("game_abc-1_X"), TG.routeFor("news_" + "a".repeat(64)), TG.routeFor("game_a/b"), TG.routeFor("game_"), TG.routeFor(null), TG.routeFor({}), TG.routeFor("constructor"), TG.routeFor("__proto__")].map(x => x === null ? "n" : "y").join("") === "yynnnnnn"), "TG.routeFor: faqat game_/news_ + [A-Za-z0-9_-]{1,64} va oq ro'yxatdagi sahifalar");
  await ctx.close();

  console.log("\n[7] Havolalarni ochish (openLink / openTelegramLink)");
  errs = []; ctx = await newCtx(browser, {}); pg = await open(ctx, B + "app.html?id=g1", errs);
  let popup = null; ctx.on("page", p => { popup = p; });
  await pg.evaluate(() => document.querySelector('footer a[data-link="instagram"]').click()); await pg.waitForTimeout(150);
  let ol = await calls(pg, "openLink");
  ok(ol.length === 1 && ol[0][1].startsWith("https://www.instagram.com/"), "tashqi https havola -> WebApp.openLink");
  await pg.evaluate(() => document.querySelector('footer a[data-link="telegram"]').click()); await pg.waitForTimeout(150);
  let ot = await calls(pg, "openTelegramLink");
  ok(ot.length === 1 && ot[0][1] === "https://t.me/PixelCoreStudio", "t.me havola -> WebApp.openTelegramLink");
  await pg.evaluate(() => document.querySelector('footer a[data-link="support"]').click()); await pg.waitForTimeout(150);
  ok((await calls(pg, "openTelegramLink")).length === 2 && (await calls(pg, "openTelegramLink"))[1][1] === "https://t.me/esalimniyazov", "xizmat buyurtmasi (support, t.me) -> openTelegramLink");
  await pg.evaluate(() => document.querySelector("a.dl").click()); await pg.waitForTimeout(150);
  ol = await calls(pg, "openLink");
  ok(ol.length === 2 && /^https:\/\/example\.com\/mindiq\.(apk|exe)$/.test(ol[1][1]), "yuklab olish (APK/EXE) havolasi -> tashqi brauzer (openLink)");
  ok(popup === null && new URL(pg.url()).pathname === "/app.html", "yangi oyna ochilmadi, sahifa joyida qoldi");
  const same = await pg.evaluate(() => { const a = document.createElement("a"); a.href = "about.html"; a.target = "_blank"; a.id = "tmpSame"; a.textContent = "x"; document.body.appendChild(a); a.click(); return true; });
  await pg.waitForURL(/about\.html/); ok(popup === null && same, "o'z domenidagi target=_blank havola Mini App ichida ochiladi");
  await pg.goto(B + "app.html?id=g1"); await pg.waitForTimeout(200);
  const pd = await pg.evaluate(() => { const out = {}; document.addEventListener("click", e => { out.prevented = e.defaultPrevented; e.preventDefault(); }); const a = document.createElement("a"); a.href = "mailto:test@example.com"; document.body.appendChild(a); a.click(); const b = document.createElement("a"); b.href = "http://example.org/x"; document.body.appendChild(b); b.click(); return out; });
  ok(pd.prevented === false && (await calls(pg, "openLink")).length === 0, "mailto: va tashqi http: havolalariga tegilmaydi (openLink chaqirilmaydi)");
  ok(errs.length === 0, "konsolda xato yo'q " + JSON.stringify(errs.slice(0, 2)));
  await ctx.close();

  console.log("\n[8] Ulashish tugmasi");
  const LJS = fs.readFileSync(path.join(root, "links.js"), "utf8"), TGLINE = /const TG_APP = \{[^}]*\};/;
  ok(TGLINE.test(LJS), "links.js da TG_APP bor");
  const withTg = (bot, app) => LJS.replace(TGLINE, `const TG_APP = { bot: "${bot}", app: "${app}" };`);
  errs = []; ctx = await newCtx(browser, {}); await ctx.route(/\/links\.js$/, r => r.fulfill({ contentType: "text/javascript", body: withTg("", "") })); pg = await open(ctx, B + "app.html?id=g1", errs);
  await pg.evaluate(() => { navigator.share = () => { window.__navShare = 1; return Promise.resolve(); }; });
  await pg.evaluate(() => document.getElementById("share").click()); await pg.waitForTimeout(150);
  ot = await calls(pg, "openTelegramLink");
  ok(ot.length === 1 && ot[0][1].startsWith("https://t.me/share/url?url=") && decodeURIComponent(ot[0][1]).includes("/app.html?id=g1"), "Mini App'da 'Ulashish' Telegram ulashish havolasini ochadi (bot sozlanmagan -> sayt havolasi)");
  ok(!(await pg.evaluate(() => window.__navShare)), "navigator.share ishlatilmadi");
  await ctx.close();
  ctx = await newCtx(browser, {}); await ctx.route(/\/links\.js$/, r => r.fulfill({ contentType: "text/javascript", body: withTg("PixelCoreBot", "site") }));
  pg = await open(ctx, B + "article.html?id=n1", errs);
  await pg.evaluate(() => document.getElementById("share").click()); await pg.waitForTimeout(150);
  ot = await calls(pg, "openTelegramLink");
  ok(ot.length === 1 && decodeURIComponent(ot[0][1]).includes("url=https://t.me/PixelCoreBot/site?startapp=news_n1"), "bot sozlangach ulashish havolasi t.me/<bot>/<app>?startapp=news_<id> bo'ladi");
  await ctx.close();
  ctx = await newCtx(browser, "blocked"); pg = await open(ctx, B + "app.html?id=g1", errs);
  await pg.evaluate(() => { navigator.share = () => { window.__navShare = 1; return Promise.resolve(); }; document.getElementById("share").click(); }); await pg.waitForTimeout(150);
  ok(await pg.evaluate(() => window.__navShare === 1), "oddiy brauzerda 'Ulashish' avvalgidek navigator.share ishlatadi");
  await ctx.close();

  console.log("\n[9] Til: Telegram language_code faqat taklif");
  for (const [cfg, ls, url, want, label] of [[{ lang: "ru" }, null, "about.html", "ru", "Telegram ru -> rus tili taklif qilinadi"], [{ lang: "ru" }, "en", "about.html", "en", "foydalanuvchi tanlovi (localStorage) Telegram'dan ustun"], [{ lang: "ru" }, null, "about.html?lang=uz", "uz", "?lang= Telegram'dan ustun"], [{ lang: "uz" }, null, "about.html", "uz", "Telegram uz -> o'zbek"], [{ lang: "en" }, null, "about.html", "en", "Telegram en -> ingliz"], [{ lang: "de" }, null, "about.html", "en", "qo'llanmaydigan til (de) -> oddiy brauzer qoidasiga qaytadi (test brauzeri: en)"]]) {
    ctx = await newCtx(browser, cfg, { locale: "en-US" }); if (ls) await ctx.addInitScript(l => localStorage.setItem("lang", l), ls);
    pg = await open(ctx, B + url, []);
    ok((await pg.evaluate(() => document.documentElement.lang)) === want, label);
    if (!ls && !/lang=/.test(url)) ok((await pg.evaluate(() => localStorage.getItem("lang"))) === null, "  Telegram taklifi localStorage'ga yozilmadi");
    await ctx.close();
  }
  ctx = await newCtx(browser, "blocked", { locale: "ru-RU" }); pg = await open(ctx, B + "about.html", []);
  ok((await pg.evaluate(() => document.documentElement.lang)) === "ru", "oddiy brauzerda til avvalgidek navigator.language'dan olinadi"); await ctx.close();

  console.log("\n[10] Xavfsiz zonalar (safe area)");
  ctx = await newCtx(browser, {}); pg = await open(ctx, B + "games.html", []);
  const zero = await pg.evaluate(() => ({ nav: getComputedStyle(document.querySelector(".nav")).paddingTop, foot: getComputedStyle(document.querySelector("footer")).paddingBottom }));
  await pg.evaluate(() => { const s = document.documentElement.style; s.setProperty("--tg-safe-area-inset-top", "20px"); s.setProperty("--tg-content-safe-area-inset-top", "30px"); s.setProperty("--tg-safe-area-inset-bottom", "10px"); s.setProperty("--tg-content-safe-area-inset-bottom", "12px"); s.setProperty("--tg-safe-area-inset-left", "7px"); });
  const ins = await pg.evaluate(() => ({ nav: getComputedStyle(document.querySelector(".nav")).paddingTop, foot: getComputedStyle(document.querySelector("footer")).paddingBottom, bodyL: getComputedStyle(document.body).paddingLeft }));
  ok(zero.nav === "0px" && zero.foot === "0px", "qiymat kelmaganda (fullscreen emas) qo'shimcha bo'sh joy yo'q");
  ok(ins.nav === "50px" && ins.foot === "22px" && ins.bodyL === "7px", `safeAreaInset + contentSafeAreaInset sarlavha/pastki qismga qo'shiladi (nav ${ins.nav}, footer ${ins.foot}, chap ${ins.bodyL})`);
  await pg.evaluate(() => { document.documentElement.style.setProperty("--tg-safe-area-inset-top", "20px"); document.documentElement.style.setProperty("--tg-content-safe-area-inset-top", "30px"); toast("test"); });
  ok(await pg.evaluate(() => { const r = document.getElementById("toast").getBoundingClientRect(); return r.bottom <= innerHeight - 10 - 12 + 1; }), "xabar (toast) pastki xavfsiz zonadan yuqorida");
  await ctx.close();

  console.log("\n[11] Service Worker Mini App ichida ishlatilmaydi, eskisi o'chiriladi");
  const sc = await browser.newContext({ viewport: { width: 375, height: 740 } });
  await sc.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: "text/javascript", body: "" })); await sc.route(/gstatic\.com\/firebasejs.*app-compat/, r => r.fulfill({ contentType: "text/javascript", body: FAKE }));
  await sc.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: "text/css", body: "" })); await sc.route(/telegram\.org\/js\/telegram-web-app\.js/, r => r.fulfill({ contentType: "text/javascript", body: TG_STUB }));
  await sc.addInitScript(s => { window.__SEED = s; }, SEED);
  pg = await sc.newPage(); await pg.goto(B + "games.html"); await pg.waitForTimeout(1500);
  ok(await pg.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length) === 1, "oddiy brauzerda Service Worker ro'yxatdan o'tadi (avvalgidek)");
  await pg.evaluate(() => sessionStorage.setItem("__tgcfg", "{}")); await pg.reload(); await pg.waitForTimeout(1200);
  ok(await pg.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length) === 0, "Mini App rejimida Service Worker ro'yxatdan o'tkazilmaydi va eskisi o'chiriladi");
  await sc.close();

  console.log("\n[12] Barcha sahifalar Mini App rejimida: 375px, 3 til, xatosiz");
  const PAGES = ["index.html", "games.html", "app.html?id=g1", "news.html", "article.html?id=n1", "about.html", "services.html", "contact.html", "profile.html", "admin.html", "privacy.html", "404.html", "offline.html", "nope-missing.html"];
  for (const lang of ["uz", "ru", "en"]) {
    ctx = await newCtx(browser, { lang }); await ctx.addInitScript(l => localStorage.setItem("lang", l), lang);
    const e2 = [], wide = [], bad = [];
    for (const p of PAGES) {
      const g = await open(ctx, B + p, e2);
      const sw = await g.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (sw > 1) wide.push(p + " +" + sw);
      const txt = await g.evaluate(() => Array.from(document.querySelectorAll("body *")).filter(e => e.children.length === 0 && e.offsetParent !== null && !["SCRIPT", "STYLE", "OPTION"].includes(e.tagName)).map(e => e.textContent.trim()).filter(s => /^[a-z0-9]+(\.[a-zA-Z0-9]+){1,2}$/.test(s) && !/\.(png|js|html|css)$/.test(s) && !/^v\d/.test(s)));
      txt.forEach(s => bad.push(p + ": " + s)); await g.close();
    }
    ok(e2.length === 0, `[${lang}] 14 sahifada JS/konsol xatosi yo'q ${JSON.stringify(e2.slice(0, 2))}`);
    ok(wide.length === 0, `[${lang}] gorizontal scroll yo'q ${JSON.stringify(wide)}`);
    ok(bad.length === 0, `[${lang}] tarjima qilinmagan kalit yo'q ${JSON.stringify(bad.slice(0, 3))}`);
    await ctx.close();
  }


  console.log("\n[13] Aloqa formasi adminga xabar yuborishni ishga tushiradi (/api/notify)");
  errs = []; ctx = await newCtx(browser, "blocked"); const reqs = [];
  await ctx.route(/\/api\/notify$/, r => { reqs.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }); });
  pg = await open(ctx, B + "contact.html?service=web", errs);
  await pg.fill("#ctName", "Ali"); await pg.fill("#ctMail", "ali@example.com"); await pg.fill("#ctText", "Sayt kerak, iltimos"); await pg.click('#ctForm button'); await pg.waitForTimeout(800);
  ok(reqs.length === 1 && reqs[0].kind === "contact" && typeof reqs[0].id === "string" && reqs[0].id.length >= 3 && Object.keys(reqs[0]).length === 2, "forma yuborilgach brauzer faqat {kind, id} yuboradi (matn emas): " + JSON.stringify(reqs[0] || null).slice(0, 80));
  ok(await pg.locator("#ctMsg.ok").count() === 1 && errs.length === 0, "foydalanuvchiga 'yuborildi' ko'rsatiladi, xato yo'q");
  await ctx.close();
  ctx = await newCtx(browser, "blocked"); await ctx.route(/\/api\/notify$/, r => r.fulfill({ status: 500, body: "x" }));
  pg = await open(ctx, B + "contact.html", []); await pg.fill("#ctName", "Ali"); await pg.fill("#ctMail", "ali@example.com"); await pg.fill("#ctText", "Salom"); await pg.click('#ctForm button'); await pg.waitForTimeout(800);
  ok(await pg.locator("#ctMsg.ok").count() === 1, "/api/notify xato qaytarsa ham foydalanuvchi uchun forma muvaffaqiyatli");
  await ctx.close();

  await browser.close(); srv.closeAllConnections(); srv.close();
  console.log(`\nNATIJA: ${pass} o'tdi, ${fail} muvaffaqiyatsiz`);
  if (fail) { console.log(failures.map(f => " - " + f).join("\n")); process.exit(1); }
})().catch(e => { console.error(e); process.exit(2); });
