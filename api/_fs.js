/* Firestore REST (server tomoni, kutubxonasiz). FIREBASE_SERVICE_ACCOUNT (JSON) faqat Vercel Environment Variables'da turadi.
   Fayl nomi "_" bilan boshlangani uchun Vercel uni alohida endpoint qilmaydi. Service account qoidalarni (firestore.rules) chetlab o'tadi,
   shuning uchun unga faqat minimal rol bering (roles/datastore.user) va alohida kalit oching. */
const crypto = require("crypto");
const PROJECT = "pixelcore-96f17";
const BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents";
const cache = { tok: "", exp: 0, key: "" };
const b64u = (x) => Buffer.from(x).toString("base64url");

function parseCreds(env) {
  try { const j = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT || ""); if (j && j.client_email && j.private_key) return j; } catch (e) {}
  return null;
}
function fromValue(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  return null;
}
function fromDoc(d) { const o = {}; Object.keys((d && d.fields) || {}).forEach((k) => { o[k] = fromValue(d.fields[k]); }); return o; }
function toValue(x) {
  if (typeof x === "boolean") return { booleanValue: x };
  if (typeof x === "number") return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (x instanceof Date) return { timestampValue: x.toISOString() };
  return { stringValue: String(x) };
}

function create(ctx) {
  const env = (ctx && ctx.env) || process.env, f = (ctx && ctx.fetch) || fetch;
  const creds = parseCreds(env);
  async function token() {
    if (!creds) throw new Error("no-credentials");
    if (cache.key === creds.client_email && cache.exp > Date.now() + 60000) return cache.tok;
    const now = Math.floor(Date.now() / 1000);
    const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const body = b64u(JSON.stringify({ iss: creds.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
    const sig = crypto.createSign("RSA-SHA256").update(head + "." + body).sign(creds.private_key).toString("base64url");
    const r = await f("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + head + "." + body + "." + sig });
    if (!r.ok) throw new Error("token-" + r.status);
    const j = await r.json();
    cache.tok = j.access_token; cache.exp = Date.now() + (j.expires_in || 3600) * 1000; cache.key = creds.client_email;
    return cache.tok;
  }
  async function api(path, init) {
    const t = await token();
    return f(BASE + path, Object.assign({}, init, { headers: Object.assign({ Authorization: "Bearer " + t, "Content-Type": "application/json" }, init && init.headers) }));
  }
  return {
    configured: !!creds,
    // hujjat yo'q -> null
    async get(col, id) {
      const r = await api("/" + col + "/" + encodeURIComponent(id), { method: "GET" });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("get-" + r.status);
      return fromDoc(await r.json());
    },
    // faqat berilgan maydonlarni yozadi/yangilaydi (updateMask), hujjat bo'lmasa yaratadi
    async patch(col, id, obj) {
      const keys = Object.keys(obj), q = keys.map((k) => "updateMask.fieldPaths=" + encodeURIComponent(k)).join("&");
      const fields = {}; keys.forEach((k) => { fields[k] = toValue(obj[k]); });
      const r = await api("/" + col + "/" + encodeURIComponent(id) + "?" + q, { method: "PATCH", body: JSON.stringify({ fields }) });
      if (!r.ok) throw new Error("patch-" + r.status);
      return true;
    },
    // Hujjatni faqat bir marta yaratadi. Firestore 409 bo'lsa, hujjat oldindan mavjud.
    async createOnce(col, id, obj) {
      const fields = {}; Object.keys(obj).forEach((k) => { fields[k] = toValue(obj[k]); });
      const r = await api("/" + col + "?documentId=" + encodeURIComponent(id), { method: "POST", body: JSON.stringify({ fields }) });
      if (r.status === 409) return false;
      if (!r.ok) throw new Error("create-" + r.status);
      return true;
    },
    // Cheklangan kolleksiya ro'yxati (admin panel/buyurtmalar).
    async list(col, limit) {
      const r = await api(":runQuery", { method: "POST", body: JSON.stringify({ structuredQuery: { from: [{ collectionId: col }], limit: limit || 50 } }) });
      if (!r.ok) throw new Error("query-" + r.status);
      return (await r.json()).filter((x) => x.document).map((x) => {
        const d = fromDoc(x.document); d._id = (x.document.name || "").split("/").pop(); return d;
      });
    },
    // obunachilar: tg_subscribers, subscribed == true
    async subscribers(limit) {
      const r = await api(":runQuery", { method: "POST", body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "tg_subscribers" }], where: { fieldFilter: { field: { fieldPath: "subscribed" }, op: "EQUAL", value: { booleanValue: true } } }, limit: limit || 500 } }) });
      if (!r.ok) throw new Error("query-" + r.status);
      return (await r.json()).filter((x) => x.document).map((x) => fromDoc(x.document)).filter((d) => d.chatId);
    },
  };
}
module.exports = { create, fromDoc, toValue };
