"use strict";
/* PixelCore Studio 2.0 — sahifa mantiqi. Har bir sahifa <body data-page="..."> bo'yicha ishga tushadi. */
const PAGES = {};
const put = function (id, html) { const e = $(id); if (e) e.innerHTML = html; return e; };
const empty = function (k) { return '<p class="empty">' + esc(t(k)) + "</p>"; };
const sortNew = function (a, b) { return ms(b.g.created) - ms(a.g.created); };
const gGenres = function (g) { return String(g.genre || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean); };

/* ---------- umumiy bloklar ---------- */
function coverHtml(g) {
  return (g.cover ? '<img class="cv" loading="lazy" src="' + esc(safeUrl(g.cover)) + '" alt="">' : '<span class="ph">' + initials(g.title) + "</span>") +
    '<span class="icon">' + (g.icon ? '<img src="' + esc(safeUrl(g.icon)) + '" alt="">' : initials(g.title)) + "</span>";
}
function dlButtons(id, g, cls) {
  if (statusInfo(g.status).k !== "rel") return '<a class="btn ghost sm" data-link="telegram" target="_blank" rel="noopener">' + esc(t("game.notify")) + "</a>";
  const L = gameLinks(g);
  return gamePlats(g).map(function (p) { return '<a class="btn ' + (cls || "primary sm") + ' dl" data-id="' + id + '" href="' + esc(safeUrl(L[p[0]])) + '" target="_blank" rel="noopener">↓ ' + p[1] + "</a>"; }).join("");
}
function gameCard(id, g) {
  const st = statusInfo(g.status), d = tr(g, "tagline") || tr(g, "desc");
  return '<article class="card" data-id="' + id + '"><span class="st ' + st.cls + '">' + esc(st.label) + '</span><button class="fav" data-id="' + id + '" type="button">♡</button>' +
    '<a class="cover" href="app.html?id=' + id + '" aria-label="' + esc(g.title) + '">' + coverHtml(g) + '</a><div class="body"><h3><a href="app.html?id=' + id + '">' + esc(g.title) + "</a></h3><p>" + esc(d) + "</p>" +
    '<div class="tags">' + gGenres(g).slice(0, 2).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + gamePlats(g).map(function (p) { return "<span>" + p[1] + "</span>"; }).join("") + (g.version ? "<span>" + esc(g.version) + "</span>" : "") + "</div>" +
    '<div class="row">' + dlButtons(id, g) + '<a class="btn sm" href="app.html?id=' + id + '">' + esc(t("common.details")) + "</a></div></div></article>";
}
function newsCard(id, n) {
  return '<article class="card post"><a class="cover" href="article.html?id=' + id + '" aria-label="' + esc(tr(n, "title")) + '">' + (n.cover ? '<img class="cv" loading="lazy" src="' + esc(safeUrl(n.cover)) + '" alt="">' : '<span class="ph">N</span>') + '</a><div class="body" style="padding-top:18px"><div class="tags"><span>' + esc(t("cat." + (n.category || "news"))) + "</span></div><time>" + esc(dateStr(n.created)) + '</time><h3><a href="article.html?id=' + id + '">' + esc(tr(n, "title")) + "</a></h3><p>" + esc(tr(n, "text")) + "</p></div></article>";
}
function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, LANG === "en" ? "," : " "); }
function priceText(x) { return x.from ? t("price.from", { n: fmtN(x.from) }) + (x.per ? " / " + t(x.per) : "") : (x.price || t("srv.priceAsk")); }
function srvCard(x) {
  const f = (x.f || []).map(function (k) { return "<li>" + esc(tx(k)) + "</li>"; }).join("");
  return '<article class="card srv"><div class="body"><div class="srv-ic" aria-hidden="true">' + x.icon + "</div><h3>" + esc(tx(x.t)) + "</h3><p>" + esc(tx(x.d)) + '</p><ul class="feats">' + f + '</ul><div class="srv-price"><small>' + esc(t("srv.price")) + "</small><b>" + esc(priceText(x)) + '</b></div><div class="row"><a class="btn primary" data-link="support" target="_blank" rel="noopener">' + esc(t("srv.order")) + '</a><a class="btn" href="contact.html?service=' + encodeURIComponent(x.id) + '#ct">' + esc(t("srv.msg")) + "</a></div></div></article>";
}
function pkgCard(group, p) {
  return '<article class="card pkg' + (p.hot ? " hot" : "") + '"><div class="body">' + (p.hot ? '<span class="badge">' + esc(t("pkg.hot")) + "</span>" : "") + "<h3>" + esc(tx(p.n)) + '</h3><div class="pkg-price">' + esc(priceText({ from: p.price })) + '</div><ul class="feats">' + p.f.map(function (k) { return "<li>" + esc(tx(k)) + "</li>"; }).join("") + '</ul><a class="btn ' + (p.hot ? "primary" : "") + '" href="contact.html?service=' + group + "&pkg=" + encodeURIComponent(p.id) + '#ct">' + esc(t("pkg.choose")) + "</a></div></article>";
}
function portCard(x) {
  const img = /^https?:/.test(x.img || "") ? safeUrl(x.img) : (/^[\w\/.\-]+$/.test(x.img || "") ? x.img : "");
  const u = safeUrl(x.u || "");
  return '<article class="card post"><a class="cover" href="' + esc(u) + '" target="_blank" rel="noopener" aria-label="' + esc(tx(x.t)) + '">' + (img ? '<img class="cv" loading="lazy" src="' + esc(img) + '" alt="">' : '<span class="ph">' + initials(tx(x.t)) + "</span>") + '</a><div class="body" style="padding-top:18px"><div class="tags"><span>' + esc(t("port.tag." + (x.tag || "web"))) + "</span></div><h3>" + esc(tx(x.t)) + "</h3><p>" + esc(tx(x.d)) + '</p><a class="more" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t("port.view")) + "</a></div></article>";
}
function renderFeat(games) {
  const el = $("feat"); if (!el) return; const sec = $("featSec");
  const rel = games.filter(function (o) { return statusInfo(o.g.status).k === "rel"; });
  const pool = games.filter(function (o) { return o.g.featured; });
  const list = (pool.length ? pool : rel).slice().sort(function (x, y) { return (ms(y.g.updated) || ms(y.g.created)) - (ms(x.g.updated) || ms(x.g.created)); });
  if (sec) sec.hidden = !list.length;
  if (!list.length) { el.hidden = true; return; }
  const o = list[0], g = o.g;
  el.innerHTML = '<a class="cover" href="app.html?id=' + o.id + '" aria-label="' + esc(g.title) + '">' + coverHtml(g) + '</a><div class="ft"><span class="badge">' + esc(t(g.featured ? "game.featured" : "game.new")) + "</span><h3>" + esc(g.title) + "</h3><p>" + esc(tr(g, "tagline") || tr(g, "desc").slice(0, 180)) + '</p><div class="row">' + dlButtons(o.id, g) + '<a class="btn sm" href="app.html?id=' + o.id + '">' + esc(t("common.details")) + "</a></div></div>";
  el.hidden = false;
}
function techList(list, id) {
  put(id, list.map(function (x) { return '<div class="card"><b>' + esc(x.n) + "</b><p>" + esc(tx(x.d || "")) + "</p></div>"; }).join(""));
}
function fillFact() {
  let i = Math.floor(Math.random() * 6);
  const f = $("fact"), b = $("next"); if (!f) return;
  f.textContent = t("fact." + i);
  b.addEventListener("click", function () { f.style.opacity = 0; setTimeout(function () { i = (i + 1) % 6; f.textContent = t("fact." + i); f.style.opacity = 1; }, 220); });
}

/* ---------- Bosh sahifa ---------- */
PAGES.home = async function () {
  $("logoBtn").addEventListener("click", function () { $("logoBtn").classList.toggle("spin"); });
  fillFact();
  const r = await Promise.all([getGames(), getNews()]), games = r[0], news = r[1];
  const rel = games.filter(function (o) { return statusInfo(o.g.status).k === "rel"; });
  const plats = new Set(); games.forEach(function (o) { gamePlats(o.g).forEach(function (p) { plats.add(p[0]); }); });
  let dl = 0; games.forEach(function (o) { dl += o.g.downloads || 0; });
  put("stats", [[rel.length, "stat.released"], [games.length - rel.length, "stat.upcoming"], [dl, "stat.downloads"], [plats.size || 3, "stat.platforms"]].map(function (s) { return '<div class="stat"><b>' + s[0].toLocaleString() + "</b><span>" + esc(t(s[1])) + "</span></div>"; }).join(""));
  renderFeat(games);
  const latest = games.slice().sort(sortNew).slice(0, 3);
  put("newGames", latest.length ? latest.map(function (o) { return gameCard(o.id, o.g); }).join("") : empty("games.none"));
  techList(TECH, "techList");
  if (PARTNERS.length) { put("partList", PARTNERS.map(function (p) { return '<a href="' + esc(safeUrl(p.u)) + '" target="_blank" rel="noopener">' + esc(p.n) + "</a>"; }).join("")); $("partSec").hidden = false; }
  put("newsList", news.length ? news.slice(0, 3).map(function (o) { return newsCard(o.id, o.n); }).join("") : empty("news.none"));
  put("srvList", SERVICES.slice(0, 3).map(srvCard).join(""));
  bindLinks(document); paintFavs();
};

/* ---------- O'yinlar katalogi ---------- */
PAGES.games = async function () {
  const games = await getGames(), q0 = new URLSearchParams(location.search).get("q");
  if (q0) $("q").value = q0;
  const genres = Array.from(new Set([].concat.apply([], games.map(function (o) { return gGenres(o.g); })))).sort();
  $("genre").innerHTML = '<option value="">' + esc(t("games.allGenres")) + "</option>" + genres.map(function (g) { return '<option value="' + esc(g) + '">' + esc(g) + "</option>"; }).join("");
  function view() {
    const q = $("q").value.trim().toLowerCase(), f = $("flt").value, pf = $("plat").value, gn = $("genre").value, k = $("sort").value;
    let a = games.filter(function (o) {
      const g = o.g, s = statusInfo(g.status).k;
      return (!q || (g.title + " " + tr(g, "desc") + " " + (g.genre || "")).toLowerCase().indexOf(q) >= 0) &&
        (!f || (f === "fav" ? favs.indexOf(o.id) >= 0 : s === f)) && (!pf || gamePlats(g).some(function (p) { return p[0] === pf; })) && (!gn || gGenres(g).indexOf(gn) >= 0);
    });
    a.sort(function (x, y) {
      if (k === "name") return x.g.title.localeCompare(y.g.title);
      if (k === "dl") return (y.g.downloads || 0) - (x.g.downloads || 0);
      if (k === "upd") return (ms(y.g.updated) || ms(y.g.created)) - (ms(x.g.updated) || ms(x.g.created));
      return ms(y.g.created) - ms(x.g.created);
    });
    put("games", a.length ? a.map(function (o) { return gameCard(o.id, o.g); }).join("") : empty(games.length ? "games.noMatch" : "games.none"));
    $("count").textContent = t("games.count", { n: a.length });
    qsa("#chips button").forEach(function (b) { b.classList.toggle("on", b.dataset.sort === k); });
    bindLinks($("games")); paintFavs();
  }
  ["q"].forEach(function (i) { $(i).addEventListener("input", debounce(view, 120)); });
  ["flt", "plat", "genre", "sort"].forEach(function (i) { $(i).addEventListener("change", view); });
  qsa("#chips button").forEach(function (b) { b.addEventListener("click", function () { $("sort").value = b.dataset.sort; view(); }); });
  document.addEventListener("favs-changed", function () { if ($("flt").value === "fav") view(); });
  view();
};

/* ---------- O'yin sahifasi ---------- */
function ytId(u) { const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/.exec(u || ""); return m ? m[1] : ""; }
PAGES.app = async function () {
  const gid = new URLSearchParams(location.search).get("id"), box = $("app");
  if (!db || !gid) { box.innerHTML = empty("game.notfound"); return; }
  let d, ims;
  try {
    const r = await Promise.all([db.collection("games").doc(gid).get(), db.collection("images").where("gameId", "==", gid).get().catch(function () { return null; })]);
    d = r[0]; ims = r[1];
  } catch (e) { box.innerHTML = empty("common.loadfail"); return; }
  if (!d.exists) { box.innerHTML = empty("game.notfound"); return; }
  const g = d.data(), st = statusInfo(g.status), L = gameLinks(g), pl = gamePlats(g), desc = tr(g, "desc");
  setMeta(g.title + " — PixelCore Studio", (tr(g, "tagline") || desc).slice(0, 160)); setCanonical("/app.html?id=" + gid);
  const imgs = ims ? ims.docs.map(function (x) { return x.data(); }).filter(function (x) { return x.kind !== "cover"; }).sort(function (a, b) { return (a.n || 0) - (b.n || 0); }).map(function (x) { return x.data; }) : [];
  const vid = ytId(g.video), feats = tr(g, "features").split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  const Sz = g.sizes || {}, Rq = g.reqs || {}, Rr = g.reqRec || {};
  const sys = PLAT.filter(function (p) { return Rq[p[0]] || Rr[p[0]] || Sz[p[0]]; }).map(function (p) {
    return '<div class="card"><b>' + p[1] + "</b><dl>" + (Rq[p[0]] ? "<dt>" + esc(t("game.min")) + "</dt><dd>" + esc(Rq[p[0]]) + "</dd>" : "") + (Rr[p[0]] ? "<dt>" + esc(t("game.rec")) + "</dt><dd>" + esc(Rr[p[0]]) + "</dd>" : "") + (Sz[p[0]] ? "<dt>" + esc(t("game.size")) + "</dt><dd>" + esc(Sz[p[0]]) + "</dd>" : "") + "</dl></div>";
  }).join("");
  const logs = String(g.changelog || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  const ut = g.updated || g.created;
  box.innerHTML = '<div class="gh"><div><div class="cover" style="border-radius:20px">' + (g.cover ? '<img class="cv" src="' + esc(safeUrl(g.cover)) + '" alt="' + esc(g.title) + '">' : '<span class="ph">' + initials(g.title) + "</span>") + '</div></div><div class="info"><div class="tags"><span>' + esc(st.label) + "</span>" + gGenres(g).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div><h1>" + esc(g.title) + "</h1>" +
    (tr(g, "tagline") ? '<p class="lead" style="margin:0">' + esc(tr(g, "tagline")) + "</p>" : "") + '<div class="dls">' + dlButtons(gid, g) + '<button class="btn" id="share" type="button">' + esc(t("common.share")) + '</button><button class="fav" id="favBtn" data-id="' + gid + '" type="button" style="position:static">♡</button></div>' +
    '<div class="kv"><div><small>' + esc(t("game.version")) + "</small><b>" + esc(g.version || "—") + "</b></div><div><small>" + esc(t("game.updated")) + "</small><b>" + esc(dateStr(ut) || "—") + "</b></div><div><small>" + esc(t("game.platforms")) + "</small><b>" + (pl.map(function (p) { return p[1]; }).join(", ") || "—") + "</b></div><div><small>" + esc(t("stat.downloads")) + '</small><b id="dlc">' + (g.downloads || 0).toLocaleString() + '</b></div><div><small>' + esc(t("game.rating")) + '</small><b id="avg">—</b></div><div><small>' + esc(t("game.release")) + "</small><b>" + esc(g.releaseDate || "—") + "</b></div></div>" +
    '<a class="more" href="contact.html?type=bug&game=' + gid + '#feedback">' + esc(t("game.report")) + "</a></div></div>" +
    '<section class="blk"><h2>' + esc(t("game.about")) + '</h2><p class="lead" style="white-space:pre-line;max-width:800px">' + esc(desc) + "</p></section>" +
    (vid ? '<section class="blk"><h2>' + esc(t("game.video")) + '</h2><iframe class="vid" loading="lazy" src="https://www.youtube-nocookie.com/embed/' + vid + '" title="' + esc(g.title) + '" allow="accelerometer; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></section>' : "") +
    (imgs.length ? '<section class="blk"><h2>' + esc(t("game.shots")) + '</h2><div class="shots">' + imgs.map(function (u, i) { return '<button class="shot" type="button" data-i="' + i + '" aria-label="' + esc(t("game.shots")) + " " + (i + 1) + '"><img loading="lazy" src="' + esc(safeUrl(u)) + '" alt=""></button>'; }).join("") + "</div></section>" : "") +
    (feats.length ? '<section class="blk"><h2>' + esc(t("game.features")) + '</h2><ul class="feats">' + feats.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul></section>" : "") +
    (sys ? '<section class="blk"><h2>' + esc(t("game.sys")) + '</h2><div class="sysg">' + sys + "</div></section>" : "") +
    (logs.length ? '<section class="blk"><h2>' + esc(t("game.changelog")) + '</h2><div class="log">' + logs.map(function (l) { return "<div>" + esc(l) + "</div>"; }).join("") + "</div></section>" : "") +
    '<section class="blk" id="revBox"></section><section class="blk"><h2>' + esc(t("game.similar")) + '</h2><div class="grid" id="similar"></div></section>';
  bindLinks(box); paintFavs();
  $("share").addEventListener("click", function () { if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(function () {}); else if (navigator.clipboard) { navigator.clipboard.writeText(location.href); toast(t("common.copied"), "ok"); } });
  box.addEventListener("click", function (e) {
    const s = e.target.closest(".shot"); if (!s) return;
    let i = +s.dataset.i; const z = $("zoom"), show = function () { $("zimg").src = safeUrl(imgs[i]); }; show(); z.showModal();
    $("zprev").onclick = function () { i = (i + imgs.length - 1) % imgs.length; show(); }; $("znext").onclick = function () { i = (i + 1) % imgs.length; show(); };
  });
  $("zc").addEventListener("click", function () { $("zoom").close(); });
  // o'xshash o'yinlar: bir xil janr, so'ng qolganlari
  getGames().then(function (all) {
    const gs = gGenres(g), oth = all.filter(function (o) { return o.id !== gid; });
    const sim = oth.filter(function (o) { return gGenres(o.g).some(function (x) { return gs.indexOf(x) >= 0; }); });
    const pick = sim.concat(oth.filter(function (o) { return sim.indexOf(o) < 0; })).slice(0, 3);
    put("similar", pick.length ? pick.map(function (o) { return gameCard(o.id, o.g); }).join("") : empty("game.nosimilar")); bindLinks($("similar")); paintFavs();
  });
  const stars = function (n) { return "★".repeat(n) + "☆".repeat(5 - n); };
  async function reviews() {
    let rs = [];
    try { const s = await db.collection("reviews").where("gameId", "==", gid).get(); rs = s.docs.map(function (x) { return Object.assign({ id: x.id }, x.data()); }); } catch (e) {}
    rs.sort(function (a, b) { return (b.created ? b.created.seconds : 9e9) - (a.created ? a.created.seconds : 9e9); });
    const avg = rs.length ? (rs.reduce(function (x, r) { return x + r.stars; }, 0) / rs.length).toFixed(1) : "";
    $("avg").textContent = avg ? "★ " + avg + " (" + rs.length + ")" : "—";
    const mine = USER ? rs.find(function (r) { return r.uid === USER.uid; }) : null;
    put("revBox", "<h2>" + esc(t("game.reviews")) + "</h2>" + (rs.map(function (r) {
      const own = USER && (USER.uid === r.uid || ADMIN_EMAILS.indexOf(USER.email) >= 0);
      return '<div class="cm">' + avatarSvg(r.uid, "av") + '<div class="cb"><div class="meta"><b>' + esc(r.name) + "</b> · " + stars(r.stars) + " · " + esc(dateStr(r.created)) + "</div><p>" + esc(r.text) + "</p>" + (own ? '<button class="link-btn" data-rid="' + r.id + '" type="button">' + esc(t("common.delete")) + "</button>" : "") + "</div></div>";
    }).join("") || empty("game.noreviews")) + (USER ? '<form id="rf" class="stack"><select class="field" id="rs" aria-label="' + esc(t("game.rating")) + '">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '">' + stars(n) + "</option>"; }).join("") + '</select><textarea class="field" id="rt" maxlength="500" required placeholder="' + esc(t("game.yourReview")) + '"></textarea><button class="btn primary sm">' + esc(t(mine ? "game.updateReview" : "game.sendReview")) + "</button></form>" : '<p class="muted">' + esc(t("game.loginReview")) + "</p>"));
    if (mine && $("rt")) { $("rt").value = mine.text; $("rs").value = mine.stars; }
  }
  $("revBox").addEventListener("click", async function (e) {
    const b = e.target.closest("[data-rid]"); if (!b || !confirm(t("common.confirmDel"))) return;
    try { await db.collection("reviews").doc(b.dataset.rid).delete(); reviews(); } catch (x) { toast(x.code || x.message, "err"); }
  });
  $("revBox").addEventListener("submit", async function (e) {
    if (e.target.id !== "rf") return; e.preventDefault();
    if (!requireLogin()) return;
    try { await db.collection("reviews").doc(gid + "_" + USER.uid).set({ gameId: gid, uid: USER.uid, name: myName(), stars: +$("rs").value, text: $("rt").value.trim(), created: firebase.firestore.FieldValue.serverTimestamp() }); toast(t("game.reviewSaved"), "ok"); reviews(); }
    catch (x) { toast(t("common.error") + ": " + (x.code || x.message), "err"); }
  });
  onUser(reviews);
};

/* ---------- Izohlar (yangiliklar uchun) ---------- */
function commentsBlock(boxId, targetType, targetId) {
  const box = $(boxId);
  async function load() {
    let cs = [];
    try { const s = await db.collection("comments").where("targetType", "==", targetType).where("targetId", "==", targetId).get(); cs = s.docs.map(function (x) { return Object.assign({ id: x.id }, x.data()); }); } catch (e) {}
    cs.sort(function (a, b) { return (a.created ? a.created.seconds : 9e9) - (b.created ? b.created.seconds : 9e9); });
    box.innerHTML = "<h2>" + esc(t("cm.title")) + " (" + cs.length + ")</h2>" + (cs.map(function (c) {
      const own = USER && (USER.uid === c.uid || ADMIN_EMAILS.indexOf(USER.email) >= 0);
      return '<div class="cm">' + avatarSvg(c.uid, "av") + '<div class="cb"><div class="meta"><b>' + esc(c.name) + "</b> · " + esc(dateStr(c.created)) + "</div><p>" + esc(c.text) + "</p>" + (own ? '<button class="link-btn" data-cid="' + c.id + '" type="button">' + esc(t("common.delete")) + "</button>" : "") + "</div></div>";
    }).join("") || empty("cm.none")) + (USER ? '<form id="cmForm" class="stack"><textarea class="field" id="cmText" maxlength="500" required placeholder="' + esc(t("cm.ph")) + '"></textarea><button class="btn primary sm">' + esc(t("cm.send")) + "</button></form>" : '<p class="muted">' + esc(t("cm.login")) + "</p>");
  }
  box.addEventListener("click", async function (e) {
    const b = e.target.closest("[data-cid]"); if (!b || !confirm(t("common.confirmDel"))) return;
    try { await db.collection("comments").doc(b.dataset.cid).delete(); load(); } catch (x) { toast(x.code || x.message, "err"); }
  });
  box.addEventListener("submit", async function (e) {
    if (e.target.id !== "cmForm") return; e.preventDefault(); if (!requireLogin()) return;
    try { await db.collection("comments").add({ targetType: targetType, targetId: targetId, uid: USER.uid, name: myName(), text: $("cmText").value.trim(), created: firebase.firestore.FieldValue.serverTimestamp() }); load(); }
    catch (x) { toast(t("common.error") + ": " + (x.code || x.message), "err"); }
  });
  onUser(load);
}

/* ---------- Yangiliklar / Devlog ---------- */
const CATS = ["news", "update", "event"];
async function newsPage(fixed) {
  const all = await getNews(); let cat = fixed || "", shown = 12;
  const chips = $("chips");
  if (!fixed) { chips.innerHTML = '<button type="button" data-c="" class="on">' + esc(t("common.all")) + "</button>" + CATS.map(function (c) { return '<button type="button" data-c="' + c + '">' + esc(t("cat." + c)) + "</button>"; }).join(""); } else chips.hidden = true;
  function view() {
    const q = $("q").value.trim().toLowerCase();
    const a = all.filter(function (o) { return (!cat || (o.n.category || "news") === cat) && (!q || (tr(o.n, "title") + " " + tr(o.n, "text")).toLowerCase().indexOf(q) >= 0); });
    put("newsList", a.length ? a.slice(0, shown).map(function (o) { return newsCard(o.id, o.n); }).join("") : empty("news.none"));
    $("more").hidden = a.length <= shown;
  }
  chips.addEventListener("click", function (e) { const b = e.target.closest("button"); if (!b) return; cat = b.dataset.c; shown = 12; qsa("button", chips).forEach(function (x) { x.classList.toggle("on", x === b); }); view(); });
  $("q").addEventListener("input", debounce(function () { shown = 12; view(); }, 150));
  $("more").addEventListener("click", function () { shown += 12; view(); });
  view();
}
PAGES.news = function () { return newsPage(""); };
PAGES.article = async function () {
  const id = new URLSearchParams(location.search).get("id"), box = $("art");
  if (!db || !id) { box.innerHTML = empty("news.notfound"); return; }
  let d; try { d = await db.collection("news").doc(id).get(); } catch (e) { box.innerHTML = empty("common.loadfail"); return; }
  if (!d.exists) { box.innerHTML = empty("news.notfound"); return; }
  const n = d.data(), title = tr(n, "title");
  setMeta(title + " — PixelCore Studio", tr(n, "text").slice(0, 160)); setCanonical("/article.html?id=" + id);
  box.innerHTML = '<div class="tags"><span>' + esc(t("cat." + (n.category || "news"))) + "</span></div><h1>" + esc(title) + '</h1><p class="meta">' + esc(dateStr(n.created)) + "</p>" +
    (n.cover ? '<div class="cover"><img class="cv" src="' + esc(safeUrl(n.cover)) + '" alt=""></div>' : "") + '<div class="txt">' + esc(tr(n, "text")) + '</div><div class="row" style="margin:24px 0"><button class="btn sm" id="share" type="button">' + esc(t("common.share")) + '</button><a class="btn sm" href="news.html">← ' + esc(t("nav.news")) + '</a></div><section class="blk" id="cmBox"></section>';
  $("share").addEventListener("click", function () { if (navigator.share) navigator.share({ title: title, url: location.href }).catch(function () {}); else if (navigator.clipboard) { navigator.clipboard.writeText(location.href); toast(t("common.copied"), "ok"); } });
  commentsBlock("cmBox", "news", id);
};

/* ---------- Studio haqida ---------- */
const LOGO_PATH = "M0 0H262V272H0Z M83 83H248V157H150V255H83Z M295 0H555V272H295Z M472 83H307V157H405V255H472Z M0 297H262V555H0Z M83 472H248V398H150V300H83Z M295 297H555V555H295Z M472 472H307V398H405V300H472Z";
PAGES.about = async function () {
  techList(TECH, "techList"); techList(SOFTWARE, "swList");
  qsa("[data-kit]").forEach(function (b) {
    b.addEventListener("click", function () {
      const p = b.dataset.kit.split(","), svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 555 555"><path fill="' + p[0] + '" fill-rule="evenodd" d="' + LOGO_PATH + '"/><circle cx="278" cy="279" r="65" fill="' + p[1] + '"/></svg>';
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = p[2] + ".svg"; a.click();
    });
  });
  let team = [];
  try { if (db) team = (await db.collection("team").get()).docs.map(function (d) { return d.data(); }).sort(function (a, b) { return (a.n || 0) - (b.n || 0); }); } catch (e) {}
  put("teamList", team.length ? team.map(function (m) {
    return '<div class="card member"><div class="avb">' + (m.avatar ? '<img src="' + esc(safeUrl(m.avatar)) + '" alt="">' : avatarSvg(m.name)) + "</div><b>" + esc(m.name) + '</b><span class="muted">' + esc(tr(m, "role")) + "</span><p>" + esc(tr(m, "bio")) + "</p>" + (m.link ? '<a class="more" href="' + esc(safeUrl(m.link)) + '" target="_blank" rel="noopener">' + esc(t("team.profile")) + "</a>" : "") + "</div>";
  }).join("") : empty("team.none"));
};

/* ---------- Xizmatlar ---------- */
PAGES.services = function () {
  put("srvList", SERVICES.map(srvCard).join(""));
  PACKAGES.forEach(function (g) { put("pkg_" + g.group, g.items.map(function (p) { return pkgCard(g.group, p); }).join("")); });
  if (PORTFOLIO.length) { put("portList", PORTFOLIO.map(portCard).join("")); $("portSec").hidden = false; }
  bindLinks(document);
};

/* ---------- Aloqa, bug report, takliflar ---------- */
PAGES.contact = async function () {
  const P = new URLSearchParams(location.search);
  const games = await getGames();
  $("fbGame").innerHTML = '<option value="">' + esc(t("fb.anyGame")) + "</option>" + games.map(function (o) { return '<option value="' + o.id + '">' + esc(o.g.title) + "</option>"; }).join("");
  if (["bug", "suggestion", "question"].indexOf(P.get("type")) >= 0) $("fbType").value = P.get("type");
  if (P.get("game")) $("fbGame").value = P.get("game");
  const sv = P.get("service"), pk = "srv.prefill." + sv;
  if (sv && DICT[pk]) {
    const pid = P.get("pkg"), pkg = pid && [].concat.apply([], PACKAGES.map(function (g) { return g.items; })).find(function (p) { return p.id === pid; });
    $("ctText").value = (pkg ? t("srv.prefill.pkg", { p: tx(pkg.n) }) : "") + t(pk);
  }
  onUser(function () { $("fbLogin").hidden = !!USER; });
  $("fbForm").addEventListener("submit", async function (e) {
    e.preventDefault(); const m = $("fbMsg"); m.className = "err"; m.textContent = "";
    if (!db) { m.textContent = t("auth.nofb"); return; } if (!requireLogin()) return;
    const data = { uid: USER.uid, email: USER.email, type: $("fbType").value, text: $("fbText").value.trim(), created: firebase.firestore.FieldValue.serverTimestamp() };
    if ($("fbGame").value) data.gameId = $("fbGame").value;
    try { await db.collection("feedback").add(data); e.target.reset(); m.className = "err ok"; m.textContent = t("fb.sent"); } catch (x) { m.textContent = t("common.error") + ": " + (x.code || x.message); }
  });
  $("ctForm").addEventListener("submit", async function (e) {
    e.preventDefault(); const m = $("ctMsg"); m.className = "err"; m.textContent = "";
    if ($("ctWeb").value) return; // spam tuzog'i (honeypot)
    if (!db) { m.textContent = t("auth.nofb"); return; }
    const data = { name: $("ctName").value.trim(), email: $("ctMail").value.trim(), message: $("ctText").value.trim(), lang: LANG, created: firebase.firestore.FieldValue.serverTimestamp() };
    if (USER) data.uid = USER.uid;
    try { await db.collection("contacts").add(data); e.target.reset(); m.className = "err ok"; m.textContent = t("ct.sent"); } catch (x) { m.textContent = t("common.error") + ": " + (x.code || x.message); }
  });
  $("ytCard").hidden = !LINKS.youtube;
  bindLinks(document);
};

/* ---------- Profil (PixelCore ID) ---------- */
const ACH = [
  ["joined", function (s) { return true; }], ["verified", function (s) { return s.verified; }],
  ["fav1", function (s) { return s.favs >= 1; }], ["fav5", function (s) { return s.favs >= 5; }],
  ["rev1", function (s) { return s.reviews >= 1; }], ["rev5", function (s) { return s.reviews >= 5; }],
  ["cm1", function (s) { return s.comments >= 1; }], ["rep1", function (s) { return s.reports >= 1; }],
];
function levelOf(xp) { const L = 1 + Math.floor(Math.sqrt(xp / 8)); return { L: L, cur: 8 * (L - 1) * (L - 1), next: 8 * L * L }; }
PAGES.profile = function () {
  onUser(async function (u) {
    const box = $("prof");
    if (!u) { box.innerHTML = '<div class="panel" style="grid-column:1/-1"><p>' + esc(t("prof.need")) + '</p><button class="btn primary" id="pl" type="button">' + esc(t("auth.login")) + "</button></div>"; $("pl").onclick = openAuth; return; }
    const q = function (col) { return db.collection(col).where("uid", "==", u.uid).get().then(function (s) { return s.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }); }).catch(function () { return []; }); };
    const r = await Promise.all([q("reviews"), q("comments"), q("feedback"), getGames()]), revs = r[0], cms = r[1], reps = r[2], games = r[3];
    const stats = { favs: favs.length, reviews: revs.length, comments: cms.length, reports: reps.length, verified: u.emailVerified };
    const xp = 10 + (u.emailVerified ? 20 : 0) + favs.length * 2 + revs.length * 10 + cms.length * 5 + reps.length * 15, lv = levelOf(xp);
    const pct = Math.min(100, Math.round((xp - lv.cur) / (lv.next - lv.cur) * 100));
    const hist = [].concat(revs.map(function (x) { const g = games.find(function (o) { return o.id === x.gameId; }); return { t: x.created, s: t("act.review") + ": " + (g ? g.g.title : x.gameId) + " · " + x.stars + "★" }; }),
      cms.map(function (x) { return { t: x.created, s: t("act.comment") + ": " + x.text.slice(0, 80) }; }), reps.map(function (x) { return { t: x.created, s: t("act.report") + " (" + (DICT["fbt." + x.type] ? t("fbt." + x.type) : x.type) + "): " + x.text.slice(0, 80) }; }))
      .sort(function (a, b) { return ms(b.t) - ms(a.t); }).slice(0, 15);
    box.innerHTML = '<aside class="panel"><div id="pav"></div><h2 id="pn"></h2><p class="muted" style="margin:0 0 4px">' + esc(u.email) + '</p><p style="margin:0 0 12px">' + (u.emailVerified ? '<span class="ok">✓ ' + esc(t("prof.verified")) + "</span>" : '<span class="muted">' + esc(t("prof.unverified")) + ' </span><button class="link-btn" id="resend" type="button">' + esc(t("prof.resend")) + "</button>") + "</p>" +
      "<b>" + esc(t("prof.level")) + " " + lv.L + '</b> <span class="muted">· ' + xp + " / " + lv.next + ' XP</span><div class="lvl"><i style="width:' + pct + '%"></i></div><p class="muted" style="font-size:14px">' + esc(t("prof.since")) + ": " + esc(dateStr(PROFILE && PROFILE.created) || "—") + '</p><div class="row"><button class="btn sm" id="plogout" type="button">' + esc(t("auth.logout")) + '</button><button class="btn sm danger" id="pdel" type="button">' + esc(t("prof.delete")) + "</button></div></aside>" +
      '<div><section class="panel"><h2>' + esc(t("prof.edit")) + '</h2><form id="pf" class="stack"><label class="lab" for="pu">' + esc(t("auth.username")) + '</label><input class="field" id="pu" maxlength="20" required><span class="lab">' + esc(t("prof.avatar")) + '</span><div class="avs" id="avs"></div><p class="err" id="pm"></p><button class="btn primary sm">' + esc(t("common.save")) + "</button></form></section>" +
      '<section class="panel" style="margin-top:18px"><h2>' + esc(t("prof.ach")) + '</h2><div class="ach">' + ACH.map(function (a) { const got = a[1](stats); return '<div class="' + (got ? "got" : "") + '"><b>' + (got ? "★ " : "☆ ") + esc(t("ach." + a[0])) + "</b><span>" + esc(t("ach." + a[0] + ".d")) + "</span></div>"; }).join("") + "</div></section>" +
      '<section class="panel" style="margin-top:18px"><h2>' + esc(t("prof.favs")) + '</h2><div class="grid" id="pfavs"></div></section>' +
      '<section class="panel" style="margin-top:18px"><h2>' + esc(t("prof.history")) + '</h2><ul class="hist">' + (hist.map(function (h) { return "<li><time>" + esc(dateStr(h.t)) + "</time>" + esc(h.s) + "</li>"; }).join("") || "<li class='muted'>" + esc(t("prof.nohist")) + "</li>") + "</ul></section></div>";
    const fg = games.filter(function (o) { return favs.indexOf(o.id) >= 0; });
    put("pfavs", fg.length ? fg.map(function (o) { return gameCard(o.id, o.g); }).join("") : empty("prof.nofavs")); bindLinks(box); paintFavs();
    let av = myAvatar(); $("pu").value = myName();
    const drawAv = function () {
      $("pav").innerHTML = avatarSvg(av, "big-av"); $("pn").textContent = $("pu").value || myName();
      $("avs").innerHTML = Array.from({ length: 12 }, function (_, i) { return '<button type="button" data-a="' + i + '" class="' + (String(i) === av ? "on" : "") + '" aria-label="' + esc(t("prof.avatar")) + " " + (i + 1) + '">' + avatarSvg(i) + "</button>"; }).join("");
    };
    drawAv();
    $("avs").addEventListener("click", function (e) { const b = e.target.closest("button"); if (b) { av = b.dataset.a; drawAv(); } });
    $("pf").addEventListener("submit", async function (e) {
      e.preventDefault(); const m = $("pm"), un = $("pu").value.trim(); m.className = "err";
      if (!/^[\w.\- ]{3,20}$/.test(un)) { m.textContent = t("auth.e.username"); return; }
      try { await db.collection("users").doc(u.uid).set({ username: un, avatar: String(av) }, { merge: true }); await u.updateProfile({ displayName: un }); PROFILE = Object.assign(PROFILE || {}, { username: un, avatar: String(av) }); renderAcct(); drawAv(); m.className = "err ok"; m.textContent = t("prof.saved"); }
      catch (x) { m.textContent = t("common.error") + ": " + (x.code || x.message); }
    });
    $("plogout").onclick = function () { auth.signOut().then(function () { location.href = "index.html"; }); };
    const rs = $("resend"); if (rs) rs.onclick = function () { u.sendEmailVerification().then(function () { toast(t("auth.verifySent"), "ok"); }).catch(function (x) { toast(authMsg(x.code), "err"); }); };
    $("pdel").onclick = async function () {
      if (!confirm(t("prof.confirmDel"))) return;
      try {
        try { const at = ((await u.getIdTokenResult()).claims.auth_time || 0) * 1000; if (at && Date.now() - at > 5 * 60e3) { toast(t("prof.relogin"), "err"); return; } } catch (e) {}
        const bt = db.batch(); revs.forEach(function (x) { bt.delete(db.collection("reviews").doc(x.id)); }); cms.forEach(function (x) { bt.delete(db.collection("comments").doc(x.id)); }); bt.delete(db.collection("users").doc(u.uid)); await bt.commit();
        await u.delete(); try { localStorage.removeItem("favs"); } catch (e) {} location.href = "index.html";
      } catch (x) { toast(x.code === "auth/requires-recent-login" ? t("prof.relogin") : authMsg(x.code || ""), "err"); }
    };
  });
};

/* ---------- Maxfiylik sahifasi: faqat tanlangan til matni ko'rsatiladi ---------- */
PAGES.privacy = function () { qsa("[data-lang]").forEach(function (e) { e.hidden = e.dataset.lang !== LANG; }); };
