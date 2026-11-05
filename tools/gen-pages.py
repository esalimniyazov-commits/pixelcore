# PixelCore 2.0 — HTML sahifalarni bir xil qolipdan yaratadi (faqat ishlab chiqish vaqtida kerak).
import os
SITE="https://pixelcore-delta.vercel.app"
FB=''.join('  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-%s-compat.js"></script>\n'%x for x in ("app","auth","firestore"))
def head(file,title,desc,og_img="og.png",extra=""):
    url=SITE+"/"+("" if file=="index.html" else file)
    alt="".join('  <link rel="alternate" hreflang="%s" href="%s?lang=%s">\n'%(l,url,l) for l in ("uz","ru","en"))+'  <link rel="alternate" hreflang="x-default" href="%s">\n'%url
    return f'''<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#7c3aed">
  <link rel="canonical" href="{url}">
{alt}  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="icon" href="icon-192.png" sizes="192x192" type="image/png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="PixelCore Studio">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{SITE}/{og_img}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{SITE}/{og_img}">
{extra}  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
'''
def page(file,key,title,desc,main,scripts=(),extra="",noindex=False):
    h=head(file,title,desc,extra=extra)
    if noindex: h=h.replace('  <meta name="theme-color"','  <meta name="robots" content="noindex, nofollow">\n  <meta name="theme-color"')
    sc='\n'.join('  <script src="%s"></script>'%s for s in ["firebase.js","links.js","js/dict.js","js/i18n.js","js/core.js","js/pages.js"]+list(scripts))
    return h+f'''<body data-page="{key}">
  <a class="skip" href="#main" data-i18n="a11y.skip">Asosiy mazmunga o'tish</a>
  <div id="site-header"></div>
  <main id="main">
{main}
  </main>
  <div id="site-footer"></div>
  <noscript><p style="padding:20px;text-align:center">PixelCore Studio JavaScript talab qiladi / requires JavaScript.</p></noscript>
{FB}{sc}
</body>
</html>
'''
def top(h,p): return f'    <div class="wrap page-top"><h1 class="page-h" data-i18n="{h}"></h1><p data-i18n="{p}"></p></div>'
W=[]
pages={}
LD='  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"PixelCore Studio","url":"%s/","logo":"%s/icon-512.png","sameAs":["https://t.me/PixelCoreStudio"]}</script>\n'%(SITE,SITE)
pages["index.html"]=page("index.html","home","PixelCore Studio — Android, Windows va macOS uchun o'yinlar","PixelCore Studio: mustaqil o'yin studiyasi. Android, Windows va macOS uchun o'yinlar, yangiliklar va rivojlanish rejasi.",'''    <section class="wrap hero">
      <div>
        <span class="eyebrow" data-i18n="home.eyebrow"></span>
        <h1><span data-i18n="home.h1a"></span> <em data-i18n="home.h1b"></em></h1>
        <p class="lead" data-i18n="home.lead"></p>
        <div class="plats"><span>Android</span><span>Windows</span><span>macOS</span></div>
        <div class="row"><a class="btn primary" href="games.html" data-i18n="home.cta1"></a><a class="btn" data-link="telegram" target="_blank" rel="noopener" data-i18n="home.cta2"></a></div>
      </div>
      <button class="hero-logo" id="logoBtn" type="button" data-i18n-aria="home.logo"><span class="ring"></span><span class="ring r2"></span><svg class="mark"><use href="#logo"/></svg></button>
    </section>
    <section class="sec wrap"><div class="stats" id="stats"></div></section>
    <section class="sec wrap" id="featSec"><div class="sec-head"><h2 data-i18n="home.featured"></h2></div><div class="feat" id="feat" hidden></div></section>
    <section class="sec wrap"><div class="sec-head"><div><h2 data-i18n="home.newGames"></h2></div><a class="more" href="games.html" data-i18n="home.allGames"></a></div><div class="grid" id="newGames"></div></section>
    <section class="sec wrap" id="services"><div class="sec-head"><div><h2 data-i18n="home.srvH"></h2><p data-i18n="home.srvP"></p></div><a class="more" href="services.html" data-i18n="home.more"></a></div><div class="srv-grid" id="srvList"></div></section>
    <section class="sec wrap" id="about"><div class="two"><div><h2 data-i18n="home.aboutH"></h2><p class="lead" data-i18n="home.aboutP"></p><a class="more" href="about.html" data-i18n="home.more"></a></div>
      <ul class="facts" style="margin:0"><li><b data-i18n="fact.a.t"></b><span data-i18n="fact.a.d"></span></li><li><b data-i18n="fact.b.t"></b><span data-i18n="fact.b.d"></span></li><li><b data-i18n="fact.c.t"></b><span data-i18n="fact.c.d"></span></li></ul></div></section>
    <section class="sec wrap"><div class="sec-head"><div><h2 data-i18n="about.tech"></h2><p data-i18n="home.techP"></p></div><a class="more" href="about.html#tech" data-i18n="home.more"></a></div><div class="tech" id="techList"></div></section>
    <section class="sec wrap" id="partSec" hidden><div class="sec-head"><h2 data-i18n="home.partners"></h2></div><div class="partners" id="partList"></div></section>
    <section class="sec wrap"><div class="sec-head"><h2 data-i18n="home.news"></h2><a class="more" href="news.html" data-i18n="home.allNews"></a></div><div class="news" id="newsList"></div></section>
    <section class="sec wrap"><div class="panel" style="text-align:center"><h2 data-i18n="home.didYou"></h2><p class="lead" id="fact" style="transition:opacity .25s;min-height:3.4em"></p><button class="btn sm" id="next" type="button" data-i18n="home.nextFact"></button></div></section>''',extra=LD)
pages["games.html"]=page("games.html","games","O'yinlar katalogi — PixelCore Studio","PixelCore Studio o'yinlari: janr, platforma va holat bo'yicha qidiring, yuklab oling.",top("games.h","games.p")+'''
    <div class="wrap" style="padding-bottom:20px">
      <div class="filters">
        <input class="field" id="q" type="search" data-i18n-ph="games.search" data-i18n-aria="games.search">
        <select class="field" id="flt" data-i18n-aria="games.status"><option value="" data-i18n="common.all"></option><option value="rel" data-i18n="st.rel"></option><option value="dev" data-i18n="st.dev"></option><option value="soon" data-i18n="st.soon"></option><option value="fav" data-i18n="fav.filter"></option></select>
        <select class="field" id="plat" data-i18n-aria="game.platforms"><option value="" data-i18n="games.allPlats"></option><option value="android">Android</option><option value="windows">Windows</option><option value="mac">macOS</option></select>
        <select class="field" id="genre" data-i18n-aria="games.genre"></select>
        <select class="field" id="sort" data-i18n-aria="games.sort"><option value="new" data-i18n="sort.new"></option><option value="upd" data-i18n="sort.upd"></option><option value="name" data-i18n="sort.name"></option><option value="dl" data-i18n="sort.dl"></option></select>
      </div>
      <div class="chips" id="chips"><button type="button" data-sort="dl" data-i18n="games.popular"></button><button type="button" data-sort="new" data-i18n="games.latest"></button><button type="button" data-sort="upd" data-i18n="sort.upd"></button></div>
      <p class="muted" id="count" aria-live="polite"></p>
      <div class="grid" id="games"></div>
    </div>''')
pages["app.html"]=page("app.html","app","O'yin — PixelCore Studio","PixelCore Studio o'yini haqida batafsil ma'lumot.",'''    <div class="wrap" id="app" style="padding-bottom:30px"><p class="muted" data-i18n="common.loading"></p></div>
    <dialog id="zoom" class="wide"><img id="zimg" alt="" style="width:100%;border-radius:12px"><div class="row" style="margin-top:14px"><button class="btn sm" id="zprev" type="button">←</button><button class="btn sm" id="znext" type="button">→</button><button class="btn sm" id="zc" type="button" style="margin-left:auto" data-i18n="common.close"></button></div></dialog>''')
news_main=lambda h,p:top(h,p)+'''
    <div class="wrap" style="padding-bottom:20px">
      <div class="filters" style="grid-template-columns:1fr"><input class="field" id="q" type="search" data-i18n-ph="news.search" data-i18n-aria="news.search"></div>
      <div class="chips" id="chips"></div>
      <div class="news" id="newsList"></div>
      <div style="text-align:center;margin-top:24px"><button class="btn" id="more" type="button" hidden data-i18n="common.more"></button></div>
    </div>'''
pages["news.html"]=page("news.html","news","Yangiliklar — PixelCore Studio","PixelCore Studio yangiliklari, yangilanishlar va tadbirlar.",news_main("news.h","news.p"))
pages["article.html"]=page("article.html","article","Yangilik — PixelCore Studio","PixelCore Studio yangiligi.",'    <div class="wrap art" id="art" style="padding:40px clamp(18px,4.5vw,48px)"><p class="muted" data-i18n="common.loading"></p></div>')
pages["about.html"]=page("about.html","about","Studio haqida — PixelCore Studio","PixelCore Studio kimlar va nima bilan shug'ullanadi: jamoa, texnologiyalar va dasturlar.",top("about.h","about.p")+'''
    <section class="sec wrap"><div class="two"><div><h2 data-i18n="home.aboutH"></h2><p class="lead" data-i18n="about.logoP"></p></div><ul class="facts" style="margin:0"><li><b data-i18n="fact.a.t"></b><span data-i18n="fact.a.d"></span></li><li><b data-i18n="fact.b.t"></b><span data-i18n="fact.b.d"></span></li><li><b data-i18n="fact.c.t"></b><span data-i18n="fact.c.d"></span></li></ul></div></section>
    <section class="sec wrap" id="team"><div class="sec-head"><h2 data-i18n="about.team"></h2></div><div class="team" id="teamList"></div></section>
    <section class="sec wrap" id="tech"><div class="sec-head"><div><h2 data-i18n="about.tech"></h2><p data-i18n="about.techP"></p></div></div><div class="tech" id="techList"></div></section>
    <section class="sec wrap" id="software"><div class="sec-head"><h2 data-i18n="about.sw"></h2></div><div class="tech" id="swList"></div></section>
    <section class="sec wrap" id="presskit"><div class="panel"><h2 data-i18n="about.kit"></h2><p class="muted" data-i18n="about.kitP"></p><div class="row"><button class="btn sm" type="button" data-kit="#c084fc,#e9d5ff,pixelcore-neon" data-i18n="kit.neon"></button><button class="btn sm" type="button" data-kit="#4c1d95,#7c3aed,pixelcore-purple" data-i18n="kit.purple"></button><button class="btn sm" type="button" data-kit="#ffffff,#c9d1da,pixelcore-white" data-i18n="kit.white"></button></div></div></section>''')
pages["services.html"]=page("services.html","services","Xizmatlar — sayt, Telegram bot, taqdimot, matn | PixelCore Studio","PixelCore Studio xizmatlari: veb-sayt, Telegram bot, taqdimot, maqola, test va hujjatlar AI yordamida, hamyonbop narxlarda.",top("services.h","services.p")+'''
    <section class="sec wrap" style="padding-bottom:0"><div class="panel ai-banner"><span class="badge">AI</span><div><h2 data-i18n="srv.ai.h"></h2><p class="lead" data-i18n="srv.ai.p"></p></div></div></section>
    <section class="sec wrap"><div class="srv-grid" id="srvList"></div></section>
    <section class="sec wrap" id="packages"><div class="sec-head"><div><h2 data-i18n="pkg.h"></h2><p data-i18n="pkg.p"></p></div></div>
      <h3 class="pkg-h" data-i18n="pkg.web.h"></h3><div class="pkg-grid" id="pkg_web"></div><p class="muted pkg-note" data-i18n="pkg.note.web"></p>
      <h3 class="pkg-h" data-i18n="pkg.bot.h"></h3><div class="pkg-grid" id="pkg_bot"></div><p class="muted pkg-note" data-i18n="pkg.note.bot"></p></section>
    <section class="sec wrap" id="portSec" hidden><div class="sec-head"><div><h2 data-i18n="port.h"></h2><p data-i18n="port.p"></p></div></div><div class="news" id="portList"></div></section>
    <section class="sec wrap"><div class="sec-head"><h2 data-i18n="srv.how.h"></h2></div><ol class="steps"><li><b data-i18n="srv.s1.t"></b><span data-i18n="srv.s1.d"></span></li><li><b data-i18n="srv.s2.t"></b><span data-i18n="srv.s2.d"></span></li><li><b data-i18n="srv.s3.t"></b><span data-i18n="srv.s3.d"></span></li><li><b data-i18n="srv.s4.t"></b><span data-i18n="srv.s4.d"></span></li></ol></section>
    <section class="sec wrap"><div class="sec-head"><h2 data-i18n="srv.why.h"></h2></div><ul class="facts" style="margin:0"><li><b data-i18n="srv.w1.t"></b><span data-i18n="srv.w1.d"></span></li><li><b data-i18n="srv.w2.t"></b><span data-i18n="srv.w2.d"></span></li><li><b data-i18n="srv.w3.t"></b><span data-i18n="srv.w3.d"></span></li></ul></section>
    <section class="sec wrap"><div class="sec-head"><h2 data-i18n="srv.faq.h"></h2></div><div class="faq"><details><summary data-i18n="srv.q1"></summary><p data-i18n="srv.a1"></p></details><details><summary data-i18n="srv.q2"></summary><p data-i18n="srv.a2"></p></details><details><summary data-i18n="srv.q3"></summary><p data-i18n="srv.a3"></p></details><details><summary data-i18n="srv.q4"></summary><p data-i18n="srv.a4"></p></details></div></section>
    <section class="sec wrap"><div class="panel" style="text-align:center"><h2 data-i18n="srv.cta.h"></h2><p class="lead" data-i18n="srv.cta.p"></p><div class="row" style="justify-content:center"><a class="btn primary" data-link="support" target="_blank" rel="noopener" data-i18n="srv.order"></a><a class="btn" href="contact.html#ct" data-i18n="srv.msg"></a></div></div></section>''')
pages["contact.html"]=page("contact.html","contact","Aloqa — PixelCore Studio","PixelCore Studio bilan bog'laning: xabar yuboring, xatolik haqida xabar bering yoki taklif qoldiring.",top("contact.h","contact.p")+'''
    <section class="sec wrap"><div class="two">
      <div class="panel" id="ct"><h2 data-i18n="ct.title"></h2><form id="ctForm" class="stack" style="max-width:none"><input class="field" id="ctName" required maxlength="80" data-i18n-ph="ct.name" data-i18n-aria="ct.name"><input class="field" id="ctMail" type="email" required maxlength="120" placeholder="Email" aria-label="Email"><input id="ctWeb" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><textarea class="field" id="ctText" required maxlength="2000" data-i18n-ph="ct.msg" data-i18n-aria="ct.msg"></textarea><p class="err" id="ctMsg" role="status"></p><button class="btn primary sm" data-i18n="common.send"></button></form></div>
      <div class="panel" id="feedback"><h2 data-i18n="fb.title"></h2><form id="fbForm" class="stack" style="max-width:none"><select class="field" id="fbType" data-i18n-aria="fb.type"><option value="bug" data-i18n="fbt.bug"></option><option value="suggestion" data-i18n="fbt.suggestion"></option><option value="question" data-i18n="fbt.question"></option></select><select class="field" id="fbGame" data-i18n-aria="fb.game"></select><textarea class="field" id="fbText" required maxlength="1000" data-i18n-ph="fb.ph" data-i18n-aria="fb.ph"></textarea><p class="muted" id="fbLogin" hidden data-i18n="fb.login"></p><p class="err" id="fbMsg" role="status"></p><button class="btn primary sm" data-i18n="common.send"></button></form></div>
    </div></section>
    <section class="sec wrap"><div class="sec-head"><h2 data-i18n="contact.follow"></h2></div><div class="links"><a class="link" data-link="telegram" target="_blank" rel="noopener"><b>Telegram</b><span data-i18n="contact.tgD"></span></a><a class="link" data-link="instagram" target="_blank" rel="noopener"><b>Instagram</b><span data-i18n="contact.igD"></span></a><a class="link" data-link="support" target="_blank" rel="noopener"><b data-i18n="contact.support"></b><span data-i18n="contact.supD"></span></a></div></section>
    <section class="sec wrap"><div class="sec-head"><h2 data-i18n="faq.h"></h2></div><div class="faq">'''+''.join('<details><summary data-i18n="faq.q%d"></summary><p data-i18n="faq.a%d"></p></details>'%(i,i) for i in range(1,7))+'</div></section>')
pages["profile.html"]=page("profile.html","profile","PixelCore ID — profil","PixelCore ID: profilingiz, sevimli o'yinlar va yutuqlar.",'    <div class="wrap prof" id="prof" style="padding-top:40px"><p class="muted" data-i18n="common.loading"></p></div>',noindex=True)
pages["admin.html"]=page("admin.html","admin","PixelCore Admin","PixelCore boshqaruv paneli.",'''    <div class="wrap" style="padding-top:20px;padding-bottom:40px"><p id="gate" class="muted" data-i18n="a.checking"></p><div id="panel" hidden></div></div>''',scripts=["js/admin.js"],noindex=True)
PRIV={
"uz":("Maxfiylik siyosati","Oxirgi yangilanish: 2026-10-31",[("1. Umumiy","Bu sahifa PixelCore Studio saytida qanday ma'lumotlar ishlatilishini tushuntiradi. Ilovalarimiz haqida 6-bo'limda."),("2. Saytda qanday ma'lumotlar yig'iladi","Sayt hisobsiz ham ochiladi. Hisob yaratsangiz: email (parol Firebase Authentication tomonidan himoyalangan holda saqlanadi, biz uni ko'ra olmaymiz), foydalanuvchi nomi va avatar, sevimli o'yinlar, sharh va izohlar (ochiq ko'rinadi, muallif sifatida foydalanuvchi nomingiz ko'rsatiladi), xatolik haqida xabarlar va takliflar (faqat administrator ko'radi). Aloqa formasi orqali yuborgan ismingiz, emailingiz va xabaringiz faqat administratorga ko'rinadi."),("3. Ma'lumotlar qayerda saqlanadi","Ma'lumotlar Google Firebase (Authentication va Firestore) xizmatida saqlanadi. Sayt reklama yoki uchinchi tomon analitikasidan foydalanmaydi. Shriftlar Google Fonts orqali yuklanadi, shuning uchun brauzeringiz Google serverlariga murojaat qiladi. Sayt Vercel orqali taqdim etiladi."),("4. Brauzer xotirasi va cookie","Brauzeringizda qulaylik uchun til, sevimlilar ro'yxati, yuklash belgisi va cookie tanlovingiz saqlanadi. Agar \"statistika\" ruxsatini bersangiz, sessiyada bir marta umumiy tashriflar hisoblagichi oshiriladi (shaxsiy ma'lumotsiz). Tanlovni sahifa pastidagi \"Cookie sozlamalari\" orqali o'zgartirishingiz mumkin."),("5. Ma'lumotlarni o'chirish","Profil sahifasidagi \"Hisobni o'chirish\" tugmasi hisobingizni, sharh va izohlaringizni o'chiradi. Yuborgan xabarlaringizni o'chirish uchun quyidagi manzilga yozing."),("6. Ilovalarimiz","Ilova va o'yinlarimiz foydalanuvchidan hech qanday shaxsiy ma'lumot yig'maydi, saqlamaydi va uchinchi tomonlarga yubormaydi. Ilovalar reklama yoki statistika vositalaridan foydalanmaydi."),("7. Bog'lanish","Savollar uchun: esalimniyazov@gmail.com yoki Telegram: t.me/PixelCoreStudio.")]),
"ru":("Политика конфиденциальности","Последнее обновление: 2026-10-31",[("1. Общие сведения","Эта страница объясняет, какие данные используются на сайте PixelCore Studio. О наших приложениях — в разделе 6."),("2. Какие данные собираются","Сайт работает и без аккаунта. При создании аккаунта сохраняются: email (пароль защищён Firebase Authentication, мы его не видим), имя пользователя и аватар, избранные игры, отзывы и комментарии (они публичны, автором указывается ваше имя пользователя), сообщения об ошибках и предложения (видит только администратор). Имя, email и сообщение из формы обратной связи видит только администратор."),("3. Где хранятся данные","Данные хранятся в Google Firebase (Authentication и Firestore). Сайт не использует рекламу и сторонню аналитику. Шрифты загружаются через Google Fonts, поэтому браузер обращается к серверам Google. Сайт размещён на Vercel."),("4. Память браузера и cookie","В браузере хранятся язык, список избранного, отметка о скачивании и ваш выбор cookie. Если вы разрешили «статистику», один раз за сессию увеличивается общий счётчик посещений (без персональных данных). Выбор можно изменить через «Настройки cookie» внизу страницы."),("5. Удаление данных","Кнопка «Удалить аккаунт» на странице профиля удаляет аккаунт, отзывы и комментарии. Чтобы удалить отправленные сообщения, напишите по адресу ниже."),("6. Наши приложения","Наши приложения и игры не собирают, не хранят и не передают третьим лицам никаких персональных данных. Приложения не используют рекламу и средства статистики."),("7. Контакты","По вопросам: esalimniyazov@gmail.com или Telegram: t.me/PixelCoreStudio.")]),
"en":("Privacy Policy","Last updated: 2026-10-31",[("1. Overview","This page explains what data is used on the PixelCore Studio website. Our apps are covered in section 6."),("2. What data is collected","The site works without an account. If you create one we store: your email (the password is protected by Firebase Authentication and we cannot see it), username and avatar, favorite games, reviews and comments (public, shown under your username), and bug reports and suggestions (visible to the administrator only). The name, email and message you send through the contact form are visible to the administrator only."),("3. Where data is stored","Data is stored in Google Firebase (Authentication and Firestore). The site uses no advertising or third-party analytics. Fonts are loaded from Google Fonts, so your browser contacts Google servers. The site is hosted on Vercel."),("4. Browser storage and cookies","Your browser stores your language, favorites list, a download marker and your cookie choice. If you allow \"statistics\", a general visit counter is incremented once per session (no personal data). You can change this via \"Cookie preferences\" at the bottom of the page."),("5. Deleting your data","The \"Delete account\" button on your profile page removes your account, reviews and comments. To remove messages you sent, write to the address below."),("6. Our apps","Our apps and games do not collect, store or share any personal data with third parties. They use no advertising or analytics tools."),("7. Contact","Questions: esalimniyazov@gmail.com or Telegram: t.me/PixelCoreStudio.")]),
}
priv=''
for l,(h,u,secs) in PRIV.items():
    priv+='    <article data-lang="%s"%s><h1 class="page-h">%s</h1><p class="muted">%s</p>\n'%(l,'' if l=="uz" else ' hidden',h,u)+''.join('      <h2 style="font-size:22px;margin:28px 0 8px">%s</h2><p class="lead" style="font-size:16.5px">%s</p>\n'%(a,b) for a,b in secs)+'    </article>\n'
pages["privacy.html"]=page("privacy.html","privacy","Maxfiylik siyosati — PixelCore Studio","PixelCore Studio maxfiylik siyosati.",'    <div class="wrap" style="max-width:860px;padding-top:40px">\n'+priv+'    </div>')
for f,c in pages.items(): open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..',f),'w').write(c)
# alohida soddalashtirilgan sahifalar (404, offline): absolyut yo'llar
def simple(file,key,tk,pk,btn,href):
    return f'''<!DOCTYPE html>
<html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>PixelCore Studio</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"></head>
<body data-page="{key}" style="align-items:center;justify-content:center;text-align:center;padding:24px">
<div><svg width="110" height="110" viewBox="0 0 555 555" style="margin:0 auto 20px" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c084fc"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><path fill="url(#g)" fill-rule="evenodd" d="M0 0H262V272H0Z M83 83H248V157H150V255H83Z M295 0H555V272H295Z M472 83H307V157H405V255H472Z M0 297H262V555H0Z M83 472H248V398H150V300H83Z M295 297H555V555H295Z M472 472H307V398H405V300H472Z"/><circle cx="278" cy="279" r="65" fill="#e9d5ff"/></svg>
<h1 class="page-h" data-i18n="{tk}"></h1><p class="muted" data-i18n="{pk}"></p><a class="btn primary" href="{href}" data-i18n="{btn}"></a></div>
<script src="/js/dict.js"></script><script src="/js/i18n.js"></script><script src="/js/simple.js"></script></body></html>
'''
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','404.html'),'w').write(simple('404.html','404','e404.t','e404.p','e404.b','/'))
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','offline.html'),'w').write(simple('offline.html','offline','off.t','off.p','off.b','/'))
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','js','simple.js'),'w').write('"use strict";applyI18n(document);document.title="PixelCore Studio — "+t(document.body.dataset.page==="404"?"e404.t":"off.t");\n')
print(sorted(pages))
