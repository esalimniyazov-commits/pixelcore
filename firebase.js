// ====== SOZLAMALAR ======
// Mavjud Firebase loyihangiz (pixelcore-96f17) saqlandi. apiKey yashirin kalit emas, ochiq turishi normal;
// himoya firestore.rules faylidagi qoidalarda.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyClr3ZX4QOL_7dQkqg27oQJdrlnVcskobc",
  authDomain: "pixelcore-96f17.firebaseapp.com",
  projectId: "pixelcore-96f17",
  appId: "1:380516908831:web:bccdfa893cd8d20ffc3a2a",
};
// Faqat tugmani ko'rsatish uchun. Haqiqiy tekshiruv firestore.rules ichida (admin.html ham serverdan tekshiradi).
const ADMIN_EMAILS = ["esalimniyazov@gmail.com"];

let auth = null, db = null;
if (FIREBASE_CONFIG.apiKey && typeof firebase !== "undefined") {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
  } catch (e) { console.error("Firebase init:", e); auth = db = null; }
}

// Matnni xavfsiz chiqarish (XSS'dan himoya)
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function safeUrl(u) { return /^(https?:\/\/|data:image\/(png|jpe?g|webp);base64,)/.test(u || "") ? u : "#"; }
