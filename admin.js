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
  $(g ? "gameForm" : "newsForm").reset(); edit[col] = null; if (g) { setIcon(""); shotsData = []; renderShots(); }
  $(g ? "gCancel" : "nCancel").hidden = true;
  $(g ? "gSubmit" : "nSubmit").textContent = g ? "Qo'shish" : "E'lon qilish";
}
function startEdit(col, id) {
  const d = cache[col][id]; if (!d) return;
  edit[col] = id;
  if (col === "games") {
    $("gTitle").value = d.title || ""; $("gDesc").value = d.desc || ""; $("gVer").value = d.version || "";
    $("gLink").value = d.link || ""; $("gStatus").value = d.status || "Chiqarilgan"; setIcon(d.icon || "");
    loadShots(id); $("gChange").value = d.changelog || ""; $("gDate").value = d.releaseDate || "";
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

async function save(e, col, errId, get, after) {
  e.preventDefault(); $(errId).textContent = "";
  const data = get();
  try {
    let id = edit[col];
    if (id) await db.collection(col).doc(id).update(data);
    else id = (await db.collection(col).add(Object.assign(data, { created: firebase.firestore.FieldValue.serverTimestamp() }))).id;
    if (after) await after(id);
    reset(col); load();
  } catch (x) {
    $(errId).textContent = x.code === "permission-denied" ? "Ruxsat yo'q: Firestore qoidalarini tekshiring." : "Xatolik: " + x.message;
  }
}
$("gameForm").addEventListener("submit", function (e) {
  if (shotsData.join("").length > 900000) { e.preventDefault(); $("gErr").textContent = "Skrinshotlar hajmi katta, kamroq rasm tanlang."; return; }
  save(e, "games", "gErr", function () {
    return {
      title: $("gTitle").value.trim(), desc: $("gDesc").value.trim(), version: $("gVer").value.trim(), link: $("gLink").value.trim(),
      status: $("gStatus").value, icon: iconData, releaseDate: $("gDate").value, changelog: $("gChange").value.trim(),
    };
  }, function (id) { return db.collection("shots").doc(id).set({ list: shotsData }); });
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

// ====== Rasm yuklash: brauzerda siqiladi va ma'lumotlar bazasiga yoziladi ======
let iconData = "", shotsData = [];
function loadImg(file) {
  return new Promise(function (res, rej) {
    const r = new FileReader();
    r.onload = function () { const i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
async function shrink(file, max, type, q, square) {
  const img = await loadImg(file), c = document.createElement("canvas"), x = c.getContext("2d");
  if (square) {
    const m = Math.min(img.width, img.height);
    c.width = c.height = max;
    x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, max, max);
  } else {
    const k = Math.min(1, max / Math.max(img.width, img.height));
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(img, 0, 0, c.width, c.height);
  }
  return c.toDataURL(type, q);
}
function setIcon(v) { iconData = v; const p = $("gIconPrev"); p.src = v || ""; p.hidden = !v; }
function renderShots() {
  $("gShotPrev").innerHTML = shotsData.map(function (s, i) {
    return '<span class="thumb"><img src="' + s + '" alt=""><button type="button" data-rm="' + i + '">×</button></span>';
  }).join("");
}
function loadShots(id) {
  shotsData = []; renderShots();
  db.collection("shots").doc(id).get().then(function (s) { shotsData = (s.exists && s.data().list) || []; renderShots(); }).catch(function () {});
}
$("gIconFile").addEventListener("change", async function (e) {
  const f = e.target.files[0];
  if (f) setIcon(await shrink(f, 192, "image/png", 0.92, true));
});
$("gShotFile").addEventListener("change", async function (e) {
  for (const f of e.target.files) {
    if (shotsData.length >= 6) break;
    shotsData.push(await shrink(f, 1000, "image/jpeg", 0.72, false));
  }
  renderShots(); e.target.value = "";
});
document.addEventListener("click", function (e) {
  const b = e.target.closest("[data-rm]");
  if (b) { shotsData.splice(+b.dataset.rm, 1); renderShots(); }
});