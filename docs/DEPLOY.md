# Deployment / النشر

This repo is the **single source of truth** for two sites built from one build step:

| Project | Build output | Intended domain | Deployment method |
|---|---|---|---|
| Rain.ly | `dist/rain` | `www.rain.ly` | Cloudflare Pages — Git integration (already running) |
| weather.com.ly | `dist/weather` | `weather.com.ly` | Cloudflare Pages — Direct Upload via GitHub Actions |

Each `dist/<site>` is self-contained: pages, assets, data, `robots.txt`, `sitemap.xml`,
`manifest.webmanifest`, `sw.js`, PWA icons and the Pages Advanced Mode worker `_worker.js`.

---

## المشكلة: كلاود فلير يرفض ربط نفس المستودع بمشروعين

> "عند محاولة بناء الموقع بنفس المستودع يعطيك كلاود فلير أن المستودع مستخدم."

هذا سلوك طبيعي في Pages: **كل مستودع GitHub يمكن ربطه بمشروع Pages واحد فقط عبر Git integration**.
الحل الأفضل لا يحتاج إنشاء مستودع ثانٍ ولا يحتاج workers بدل Pages:

**الحل الموصى به:** أبقِ Rain.ly على مشروع Pages المرتبط بـ Git كما هو، وأنشئ مشروع Pages
ثانياً لـ weather.com.ly كـ **Direct Upload** (بدون ربط Git)، ثم انشره تلقائياً من GitHub Actions
الموجود في هذا المستودع عبر `wrangler pages deploy`. هكذا يبقى هذا المستودع مصدراً واحداً للكود،
ويتم تحديث الموقعين تلقائياً عند كل `push` على `main`.

### لماذا هذا هو الأفضل؟

- ✅ مستودع واحد فقط — لا نسخ مكررة ولا مزامنة يدوية.
- ✅ لا تغيير على Rain.ly الذي يعمل بالفعل.
- ✅ نشر تلقائي للموقع الثاني عند كل تحديث، مع إمكانية التشغيل اليدوي عبر زر `Run workflow`.
- ✅ يعمل على الخطة المجانية (Free) دون متطلبات إضافية.

---

## The same-repo limitation (English)

Cloudflare Pages allows a GitHub repository to be connected to **one Git-integrated project only**.
Connecting the same repo to a second project produces the "repository already used" error.

**Recommended fix:** keep Rain.ly on its existing Git-connected Pages project, create the
weather.com.ly project as a **Direct Upload** project (no Git connection), and publish it from
the included GitHub Actions workflow using `wrangler pages deploy`. One repo, two sites, both
auto-updated on every push to `main`.

Alternatives (documented below): Workers Static Assets, or a second mirrored repository.

---

## Option A — Recommended: Git (Rain) + Direct Upload via Actions (weather)

### 1. Create the second Pages project (one time)

In Cloudflare dashboard: **Workers & Pages → Create → Pages → Upload assets**.

- Project name: `weather-com-ly` (must match the workflow).
- Upload any temporary folder to finish creating the project, then continue below.
- Do **not** try to connect the GitHub repo here — that is the step Cloudflare blocks.

### 2. Add the two secrets to this repository

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create token with **Account:Workers Scripts:Edit**, **Account:Account Settings:Read**, **User:User Details:Read** (or use the "Edit Cloudflare Workers" template). |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar → **Account ID**. |

### 3. Push to `main`

The workflow `.github/workflows/deploy-weather.yml` runs automatically:

1. `npm run build` → builds both sites and copies `workers/_worker.js` into each output.
2. `npx wrangler pages deploy dist/weather --project-name=weather-com-ly --branch=main`.

You can also trigger it manually from **Actions → Deploy weather.com.ly → Run workflow**.

### 4. Attach the custom domain

In the `weather-com-ly` project → **Custom domains → Set up a custom domain** → `weather.com.ly`.
Do the same for `www.rain.ly` on the Rain.ly project. Ensure DNS/SSL is set to HTTPS (see notes).

### Rain.ly build settings (unchanged, for reference)

- Build command: `npm run build` (the worker is now copied by the build itself).
- Build output directory: `dist/rain`.
- Deploy command: **leave empty** — `npx wrangler deploy` in that field breaks Pages builds.
- Node version: 18+ (`NODE_VERSION=20` recommended).

---

## Option B — Workers Static Assets instead of Pages (also one repo)

If you prefer Workers, create a `wrangler.toml` for the Weather output and deploy it from an
Action the same way. The existing `workers/_worker.js` already exposes `/api/fetch`; bind the
static output to it:

```toml
name = "weather-com-ly"
main = "workers/_worker.js"
compatibility_date = "2026-01-01"

[assets]
directory = "./dist/weather"
binding = "ASSETS"
```

Deploy with `npx wrangler deploy`. This keeps one repo too, but you lose the Pages-specific
preview deployments/branding, so Option A is usually simpler for a site like this.

---

## Option C — Second mirrored repository (simplest concept, least ideal)

Create `Gamingmonster2/weather-weather` and push the same code there:

```bash
git remote add weather https://github.com/Gamingmonster2/weather-weather.git
git push weather main
```

Then connect that repo to the second Pages project as usual. It works, but now you maintain two
repos and must remember to push to both — Option A avoids that.

---

## Build & local checks

```bash
npm run verify   # build + link/asset/JS/i18n checks
npm run serve
# http://127.0.0.1:8788/  -> dist/rain
# http://127.0.0.1:8789/  -> dist/weather
```

Separate ports are used because assets are referenced with root-absolute paths.

## Worker (`workers/_worker.js`)

- Serves static assets via `env.ASSETS.fetch`.
- Proxies allowlisted keyless APIs via `/api/fetch?url=...` (CORS/cache/cookie stripping).
- Adds baseline security headers and CSP (Leaflet unpkg, Google Fonts, OSM and RainViewer tiles, data APIs).

It is copied into `dist/rain` and `dist/weather` by `npm run build`, so Pages Advanced Mode
activates `/api/fetch` on the same origin automatically. When adding a provider, update `ALLOW`,
the CSP directives in `workers/_worker.js`, and the endpoints in `shared/js/config.js` / `api.js`.

## Operational notes

- **HTTPS:** ensure Cloudflare SSL mode/certificate is valid for `weather.com.ly` (past 525 errors).
- **Legacy key:** revoke/rotate the old exposed OpenWeatherMap key from the prior Blogger site; this repo does not use it.
- **Caching:** static assets can be cached aggressively; the worker sets short cache headers for proxied API responses.
- **Content updates:** adding a city or guide is a content/build change — the Action rebuilds and redeploys on push.
