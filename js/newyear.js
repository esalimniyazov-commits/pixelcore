"use strict";
/* PixelCore Studio — Yangi yil mavzusi (JS qismi). js/core.js sana oralig'ida shu faylni yuklaydi (links.js -> NEWYEAR).
   Nima qiladi: piksel-qor kanvasi, logotip ustida qalpoq, bosh sahifada "Yangi yilgacha" hisoblagichi (haqiqiy vaqt),
   logotipni bosganda piksel-salyut, favicon'ga qalpoq. Tashqi kutubxona, tarmoq so'rovi (favicon.svg dan tashqari) va sir yo'q.
   prefers-reduced-motion: qor harakatsiz, salyut yo'q. */
const NYX = (function () {
  const GOLD = "#fcd34d", ICE = "#bae6fd";
  const COLORS = ["#fcd34d", "#bae6fd", "#ef4444", "#c084fc", "#ffffff", "#4ade80"];
  // Piksel qalpoq: [x, y, eni, bo'yi, rang] (14x8 katak)
  const HAT = [[8, 2, 4, 1, "#ef4444"], [6, 3, 6, 1, "#ef4444"], [4, 4, 8, 1, "#ef4444"], [3, 5, 9, 1, "#ef4444"], [10, 3, 2, 3, "#b91c1c"],
    [1, 6, 12, 1, "#ffffff"], [1, 7, 12, 1, "#dbeafe"], [11, 0, 3, 3, "#ffffff"]];

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function parts(ms) {
    const s = Math.floor(Math.max(0, ms) / 1000);
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  }
  // Iyul-dekabr: kelasi 1-yanvargacha sanaladi; yanvar-iyun: tabrik rejimi (joriy yil)
  function target(now) {
    const greeting = now.getMonth() < 6, year = greeting ? now.getFullYear() : now.getFullYear() + 1;
    return { year: year, at: new Date(year, 0, 1, 0, 0, 0, 0), greeting: greeting };
  }
  if (typeof document === "undefined") return { parts: parts, target: target, pad: pad, HAT: HAT };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function hatSvg(u) { return HAT.map(function (r) { return '<rect x="' + r[0] * u + '" y="' + r[1] * u + '" width="' + r[2] * u + '" height="' + r[3] * u + '" fill="' + r[4] + '"/>'; }).join(""); }

  /* ---------- logotiplarga qalpoq (svg ichiga qo'shiladi, shuning uchun logotip bilan birga harakatlanadi) ---------- */
  function hats() {
    document.querySelectorAll("svg").forEach(function (s) {
      const u = s.querySelector(":scope > use");
      if (!u || u.getAttribute("href") !== "#logo" || s.dataset.nyHat) return;
      s.dataset.nyHat = "1";
      if (!s.getAttribute("viewBox")) s.setAttribute("viewBox", "0 0 555 555");
      s.insertAdjacentHTML("beforeend", '<g class="ny-hat" shape-rendering="crispEdges" transform="translate(-52 -140) rotate(-12 150 150)">' + hatSvg(26) + "</g>");
    });
  }

  /* ---------- piksel-qor ---------- */
  function snow() {
    const c = document.createElement("canvas"); c.id = "nyc"; c.setAttribute("aria-hidden", "true");
    const bg = document.getElementById("bgc");
    if (bg) bg.insertAdjacentElement("afterend", c); else document.body.insertAdjacentElement("afterbegin", c);
    const x = c.getContext("2d"); let w = 0, h = 0, F = [], last = 0, tm = 0;
    function size() {
      w = c.width = innerWidth; h = c.height = innerHeight;
      const n = Math.min(w < 600 ? 55 : 120, Math.floor(w * h / 10500));
      F = Array.from({ length: n }, function () {
        const plus = Math.random() < 0.16, s = 2 + Math.floor(Math.random() * 3);
        return { x: Math.random() * w, y: Math.random() * h, plus: plus, u: 2, s: s, v: 20 + s * 10 + (plus ? 14 : 0), a: 0.45 + Math.random() * 0.5,
          p: Math.random() * 6.28, sw: 8 + Math.random() * 16, g: Math.random() < 0.05, i: Math.random() < 0.35 };
      });
      draw();
    }
    function draw() {
      x.clearRect(0, 0, w, h);
      F.forEach(function (f) {
        x.globalAlpha = f.g ? 0.35 + 0.65 * Math.abs(Math.sin(tm / 700 + f.p)) : f.a;
        x.fillStyle = f.g ? GOLD : f.i ? ICE : "#ffffff";
        const px = f.x | 0, py = f.y | 0;
        if (f.plus) { x.fillRect(px + f.u, py, f.u, 3 * f.u); x.fillRect(px, py + f.u, 3 * f.u, f.u); } else x.fillRect(px, py, f.s, f.s);
      });
    }
    let rt = 0; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 200); });
    size();
    if (reduce) return; // harakatsiz qor
    requestAnimationFrame(function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; tm = t;
      if (!document.hidden) {
        F.forEach(function (f) {
          f.y += f.v * dt; f.x += Math.sin(t / 1400 + f.p) * f.sw * dt;
          if (f.y > h + 8) { f.y = -8; f.x = Math.random() * w; }
          if (f.x > w + 8) f.x = -8; else if (f.x < -8) f.x = w + 8;
        });
        draw();
      }
      requestAnimationFrame(frame);
    });
  }

  /* ---------- piksel-salyut ---------- */
  let fx = null;
  function burst(cx, cy, n) {
    if (reduce) return;
    if (!fx) {
      const c = document.createElement("canvas"); c.id = "nyf"; c.setAttribute("aria-hidden", "true"); c.width = innerWidth; c.height = innerHeight;
      document.body.appendChild(c);
      fx = { c: c, x: c.getContext("2d"), P: [], last: 0 };
      requestAnimationFrame(function loop(t) {
        const dt = Math.min(0.05, (t - fx.last) / 1000 || 0); fx.last = t;
        fx.x.clearRect(0, 0, fx.c.width, fx.c.height);
        fx.P = fx.P.filter(function (p) { return p.t < p.life; });
        fx.P.forEach(function (p) {
          p.vy += 700 * dt; p.vx *= 0.992; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
          fx.x.globalAlpha = Math.max(0, 1 - p.t / p.life); fx.x.fillStyle = p.col; fx.x.fillRect(p.x | 0, p.y | 0, p.s, p.s);
        });
        if (fx.P.length) requestAnimationFrame(loop); else { fx.c.remove(); fx = null; }
      });
    }
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, sp = 120 + Math.random() * 380;
      fx.P.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, s: 4 + 2 * Math.floor(Math.random() * 2), col: COLORS[Math.floor(Math.random() * COLORS.length)], life: 1.1 + Math.random() * 1.1, t: 0 });
    }
  }
  function fireworks() { for (let i = 0; i < 7; i++) setTimeout(function () { burst(innerWidth * (0.15 + Math.random() * 0.7), innerHeight * (0.15 + Math.random() * 0.45), 46); }, i * 420); }

  /* ---------- "Yangi yilgacha" hisoblagichi (faqat bosh sahifa; vaqt tashrif buyuruvchining soati bo'yicha) ---------- */
  function countdown() {
    const row = document.querySelector(".hero .row"); if (!row) return;
    const box = document.createElement("section"); row.insertAdjacentElement("afterend", box);
    let mode = "";
    function render() {
      const now = new Date(), tg = target(now), m = tg.greeting ? "greet" : "count";
      if (m !== mode) {
        const prev = mode; mode = m;
        if (m === "greet") {
          box.className = "ny-cd ny-greet"; box.removeAttribute("role"); box.removeAttribute("aria-label");
          box.innerHTML = "<b>🎉 " + esc(t("ny.greet", { y: tg.year })) + "</b><span>" + esc(t("ny.greetSub")) + "</span>";
          if (prev === "count") fireworks(); // sahifa ochiq turganda yarim tunda
        } else {
          box.className = "ny-cd"; box.setAttribute("role", "timer"); box.setAttribute("aria-label", t("ny.aria"));
          box.innerHTML = "<small>❄ " + esc(t("ny.until")) + '</small><div class="ny-t">' + [["d", "ny.d"], ["h", "ny.h"], ["m", "ny.m"], ["s", "ny.s"]].map(function (k) {
            return '<div><b data-u="' + k[0] + '">00</b><span>' + esc(t(k[1])) + "</span></div>";
          }).join("") + "</div>";
        }
      }
      if (m === "count") {
        const p = parts(tg.at - now);
        box.querySelectorAll("[data-u]").forEach(function (el) { el.textContent = el.dataset.u === "d" ? String(p.d) : pad(p[el.dataset.u]); });
      }
    }
    render(); setInterval(render, 1000);
  }

  /* ---------- logotip atrofidagi uchqunlar + bosganda salyut ---------- */
  function heroFx() {
    const lb = document.getElementById("logoBtn"); if (!lb) return;
    [[8, 22], [90, 16], [96, 60], [4, 70], [50, 2], [80, 92], [22, 94], [64, 28]].forEach(function (p, i) {
      const e = document.createElement("i"); e.className = "ny-spark" + (i % 2 ? " i" : ""); e.setAttribute("aria-hidden", "true");
      e.style.left = p[0] + "%"; e.style.top = p[1] + "%"; e.style.animationDelay = (i * 0.37).toFixed(2) + "s"; lb.appendChild(e);
    });
    lb.addEventListener("click", function () { const r = lb.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 56); });
  }

  /* ---------- favicon'ga qalpoq ---------- */
  function favicon() {
    const l = document.querySelector('link[rel="icon"][type="image/svg+xml"]'); if (!l || !window.fetch) return;
    fetch("favicon.svg").then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (svg) {
      const hat = '<g shape-rendering="crispEdges" transform="translate(38 2) rotate(-12 150 150)">' + hatSvg(20) + "</g>";
      l.href = "data:image/svg+xml," + encodeURIComponent(svg.replace("</svg>", hat + "</svg>"));
    }).catch(function () {});
  }

  hats(); snow(); favicon();
  if (PAGE === "home") { countdown(); heroFx(); }
  return { parts: parts, target: target, pad: pad, HAT: HAT };
})();
if (typeof module !== "undefined" && module.exports) module.exports = NYX;
