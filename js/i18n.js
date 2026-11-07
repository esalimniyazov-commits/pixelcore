"use strict";
/* Til tizimi. Kalitlar js/dict.js ichida: DICT[kalit] = [uz, ru, en]. */
let LANG = "uz";
(function () {
  const ok = function (v) { return v === "uz" || v === "ru" || v === "en"; };
  let q = null, s = null;
  try { q = new URLSearchParams(location.search).get("lang"); s = localStorage.getItem("lang"); } catch (e) {}
  if (ok(q)) { LANG = q; try { localStorage.setItem("lang", q); } catch (e) {} }
  else if (ok(s)) LANG = s;
  else { const n = (navigator.language || "uz").slice(0, 2); LANG = n === "ru" ? "ru" : n === "en" ? "en" : "uz"; }
  document.documentElement.lang = LANG;
})();
function toNewUzbekAlphabet(text) {
  const protectedTerms = [];
  text = String(text).replace(/reCAPTCHA|App Check/gi, function (m) {
    protectedTerms.push(m);
    return "\u0000" + (protectedTerms.length - 1) + "\u0000";
  });
  text = text
    .replace(/[oO][’‘ʻʼ'ʽ]/g, function (m) { return m[0] === "O" ? "Ö" : "ö"; })
    .replace(/[gG][’‘ʻʼ'ʽ]/g, function (m) { return m[0] === "G" ? "Ğ" : "ğ"; })
    .replace(/sh/gi, function (m) { return m[0] === "S" ? "Ş" : "ş"; })
    .replace(/ch/gi, function (m) { return m[0] === "C" ? "Ç" : "ç"; });
  return text.replace(/\u0000(\d+)\u0000/g, function (m, i) { return protectedTerms[Number(i)]; });
}
function t(key, vars) {
  const e = DICT[key];
  if (!e) { if (typeof console !== "undefined") console.warn("i18n: kalit yo'q:", key); return key; }
  let s = e[LANG === "ru" ? 1 : LANG === "en" ? 2 : 0] || e[0];
  if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  return LANG === "uz" ? toNewUzbekAlphabet(s) : s;
}
function applyI18n(root) {
  root = root || document;
  root.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll("[data-i18n-ph]").forEach(function (el) { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  root.querySelectorAll("[data-i18n-title]").forEach(function (el) { el.title = t(el.dataset.i18nTitle); });
}
