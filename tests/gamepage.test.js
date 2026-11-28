// O'yin sahifasi: sof mantiq testi (OS aniqlash, changelog, rang).  Ishga tushirish: node tests/gamepage.test.js
const fs = require("fs"), path = require("path"), vm = require("vm"), root = path.join(__dirname, "..");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m); } else { fail++; console.log("  ✗ FAIL:", m); } };
const src = fs.readFileSync(path.join(root, "js/pages.js"), "utf8");
const block = src.split("/* GP-PURE-START */")[1].split("/* GP-PURE-END */")[0];
const C = {}; vm.runInNewContext(block + ";this.detectOS=detectOS;this.ctaPick=ctaPick;this.parseChangelog=parseChangelog;this.accentFromData=accentFromData;this.accentFallback=accentFallback;this.accentVars=accentVars;this.hslToRgb=hslToRgb;this.relLum=relLum;", C);

console.log("\n[1] detectOS");
const UA = { and: "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120", win: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605", ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari", lin: "Mozilla/5.0 (X11; Linux x86_64) Chrome/120" };
ok(C.detectOS(UA.and, "Linux armv8l", 5) === "android", "Android");
ok(C.detectOS(UA.win, "Win32", 0) === "windows", "Windows (platform)");
ok(C.detectOS(UA.win, "Linux x86_64", 0) === "windows", "Windows (faqat UA)");
ok(C.detectOS(UA.mac, "MacIntel", 0) === "mac", "macOS");
ok(C.detectOS(UA.ios, "iPhone", 5) === "ios", "iPhone");
ok(C.detectOS("Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari", "MacIntel", 5) === "ios", "iPadOS (Mac ko'rinishida, sensorli) — iOS");
ok(C.detectOS(UA.lin, "Linux x86_64", 0) === "" && C.detectOS("", "", 0) === "" && C.detectOS(undefined, undefined, undefined) === "", "Linux/noma'lum — bo'sh");

console.log("\n[2] ctaPick");
const P = [["android", "Android"], ["windows", "Windows"], ["mac", "macOS"]];
let k = C.ctaPick(P, "windows"); ok(k.main[0] === "windows" && k.rest.length === 2 && !k.miss, "mos tizim asosiy bo'ladi");
k = C.ctaPick(P, ""); ok(k.main[0] === "android" && !k.miss, "tizim noma'lum — birinchisi, maslahat yo'q");
k = C.ctaPick([["android", "Android"]], "ios"); ok(k.main[0] === "android" && k.miss, "iOS, versiya yo'q — birinchisi + miss");
k = C.ctaPick([["android", "Android"]], "android"); ok(k.rest.length === 0 && !k.miss, "bitta platforma");

console.log("\n[3] parseChangelog");
let e = C.parseChangelog(["v1.0.1 - xato tuzatildi", "- tezlik oshdi", "v1.0.0 – birinchi reliz"]);
ok(e.length === 2 && e[0].ver === "1.0.1" && e[0].items.join("|") === "xato tuzatildi|tezlik oshdi" && e[1].ver === "1.0.0" && e[1].items[0] === "birinchi reliz", "versiyalar guruhlanadi, '-' qatori oldingisiga qo'shiladi");
e = C.parseChangelog(["2.1: yangi daraja", "3.0", "• bir", "* ikki"]); ok(e[0].ver === "2.1" && e[1].ver === "3.0" && e[1].items.join(",") === "bir,ikki", "':' ajratgich, yolg'iz versiya qatori, • va * belgilari");
e = C.parseChangelog(["Xatolar tuzatildi", "Tezroq ishlaydi"]); ok(e.length === 1 && e[0].ver === "" && e[0].items.length === 2, "versiyasiz matn — bitta yozuv, versiyasiz");
ok(C.parseChangelog([]).length === 0, "bo'sh");
e = C.parseChangelog(["v1 - noto'g'ri"]); ok(e[0].ver === "" , "'v1' (nuqtasiz) versiya hisoblanmaydi");

console.log("\n[4] rang: accentFromData");
const solid = (r, g, b, n = 1024) => { const a = new Uint8ClampedArray(n * 4); for (let i = 0; i < n; i++) a.set([r, g, b, 255], i * 4); return a; };
const hue = (r, g, b) => C.accentFromData(solid(r, g, b)).h;
ok(Math.abs(hue(240, 120, 20) - 27) <= 3, "to'q sariq → ~27° (" + hue(240, 120, 20) + ")");
ok(Math.abs(hue(30, 90, 240) - 220) <= 3, "ko'k → ~220° (" + hue(30, 90, 240) + ")");
ok(Math.abs(hue(20, 200, 170) - 170) <= 3, "zangori → ~170° (" + hue(20, 200, 170) + ")");
ok(C.accentFromData(solid(128, 128, 128)) === null && C.accentFromData(solid(5, 5, 5)) === null && C.accentFromData(solid(250, 250, 250)) === null, "kulrang/qora/oq — null (fallback)");
const trans = solid(240, 120, 20); for (let i = 3; i < trans.length; i += 4) trans[i] = 0; ok(C.accentFromData(trans) === null, "shaffof piksellar hisobga olinmaydi");
const mix = new Uint8ClampedArray(1024 * 4); for (let i = 0; i < 1024; i++) mix.set(i < 800 ? [30, 90, 240, 255] : [128, 128, 128, 255], i * 4); ok(Math.abs(C.accentFromData(mix).h - 220) <= 3, "kulrang piksellar aralashsa ham ko'k ton saqlanadi");
const wrap = new Uint8ClampedArray(1024 * 4); for (let i = 0; i < 1024; i++) wrap.set(i % 2 ? [240, 20, 60, 255] : [240, 20, 20, 255], i * 4); const wh = C.accentFromData(wrap).h; ok(wh <= 10 || wh >= 350, "0°/360° chegarasida ton to'g'ri o'rtalanadi (" + wh + ")");
const s1 = C.accentFromData(solid(240, 120, 20)).s; ok(s1 >= 0.6 && s1 <= 0.95, "to'yinganlik 0.6–0.95 oralig'ida: " + s1.toFixed(2));

console.log("\n[5] accentVars va kontrast");
const v = C.accentVars(190, 0.8); ok(["--ga", "--gam", "--gad", "--gag", "--gaa", "--gat"].every(x => v[x]) && /^hsl\(190,80%,64%\)$/.test(v["--ga"]) && /^hsla\(190,80%,58%,\.42\)$/.test(v["--gag"]), "6 ta o'zgaruvchi, to'g'ri format");
let worst = 99, worstAt = "";
for (let h = 0; h < 360; h += 5) for (const s of [0.6, 0.8, 0.95]) {
  const t = C.accentVars(h, s)["--gat"], mid = C.relLum(C.hslToRgb(h, s, 0.43)), tl = t === "#ffffff" ? 1 : 0.002, hi = Math.max(mid, tl), lo = Math.min(mid, tl), cr = (hi + 0.05) / (lo + 0.05);
  if (cr < worst) { worst = cr; worstAt = h + "°/" + s; }
}
ok(worst >= 4.4, "tugma matni kontrasti barcha ranglarda ≥ 4.4 (eng yomoni " + worst.toFixed(2) + " @ " + worstAt + ")");
ok(C.accentVars(50, 0.9)["--gat"] === "#08050f" && C.accentVars(270, 0.8)["--gat"] === "#ffffff", "sariq — to'q matn, binafsha — oq matn");

console.log("\n[6] accentFallback");
const ids = ["g1", "g2", "abc", "MindIQ", "x".repeat(40)];
ok(ids.every(i => C.accentFallback(i).h === C.accentFallback(i).h && [268, 190, 330, 38, 152, 215].includes(C.accentFallback(i).h)), "deterministik va palitradan");
ok(new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map(i => C.accentFallback(i).h)).size >= 3, "turli id'lar turli ranglarga tushadi");
ok(C.accentFallback("").h !== undefined && C.accentFallback(null).h !== undefined, "bo'sh/null id ham ishlaydi");

console.log("\n[7] ulanishlar");
const DICT = new Function(fs.readFileSync(path.join(root, "js/dict.js"), "utf8") + "; return DICT;")();
["game.dlFor", "game.noOs", "game.playVideo", "game.latest", "game.nReviews", "game.nav", "ui.prev", "ui.next"].forEach(k => ok(Array.isArray(DICT[k]) && DICT[k].length === 3 && DICT[k].every(Boolean), "lug'at: " + k));
ok(DICT["game.dlFor"].every(s => s.includes("{p}")) && DICT["game.noOs"].every(s => s.includes("{os}")) && DICT["game.nReviews"].every(s => s.includes("{n}")), "o'rinbosarlar ({p}, {os}, {n}) uch tilda ham bor");
ok(!/img[^>]*onerror|innerHTML\s*=\s*[^;]*g\.title\b(?!\))/.test(block), "sof blokda xavfli sink yo'q");
console.log("\n" + (fail ? "XATO: " + fail : "OK") + " (" + pass + " ta o'tdi)"); process.exit(fail ? 1 : 0);
