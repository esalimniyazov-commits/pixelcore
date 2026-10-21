// ====== SOZLAMALAR: Firebase'dan olingan ma'lumotlarni shu yerga qo'ying (SETUP.md) ======
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyClr3ZX4QOL_7dQkqg27oQJdrlnVcskobc",
  authDomain: "pixelcore-96f17.firebaseapp.com",
  projectId: "pixelcore-96f17",
  appId: "1:380516908831:web:bccdfa893cd8d20ffc3a2a",
};
// Admin email(lar). Bu faqat tugmani ko'rsatish uchun; haqiqiy himoya Firestore qoidalarida.
const ADMIN_EMAILS = ["esalimniyazov@gmail.com"];

let auth = null, db = null;
if (FIREBASE_CONFIG.apiKey && typeof firebase !== "undefined") {
  firebase.initializeApp(FIREBASE_CONFIG);
  auth = firebase.auth();
  db = firebase.firestore();
}

// Matnni xavfsiz chiqarish
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function safeUrl(u) { return /^(https?:\/\/|data:image\/(png|jpe?g|webp);base64,)/.test(u) ? u : "#"; }

// Yorug' / qorong'i rejim
document.getElementById("theme").addEventListener("click", function () {
  const root = document.documentElement;
  const t = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch (e) {}
});

// Yuklashlar hisoblagichi: har bir brauzerdan bir o'yin uchun bir marta sanaladi
document.addEventListener("click", function (e) {
  const a = e.target.closest(".dl");
  if (!a || !db) return;
  const k = "dl_" + a.dataset.id;
  try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); } catch (x) {}
  db.collection("games").doc(a.dataset.id).update({ downloads: firebase.firestore.FieldValue.increment(1) }).catch(function () {});
});
