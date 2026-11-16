/**
 * cities.js — city catalog, lookup, search and nearest helpers.
 */
import { getLang } from "./i18n.js";
import { distanceKm } from "./geo.js";

let catalog = { libya: [], world: [], zones: {} };

export async function loadCities(url = "/assets/data/cities.json") {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("cities_fetch_failed");
    catalog = await res.json();
  } catch (e) {
    // fallback: try relative (for file previews) or keep empty
    try {
      const res = await fetch("./assets/data/cities.json");
      if (res.ok) catalog = await res.json();
    } catch {
      /* ignore */
    }
  }
  return catalog;
}

export function setCities(data) {
  if (data) catalog = data;
  return catalog;
}

export function getCatalog() {
  return catalog;
}

export function allCities() {
  return [...(catalog.libya || []), ...(catalog.world || [])];
}

export function libyanCities() {
  return catalog.libya || [];
}

export function worldCities() {
  return catalog.world || [];
}

export function getCityById(id) {
  if (!id) return null;
  const all = allCities();
  return all.find((c) => c.id === id) || null;
}

export function cityName(city) {
  if (!city) return "";
  return getLang() === "ar" ? city.ar : city.en;
}

export function cityRegion(city) {
  if (!city || !city.region) return "";
  return getLang() === "ar" ? city.region.ar : city.region.en;
}

export function zoneText(zone) {
  if (!zone || !catalog.zones || !catalog.zones[zone]) return "";
  const z = catalog.zones[zone];
  return getLang() === "ar" ? z.ar : z.en;
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "") // Arabic diacritics
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

export function searchCities(query, opts = {}) {
  const q = norm(query);
  if (q.length < 2) return [];
  const pool = opts.scope === "libya" ? libyanCities() : opts.scope === "world" ? worldCities() : allCities();
  const results = [];
  for (const c of pool) {
    const hay = [c.ar, c.en, c.id, c.region?.ar, c.region?.en].map(norm);
    let score = 0;
    if (hay.some((h) => h === q)) score = 3;
    else if (hay.some((h) => h.startsWith(q))) score = 2;
    else if (hay.some((h) => h.includes(q))) score = 1;
    if (score) results.push({ city: c, score });
  }
  results.sort((a, b) => b.score - a.score || cityName(a.city).localeCompare(cityName(b.city)));
  return results.slice(0, opts.limit || 10).map((r) => r.city);
}

export function nearestCities(lat, lon, opts = {}) {
  const pool = opts.scope === "libya" ? libyanCities() : allCities();
  const exclude = opts.excludeId || null;
  return pool
    .filter((c) => c.id !== exclude)
    .map((c) => ({ city: c, d: distanceKm({ lat, lon }, c) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, opts.limit || 6);
}

export function citiesByZone(zone) {
  return libyanCities().filter((c) => c.zone === zone);
}

export function cityToPlace(city) {
  if (!city) return null;
  return {
    id: city.id,
    lat: city.lat,
    lon: city.lon,
    name: { ar: city.ar, en: city.en },
    region: city.region,
    zone: city.zone,
    source: "city",
  };
}
