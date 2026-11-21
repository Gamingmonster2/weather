/* ==========================================================================
   meta.js — dynamic meta tags & Open Graph updates at runtime.

   The build embeds a small <script type="application/json" data-wx-page-meta>
   in every page head. This module uses it to keep <title>, description, OG,
   Twitter cards and JSON-LD in sync when the visitor switches language or
   opens a dynamic place deep link such as /?lat=...&lon=...&name=...
   No network requests, no dependencies, safe to call repeatedly.
   ========================================================================== */

import { getLang } from "./i18n.js";

let source = null;
let dynamicPlace = null;
let started = false;

function readSource() {
  if (source !== null) return source;
  const tag = document.querySelector('script[type="application/json"][data-wx-page-meta]');
  if (!tag) return (source = false);
  try {
    source = JSON.parse(tag.textContent || "{}");
  } catch (e) {
    source = false;
  }
  return source;
}

function setAttr(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el && value != null) el.setAttribute(attr, String(value));
}

function placeName(place, lang) {
  if (!place) return "";
  if (typeof place.name === "string") return place.name;
  return (place.name && (place.name[lang] || place.name.en)) || "";
}

function placeGeo(place) {
  if (!place) return null;
  const lat = Number(place.lat);
  const lon = Number(place.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { "@type": "GeoCoordinates", latitude: lat, longitude: lon };
}

/* Dynamic deep links get their own copy instead of inheriting the home page. */
function copyFor(lang, data) {
  const base = data[lang] || data.en || {};
  let title = base.title || document.title;
  let description = base.description || "";
  if (dynamicPlace) {
    const name = placeName(dynamicPlace, lang) || (lang === "ar" ? "موقع" : "Location");
    title = `${name} — ${data.site || "Weather"}`;
    description = lang === "ar"
      ? `طقس مباشر وتوقعات وأمطار وأحوال بحر في ${name}.`
      : `Live weather, hourly forecast, rain and marine conditions for ${name}.`;
  }
  return { title, description };
}

function updateSchema(data, copy, lang) {
  const tag = document.querySelector('script[type="application/ld+json"][data-wx-schema]');
  if (!tag) return;
  let schema;
  try {
    schema = JSON.parse(tag.textContent || "{}");
  } catch (e) {
    return;
  }
  if ("headline" in schema) schema.headline = copy.title;
  else schema.name = copy.title;
  schema.description = copy.description;

  const about = schema.about;
  if (about && (about["@type"] === "City" || about["@type"] === "Place")) {
    const place = dynamicPlace || data.place;
    const pName = placeName(place, lang);
    if (pName) {
      about.name = pName;
      if (place && place.name && place.name.ar && about.alternateName !== place.name.ar) {
        about.alternateName = place.name.ar;
      }
    }
    const geo = placeGeo(place);
    if (geo) about.geo = geo;
  }
  tag.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
}

function apply() {
  const data = readSource();
  if (!data) return;
  const lang = getLang() === "ar" ? "ar" : "en";
  const copy = copyFor(lang, data);

  document.title = copy.title;
  setAttr('meta[name="description"]', "content", copy.description);
  setAttr('meta[property="og:title"]', "content", copy.title);
  setAttr('meta[property="og:description"]', "content", copy.description);
  setAttr('meta[property="og:image"]', "content", data.image);
  setAttr('meta[property="og:image:alt"]', "content", copy.title);
  setAttr('meta[property="og:url"]', "content", data.canonical);
  setAttr('meta[property="og:locale"]', "content", lang === "ar" ? "ar_LY" : "en_US");
  setAttr('meta[name="twitter:title"]', "content", copy.title);
  setAttr('meta[name="twitter:description"]', "content", copy.description);
  setAttr('meta[name="twitter:image"]', "content", data.image);
  setAttr('meta[name="twitter:image:alt"]', "content", copy.title);
  setAttr('link[rel="canonical"]', "href", data.canonical);

  updateSchema(data, copy, lang);
}

/** Start listening for language changes and apply the current page's meta. */
export function initPageMeta() {
  if (started) return;
  started = true;
  apply();
  window.addEventListener("wx:lang", apply);
}

/**
 * Give a URL-driven place its own meta identity. Call this when a deep link
 * such as /?lat=32.88&lon=13.19&name=Tripoli selects a location.
 */
export function setPlaceMeta(place) {
  if (!place || place.lat == null || place.lon == null) return;
  const rawName = place.name;
  dynamicPlace = {
    name: typeof rawName === "string"
      ? { en: rawName, ar: rawName }
      : { en: (rawName && rawName.en) || "", ar: (rawName && rawName.ar) || "" },
    lat: place.lat,
    lon: place.lon,
  };
  apply();
}
