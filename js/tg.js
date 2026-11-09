"use strict";
/* PixelCore Studio — Telegram Mini App ko'prigi (A bosqichi: sirsiz).
   Mini App rejimi FAQAT window.Telegram.WebApp.initData bo'sh bo'lmasa yoqiladi; oddiy brauzerda bu fayl hech narsa o'zgartirmaydi.
   MUHIM: initData / initDataUnsafe brauzerda soxtalashtirilishi mumkin (URL hash'iga tgWebAppData yozish yetarli).
   Shuning uchun bu yerdagi qiymatlar FAQAT interfeys qulayligi uchun (til taklifi, sahifaga yo'naltirish, tugmalar).
   Hech qanday kirish yoki ruxsat qarori ularga asoslanmaydi. Haqiqiy tekshiruv faqat serverda (B bosqichi) bo'ladi. */
const TG = (function () {
  const api = { active: false, lang: "", startParam: "", platform: "", version: "" };
  let wa = null;
  try { wa = window.Telegram && window.Telegram.WebApp; } catch (e) { wa = null; }
  if (!wa || typeof wa.initData !== "string" || !wa.initData) return api;

  api.active = true;
  api.platform = String(wa.platform || "");
  api.version = String(wa.version || "");
  const SITE_BG = "#06040c";
  const atLeast = function (v) { try { return typeof wa.isVersionAtLeast === "function" && wa.isVersionAtLeast(v); } catch (e) { return false; } };
  const safe = function (fn) { try { return fn(); } catch (e) { return undefined; } };

  /* ---------- til: faqat TAKLIF (localStorage va ?lang= ustun). Xavfsizlik uchun ishlatilmaydi ---------- */
  try {
    const u = wa.initDataUnsafe && wa.initDataUnsafe.user;
    const c = u && typeof u.language_code === "string" ? u.language_code.slice(0, 2).toLowerCase() : "";
    if (c === "uz" || c === "ru" || c === "en") api.lang = c;
  } catch (e) {}

  /* ---------- start_param (deep link): faqat ruxsat etilgan belgilar ---------- */
  const SP_OK = /^[A-Za-z0-9_-]{1,128}$/; // umumiy uzunlik; ichidagi id alohida (<=64) tekshiriladi
  function rawStartParam() {
    let v = "";
    try { v = (wa.initDataUnsafe && wa.initDataUnsafe.start_param) || ""; } catch (e) {}
    if (!v) {
      try { v = (window.Telegram.WebView && window.Telegram.WebView.initParams && window.Telegram.WebView.initParams.tgWebAppStartParam) || ""; } catch (e) {}
    }
    if (!v) { try { v = new URLSearchParams(location.search).get("tgWebAppStartParam") || ""; } catch (e) {} }
    return typeof v === "string" ? v : "";
  }
  const sp = rawStartParam();
  api.startParam = SP_OK.test(sp) ? sp : "";

  /* start_param -> sayt ichidagi sahifa. Noma'lum yoki noto'g'ri qiymat -> null (hech narsa qilinmaydi). */
  const PAGES_OK = { games: "games.html", news: "news.html", services: "services.html", about: "about.html", contact: "contact.html" };
  api.routeFor = function (param) {
    if (typeof param !== "string" || !SP_OK.test(param)) return null;
    const m = /^(game|news)_([A-Za-z0-9_-]{1,64})$/.exec(param);
    if (m) return (m[1] === "game" ? "app.html?id=" : "article.html?id=") + encodeURIComponent(m[2]);
    return Object.prototype.hasOwnProperty.call(PAGES_OK, param) ? PAGES_OK[param] : null;
  };
  // Faqat bosh sahifada va sessiyada bir marta: aks holda "Bosh sahifa"ga qaytganda yana yo'naltirib yuboradi.
  (function deepLink() {
    const path = location.pathname;
    if (path !== "/" && !/\/index\.html$/.test(path)) return;
    if (!api.startParam) return;
    try { if (sessionStorage.getItem("pc-tg-start")) return; sessionStorage.setItem("pc-tg-start", "1"); } catch (e) { return; }
    const to = api.routeFor(api.startParam);
    if (to) location.replace(to);
  })();

  /* ---------- Telegram ulashish havolasi ---------- */
  // links.js dagi TG_APP {bot, app} to'ldirilgan bo'lsa t.me/<bot>/<app>?startapp=... ishlatiladi, aks holda oddiy sayt havolasi.
  api.directLink = function (param) {
    const c = typeof TG_APP !== "undefined" ? TG_APP : null;
    if (!c || !/^[A-Za-z0-9_]{3,64}$/.test(c.bot || "")) return "";
    const base = "https://t.me/" + c.bot + (/^[A-Za-z0-9_]{3,64}$/.test(c.app || "") ? "/" + c.app : "");
    return SP_OK.test(param || "") ? base + "?startapp=" + param : base;
  };
  api.share = function (url, text) {
    const link = "https://t.me/share/url?url=" + encodeURIComponent(url) + (text ? "&text=" + encodeURIComponent(text) : "");
    return safe(function () { wa.openTelegramLink(link); return true; }) === true;
  };

  /* ---------- ishga tushirish ---------- */
  document.documentElement.classList.add("tg");
  safe(function () { wa.ready(); });
  safe(function () { wa.expand(); });
  if (atLeast("7.7")) safe(function () { wa.disableVerticalSwipes(); });
  function paintChrome() {
    document.documentElement.dataset.tgScheme = String(wa.colorScheme || "dark");
    // Dizayn o'zgarmaydi (qora/binafsha neon): Telegram rangiga emas, sayt fon rangiga moslanadi.
    if (atLeast("6.9")) safe(function () { wa.setHeaderColor(SITE_BG); });
    if (atLeast("6.1")) safe(function () { wa.setBackgroundColor(SITE_BG); });
    if (atLeast("7.10")) safe(function () { wa.setBottomBarColor(SITE_BG); });
  }
  paintChrome();
  safe(function () { wa.onEvent("themeChanged", paintChrome); });

  /* ---------- orqaga tugmasi ---------- */
  const isHome = function () { return (document.body && document.body.dataset.page) === "home"; };
  function openDialogs() { return Array.prototype.slice.call(document.querySelectorAll("dialog[open]")); }
  function syncBack() {
    if (!atLeast("6.1")) return;
    safe(function () { (!isHome() || openDialogs().length ? wa.BackButton.show() : wa.BackButton.hide()); });
  }
  function onBack() {
    const d = openDialogs();
    if (d.length) { d[d.length - 1].close(); syncBack(); return; }
    // Ishonchli "orqaga": tarix bor VA oldingi sahifa shu saytniki bo'lsa — history.back(); aks holda (deep link, bo'sh tarix) — bosh sahifa.
    let sameRef = false;
    try { sameRef = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (history.length > 1 && sameRef) history.back(); else location.href = "index.html";
  }
  if (atLeast("6.1")) {
    safe(function () { wa.BackButton.onClick(onBack); });
    const orig = HTMLDialogElement.prototype.showModal;
    HTMLDialogElement.prototype.showModal = function () { const r = orig.apply(this, arguments); syncBack(); return r; };
    document.addEventListener("close", syncBack, true);
    document.addEventListener("DOMContentLoaded", syncBack);
    addEventListener("pageshow", syncBack);
    syncBack();
  }
  api._onBack = onBack; // testlar uchun

  /* ---------- havolalar ---------- */
  const TME = /^(t\.me|telegram\.me)$/i;
  function classify(a) {
    let u;
    try { u = new URL(a.getAttribute("href") || "", location.href); } catch (e) { return null; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return null; // mailto:, tel: va hokazo — o'z holicha
    if (u.host === location.host) return { kind: "same", url: u.href };
    if (u.protocol === "https:" && TME.test(u.hostname)) return { kind: "tme", url: u.href };
    if (u.protocol === "https:") return { kind: "ext", url: u.href };
    return null; // tashqi http: — o'z holicha (saytda bunday havola yo'q; openLink'ga ishonmaymiz)
  }
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    const c = classify(a);
    if (!c) return;
    if (c.kind === "tme") { e.preventDefault(); safe(function () { wa.openTelegramLink(c.url); }); return; }
    // Yuklash havolalari (APK/EXE/DMG...) ham shu yerga tushadi: Telegram ichki brauzeri yuklashni qo'llamasligi mumkin, shuning uchun tashqi brauzer.
    if (c.kind === "ext") { e.preventDefault(); safe(function () { wa.openLink(c.url); }); return; }
    if (c.kind === "same" && a.target === "_blank") { e.preventDefault(); location.href = c.url; }
  }, true);

  /* ---------- Service Worker: Mini App ichida kerak emas (eski keshni ham tozalaymiz) ---------- */
  api.swDisabled = true;
  safe(function () {
    if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); }).catch(function () {});
  });
  return api;
})();
