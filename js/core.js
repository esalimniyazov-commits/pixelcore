"use strict";
/* PixelCore Studio 2.0 — umumiy yadro: layout, auth, qidiruv, cookie, PWA */
const $ = function (id) { return document.getElementById(id); };
const qs = function (s, r) { return (r || document).querySelector(s); };
const qsa = function (s, r) { return Array.from((r || document).querySelectorAll(s)); };
const PAGE = document.body.dataset.page || "";
const SITE = "https://pixelcore-delta.vercel.app";
const PLAT = [["android", "Android"], ["windows", "Windows"], ["mac", "macOS"]];
const ST = { "Chiqarilgan": "rel", "Released": "rel", "Ishlab chiqilmoqda": "dev", "In Development": "dev", "Tez orada": "soon", "Coming Soon": "soon" };

/* ---------- yordamchilar ---------- */
function tr(o, f) { return (o && (o[f + "_" + LANG] || o[f])) || ""; }
function tx(s) { return typeof DICT !== "undefined" && DICT[s] ? t(s) : s; }
function statusInfo(s) { const k = ST[s] || "rel"; return { k: k, cls: "s-" + k, label: t("st." + k) }; }
function gameLinks(g) { const l = g.links || {}; return { android: l.android || g.link || "", windows: l.windows || "", mac: l.mac || "" }; }
function gamePlats(g) { const L = gameLinks(g); return PLAT.filter(function (p) { return L[p[0]]; }); }
function ms(x) { return x && x.toMillis ? x.toMillis() : 0; }
const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
function dateStr(ts) {
  const d = ts && ts.toDate ? ts.toDate() : null;
  if (!d) return "";
  if (LANG === "uz") return d.getDate() + " " + UZ_MONTHS[d.getMonth()] + " " + d.getFullYear(); // brauzer uz-UZ formatlari barqaror emas
  return d.toLocaleDateString(LANG === "ru" ? "ru-RU" : "en-GB", { year: "numeric", month: "short", day: "numeric" });
}
function debounce(f, w) { let h; return function () { const a = arguments; clearTimeout(h); h = setTimeout(function () { f.apply(null, a); }, w); }; }
function toast(msg, type, action) {
  const old = $("toast"); if (old) old.remove();
  const el = document.createElement("div"); el.id = "toast"; el.className = "toast " + (type || ""); el.setAttribute("role", "status");
  el.textContent = msg;
  if (action) { const b = document.createElement("button"); b.className = "btn sm primary"; b.textContent = action.label; b.onclick = action.fn; el.appendChild(b); }
  document.body.appendChild(el);
  if (!action) setTimeout(function () { el.remove(); }, type === "err" ? 7000 : 3800);
}
function initials(s) { return esc(String(s || "?").trim().slice(0, 2).toUpperCase()); }
function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function avatarSvg(seed, cls) {
  let x = hash("pc" + seed) || 1;
  const rnd = function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  const hue = 255 + Math.floor(rnd() * 75), c = "hsl(" + hue + " 85% 66%)";
  let r = "";
  for (let y = 0; y < 5; y++) for (let i = 0; i < 3; i++) if (rnd() > 0.45) {
    r += '<rect x="' + i + '" y="' + y + '" width="1" height="1" fill="' + c + '"/>';
    if (i < 2) r += '<rect x="' + (4 - i) + '" y="' + y + '" width="1" height="1" fill="' + c + '"/>';
  }
  return '<svg class="' + (cls || "") + '" viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true"><rect width="5" height="5" fill="#160d28"/>' + r + "</svg>";
}
function bindLinks(root) { qsa("[data-link]", root).forEach(function (a) { a.href = LINKS[a.dataset.link] || "#"; }); }
function setMeta(title, desc) {
  document.title = title;
  const set = function (sel, v) { const m = qs(sel); if (m && v) m.setAttribute("content", v); };
  set('meta[name="description"]', desc); set('meta[property="og:title"]', title); set('meta[property="og:description"]', desc);
  set('meta[name="twitter:title"]', title); set('meta[name="twitter:description"]', desc);
}
function setCanonical(path) { const l = qs('link[rel="canonical"]'); if (l) l.href = SITE + path; const o = qs('meta[property="og:url"]'); if (o) o.content = SITE + path; }

/* ---------- Firestore ma'lumotlari (xotirada saqlanadi) ---------- */
const _memo = {};
function memo(k, fn) { return _memo[k] || (_memo[k] = fn().catch(function (e) { delete _memo[k]; console.warn(k, e.code || e); return []; })); }
function getGames() {
  return memo("games", function () {
    if (!db) return Promise.resolve([]);
    return db.collection("games").get().then(function (s) { return s.docs.map(function (d) { return { id: d.id, g: d.data() }; }); });
  });
}
function getNews() {
  return memo("news", function () {
    if (!db) return Promise.resolve([]);
    return db.collection("news").orderBy("created", "desc").limit(60).get().then(function (s) { return s.docs.map(function (d) { return { id: d.id, n: d.data() }; }); });
  });
}
/* ---------- Layout ---------- */
const NAV = [["home", "index.html"], ["games", "games.html"], ["news", "news.html"], ["services", "services.html"], ["about", "about.html"], ["contact", "contact.html"]];
const ICON_SEARCH = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const ICON_MENU = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--m1)"/><stop offset="1" style="stop-color:var(--m2)"/></linearGradient></defs><symbol id="logo" viewBox="0 0 555 555"><path fill="url(#g)" fill-rule="evenodd" d="M0 0H262V272H0Z M83 83H248V157H150V255H83Z M295 0H555V272H295Z M472 83H307V157H405V255H472Z M0 297H262V555H0Z M83 472H248V398H150V300H83Z M295 297H555V555H295Z M472 472H307V398H405V300H472Z"/><circle cx="278" cy="279" r="65" style="fill:var(--dot)"/></symbol></svg><canvas id="bgc" aria-hidden="true"></canvas>';

function buildLayout() {
  document.body.insertAdjacentHTML("afterbegin", DEFS);
  const h = $("site-header");
  if (h) h.innerHTML = '<header class="nav" id="nav"><div class="wrap"><a class="brand" href="index.html"><svg><use href="#logo"/></svg><span>PixelCore</span></a>' +
    '<nav id="mnav" aria-label="' + esc(t("nav.main")) + '">' + NAV.map(function (n) {
      return '<a href="' + n[1] + '"' + (n[0] === PAGE ? ' class="on" aria-current="page"' : "") + ">" + esc(t("nav." + n[0])) + "</a>";
    }).join("") + '</nav><div class="tools">' +
    '<button class="ib" id="srchBtn" type="button" aria-label="' + esc(t("search.open")) + '">' + ICON_SEARCH + "</button>" +
    '<select class="ib" id="lang" aria-label="' + esc(t("lang.label")) + '"><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select>' +
    '<button class="pill" id="acct" type="button"></button>' +
    '<button class="ib burger" id="burger" type="button" aria-expanded="false" aria-controls="mnav" aria-label="' + esc(t("nav.menu")) + '">' + ICON_MENU + "</button></div></div></header>";
  const f = $("site-footer");
  if (f) f.innerHTML = '<footer><div class="wrap"><div class="fgrid"><div><a class="brand" href="index.html"><svg><use href="#logo"/></svg><span>PixelCore Studio</span></a><p>' + esc(t("foot.tag")) + "</p></div>" +
    "<div><h4>" + esc(t("foot.explore")) + '</h4><a href="games.html">' + esc(t("nav.games")) + '</a><a href="news.html">' + esc(t("nav.news")) + '</a><a href="services.html">' + esc(t("nav.services")) + "</a></div>" +
    "<div><h4>" + esc(t("foot.studio")) + '</h4><a href="about.html">' + esc(t("nav.about")) + '</a><a href="about.html#team">' + esc(t("about.team")) + '</a><a href="about.html#tech">' + esc(t("about.tech")) + '</a><a href="contact.html">' + esc(t("nav.contact")) + "</a></div>" +
    "<div><h4>" + esc(t("foot.follow")) + '</h4><a data-link="telegram" target="_blank" rel="noopener">Telegram</a><a data-link="instagram" target="_blank" rel="noopener">Instagram</a><a data-link="support" target="_blank" rel="noopener">' + esc(t("contact.support")) + "</a></div></div>" +
    '<div class="fbot"><span>© ' + new Date().getFullYear() + ' PixelCore Studio</span><span><a href="privacy.html">' + esc(t("foot.privacy")) + '</a> · <button class="link-btn" id="ckOpen" type="button">' + esc(t("cookie.prefs")) + '</button> · <button class="link-btn" id="installBtn" type="button" hidden>' + esc(t("pwa.install")) + "</button></span></div></div></footer>";
  document.body.insertAdjacentHTML("beforeend",
    '<dialog id="authDlg" aria-labelledby="authT"><h2 id="authT" class="sr-only" hidden></h2><div id="guest"><div class="seg" role="tablist"><button type="button" data-mode="login" class="on">' + esc(t("auth.login")) + '</button><button type="button" data-mode="register">' + esc(t("auth.register")) + "</button></div>" +
    '<form id="authForm" novalidate><input class="field" id="aUser" placeholder="' + esc(t("auth.username")) + '" maxlength="20" autocomplete="username" hidden><input class="field" id="email" type="email" placeholder="Email" required autocomplete="email"><input class="field" id="pass" type="password" placeholder="' + esc(t("auth.pass")) + '" minlength="6" autocomplete="current-password"><p class="err" id="authErr" role="alert"></p><button class="btn primary" id="authSubmit" style="width:100%">' + esc(t("auth.login")) + '</button><button class="link-btn" type="button" id="forgot">' + esc(t("auth.forgot")) + "</button></form></div>" +
    '<div id="member" hidden><div class="row" style="margin-bottom:14px"><span id="mAv"></span><div><b id="who"></b><br><small class="muted" id="whoMail"></small></div></div><div class="row"><a class="btn sm primary" href="profile.html">' + esc(t("auth.profile")) + '</a><a class="btn sm" id="adminLink" href="admin.html" hidden>' + esc(t("auth.admin")) + '</a><button class="btn sm" id="logout" type="button">' + esc(t("auth.logout")) + "</button></div></div>" +
    '<button class="btn sm" id="closeDlg" type="button" style="margin-top:16px;width:100%">' + esc(t("common.close")) + "</button></dialog>" +
    '<dialog id="srchDlg" class="wide" aria-label="' + esc(t("search.open")) + '"><input class="field" id="srchIn" type="search" placeholder="' + esc(t("search.ph")) + '" autocomplete="off"><div id="srchRes"></div><button class="btn sm" id="srchClose" type="button" style="margin-top:14px;width:100%">' + esc(t("common.close")) + "</button></dialog>" +
    '<dialog id="ckDlg"><h2 style="font-size:22px;margin-bottom:6px">' + esc(t("cookie.title")) + '</h2><p class="muted" style="margin-top:0">' + esc(t("cookie.intro")) + '</p><div class="sw"><div><b>' + esc(t("cookie.nec")) + "</b><small>" + esc(t("cookie.necd")) + '</small></div><input type="checkbox" checked disabled aria-label="' + esc(t("cookie.nec")) + '"></div><div class="sw"><div><b>' + esc(t("cookie.stat")) + "</b><small>" + esc(t("cookie.statd")) + '</small></div><input type="checkbox" id="ckStat" aria-label="' + esc(t("cookie.stat")) + '"></div><div class="row" style="margin-top:16px"><button class="btn primary sm" id="ckSave" type="button">' + esc(t("cookie.save")) + '</button><button class="btn sm" id="ckX" type="button">' + esc(t("common.close")) + "</button></div></dialog>");
  const l = $("lang"); l.value = LANG;
  l.addEventListener("change", function () {
    try { localStorage.setItem("lang", l.value); } catch (e) {}
    const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.toString();
  });
  addEventListener("scroll", function () { $("nav").classList.toggle("solid", scrollY > 10); }, { passive: true });
  $("nav").classList.toggle("solid", scrollY > 10);
  $("burger").addEventListener("click", function () { const o = $("mnav").classList.toggle("open"); $("burger").setAttribute("aria-expanded", o); });
  bindLinks(document);
}

/* ---------- Auth ---------- */
let USER = null, PROFILE = null, authReady = false, mode = "login";
const userCbs = [];
function onUser(cb) { userCbs.push(cb); if (authReady) cb(USER); }
function myName() { return (PROFILE && PROFILE.username) || (USER ? (USER.displayName || USER.email.split("@")[0]).replace(/[^\w.\- ]/g, "").slice(0, 20) || "user" : ""); }
function myAvatar() { return (PROFILE && PROFILE.avatar) || (USER ? String(hash(USER.uid) % 12) : "0"); }
function renderAcct() {
  const b = $("acct"); if (!b) return;
  b.innerHTML = USER ? avatarSvg(myAvatar(), "av") + "<span>" + esc(myName()) + "</span>" : "<span>" + esc(t("auth.login")) + "</span>";
  if (USER) { $("who").textContent = myName(); $("whoMail").textContent = USER.email; $("mAv").innerHTML = avatarSvg(myAvatar(), "av"); $("mAv").firstChild.style.cssText = "width:48px;height:48px;border-radius:12px"; }
  $("guest").hidden = !!USER; $("member").hidden = !USER;
  $("adminLink").hidden = !(USER && ADMIN_EMAILS.indexOf(USER.email) >= 0);
}
function openAuth() { if (!$("authDlg").open) $("authDlg").showModal(); }
function requireLogin() { if (USER) return true; toast(t("auth.need"), "err"); openAuth(); return false; }
function authMsg(c) { const k = "auth.e." + c; return DICT[k] ? t(k) : t("auth.e.other") + " (" + c + ")"; }
function setMode(m) {
  mode = m;
  qsa("#authDlg .seg button").forEach(function (x) { x.classList.toggle("on", x.dataset.mode === m); });
  $("aUser").hidden = m !== "register"; $("pass").hidden = m === "reset"; $("forgot").hidden = m === "reset";
  $("pass").autocomplete = m === "login" ? "current-password" : "new-password";
  $("authSubmit").textContent = t(m === "login" ? "auth.login" : m === "register" ? "auth.register" : "auth.reset");
  $("authErr").textContent = "";
}
async function loadProfile(u) {
  if (!db) return;
  try {
    const ref = db.collection("users").doc(u.uid), d = await ref.get();
    if (d.exists) PROFILE = d.data();
    else { PROFILE = { email: u.email, avatar: String(hash(u.uid) % 12), favs: favs.slice(0, 200), created: firebase.firestore.FieldValue.serverTimestamp() }; await ref.set(PROFILE, { merge: true }); }
    const merged = Array.from(new Set(favs.concat(PROFILE.favs || []))).slice(0, 200);
    if (merged.length !== (PROFILE.favs || []).length) { favs = merged; saveFavs(); } else favs = merged;
    try { localStorage.setItem("favs", JSON.stringify(favs)); } catch (e) {}
  } catch (e) { console.warn("profile", e.code || e); }
}
function initAuth() {
  $("acct").addEventListener("click", openAuth);
  $("closeDlg").addEventListener("click", function () { $("authDlg").close(); });
  qsa("#authDlg .seg button").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.mode); }); });
  $("forgot").addEventListener("click", function () { setMode("reset"); });
  $("authForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const err = $("authErr"), email = $("email").value.trim(), pass = $("pass").value; err.textContent = "";
    if (!auth) { err.textContent = t("auth.nofb"); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = authMsg("auth/invalid-email"); return; }
    $("authSubmit").disabled = true;
    try {
      if (mode === "reset") { await auth.sendPasswordResetEmail(email); err.className = "err ok"; err.textContent = t("auth.resetSent"); $("authSubmit").disabled = false; return; }
      if (pass.length < 6) { err.textContent = authMsg("auth/weak-password"); $("authSubmit").disabled = false; return; }
      if (mode === "login") await auth.signInWithEmailAndPassword(email, pass);
      else {
        const un = $("aUser").value.trim();
        if (!/^[\w.\- ]{3,20}$/.test(un)) { err.textContent = t("auth.e.username"); $("authSubmit").disabled = false; return; }
        const c = await auth.createUserWithEmailAndPassword(email, pass);
        await c.user.updateProfile({ displayName: un });
        try { const base = { email: email, username: un, avatar: String(hash(c.user.uid) % 12), favs: favs.slice(0, 200), created: firebase.firestore.FieldValue.serverTimestamp() };
          await db.collection("users").doc(c.user.uid).set(base, { merge: true }); PROFILE = Object.assign(PROFILE || {}, { username: un }); renderAcct(); } catch (x) { console.warn(x); }
        c.user.sendEmailVerification().catch(function () {});
        toast(t("auth.verifySent"), "ok");
      }
      $("authForm").reset(); err.className = "err"; $("authDlg").close();
    } catch (ex) { err.className = "err"; err.textContent = authMsg(ex.code || ""); }
    $("authSubmit").disabled = false;
  });
  $("logout").addEventListener("click", function () { auth.signOut(); $("authDlg").close(); if (PAGE === "profile" || PAGE === "admin") location.href = "index.html"; });
  if (!auth) { authReady = true; renderAcct(); return; }
  auth.onAuthStateChanged(async function (u) {
    USER = u; PROFILE = null;
    if (u) await loadProfile(u);
    authReady = true; renderAcct(); paintFavs();
    userCbs.slice().forEach(function (cb) { cb(u); });
  });
}

/* ---------- Sevimlilar va yuklashlar ---------- */
let favs = [];
try { favs = JSON.parse(localStorage.getItem("favs") || "[]"); } catch (e) {}
function saveFavs() {
  try { localStorage.setItem("favs", JSON.stringify(favs)); } catch (e) {}
  if (db && USER) db.collection("users").doc(USER.uid).set({ favs: favs.slice(0, 200) }, { merge: true }).catch(function () {});
}
function paintFavs() {
  qsa(".fav").forEach(function (b) { const on = favs.indexOf(b.dataset.id) >= 0; b.textContent = on ? "♥" : "♡"; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", t("fav.label")); });
}
document.addEventListener("click", function (e) {
  const b = e.target.closest(".fav");
  if (b) {
    const id = b.dataset.id;
    favs = favs.indexOf(id) >= 0 ? favs.filter(function (x) { return x !== id; }) : favs.concat(id);
    saveFavs(); paintFavs(); document.dispatchEvent(new CustomEvent("favs-changed")); return;
  }
  const a = e.target.closest(".dl");
  if (a && db) {
    const k = "dl_" + a.dataset.id;
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); } catch (x) {}
    db.collection("games").doc(a.dataset.id).update({ downloads: firebase.firestore.FieldValue.increment(1) }).catch(function () {});
  }
});

/* ---------- Qidiruv ---------- */
function initSearch() {
  const dlg = $("srchDlg"), inp = $("srchIn"), res = $("srchRes");
  async function run() {
    const q = inp.value.trim().toLowerCase();
    if (q.length < 2) { res.innerHTML = '<p class="muted">' + esc(t("search.hint")) + "</p>"; return; }
    const r = await Promise.all([getGames(), getNews()]), out = [];
    r[0].forEach(function (o) {
      if ((o.g.title + " " + tr(o.g, "desc") + " " + (o.g.genre || "")).toLowerCase().indexOf(q) >= 0)
        out.push('<a class="sr" href="app.html?id=' + o.id + '">' + (o.g.icon ? '<span class="icon"><img src="' + esc(safeUrl(o.g.icon)) + '" alt=""></span>' : '<span class="icon">' + initials(o.g.title) + "</span>") + "<span><b>" + esc(o.g.title) + "</b><small>" + esc(t("search.game")) + "</small></span></a>");
    });
    r[1].forEach(function (o) {
      if ((tr(o.n, "title") + " " + tr(o.n, "text")).toLowerCase().indexOf(q) >= 0)
        out.push('<a class="sr" href="article.html?id=' + o.id + '"><span class="icon">N</span><span><b>' + esc(tr(o.n, "title")) + "</b><small>" + esc(t("search.news")) + " · " + esc(dateStr(o.n.created)) + "</small></span></a>");
    });
    res.innerHTML = out.join("") || '<p class="muted">' + esc(t("search.none")) + "</p>";
  }
  const open = function () { if (!dlg.open) dlg.showModal(); inp.focus(); run(); };
  $("srchBtn").addEventListener("click", open);
  $("srchClose").addEventListener("click", function () { dlg.close(); });
  inp.addEventListener("input", debounce(run, 180));
  document.addEventListener("keydown", function (e) {
    const tag = (document.activeElement || {}).tagName;
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag))) { e.preventDefault(); open(); }
  });
}

/* ---------- Cookie sozlamalari ---------- */
function consent() { try { return JSON.parse(localStorage.getItem("pc-consent") || "null"); } catch (e) { return null; } }
function setConsent(stat) { try { localStorage.setItem("pc-consent", JSON.stringify({ stat: !!stat, t: Date.now() })); } catch (e) {} const b = $("ckBar"); if (b) b.remove(); countView(); }
function initCookies() {
  $("ckOpen").addEventListener("click", function () { const c = consent(); $("ckStat").checked = !!(c && c.stat); $("ckDlg").showModal(); });
  $("ckX").addEventListener("click", function () { $("ckDlg").close(); });
  $("ckSave").addEventListener("click", function () { setConsent($("ckStat").checked); $("ckDlg").close(); toast(t("cookie.saved"), "ok"); });
  if (!consent()) {
    document.body.insertAdjacentHTML("beforeend", '<div class="cookie" id="ckBar" role="region" aria-label="' + esc(t("cookie.title")) + '"><p>' + esc(t("cookie.bar")) + '</p><div class="row"><button class="btn primary sm" id="ckAll" type="button">' + esc(t("cookie.all")) + '</button><button class="btn sm" id="ckNec" type="button">' + esc(t("cookie.only")) + '</button><button class="link-btn" id="ckSet" type="button">' + esc(t("cookie.prefs")) + "</button></div></div>");
    $("ckAll").onclick = function () { setConsent(true); }; $("ckNec").onclick = function () { setConsent(false); }; $("ckSet").onclick = function () { $("ckOpen").click(); };
  }
}
// Tashriflar hisoblagichi: faqat "statistika" ruxsati berilgan bo'lsa, sessiyada bir marta
function countView() {
  const c = consent();
  if (!db || !c || !c.stat) return;
  try { if (sessionStorage.getItem("pcv")) return; sessionStorage.setItem("pcv", "1"); } catch (e) {}
  db.collection("stats").doc("site").set({ views: firebase.firestore.FieldValue.increment(1) }, { merge: true }).catch(function () {});
}

/* ---------- PWA ---------- */
let deferredInstall = null;
function initPwa() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      const ask = function (w) { toast(t("pwa.update"), "", { label: t("pwa.reload"), fn: function () { w.postMessage("SKIP_WAITING"); } }); };
      if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
      reg.addEventListener("updatefound", function () {
        const w = reg.installing; if (!w) return;
        w.addEventListener("statechange", function () { if (w.state === "installed" && navigator.serviceWorker.controller) ask(w); });
      });
      setInterval(function () { reg.update().catch(function () {}); }, 3600e3);
    }).catch(function () {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () { if (!reloaded) { reloaded = true; location.reload(); } });
  }
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredInstall = e; const b = $("installBtn"); if (b) b.hidden = false; });
  document.addEventListener("click", function (e) {
    if (e.target.id === "installBtn" && deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.finally(function () { deferredInstall = null; e.target.hidden = true; }); }
  });
}

/* ---------- Fon animatsiyasi (piksel zarrachalar) ---------- */
function initBg() {
  const c = $("bgc");
  if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const x = c.getContext("2d"); let w = 0, h = 0, P = [];
  function size() {
    w = c.width = innerWidth; h = c.height = innerHeight;
    P = Array.from({ length: Math.min(46, Math.floor(w * h / 30000)) }, function () { return { x: Math.random() * w, y: Math.random() * h, s: 2 + Math.floor(Math.random() * 3) * 2, v: 0.15 + Math.random() * 0.4, a: 0.2 + Math.random() * 0.5, p: Math.random() * 6 }; });
  }
  size(); addEventListener("resize", debounce(size, 200));
  (function frame(tm) {
    if (!document.hidden) {
      x.clearRect(0, 0, w, h);
      P.forEach(function (p) {
        p.y -= p.v; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        x.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(tm / 900 + p.p)); x.fillStyle = p.s > 4 ? "#c084fc" : "#7c3aed"; x.fillRect(p.x | 0, p.y | 0, p.s, p.s);
      });
    }
    requestAnimationFrame(frame);
  })(0);
}

/* ---------- Ishga tushirish ---------- */
const META = { home: 1, games: 1, news: 1, services: 1, about: 1, contact: 1, profile: 1, admin: 1 };
function boot() {
  applyI18n(document);
  buildLayout(); applyI18n(document);
  if (META[PAGE]) setMeta(t("meta." + PAGE + ".t"), t("meta." + PAGE + ".d"));
  initAuth(); setMode("login"); initSearch(); initCookies(); initPwa(); initBg(); countView();
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (items) { items.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add("in"); io.unobserve(it.target); } }); }, { threshold: 0.08 });
    qsa(".sec").forEach(function (s) { io.observe(s); });
  } else document.documentElement.classList.add("no-io");
  if (typeof PAGES !== "undefined" && PAGES[PAGE]) Promise.resolve(PAGES[PAGE]()).catch(function (e) { console.error(e); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
