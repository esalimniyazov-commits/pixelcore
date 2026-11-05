// Vercel Serverless Function (bepul Hobby tarifda ishlaydi): /sitemap.xml ni dinamik yaratadi.
// Statik sahifalarga qo'shimcha ravishda Firestore'dagi o'yin va yangilik sahifalarini ham kiritadi.
// Firestore o'qishi ochiq (qoidalarda `allow read: if true`), shuning uchun faqat ochiq API kalit ishlatiladi.
const SITE = "https://pixelcore-delta.vercel.app";
const PROJECT = "pixelcore-96f17";
const API_KEY = "AIzaSyClr3ZX4QOL_7dQkqg27oQJdrlnVcskobc";
const STATIC = ["", "games.html", "news.html", "services.html", "about.html", "contact.html", "privacy.html"];

async function list(col, fetchFn) {
  const out = []; let token = "";
  for (let i = 0; i < 5; i++) {
    const url = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/" + col + "?pageSize=300&key=" + API_KEY + (token ? "&pageToken=" + encodeURIComponent(token) : "");
    const r = await fetchFn(url);
    if (!r.ok) throw new Error(col + " " + r.status);
    const j = await r.json();
    (j.documents || []).forEach(function (d) {
      const f = d.fields || {}, ts = (f.updated && f.updated.timestampValue) || (f.created && f.created.timestampValue) || "";
      out.push({ id: d.name.split("/").pop(), lastmod: ts.slice(0, 10) });
    });
    token = j.nextPageToken; if (!token) break;
  }
  return out;
}
function xml(urls) {
  const alt = function (loc) { return ["uz", "ru", "en"].map(function (l) { return '<xhtml:link rel="alternate" hreflang="' + l + '" href="' + loc + (loc.indexOf("?") < 0 ? "?" : "&amp;") + "lang=" + l + '"/>'; }).join(""); };
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.map(function (u) { return "  <url><loc>" + u.loc + "</loc>" + (u.lastmod ? "<lastmod>" + u.lastmod + "</lastmod>" : "") + alt(u.loc) + "</url>"; }).join("\n") + "\n</urlset>\n";
}
async function build(fetchFn) {
  const urls = STATIC.map(function (p) { return { loc: SITE + "/" + p }; });
  try { (await list("games", fetchFn)).forEach(function (g) { urls.push({ loc: SITE + "/app.html?id=" + encodeURIComponent(g.id), lastmod: g.lastmod }); }); } catch (e) {}
  try { (await list("news", fetchFn)).forEach(function (n) { urls.push({ loc: SITE + "/article.html?id=" + encodeURIComponent(n.id), lastmod: n.lastmod }); }); } catch (e) {}
  return xml(urls);
}
module.exports = async function (req, res) {
  const body = await build(fetch);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(body);
};
module.exports.build = build;
