/**
 * geo.js — place persistence, geolocation, IP fallback, and location helpers.
 */
import { DEFAULTS, STORAGE } from "./config.js";
import { fetchIp, reverseGeocode } from "./api.js";
import { getLang } from "./i18n.js";

export function readPlace() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE.place) || "null");
    if (raw && Number.isFinite(raw.lat) && Number.isFinite(raw.lon)) return normalizePlace(raw);
  } catch (e) {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function savePlace(place) {
  const p = normalizePlace(place);
  try {
    localStorage.setItem(STORAGE.place, JSON.stringify(p));
  } catch (e) {
    /* ignore */
  }
  return p;
}

export function normalizePlace(place = {}) {
  const lat = Number(place.lat ?? place.latitude ?? DEFAULTS.lat);
  const lon = Number(place.lon ?? place.longitude ?? DEFAULTS.lon);
  const name =
    typeof place.name === "object" && place.name
      ? { ar: place.name.ar || place.name.en || DEFAULTS.name.ar, en: place.name.en || place.name.ar || DEFAULTS.name.en }
      : { ar: String(place.name || place.ar || DEFAULTS.name.ar), en: String(place.name || place.en || DEFAULTS.name.en) };
  return {
    id: place.id || null,
    lat,
    lon,
    name,
    region: place.region || null,
    zone: place.zone || null,
    country: place.country || null,
    source: place.source || "default",
  };
}

export function placeName(place) {
  const p = normalizePlace(place);
  return getLang() === "ar" ? p.name.ar : p.name.en;
}

export function placeLabel(place) {
  const p = normalizePlace(place);
  const name = placeName(p);
  if (p.region) {
    const r = typeof p.region === "object" ? (getLang() === "ar" ? p.region.ar : p.region.en) : p.region;
    if (r) return `${name} · ${r}`;
  }
  if (p.country) return `${name} · ${p.country}`;
  return name;
}

export function locateBrowser(opts = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("geolocation_unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "gps",
        }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: opts.timeout || 10000, maximumAge: 300000 },
    );
  });
}

export async function locateByIp() {
  const res = await fetchIp();
  const d = res.data || {};
  const lat = Number(d.latitude ?? d.lat);
  const lon = Number(d.longitude ?? d.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("ip_location_failed");
  return {
    lat,
    lon,
    name: { ar: d.city || DEFAULTS.name.ar, en: d.city || DEFAULTS.name.en },
    country: d.country,
    source: "ip",
  };
}

export async function resolveCurrentLocation() {
  // Prefer stored, then browser geolocation + reverse, then IP, then default
  const stored = readPlace();
  if (stored && stored.source !== "default" && stored.id) return stored;

  try {
    const pos = await locateBrowser();
    try {
      const rev = await reverseGeocode(pos.lat, pos.lon);
      const r = rev.data || {};
      const city = r.city || r.locality || r.principalSubdivision || DEFAULTS.name.en;
      return savePlace({
        lat: pos.lat,
        lon: pos.lon,
        name: { ar: city, en: city },
        country: r.countryName || r.countryCode || null,
        source: "gps",
      });
    } catch {
      return savePlace({ lat: pos.lat, lon: pos.lon, name: DEFAULTS.name, source: "gps" });
    }
  } catch {
    /* fall through */
  }

  try {
    const ip = await locateByIp();
    return savePlace(ip);
  } catch {
    /* fall through */
  }

  return savePlace(DEFAULTS);
}

export function formatCoords(lat, lon) {
  const la = Math.abs(lat).toFixed(2) + (lat >= 0 ? "°N" : "°S");
  const lo = Math.abs(lon).toFixed(2) + (lon >= 0 ? "°E" : "°W");
  return `${la}, ${lo}`;
}

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
