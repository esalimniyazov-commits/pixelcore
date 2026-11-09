// api/_fs.js testi: haqiqiy RSA kalit bilan JWT imzosi, Firestore REST so'rovlari (soxta fetch, internet shart emas)
const crypto = require("crypto"), fsMod = require("../api/_fs.js");
let failures = 0; const check = (c, l) => { console.log(c ? "  ✓" : "  ✗ FAIL:", l); if (!c) failures++; };
(async () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const sa = JSON.stringify({ client_email: "bot@pixelcore-96f17.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) });
  const log = []; const mk = (handlers) => async (url, init) => { log.push({ url, init }); return handlers(url, init || {}); };
  const json = (o, ok = true, status = 200) => ({ ok, status, json: async () => o });
  const f = mk((url, init) => {
    if (url.startsWith("https://oauth2.googleapis.com/token")) return json({ access_token: "ya29.test", expires_in: 3600 });
    if (url.includes("/documents/contacts/abc")) return json({ fields: { name: { stringValue: "Ali" }, n: { integerValue: "5" }, notified: { booleanValue: true }, created: { timestampValue: "2026-11-09T10:00:00Z" } } });
    if (url.includes("/documents/contacts/missing")) return json({}, false, 404);
    if (url.includes(":runQuery")) return json([{ document: { fields: { chatId: { integerValue: "11" }, subscribed: { booleanValue: true } } } }, { readTime: "x" }]);
    return json({});
  });
  const none = fsMod.create({ env: {}, fetch: f }); check(none.configured === false, "kalit bo'lmasa configured=false (hech narsa chaqirilmaydi)");
  check(fsMod.create({ env: { FIREBASE_SERVICE_ACCOUNT: "not json" }, fetch: f }).configured === false, "buzuq JSON -> configured=false");
  const fs = fsMod.create({ env: { FIREBASE_SERVICE_ACCOUNT: sa }, fetch: f }); check(fs.configured === true, "to'g'ri kalit -> configured=true");
  const d = await fs.get("contacts", "abc");
  check(d.name === "Ali" && d.n === 5 && d.notified === true && d.created === "2026-11-09T10:00:00Z", "hujjat maydonlari JS qiymatlariga o'giriladi");
  const tokReq = log[0]; const form = new URLSearchParams(tokReq.init.body); const [h, p, s] = form.get("assertion").split(".");
  check(form.get("grant_type") === "urn:ietf:params:oauth:grant-type:jwt-bearer", "OAuth: jwt-bearer grant");
  check(crypto.createVerify("RSA-SHA256").update(h + "." + p).verify(publicKey, Buffer.from(s, "base64url")), "JWT imzosi (RS256) ochiq kalit bilan tasdiqlandi");
  const claim = JSON.parse(Buffer.from(p, "base64url").toString());
  check(claim.iss === "bot@pixelcore-96f17.iam.gserviceaccount.com" && claim.scope === "https://www.googleapis.com/auth/datastore" && claim.exp - claim.iat === 3600, "JWT da'volari: iss, faqat datastore scope, 1 soat");
  check(log[1].init.headers.Authorization === "Bearer ya29.test" && log[1].url.includes("/projects/pixelcore-96f17/databases/(default)/documents/contacts/abc"), "Firestore so'rovi Bearer token bilan, to'g'ri loyiha");
  await fs.get("contacts", "abc"); check(log.filter(x => x.url.startsWith("https://oauth2")).length === 1, "token keshlanadi (qayta so'ralmaydi)");
  check((await fs.get("contacts", "missing")) === null, "hujjat yo'q (404) -> null");
  await fs.patch("tg_subscribers", "5", { chatId: 5, subscribed: true, updated: new Date("2026-11-09T00:00:00Z"), note: "x" });
  const pr = log[log.length - 1]; const body = JSON.parse(pr.init.body);
  check(pr.init.method === "PATCH" && pr.url.includes("updateMask.fieldPaths=chatId") && pr.url.includes("updateMask.fieldPaths=subscribed") && body.fields.chatId.integerValue === "5" && body.fields.subscribed.booleanValue === true && body.fields.updated.timestampValue === "2026-11-09T00:00:00.000Z" && body.fields.note.stringValue === "x", "patch: updateMask va tur o'girishlari to'g'ri");
  const subs = await fs.subscribers(10); const q = JSON.parse(log[log.length - 1].init.body).structuredQuery;
  check(subs.length === 1 && subs[0].chatId === 11 && q.from[0].collectionId === "tg_subscribers" && q.where.fieldFilter.field.fieldPath === "subscribed" && q.limit === 10, "obunachilar so'rovi: tg_subscribers, subscribed==true, limit");
  const sa2 = sa.replace("bot@pixelcore", "other@pixelcore"); // token keshi client_email bo'yicha, shuning uchun boshqa hisob
  const bad = fsMod.create({ env: { FIREBASE_SERVICE_ACCOUNT: sa2 }, fetch: mk((u) => u.startsWith("https://oauth2") ? json({}, false, 401) : json({})) });
  let err = ""; try { await bad.get("contacts", "abc"); } catch (e) { err = e.message; } check(err.startsWith("token-") && !err.includes("BEGIN"), "token xatosida kalit xabarga chiqmaydi: " + err);
  console.log(failures ? "\nFAIL" : "\nOK"); process.exit(failures ? 1 : 0);
})();
