# Data sources & API usage

All data sources are **free and keyless**. The client fetches over HTTPS with timeout, in-memory caching (TTL), and an optional same-origin proxy fallback (`/api/fetch`, allowlisted in `workers/_worker.js`).

> Never embed or commit API keys. The legacy exposed OpenWeatherMap key from the old deployment must be revoked at the provider; it is not used by this repo.

## Endpoints

| Purpose | Provider | Base / endpoint | Notes |
|---|---|---|---|
| Forecast (current/hourly/daily) | [Open-Meteo Forecast](https://open-meteo.com/) | `https://api.open-meteo.com/v1/forecast` | temperature, apparent temp, precip/rain/showers, probability, weather code, wind/gusts, pressure, clouds, humidity, visibility, UV, sunrise/sunset. Multi-lat/lon supported for city batches. |
| Geocoding (search) | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | `https://geocoding-api.open-meteo.com/v1/search` | city/place lookup. |
| Reverse geocoding | [BigDataCloud (client)](https://www.bigdatacloud.com/) | `https://api.bigdatacloud.net/data/reverse-geocode-client` | resolve browser GPS to a locality name. |
| Air quality | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | `https://air-quality-api.open-meteo.com/v1/air-quality` | European AQI, PM10, PM2.5, dust, UV. |
| Marine | [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) | `https://marine-api.open-meteo.com/v1/marine` | wave height/direction/period, sea surface temperature. |
| Earthquakes | [USGS FDSN Event](https://earthquake.usgs.gov/fdsnws/event/1/) | `https://earthquake.usgs.gov/fdsnws/event/1/query` | GeoJSON, radius/time/magnitude filters around selected location. |
| IP geolocation | [ipwho.is](https://ipwho.is/) | `https://ipwho.is/` | coarse fallback location (no key). |
| Radar frames | [RainViewer](https://www.rainviewer.com/api.html) | `https://api.rainviewer.com/public/weather-maps.json` | past/nowcast frame timestamps/paths; tiles from `https://tilecache.rainviewer.com/...` |
| Text fallback | [wttr.in](https://wttr.in/:help) | `https://wttr.in/<lat,lon>?format=j1` | best-effort fallback when structured sources fail. |
| Map tiles | [OpenStreetMap](https://www.openstreetmap.org/) standard tiles | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Official OSM basemap rendered by Leaflet in both themes; dark mode applies a CSS dim only. Attribution: © OpenStreetMap contributors. |

## Caching & resilience (`shared/js/api.js`)

- In-memory cache per endpoint URL with TTLs (weather payloads ~10 min, radar index ~4 min, geocoding/IP longer).
- Request timeout (AbortController). On direct-fetch failure the client retries via the same-origin proxy (`/api/fetch?url=`) when available.
- `safe()` helper to degrade optional panels (air/marine/quakes/radar) without breaking the main forecast view.
- `fetchMultiCurrent(cities)` batches Libyan city tiles in a single multi-location Open-Meteo call.

## Location resolution (`shared/js/geo.js`)

1. Stored place (`wx.place`) if present.
2. Browser geolocation + BigDataCloud reverse geocode.
3. ipwho.is coarse IP location.
4. Default: Tripoli (32.8872, 13.1913).

## Units & formatting (`shared/js/i18n.js`)

- Stored unit preferences (`wx.units`), default metric (°C, km/h, mm).
- Locale-aware formatting; Arabic uses `ar-LY-u-nu-latn` numerals for stable tabular/data display.
- WMO weather interpretation codes mapped to localized labels and icon/glyph names.

## Worker proxy (`workers/_worker.js`)

- `GET /api/fetch?url=<encoded>` proxies only allowlisted origins, sets `Access-Control-Allow-Origin: *`, short cache headers, strips `Set-Cookie`, and applies security headers/CSP.
- Direct client fetch is preferred; proxy is a compatibility/fallback path and must remain strictly allowlisted.

## Attribution

Respect each provider's terms/attribution: Open-Meteo, RainViewer, USGS, © OpenStreetMap contributors, ipwho.is, BigDataCloud, wttr.in. Attribution is surfaced in footers and map controls where applicable.
