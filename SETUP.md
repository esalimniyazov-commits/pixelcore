# Firebase sozlash (hisob + admin panel uchun, tekin)

GitHub Pages faqat tayyor fayllarni beradi, shuning uchun hisoblar va ma'lumotlar Firebase'da saqlanadi.

1. https://console.firebase.google.com ga Google akkaunt bilan kiring → **Add project** → nom bering (masalan, `pixelcore`). Analytics shart emas.
2. **Build → Authentication → Get started → Email/Password** ni yoqing (Enable).
3. **Build → Firestore Database → Create database** → joylashuvni tanlang → **Production mode**.
4. Firestore'ning **Rules** bo'limiga quyidagini qo'ying (`ADMIN_EMAIL@gmail.com` o'rniga o'z emailingiz) va **Publish** bosing:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email in ['ADMIN_EMAIL@gmail.com'];
    }
    match /games/{id} {
      allow read: if true;
      allow create, delete: if isAdmin();
      // admin hammasini o'zgartiradi; boshqalar faqat yuklashlar sonini 1 taga oshiradi
      allow update: if isAdmin() || (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['downloads'])
        && request.resource.data.get('downloads', 0) == resource.data.get('downloads', 0) + 1);
    }
    match /news/{id} { allow read: if true; allow write: if isAdmin(); }
    match /shots/{id} { allow read: if true; allow write: if isAdmin(); }
    match /reviews/{rid} {
      allow read: if true;
      allow create, update: if request.auth != null
        && rid == request.resource.data.gameId + '_' + request.auth.uid
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.stars is int && request.resource.data.stars >= 1 && request.resource.data.stars <= 5
        && request.resource.data.text is string && request.resource.data.text.size() <= 500;
      allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || isAdmin());
    }
    match /feedback/{id} {
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid
        && request.resource.data.text is string && request.resource.data.text.size() >= 1 && request.resource.data.text.size() <= 1000;
      allow read, delete: if isAdmin();
    }
    match /users/{uid} {
      allow read: if (request.auth != null && request.auth.uid == uid) || isAdmin();
      allow write: if request.auth != null && request.auth.uid == uid && request.resource.data.keys().hasOnly(['email', 'favs']);
    }
    match /scores/{uid} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == uid
        && request.resource.data.score is int && request.resource.data.score >= 0 && request.resource.data.score <= 150;
      allow update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.score is int && request.resource.data.score > resource.data.score && request.resource.data.score <= 150;
    }
  }
}
```

5. **Project settings (tishli g'ildirak) → General → Your apps → Web (`</>`)** ni bosing, ilovaga nom bering. Chiqqan `firebaseConfig` ichidagi `apiKey`, `authDomain`, `projectId`, `appId` qiymatlarini `firebase.js` ning tepasiga yozing.
6. `firebase.js` dagi `ADMIN_EMAILS` ichiga ham o'sha emailni yozing.
7. **Authentication → Settings → Authorized domains** ga sayt manzilingizni qo'shing: `esalimniyazov-commits.github.io` (`localhost` odatda bor).
8. Saytda shu email bilan **Ro'yxatdan o'tish** qiling, pochtaga kelgan xatdagi havolani bosib emailni tasdiqlang. Keyin **Kirish → Admin panel**.

Eslatma: `firebase.js` dagi `apiKey` yashirin kalit emas, ochiq turishi normal. Himoya 4-bandagi qoidalarda.

Saytni `file://` (faylni ikki marta bosib) emas, VSCodium'dagi **Live Server** kengaytmasi yoki GitHub Pages orqali oching, aks holda kirish ishlamasligi mumkin.

Sayt manzilini o'zgartirsangiz (repo nomi `pixelcore` emas bo'lsa), `index.html` dagi `canonical` va `og:image`, shuningdek `sitemap.xml` va `robots.txt` ichidagi manzilni yangilang.

Natijalar jadvali o'yin uchun, ya'ni ko'ngilochar: brauzer konsoli orqali 150 gacha ball yozib qo'yish mumkin, qoidalar buni faqat shu chegarada ushlab turadi.