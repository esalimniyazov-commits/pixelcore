// Tarjimalar: kalit — o'zbekcha matn, qiymat — [ruscha, inglizcha]
const D = {
  "Biz haqimizda": ["О нас", "About"], "Ilovalar": ["Приложения", "Apps"], "Yangiliklar": ["Новости", "News"],
  "O'yin": ["Игра", "Game"], "Bog'lanish": ["Контакты", "Contact"], "Kirish": ["Войти", "Sign in"], "Ro'yxatdan o'tish": ["Регистрация", "Sign up"],
  "Android, Windows va macOS uchun o'yinlar va ilovalar yaratamiz.": ["Создаём игры и приложения для Android, Windows и macOS.", "We build games and apps for Android, Windows and macOS."],
  "PixelCore Studio — kichik, lekin puxta jamoa. Har bir ilovani o'zbek foydalanuvchisini o'ylab, tez va chiroyli qilib chiqaramiz.": ["PixelCore Studio — небольшая, но надёжная команда. Каждое приложение мы делаем быстрым и красивым, думая об узбекском пользователе.", "PixelCore Studio is a small but dedicated team. We build every app to be fast and beautiful, with Uzbek users in mind."],
  "Telegram'dan yuklab olish": ["Скачать из Telegram", "Download from Telegram"], "Ilovalarni ko'rish": ["Смотреть приложения", "Browse apps"],
  "Biz kimmiz": ["Кто мы", "Who we are"],
  "Logotipimizdagi to'rtta bo'lak — to'rtta yo'nalish, markazdagi nuqta esa ularni birlashtiruvchi g'oya.": ["Четыре части логотипа — четыре направления, а точка в центре — идея, которая их объединяет.", "The four parts of our logo are four directions, and the dot in the center is the idea that unites them."],
  "Barcha ilovalar Android qurilmalar uchun": ["Все приложения — для устройств Android", "All apps are made for Android devices"],
  "O'zbek tilida": ["На узбекском языке", "In Uzbek"], "Interfeys va mazmun o'zimizning tilda": ["Интерфейс и контент на родном языке", "Interface and content in our own language"],
  "Telegram'da": ["В Telegram", "On Telegram"], "Yangi versiyalar avval kanalda chiqadi": ["Новые версии сначала выходят в канале", "New versions appear in the channel first"],
  "O'yinlar va ilovalar": ["Игры и приложения", "Games and apps"], "O'yin yoki ilovani qidirish": ["Поиск игры или приложения", "Search games or apps"],
  "Hammasi": ["Все", "All"], "Chiqarilgan": ["Вышли", "Released"], "Tez orada": ["Скоро", "Coming soon"], "Sevimlilar": ["Избранное", "Favorites"],
  "O'zbek tilidagi IQ va mantiq testlari. Fikrlash tezligingizni sinab ko'ring.": ["IQ- и логические тесты на узбекском языке. Проверьте скорость мышления.", "IQ and logic tests in Uzbek. Test your thinking speed."],
  "Mantiq": ["Логика", "Logic"], "Yuklab olish": ["Скачать", "Download"], "Yangi o'yin": ["Новая игра", "New game"],
  "Ustida ishlayapmiz. Birinchilardan bo'lib bilish uchun Telegram kanalimizga qo'shiling.": ["Мы работаем над ней. Подпишитесь на наш Telegram-канал, чтобы узнать первыми.", "We're working on it. Join our Telegram channel to be the first to know."],
  "Xabar olish": ["Получать новости", "Get notified"], "Batafsil": ["Подробнее", "Details"],
  "kun qoldi": ["дн. до выхода", "days left"], "yuklash": ["загрузок", "downloads"],
  "Hozircha yangilik yo'q.": ["Новостей пока нет.", "No news yet."],
  "Pixel o'yini": ["Пиксельная игра", "Pixel game"],
  "15 soniyada yonib turgan pikselni iloji boricha ko'p marta bosing.": ["За 15 секунд нажмите на светящийся пиксель как можно больше раз.", "In 15 seconds, click the glowing pixel as many times as you can."],
  "Boshlash": ["Начать", "Start"], "Ball": ["Очки", "Score"], "Vaqt": ["Время", "Time"],
  "Eng yaxshi natijalar": ["Лучшие результаты", "Top scores"], "Hali natija yo'q.": ["Результатов пока нет.", "No scores yet."],
  "Natijani saqlash uchun hisobga kiring.": ["Войдите, чтобы сохранить результат.", "Sign in to save your score."],
  "Bilasizmi?": ["Знаете ли вы?", "Did you know?"], "Yana bir fakt": ["Ещё факт", "Another fact"],
  "Ko'p beriladigan savollar": ["Частые вопросы", "FAQ"],
  "Fikr-mulohaza": ["Обратная связь", "Feedback"], "Xato": ["Ошибка", "Bug"], "G'oya": ["Идея", "Idea"], "Savol": ["Вопрос", "Question"],
  "Xabaringiz": ["Ваше сообщение", "Your message"], "Yuborish": ["Отправить", "Send"],
  "Rahmat! Xabaringiz yuborildi.": ["Спасибо! Сообщение отправлено.", "Thanks! Your message was sent."],
  "Yuborish uchun avval hisobga kiring.": ["Сначала войдите в аккаунт.", "Please sign in first."],
  "Bizni kuzating": ["Следите за нами", "Follow us"], "Yangi ilovalar va yangiliklar": ["Новые приложения и новости", "New apps and news"],
  "Jarayon va ichki kuzatuvlar": ["Процесс и закулисье", "Behind the scenes"], "Qo'llab-quvvatlash": ["Поддержать", "Support us"],
  "Yangi ilovalar uchun yordam bering": ["Помогите нам делать новые приложения", "Help us build new apps"],
  "Logotip (press-kit)": ["Логотип (пресс-кит)", "Logo (press kit)"],
  "Maqola yoki video uchun logotipni yuklab oling.": ["Скачайте логотип для статьи или видео.", "Download the logo for an article or video."],
  "Och rang": ["Светлый", "Light"], "To'q ko'k": ["Тёмно-синий", "Dark blue"], "Oq": ["Белый", "White"],
  "Maxfiylik siyosati": ["Политика конфиденциальности", "Privacy policy"],
  "Siz kirgansiz:": ["Вы вошли как:", "Signed in as:"], "Admin panel": ["Админ-панель", "Admin panel"], "Chiqish": ["Выйти", "Sign out"], "Yopish": ["Закрыть", "Close"],
  "Parol (kamida 6 ta belgi)": ["Пароль (минимум 6 символов)", "Password (at least 6 characters)"],
  "Skrinshotlar": ["Скриншоты", "Screenshots"], "Versiyalar tarixi": ["История версий", "Version history"],
  "Barcha ilovalar": ["Все приложения", "All apps"], "Ilova topilmadi.": ["Приложение не найдено.", "App not found."], "Yuklanmoqda...": ["Загрузка...", "Loading..."],
  "Sharhlar": ["Отзывы", "Reviews"], "Sharhingiz": ["Ваш отзыв", "Your review"],
  "Sharh yozish uchun saytda hisobingizga kiring.": ["Войдите на сайте, чтобы написать отзыв.", "Sign in on the site to write a review."],
  "O'chirish": ["Удалить", "Delete"],
  "Telegram kanali": ["Telegram-канал", "Telegram channel"],
  "Ilovalar va o'yinlar uchta platforma uchun": ["Приложения и игры для трёх платформ", "Apps and games for three platforms"],
  "Barcha platformalar": ["Все платформы", "All platforms"],
  "Yangi": ["Новое", "New"],
  "Tavsiya etiladi": ["Рекомендуем", "Featured"], "Oxirgi yangilanish:": ["Последнее обновление:", "Last updated:"], "Tizim talablari": ["Системные требования", "System requirements"],
  "Yangilari birinchi": ["Сначала новые", "Newest first"], "Yaqinda yangilanganlar": ["Недавно обновлённые", "Recently updated"],
  "Nomi bo'yicha": ["По названию", "By name"], "Ko'p yuklanganlar": ["Самые скачиваемые", "Most downloaded"], "Ulashish": ["Поделиться", "Share"], "Nusxalandi!": ["Скопировано!", "Copied!"],
};
let LANG = "uz";
try { LANG = localStorage.getItem("lang") || (/^ru/.test(navigator.language) ? "ru" : /^en/.test(navigator.language) ? "en" : "uz"); } catch (e) {}
function t(s) { const e = D[s]; return LANG === "uz" || !e ? s : e[LANG === "ru" ? 0 : 1]; }

const orig = new WeakMap();
function walk() {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentNode.nodeName;
    if (p === "SCRIPT" || p === "STYLE") continue;
    if (!orig.has(n)) {
      const k = n.nodeValue.trim();
      if (!D.hasOwnProperty(k)) continue;
      orig.set(n, [n.nodeValue, k]);
    }
    const o = orig.get(n);
    n.nodeValue = o[0].replace(o[1], function () { return t(o[1]); });
  }
  document.querySelectorAll("[placeholder]").forEach(function (el) {
    if (!el.dataset.ph) el.dataset.ph = el.placeholder;
    el.placeholder = t(el.dataset.ph);
  });
}
document.documentElement.lang = LANG;
const langSel = document.getElementById("lang");
if (langSel) {
  langSel.value = LANG;
  langSel.addEventListener("change", function () {
    try { localStorage.setItem("lang", langSel.value); } catch (e) {}
    location.reload();
  });
}
if (LANG !== "uz") {
  walk();
  new MutationObserver(walk).observe(document.body, { childList: true, subtree: true });
}
