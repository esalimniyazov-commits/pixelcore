/* PixelCore Studio 2.0 — Service Worker.
   Strategiya: sahifalar — avval tarmoq, oflayn bo'lsa kesh yoki offline.html; statik fayllar — kesh bilan tez ochilib, fonda yangilanadi.
   Firebase, Google Fonts va boshqa tashqi so'rovlarga tegmaydi. Yangi versiya: VERSION ni o'zgartiring. */
const VERSION = "pc-v2.3.1";
const SHELL = ["offline.html", "style.css", "firebase.js", "links.js", "js/dict.js", "js/i18n.js", "js/core.js", "js/pages.js", "js/simple.js", "favicon.svg", "icon-192.png", "icon-512.png", "manifest.webmanifest",
  "index.html", "games.html", "news.html", "about.html", "contact.html", "services.html"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("message", function (e) { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", function (e) {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.indexOf("/api/") === 0 || u.pathname === "/sw.js") return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(function (res) { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(function (c) { c.put(r, cp); }); } return res; })
      .catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match("offline.html"); }); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (hit) {
    const net = fetch(r).then(function (res) { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(function (c) { c.put(r, cp); }); } return res; }).catch(function () { return hit; });
    return hit || net;
  }));
});
