// ====== SOZLAMALAR: havolalarni shu yerda o'zgartiring ======
const LINKS = {
  telegram: "https://t.me/PixelCoreStudio",
  instagram: "https://www.instagram.com/esalimniyazov?igsh=MWx1YW14anFrenczOQ==",
  support: "https://t.me/esalimniyazov",
};
document.querySelectorAll("[data-link]").forEach(function (a) {
  a.href = LINKS[a.dataset.link];
});

// Yil
document.getElementById("year").textContent = new Date().getFullYear();

// Navigatsiya fon
const nav = document.getElementById("nav");
addEventListener("scroll", function () {
  nav.classList.toggle("solid", scrollY > 20);
}, { passive: true });

// Sichqoncha ortidan yorug'lik
const glow = document.getElementById("glow");
addEventListener("pointermove", function (e) {
  glow.style.left = e.clientX + "px";
  glow.style.top = e.clientY + "px";
});

// Bo'lim sarlavhalari
const io = new IntersectionObserver(function (items) {
  items.forEach(function (it) { if (it.isIntersecting) it.target.classList.add("in"); });
}, { threshold: 0.3 });
document.querySelectorAll(".sec").forEach(function (s) { io.observe(s); });

// Kartalar: yengil 3D egilish
function bindTilt(card) {
  card.addEventListener("pointermove", function (e) {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = "perspective(700px) rotateY(" + x * 7 + "deg) rotateX(" + -y * 7 + "deg)";
  });
  card.addEventListener("pointerleave", function () { card.style.transform = ""; });
}
document.querySelectorAll(".tilt").forEach(bindTilt);

// Logotip: bosilganda aylanadi
const logoBtn = document.getElementById("logoBtn");
logoBtn.addEventListener("click", function () {
  logoBtn.classList.toggle("spin");
});

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
const factEl = document.getElementById("fact");
document.getElementById("next").addEventListener("click", function () {
  factEl.classList.add("out");
  setTimeout(function () {
    fi = (fi + 1) % facts.length;
    factEl.textContent = facts[fi];
    factEl.classList.remove("out");
  }, 250);
});

// ====== Hisob (Firebase Auth) ======
const $ = function (id) { return document.getElementById(id); };
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

// ====== Qidiruv va filtr ======
function applyFilter() {
  const q = $("q").value.trim().toLowerCase(), f = $("flt").value;
  document.querySelectorAll("#games .card").forEach(function (c) {
    const hay = (c.dataset.name || c.textContent).toLowerCase();
    c.hidden = !((!q || hay.includes(q)) && (f === "fav" ? favs.includes(c.dataset.id) : (!f || c.dataset.status === f)));
  });
}
$("q").addEventListener("input", applyFilter);
$("flt").addEventListener("change", applyFilter);

// ====== Press-kit: logotipni SVG qilib yuklab olish ======
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

// ====== O'yinlar va yangiliklar (Firestore) ======
function gameCard(id, g) {
  const soon = g.status === "Tez orada";
  let left = "";
  if (soon && g.releaseDate) {
    const d = Math.ceil((new Date(g.releaseDate) - Date.now()) / 864e5);
    if (d > 0) left = "<span>" + d + " " + t("kun qoldi") + "</span>";
  }
  return '<article class="card tilt' + (soon ? " soon" : "") + '" data-id="' + id + '" data-status="' + esc(g.status) + '" data-name="' + esc((g.title + " " + g.desc).toLowerCase()) + '">' +
    '<button class="fav" data-id="' + id + '" aria-label="Sevimli">♡</button><div class="icon">' + (g.icon ? '<img src="' + esc(safeUrl(g.icon)) + '" alt="">' : esc(g.title.slice(0, 2).toUpperCase())) + "</div>" +
    "<h3>" + esc(g.title) + "</h3><p>" + esc(g.desc) + '</p><div class="tags"><span>Android</span><span>' + esc(g.status) + "</span>" +
    (g.version ? "<span>" + esc(g.version) + "</span>" : "") + left + (g.downloads ? "<span>" + g.downloads + " " + t("yuklash") + "</span>" : "") + "</div>" +
    '<div class="row"><a class="btn ' + (soon ? "ghost" : "primary dl") + ' sm" data-id="' + id + '" href="' + esc(safeUrl(g.link || LINKS.telegram)) +
    '" target="_blank" rel="noopener">' + (soon ? "Xabar olish" : "Yuklab olish") + '</a><a class="btn ghost sm" href="app.html?id=' + id + '">Batafsil</a></div></article>';
}
if (db) {
  db.collection("games").orderBy("created", "desc").get().then(function (s) {
    if (s.empty) return;
    const box = $("games");
    box.innerHTML = s.docs.map(function (d) { return gameCard(d.id, d.data()); }).join("");
    box.querySelectorAll(".tilt").forEach(bindTilt);
    applyFilter(); paintFavs();
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

// ====== Pixel o'yini va natijalar jadvali ======
const cells = []; let on = -1, score = 0, left = 0, tm = null;
for (let i = 0; i < 25; i++) {
  const b = document.createElement("button");
  b.className = "cell"; b.setAttribute("aria-label", "piksel");
  $("board").appendChild(b); cells.push(b);
}
function light() {
  if (on >= 0) cells[on].classList.remove("on");
  let n; do { n = Math.floor(Math.random() * 25); } while (n === on);
  on = n; cells[n].classList.add("on");
}
$("board").addEventListener("pointerdown", function (e) {
  const i = cells.indexOf(e.target);
  if (!tm || i !== on) return;
  score++; $("score").textContent = score; light();
});
$("start").addEventListener("click", function () {
  if (tm) return;
  score = 0; left = 15; $("score").textContent = 0; $("time").textContent = left; $("pmsg").textContent = ""; light();
  tm = setInterval(function () { left--; $("time").textContent = left; if (left <= 0) finish(); }, 1000);
});
function finish() {
  clearInterval(tm); tm = null; cells[on].classList.remove("on"); on = -1; saveScore();
}
function saveScore() {
  const u = auth && auth.currentUser;
  if (!db || score < 1) return;
  if (!u) { $("pmsg").textContent = "Natijani saqlash uchun hisobga kiring."; return; }
  const ref = db.collection("scores").doc(u.uid);
  ref.get().then(function (d) {
    if (!d.exists) return ref.set({ name: u.email.split("@")[0].slice(0, 20), score: score, created: firebase.firestore.FieldValue.serverTimestamp() });
    if (score > d.data().score) return ref.update({ score: score });
  }).then(loadTop).catch(function () {});
}
function loadTop() {
  if (!db) return;
  db.collection("scores").orderBy("score", "desc").limit(10).get().then(function (s) {
    if (s.empty) return;
    $("top").innerHTML = s.docs.map(function (d) { return "<li><b>" + esc(d.data().name) + "</b> — " + d.data().score + "</li>"; }).join("");
  }).catch(function () {});
}
loadTop();
