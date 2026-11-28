// O'yin sahifasi brauzer testi: node tests/gamepage.e2e.js  (Playwright + soxta Firebase; internet shart emas)
let chromium; try { ({ chromium } = require("playwright")); } catch (e) { ({ chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright")); }
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const root = path.join(__dirname, ".."), FAKE = fs.readFileSync(path.join(__dirname, "fake-firebase.js"), "utf8");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404, { "Content-Type": "text/html" }); return r.end(fs.readFileSync(path.join(root, "404.html"))); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); r.end(fs.readFileSync(f));
});
// kichik PNG (bir rangli) — rang aniqlashni haqiqiy canvas orqali sinash uchun
const T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let x = 0xffffffff; for (const v of b) x = T[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const png = (w, h, rgb) => { const rl = w * 3 + 1, raw = Buffer.alloc(rl * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * rl + 1 + x * 3; raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2]; } const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return "data:image/png;base64," + Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]).toString("base64"); };
const now = Date.now(), TS = d => ({ __ts: now - d * 864e5 });
const SEED = {
  games: {
    ga: { title: "Orange Quest", desc: "Sarguzasht o'yini.\nIkkinchi qator.", tagline: "Olovli yo'l", genre: "Action", version: "v2.0", status: "Chiqarilgan", video: "https://youtu.be/dQw4w9WgXcQ", cover: png(64, 36, [240, 120, 20]), icon: png(32, 32, [200, 90, 10]),
      features: "Birinchi imkoniyat\nIkkinchi imkoniyat", changelog: "v2.0 - katta yangilanish\n- yangi daraja\nv1.0 - birinchi reliz", reqs: { android: "Android 8+" }, reqRec: { android: "Android 12+" }, sizes: { android: "42 MB" },
      links: { android: "https://example.com/a.apk", windows: "https://example.com/w.exe" }, downloads: 1250, created: TS(10), updated: TS(2), releaseDate: "2026-10-01" },
    gb: { title: "Blue Only", desc: "b", genre: "Puzzle", version: "v1.0", status: "Chiqarilgan", cover: png(64, 36, [30, 90, 240]), changelog: "Xatolar tuzatildi\nTezroq ishlaydi", links: { android: "https://example.com/b.apk" }, created: TS(5) },
    gc: { title: "<img src=x onerror=window.__xss=1>Soon", desc: "c", genre: "Puzzle", status: "Tez orada", created: TS(2) },
    gd: { title: "Bare", desc: "d", genre: "Puzzle", status: "Chiqarilgan", links: { windows: "https://example.com/d.exe" }, created: TS(1) },
  },
  images: ["#e11", "#1e1", "#11e", "#ee1"].reduce((o, _, i) => { o["i" + i] = { gameId: "ga", n: i + 1, data: png(64, 40, [[200, 40, 40], [40, 200, 40], [40, 40, 200], [200, 200, 40]][i]) }; return o; }, {}),
  reviews: { r1: { gameId: "ga", uid: "u1", name: "Ali", stars: 5, text: "Zo'r!", created: TS(3) }, r2: { gameId: "ga", uid: "u2", name: "Vali", stars: 5, text: "Ajoyib", created: TS(2) }, r3: { gameId: "ga", uid: "u3", name: "Sara", stars: 4, text: "Yaxshi", created: TS(1) } },
  news: {},
};
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m); } else { fail++; console.log("  ✗ FAIL:", m); } };
async function ctxOf(b, o = {}, lang = "uz", ny = "off") {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" }, o));
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: "text/javascript", body: "" }));
  await ctx.route(/gstatic\.com\/firebasejs.*app-compat/, r => r.fulfill({ contentType: "text/javascript", body: FAKE }));
  await ctx.route(/telegram\.org\/js\/telegram-web-app\.js/, r => r.fulfill({ contentType: "text/javascript", body: "" }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|youtube-nocookie|ytimg/, r => r.fulfill({ status: 200, contentType: "text/html", body: "" }));
  await ctx.addInitScript(([l, seed, n]) => { localStorage.setItem("lang", l); localStorage.setItem("pc-consent", JSON.stringify({ stat: false })); localStorage.setItem("pc-ny", n); window.__SEED = seed; }, [lang, SEED, ny]);
  return ctx;
}
const hueOf = s => { const m = /hsl\((\d+)/.exec(s); return m ? +m[1] : -999; };
async function open(ctx, url, errs, reqs) {
  const page = await ctx.newPage();
  page.on("pageerror", e => { if (/ViewTransition/.test(e.message)) return; errs.push("pageerror: " + e.message); });
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push("console: " + m.text()); });
  if (reqs) page.on("request", r => reqs.push(r.url()));
  await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(900); return page;
}
(async () => {
  await new Promise(r => srv.listen(4184, r)); const B = "http://localhost:4184/app.html?id="; const browser = await chromium.launch(); const errs = [];
  let ctx = await ctxOf(browser); const reqs = []; let pg = await open(ctx, B + "ga", errs, reqs);

  console.log("\n[1] Hero va o'yin rangi");
  const accent = await pg.evaluate(() => document.documentElement.style.getPropertyValue("--ga"));
  ok(Math.abs(hueOf(accent) - 27) <= 4, "to'q sariq muqova → sahifa rangi ~27° (" + accent + ")");
  ok(await pg.locator(".g-hero .g-bg img").count() === 1 && await pg.locator(".g-bg.px").count() === 0, "xira muqova foni bor");
  ok(await pg.locator(".g-icon img").count() === 1, "ikonka muqova ustida (rasm)");
  ok((await pg.locator(".g-hero h1").textContent()) === "Orange Quest", "katta sarlavha");
  const fs1 = await pg.locator(".g-hero h1").evaluate(e => parseFloat(getComputedStyle(e).fontSize)); ok(fs1 >= 56, "sarlavha shrifti katta: " + fs1 + "px");
  const mainBg = await pg.locator(".g-main").evaluate(e => getComputedStyle(e).backgroundImage); ok(/hsl|rgb/.test(mainBg) && mainBg.includes("gradient"), "asosiy tugma o'yin rangida (gradient)");
  const tcol = await pg.locator(".g-main").evaluate(e => getComputedStyle(e).color); ok(tcol === "rgb(8, 5, 15)", "to'q sariq fonda matn to'q (kontrast): " + tcol);
  ok(await pg.evaluate(() => document.querySelectorAll(".g-hero .kv > div").length) === 6 && await pg.locator("#dlc").textContent() === "1,250", "asl ma'lumot kataklari (6 ta) va yuklashlar soni saqlangan");
  ok(await pg.locator("#favBtn").count() === 1 && await pg.locator("#share").count() === 1 && (await pg.locator("a.more").getAttribute("href")).includes("type=bug&game=ga"), "ulashish, sevimli va xatolik havolasi saqlangan");
  const hOver = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(hOver <= 1, "gorizontal scroll yo'q (+" + hOver + "px)");
  await pg.mouse.move(300, 400, { steps: 3 }); await pg.waitForTimeout(250);
  ok(await pg.locator(".g-cover.tilting").count() === 1, "muqova kursorga qarab buriladi (.tilting)");
  await pg.mouse.move(5, 5, { steps: 2 }); await pg.waitForTimeout(250); ok(await pg.locator(".g-cover.tilting").count() === 0, "kursor ketgach qiyalik tozalanadi");
  await pg.close();

  console.log("\n[2] Boshqa o'yinlar — boshqa ranglar; muqovasiz o'yin");
  pg = await open(ctx, B + "gb", errs); ok(Math.abs(hueOf(await pg.evaluate(() => document.documentElement.style.getPropertyValue("--ga"))) - 222) <= 6, "ko'k muqova → ~222°"); await pg.close();
  pg = await open(ctx, B + "gd", errs); const fb = hueOf(await pg.evaluate(() => document.documentElement.style.getPropertyValue("--ga")));
  ok([268, 190, 330, 38, 152, 215].includes(fb), "muqovasiz o'yin → palitradagi rang (" + fb + "°)");
  ok(await pg.locator(".g-bg.px").count() === 1 && await pg.locator(".g-icon").textContent() === "BA", "piksel fon va bosh harflar ikonka o'rnida");
  ok(await pg.locator("#g-video, #g-shots, #g-feats, #g-sys, #g-log").count() === 0, "bo'sh bo'limlar chiqmaydi");
  ok(await pg.locator("#gChips a").allTextContents().then(a => a.length === 3), "menyuda faqat mavjud bo'limlar (Haqida, Sharhlar, O'xshash): " + (await pg.locator("#gChips a").allTextContents()).join(", "));
  ok(await pg.locator("#gRate").isHidden() && await pg.locator(".rsum").count() === 0, "sharh yo'q: reyting belgisi va xulosa yo'q");
  await pg.close();

  console.log("\n[3] Qurilma tizimiga mos asosiy tugma");
  const OSX = [["Android", "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile", "Android", false], ["Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", "Windows", false],
    ["macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120", "Android", "macOS"], ["iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604", "Android", "iOS"], ["Linux (noma'lum)", null, "Android", false]];
  for (const [name, ua, want, hint] of OSX) {
    const c = await ctxOf(browser, ua ? { userAgent: ua } : {}); const p = await open(c, B + "ga", errs);
    const main = await p.locator(".g-main").textContent(), href = await p.locator(".g-main").getAttribute("href"), h = await p.locator(".g-hint").count() ? await p.locator(".g-hint").textContent() : "";
    ok(main.includes(want) && href.includes(want === "Windows" ? "w.exe" : "a.apk"), name + ": asosiy tugma '" + main + "'");
    ok(hint ? h.includes(hint) : h === "", name + ": " + (hint ? "maslahat '" + h + "'" : "maslahat yo'q"));
    await c.close();
  }
  { const c = await ctxOf(browser, { userAgent: OSX[1][1] }); const p = await open(c, B + "ga", errs);
    ok(await p.locator(".g-cta .dls a.dl").count() === 1 && (await p.locator(".g-cta .dls a.dl").textContent()).includes("Android"), "Windows'da: Android — qo'shimcha tugma"); await c.close(); }
  { const c = await ctxOf(browser, {}, "ru"); const p = await open(c, B + "ga", errs); ok((await p.locator(".g-main").textContent()).includes("Скачать для Android"), "ru: 'Скачать для Android'"); await c.close(); }
  { const c = await ctxOf(browser, {}, "en"); const p = await open(c, B + "ga", errs); ok((await p.locator(".g-main").textContent()).includes("Download for Android"), "en: 'Download for Android'"); await c.close(); }
  { const p = await open(ctx, B + "gc", errs);
    ok(await p.locator(".g-main.dl").count() === 0 && (await p.locator(".g-main").getAttribute("href")) !== null && await p.locator(".g-hint").count() === 0, "'Tez orada': asosiy tugma — xabar olish (yuklab olish emas)");
    ok(await p.evaluate(() => !window.__xss) && await p.locator(".g-hero h1 img").count() === 0 && (await p.locator(".g-hero h1").textContent()).includes("<img"), "sarlavhadagi HTML zararsiz (XSS yo'q)");
    ok(await p.locator('#gMini [data-link="telegram"]').count() === 1, "mini panelda ham xabar olish"); await p.close(); }

  console.log("\n[4] Yopishqoq menyu va mini yuklab olish paneli");
  pg = await open(ctx, B + "ga", errs, null);
  const chips = await pg.locator("#gChips a").allTextContents(); ok(chips.length === 8, "8 ta bo'lim: " + chips.join(" · "));
  ok(await pg.evaluate(() => ["g-about", "g-video", "g-shots", "g-feats", "g-sys", "g-log", "revBox", "g-sim"].every(id => document.getElementById(id))), "barcha bo'lim id'lari mavjud");
  ok(await pg.locator("#gNav.cta").count() === 0 && await pg.locator("#gMini").evaluate(e => getComputedStyle(e).visibility) === "hidden", "tepada: mini panel yashirin");
  await pg.evaluate(() => scrollTo(0, 900)); await pg.waitForTimeout(500);
  ok(await pg.locator("#gNav.cta").count() === 1 && await pg.locator("#gMini").evaluate(e => getComputedStyle(e).visibility) === "visible", "asosiy tugma ko'zdan chiqqach mini panel paydo bo'ladi");
  const top = await pg.locator("#gNav").evaluate(e => Math.round(e.getBoundingClientRect().top)); ok(top === 0, "menyu ekran tepasiga yopishadi (top=" + top + ")");
  ok((await pg.locator("#gMini .btn").getAttribute("href")) === (await pg.locator(".g-main").getAttribute("href")) && await pg.locator("#gMini a.dl").count() === 1, "mini tugma xuddi shu havola (+ yuklashlar sanagichi uchun .dl)");
  ok(await pg.evaluate(() => document.documentElement.classList.contains("g-bar-on")), "html.g-bar-on (mobil siljishlar uchun)");
  await pg.locator('#gChips a[data-s="g-feats"]').click(); await pg.waitForTimeout(1500);
  const act = await pg.locator("#gChips a.on").getAttribute("data-s"); ok(act === "g-feats", "chip bosilganda o'sha bo'limga o'tadi va belgilanadi (" + act + ")");
  ok(await pg.locator("#gChips a.on").getAttribute("aria-current") === "true" && await pg.locator("#gChips a[aria-current]").count() === 1, "aria-current faqat bittasida");
  const secTop = await pg.locator("#g-feats").evaluate(e => Math.round(e.getBoundingClientRect().top)); ok(secTop >= 70 && secTop <= 100, "bo'lim sarlavhasi menyu ostida to'xtaydi, yopilib qolmaydi (top=" + secTop + ")");
  await pg.locator('#gChips a[data-s="g-log"]').click(); await pg.waitForTimeout(1600);
  ok(await pg.locator("#gChips a.on").getAttribute("data-s") === "g-log", "sahifa oxiriga yaqin bo'lim (tepaga yeta olmaydi) ham bosilgan chipda belgilanadi");
  await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(500); ok(await pg.locator("#gChips a.on").count() === 0 && await pg.locator("#gNav.cta").count() === 0, "tepaga qaytganda belgi va mini panel yo'qoladi");
  await pg.close();

  console.log("\n[5] Skrinshotlar lentasi");
  pg = await open(ctx, B + "ga", errs); const strip = pg.locator("#gStrip"); ok(await strip.locator(".shot").count() === 4, "4 ta skrinshot");
  const w = await strip.locator(".shot").evaluateAll(a => a.map(e => Math.round(e.getBoundingClientRect().width))); ok(w[0] > w[1] + 80, "birinchisi katta (" + w.join(", ") + ")");
  ok(await strip.evaluate(e => e.scrollWidth > e.clientWidth + 20 && getComputedStyle(e).scrollSnapType.includes("mandatory")), "lenta gorizontal suriladi (scroll-snap)");
  await strip.scrollIntoViewIfNeeded(); await pg.waitForTimeout(300);
  ok(await pg.locator("#gNext").isVisible() && await pg.locator("#gPrev").isDisabled(), "o'ng strelka ko'rinadi, boshida chap strelka o'chiq");
  await pg.click("#gNext"); await pg.waitForTimeout(900); ok(await strip.evaluate(e => e.scrollLeft) > 100 && await pg.locator("#gPrev").isEnabled(), "strelka lentani suradi, chap strelka yoqiladi");
  for (let i = 0; i < 4 && !(await pg.locator("#gNext").isDisabled()); i++) { await pg.click("#gNext"); await pg.waitForTimeout(900); }
  ok(await pg.locator("#gNext").isDisabled(), "oxiriga yetganda o'ng strelka o'chadi");
  await strip.locator(".shot").first().scrollIntoViewIfNeeded(); await strip.locator(".shot").nth(1).click(); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => document.getElementById("zoom").open && document.getElementById("zimg").src.startsWith("data:image")), "skrinshot bosilganda eski lightbox ochiladi");
  await pg.click("#znext"); ok(await pg.evaluate(() => document.getElementById("zoom").open), "lightbox: keyingi rasm ishlaydi"); await pg.click("#zc"); await pg.close();
  { const c = await ctxOf(browser, { viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true }); const p = await open(c, B + "ga", errs);
    ok(!(await p.locator("#gNext").isVisible()) && await p.locator("#gStrip").evaluate(e => e.scrollWidth > e.clientWidth), "sensorli ekran: strelkalar yo'q, lentani barmoq bilan suriladi"); await c.close(); }

  console.log("\n[6] Video: bosilganda yuklanadi");
  const yt = []; pg = await open(ctx, B + "ga", errs, yt);
  ok(await pg.locator(".vid-poster").count() === 1 && await pg.locator("iframe.vid").count() === 0, "oldindan ko'rinish (play tugmasi), iframe yo'q");
  ok(yt.filter(u => /youtube|ytimg|youtu\.be/.test(u)).length === 0, "sahifa ochilganda YouTube'ga so'rov ketmaydi (Google Fonts alohida, avvaldan bor)");
  ok(await pg.locator(".vid-poster .vid-play").count() === 1 && (await pg.locator(".vid-poster").getAttribute("aria-label")).includes("Orange Quest"), "play tugmasi va aria-label");
  await pg.locator(".vid-poster").click(); await pg.waitForTimeout(300);
  const src = await pg.locator("iframe.vid").getAttribute("src"); ok(src === "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1", "bosilganda youtube-nocookie iframe: " + src);
  ok(await pg.locator(".vid-poster").count() === 0 && (await pg.locator("iframe.vid").getAttribute("allow")).includes("autoplay"), "poster almashtirildi, autoplay ruxsati bor");
  await pg.close();

  console.log("\n[7] O'zgarishlar vaqt chizig'i");
  pg = await open(ctx, B + "ga", errs); ok(await pg.locator(".tl .tl-i").count() === 2, "2 ta versiya");
  ok((await pg.locator(".tl-v").allTextContents()).join(",") === "v2.0,v1.0", "versiya belgilari: v2.0, v1.0");
  ok((await pg.locator(".tl-i").first().locator(".tl-new").textContent()) === "Yangi" && await pg.locator(".tl-new").count() === 1, "joriy versiyada 'Yangi' belgisi (faqat bitta)");
  ok((await pg.locator(".tl-i").first().locator("li").allTextContents()).join("|") === "katta yangilanish|yangi daraja", "'- yangi daraja' qatori oldingi versiyaga qo'shildi");
  await pg.close(); pg = await open(ctx, B + "gb", errs);
  ok(await pg.locator(".tl .tl-i").count() === 1 && await pg.locator(".tl-v, .tl-new").count() === 0 && await pg.locator(".tl-i li").count() === 2, "versiyasiz matn — bitta yozuv, belgilarsiz, 2 ta band"); await pg.close();

  console.log("\n[8] Reyting xulosasi");
  pg = await open(ctx, B + "ga", errs); ok((await pg.locator("#gRate").textContent()) === "★ 4.7 · Şarhlar: 3" && await pg.locator("#gRate").isVisible(), "sarlavha ostida reyting belgisi: " + await pg.locator("#gRate").textContent());
  ok((await pg.locator(".rsum .big").textContent()) === "4.7" && (await pg.locator(".rs-l small").textContent()) === "Şarhlar: 3", "katta o'rtacha 4.7 va soni");
  ok((await pg.locator("#avg").textContent()).includes("4.7"), "eski reyting katagi saqlangan");
  const bars = await pg.locator(".rbar").evaluateAll(a => a.map(e => [e.querySelector("span").textContent.trim(), e.querySelector("b").style.getPropertyValue("--w"), e.querySelector("em").textContent])); 
  ok(JSON.stringify(bars) === JSON.stringify([["5 ★", "67%", "2"], ["4 ★", "33%", "1"], ["3 ★", "0%", "0"], ["2 ★", "0%", "0"], ["1 ★", "0%", "0"]]), "taqsimot: " + JSON.stringify(bars));
  const bw = await pg.locator(".rbar").first().locator("b").evaluate(e => e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width); ok(Math.abs(bw - 0.67) < 0.03, "chiziq uzunligi 67% (" + bw.toFixed(2) + ")");
  await pg.locator("#gRate").click(); await pg.waitForTimeout(900); ok((await pg.evaluate(() => Math.round(document.getElementById("revBox").getBoundingClientRect().top))) < 200, "belgi bosilganda sharhlarga o'tadi");
  ok(await pg.locator(".rs-st").count() === 1 && await pg.locator(".rsum .st").count() === 0, "yulduzlar qatori alohida sinfda (kartadagi '.st' bilan to'qnashmaydi)");
  await pg.close();

  console.log("\n[9] Yangi Yil mavzusi bilan, reduced-motion, Mini App uchun xavfsizlik");
  { const c = await ctxOf(browser, {}, "uz", "on"); const p = await open(c, B + "ga", errs); await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.documentElement.classList.contains("ny")) && Math.round(await p.locator("#gNav").evaluate(e => e.getBoundingClientRect().top)) === 0, "Yangi Yil yoqiq: menyu baribir tepaga yopishadi"); await c.close(); }
  { const c = await ctxOf(browser, { reducedMotion: "reduce" }); const p = await open(c, B + "ga", errs);
    ok(await p.locator(".g-hero h1").evaluate(e => getComputedStyle(e).animationName) === "none" && await p.locator(".g-cover").evaluate(e => getComputedStyle(e).animationName) === "none", "reduced-motion: kirish animatsiyasi o'chiq");
    ok(await p.locator(".g-main").isVisible() && await p.locator(".g-hero h1").isVisible(), "kontent ko'rinib turadi"); await c.close(); }
  { const c = await ctxOf(browser, { viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true }); const p = await open(c, B + "ga", errs);
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, "375px: gorizontal scroll yo'q");
    await p.evaluate(() => scrollTo(0, 1000)); await p.waitForTimeout(500);
    const r = await p.locator("#gMini").evaluate(e => { const b = e.getBoundingClientRect(); return [Math.round(b.bottom), innerHeight, getComputedStyle(e).position]; });
    ok(r[2] === "fixed" && r[0] === r[1], "mobil: mini panel ekranning pastida (fixed)");
    const ft = await p.locator(".fx-top").evaluate(e => Math.round(innerHeight - e.getBoundingClientRect().bottom)); ok(ft >= 80, "'tepaga' tugmasi mini panel ustida (pastdan " + ft + "px)"); await c.close(); }
  { const p = await open(ctx, B + "nope", errs); ok(await p.locator(".g-hero").count() === 0 && (await p.locator("#app").textContent()).length > 3, "mavjud bo'lmagan o'yin: chiroyli bo'sh holat, xato yo'q"); await p.close(); }

  ok(errs.length === 0, "JS/konsol xatosi yo'q" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
  console.log("\n" + (fail ? "XATO: " + fail : "OK") + " (" + pass + " ta o'tdi)"); await browser.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
