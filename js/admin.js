"use strict";
/* PixelCore Admin 2.0 — sxema asosidagi boshqaruv paneli.
   Admin huquqi frontend ro'yxati bilan emas, Firestore qoidalari bilan tekshiriladi: panel
   faqat admin o'qiy oladigan "feedback" kolleksiyasini o'qib ko'rish orqali serverdan tasdiqlaydi. */
const FV = function () { return firebase.firestore.FieldValue; };
const STATUS_OPTS = ["Chiqarilgan", "Ishlab chiqilmoqda", "Tez orada"];
const SCH = {
  games: {
    cols: "games", title: function (d) { return d.title; }, sub: function (d) { return statusInfo(d.status).label + " · v" + (d.version || "?") + " · ↓" + (d.downloads || 0); },
    fields: [
      { n: "title", k: "text", req: 1, l: "a.f.title" }, { n: "tagline", k: "ml", l: "a.f.tagline" }, { n: "desc", k: "mlarea", req: 1, l: "a.f.desc" },
      { n: "genre", k: "text", l: "a.f.genre", ph: "Action, Puzzle" }, { n: "version", k: "text", l: "a.f.version", ph: "v1.0.0" },
      { n: "status", k: "select", opts: STATUS_OPTS, l: "a.f.status" }, { n: "releaseDate", k: "date", l: "a.f.release" }, { n: "video", k: "url", l: "a.f.video", ph: "https://youtu.be/..." },
      { n: "features", k: "mlarea", l: "a.f.features", ph: "a.f.featuresPh" },
      { n: "links.android", k: "url", box: "Android", l: "a.f.link" }, { n: "sizes.android", k: "text", box: "Android", l: "a.f.size" }, { n: "reqs.android", k: "text", box: "Android", l: "a.f.reqMin" }, { n: "reqRec.android", k: "text", box: "Android", l: "a.f.reqRec" },
      { n: "links.windows", k: "url", box: "Windows", l: "a.f.link" }, { n: "sizes.windows", k: "text", box: "Windows", l: "a.f.size" }, { n: "reqs.windows", k: "text", box: "Windows", l: "a.f.reqMin" }, { n: "reqRec.windows", k: "text", box: "Windows", l: "a.f.reqRec" },
      { n: "links.mac", k: "url", box: "macOS", l: "a.f.link" }, { n: "sizes.mac", k: "text", box: "macOS", l: "a.f.size" }, { n: "reqs.mac", k: "text", box: "macOS", l: "a.f.reqMin" }, { n: "reqRec.mac", k: "text", box: "macOS", l: "a.f.reqRec" },
      { n: "featured", k: "check", l: "a.f.featured" }, { n: "icon", k: "img", w: 192, h: 192, type: "image/png", q: 0.92, l: "a.f.icon" }, { n: "cover", k: "img", w: 960, h: 540, type: "image/jpeg", q: 0.72, l: "a.f.cover", wide: 1 },
      { n: "changelog", k: "area", l: "a.f.changelog", ph: "a.f.changelogPh" },
    ], gallery: true,
  },
  news: {
    cols: "news", order: "created", title: function (d) { return tr(d, "title"); }, sub: function (d) { return t("cat." + (d.category || "news")) + " · " + dateStr(d.created); },
    fields: [{ n: "title", k: "ml", req: 1, l: "a.f.title" }, { n: "category", k: "select", opts: CATS, tl: "cat.", l: "a.f.category" }, { n: "text", k: "mlarea", req: 1, l: "a.f.text" }, { n: "cover", k: "img", w: 960, h: 540, type: "image/jpeg", q: 0.72, l: "a.f.cover", wide: 1 }],
  },
  team: {
    cols: "team", title: function (d) { return d.name; }, sub: function (d) { return tr(d, "role"); },
    fields: [{ n: "name", k: "text", req: 1, l: "a.f.name" }, { n: "role", k: "ml", l: "a.f.role" }, { n: "bio", k: "mlarea", l: "a.f.bio" }, { n: "link", k: "url", l: "a.f.profile" }, { n: "n", k: "num", l: "a.f.order" }, { n: "avatar", k: "img", w: 192, h: 192, type: "image/jpeg", q: 0.85, l: "a.f.avatar" }],
  },
};
const ST_ = { edit: {}, cache: {}, img: {}, shots: [], removed: [] };
const fid = function (form, n) { return "f_" + form + "_" + n.replace(/\./g, "_"); };
const getPath = function (o, p) { return p.split(".").reduce(function (x, k) { return x == null ? x : x[k]; }, o); };
const setPath = function (o, p, v) { const a = p.split("."); let x = o; a.slice(0, -1).forEach(function (k) { x = x[k] = x[k] || {}; }); x[a[a.length - 1]] = v; };
function why(x) { const k = "a.e." + x.code; return DICT[k] ? t(k) : x.code || x.message; }

/* ---------- forma yasash ---------- */
function fieldHtml(form, f) {
  const lab = '<label class="lab" for="' + fid(form, f.n) + '">' + esc(t(f.l)) + (f.req ? " *" : "") + "</label>", ph = f.ph ? (DICT[f.ph] ? t(f.ph) : f.ph) : "";
  const inp = function (id, tag, extra) { return (tag === "textarea" ? '<textarea class="field" id="' + id + '" placeholder="' + esc(ph) + '" ' + extra + "></textarea>" : '<input class="field" id="' + id + '" placeholder="' + esc(ph) + '" ' + extra + ">"); };
  if (f.k === "text" || f.k === "url" || f.k === "date" || f.k === "num") return lab + inp(fid(form, f.n), "input", 'type="' + (f.k === "text" ? "text" : f.k === "num" ? "number" : f.k) + '"' + (f.req ? " required" : ""));
  if (f.k === "area") return lab + inp(fid(form, f.n), "textarea", "");
  if (f.k === "ml" || f.k === "mlarea") return ["", "_ru", "_en"].map(function (s, i) {
    return '<label class="lab" for="' + fid(form, f.n + s) + '">' + esc(t(f.l)) + " (" + ["UZ", "RU", "EN"][i] + ")" + (f.req && i === 0 ? " *" : "") + "</label>" + inp(fid(form, f.n + s), f.k === "ml" ? "input" : "textarea", f.k === "ml" ? 'type="text"' + (f.req && i === 0 ? " required" : "") : (f.req && i === 0 ? "required" : ""));
  }).join("");
  if (f.k === "select") return lab + '<select class="field" id="' + fid(form, f.n) + '">' + f.opts.map(function (o) { return '<option value="' + esc(o) + '">' + esc(f.tl ? t(f.tl + o) : o === "Chiqarilgan" || o === "Ishlab chiqilmoqda" || o === "Tez orada" ? statusInfo(o).label : o) + "</option>"; }).join("") + "</select>";
  if (f.k === "check") return '<label class="chk"><input type="checkbox" id="' + fid(form, f.n) + '"> ' + esc(t(f.l)) + "</label>";
  if (f.k === "img") return lab + '<input class="field" id="' + fid(form, f.n) + '" type="file" accept="image/*"><div class="row"><img class="prev' + (f.wide ? " cvp" : "") + '" id="' + fid(form, f.n) + '_p" alt="" hidden><button type="button" class="btn sm danger" id="' + fid(form, f.n) + '_x" hidden>' + esc(t("common.delete")) + "</button></div>";
  return "";
}
function formHtml(name) {
  const S = SCH[name]; let out = "", box = null;
  S.fields.forEach(function (f) {
    if (f.box !== box) { if (box) out += "</div>"; if (f.box) out += '<div class="pbox"><b>' + esc(f.box) + "</b>"; box = f.box || null; }
    out += fieldHtml(name, f);
  });
  if (box) out += "</div>";
  if (S.gallery) out += '<label class="lab" for="gShotFile">' + esc(t("a.f.shots")) + '</label><input class="field" id="gShotFile" type="file" accept="image/*" multiple><div class="thumbs" id="gShotPrev"></div>';
  return '<form id="form_' + name + '" class="stack" style="max-width:none">' + out + '<div class="row"><button class="btn primary sm" id="sub_' + name + '">' + esc(t("common.add")) + '</button><button type="button" class="btn sm" id="cancel_' + name + '" hidden>' + esc(t("common.cancel")) + "</button></div></form>";
}
function imgSet(name, field, v) {
  ST_.img[name + "." + field] = v || "";
  const p = $(fid(name, field) + "_p"), x = $(fid(name, field) + "_x"); if (!p) return;
  p.src = v || ""; p.hidden = !v; x.hidden = !v;
}
function fillForm(name, d) {
  SCH[name].fields.forEach(function (f) {
    if (f.k === "img") { imgSet(name, f.n, d && d[f.n]); return; }
    const set = function (id, v) { const e = $(fid(name, id)); if (!e) return; if (e.type === "checkbox") e.checked = !!v; else e.value = v == null ? "" : v; };
    if (f.k === "ml" || f.k === "mlarea") ["", "_ru", "_en"].forEach(function (s) { set(f.n + s, d && d[f.n + s]); });
    else { let v = d ? getPath(d, f.n) : ""; if (f.n === "links.android" && d && !v) v = d.link; set(f.n, v); }
  });
}
function readForm(name) {
  const o = {};
  SCH[name].fields.forEach(function (f) {
    if (f.k === "img") { o[f.n] = ST_.img[name + "." + f.n] || ""; return; }
    const get = function (id) { const e = $(fid(name, id)); return e.type === "checkbox" ? e.checked : e.type === "number" ? (e.value === "" ? 0 : +e.value) : e.value.trim(); };
    if (f.k === "ml" || f.k === "mlarea") ["", "_ru", "_en"].forEach(function (s) { o[f.n + s] = get(f.n + s); });
    else setPath(o, f.n, get(f.n));
  });
  return o;
}
function resetForm(name) {
  $("form_" + name).reset(); fillForm(name, null); ST_.edit[name] = null;
  $("sub_" + name).textContent = t("common.add"); $("cancel_" + name).hidden = true;
  if (name === "games") { ST_.shots = []; ST_.removed = []; renderShots(); }
}

/* ---------- ro'yxatlar ---------- */
let ADMIN_LOG_OK = true;
async function logAct(action, target) { try { await db.collection("activity").add({ admin: USER.email, action: action, target: String(target || "").slice(0, 120), created: FV().serverTimestamp() }); } catch (e) { ADMIN_LOG_OK = false; } }
function listHtml(rows) { return rows.length ? rows.join("") : '<p class="empty">' + esc(t("a.none")) + "</p>"; }
function filterRows(root, q) { qsa(".item", root).forEach(function (el) { el.hidden = q && el.textContent.toLowerCase().indexOf(q) < 0; }); }
async function loadCrud(name) {
  const S = SCH[name], el = $("list_" + name);
  try {
    const s = await db.collection(S.cols).get(); ST_.cache[name] = {};
    const docs = s.docs.map(function (x) { ST_.cache[name][x.id] = x.data(); return { id: x.id, d: x.data() }; }).sort(function (a, b) { return ms(b.d.created) - ms(a.d.created) || (a.d.n || 0) - (b.d.n || 0); });
    el.innerHTML = listHtml(docs.map(function (o) {
      return '<div class="item"><span><b>' + esc(S.title(o.d)) + "</b><small>" + esc(S.sub(o.d)) + '</small></span><span class="acts"><button class="btn sm" data-ed="' + name + ":" + o.id + '" type="button">' + esc(t("common.edit")) + '</button><button class="btn sm danger" data-del="' + name + ":" + o.id + '" type="button">' + esc(t("common.delete")) + "</button></span></div>";
    }));
  } catch (x) { toast(why(x), "err"); }
}
async function startEdit(name, id) {
  const d = ST_.cache[name][id]; if (!d) return;
  ST_.edit[name] = id; fillForm(name, d);
  $("sub_" + name).textContent = t("common.save"); $("cancel_" + name).hidden = false; $("form_" + name).scrollIntoView({ behavior: "smooth" });
  if (name === "games") {
    ST_.shots = []; ST_.removed = []; renderShots();
    try { const s = await db.collection("images").where("gameId", "==", id).get(); ST_.shots = s.docs.filter(function (x) { return x.data().kind !== "cover"; }).map(function (x) { return { id: x.id, n: x.data().n || 0, data: x.data().data }; }).sort(function (a, b) { return a.n - b.n; }); renderShots(); } catch (x) { toast(why(x), "err"); }
  }
}
async function removeDoc(name, id) {
  if (!confirm(t("common.confirmDel"))) return;
  try {
    if (name === "games") { const s = await db.collection("images").where("gameId", "==", id).get(), bt = db.batch(); s.forEach(function (d) { bt.delete(d.ref); }); await bt.commit(); }
    const title = ST_.cache[name] && ST_.cache[name][id] ? SCH[name].title(ST_.cache[name][id]) : id;
    await db.collection(SCH[name].cols).doc(id).delete(); logAct("delete " + name, title); toast(t("a.deleted"), "ok"); refresh(name);
  } catch (x) { toast(t("a.notDeleted") + ": " + why(x), "err"); }
}
async function submitCrud(name, e) {
  e.preventDefault();
  const editing = !!ST_.edit[name], btn = $("sub_" + name), data = readForm(name);
  if (name === "games") data.link = "";
  data.updated = FV().serverTimestamp(); btn.disabled = true; let id = ST_.edit[name];
  try {
    if (editing) await db.collection(SCH[name].cols).doc(id).update(data);
    else { data.created = FV().serverTimestamp(); if (name === "games") data.downloads = 0; id = (await db.collection(SCH[name].cols).add(data)).id; }
  } catch (x) { toast(t("a.notSaved") + ": " + why(x), "err"); btn.disabled = false; return; }
  if (name === "games") {
    try { await saveShots(id); } catch (x) { ST_.edit.games = id; btn.disabled = false; $("sub_games").textContent = t("common.save"); toast(t("a.shotsFail") + ": " + why(x), "err"); refresh(name); return; }
  }
  logAct((editing ? "update " : "create ") + name, data.title || data.name || tr(data, "title")); toast(t("a.saved"), "ok"); resetForm(name); btn.disabled = false; refresh(name);
}
function refresh(name) { loadCrud(name); if (name === "games") { loadMedia(); } loadDash(); }

/* ---------- rasmlar ---------- */
function loadImg(file) {
  return new Promise(function (res, rej) {
    const r = new FileReader();
    r.onload = function () { const i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = r.result; }; r.onerror = rej; r.readAsDataURL(file);
  });
}
async function shrink(file, w, h, type, q, crop) {
  const img = await loadImg(file), c = document.createElement("canvas"), x = c.getContext("2d");
  if (crop) { // markazdan w:h nisbatiga qirqish
    const k = Math.max(w / img.width, h / img.height), cw = w / k, ch = h / k; c.width = w; c.height = h;
    x.drawImage(img, (img.width - cw) / 2, (img.height - ch) / 2, cw, ch, 0, 0, w, h);
  } else { const k = Math.min(1, w / Math.max(img.width, img.height)); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); }
  return c.toDataURL(type, q);
}
function renderShots() { put("gShotPrev", ST_.shots.map(function (s, i) { return '<span class="thumb"><img src="' + esc(safeUrl(s.data)) + '" alt=""><button type="button" data-rm="' + i + '" aria-label="' + esc(t("common.delete")) + '">×</button></span>'; }).join("")); }
async function saveShots(id) {
  if (!ST_.shots.length && !ST_.removed.length) return;
  const bt = db.batch(), col = db.collection("images");
  ST_.removed.forEach(function (r) { bt.delete(col.doc(r)); });
  ST_.shots.forEach(function (s, i) { if (s.id) bt.update(col.doc(s.id), { n: i }); else bt.set(col.doc(), { gameId: id, n: i, data: s.data, kind: "shot" }); });
  await bt.commit();
}

/* ---------- boshqa bo'limlar ---------- */
async function simpleList(col, el, row, opts) {
  opts = opts || {};
  try {
    const s = await db.collection(col).get(), docs = s.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }).sort(function (a, b) { return ms(b.created) - ms(a.created); });
    ST_.cache[col] = docs; put(el, listHtml(docs.map(row))); applyFilters(col);
  } catch (x) { put(el, '<p class="err">' + esc(why(x)) + "</p>"); }
}
function applyFilters(col) {
  const q = ($("q_" + col) || {}).value, ty = ($("t_" + col) || {}).value, root = $("list_" + col);
  if (!root) return;
  const rows = qsa(".item", root), docs = ST_.cache[col] || [];
  rows.forEach(function (el, i) { const d = docs[i]; el.hidden = !!((q && el.textContent.toLowerCase().indexOf(q.toLowerCase()) < 0) || (ty && d && (d.type || d.targetType || "") !== ty)); });
}
const delBtn = function (col, id) { return '<button class="btn sm danger" data-del="' + col + ":" + id + '" type="button">' + esc(t("common.delete")) + "</button>"; };
function loadReports() {
  simpleList("feedback", "list_feedback", function (d) { return '<div class="item"><span><b>[' + esc(DICT["fbt." + d.type] ? t("fbt." + d.type) : d.type) + "]</b> " + esc(d.email) + (d.gameId ? " · " + esc(d.gameId) : "") + "<small>" + esc(dateStr(d.created)) + "</small>" + esc(d.text) + '</span><span class="acts">' + delBtn("feedback", d.id) + "</span></div>"; });
  simpleList("contacts", "list_contacts", function (d) { return '<div class="item"><span><b>' + esc(d.name) + "</b> · " + esc(d.email) + "<small>" + esc(dateStr(d.created)) + " · " + esc(d.lang || "") + "</small>" + esc(d.message) + '</span><span class="acts">' + delBtn("contacts", d.id) + "</span></div>"; });
}
function loadComments() {
  simpleList("reviews", "list_reviews", function (d) { return '<div class="item"><span><b>' + esc(d.name) + "</b> · " + d.stars + "★ · " + esc(d.gameId) + "<small>" + esc(dateStr(d.created)) + "</small>" + esc(d.text) + '</span><span class="acts">' + delBtn("reviews", d.id) + "</span></div>"; });
  simpleList("comments", "list_comments", function (d) { return '<div class="item"><span><b>' + esc(d.name) + "</b> · " + esc(d.targetType) + ":" + esc(d.targetId) + "<small>" + esc(dateStr(d.created)) + "</small>" + esc(d.text) + '</span><span class="acts">' + delBtn("comments", d.id) + "</span></div>"; });
}
function loadUsers() {
  simpleList("users", "list_users", function (d) {
    return '<div class="item"><span><b>' + esc(d.username || "—") + "</b> · " + esc(d.email) + "<small>" + esc(dateStr(d.created)) + (d.banned ? " · ⛔ " + esc(t("a.banned")) : "") + '</small></span><span class="acts"><button class="btn sm" data-ban="' + d.id + '" data-v="' + (d.banned ? 0 : 1) + '" type="button">' + esc(t(d.banned ? "a.unban" : "a.ban")) + "</button>" + delBtn("users", d.id) + "</span></div>";
  });
}
async function loadMedia() {
  try {
    const r = await Promise.all([db.collection("images").get(), db.collection("games").get()]), names = {};
    r[1].forEach(function (g) { names[g.id] = g.data().title; });
    put("list_media", r[0].docs.length ? '<div class="mgrid">' + r[0].docs.map(function (d) { const x = d.data(); return "<figure><img loading=\"lazy\" src=\"" + esc(safeUrl(x.data)) + '" alt=""><figcaption><span>' + esc(names[x.gameId] || t("a.orphan")) + "</span>" + delBtn("images", d.id) + "</figcaption></figure>"; }).join("") + "</div>" : '<p class="empty">' + esc(t("a.none")) + "</p>");
  } catch (x) { put("list_media", '<p class="err">' + esc(why(x)) + "</p>"); }
}
async function loadActivity() {
  simpleList("activity", "list_activity", function (d) { return '<div class="item"><span><b>' + esc(d.action) + "</b> · " + esc(d.target) + "<small>" + esc(d.admin) + " · " + esc(dateStr(d.created)) + "</small></span></div>"; });
}
async function loadDash() {
  try {
    const cols = ["games", "news", "users", "reviews", "comments", "feedback", "contacts"];
    const r = await Promise.all(cols.map(function (c) { return db.collection(c).get(); })), sz = {}; cols.forEach(function (c, i) { sz[c] = r[i]; });
    const site = await db.collection("stats").doc("site").get().catch(function () { return null; });
    let dl = 0; const gl = sz.games.docs.map(function (d) { dl += d.data().downloads || 0; return d.data(); }).sort(function (a, b) { return (b.downloads || 0) - (a.downloads || 0); });
    const bugs = sz.feedback.docs.filter(function (d) { return d.data().type === "bug" || d.data().type === "Xato"; }).length;
    const items = [["a.s.games", sz.games.size], ["a.s.downloads", dl], ["a.s.users", sz.users.size], ["a.s.views", site && site.exists ? site.data().views || 0 : 0], ["a.s.news", sz.news.size], ["a.s.reviews", sz.reviews.size], ["a.s.comments", sz.comments.size], ["a.s.bugs", bugs], ["a.s.feedback", sz.feedback.size], ["a.s.contacts", sz.contacts.size]];
    put("stats", items.map(function (i) { return '<div class="stat"><b>' + i[1].toLocaleString() + "</b><span>" + esc(t(i[0])) + "</span></div>"; }).join(""));
    put("topGames", listHtml(gl.slice(0, 5).map(function (g) { return '<div class="item"><span>' + esc(g.title) + "</span><b>↓ " + (g.downloads || 0) + "</b></div>"; })));
  } catch (x) { toast(why(x), "err"); }
}

/* ---------- ishga tushirish ---------- */
function mountPanel() {
  const tabs = [["dash", "a.t.dash"], ["games", "a.t.games"], ["news", "a.t.news"], ["team", "a.t.team"], ["comments", "a.t.comments"], ["reports", "a.t.reports"], ["users", "a.t.users"], ["media", "a.t.media"], ["activity", "a.t.activity"]];
  const crud = function (n) { return '<section class="panel"><h2>' + esc(t("a.new")) + "</h2>" + formHtml(n) + '</section><section class="panel" style="margin-top:16px"><h2>' + esc(t("a.list")) + '</h2><input class="field" id="sq_' + n + '" type="search" placeholder="' + esc(t("a.search")) + '" style="margin-bottom:12px"><div id="list_' + n + '"></div></section>'; };
  const filt = function (c, types) { return '<div class="afilters"><input class="field" id="q_' + c + '" type="search" placeholder="' + esc(t("a.search")) + '">' + (types ? '<select class="field" id="t_' + c + '"><option value="">' + esc(t("common.all")) + "</option>" + types.map(function (x) { return '<option value="' + x + '">' + esc(DICT["fbt." + x] ? t("fbt." + x) : x) + "</option>"; }).join("") + "</select>" : "") + '</div><div id="list_' + c + '"></div>'; };
  $("panel").innerHTML = '<div class="adm"><div class="tabs" role="tablist">' + tabs.map(function (x, i) { return '<button type="button" role="tab" data-tab="' + x[0] + '" class="' + (i ? "" : "on") + '">' + esc(t(x[1])) + "</button>"; }).join("") + "</div><div>" +
    '<div class="apanel on" id="p_dash"><div class="stats" id="stats" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))"></div><p class="muted" style="font-size:14px">' + esc(t("a.viewsNote")) + '</p><h3 style="margin:22px 0 10px">' + esc(t("a.top")) + '</h3><div id="topGames"></div></div>' +
    '<div class="apanel" id="p_games">' + crud("games") + '<section class="panel" style="margin-top:16px"><h2>' + esc(t("a.t.media")) + '</h2><div id="list_media"></div></section></div><div class="apanel" id="p_news">' + crud("news") + '</div><div class="apanel" id="p_team">' + crud("team") + "</div>" +
    '<div class="apanel" id="p_comments"><h3>' + esc(t("a.reviews")) + "</h3>" + filt("reviews") + '<h3 style="margin-top:24px">' + esc(t("a.comments")) + "</h3>" + filt("comments", ["news", "game"]) + "</div>" +
    '<div class="apanel" id="p_reports"><h3>' + esc(t("a.feedback")) + "</h3>" + filt("feedback", ["bug", "suggestion", "question"]) + '<h3 style="margin-top:24px">' + esc(t("a.contacts")) + "</h3>" + filt("contacts") + "</div>" +
    '<div class="apanel" id="p_users"><p class="muted">' + esc(t("a.usersNote")) + "</p>" + filt("users") + '</div><div class="apanel" id="p_media"><div id="list_media2"></div></div><div class="apanel" id="p_activity">' + filt("activity") + "</div></div></div>";
  // media paneli o'yinlar bo'limidagi ro'yxatni ko'rsatadi
  $("p_media").innerHTML = '<section class="panel"><h2>' + esc(t("a.t.media")) + '</h2><p class="muted">' + esc(t("a.mediaNote")) + '</p><div id="list_media_big"></div></section>';
  qsa(".tabs button").forEach(function (b) { b.addEventListener("click", function () { qsa(".tabs button").forEach(function (x) { x.classList.toggle("on", x === b); }); qsa(".apanel").forEach(function (p) { p.classList.toggle("on", p.id === "p_" + b.dataset.tab); }); const tb = b.dataset.tab; if (tb === "media") { loadMedia().then(function () { $("list_media_big").innerHTML = $("list_media").innerHTML; }); } else if (tb === "activity") loadActivity(); else if (tb === "reports") loadReports(); else if (tb === "comments") loadComments(); else if (tb === "users") loadUsers(); else if (tb === "dash") loadDash(); }); });
  ["games", "news", "team"].forEach(function (n) {
    $("form_" + n).addEventListener("submit", function (e) { submitCrud(n, e); }); $("cancel_" + n).addEventListener("click", function () { resetForm(n); });
    $("sq_" + n).addEventListener("input", function () { filterRows($("list_" + n), this.value.toLowerCase()); });
    fillForm(n, null);
    SCH[n].fields.filter(function (f) { return f.k === "img"; }).forEach(function (f) {
      $(fid(n, f.n)).addEventListener("change", async function (e) { const file = e.target.files[0]; e.target.value = ""; if (!file) return; try { imgSet(n, f.n, await shrink(file, f.w, f.h, f.type, f.q, true)); } catch (x) { toast(t("a.imgFail"), "err"); } });
      $(fid(n, f.n) + "_x").addEventListener("click", function () { imgSet(n, f.n, ""); });
    });
  });
  $("gShotFile").addEventListener("change", async function (e) {
    const files = Array.from(e.target.files); e.target.value = "";
    for (const f of files) {
      if (ST_.shots.length >= 8) { toast(t("a.max8"), "err"); break; }
      try { let d = await shrink(f, 1000, 0, "image/jpeg", 0.72, false); if (d.length > 600000) d = await shrink(f, 800, 0, "image/jpeg", 0.6, false); ST_.shots.push({ data: d }); } catch (x) { toast(t("a.imgFail") + ": " + f.name, "err"); }
    }
    renderShots();
  });
  ["reviews", "comments", "feedback", "contacts", "users", "activity"].forEach(function (c) {
    const q = $("q_" + c), ty = $("t_" + c); if (q) q.addEventListener("input", function () { applyFilters(c); }); if (ty) ty.addEventListener("change", function () { applyFilters(c); });
  });
  document.addEventListener("click", async function (e) {
    const rm = e.target.closest("[data-rm]"); if (rm) { const i = +rm.dataset.rm; if (ST_.shots[i] && ST_.shots[i].id) ST_.removed.push(ST_.shots[i].id); ST_.shots.splice(i, 1); renderShots(); return; }
    const ed = e.target.closest("[data-ed]"); if (ed) { const p = ed.dataset.ed.split(":"); startEdit(p[0], p[1]); return; }
    const dl = e.target.closest("[data-del]");
    if (dl) {
      const p = dl.dataset.del.split(":");
      if (SCH[p[0]]) return removeDoc(p[0], p[1]);
      if (!confirm(t("common.confirmDel"))) return;
      try { await db.collection(p[0]).doc(p[1]).delete(); logAct("delete " + p[0], p[1]); toast(t("a.deleted"), "ok"); ({ feedback: loadReports, contacts: loadReports, reviews: loadComments, comments: loadComments, users: loadUsers, images: function () { loadMedia().then(function () { $("list_media_big").innerHTML = $("list_media").innerHTML; }); } })[p[0]](); loadDash(); } catch (x) { toast(why(x), "err"); }
      return;
    }
    const bn = e.target.closest("[data-ban]");
    if (bn) { try { await db.collection("users").doc(bn.dataset.ban).update({ banned: bn.dataset.v === "1" ? true : FV().delete() }); logAct((bn.dataset.v === "1" ? "ban " : "unban ") + "user", bn.dataset.ban); loadUsers(); } catch (x) { toast(why(x), "err"); } }
  });
  ["games", "news", "team"].forEach(loadCrud); loadDash(); loadReports(); loadComments(); loadUsers(); loadMedia(); loadActivity();
}
PAGES.admin = function () {
  const gate = $("gate");
  if (!auth || !db) { gate.textContent = t("auth.nofb"); return; }
  onUser(async function (u) {
    $("panel").hidden = true; gate.hidden = false;
    if (!u) { gate.innerHTML = esc(t("a.login")) + ' <button class="btn sm primary" id="gl" type="button">' + esc(t("auth.login")) + "</button>"; $("gl").onclick = openAuth; return; }
    try { await u.reload(); await u.getIdToken(true); } catch (e) {}
    if (!u.emailVerified) { gate.textContent = t("a.verify"); return; }
    try { await db.collection("feedback").limit(1).get(); }   // faqat admin o'qiy oladi (firestore.rules)
    catch (x) { gate.textContent = x.code === "permission-denied" ? t("a.notAdmin") : t("common.loadfail") + ": " + (x.code || x.message); return; }
    gate.hidden = true; $("panel").hidden = false; if (!$("p_dash")) mountPanel();
  });
};
