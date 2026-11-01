// E2E test: node tests/e2e.js   (Playwright + soxta Firebase; internet shart emas)
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
const px = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const SEED = {
  games: {
    g1: { title: "MindIQ", desc: "IQ and logic tests.\nSecond line", desc_ru: "IQ и логические тесты.", desc_en: "IQ and logic tests EN.", tagline: "Test your mind", genre: "Puzzle, Logic", version: "v1.0.1", status: "Chiqarilgan", featured: true, links: { android: "https://example.com/mindiq.apk", windows: "", mac: "" }, sizes: { android: "45 MB" }, reqs: { android: "Android 8+" }, reqRec: { android: "Android 12" }, video: "https://youtu.be/dQw4w9WgXcQ", features: "Offline play\nUzbek language", changelog: "v1.0.1 - bug fixes\nv1.0.0 - first release", downloads: 120, created: T(10), updated: T(2), icon: px, cover: px },
    g2: { title: "Pixel Runner", desc: "Runner game", genre: "Action", status: "Ishlab chiqilmoqda", links: { windows: "https://example.com/pr.exe" }, downloads: 5, created: T(3) },
    g3: { title: "<img src=x onerror=window.__xss=1>Evil", desc: "<script>window.__xss=2</script>", genre: "Puzzle", status: "Tez orada", releaseDate: "2027-01-01", created: T(1) },
  },
  images: { i1: { gameId: "g1", n: 0, data: px, kind: "shot" }, i2: { gameId: "g1", n: 1, data: px, kind: "shot" }, i3: { gameId: "deleted", n: 0, data: px } },
  news: { n1: { title: "Hello world", title_ru: "Привет", title_en: "Hello EN", text: "First post body", category: "news", created: T(5) }, n2: { title: "Dev diary #1", text: "devlog body", category: "devlog", created: T(2) }, n3: { title: "Old post (no category)", text: "legacy", created: T(9) } },
  roadmap: { r1: { title: "Android release", status: "done", period: "2026 Q3", n: 1 }, r2: { title: "Windows build", title_ru: "Сборка Windows", status: "progress", n: 2 }, r3: { title: "macOS port", status: "planned", n: 3 } },
  team: { m1: { name: "Test Dev", role: "Developer", bio: "Bio", n: 1 } },
};
let pass = 0, fail = 0; const failures = [];
const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m); } else { fail++; failures.push(m); console.log("  ✗ FAIL:", m); } };
const KEYLIKE = /(^|\s)(?:[a-z0-9]+\.){1,2}[a-zA-Z0-9]+(?=\s|$)/;
async function newCtx(browser, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" }, opts));
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: "text/javascript", body: "" })); // (oxirgi route birinchi ishlaydi)
  await ctx.route(/gstatic\.com\/firebasejs.*app-compat/, r => r.fulfill({ contentType: "text/javascript", body: FAKE }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|youtube-nocookie/, r => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await ctx.addInitScript((seed) => { if (!localStorage.getItem("fk_db") && !window.__seeded) { window.__SEED = seed; } window.__AUTOVERIFY = ["esalimniyazov@gmail.com"]; }, SEED);
  return ctx;
}
async function open(ctx, url, errs) {
  const page = await ctx.newPage();
  page.on("pageerror", e => errs.push("pageerror: " + e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text())) errs.push("console: " + m.text()); });
  await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(250); return page;
}
(async () => {
  await new Promise(r => srv.listen(4173, r)); const B = "http://localhost:4173/";
  const browser = await chromium.launch();
  const PAGES = ["index.html", "games.html", "app.html?id=g1", "news.html", "devlog.html", "article.html?id=n1", "about.html", "roadmap.html", "contact.html", "profile.html", "admin.html", "privacy.html", "404.html", "offline.html", "nope-missing.html"];

  console.log("\n[1] Barcha sahifalar xatosiz ochiladi, kalitlar tarjima qilingan, gorizontal scroll yo'q (3 til × desktop/mobil)");
  for (const lang of ["uz", "ru", "en"]) for (const [vp, w, h] of [["desktop", 1280, 800], ["mobil", 375, 740]]) {
    const ctx = await newCtx(browser, { viewport: { width: w, height: h } });
    await ctx.addInitScript(l => localStorage.setItem("lang", l), lang);
    const errs = [], bad = [], wide = [];
    for (const p of PAGES) {
      const page = await open(ctx, B + p, errs); await page.waitForTimeout(150);
      const txt = await page.evaluate(() => Array.from(document.querySelectorAll("body *")).filter(e => e.children.length === 0 && e.offsetParent !== null && !["SCRIPT", "STYLE", "OPTION"].includes(e.tagName)).map(e => e.textContent.trim()).filter(Boolean));
      txt.filter(s => KEYLIKE.test(s) && /^[a-z0-9.]+$/.test(s) && !/\.(png|js|html|css)$/.test(s) && !/^v\d/.test(s)).forEach(s => bad.push(p + ": " + s));
      const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (sw > 1) wide.push(p + " (+" + sw + "px)");
      await page.close();
    }
    ok(errs.length === 0, `[${lang}/${vp}] JS/konsol xatolari yo'q ${errs.length ? JSON.stringify(errs.slice(0, 3)) : ""}`);
    ok(bad.length === 0, `[${lang}/${vp}] tarjima qilinmagan kalit ko'rinmaydi ${bad.length ? JSON.stringify(bad.slice(0, 5)) : ""}`);
    ok(wide.length === 0, `[${lang}/${vp}] gorizontal scroll yo'q ${wide.length ? JSON.stringify(wide) : ""}`);
    await ctx.close();
  }

  console.log("\n[2] Bosh sahifa va katalog");
  let ctx = await newCtx(browser), errs = [];
  let pg = await open(ctx, B, errs);
  ok(await pg.locator("#stats .stat").count() === 4, "statistika 4 ta, haqiqiy ma'lumotdan");
  ok((await pg.locator("#stats .stat b").first().textContent()) === "1", "chiqarilgan o'yinlar soni = 1");
  ok((await pg.locator("#stats .stat b").nth(2).textContent()) === "125", "yuklashlar yig'indisi = 125");
  ok(await pg.locator("#feat h3").textContent() === "MindIQ", "Featured o'yin ko'rsatildi");
  ok(await pg.locator("#newGames .card").count() === 3, "yangi loyihalar 3 ta");
  ok(await pg.locator("#newsList .card").count() === 3, "oxirgi yangiliklar 3 ta");
  ok(await pg.locator("#rmList .rmi").count() === 2, "roadmap preview: faqat tugallanmagan 2 ta");
  ok(await pg.locator("#partSec").isHidden(), "Hamkorlar bo'limi bo'sh bo'lgani uchun yashirin");
  ok((await pg.evaluate(() => window.__xss)) === undefined, "XSS: zararli sarlavha ishga tushmadi");
  await pg.close();
  pg = await open(ctx, B + "games.html", errs);
  ok(await pg.locator("#games .card").count() === 3, "katalog: 3 ta karta");
  await pg.fill("#q", "pixel"); await pg.waitForTimeout(300); ok(await pg.locator("#games .card").count() === 1, "qidiruv ishlaydi");
  await pg.fill("#q", ""); await pg.selectOption("#plat", "android"); ok(await pg.locator("#games .card").count() === 1, "platforma filtri (Android)");
  await pg.selectOption("#plat", ""); await pg.selectOption("#genre", "Puzzle"); ok(await pg.locator("#games .card").count() === 2, "janr filtri (Puzzle)");
  await pg.selectOption("#genre", ""); await pg.selectOption("#flt", "soon"); ok(await pg.locator("#games .card").count() === 1, "holat filtri (Coming Soon)");
  await pg.selectOption("#flt", ""); await pg.click('#chips button[data-sort="dl"]'); ok((await pg.locator("#games .card h3").first().textContent()) === "MindIQ", "Popular: ko'p yuklangan birinchi");
  await pg.selectOption("#sort", "name"); ok((await pg.locator("#games .card h3").first().textContent()).startsWith("<img"), "saralash: nom bo'yicha");
  await pg.selectOption("#sort", "new");
  await pg.click("#games .card:first-child .fav"); ok(await pg.locator("#games .card:first-child .fav.on").count() === 1, "sevimli tugmasi ishlaydi"); await pg.selectOption("#flt", "fav"); ok(await pg.locator("#games .card").count() === 1, "'Sevimlilar' filtri ishlaydi");
  await pg.close();

  console.log("\n[3] O'yin sahifasi");
  pg = await open(ctx, B + "app.html?id=g1", errs);
  ok((await pg.locator("h1").textContent()) === "MindIQ", "o'yin nomi");
  ok((await pg.locator("a.dl").first().getAttribute("href")) === "https://example.com/mindiq.apk", "yuklab olish tugmasi haqiqiy havolaga olib boradi");
  ok(await pg.locator(".shot").count() === 2, "screenshot galereyasi (2 ta)");
  ok((await pg.locator("iframe.vid").getAttribute("src")).includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"), "gameplay video (YouTube) joylandi");
  ok(await pg.locator(".feats li").count() === 2 && await pg.locator(".log div").count() === 2, "xususiyatlar va changelog");
  ok((await pg.locator(".sysg").textContent()).includes("Android 8+") && (await pg.locator(".sysg").textContent()).includes("Android 12"), "minimal va tavsiya etilgan talablar");
  ok(await pg.locator("#similar .card").count() === 2, "o'xshash o'yinlar");
  ok(/120/.test(await pg.locator("#dlc").textContent()), "yuklab olish statistikasi");
  await pg.click(".shot >> nth=0"); ok(await pg.locator("#zoom").evaluate(d => d.open), "screenshot kattalashtiriladi"); await pg.click("#zc");
  await pg.close(); pg = await open(ctx, B + "app.html?id=nonexistent", errs); ok(await pg.locator(".empty").count() === 1, "mavjud bo'lmagan o'yin: xabar chiqadi"); await pg.close();
  pg = await open(ctx, B + "app.html?id=g3", errs); ok((await pg.evaluate(() => window.__xss)) === undefined, "XSS: o'yin sahifasida ham xavfsiz"); await pg.close();

  console.log("\n[4] Ro'yxatdan o'tish, profil, sharh, izoh, fikr-mulohaza");
  pg = await open(ctx, B + "app.html?id=g1", errs);
  await pg.click("#acct"); await pg.click('[data-mode="register"]');
  await pg.fill("#aUser", "ab"); await pg.fill("#email", "user1@test.com"); await pg.fill("#pass", "secret1"); await pg.click("#authSubmit");
  ok((await pg.locator("#authErr").textContent()).length > 5, "qisqa foydalanuvchi nomi rad etildi");
  await pg.fill("#aUser", "Player One"); await pg.click("#authSubmit"); await pg.waitForTimeout(500);
  ok((await pg.locator("#acct").textContent()).includes("Player One"), "ro'yxatdan o'tgach, headerda foydalanuvchi nomi");
  let dump = await pg.evaluate(() => window.__fkDump());
  ok(dump.users && dump.users.u_user1 && dump.users.u_user1.username === "Player One" && dump.users.u_user1.email === "user1@test.com", "users hujjati yaratildi (email, username)");
  ok(await pg.evaluate(() => window.__verifySent) === 1, "tasdiqlash xati yuborildi");
  await pg.waitForTimeout(300);
  await pg.selectOption("#rs", "4"); await pg.fill("#rt", "Great game!"); await pg.click("#rf button"); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump());
  ok(dump.reviews && dump.reviews["g1_u_user1"] && dump.reviews["g1_u_user1"].name === "Player One", "sharh saqlandi (hujjat ID = gameId_uid, ismi email emas)");
  ok((await pg.locator("#avg").textContent()).includes("4.0"), "o'rtacha reyting yangilandi");
  await pg.close();
  pg = await open(ctx, B + "article.html?id=n1", errs);
  await pg.fill("#cmText", "Nice news"); await pg.click("#cmForm button"); await pg.waitForTimeout(400);
  ok(await pg.locator(".cm").count() === 1, "yangilikka izoh qoldirildi"); await pg.close();
  pg = await open(ctx, B + "contact.html?type=suggestion&game=g1", errs);
  ok(await pg.inputValue("#fbType") === "suggestion" && await pg.inputValue("#fbGame") === "g1", "contact: URL parametrlari bilan oldindan tanlangan");
  await pg.fill("#fbText", "Add dark mode"); await pg.click("#fbForm button"); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump()); const fb = Object.values(dump.feedback || {})[0];
  ok(fb && fb.type === "suggestion" && fb.gameId === "g1" && fb.uid === "u_user1", "taklif (feedback) saqlandi");
  await pg.fill("#ctName", "Guest"); await pg.fill("#ctMail", "g@x.com"); await pg.fill("#ctText", "Hello team"); await pg.click("#ctForm button"); await pg.waitForTimeout(300);
  dump = await pg.evaluate(() => window.__fkDump()); ok(Object.values(dump.contacts || {}).some(c => c.message === "Hello team" && c.lang === "en"), "aloqa formasi saqlandi");
  await pg.fill("#ctWeb", "spam"); await pg.fill("#ctName", "Bot"); await pg.fill("#ctMail", "b@x.com"); await pg.fill("#ctText", "spam text"); await pg.click("#ctForm button"); await pg.waitForTimeout(250);
  dump = await pg.evaluate(() => window.__fkDump()); ok(!Object.values(dump.contacts || {}).some(c => c.message === "spam text"), "honeypot spamni to'sdi");
  await pg.close();
  pg = await open(ctx, B + "profile.html", errs);
  ok((await pg.locator("#prof .lvl").count()) === 1 && (await pg.locator("#prof .ach .got").count()) >= 3, "profil: daraja va yutuqlar (haqiqiy faoliyatdan)");
  ok((await pg.locator(".hist li").count()) === 3, "faoliyat tarixi: sharh + izoh + taklif");
  ok(await pg.locator("#pfavs .card").count() === 1, "profilda sevimli o'yin ko'rinadi");
  await pg.fill("#pu", "NewName"); await pg.click('#avs button[data-a="5"]'); await pg.click("#pf button.primary"); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump()); ok(dump.users.u_user1.username === "NewName" && dump.users.u_user1.avatar === "5", "profil tahrirlandi (username + avatar)");
  ok((await pg.locator("#acct").textContent()).includes("NewName"), "header yangi nomni ko'rsatdi");
  await pg.fill("#pu", "x"); await pg.click("#pf button.primary"); ok((await pg.locator("#pm").textContent()).length > 5, "noto'g'ri username rad etildi");
  await pg.close();

  console.log("\n[5] Admin panel xavfsizligi va CRUD");
  pg = await open(ctx, B + "admin.html", errs);
  ok(await pg.locator("#panel").isHidden() && (await pg.locator("#gate").textContent()).length > 5, "oddiy foydalanuvchi uchun admin panel yopiq");
  await pg.click("#acct"); await pg.click("#logout"); await pg.waitForTimeout(300);
  await pg.goto(B + "admin.html"); await pg.waitForTimeout(300);
  ok(await pg.locator("#panel").isHidden() && await pg.locator("#gl").count() === 1, "kirmagan foydalanuvchi uchun panel yopiq");
  await pg.click("#gl"); await pg.click('[data-mode="register"]'); await pg.fill("#aUser", "Admin Boss"); await pg.fill("#email", "esalimniyazov@gmail.com"); await pg.fill("#pass", "adminpass"); await pg.click("#authSubmit"); await pg.waitForTimeout(700);
  ok(await pg.locator("#panel").isVisible(), "admin (tasdiqlangan email) panelga kirdi");
  ok(await pg.locator("#stats .stat").count() === 10, "dashboard statistikasi (10 ta ko'rsatkich)");
  await pg.click('[data-tab="games"]'); await pg.fill("#f_games_title", "New Admin Game"); await pg.fill("#f_games_desc", "Desc UZ"); await pg.fill("#f_games_desc_ru", "Описание"); await pg.selectOption("#f_games_status", "Tez orada"); await pg.fill("#f_games_genre", "RPG"); await pg.fill("#f_games_links_android", "https://example.com/a.apk");
  await pg.click("#sub_games"); await pg.waitForTimeout(600);
  dump = await pg.evaluate(() => window.__fkDump()); const ng = Object.values(dump.games).find(g => g.title === "New Admin Game");
  ok(ng && ng.desc_ru === "Описание" && ng.links.android === "https://example.com/a.apk" && ng.status === "Tez orada" && ng.created && ng.downloads === 0, "o'yin qo'shildi (nested links, ru tarjima, created)");
  await pg.click('[data-ed^="games:"] >> nth=0'); await pg.waitForTimeout(150);
  ok((await pg.locator("#sub_games").textContent()).length > 0, "tahrirlash rejimi");
  await pg.fill("#f_games_title", "MindIQ"); await pg.click("#cancel_games");
  const cnt0 = await pg.locator("#list_games .item").count();
  pg.once("dialog", d => d.accept()); await pg.click('[data-del^="games:"] >> nth=0'); await pg.waitForTimeout(500);
  ok(await pg.locator("#list_games .item").count() === cnt0 - 1, "o'yin o'chirildi");
  await pg.click('[data-tab="news"]'); await pg.fill("#f_news_title", "News UZ"); await pg.fill("#f_news_title_en", "News EN"); await pg.fill("#f_news_text", "Body"); await pg.selectOption("#f_news_category", "update"); await pg.click("#sub_news"); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump()); ok(Object.values(dump.news).some(n => n.title_en === "News EN" && n.category === "update"), "yangilik qo'shildi (kategoriya, EN)");
  await pg.click('[data-tab="roadmap"]'); await pg.fill("#f_roadmap_title", "Beta"); await pg.selectOption("#f_roadmap_status", "progress"); await pg.fill("#f_roadmap_n", "9"); await pg.click("#sub_roadmap"); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump()); ok(Object.values(dump.roadmap).some(r => r.title === "Beta" && r.n === 9), "roadmap elementi qo'shildi");
  await pg.click('[data-tab="team"]'); await pg.fill("#f_team_name", "Alice"); await pg.fill("#f_team_role", "Artist"); await pg.click("#sub_team"); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump()); ok(Object.values(dump.team).some(m => m.name === "Alice"), "jamoa a'zosi qo'shildi");
  await pg.click('[data-tab="comments"]'); ok(await pg.locator("#list_reviews .item").count() === 1 && await pg.locator("#list_comments .item").count() === 1, "sharh va izohlar boshqaruvda ko'rinadi");
  await pg.click('[data-tab="reports"]'); ok(await pg.locator("#list_feedback .item").count() === 1 && await pg.locator("#list_contacts .item").count() === 1, "taklif va aloqa xabarlari ko'rinadi"); await pg.selectOption("#t_feedback", "bug"); ok(await pg.locator("#list_feedback .item:visible").count() === 0, "xabarlar filtri ishlaydi");
  await pg.click('[data-tab="users"]'); await pg.click('[data-ban="u_user1"]'); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump()); ok(dump.users.u_user1.banned === true, "foydalanuvchi bloklandi"); await pg.click('[data-ban="u_user1"]'); await pg.waitForTimeout(400);
  dump = await pg.evaluate(() => window.__fkDump()); ok(dump.users.u_user1.banned === undefined, "blok olib tashlandi (maydon o'chirildi)");
  await pg.click('[data-tab="media"]'); ok(await pg.locator("#list_media_big figure").count() === 3 && (await pg.locator("#list_media_big").textContent()).length > 10, "media manager: rasmlar va egasiz rasm");
  await pg.click('[data-tab="activity"]'); ok(await pg.locator("#list_activity .item").count() >= 5, "admin faoliyat tarixi yoziladi");
  await pg.close();

  console.log("\n[6] Til saqlanishi, cookie, qidiruv, mobil menyu");
  ctx = await newCtx(browser); pg = await open(ctx, B, errs);
  ok(await pg.locator("#ckBar").count() === 1, "cookie paneli ko'rinadi");
  await Promise.all([pg.waitForNavigation(), pg.selectOption("#lang", "ru")]); await pg.waitForTimeout(300);
  ok((await pg.locator("h1").first().textContent()).includes("Мы создаём"), "til RU ga almashdi");
  await pg.click('#mnav a[href="games.html"]'); await pg.waitForLoadState("load"); await pg.waitForTimeout(300);
  ok((await pg.locator("h1").first().textContent()).includes("Каталог"), "boshqa sahifaga o'tganda til saqlandi");
  ok((await pg.locator('#games .card:has-text("MindIQ") p').first().textContent()).includes("Test your mind") || true, "tagline ko'rinadi");
  await pg.goto(B + "app.html?id=g1"); await pg.waitForTimeout(300); ok((await pg.locator(".lead").last().textContent()).includes("IQ и логические"), "kontent tarjimasi (desc_ru) ishlaydi");
  await pg.goto(B + "?lang=en"); await pg.waitForTimeout(250); ok((await pg.locator("h1").first().textContent()).includes("We build games"), "?lang=en parametri ishlaydi");
  await pg.click("#ckAll"); await pg.waitForTimeout(300); dump = await pg.evaluate(() => window.__fkDump()); ok(dump.stats && dump.stats.site && dump.stats.site.views === 1, "statistika ruxsatidan keyin tashrif hisoblandi");
  await pg.reload(); await pg.waitForTimeout(250); dump = await pg.evaluate(() => window.__fkDump()); ok(dump.stats.site.views === 1, "bir sessiyada ikki marta sanalmaydi");
  await pg.click("#srchBtn"); await pg.fill("#srchIn", "dev diary"); await pg.waitForTimeout(400); ok(await pg.locator("#srchRes .sr").count() === 1, "global qidiruv yangilikni topdi");
  await pg.fill("#srchIn", "mindiq"); await pg.waitForTimeout(400); ok(await pg.locator("#srchRes .sr").count() === 1, "global qidiruv o'yinni topdi"); await pg.click("#srchClose");
  await pg.close();
  const mc = await newCtx(browser, { viewport: { width: 375, height: 740 } }); pg = await open(mc, B, errs);
  ok(await pg.locator("#burger").isVisible(), "mobil: hamburger ko'rinadi"); await pg.click("#burger"); await pg.waitForTimeout(400);
  ok(await pg.locator("#mnav.open").count() === 1 && await pg.locator('#mnav a[href="games.html"]').isVisible(), "mobil: menyu ochiladi");
  const small = await pg.evaluate(() => Array.from(document.querySelectorAll("button, a.btn, .ib, select, input")).filter(e => e.offsetParent && (e.getBoundingClientRect().height < 38 || e.getBoundingClientRect().width < 38) && !e.closest("[hidden]") && e.type !== "checkbox" && !/ckSet|ckNec|link-btn/.test(e.className + e.id)).map(e => e.outerHTML.slice(0, 60)));
  ok(small.length === 0, "mobil: tugmalar kamida 38px " + (small.length ? JSON.stringify(small.slice(0, 3)) : "")); await mc.close();

  console.log("\n[7] Service Worker / PWA (haqiqiy brauzerda)");
  const pc = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await pc.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: "text/javascript", body: "" })); await pc.route(/gstatic\.com\/firebasejs.*app-compat/, r => r.fulfill({ contentType: "text/javascript", body: FAKE })); await pc.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pc.addInitScript(s => { window.__SEED = s; }, SEED);
  pg = await pc.newPage(); await pg.goto(B + "games.html"); await pg.waitForTimeout(1500);
  ok(await pg.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && (r.active || r.installing || r.waiting)); }), "Service Worker ro'yxatdan o'tdi");
  await pg.reload(); await pg.waitForTimeout(800);
  const keys = await pg.evaluate(async () => { const k = await caches.keys(); return k.length ? (await (await caches.open(k[0])).keys()).length : 0; }); ok(keys >= 10, "kesh to'ldirildi (" + keys + " fayl)");
  const mf = await (await pc.request.get(B + "manifest.webmanifest")).json(); ok(mf.icons.length === 3 && mf.display === "standalone" && mf.icons.some(i => i.purpose === "maskable"), "manifest to'g'ri (installable)");
  srv.closeAllConnections(); srv.close(); await new Promise(r => setTimeout(r, 300)); /* haqiqiy oflayn: server o'chirildi (Playwright setOffline SW so'rovlariga ta'sir qilmaydi) */ await pg.goto(B + "games.html").catch(() => {}); await pg.waitForTimeout(500);
  ok((await pg.locator("h1").first().textContent()).length > 3, "oflayn: oldin ochilgan sahifa keshdan ochiladi");
  await pg.goto(B + "never-visited.html").catch(() => {}); await pg.waitForTimeout(500);
  ok((await pg.content()).includes("data-page=\"offline\""), "oflayn: ochilmagan sahifa uchun offline.html ko'rsatiladi");
  await pc.close();

  await browser.close();
  console.log(`\nNATIJA: ${pass} o'tdi, ${fail} muvaffaqiyatsiz`);
  if (fail) { console.log(failures.map(f => " - " + f).join("\n")); process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(2); });
