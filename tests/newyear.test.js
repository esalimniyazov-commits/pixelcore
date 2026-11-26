// Yangi yil mavzusi: mantiq testi.  Ishga tushirish: node tests/newyear.test.js
const fs = require("fs"), path = require("path"), vm = require("vm"), root = path.join(__dirname, "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ✓", m); } else { fail++; console.log("  ✗ FAIL:", m); } };
const core = fs.readFileSync(path.join(root, "js/core.js"), "utf8");
const block = core.split("/* NY-SEASON-START */")[1].split("/* NY-SEASON-END */")[0];
const ctx = { URLSearchParams }; vm.runInNewContext(block + ";this.nyState=nyState;", ctx);
const st = ctx.nyState, cfg = { enabled: true, from: "11-26", to: "01-15" };
const D = (y, m, d) => new Date(y, m - 1, d, 12);

console.log("\n[1] nyState: mavsum oralig'i");
ok(st(D(2026, 11, 25), "", "", cfg) === "none", "25-noyabr: mavsumdan oldin — o'chiq");
ok(st(D(2026, 11, 26), "", "", cfg) === "on", "26-noyabr: boshlanish kuni yoqiq");
ok(st(D(2026, 12, 31), "", "", cfg) === "on", "31-dekabr yoqiq");
ok(st(D(2027, 1, 15), "", "", cfg) === "on", "15-yanvar: oxirgi kun yoqiq (yil almashinuvi bilan)");
ok(st(D(2027, 1, 16), "", "", cfg) === "none", "16-yanvar: tugagan");
ok(st(D(2027, 7, 1), "", "", cfg) === "none", "iyul: o'chiq");
ok(st(D(2027, 12, 5), "", "", cfg) === "on", "keyingi yil ham avtomatik takrorlanadi");

console.log("\n[2] nyState: sozlama, URL va foydalanuvchi tanlovi");
ok(st(D(2026, 12, 5), "", "off", cfg) === "off", "foydalanuvchi o'chirgan: 'off' (tugma qoladi, mavzu yuklanmaydi)");
ok(st(D(2026, 12, 5), "?ny=0", "", cfg) === "none", "?ny=0 o'chiradi");
ok(st(D(2026, 7, 5), "?ny=1", "", cfg) === "on", "?ny=1 mavsumdan tashqarida ham ko'rsatadi (sinash uchun)");
ok(st(D(2026, 12, 5), "", "", { enabled: false, from: "11-26", to: "01-15" }) === "none", "enabled:false hammasini o'chiradi");
ok(st(D(2026, 12, 5), "", "", {}) === "on", "sozlamasiz standart oraliq (1-dekabr — 15-yanvar)");
ok(st(D(2026, 11, 30), "", "", {}) === "none", "standart oraliq 30-noyabrda hali yo'q");
ok(st(D(2026, 12, 5), "?lang=ru&ny=0", "", cfg) === "none", "boshqa parametrlar bilan birga ham ishlaydi");

console.log("\n[3] newyear.js: hisoblagich");
const NYX = require("../js/newyear.js");
let p = NYX.parts(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000);
ok(p.d === 2 && p.h === 3 && p.m === 4 && p.s === 5, "parts: 2 kun 03:04:05");
ok(NYX.parts(-5000).s === 0 && NYX.parts(-5000).d === 0, "manfiy vaqt 0 ga tushadi");
ok(NYX.pad(7) === "07" && NYX.pad(12) === "12", "pad");
let t1 = NYX.target(D(2026, 11, 26));
ok(!t1.greeting && t1.year === 2027 && t1.at.getFullYear() === 2027 && t1.at.getMonth() === 0 && t1.at.getDate() === 1, "noyabrda: 2027-yil 1-yanvargacha sanaladi");
let t2 = NYX.target(D(2027, 1, 3));
ok(t2.greeting && t2.year === 2027, "yanvarda: tabrik rejimi, joriy yil");
let t3 = NYX.target(new Date(2026, 11, 31, 23, 59, 59));
ok(!t3.greeting && t3.at - new Date(2026, 11, 31, 23, 59, 59) === 1000, "31-dekabr 23:59:59 — 1 soniya qoldi");

console.log("\n[4] fayllar va ulanishlar");
const need = ["newyear.css", "js/newyear.js"];
need.forEach(f => ok(fs.existsSync(path.join(root, f)), f + " mavjud"));
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
need.forEach(f => ok(sw.includes('"' + f + '"'), "sw.js keshida: " + f));
ok(/const NEWYEAR = \{/.test(fs.readFileSync(path.join(root, "links.js"), "utf8")), "links.js: NEWYEAR sozlamasi");
const DICT = new Function(fs.readFileSync(path.join(root, "js/dict.js"), "utf8") + "; return DICT;")();
["ny.until", "ny.d", "ny.h", "ny.m", "ny.s", "ny.aria", "ny.greet", "ny.greetSub", "ny.on", "ny.off"].forEach(k =>
  ok(Array.isArray(DICT[k]) && DICT[k].length === 3 && DICT[k].every(Boolean), "lug'at (uz/ru/en): " + k));
ok(DICT["ny.greet"].every(s => s.includes("{y}")), "ny.greet har uch tilda {y} yil o'rinbosariga ega");
const css = fs.readFileSync(path.join(root, "newyear.css"), "utf8");
ok(!/https?:\/\//.test(css.replace(/xmlns='http:\/\/www\.w3\.org\/2000\/svg'/g, "")), "CSS'da tashqi manzil yo'q");
ok(css.includes("prefers-reduced-motion"), "garland SVG ichida reduced-motion qoidasi bor");
console.log("\n" + (fail ? "XATO: " + fail + " ta" : "OK") + " (" + pass + " ta tekshiruv o'tdi)"); process.exit(fail ? 1 : 0);
