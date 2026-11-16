# Deployment

The repo produces two static sites and is designed for **two separate Cloudflare Pages projects**:

| Project | Build output directory | Intended domain |
|---|---|---|
| Rain.ly | `dist/rain` | `www.rain.ly` (and/or apex as configured) |
| weather.com.ly | `dist/weather` | `weather.com.ly` |

Each `dist/<site>` is self-contained (root-absolute `/assets/...` paths) and includes its own pages, assets, data, `robots.txt`, and `sitemap.xml`.

## Prerequisites

- Node.js >= 18 (build-time only).
- A Cloudflare account with Pages access and DNS control for the domains.

## Build

```bash
npm run build   # generates dist/rain and dist/weather
npm run check   # validates links/assets, JS syntax, i18n keys
```

## Cloudflare Pages setup (per project)

1. **Create a Pages project** (e.g. `rainly`) and connect this GitHub repository, or upload/direct-deploy the `dist/<site>` directory.
2. **Build settings** (if building in CI on Pages):
   - Build command: `npm run build`
   - Build output directory: `dist/rain` (for the Rain.ly project) or `dist/weather` (for the weather.com.ly project)
   - Node version: 18+ (set via `NODE_VERSION` environment variable if needed)
3. **Custom domain:** attach `www.rain.ly` to the Rain.ly project and `weather.com.ly` to the weather.com.ly project. Configure DNS/redirects (apex ↔ www) per your preference.
4. **Repeat** for the second project pointing at the other output directory.

> Because the two sites are separate Pages projects, deploy hooks/branches can be shared; each project just publishes its own output directory.

## Worker (`workers/_worker.js`)

The repo ships a Pages Advanced Mode worker that:
- serves static assets (`env.ASSETS.fetch`),
- proxies allowlisted data sources via `/api/fetch?url=...` (CORS/cache/cookie stripping),
- adds baseline security headers and a CSP allowing required origins (Leaflet unpkg, Google Fonts, CARTO tiles, RainViewer tiles, data APIs).

To use it with a Pages project, deploy it alongside the site's assets per Cloudflare Pages Functions/Advanced Mode conventions (e.g. place/adapt as the project's worker entry for the deployed output) so that `/api/fetch` is handled at the same origin. If the worker is not deployed, the client still attempts direct fetches to the keyless, CORS-enabled providers.

**CSP/connect sources to keep in sync** when adding providers: update `ALLOW`, `connect-src`/relevant directives in `workers/_worker.js`, and the endpoint in `shared/js/config.js`/`api.js`.

## Local preview

```bash
npm run serve
# http://127.0.0.1:8788/  -> dist/rain
# http://127.0.0.1:8789/  -> dist/weather
```

Separate ports are used because assets are referenced with root-absolute paths.

## Operational notes

- **HTTPS:** `weather.com.ly` previously had an SSL issue (525); ensure the origin/Cloudflare SSL mode and certificate are correctly configured for a fully HTTPS deployment.
- **Legacy key:** revoke/rotate the old exposed OpenWeatherMap key from the prior Blogger site at the provider. This codebase does not reference it.
- **Caching:** static assets can be cached aggressively; the worker sets short cache headers for proxied API responses. Adjust `_headers`/worker policy to taste.
- **Updates:** adding a city or guide is a content/build change — run `npm run build` and redeploy.
