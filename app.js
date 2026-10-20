const $ = function (id) { return document.getElementById(id); };
const gid = new URLSearchParams(location.search).get("id");
function put(h) { $("app").innerHTML = h; }
if (!db || !gid) put('<p class="muted">Ilova topilmadi.</p>');
else db.collection("games").doc(gid).get().then(function (d) {
  if (!d.exists) return put('<p class="muted">Ilova topilmadi.</p>');
  const g = d.data(), soon = g.status === "Tez orada";
  document.title = g.title + " — PixelCore Studio";
  const shots = (g.shots || []).map(function (u) {
    return '<button class="shot" data-src="' + esc(safeUrl(u)) + '"><img loading="lazy" src="' + esc(safeUrl(u)) + '" alt="' + esc(g.title) + ' skrinshoti"></button>';
  }).join("");
  put('<div class="icon big">' + (g.icon ? '<img src="' + esc(safeUrl(g.icon)) + '" alt="">' : esc(g.title.slice(0, 2).toUpperCase())) + "</div>" +
    '<h1 class="ah">' + esc(g.title) + '</h1><div class="tags"><span>Android</span><span>' + esc(g.status) + "</span>" +
    (g.version ? "<span>" + esc(g.version) + "</span>" : "") + (g.downloads ? "<span>" + g.downloads + " " + t("yuklash") + "</span>" : "") + "</div>" +
    '<p class="muted" style="max-width:640px;white-space:pre-line">' + esc(g.desc) + "</p>" +
    (soon ? "" : '<a class="btn primary dl" data-id="' + gid + '" href="' + esc(safeUrl(g.link)) + '" target="_blank" rel="noopener">Yuklab olish</a>') +
    (shots ? '<h2 style="margin-top:40px">Skrinshotlar</h2><div class="shots">' + shots + "</div>" : "") +
    (g.changelog ? '<h2 style="margin-top:40px">Versiyalar tarixi</h2><p class="log">' + esc(g.changelog) + "</p>" : "") + '<div id="rev"></div>');
  if (auth) auth.onAuthStateChanged(loadReviews); else loadReviews();
}).catch(function () { put('<p class="muted">Yuklab bo\'lmadi.</p>'); });
document.addEventListener("click", function (e) {
  const s = e.target.closest(".shot");
  if (s) { $("zimg").src = s.dataset.src; $("zoom").showModal(); }
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
