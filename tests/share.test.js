const { build } = require("../api/share.js");
let failures = 0;
const check = (condition, label) => {
  console.log(condition ? "  ✓" : "  ✗ FAIL:", label);
  if (!condition) failures++;
};
const mock = (fields) => async () => ({ ok: true, json: async () => ({ fields }) });

(async () => {
  const game = await build("game", "game-1", "en", mock({
    title: { stringValue: "A <Game>" },
    desc_en: { stringValue: "English description" },
    cover: { stringValue: "data:image/png;base64,abc" },
  }));
  check(game.includes('property="og:title" content="A &lt;Game&gt;"'), "game title is HTML-escaped");
  check(game.includes('property="og:description" content="English description"'), "localized game description is used");
  check(game.includes('property="og:image" content="https://pixelcore-delta.vercel.app/og.png"'), "non-public image uses the share-safe fallback");
  check(game.includes("app.html?id=game-1&amp;lang=en"), "game canonical URL retains its language");

  const news = await build("news", "news-1", "ru", mock({
    title_ru: { stringValue: "Заголовок" },
    text_ru: { stringValue: "Текст новости" },
    cover: { stringValue: "https://cdn.example/image.jpg" },
  }));
  check(news.includes('property="og:title" content="Заголовок"'), "localized news title is used");
  check(news.includes('property="og:description" content="Текст новости"'), "localized news description is used");
  check(news.includes('property="og:image" content="https://cdn.example/image.jpg"'), "public HTTPS cover is used");

  let missingStatus = 0;
  try { await build("game", "missing", "uz", async () => ({ ok: false, status: 404 })); }
  catch (error) { missingStatus = error.status; }
  check(missingStatus === 404, "missing documents return a not-found status");
  let invalidStatus = 0;
  try { await build("toString", "id", "uz", mock({})); }
  catch (error) { invalidStatus = error.status; }
  check(invalidStatus === 400, "unknown preview types are rejected");
  process.exit(failures ? 1 : 0);
})();
