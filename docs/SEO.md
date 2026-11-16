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

`scripts/build.mjs` injects per-page: `<title>`, meta description, canonical, `hreflang` alternates (ar/en), Open Graph (`og:*`), Twitter card tags, theme-color, and favicon/OG image references. City pages include localized titles/descriptions (e.g. “Weather in <City>”).

## Structured data

City pages embed JSON-LD (`WebPage`/`Place` with `GeoCoordinates` and site linkage) to describe the place and forecast context. The structure can be extended with `WeatherForecast`-aligned markup as richer, page-specific forecast snapshots are rendered server-side/build-time.

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
