# Deployment / النشر

هذا المستودع هو **المصدر الأساسي** للكود. من مصدر واحد يتم بناء موقعين:

| الموقع | مجلد الإخراج | الدومين | المستودع | مشروع Cloudflare Pages |
|---|---|---|---|---|
| Rain.ly | `dist/rain` | `www.rain.ly` | `Gamingmonster2/weather` (هذا) | المشروع الحالي المرتبط بـ Git |
| weather.com.ly | `dist/weather` | `weather.com.ly` | `Gamingmonster2/weather-2` (Fork مرتبط) | مشروع ثانٍ مرتبط بـ Git |

كل مجلد `dist/<site>` مستقل تماماً: صفحات، أصول، بيانات، `robots.txt`، `sitemap.xml`،
`manifest.webmanifest`، `sw.js`، أيقونات PWA، وملف `_worker.js` الخاص بـ Pages Advanced Mode.

---

## لماذا مستودع ثانٍ؟ / Why a second repo?

Cloudflare Pages يسمح بربط **مستودع GitHub واحد بمشروع Pages واحد فقط** عبر Git integration.
لذلك لا يمكن ربط هذا المستودع بمشروعين. الحل المختار (الأبسط):

- ننشئ **Fork** من هذا المستودع باسم `weather-2` — GitHub يربطه تلقائياً بالمستودع الأصلي
  (يظهر "forked from Gamingmonster2/weather")، فيبقى المستودعان مرتبطين.
- نربط الـ Fork بمشروع Pages الثاني كأي مشروع عادي.
- عند التحديث نرفع نفس الكود إلى الاثنين بأمرين في الطرفية (أو نستخدم مزامنة تلقائية اختيارية).

لا حاجة لـ Secrets أو GitHub Actions أو Direct Upload أو Workers.

> ملاحظة: لا تقم بتخزين بلاطات الخريطة داخل المستودع أو Releases. سياسة
> OpenStreetMap تمنع صراحةً تحميل البلاطات بالجملة أو توزيع أرشيفاتها للاستخدام دون اتصال:
> https://operations.osmfoundation.org/policies/tiles/
> الخريطة تعمل عبر بلاطات OSM الرسمية مع كاش المتصفح الطبيعي، وهذا مسموح وموثوق.

---

## الخطوات العملية / Steps

### 1. أنشئ الـ Fork

على GitHub افتح https://github.com/Gamingmonster2/weather واضغط **Fork**، واجعل الاسم
`weather-2` (يفضّل اسم إنجليزي خالٍ من المسافات حتى يكون رابط المستودع نظيفاً لـ Cloudflare).
سيظهر الـ Fork مرتبطاً بالمستودع الأصلي تلقائياً.

> إن فضّلت مستودعاً جديداً فارغاً بدل Fork: أنشئه ثم ادفع الكود إليه بالأوامر أدناه — لكنك
> ستفقد رابط "forked from" التلقائي؛ يمكنك إضافته يدوياً في README كل مستودع.

### 2. اربط Fork بمشروع Pages الثاني

Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → اختر `Gamingmonster2/weather-2`.

إعدادات البناء لكلا المشروعين:

- **Build command:** `npm run build` (يقوم تلقائياً بنسخ `workers/_worker.js` داخل مجلدي الإخراج).
- **Build output directory:** `dist/rain` للمشروع الأول، `dist/weather` للمشروع الثاني.
- **Deploy command:** اتركه **فارغاً** — كتابة `npx wrangler deploy` فيه تُفشل بناء Pages.
- **Node version:** 18+ (`NODE_VERSION=20` موصى به).

### 3. اربط الدومينات

- مشروع Rain → Custom domains → `www.rain.ly`.
- مشروع weather → Custom domains → `weather.com.ly`.
- تأكد من SSL/HTTPS صحيح (كانت هناك أخطاء 525 سابقاً).

---

## مزامنة المستودعين / Keeping them in sync

من نسختك المحلية أضف الـ Fork كـ remote إضافي مرة واحدة:

```bash
git remote add weather2 https://github.com/Gamingmonster2/weather-2.git
```

بعد كل تعديل ودمج على `main`، ادفع إلى الاثنين:

```bash
git push origin main
git push weather2 main
```

وإن أردت سحب أي تحديث من الأصل إلى Fork لاحقاً:

```bash
git fetch origin
git checkout main
git merge origin/main
git push weather2 main
```

> بديل اختياري إذا أردت مزامنة تلقائية: أضف ملف workflow بسيط في الـ Fork يسحب من
> `upstream` كل يوم أو عند كل push. لا نحتاجه الآن — الطريقتان أعلاه كافيتان.

---

## البدائل (إن غيّرت رأيك لاحقاً)

- **GitHub Actions + Direct Upload:** إنشاء مشروع Pages ثانٍ بنوع Direct Upload ونشره من نفس
  المستودع عبر `wrangler pages deploy dist/weather` — مستودع واحد بلا Fork، لكن يحتاج سريين
  (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`) وملف workflow.
- **Workers Static Assets:** استخدام `workers/_worker.js` مع `[assets] directory = "./dist/weather"`
  في `wrangler.toml`. يعمل لكنه يفقد مزايا Pages.

## البناء والفحص المحلي

```bash
npm run verify   # بناء + فحص الروابط/الأصول/JS/i18n
npm run serve
# http://127.0.0.1:8788/  -> dist/rain
# http://127.0.0.1:8789/  -> dist/weather
```

## Worker (`workers/_worker.js`)

- يقدّم الملفات الثابتة عبر `env.ASSETS.fetch`.
- يوكّل مصادر البيانات المجانية عبر `/api/fetch?url=...` مع تنظيف CORS والكاش والكوكيز.
- يضيف ترويسات أمان و CSP.
- يُنسخ تلقائياً إلى `dist/rain` و `dist/weather` بواسطة `npm run build`، لذلك يعمل `/api/fetch`
  على نفس الدومين في وضع Pages Advanced Mode.

## ملاحظات تشغيلية

- **HTTPS:** تأكد من شهادة/وضع SSL صالح لـ `weather.com.ly`.
- **المفتاح القديم:** ألغِ/بدّل مفتاح OpenWeatherMap القديم المسرب من الموقع السابق؛ هذا الكود لا يستخدمه.
- **التحديثات:** إضافة مدينة أو دليل = تغيير محتوى؛ ابني وأعد النشر (أو ادفع إلى المستودعين).
