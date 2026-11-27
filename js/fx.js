"use strict";
/* PixelCore Studio — qulaylik va jilo (fx). js/core.js boot'da shu faylni yuklaydi (admin sahifasidan tashqari).
   Nima qiladi: kursor nuri, kartalar 3D qiyaligi + chegara nuri, scroll'da paydo bo'lish va raqamlarni sanab chiqish,
   bosish effekti, yurakcha uchqunlari, klaviatura yorliqlari (/ ? G+harf), scroll chizig'i va "tepaga" tugmasi.
   Tashqi kutubxona yo'q. prefers-reduced-motion: harakatli narsalar o'chadi (klaviatura, scroll chizig'i, tugma qoladi). */
const FX = (function () {
  // "12" yoki "1,234" / "1 234" / "1.234" (butun son); "2.5" yoki "3K" emas
  function parseCount(txt) {
    const s = String(txt).trim();
    if (!/^(\d+|\d{1,3}([.,\s\u00a0\u202f]\d{3})+)$/.test(s)) return null;
    const n = +s.replace(/\D/g, ""); return isFinite(n) && n < 1e9 ? n : null;
  }
  const ease = function (x) { return 1 - Math.pow(1 - x, 3); };
  const GO = [["h", "home", "index.html"], ["g", "games", "games.html"], ["n", "news", "news.html"], ["s", "services", "services.html"], ["a", "about", "about.html"], ["c", "contact", "contact.html"]];
  if (typeof document === "undefined") return { parseCount: parseCount, ease: ease, GO: GO };

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const inApp = typeof TG !== "undefined" && TG.active;
  if (!reduce) root.classList.add("fx");
  if (!reduce && fine && !inApp) root.classList.add("fx-fine");

  /* ---------- 1) kursor nuri + 2) kartalar qiyaligi va chegara nuri ---------- */
  function pointer() {
    const g = document.createElement("div"); g.id = "fxGlow"; g.setAttribute("aria-hidden", "true"); document.body.insertAdjacentElement("afterbegin", g);
    let tx = 0, ty = 0, raf = 0, shown = false, cur = null;
    function frame() { raf = 0; g.style.transform = "translate3d(" + (tx - 260) + "px," + (ty - 260) + "px,0)"; }
    function leave(c) {
      c.classList.remove("tilting");
      ["--rx", "--ry", "--px", "--py"].forEach(function (k) { c.style.removeProperty(k); });
    }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; g.classList.add("on"); }
      if (!raf) raf = requestAnimationFrame(frame);
      const c = e.target && e.target.closest ? e.target.closest(".card") : null;
      if (cur && cur !== c) leave(cur);
      if (c) {
        const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty("--mx", x + "px"); c.style.setProperty("--my", y + "px");
        if (c.matches(".card[data-id], .card.post")) { // o'yin va yangilik kartalari
          c.classList.add("tilting");
          c.style.setProperty("--ry", ((x / r.width - 0.5) * 9).toFixed(2) + "deg");
          c.style.setProperty("--rx", ((0.5 - y / r.height) * 7).toFixed(2) + "deg");
          c.style.setProperty("--px", (-(x / r.width - 0.5) * 14).toFixed(1) + "px");
          c.style.setProperty("--py", (-(y / r.height - 0.5) * 10).toFixed(1) + "px");
        }
      }
      cur = c;
    }, { passive: true });
    root.addEventListener("mouseleave", function () { g.classList.remove("on"); shown = false; if (cur) { leave(cur); cur = null; } });
  }

  /* ---------- 3) scroll'da paydo bo'lish + raqamlarni sanab chiqish ---------- */
  function reveal() {
    if (!("IntersectionObserver" in window)) return;
    const SEL = ".grid > *, .news > *, .stats > *, .tech > *, .sysg > *, .srv-grid > *, .pkg-grid > *, .team > *";
    const done = new WeakSet();   // animatsiya faqat konteynerning birinchi to'ldirilishida (qidiruv/filtr qayta chizganda miltillamasin)
    const ok = function (el) { return el.nodeType === 1 && !el.classList.contains("skel") && !el.classList.contains("fx-sr") && !el.closest("dialog,[hidden],.hero"); };
    const io = new IntersectionObserver(function (items) {
      const vis = items.filter(function (it) { return it.isIntersecting; }).sort(function (a, b) { return (a.target.compareDocumentPosition(b.target) & 4) ? -1 : 1; });
      vis.forEach(function (it, k) {
        const el = it.target; io.unobserve(el);
        el.style.setProperty("--d", Math.min(k, 6) * 70 + "ms"); el.classList.add("in");
        const b = el.matches(".stat") ? el.querySelector("b") : null; if (b) countUp(b);
        setTimeout(function () { el.classList.remove("rv", "in"); el.style.removeProperty("--d"); }, 1100 + Math.min(k, 6) * 70);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
    function take(nodes) {
      const byParent = new Map();
      nodes.forEach(function (n) { if (ok(n) && n.parentElement && !done.has(n.parentElement)) { const a = byParent.get(n.parentElement) || []; a.push(n); byParent.set(n.parentElement, a); } });
      byParent.forEach(function (list, parent) { done.add(parent); list.forEach(function (n) { n.classList.add("rv"); io.observe(n); }); });
    }
    function scan(n) { const out = []; if (n.matches && n.matches(SEL)) out.push(n); if (n.querySelectorAll) n.querySelectorAll(SEL).forEach(function (x) { out.push(x); }); return out; }
    take(scan(document.body));
    new MutationObserver(function (ms) { const out = []; ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n).forEach(function (x) { out.push(x); }); }); }); if (out.length) take(out); })
      .observe(document.body, { childList: true, subtree: true });
    addEventListener("beforeprint", function () { document.querySelectorAll(".rv").forEach(function (e) { e.classList.remove("rv"); }); });
  }
  function countUp(b) {
    const end = parseCount(b.textContent); if (end === null || end < 2) return;
    const full = b.textContent, t0 = performance.now(), dur = Math.min(1200, 500 + end * 4); let last = "";
    b.textContent = "0"; last = "0";
    requestAnimationFrame(function step(now) {
      if (b.textContent !== last) return;                       // ilova qiymatni o'zi o'zgartirgan — aralashmaymiz
      const p = Math.min(1, (now - t0) / dur);
      if (p >= 1) { b.textContent = full; return; }
      last = Math.round(end * ease(p)).toLocaleString(); b.textContent = last; requestAnimationFrame(step);
    });
  }

  /* ---------- 6) bosish effekti + yurakcha uchqunlari ---------- */
  function sparks(el) {
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, C = ["#c084fc", "#f9a8d4", "#fcd34d", "#e9d5ff"];
    for (let i = 0; i < 9; i++) {
      const s = document.createElement("i"); s.className = "fx-spark"; s.setAttribute("aria-hidden", "true");
      s.style.left = cx - 2 + "px"; s.style.top = cy - 2 + "px"; s.style.background = C[i % C.length]; document.body.appendChild(s);
      const a = (i / 9) * 6.283 + Math.random() * 0.5, d = 26 + Math.random() * 18;
      const an = s.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(" + Math.cos(a) * d + "px," + Math.sin(a) * d + "px) scale(.4)", opacity: 0 }], { duration: 560, easing: "cubic-bezier(.2,.7,.3,1)" });
      an.onfinish = function () { s.remove(); };
    }
  }
  function press() {
    const SELP = ".btn,.pill,.ib,.chip,.tabs button,.seg button,.fav,.fx-top";
    document.addEventListener("pointerdown", function (e) {
      const b = e.target.closest ? e.target.closest(SELP) : null; if (!b || b.disabled) return;
      b.classList.remove("fx-press"); void b.offsetWidth; b.classList.add("fx-press");
    }, { passive: true });
    document.addEventListener("animationend", function (e) { if (e.animationName === "fxpress" || e.animationName === "fxpop") e.target.classList.remove("fx-press", "fx-pop"); });
    document.addEventListener("click", function (e) {   // core.js dagi handler birinchi ishlaydi, shuning uchun .on holati yangi
      const b = e.target.closest ? e.target.closest(".fav") : null; if (!b) return;
      if (b.classList.contains("on")) { b.classList.remove("fx-pop"); void b.offsetWidth; b.classList.add("fx-pop"); sparks(b); }
    });
  }

  /* ---------- 7) klaviatura yorliqlari ---------- */
  function keys() {
    const hint = document.createElement("div"); hint.id = "fxKeys"; hint.hidden = true; hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = "<kbd>G</kbd> + " + GO.map(function (r) { return "<kbd>" + r[0] + "</kbd>"; }).join(" "); document.body.appendChild(hint);
    document.body.insertAdjacentHTML("beforeend", '<dialog id="kbDlg" aria-labelledby="kbT"><h2 id="kbT" style="font-size:22px;margin-bottom:14px">' + esc(t("kb.title")) + '</h2><div class="kb-list">' +
      '<div><span><kbd>/</kbd></span><b>' + esc(t("kb.search")) + "</b></div>" +
      GO.map(function (r) { return "<div><span><kbd>G</kbd> <kbd>" + r[0].toUpperCase() + "</kbd></span><b>" + esc(t("nav." + r[1])) + "</b></div>"; }).join("") +
      '<div><span><kbd>?</kbd></span><b>' + esc(t("kb.help")) + '</b></div><div><span><kbd>Esc</kbd></span><b>' + esc(t("common.close")) + '</b></div></div>' +
      '<button class="btn sm" id="kbClose" type="button" style="margin-top:16px;width:100%">' + esc(t("common.close")) + "</button></dialog>");
    const dlg = document.getElementById("kbDlg");
    document.getElementById("kbClose").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    if (fine) { // sichqoncha/klaviatura bor qurilmada pastki qismga havola
      const ck = document.getElementById("ckOpen");
      if (ck) { ck.insertAdjacentHTML("afterend", ' · <button class="link-btn" id="kbOpen" type="button">' + esc(t("kb.open")) + "</button>"); document.getElementById("kbOpen").addEventListener("click", function () { dlg.showModal(); }); }
    }
    let gAt = 0, gT = 0;
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const tg = e.target; if (tg && tg.closest && tg.closest("input,textarea,select,[contenteditable=''],[contenteditable='true']")) return;
      const k = e.key;
      if (k === "?") { e.preventDefault(); if (dlg.open) dlg.close(); else if (!document.querySelector("dialog[open]")) dlg.showModal(); return; }
      if (document.querySelector("dialog[open]")) return;
      // "/" (va Ctrl+K) qidiruvni ochishni core.js o'zi bajaradi
      if (gAt && Date.now() - gAt < 1300) {
        const r = GO.filter(function (x) { return x[0] === k.toLowerCase(); })[0];
        gAt = 0; clearTimeout(gT); hint.hidden = true;
        if (r) { e.preventDefault(); location.href = r[2]; } return;
      }
      if (k === "g" || k === "G") { gAt = Date.now(); hint.hidden = false; clearTimeout(gT); gT = setTimeout(function () { gAt = 0; hint.hidden = true; }, 1300); }
    });
  }

  /* ---------- 8) scroll chizig'i + "tepaga" tugmasi ---------- */
  function progress() {
    const bar = document.createElement("div"); bar.id = "fxBar"; bar.setAttribute("aria-hidden", "true"); bar.innerHTML = "<i></i>";
    const top = document.createElement("button"); top.className = "fx-top"; top.type = "button"; top.hidden = true; top.textContent = "↑"; top.setAttribute("aria-label", t("ui.top"));
    document.body.appendChild(bar); document.body.appendChild(top);
    const fill = bar.firstChild; let raf = 0;
    function upd() {
      raf = 0; const h = document.documentElement.scrollHeight - innerHeight, y = scrollY;
      bar.classList.toggle("on", h > 40 && y > 4); fill.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0).toFixed(4) + ")";
      top.hidden = !(h > 600 && y > 700);
    }
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    addEventListener("resize", upd);
    top.addEventListener("click", function () { scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
    upd();
  }

  if (!reduce && fine && !inApp) pointer();
  if (!reduce) { reveal(); press(); }
  keys(); progress();
  return { parseCount: parseCount, ease: ease, GO: GO };
})();
if (typeof module !== "undefined" && module.exports) module.exports = FX;
