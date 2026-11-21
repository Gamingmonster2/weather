# SEO

## Strategy

- **Indexable, static HTML** pages generated at build time (no client-only routing) for core, city, and guide content.
- **Bilingual content** (Arabic/English) with correct `lang`/`dir` handling and on-page language toggling for guides; hreflang/canonical tags emitted per page.
- **Libya-first topical coverage:** one dedicated page per Libyan city plus practical guides, cross-linked from hubs.

## Page types (per site)

| Type | Path | Source |
|---|---|---|
| Home | `/` | `apps/<site>/pages/index.html` |
| Cities hub | `/cities.html` | `apps/<site>/pages/cities.html` |
| City detail | `/city/<id>.html` | `apps/<site>/pages/city.html` + `shared/data/cities.json` |
| Guides hub | `/guides.html` | `apps/<site>/pages/guides.html` |
| Guide | `/guides/<slug>.html` | `content/<site>/<slug>.<lang>.md` |
| About | `/about.html` | `apps/<site>/pages/about.html` |
| 404 | `/404.html` | `apps/<site>/pages/404.html` |

## Metadata & head tags

`scripts/build.mjs` derives every page's head from one `pageMeta()` object, so there is a single source of truth for:

- `<title>` and `<meta name="description">` — unique per page, with both English and Arabic variants; core pages, all 26 city deep links and every guide have their own copy.
- `link[rel=canonical]` and real `hreflang` alternates (`?lang=ar`, `?lang=en`, plus `x-default`). `?lang=` is read by `detectLang()` in `shared/js/i18n.js`, so each alternate is a genuine URL.
- Open Graph: `og:type` (`article` for guides), `og:title`, `og:description`, `og:url`, `og:image`, `og:image:alt`, `og:locale`/`og:locale:alternate`, and `article:published_time` for guides.
- Twitter cards mirror the same title/description/image (`twitter:image`, `twitter:image:alt`).

### Automatic cover images

`og:image` is no longer a single branded SVG for the whole site:

- Guides: the first markdown `![...](/assets/articles/x.jpg)` is used automatically; guides without inline photos declare an `image:` frontmatter field.
- City pages: the cover follows the city's climate zone (`coast`, `mountain`, `desert`, `oasis`).
- Core pages: a curated per-site image (home, about, guides hub, cities hub).

All images are local files under `/assets/`, so CSP and offline PWA behaviour are unchanged. `scripts/check.mjs` verifies that every `og:image` exists in `dist`.

### Runtime updates

`shared/js/meta.js` embeds the bilingual copy in a `data-wx-page-meta` JSON script and updates the head when:

- the visitor switches language (`wx:lang` event);
- a dynamic place deep link such as `/?lat=32.89&lon=13.19&name=Tripoli` is opened — that URL gets its own title/description/geo instead of inheriting the home page.

## Structured data

JSON-LD is emitted in `<head>` from the same page meta and kept in sync at runtime:

- Home: `WebSite` with publisher `Organization`.
- Guides: `Article` with `headline`, `description`, `image`, `datePublished`, `author`/`publisher`, and the fixed author identity (`SAYFULDEEN ALI ABDULSALAM`, `Mr. Abu Shahma`).
- City deep links: `WebPage` whose `about` is a `City` with bilingual names, region and `GeoCoordinates`.
- Other pages: `WebPage` with site linkage.

The old duplicate body-level JSON-LD block in `city.html` was removed. `scripts/check.mjs` parses every JSON-LD block and asserts its shape.

## Sitemaps & robots

Each site emits:
- `robots.txt` allowing crawl and pointing to the site's sitemap.
- `sitemap.xml` listing home, hubs, every city page, and every guide URL on the site's canonical domain.

## Internal linking

- Header/footer navigation across overview, cities, guides, about.
- Cross-link between the two sister products.
- Cities hub → per-city pages; guides hub → guide pages; city pages surface region/zone context and (via UI) nearby navigation patterns.

## Content guidelines

- Unique, descriptive titles/descriptions per city and guide.
- Guides written for real queries (radar reading, seasonal patterns, air quality/dust, earthquakes) in both Arabic and English.
- Keep copy factual and cite underlying sources (Open-Meteo, RainViewer, USGS) where relevant.

## Performance & UX signals

- Lightweight, dependency-free runtime; system-preconnected fonts; minimal render-blocking work (`theme-init` is tiny and intentional).
- Mobile-friendly, RTL-correct layout and accessible semantics (landmarks, labels, focusable controls) supporting good engagement signals.

## International targeting

- `lang`/`dir` set dynamically from detected/stored language; Arabic content authored natively (not machine-mirrored layout).
- If deploying distinct-language URLs in future, extend `hreflang` to point to language-specific canonicals; current build emits a single canonical per page with bilingual alternates declared.
