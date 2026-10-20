const $ = function (id) { return document.getElementById(id); };
const edit = { games: null, news: null }, cache = { games: {}, news: {} };

if (!auth) {
  $("gate").textContent = "Firebase hali sozlanmagan. SETUP.md ga qarang.";
} else {
  auth.onAuthStateChanged(async function (u) {
    $("panel").hidden = true; $("gate").hidden = false;
    if (!u) { $("gate").innerHTML = 'Avval <a href="index.html" style="text-decoration:underline">saytda</a> hisobingizga kiring.'; return; }
    await u.reload(); await u.getIdToken(true);
    const me = auth.currentUser;
    if (!ADMIN_EMAILS.includes(me.email)) { $("gate").textContent = "Bu hisob admin emas."; return; }
    if (!me.emailVerified) { $("gate").textContent = "Emailingizni tasdiqlang (pochtangizga xat yuborilgan), so'ng sahifani yangilang."; return; }
    $("gate").hidden = true; $("panel").hidden = false; load();
  });
}

function list(col, el, label, noEdit) {
  db.collection(col).orderBy("created", "desc").get().then(function (s) {
    cache[col] = {};
    $(el).innerHTML = s.docs.map(function (x) {
      cache[col][x.id] = x.data();
      const a = 'data-col="' + col + '" data-id="' + x.id + '"';
      return '<div class="item"><span>' + esc(label(x.data())) + '</span><span>' + (noEdit ? "" : '<button class="del ed" ' + a + '>Tahrirlash</button> ') + '<button class="del" ' + a + '>O\'chirish</button></span></div>';
    }).join("") || '<p class="muted">Hali yo\'q.</p>';
  });
}
function load() {
  list("games", "gList", function (d) { return d.title + " (" + d.status + ")"; });
  list("news", "nList", function (d) { return d.title; });
  list("reviews", "rList", function (d) { return d.name + " (" + d.stars + "/5): " + d.text; }, true);
  list("feedback", "fList", function (d) { return "[" + d.type + "] " + d.email + ": " + d.text; }, true);
  stats();
}

function reset(col) {
  const g = col === "games";
  $(g ? "gameForm" : "newsForm").reset(); edit[col] = null;
  $(g ? "gCancel" : "nCancel").hidden = true;
  $(g ? "gSubmit" : "nSubmit").textContent = g ? "Qo'shish" : "E'lon qilish";
}
function startEdit(col, id) {
  const d = cache[col][id]; if (!d) return;
  edit[col] = id;
  if (col === "games") {
    $("gTitle").value = d.title || ""; $("gDesc").value = d.desc || ""; $("gVer").value = d.version || "";
    $("gLink").value = d.link || ""; $("gStatus").value = d.status || "Chiqarilgan"; $("gIcon").value = d.icon || "";
    $("gShots").value = (d.shots || []).join("\n"); $("gChange").value = d.changelog || ""; $("gDate").value = d.releaseDate || "";
    $("gSubmit").textContent = "Saqlash"; $("gCancel").hidden = false; $("gameForm").scrollIntoView({ behavior: "smooth" });
  } else {
    $("nTitle").value = d.title || ""; $("nText").value = d.text || "";
    $("nSubmit").textContent = "Saqlash"; $("nCancel").hidden = false; $("newsForm").scrollIntoView({ behavior: "smooth" });
  }
}
document.addEventListener("click", async function (e) {
  const b = e.target.closest(".del"); if (!b) return;
  if (b.classList.contains("ed")) return startEdit(b.dataset.col, b.dataset.id);
  if (!confirm("O'chirilsinmi?")) return;
  await db.collection(b.dataset.col).doc(b.dataset.id).delete(); load();
});
$("gCancel").addEventListener("click", function () { reset("games"); });
$("nCancel").addEventListener("click", function () { reset("news"); });

async function save(e, col, errId, get) {
  e.preventDefault(); $(errId).textContent = "";
  const data = get();
  try {
    if (edit[col]) await db.collection(col).doc(edit[col]).update(data);
    else await db.collection(col).add(Object.assign(data, { created: firebase.firestore.FieldValue.serverTimestamp() }));
    reset(col); load();
  } catch (x) {
    $(errId).textContent = x.code === "permission-denied" ? "Ruxsat yo'q: Firestore qoidalarini tekshiring." : "Xatolik: " + x.message;
  }
}
$("gameForm").addEventListener("submit", function (e) {
  save(e, "games", "gErr", function () {
    return {
      title: $("gTitle").value.trim(), desc: $("gDesc").value.trim(), version: $("gVer").value.trim(), link: $("gLink").value.trim(),
      status: $("gStatus").value, icon: $("gIcon").value.trim(), releaseDate: $("gDate").value,
      shots: $("gShots").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean), changelog: $("gChange").value.trim(),
    };
  });
});
$("newsForm").addEventListener("submit", function (e) {
  save(e, "news", "nErr", function () { return { title: $("nTitle").value.trim(), text: $("nText").value.trim() }; });
});

function stats() {
  Promise.all(["games", "news", "users", "reviews", "feedback"].map(function (c) { return db.collection(c).get(); })).then(function (r) {
    let dl = 0; r[0].forEach(function (d) { dl += d.data().downloads || 0; });
    const items = [["O'yinlar", r[0].size], ["Yuklashlar", dl], ["Foydalanuvchilar", r[2].size], ["Sharhlar", r[3].size], ["Fikrlar", r[4].size], ["Yangiliklar", r[1].size]];
    $("stats").innerHTML = items.map(function (i) { return '<div class="stat"><b>' + i[1] + "</b><span>" + i[0] + "</span></div>"; }).join("");
  }).catch(function () {});
}
