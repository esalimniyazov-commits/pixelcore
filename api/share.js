const SITE = "https://pixelcore-delta.vercel.app";
const PROJECT = "pixelcore-96f17";
const API_KEY = "AIzaSyClr3ZX4QOL_7dQkqg27oQJdrlnVcskobc";
const PAGES = {
  game: { collection: "games", page: "app.html", title: "title", description: ["tagline", "desc"] },
  news: { collection: "news", page: "article.html", title: "title", description: ["text"] },
};

function value(fields, key) {
  const field = fields[key];
  if (!field) return "";
  return field.stringValue || field.integerValue || field.doubleValue || "";
}
function localized(fields, key, lang) {
  return value(fields, key + "_" + lang) || value(fields, key);
}
function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function plain(value) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240); }

async function build(type, id, lang, fetchFn) {
  const page = Object.prototype.hasOwnProperty.call(PAGES, type) ? PAGES[type] : null;
  if (!page || typeof id !== "string" || !id || id.indexOf("/") >= 0) {
    const error = new Error("Invalid preview request");
    error.status = 400;
    throw error;
  }
  const locale = ["uz", "ru", "en"].indexOf(lang) >= 0 ? lang : "uz";
  const url = "https://firestore.googleapis.com/v1/projects/" + PROJECT +
    "/databases/(default)/documents/" + page.collection + "/" + encodeURIComponent(id) + "?key=" + API_KEY;
  const response = await fetchFn(url);
  if (!response.ok) {
    const error = new Error("Unable to load preview data");
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }
  const fields = ((await response.json()).fields || {});
  const title = localized(fields, page.title, locale) || "PixelCore Studio";
  let description = "";
  for (const key of page.description) {
    description = localized(fields, key, locale);
    if (description) break;
  }
  description = plain(description) || title;
  const imageField = value(fields, "cover");
  const image = /^https:\/\//i.test(imageField) ? imageField : SITE + "/og.png";
  const canonical = SITE + "/" + page.page + "?id=" + encodeURIComponent(id) + "&lang=" + locale;
  const typeValue = type === "news" ? "article" : "website";
  return '<!doctype html><html lang="' + locale + '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + ' — PixelCore Studio</title>' +
    '<meta name="description" content="' + esc(description) + '">' +
    '<link rel="canonical" href="' + esc(canonical) + '">' +
    '<meta property="og:type" content="' + typeValue + '">' +
    '<meta property="og:site_name" content="PixelCore Studio">' +
    '<meta property="og:url" content="' + esc(canonical) + '">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:image" content="' + esc(image) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(title) + ' — PixelCore Studio">' +
    '<meta name="twitter:description" content="' + esc(description) + '">' +
    '<meta name="twitter:image" content="' + esc(image) + '">' +
    '</head><body><h1>' + esc(title) + '</h1><p>' + esc(description) +
    '</p><a href="' + esc(canonical) + '">Open on PixelCore Studio</a></body></html>';
}

module.exports = async function (req, res) {
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const id = typeof req.query.id === "string" ? req.query.id : "";
  const lang = typeof req.query.lang === "string" ? req.query.lang : "uz";
  try {
    const html = await build(type, id, lang, fetch);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("Vary", "User-Agent");
    res.status(200).send(html);
  } catch (error) {
    res.status(error.status || 502).send(error.status === 404 ? "Not found" : "Unable to load preview");
  }
};
module.exports.build = build;
