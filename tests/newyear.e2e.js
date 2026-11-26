// Yangi yil mavzusi brauzer testi: node tests/newyear.e2e.js  (Playwright + soxta Firebase; internet shart emas)
let chromium; try { ({ chromium } = require("playwright")); } catch (e) { ({ chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright")); }
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), FAKE = fs.readFileSync(path.join(__dirname, "fake-firebase.js"), "utf8");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404, { "Content-Type": "text/html" }); return r.end(fs.readFileSync(path.join(root, "404.html"))); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); r.end(fs.readFileSync(f));
});
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m); } else { fail++; console.log("  ✗ FAIL:", m); } };
async function ctxOf(browser, o = {}, lang = "uz") {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" }, o));
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: "text/javascript", body: "" }));
  await ctx.route(/gstatic\.com\/firebasejs.*app-compat/, r => r.fulfill({ contentType: "text/javascript", body: FAKE }));
  await ctx.route(/telegram\.org\/js\/telegram-web-app\.js/, r => r.fulfill({ contentType: "text/javascript", body: "" }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|youtube-nocookie/, r => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await ctx.addInitScript(l => { localStorage.setItem("lang", l); localStorage.setItem("pc-consent", JSON.stringify({ stat: false })); }, lang);
  return ctx;
}
async function open(ctx, url, errs, date) {
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (date && /ViewTransition/.test(e.message)) return; /* soxta soat (page.clock) brauzer view-transition'ini buzadi: faqat test artefakti, soatsiz ochilganda xato yo'q */ errs.push("pageerror: " + e.message); });
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push("console: " + m.text()); });
  if (date) await page.clock.install({ time: date });
  await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(400); return page;
}
const state = p => p.evaluate(() => ({ ny: document.documentElement.classList.contains("ny"), snow: !!document.getElementById("nyc"), css: !!document.querySelector('link[href="newyear.css"]'),
  js: !!document.querySelector('script[src="js/newyear.js"]'), btn: (document.getElementById("nyBtn") || {}).textContent || "", hats: document.querySelectorAll(".ny-hat").length,
  cd: !!document.querySelector(".ny-cd"), scrollX: document.documentElement.scrollWidth - innerWidth }));
(async () => {
  await new Promise(r => srv.listen(4181, r)); const B = "http://localhost:4181/"; const browser = await chromium.launch(); const errs = [];

  console.log("\n[1] Mavsum ichida (3-dekabr): hammasi yoqilgan");
  let ctx = await ctxOf(browser); let pg = await open(ctx, B + "index.html", errs, new Date(2026, 11, 3, 12));
  let s = await state(pg);
  ok(s.ny && s.snow && s.css && s.js, "html.ny, qor kanvasi, CSS va JS yuklangan");
  ok(s.hats >= 2, "logotiplarda qalpoq bor (sarlavha + pastki qism + hero): " + s.hats);
  ok(s.cd && (await pg.locator(".ny-t b").count()) === 4, "hisoblagich 4 ta katak bilan");
  ok(/yoqiq/.test(s.btn), "pastki tugma: '" + s.btn + "'");
  const d1 = await pg.locator('.ny-t b[data-u="d"]').textContent(); ok(d1 === "28", "3-dekabrdan 1-yanvargacha 28 kun: " + d1);
  ok(s.scrollX <= 1, "gorizontal scroll yo'q");
  const fav = await pg.evaluate(() => document.querySelector('link[rel="icon"][type="image/svg+xml"]').href); ok(fav.startsWith("data:image/svg+xml") && fav.includes("rect"), "favicon'ga qalpoq qo'yilgan");
  ok(await pg.evaluate(() => getComputedStyle(document.getElementById("nyc")).pointerEvents === "none"), "qor sahifa bosishlariga xalaqit bermaydi (pointer-events:none)");
  ok(await pg.evaluate(() => document.getElementById("nyc").getAttribute("aria-hidden") === "true"), "qor kanvasi aria-hidden");
  await pg.clock.runFor(2000); const sec = await pg.locator('.ny-t b[data-u="s"]').textContent(); ok(/^\d\d$/.test(sec), "soniyalar yangilanadi: " + sec);
  await pg.click("#logoBtn"); await pg.waitForTimeout(200); ok(await pg.locator("#nyf").count() === 1, "logotip bosilganda salyut kanvasi paydo bo'ladi");
  await pg.clock.runFor(6000); ok(await pg.locator("#nyf").count() === 0, "salyut tugagach kanvas olib tashlanadi");

  console.log("\n[2] Boshqa sahifalar va tugma");
  for (const p of ["games.html", "news.html", "about.html", "services.html", "contact.html", "privacy.html", "profile.html"]) {
    const g = await open(ctx, B + p, errs, new Date(2026, 11, 3, 12)); const x = await state(g);
    ok(x.ny && x.snow && x.hats >= 1 && !x.cd && x.scrollX <= 1, p + ": mavzu bor, hisoblagich faqat bosh sahifada, scroll yo'q"); await g.close();
  }
  const adm = await open(ctx, B + "admin.html", errs, new Date(2026, 11, 3, 12)); const xa = await state(adm); ok(!xa.ny && !xa.snow, "admin.html: mavzu yo'q (ish paneli toza)"); await adm.close();
  await pg.reload(); await pg.waitForTimeout(300); await pg.click("#nyBtn"); await pg.waitForTimeout(500);
  s = await state(pg); ok(!s.ny && !s.snow && !s.css && !s.js, "tugma bosilgach mavzu o'chadi va fayllar yuklanmaydi");
  ok(/öçiq/.test(s.btn), "tugma matni 'öçiq' (yangi alifbo): " + s.btn);
  ok(await pg.evaluate(() => localStorage.getItem("pc-ny")) === "off", "tanlov localStorage'da");
  await pg.click("#nyBtn"); await pg.waitForTimeout(500); s = await state(pg); ok(s.ny && s.snow, "qayta bosilsa yana yoqiladi");
  await ctx.close();

  console.log("\n[3] Mavsumdan tashqarida (15-iyul): hech narsa yuklanmaydi");
  ctx = await ctxOf(browser); pg = await open(ctx, B + "index.html", errs, new Date(2027, 6, 15, 12)); s = await state(pg);
  ok(!s.ny && !s.snow && !s.css && !s.js && !s.btn && !s.cd, "mavzu, fayllar va tugma yo'q");
  await pg.goto(B + "index.html?ny=1"); await pg.waitForTimeout(400); s = await state(pg); ok(s.ny && s.snow, "?ny=1 bilan sinab ko'rish mumkin");
  await ctx.close();

  console.log("\n[4] Yanvarda (3-yanvar): tabrik rejimi, 3 tilda");
  for (const [lang, re] of [["uz", /Yangi 2027-yil bilan/], ["ru", /С Новым 2027 годом/], ["en", /Happy New Year 2027/]]) {
    ctx = await ctxOf(browser, {}, lang); pg = await open(ctx, B + "index.html", errs, new Date(2027, 0, 3, 12));
    const txt = await pg.locator(".ny-greet").textContent().catch(() => ""); ok(re.test(txt), lang + ": " + txt.slice(0, 48));
    await ctx.close();
  }

  console.log("\n[5] Yarim tunda (sahifa ochiq turganda): hisoblagich tabrikka o'tadi");
  ctx = await ctxOf(browser); pg = await open(ctx, B + "index.html", errs, new Date(2026, 11, 31, 23, 59, 58));
  ok(await pg.locator(".ny-t").count() === 1, "23:59:58 da hisoblagich ko'rinadi");
  await pg.clock.runFor(4000); await pg.waitForTimeout(100);
  ok(await pg.locator(".ny-greet").count() === 1, "00:00 dan keyin tabrik chiqdi");
  ok(await pg.locator("#nyf").count() === 1, "yarim tunda salyut boshlandi"); await ctx.close();

  console.log("\n[6] prefers-reduced-motion: salyut yo'q, qor harakatsiz");
  ctx = await ctxOf(browser, { reducedMotion: "reduce" }); pg = await open(ctx, B + "index.html", errs, new Date(2026, 11, 3, 12));
  const snap = async () => pg.evaluate(() => document.getElementById("nyc").toDataURL());
  const a = await snap(); await pg.clock.runFor(1500); const b = await snap(); ok(a === b, "qor kadrlari o'zgarmaydi (statik)");
  await pg.click("#logoBtn"); await pg.waitForTimeout(200); ok(await pg.locator("#nyf").count() === 0, "logotip bosilganda salyut yo'q");
  await ctx.close();

  console.log("\n[7] Mobil (375px) × 3 til: gorizontal scroll yo'q");
  for (const lang of ["uz", "ru", "en"]) {
    ctx = await ctxOf(browser, { viewport: { width: 375, height: 740 } }, lang); pg = await open(ctx, B + "index.html", errs, new Date(2026, 11, 3, 12)); s = await state(pg);
    ok(s.ny && s.scrollX <= 1, lang + ": mavzu yoqilgan, scroll +" + s.scrollX + "px");
    const w = await pg.evaluate(() => { const r = document.querySelector(".ny-cd").getBoundingClientRect(); return [r.left, r.right]; }); ok(w[0] >= 0 && w[1] <= 375, lang + ": hisoblagich ekran ichida (" + Math.round(w[0]) + "–" + Math.round(w[1]) + ")");
    await ctx.close();
  }
  ok(errs.length === 0, "JS/konsol xatosi yo'q" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
  console.log("\n" + (fail ? "XATO: " + fail : "OK") + " (" + pass + " ta o'tdi)"); await browser.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
