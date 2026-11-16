/**
 * api.js — keyless data access: Open-Meteo, USGS, RainViewer, ipwho, BigDataCloud,
 * wttr.in fallback. Cached fetch with timeout and a same-origin proxy fallback.
 */
import { API, CACHE_TTL, RADAR_TTL, LIBYA } from "./config.js";

const mem = new Map();

function now() {
  return Date.now();
}

export function cacheKey(url) {
  return url;
}

export function cacheGet(key, ttl = CACHE_TTL) {
  const entry = mem.get(key);
  if (!entry) return null;
  if (now() - entry.t > ttl) {
    mem.delete(key);
    return null;
  }
  return entry.v;
}

export function cacheSet(key, value) {
  mem.set(key, { t: now(), v: value });
  return value;
}

export function clearCache(prefix) {
  if (!prefix) {
    mem.clear();
    return;
  }
  for (const k of mem.keys()) if (k.startsWith(prefix)) mem.delete(k);
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function request(url, opts = {}) {
  const { timeout = 12000, ttl = CACHE_TTL, force = false, as = "json" } = opts;
  const key = opts.cacheKey || cacheKey(url);
  if (!force) {
    const hit = cacheGet(key, ttl);
    if (hit) return { data: hit, stale: false, source: "cache" };
  }
  const { signal, clear } = withTimeout(timeout);
  try {
    const res = await fetch(url, { signal, headers: opts.headers || {}, ...opts.init });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = as === "text" ? await res.text() : await res.json();
    cacheSet(key, data);
    return { data, stale: false, source: "network" };
  } finally {
    clear();
  }
}

async function requestWithProxy(url, opts = {}) {
  try {
    return await request(url, opts);
  } catch (err) {
    // try same-origin proxy (Cloudflare worker) if direct fetch fails (CORS/offline edge)
    try {
      const proxied = `${API.proxy}?url=${encodeURIComponent(url)}`;
      return await request(proxied, { ...opts, cacheKey: opts.cacheKey || cacheKey(url) });
    } catch {
      throw err;
    }
  }
}

function qs(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) u.set(k, v.join(","));
    else u.set(k, String(v));
  }
  return u.toString();
}

export async function fetchForecast(lat, lon, opts = {}) {
  const params = {
    latitude: lat,
    longitude: lon,
    timezone: "auto",
    forecast_days: opts.days || 7,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    hourly:
      "temperature_2m,precipitation_probability,precipitation,rain,showers,weather_code,cloud_cover,visibility,wind_speed_10m,wind_gusts_10m,uv_index,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant",
  };
  const url = `${API.forecast}?${qs(params)}`;
  return requestWithProxy(url, { ttl: CACHE_TTL, ...opts });
}

export async function fetchAir(lat, lon, opts = {}) {
  const params = {
    latitude: lat,
    longitude: lon,
    current: "european_aqi,pm10,pm2_5,dust,uv_index",
    hourly: "european_aqi,pm10,pm2_5,dust",
    forecast_days: 1,
    timezone: "auto",
  };
  const url = `${API.air}?${qs(params)}`;
  return requestWithProxy(url, { ttl: CACHE_TTL, ...opts });
}

export async function fetchMarine(lat, lon, opts = {}) {
  const params = {
    latitude: lat,
    longitude: lon,
    current: "wave_height,wave_direction,wave_period,sea_surface_temperature",
    hourly: "wave_height,wave_period,sea_surface_temperature",
    forecast_days: 3,
    timezone: "auto",
  };
  const url = `${API.marine}?${qs(params)}`;
  return requestWithProxy(url, { ttl: CACHE_TTL, ...opts });
}

export async function fetchQuakes(lat, lon, opts = {}) {
  const radius = opts.radiusKm || LIBYA.earthquakeRadiusKm;
  const end = new Date();
  const start = new Date(end.getTime() - (opts.days || 30) * 24 * 3600 * 1000);
  const params = {
    format: "geojson",
    latitude: lat,
    longitude: lon,
    maxradiuskm: radius,
    starttime: start.toISOString().slice(0, 10),
    endtime: end.toISOString().slice(0, 10),
    minmagnitude: opts.minMag ?? 2.5,
    orderby: "time",
  };
  const url = `${API.quake}?${qs(params)}`;
  return requestWithProxy(url, { ttl: CACHE_TTL, ...opts });
}

export async function fetchRadar(opts = {}) {
  return requestWithProxy(API.radar, { ttl: RADAR_TTL, ...opts });
}

export async function fetchIp(opts = {}) {
  // ipwho.is is keyless and CORS-friendly
  return requestWithProxy(API.ip, { ttl: 30 * 60 * 1000, ...opts });
}

export async function reverseGeocode(lat, lon, opts = {}) {
  const url = `${API.reverse}?${qs({ latitude: lat, longitude: lon, localityLanguage: "en" })}`;
  return requestWithProxy(url, { ttl: 24 * 3600 * 1000, ...opts });
}

export async function geocodeSearch(name, opts = {}) {
  const params = {
    name,
    count: opts.count || 8,
    language: opts.language || "en",
    format: "json",
  };
  const url = `${API.geocode}?${qs(params)}`;
  return requestWithProxy(url, { ttl: 30 * 60 * 1000, ...opts });
}

export async function fetchWttr(lat, lon, opts = {}) {
  const loc = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  const url = `${API.fallback}/${encodeURIComponent(loc)}?format=j1`;
  // wttr can be slow; best-effort fallback
  return requestWithProxy(url, { ttl: CACHE_TTL, timeout: 15000, ...opts });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fetch compact current conditions for multiple cities (Open-Meteo supports multi-lat/lon). */
export async function fetchMultiCurrent(cities, opts = {}) {
  if (!cities.length) return { data: null };
  const lats = cities.map((c) => c.lat).join(",");
  const lons = cities.map((c) => c.lon).join(",");
  const params = {
    latitude: lats,
    longitude: lons,
    current: "temperature_2m,weather_code,precipitation,rain,is_day",
    timezone: "auto",
  };
  const url = `${API.forecast}?${qs(params)}`;
  const res = await requestWithProxy(url, { ttl: CACHE_TTL, ...opts });
  // Open-Meteo returns array for multi-location, object for single
  let arr = res.data;
  if (!Array.isArray(arr)) arr = [arr];
  return {
    ...res,
    data: cities.map((c, i) => ({
      city: c,
      current: arr[i] && arr[i].current ? arr[i].current : null,
      timezone: arr[i] ? arr[i].timezone : null,
    })),
  };
}

export function quakeDistanceKm(quake, lat, lon) {
  const coords = quake && quake.geometry && quake.geometry.coordinates;
  if (!coords) return null;
  return haversine(lat, lon, coords[1], coords[0]);
}

export async function safe(fn, fallback = null) {
  try {
    return await fn();
  } catch (e) {
    return fallback;
  }
}
