const $ = function (id) { return document.getElementById(id); };
function safeUrl(u) { return /^(https?:\/\/|data:image\/(png|jpe?g|webp);base64,)/.test(u) ? u : "#"; }
const gid = new URLSearchParams(location.search).get("id");
const PLAT = [["android", "Android"], ["windows", "Windows"], ["mac", "macOS"]];
function put(h) { $("app").innerHTML = h; }

if (!db || !gid) put('<p class="muted">Ilova topilmadi.</p>');
else Promise.all([
  db.collection("games").doc(gid).get(),
  db.collection("images").where("gameId", "==", gid).get().catch(function () { return null; }),
]).then(function (r) {
  const d = r[0], im = r[1];
  if (!d.exists) return put('<p class="muted">Ilova topilmadi.</p>');
  const g = d.data(), soon = g.status === "Tez orada", Lk = g.links || {};
  const L = { android: Lk.android || g.link || "", windows: Lk.windows || "", mac: Lk.mac || "" };
  const have = PLAT.filter(function (p) { return L[p[0]]; });
  document.title = g.title + " — PixelCore Studio";
  const imgs = im ? im.docs.map(function (x) { return x.data(); }).sort(function (a, b) { return (a.n || 0) - (b.n || 0); }).map(function (x) { return x.data; }) : [];
  const shots = imgs.map(function (u) {
    return '<button class="shot"><img loading="lazy" src="' + esc(safeUrl(u)) + '" alt="' + esc(g.title) + ' skrinshoti"></button>';
  }).join("");
  const dl = soon ? "" : have.map(function (p) {
    return '<a class="btn primary dl" data-id="' + gid + '" href="' + esc(safeUrl(L[p[0]])) + '" target="_blank" rel="noopener">↓ ' + p[1] + "</a>";
  }).join("");
  const Sz = g.sizes || {}, Rq = g.reqs || {};
  const sys = have.filter(function (p) { return Sz[p[0]] || Rq[p[0]]; }).map(function (p) {
    return '<div class="sysrow"><b>' + p[1] + "</b><span>" + esc([Sz[p[0]], Rq[p[0]]].filter(Boolean).join(" · ")) + "</span></div>";
  }).join("");
  const ut = g.updated || g.created;
  const upd = ut && ut.toDate ? '<p class="muted">Oxirgi yangilanish: <time>' + ut.toDate().toLocaleDateString("en-GB") + "</time></p>" : "";
  put('<div class="icon big">' + (g.icon ? '<img src="' + esc(safeUrl(g.icon)) + '" alt="">' : esc(g.title.slice(0, 2).toUpperCase())) + "</div>" +
    '<h1 class="ah">' + esc(g.title) + '</h1><div class="tags">' + have.map(function (p) { return "<span>" + p[1] + "</span>"; }).join("") +
    "<span>" + esc(g.status) + "</span>" + (g.version ? "<span>" + esc(g.version) + "</span>" : "") +
    (g.downloads ? "<span>" + g.downloads + " " + t("yuklash") + "</span>" : "") + "</div>" +
    '<p class="muted" style="max-width:640px;white-space:pre-line">' + esc(g.desc) + "</p>" +
    '<div class="dls">' + dl + '<button class="btn ghost" id="share" type="button">Ulashish</button></div>' +
    (sys ? '<h2 style="margin-top:32px;font-size:22px">Tizim talablari</h2><div class="sys">' + sys + "</div>" : "") + upd +
    (shots ? '<h2 style="margin-top:40px">Skrinshotlar</h2><div class="shots">' + shots + "</div>" : "") +
    (g.changelog ? '<h2 style="margin-top:40px">Versiyalar tarixi</h2><p class="log">' + esc(g.changelog) + "</p>" : "") + '<div id="rev"></div>');
  if (auth) auth.onAuthStateChanged(loadReviews); else loadReviews();
}).catch(function () { put('<p class="muted">Yuklab bo\'lmadi.</p>'); });

document.addEventListener("click", function (e) {
  const s = e.target.closest(".shot");
  if (s) { $("zimg").src = s.querySelector("img").src; $("zoom").showModal(); return; }
  const sh = e.target.closest("#share");
  if (sh) {
    if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(function () {});
    else if (navigator.clipboard) { navigator.clipboard.writeText(location.href); sh.textContent = t("Nusxalandi!"); }
  }
});
$("zc").addEventListener("click", function () { $("zoom").close(); });

// ====== Sharhlar ======
function stars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }
function loadReviews() {
  if (!db || !$("rev")) return;
  db.collection("reviews").where("gameId", "==", gid).get().then(function (s) {
    const rs = s.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
      .sort(function (a, b) { return (b.created ? b.created.seconds : 9e9) - (a.created ? a.created.seconds : 9e9); });
    const avg = rs.length ? (rs.reduce(function (x, r) { return x + r.stars; }, 0) / rs.length).toFixed(1) : "";
    const me = auth && auth.currentUser;
    $("rev").innerHTML = '<h2 style="margin-top:40px">Sharhlar' + (avg ? ' <small class="muted">★ ' + avg + " (" + rs.length + ")</small>" : "") + "</h2>" +
      rs.map(function (r) {
        const own = me && (me.uid === r.uid || ADMIN_EMAILS.includes(me.email));
        return '<div class="post" style="margin-bottom:12px"><time>' + esc(r.name) + " · " + stars(r.stars) + "</time><p>" + esc(r.text) + "</p>" +
          (own ? '<button class="del" data-rid="' + r.id + '" style="margin-top:8px">O\'chirish</button>' : "") + "</div>";
      }).join("") +
      (me ? '<form id="rf"><select class="field" id="rs">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '">' + stars(n) + "</option>"; }).join("") +
        '</select><textarea class="field" id="rt" maxlength="500" required placeholder="Sharhingiz"></textarea><button class="btn primary sm">Yuborish</button></form>'
        : '<p class="muted">Sharh yozish uchun saytda hisobingizga kiring.</p>');
  }).catch(function () {});
}
document.addEventListener("click", function (e) {
  const b = e.target.closest("[data-rid]");
  if (b && confirm("O'chirilsinmi?")) db.collection("reviews").doc(b.dataset.rid).delete().then(loadReviews);
});
document.addEventListener("submit", function (e) {
  if (e.target.id !== "rf") return;
  e.preventDefault();
  const u = auth.currentUser;
  db.collection("reviews").doc(gid + "_" + u.uid).set({
    gameId: gid, uid: u.uid, name: u.email.split("@")[0].slice(0, 20), stars: +$("rs").value, text: $("rt").value.trim(),
    created: firebase.firestore.FieldValue.serverTimestamp(),
  }).then(loadReviews).catch(function (x) { alert("Xatolik: " + (x.code || x.message)); });
});
