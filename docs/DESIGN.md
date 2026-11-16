# Design system

## Visual language

Both products follow the **shadcn/ui v4** visual language, implemented in plain CSS (no Tailwind runtime, no React). The goal is a restrained, professional, data-dense interface: soft radii, subtle borders/shadows, clear typography, and colour used semantically.

## Token source of truth

`shared/css/tokens.css` maps shadcn v4 tokens (oklch) and is the **only** place colours are defined:

- Base scale: `--background/foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`.
- Charts: `--chart-1..5`.
- Sidebar tokens (reserved): `--sidebar*`.
- Radius: `--radius: 0.625rem` with derived `--radius-sm..3xl` (matches shadcn's calc scale).
- Typography: `--font-sans` (Geist, IBM Plex Sans Arabic), `--font-arabic`, `--font-mono`.
- Elevation: restrained `--shadow-xs..lg`.
- Semantic weather tokens (brand-independent): `--wx-rain`, `--wx-temp`, `--wx-wind`, `--wx-aqi-*`, `--wx-uv`, `--wx-sea`, `--wx-quake`, etc.

Light and dark palettes follow shadcn's `.dark` values (dark surfaces use subtle translucent borders `oklch(1 0 0 / 12%)`).

## Brand overrides

Brands override only `--primary`, `--ring`, accent tints and chart hues; everything else inherits the shadcn base:

| Token area | Rain.ly (`data-brand="rain"`) | weather.com.ly (`data-brand="weather"`) |
|---|---|---|
| Personality | Precipitation intelligence | Meteorological observatory |
| Default theme | Dark-first | Light-first |
| Primary | Azure/blue (`~oklch 0.69 0.16 251` dark / `0.545 0.185 253` light) | Teal (`~oklch 0.71 0.115 205` dark / `0.52 0.128 208` light) |
| Charts | Blue/precipitation-biased | Teal/temperature/air-biased |

Brand-specific tweaks live in `apps/<site>/brand.css` (kept minimal).

## Components (`shared/css/components.css`)

Implements shadcn-like primitives with matching class structure:
- **Button:** `.btn` + variants `-secondary -outline -ghost -destructive -link`, sizes `-sm -lg -icon`.
- **Card:** `.card`, `.card-header/title/description/content/footer/action`.
- **Tabs:** `.tabs`, `.tab[aria-selected]`, `.tab-panel`.
- **Badge:** `.badge` + semantic variants.
- **Inputs:** `.input`, `.select`, `.textarea`, `.search-field`.
- **Table:** `.table-wrap`, `.table`.
- **Feedback:** `.alert`, `.progress`, `.skeleton`, `.toast`.
- **Overlay/navigation:** `dialog.modal`, `.sheet`, `.command-list/item`.
- **Controls:** `.switch`, `.segmented`, `.kbd`.

## Weather primitives (`shared/css/weather.css`)

Domain UI: app shell/header/nav, hero and `.current-card`, `.metric` grid, hourly strip, daily rows with range bars, map/radar shell and controls, city tiles, quake magnitude chips, gauge, sun arc, detail grid, prose, and footer.

## Typography & direction

- **Latin:** Geist; **Arabic:** IBM Plex Sans Arabic (with Geist fallback). Loaded via Google Fonts.
- `html[lang="ar"]` switches to the Arabic font stack and relaxed line-height; headings drop tight Latin tracking in Arabic.
- Layout uses **logical CSS properties** (`margin-inline`, `inset-inline`, `padding-block`, etc.) so RTL works without mirrored stylesheets. `dir` is set from language.
- Numerals in Arabic UI use `ar-LY-u-nu-latn` for tabular clarity in data displays.

## Theming & motion

- `shared/js/theme-init.js` applies the theme class before first paint to prevent flash (stored `wx.theme` → system → brand default).
- Users can toggle theme and language; choices persist in `localStorage`.
- Motion is subtle (short fades/slides, chart/skeleton transitions) and respects reduced-motion preferences.

## Icons & charts

- `shared/js/icons.js`: inline SVG stroke UI icons and filled weather glyphs (no icon font/CDN).
- `shared/js/charts.js`: dependency-free SVG combo/area/sparkline charts, gauge, sun arc, range bar — theme-aware via CSS variables.
