// Tarjimalar tekshiruvi: ishlatilgan har bir kalit lug'atda bormi, uch til ham to'liqmi.  Ishga tushirish: node tests/check-i18n.js
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "js/dict.js"), "utf8");
const DICT = new Function(src + "; return DICT;")();
const files = fs.readdirSync(root).filter(f => f.endsWith(".html")).concat(fs.readdirSync(path.join(root, "js")).filter(f => f.endsWith(".js") && f !== "dict.js").map(f => "js/" + f), ["links.js"]);
const used = new Set();
for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), "utf8");
  for (const m of s.matchAll(/data-i18n(?:-\w+)?="([^"]+)"/g)) used.add(m[1]);
  for (const m of s.matchAll(/\bt\(["']([\w.\-]+)["']/g)) used.add(m[1]);
  for (const m of s.matchAll(/["']([A-Za-z][\w]*(?:\.[\w\/\-']+)+)["']/g)) if (DICT[m[1]]) used.add(m[1]); // kod ichidagi har qanday "kalit" literali
}
// dinamik oilalar
["rel","dev","soon"].forEach(k => used.add("st." + k)); ["news","update","devlog","event"].forEach(k => used.add("cat." + k));
for (let i = 0; i < 6; i++) used.add("fact." + i);
["bug","suggestion","question","Xato","G'oya","Savol"].forEach(k => used.add("fbt." + k));
["joined","verified","fav1","fav5","rev1","rev5","cm1","rep1"].forEach(k => { used.add("ach." + k); used.add("ach." + k + ".d"); });
["home","games","news","services","about","contact","profile","admin"].forEach(p => { used.add("meta." + p + ".t"); used.add("meta." + p + ".d"); if (!["profile","admin"].includes(p)) used.add("nav." + p); });
["auth/invalid-credential","auth/email-already-in-use","auth/weak-password","auth/invalid-email","auth/too-many-requests","auth/network-request-failed","auth/requires-recent-login"].forEach(k => used.add("auth.e." + k));
["games","downloads","users","views","news","reviews","comments","bugs","feedback","contacts"].forEach(k => used.add("a.s." + k));
["dash","games","news","team","comments","reports","users","media","activity"].forEach(k => used.add("a.t." + k));
["permission-denied","unavailable","resource-exhausted","invalid-argument"].forEach(k => used.add("a.e." + k));
used.delete("v1.0.0"); // placeholder, kalit emas
const bad = [];
for (const k of used) { if (k.endsWith(".")) continue; if (!DICT[k]) bad.push("YETISHMAYDI: " + k); }
for (const [k, v] of Object.entries(DICT)) {
  if (!Array.isArray(v) || v.length !== 3 || v.some(x => !x || !String(x).trim())) bad.push("BO'SH/NOTO'G'RI: " + k);
  else if (!/^(st\.|fact\.[abc]|kit\.|a\.t\.roadmap|ach\.joined$|nav\.devlog|devlog\.h|cat\.devlog|meta\.devlog\.t|meta\.admin|auth\.e\.other)/.test(k) && v[1] === v[0] && /[a-z']{4,}/i.test(v[0]) && !/^(a\.f\.|tech\.|sw\.)/.test(k)) bad.push("RUSCHA UZBEKCHA BILAN BIR XIL: " + k);
  const ph = x => (String(x).match(/\{\w+\}/g) || []).sort().join();
  if (ph(v[0]) !== ph(v[1]) || ph(v[0]) !== ph(v[2])) bad.push("O'RINBOSAR MOS EMAS: " + k);
}
const unused = Object.keys(DICT).filter(k => !used.has(k));
console.log("ishlatilgan kalitlar:", used.size, "| lug'atdagi kalitlar:", Object.keys(DICT).length);
if (unused.length) console.log("ishlatilmagan (ogohlantirish):", unused.join(", "));
if (bad.length) { console.log(bad.join("\n")); process.exit(1); }
console.log("✓ Barcha kalitlar uch tilda mavjud");
