// api/sitemap.js sinovi (Firestore REST javobi soxta)
const { build } = require("../api/sitemap.js");
const fake = async (url) => ({ ok: true, json: async () => url.includes("/games?") ? { documents: [{ name: "projects/p/databases/(default)/documents/games/abc", fields: { updated: { timestampValue: "2026-10-01T10:00:00Z" } } }] } : { documents: [{ name: "projects/p/x/news/n 1", fields: { created: { timestampValue: "2026-09-01T00:00:00Z" } } }] } });
(async () => {
  const x = await build(fake); let bad = 0; const ck = (c, m) => { console.log(c ? "  ✓" : "  ✗ FAIL:", m); if (!c) bad++; };
  ck(x.includes("<loc>https://pixelcore-delta.vercel.app/</loc>") && x.includes("games.html"), "statik sahifalar bor");
  ck(x.includes("app.html?id=abc</loc><lastmod>2026-10-01</lastmod>"), "o'yin sahifasi lastmod bilan");
  ck(x.includes("article.html?id=n%201"), "yangilik ID URL-kodlangan");
  ck(x.includes('hreflang="ru"') && x.startsWith("<?xml"), "hreflang va XML sarlavhasi");
  const x2 = await build(async () => { throw new Error("offline"); }); ck(x2.includes("about.html") && !x2.includes("app.html?id="), "Firestore ishlamasa ham statik sitemap qaytadi");
  process.exit(bad ? 1 : 0);
})();
