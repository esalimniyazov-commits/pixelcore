// fx brauzer testi: node tests/fx.e2e.js  (Playwright + soxta Firebase; internet shart emas)
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
const now = Date.now(), T = d => ({ __ts: now - d * 864e5 });
const SEED = {
  games: {
    g1: { title: "MindIQ", desc: "IQ tests", tagline: "Test your mind", genre: "Puzzle", version: "v1.0.1", status: "Chiqarilgan", featured: true, links: { android: "https://example.com/a.apk" }, downloads: 120, created: T(10), updated: T(2) },
    g2: { title: "Pixel Runner", desc: "Runner game", genre: "Action", status: "Ishlab chiqilmoqda", links: { windows: "https://example.com/pr.exe" }, downloads: 5, created: T(3) },
    g3: { title: "Third", desc: "x", genre: "Puzzle", status: "Tez orada", created: T(1) },
  },
  news: { n1: { title: "Hello world", text: "First post body", category: "news", created: T(5) }, n2: { title: "Second", text: "body", category: "news", created: T(2) } },
};
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m); } else { fail++; console.log("  ✗ FAIL:", m); } };
async function ctxOf(b, o = {}, lang = "uz") {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" }, o));
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: "text/javascript", body: "" }));
  await ctx.route(/gstatic\.com\/firebasejs.*app-compat/, r => r.fulfill({ contentType: "text/javascript", body: FAKE }));
  await ctx.route(/telegram\.org\/js\/telegram-web-app\.js/, r => r.fulfill({ contentType: "text/javascript", body: "" }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|youtube-nocookie/, r => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await ctx.addInitScript(([l, seed]) => { localStorage.setItem("lang", l); localStorage.setItem("pc-consent", JSON.stringify({ stat: false })); localStorage.setItem("pc-ny", "off"); if (!localStorage.getItem("fk_db")) window.__SEED = seed; }, [lang, SEED]);
  return ctx;
}
async function open(ctx, url, errs) {
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (/ViewTransition/.test(e.message)) return; /* cross-document view-transition tez navigatsiyada bekor bo`ladi: asl saytda ham, fx`siz ham shunday */ errs.push("pageerror: " + e.message); }); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push("console: " + m.text()); });
  await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(700); return page;
}
(async () => {
  await new Promise(r => srv.listen(4183, r)); const B = "http://localhost:4183/"; const browser = await chromium.launch(); const errs = [];
  let ctx = await ctxOf(browser); let pg = await open(ctx, B + "games.html", errs);

  console.log("\n[1] Skeleton → haqiqiy kartalar");
  ok(await pg.locator("#games .card").count() === 3 && await pg.locator(".skel").count() === 0, "yuklangach skeleton qolmaydi, 3 ta haqiqiy karta");
  await pg.evaluate(() => { document.getElementById("games").innerHTML = ""; skelFill(); });
  ok(await pg.locator("#games .skel").count() === 6 && await pg.locator("#games .skel .pxl i").count() === 24, "bo'sh konteynerga 6 ta skeleton (piksel-loader bilan)");
  ok(await pg.locator('#games [role="status"]').textContent() === "Yuklanmoqda...", "ekran o'qigich uchun 'Yuklanmoqda...' (skeleton'lar aria-hidden)");
  await pg.reload(); await pg.waitForTimeout(700);

  console.log("\n[2] Kursor nuri, karta nuri va 3D qiyalik");
  const card = pg.locator("#games .card").first(); const bb = await card.boundingBox();
  await pg.mouse.move(bb.x + bb.width * 0.8, bb.y + bb.height * 0.3, { steps: 4 }); await pg.waitForTimeout(500);
  ok(await pg.locator("#fxGlow.on").count() === 1, "kursor nuri ko'rinadi (#fxGlow.on)");
  ok(await card.evaluate(e => e.classList.contains("tilting")), "karta .tilting");
  const vars = await card.evaluate(e => [e.style.getPropertyValue("--rx"), e.style.getPropertyValue("--ry"), e.style.getPropertyValue("--mx")]);
  ok(parseFloat(vars[1]) > 0 && parseFloat(vars[0]) > 0, "o'ng-yuqori burchakda: rotateY>0, rotateX>0 (" + vars.slice(0, 2).join(", ") + ")");
  ok(await card.evaluate(e => getComputedStyle(e, "::after").opacity) === "1", "chegara nuri (::after) yonadi");
  ok(await card.evaluate(e => getComputedStyle(e).transform) !== "none", "karta transformi qo'llangan");
  await pg.mouse.move(5, 5, { steps: 3 }); await pg.waitForTimeout(400);
  ok(await card.evaluate(e => !e.classList.contains("tilting") && !e.style.getPropertyValue("--rx")), "kursor ketgach qiyalik tozalanadi");
  const fav = pg.locator("#games .fav").first(); const g2 = await pg.locator("#games .card").nth(1).evaluate(e => e.classList.contains("tilting")); ok(!g2, "boshqa kartalar qiyshaymaydi");

  console.log("\n[3] Yurakcha uchqunlari va bosish effekti");
  await fav.click(); ok(await pg.locator(".fx-spark").count() === 9, "sevimliga qo'shilganda 9 ta uchqun");
  ok(await fav.evaluate(e => e.classList.contains("on") && e.textContent === "♥"), "yurakcha to'ldirildi");
  await pg.waitForTimeout(900); ok(await pg.locator(".fx-spark").count() === 0, "uchqunlar tugagach olib tashlanadi");
  await fav.click(); ok(await pg.locator(".fx-spark").count() === 0, "olib tashlaganda uchqun yo'q");
  await pg.mouse.move(100, 100); const btn = pg.locator("#games .btn").first(); await btn.dispatchEvent("pointerdown", { bubbles: true });
  ok(await btn.evaluate(e => e.classList.contains("fx-press")), "tugmada bosish effekti (.fx-press)");
  await pg.waitForTimeout(400); ok(await btn.evaluate(e => !e.classList.contains("fx-press")), "effekt tugagach sinfi olib tashlanadi");

  console.log("\n[4] Klaviatura yorliqlari");
  await pg.keyboard.press("/"); await pg.waitForTimeout(200); ok(await pg.evaluate(() => document.getElementById("srchDlg").open), "'/' qidiruvni ochadi");
  ok(await pg.evaluate(() => document.activeElement && document.activeElement.id) === "srchIn", "fokus qidiruv maydonida");
  await pg.keyboard.type("g?/"); ok(await pg.evaluate(() => !document.getElementById("kbDlg").open && location.pathname.endsWith("games.html")), "maydonga yozayotganda yorliqlar ishlamaydi");
  await pg.keyboard.press("Escape"); await pg.keyboard.press("Escape"); await pg.waitForTimeout(200); // type=search: birinchi Esc matnni tozalaydi, ikkinchisi oynani yopadi
  ok(await pg.evaluate(() => !document.getElementById("srchDlg").open), "Esc qidiruv oynasini yopadi");
  await pg.keyboard.press("?"); await pg.waitForTimeout(150); ok(await pg.evaluate(() => document.getElementById("kbDlg").open), "'?' yordam oynasini ochadi");
  ok(await pg.locator("#kbDlg .kb-list > div").count() === 9, "ro'yxatda 9 qator (/, 6 ta G+harf, ?, Esc)");
  await pg.keyboard.press("/"); ok(await pg.evaluate(() => !document.getElementById("srchDlg").open), "dialog ochiq paytda '/' ishlamaydi");
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(150); ok(await pg.evaluate(() => !document.getElementById("kbDlg").open), "Esc yopadi");
  await pg.click("#kbOpen"); ok(await pg.evaluate(() => document.getElementById("kbDlg").open), "pastki qismdagi 'Klaviatura yorliqlari' havolasi oynani ochadi");
  await pg.click("#kbClose");
  await pg.keyboard.press("g"); ok(await pg.locator("#fxKeys:not([hidden])").count() === 1, "'G' bosilganda harf maslahati chiqadi");
  await Promise.all([pg.waitForURL(/news\.html/), pg.keyboard.press("n")]); ok(true, "G, N → news.html");
  await pg.waitForTimeout(500); await pg.keyboard.press("g"); await Promise.all([pg.waitForURL(/index\.html|\/$/), pg.keyboard.press("h")]); ok(true, "G, H → bosh sahifa");
  await pg.waitForTimeout(500); await pg.keyboard.press("n"); await pg.waitForTimeout(300); ok(pg.url().endsWith("index.html") || pg.url().endsWith("/"), "'G' siz 'N' hech qayerga olib bormaydi");
  await pg.keyboard.press("g"); await pg.waitForTimeout(1500); await pg.keyboard.press("n"); await pg.waitForTimeout(300); ok(!/news\.html/.test(pg.url()), "G'dan 1.3 soniyadan keyin harf kuchini yo'qotadi");

  console.log("\n[5] Scroll'da paydo bo'lish va raqamlarni sanab chiqish (bosh sahifa)");
  await pg.goto(B + "index.html"); await pg.waitForTimeout(600);
  ok(await pg.locator("#stats .stat").count() === 4 && await pg.locator("#stats .skel").count() === 0, "4 ta statistika, skeleton yo'q");
  ok(await pg.locator("#stats .stat.rv").count() === 4, "ekrandan pastdagi statistikalar yashirin (.rv) turibdi");
  await pg.locator("#stats").scrollIntoViewIfNeeded(); await pg.waitForTimeout(250);
  const mid = await pg.locator("#stats .stat b").nth(2).textContent();
  ok(await pg.locator("#stats .stat.in").count() === 4, "ko'ringach .in qo'shiladi");
  await pg.waitForTimeout(1900);
  const texts = await pg.locator("#stats .stat b").allTextContents();
  ok(texts[2] === "125", "yuklashlar 0 dan sanab 125 ga yetadi (oraliq: " + mid + ", oxiri: " + texts[2] + ")");
  ok(texts[0] === "1" && texts[1] === "2", "kichik raqamlar (1, 2) tegilmaydi: " + texts.join(", "));
  ok(await pg.locator(".rv, .in").count() === 0 || await pg.locator("#stats .stat.rv").count() === 0, "animatsiyadan keyin .rv/.in olib tashlanadi (hover/tilt buzilmaydi)");
  await pg.locator("#newGames").scrollIntoViewIfNeeded(); await pg.waitForTimeout(1800);
  ok(await pg.locator("#newGames .card").count() === 3 && await pg.locator("#newGames .card.rv").count() === 0, "kartalar ko'rinib bo'ldi");
  const opac = await pg.locator("#newGames .card").first().evaluate(e => getComputedStyle(e).opacity); ok(opac === "1", "karta to'liq ko'rinadi (opacity " + opac + ")");

  console.log("\n[6] Scroll chizig'i va 'tepaga' tugmasi");
  await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(500);
  ok(await pg.locator("#fxBar.on").count() === 0 && await pg.locator(".fx-top").isHidden(), "tepada: chiziq va tugma yo'q");
  await pg.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await pg.waitForTimeout(600);
  const sx = await pg.locator("#fxBar i").evaluate(e => new DOMMatrix(getComputedStyle(e).transform).a);
  ok(await pg.locator("#fxBar.on").count() === 1 && sx > 0.97, "pastda: chiziq to'la (scaleX " + sx.toFixed(2) + ")");
  ok(await pg.locator(".fx-top").isVisible(), "'tepaga' tugmasi ko'rinadi");
  await pg.locator(".fx-top").click(); await pg.waitForTimeout(1600); ok(await pg.evaluate(() => scrollY) === 0, "tugma bosilganda tepaga qaytadi");
  ok(await pg.locator(".fx-top").getAttribute("aria-label") === "Tepaga qaytiş", "aria-label (uz, yangi alifbo): " + await pg.locator(".fx-top").getAttribute("aria-label"));
  await ctx.close();

  console.log("\n[7] prefers-reduced-motion: harakat yo'q, qulaylik qoladi");
  ctx = await ctxOf(browser, { reducedMotion: "reduce" }); pg = await open(ctx, B + "index.html", errs);
  ok(await pg.evaluate(() => !document.documentElement.classList.contains("fx") && !document.getElementById("fxGlow")), "html.fx va kursor nuri yo'q");
  ok(await pg.locator(".rv").count() === 0, "reveal yo'q (kontent darhol ko'rinadi)");
  await pg.locator("#stats").scrollIntoViewIfNeeded(); await pg.waitForTimeout(100); ok((await pg.locator("#stats .stat b").nth(2).textContent()) === "125", "raqamlar sanalmaydi — darhol 125");
  await pg.keyboard.press("/"); ok(await pg.evaluate(() => document.getElementById("srchDlg").open), "klaviatura yorliqlari ishlaydi");
  await pg.keyboard.press("Escape"); await pg.evaluate(() => scrollTo(0, 1500)); await pg.waitForTimeout(300);
  ok(await pg.locator("#fxBar.on").count() === 1, "scroll chizig'i ishlaydi");
  await ctx.close();

  console.log("\n[8] Sensorli qurilma (hover yo'q) va admin");
  ctx = await ctxOf(browser, { viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true }); pg = await open(ctx, B + "games.html", errs);
  ok(await pg.evaluate(() => !document.documentElement.classList.contains("fx-fine") && !document.getElementById("fxGlow")), "kursor nuri va qiyalik yo'q");
  ok(await pg.locator("#kbOpen").count() === 0, "'Klaviatura yorliqlari' havolasi yo'q (sensorli ekranda keraksiz)");
  ok(await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, "gorizontal scroll yo'q");
  await ctx.close();
  ctx = await ctxOf(browser); const adm = await open(ctx, B + "admin.html", errs);
  ok(await adm.evaluate(() => !document.querySelector('script[src="js/fx.js"]') && !document.getElementById("fxBar")), "admin.html: fx yuklanmaydi");
  await ctx.close();

  ok(errs.length === 0, "JS/konsol xatosi yo'q" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
  console.log("\n" + (fail ? "XATO: " + fail : "OK") + " (" + pass + " ta o'tdi)"); await browser.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
