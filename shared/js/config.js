/**
 * config.js — every endpoint, brand constant and default lives here.
 * No API keys are required anywhere in this project.
 */

export const REPO_URL = "https://github.com/Gamingmonster2/weather";

export const SITES = {
  rain: {
    id: "rain",
    name: "Rain.ly",
    domain: "www.rain.ly",
    url: "https://www.rain.ly",
    defaultTheme: "dark",
    cross: "weather",
    tagline: {
      ar: "استخبارات الهطول ورادار الأمطار",
      en: "Precipitation intelligence & rain radar",
    },
  },
  weather: {
    id: "weather",
    name: "weather.com.ly",
    domain: "weather.com.ly",
    url: "https://weather.com.ly",
    defaultTheme: "light",
    cross: "rain",
    tagline: {
      ar: "مرصد الطقس والزلازل والبحر",
      en: "Weather, earthquake & marine observatory",
    },
  },
};

/** Keyless, CORS-friendly endpoints (verified). */
export const API = {
  forecast: "https://api.open-meteo.com/v1/forecast",
  geocode: "https://geocoding-api.open-meteo.com/v1/search",
  reverse: "https://api.bigdatacloud.net/data/reverse-geocode-client",
  air: "https://air-quality-api.open-meteo.com/v1/air-quality",
  marine: "https://marine-api.open-meteo.com/v1/marine",
  quake: "https://earthquake.usgs.gov/fdsnws/event/1/query",
  ip: "https://ipwho.is/",
  radar: "https://api.rainviewer.com/public/weather-maps.json",
  fallback: "https://wttr.in",
  /* optional same-origin proxy shipped with this repo (workers/_worker.js) */
  proxy: "/api/fetch",
};

export const LIBYA = {
  center: [27.03, 17.0],
  zoom: 5,
  bounds: [
    [19.4, 9.2],
    [33.5, 25.4],
  ],
  earthquakeRadiusKm: 900,
};

export const DEFAULTS = {
  lat: 32.8872,
  lon: 13.1913,
  name: { ar: "طرابلس", en: "Tripoli" },
  id: "tripoli",
};

export const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

export const STORAGE = {
  lang: "wx.lang",
  theme: "wx.theme",
  units: "wx.units",
  place: "wx.place",
  favorites: "wx.favorites",
  cookie: "wx.consent",
};

export const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for weather payloads
export const RADAR_TTL = 4 * 60 * 1000;

export function siteConfig(id) {
  return SITES[id] || SITES.rain;
}
