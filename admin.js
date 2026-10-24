const $ = function (id) { return document.getElementById(id); };
const edit = { games: null, news: null }, cache = { games: {}, news: {} };
let iconData = "", shots = [], removed = [], tt = null;

// Admin uchun xabarnoma: muvaffaqiyat (yashil) yoki xato (qizil)
function toast(msg, ok) {
  const el = $("toast");
  el.textContent = msg; el.className = "toast " + (ok ? "ok" : "err"); el.hidden = false;
  clearTimeout(tt); tt = setTimeout(function () { el.hidden = true; }, ok ? 4500 : 9000);
}
function why(x) {
  const m = {
    "permission-denied": "ruxsat yo'q (Firestore qoidalarida images qatori yo'q yoki email mos emas)",
    unavailable: "internet yoki Firebase bilan aloqa yo'q",
    "resource-exhausted": "Firebase limiti tugagan",
    "invalid-argument": "ma'lumot noto'g'ri yoki juda katta",
  };
  return m[x.code] || x.code || x.message;
}

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
  }).catch(function (x) { toast("✕ Ro'yxatni yuklab bo'lmadi: " + why(x), false); });
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
  if (g) { setIcon(""); shots = []; removed = []; renderShots(); }
}
function startEdit(col, id) {
  const d = cache[col][id]; if (!d) return;
  edit[col] = id;
  if (col === "games") {
    const L = d.links || {};
    $("gTitle").value = d.title || ""; $("gDesc").value = d.desc || ""; $("gVer").value = d.version || "";
    $("gStatus").value = d.status || "Chiqarilgan"; $("gDate").value = d.releaseDate || ""; $("gChange").value = d.changelog || "";
    $("gAndroid").value = L.android || d.link || ""; $("gWindows").value = L.windows || ""; $("gMac").value = L.mac || "";
    const S = d.sizes || {}, Q = d.reqs || {};
    $("gAndroidSize").value = S.android || ""; $("gWindowsSize").value = S.windows || ""; $("gMacSize").value = S.mac || "";
    $("gAndroidReq").value = Q.android || ""; $("gWindowsReq").value = Q.windows || ""; $("gMacReq").value = Q.mac || "";
    $("gFeat").checked = !!d.featured;
    setIcon(d.icon || ""); loadShots(id);
    $("gSubmit").textContent = "Saqlash"; $("gCancel").hidden = false; $("gameForm").scrollIntoView({ behavior: "smooth" });
  } else {
    $("nTitle").value = d.title || ""; $("nText").value = d.text || "";
    $("nSubmit").textContent = "Saqlash"; $("nCancel").hidden = false; $("newsForm").scrollIntoView({ behavior: "smooth" });
  }
}
document.addEventListener("click", async function (e) {
  const b = e.target.closest(".del"); if (!b) return;
  const col = b.dataset.col, id = b.dataset.id;
  if (b.classList.contains("ed")) return startEdit(col, id);
  if (!confirm("O'chirilsinmi?")) return;
  try {
    if (col === "games") {
      const s = await db.collection("images").where("gameId", "==", id).get();
      const bt = db.batch(); s.forEach(function (d) { bt.delete(d.ref); }); await bt.commit();
    }
    await db.collection(col).doc(id).delete();
    toast("✓ O'chirildi", true); load();
  } catch (x) { toast("✕ O'chirilmadi: " + why(x), false); }
});
$("gCancel").addEventListener("click", function () { reset("games"); });
$("nCancel").addEventListener("click", function () { reset("news"); });

// ====== O'yin saqlash ======
async function saveShots(id) {
  if (!shots.length && !removed.length) return;
  const bt = db.batch(), col = db.collection("images");
  removed.forEach(function (r) { bt.delete(col.doc(r)); });
  shots.forEach(function (s, i) {
    if (s.id) bt.update(col.doc(s.id), { n: i });
    else bt.set(col.doc(), { gameId: id, n: i, data: s.data });
  });
  await bt.commit();
}
$("gameForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const editing = !!edit.games, btn = $("gSubmit");
  const data = {
    title: $("gTitle").value.trim(), desc: $("gDesc").value.trim(), version: $("gVer").value.trim(), status: $("gStatus").value,
    releaseDate: $("gDate").value, changelog: $("gChange").value.trim(), icon: iconData, link: "",
    links: { android: $("gAndroid").value.trim(), windows: $("gWindows").value.trim(), mac: $("gMac").value.trim() },
    sizes: { android: $("gAndroidSize").value.trim(), windows: $("gWindowsSize").value.trim(), mac: $("gMacSize").value.trim() },
    reqs: { android: $("gAndroidReq").value.trim(), windows: $("gWindowsReq").value.trim(), mac: $("gMacReq").value.trim() },
    featured: $("gFeat").checked, updated: firebase.firestore.FieldValue.serverTimestamp(),
  };
  btn.disabled = true;
  let id = edit.games;
  try {
    if (editing) await db.collection("games").doc(id).update(data);
    else id = (await db.collection("games").add(Object.assign(data, { created: firebase.firestore.FieldValue.serverTimestamp() }))).id;
  } catch (x) {
    toast("✕ " + (editing ? "O'yin yangilanmadi: " : "O'yin qo'shilmadi: ") + why(x), false); btn.disabled = false; return;
  }
  try { await saveShots(id); } catch (x) {
    edit.games = id; btn.textContent = "Saqlash"; $("gCancel").hidden = false; btn.disabled = false; load();
    toast("⚠ O'yin saqlandi, lekin rasmlar saqlanmadi: " + why(x) + ". Qayta \"Saqlash\" bosing.", false); return;
  }
  toast("✓ " + (editing ? "O'yin yangilandi: " : "O'yin qo'shildi: ") + data.title, true);
  reset("games"); load(); btn.disabled = false;
});

// ====== Yangilik saqlash ======
$("newsForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const editing = !!edit.news, data = { title: $("nTitle").value.trim(), text: $("nText").value.trim() };
  try {
    if (editing) await db.collection("news").doc(edit.news).update(data);
    else await db.collection("news").add(Object.assign(data, { created: firebase.firestore.FieldValue.serverTimestamp() }));
    toast("✓ " + (editing ? "Yangilik yangilandi: " : "Yangilik e'lon qilindi: ") + data.title, true);
    reset("news"); load();
  } catch (x) { toast("✕ Yangilik saqlanmadi: " + why(x), false); }
});

function stats() {
  Promise.all(["games", "news", "users", "reviews", "feedback"].map(function (c) { return db.collection(c).get(); })).then(function (r) {
    let dl = 0; r[0].forEach(function (d) { dl += d.data().downloads || 0; });
    const items = [["O'yinlar", r[0].size], ["Yuklashlar", dl], ["Foydalanuvchilar", r[2].size], ["Sharhlar", r[3].size], ["Fikrlar", r[4].size], ["Yangiliklar", r[1].size]];
    $("stats").innerHTML = items.map(function (i) { return '<div class="stat"><b>' + i[1] + "</b><span>" + i[0] + "</span></div>"; }).join("");
  }).catch(function () {});
}

// ====== Rasmlar: brauzerda siqiladi, har biri alohida hujjatga yoziladi ======
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
  $("gShotPrev").innerHTML = shots.map(function (s, i) {
    return '<span class="thumb"><img src="' + s.data + '" alt=""><button type="button" data-rm="' + i + '">×</button></span>';
  }).join("");
}
function loadShots(id) {
  shots = []; removed = []; renderShots();
  db.collection("images").where("gameId", "==", id).get().then(function (s) {
    shots = s.docs.map(function (d) { return { id: d.id, n: d.data().n || 0, data: d.data().data }; }).sort(function (a, b) { return a.n - b.n; });
    renderShots();
  }).catch(function (x) { toast("✕ Rasmlarni yuklab bo'lmadi: " + why(x), false); });
}
$("gIconFile").addEventListener("change", async function (e) {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try { setIcon(await shrink(f, 192, "image/png", 0.92, true)); }
  catch (x) { toast("✕ Ikonkani o'qib bo'lmadi (JPG, PNG yoki WebP tanlang)", false); }
});
$("gShotFile").addEventListener("change", async function (e) {
  const files = Array.from(e.target.files); e.target.value = "";
  for (const f of files) {
    if (shots.length >= 8) { toast("Ko'pi bilan 8 ta rasm qo'shish mumkin", false); break; }
    try {
      let d = await shrink(f, 1000, "image/jpeg", 0.72, false);
      if (d.length > 600000) d = await shrink(f, 800, "image/jpeg", 0.6, false);
      shots.push({ data: d });
    } catch (x) { toast("✕ \"" + f.name + "\" rasmini o'qib bo'lmadi (JPG, PNG yoki WebP tanlang)", false); }
  }
  renderShots();
});
document.addEventListener("click", function (e) {
  const b = e.target.closest("[data-rm]"); if (!b) return;
  const i = +b.dataset.rm;
  if (shots[i] && shots[i].id) removed.push(shots[i].id);
  shots.splice(i, 1); renderShots();
});
