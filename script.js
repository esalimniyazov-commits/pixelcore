// Havolalar links.js faylida (LINKS). Firebase kalitlari firebase.js faylida.
const $ = function (id) { return document.getElementById(id); };
function safeUrl(u) { return /^(https?:\/\/|data:image\/(png|jpe?g|webp);base64,)/.test(u) ? u : "#"; }
document.querySelectorAll("[data-link]").forEach(function (a) { a.href = LINKS[a.dataset.link]; });
$("year").textContent = new Date().getFullYear();

// Navigatsiya fon
const nav = $("nav");
addEventListener("scroll", function () { nav.classList.toggle("solid", scrollY > 20); }, { passive: true });

// Sichqoncha ortidan yorug'lik
const glow = $("glow");
addEventListener("pointermove", function (e) { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; });

// Bo'lim sarlavhalari
const io = new IntersectionObserver(function (items) {
  items.forEach(function (it) { if (it.isIntersecting) it.target.classList.add("in"); });
}, { threshold: 0.3 });
document.querySelectorAll(".sec").forEach(function (s) { io.observe(s); });

// Kartalar: yengil 3D egilish
function bindTilt(card) {
  card.addEventListener("pointermove", function (e) {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = "perspective(700px) rotateY(" + x * 7 + "deg) rotateX(" + -y * 7 + "deg)";
  });
  card.addEventListener("pointerleave", function () { card.style.transform = ""; });
}
document.querySelectorAll(".tilt").forEach(bindTilt);

// Logotip aylanishi
$("logoBtn").addEventListener("click", function () { $("logoBtn").classList.toggle("spin"); });

// Qiziqarli faktlar
const facts = [
  "Piksel — rasmning eng kichik bo'lagi. Ekrandagi har bir o'yin millionlab pikseldan tuzilgan.",
  "Birinchi mashhur video o'yin Pong 1972 yilda chiqqan va unda faqat ikkita tayoqcha va bitta to'p bor edi.",
  "Tetris'ni 1984 yilda Moskvada Aleksey Pajitnov yaratgan.",
  "Android telefonlarda minglab turli ekran o'lchamlari bor, shuning uchun ilovalar hamma ekranga moslanishi kerak.",
  "IQ testi tez fikrlashni o'lchaydi, lekin bilim va tajribani emas.",
  "Eng kichik o'yinlar ham yaxshi o'ylangan bo'lsa, katta o'yinlardan ko'proq yoqishi mumkin.",
];
let fi = 0;
$("next").addEventListener("click", function () {
  $("fact").classList.add("out");
  setTimeout(function () { fi = (fi + 1) % facts.length; $("fact").textContent = facts[fi]; $("fact").classList.remove("out"); }, 250);
});

// ====== Hisob (Firebase Auth) ======
const dlg = $("authDlg");
let mode = "login";
$("account").addEventListener("click", function () { dlg.showModal(); });
$("closeDlg").addEventListener("click", function () { dlg.close(); });
document.querySelectorAll(".seg button").forEach(function (b) {
  b.addEventListener("click", function () {
    mode = b.dataset.mode;
    document.querySelectorAll(".seg button").forEach(function (x) { x.classList.toggle("on", x === b); });
    $("authSubmit").textContent = mode === "login" ? "Kirish" : "Ro'yxatdan o'tish";
    $("authErr").textContent = "";
  });
});
const authMsg = {
  "auth/invalid-credential": "Email yoki parol noto'g'ri.",
  "auth/email-already-in-use": "Bu email allaqachon ro'yxatdan o'tgan.",
  "auth/weak-password": "Parol kamida 6 ta belgidan iborat bo'lsin.",
  "auth/invalid-email": "Email noto'g'ri yozilgan.",
};
$("authForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!auth) { $("authErr").textContent = "Firebase hali sozlanmagan (SETUP.md ga qarang)."; return; }
  try {
    if (mode === "login") await auth.signInWithEmailAndPassword($("email").value, $("pass").value);
    else {
      const c = await auth.createUserWithEmailAndPassword($("email").value, $("pass").value);
      await c.user.sendEmailVerification();
    }
    $("authForm").reset(); $("authErr").textContent = ""; dlg.close();
  } catch (ex) { $("authErr").textContent = authMsg[ex.code] || "Xatolik: " + ex.code; }
});
$("logout").addEventListener("click", function () { auth.signOut(); dlg.close(); });
if (auth) auth.onAuthStateChanged(function (u) {
  $("guest").hidden = !!u; $("member").hidden = !u;
  $("account").textContent = u ? u.email.split("@")[0] : "Kirish";
  if (u) { onLogin(u); $("who").textContent = u.email; $("adminLink").hidden = !ADMIN_EMAILS.includes(u.email); }
});

// ====== Qidiruv va filtr (holat va platforma bo'yicha) ======
function applyFilter() {
  const q = $("q").value.trim().toLowerCase(), f = $("flt").value, pf = $("plat").value;
  document.querySelectorAll("#games .card").forEach(function (c) {
    const hay = (c.dataset.name || c.textContent).toLowerCase();
    const okF = f === "fav" ? favs.includes(c.dataset.id) : (!f || c.dataset.status === f);
    const okP = !pf || (c.dataset.plat || "").split(" ").includes(pf);
    c.hidden = !((!q || hay.includes(q)) && okF && okP);
  });
}
$("q").addEventListener("input", applyFilter);
$("flt").addEventListener("change", applyFilter);
$("plat").addEventListener("change", applyFilter);
$("sort").addEventListener("change", function () { renderGames(); });

// ====== Press-kit ======
const LOGO_PATH = "M0 0H262V272H0Z M83 83H248V157H150V255H83Z M295 0H555V272H295Z M472 83H307V157H405V255H472Z M0 297H262V555H0Z M83 472H248V398H150V300H83Z M295 297H555V555H295Z M472 472H307V398H405V300H472Z";
document.querySelectorAll("[data-kit]").forEach(function (b) {
  b.addEventListener("click", function () {
    const p = b.dataset.kit.split(",");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 555 555"><path fill="' + p[0] + '" fill-rule="evenodd" d="' + LOGO_PATH + '"/><circle cx="278" cy="279" r="65" fill="' + p[1] + '"/></svg>';
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = p[2] + ".svg"; a.click();
  });
});

// ====== PWA ======
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(function () {});
}

// ====== Kartalar (Firestore) ======
const PLAT = [["android", "Android"], ["windows", "Windows"], ["mac", "macOS"]];
function gameCard(id, g) {
  const soon = g.status === "Tez orada", Lk = g.links || {};
  const L = { android: Lk.android || g.link || "", windows: Lk.windows || "", mac: Lk.mac || "" };
  const have = PLAT.filter(function (p) { return L[p[0]]; });
  let note = "";
  if (soon && g.releaseDate) {
    const d = Math.ceil((new Date(g.releaseDate) - Date.now()) / 864e5);
    if (d > 0) note = "<span>" + d + " " + t("kun qoldi") + "</span>";
  } else if (g.created && g.created.toMillis && Date.now() - g.created.toMillis() < 14 * 864e5) note = "<span>" + t("Yangi") + "</span>";
  if (g.featured) note = "<span>★ " + t("Tavsiya etiladi") + "</span>" + note;
  const btns = soon
    ? '<a class="btn ghost sm" href="' + esc(LINKS.telegram) + '" target="_blank" rel="noopener">' + t("Xabar olish") + "</a>"
    : have.map(function (p) { return '<a class="btn primary sm dl" data-id="' + id + '" href="' + esc(safeUrl(L[p[0]])) + '" target="_blank" rel="noopener">↓ ' + p[1] + "</a>"; }).join("");
  return '<article class="card tilt mini' + (soon ? " soon" : "") + '" data-id="' + id + '" data-status="' + esc(g.status) + '" data-plat="' + have.map(function (p) { return p[0]; }).join(" ") +
    '" data-name="' + esc((g.title + " " + g.desc).toLowerCase()) + '"><button class="fav" data-id="' + id + '" aria-label="Sevimli">♡</button>' +
    '<div class="icon">' + (g.icon ? '<img src="' + esc(safeUrl(g.icon)) + '" alt="">' : esc(g.title.slice(0, 2).toUpperCase())) + "</div>" +
    "<h3>" + esc(g.title) + "</h3>" + (note ? '<div class="tags">' + note + "</div>" : "") +
    '<div class="row">' + btns + '<a class="btn ghost sm" href="app.html?id=' + id + '">' + t("Batafsil") + "</a></div></article>";
}
let GAMES = [];
function ms(x) { return x && x.toMillis ? x.toMillis() : 0; }
function dlBtns(id, g) {
  const Lk = g.links || {}, L = { android: Lk.android || g.link || "", windows: Lk.windows || "", mac: Lk.mac || "" };
  if (g.status === "Tez orada") return '<a class="btn ghost sm" href="' + esc(LINKS.telegram) + '" target="_blank" rel="noopener">' + t("Xabar olish") + "</a>";
  return PLAT.filter(function (p) { return L[p[0]]; }).map(function (p) {
    return '<a class="btn primary sm dl" data-id="' + id + '" href="' + esc(safeUrl(L[p[0]])) + '" target="_blank" rel="noopener">↓ ' + p[1] + "</a>";
  }).join("");
}
// Bosh sahifadagi katta banner: "Tavsiya etiladi" o'yin, bo'lmasa eng yangi chiqarilgani
function renderFeat() {
  const el = $("feat"), pool = GAMES.filter(function (o) { return o.g.featured; });
  const list = (pool.length ? pool : GAMES.filter(function (o) { return o.g.status !== "Tez orada"; }))
    .sort(function (x, y) { return (ms(y.g.updated) || ms(y.g.created)) - (ms(x.g.updated) || ms(x.g.created)); });
  if (!list.length) { el.hidden = true; return; }
  const o = list[0], g = o.g;
  el.innerHTML = '<div class="icon">' + (g.icon ? '<img src="' + esc(safeUrl(g.icon)) + '" alt="">' : esc(g.title.slice(0, 2).toUpperCase())) + "</div>" +
    '<div class="ft"><span class="badge">' + t(g.featured ? "Tavsiya etiladi" : "Yangi") + "</span><h3>" + esc(g.title) + "</h3><p>" + esc((g.desc || "").slice(0, 150)) +
    '</p><div class="row">' + dlBtns(o.id, g) + '<a class="btn ghost sm" href="app.html?id=' + o.id + '">' + t("Batafsil") + "</a></div></div>";
  el.hidden = false;
}
function renderGames() {
  const k = $("sort").value, a = GAMES.slice();
  a.sort(function (x, y) {
    if (k === "name") return x.g.title.localeCompare(y.g.title);
    if (k === "dl") return (y.g.downloads || 0) - (x.g.downloads || 0);
    if (k === "upd") return (ms(y.g.updated) || ms(y.g.created)) - (ms(x.g.updated) || ms(x.g.created));
    return ms(y.g.created) - ms(x.g.created);
  });
  const box = $("games");
  box.innerHTML = a.map(function (o) { return gameCard(o.id, o.g); }).join("");
  box.querySelectorAll(".tilt").forEach(bindTilt);
  renderFeat(); applyFilter(); paintFavs();
}
if (db) {
  db.collection("games").orderBy("created", "desc").get().then(function (s) {
    if (s.empty) return;
    GAMES = s.docs.map(function (d) { return { id: d.id, g: d.data() }; });
    renderGames();
  }).catch(function () {});
  db.collection("news").orderBy("created", "desc").limit(10).get().then(function (s) {
    if (s.empty) return;
    $("newsList").innerHTML = s.docs.map(function (d) {
      const n = d.data();
      return '<article class="post"><time>' + (n.created ? n.created.toDate().toLocaleDateString("en-GB") : "") +
        "</time><h3>" + esc(n.title) + "</h3><p>" + esc(n.text) + "</p></article>";
    }).join("");
  }).catch(function () {});
}

// ====== Sevimlilar ======
let favs = [];
try { favs = JSON.parse(localStorage.getItem("favs") || "[]"); } catch (e) {}
function saveFavs() {
  try { localStorage.setItem("favs", JSON.stringify(favs)); } catch (e) {}
  const u = auth && auth.currentUser;
  if (db && u) db.collection("users").doc(u.uid).set({ email: u.email, favs: favs }, { merge: true }).catch(function () {});
}
function paintFavs() {
  document.querySelectorAll(".fav").forEach(function (b) {
    const on = favs.includes(b.dataset.id);
    b.textContent = on ? "♥" : "♡"; b.classList.toggle("on", on);
  });
}
function onLogin(u) {
  if (!db) return;
  db.collection("users").doc(u.uid).get().then(function (d) {
    const r = (d.exists && d.data().favs) || [];
    favs = Array.from(new Set(favs.concat(r)));
    saveFavs(); paintFavs(); applyFilter();
  }).catch(function () {});
}
document.addEventListener("click", function (e) {
  const b = e.target.closest(".fav"); if (!b) return;
  const id = b.dataset.id;
  favs = favs.includes(id) ? favs.filter(function (x) { return x !== id; }) : favs.concat(id);
  saveFavs(); paintFavs();
  if ($("flt").value === "fav") applyFilter();
});

// ====== Fikr-mulohaza ======
$("fbForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const m = $("fbMsg"); m.textContent = "";
  if (!auth) { m.textContent = "Firebase hali sozlanmagan."; return; }
  if (!auth.currentUser) { m.textContent = "Yuborish uchun avval hisobga kiring."; dlg.showModal(); return; }
  try {
    await db.collection("feedback").add({ uid: auth.currentUser.uid, email: auth.currentUser.email, type: $("fbType").value, text: $("fbText").value.trim(), created: firebase.firestore.FieldValue.serverTimestamp() });
    e.target.reset(); m.textContent = "Rahmat! Xabaringiz yuborildi.";
  } catch (x) { m.textContent = "Xatolik: " + (x.code || x.message); }
});
