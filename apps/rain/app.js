import { API, TILES, DEFAULTS, SITES } from "./config.js";
import { initI18n, t, getLang, setLang, toggleLang, wmo, num, temp, tempUnit, time, weekday, dateShort, uvLevel, windDir, readUnits, applyI18n } from "./i18n.js";
import { icon, glyph, hydrate } from "./icons.js";
import { comboChart, areaChart, rangeBar } from "./charts.js";
import { fetchForecast, fetchRadar, fetchMultiCurrent, geocodeSearch, safe } from "./api.js";
import { readPlace, savePlace, placeName, placeLabel, formatCoords, resolveCurrentLocation, locateBrowser, locateByIp, reverseGeocode } from "./geo.js";
import { initMagic, setWeatherMood, tickNumber, setGlobePoints, DEFAULT_POINTS } from "./magic.js";
import { initPwa } from "./pwa.js";
import { $, $$, on, toast, openDialog, closeDialog, bindDialog, initTabs, openSheet, closeSheet, bindSheet, copyText, sharePage, startRain, debounce, setText, setHTML } from "./ui.js";
import { loadCities, libyanCities, searchCities, cityToPlace, nearestCities } from "./cities.js";
import { initPageMeta, setPlaceMeta } from "./meta.js";

const state = {
  place: readPlace(),
  forecast: null,
  radar: null,
  radarFrames: [],
  radarIndex: 0,
  radarLayer: null,
  map: null,
  mapMarker: null,
  accuracyCircle: null,
  radarReady: false,
  rainFx: null,
  units: readUnits(),
};

function qs(name) { return new URL(location.href).searchParams.get(name); }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function rainingNow() {
  const c = state.forecast?.current;
  if (!c) return false;
  return (c.precipitation || 0) > 0 || (c.rain || 0) > 0 || (c.showers || 0) > 0;
}
function globePoints() {
  const here = {
    lat: state.place.lat,
    lon: state.place.lon,
    label: placeName(state.place),
    rain: rainingNow(),
  };
  return [here, ...DEFAULT_POINTS.filter((p) => Math.abs(p.lat - here.lat) > 0.01 || Math.abs(p.lon - here.lon) > 0.01)];
}
function updatePlaceCard() {
  setText($("#map-place"), placeName(state.place));
  setText($("#map-coords"), formatCoords(state.place.lat, state.place.lon));
  setText($("#map-source"), state.place.source === "gps" ? t("map.myLocation") : (state.place.source || "IP").toUpperCase());
  setGlobePoints(globePoints(), state.place);
}
function updateMapLocation() {
  const map = state.map;
  if (!map || typeof L === "undefined") return;
  const p = state.place;
  if (state.mapMarker) { map.removeLayer(state.mapMarker); state.mapMarker = null; }
  if (state.accuracyCircle) { map.removeLayer(state.accuracyCircle); state.accuracyCircle = null; }
  if (Number.isFinite(p.accuracy) && p.accuracy > 0) {
    state.accuracyCircle = L.circle([p.lat, p.lon], {
      radius: p.accuracy, color: "#4aa8ff", weight: 1, fillColor: "#4aa8ff", fillOpacity: 0.08,
    }).addTo(map);
  }
  state.mapMarker = L.marker([p.lat, p.lon], { title: placeName(p) }).addTo(map);
  state.mapMarker.bindPopup(`<strong>${esc(placeName(p))}</strong><br>${esc(formatCoords(p.lat, p.lon))}`);
  map.flyTo([p.lat, p.lon], 5, { duration: 0.8 });
}
function applyPlace(place, reload = true) {
  state.place = savePlace(place);
  updateMapLocation();
  updatePlaceCard();
  if (reload) loadForecast(true);
}

function setTheme(next) {
  const html = document.documentElement;
  let theme = next;
  if (next === "toggle") theme = html.classList.contains("dark") ? "light" : "dark";
  html.classList.toggle("dark", theme === "dark");
  html.setAttribute("data-theme", theme);
  html.style.colorScheme = theme;
  try { localStorage.setItem("wx.theme", theme); } catch {}
}

function initShell() {
  initI18n();
  initMagic();
  initPwa();
  hydrate();
  initTabs();
  bindDialog($("#search-dialog"));
  bindSheet($("#nav-sheet"));

  // nav active
  const path = location.pathname.replace(/\/index\.html$/, "/");
  $$('[data-nav]').forEach((a) => a.setAttribute("aria-current", a.getAttribute("data-nav") === path ? "page" : "false"));

  on($("#btn-lang"), "click", () => { toggleLang(); renderAll(); });
  on($("#btn-theme"), "click", () => { setTheme("toggle"); if (state.map) refreshMapTiles(); });
  on($("#btn-menu"), "click", () => openSheet("nav-sheet"));
  on($("#open-search"), "click", () => { openDialog("search-dialog"); $("#search-input")?.focus(); });
  on($("#btn-locate"), "click", locateMe);
  on($("#map-locate"), "click", locateMe);
  on($("#btn-refresh"), "click", () => loadForecast(true));
  window.addEventListener("wx:globe-select", (e) => {
    const p = e.detail;
    if (p) applyPlace({ lat: p.lat, lon: p.lon, name: { ar: p.label, en: p.label }, source: "globe" });
  });
  on($("#btn-share"), "click", () => sharePage({ title: document.title, url: location.href }));

  // keyboard shortcut for search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea/i.test(document.activeElement?.tagName)) {
      e.preventDefault(); openDialog("search-dialog"); $("#search-input")?.focus();
    }
    if (e.key === "Escape") { closeDialog("search-dialog"); }
  });

  const input = $("#search-input");
  if (input) {
    on(input, "input", debounce(() => doSearch(input.value), 180));
  }

  window.addEventListener("wx:lang", () => renderAll());
}

async function doSearch(q) {
  const box = $("#search-results");
  if (!box) return;
  const results = searchCities(q, { limit: 10 });
  // also try geocoding for non-catalog
  let geo = [];
  if (q && q.trim().length >= 3) {
    const r = await safe(() => geocodeSearch(q.trim(), { count: 5, language: getLang() }), null);
    if (r && r.data && r.data.results) {
      geo = r.data.results.map((g) => ({
        id: null, lat: g.latitude, lon: g.longitude,
        ar: g.name, en: g.name,
        region: { ar: g.country || "", en: g.country || "" },
        _geo: true,
      }));
    }
  }
  const merged = [...results, ...geo.filter(g => !results.some(r => Math.abs(r.lat-g.lat)<0.05 && Math.abs(r.lon-g.lon)<0.05))];
  if (!merged.length) { setHTML(box, `<div class="text-sm text-muted p-3">${t("action.noResults")}</div>`); return; }
  setHTML(box, merged.map((c) => `
    <button class="command-item" data-lat="${c.lat}" data-lon="${c.lon}" data-ar="${(c.ar||"").replace(/"/g,'&quot;')}" data-en="${(c.en||"").replace(/"/g,'&quot;')}" data-id="${c.id||""}" data-region-ar="${(c.region?.ar||"").replace(/"/g,'&quot;')}" data-region-en="${(c.region?.en||"").replace(/"/g,'&quot;')}">
      <span>${icon("pin",{size:"sm"})}</span>
      <span>${getLang()==="ar"?c.ar:c.en}</span>
      <span class="command-meta">${getLang()==="ar"?(c.region?.ar||""):(c.region?.en||"")}</span>
    </button>`).join(""));
  $$(".command-item", box).forEach((btn) => on(btn, "click", () => {
    const place = {
      id: btn.dataset.id || null,
      lat: Number(btn.dataset.lat), lon: Number(btn.dataset.lon),
      name: { ar: btn.dataset.ar, en: btn.dataset.en },
      region: { ar: btn.dataset.regionAr, en: btn.dataset.regionEn },
      source: "search",
    };
    closeDialog("search-dialog");
    applyPlace(place);
  }));
}

async function locateMe() {
  toast(t("action.locating"));
  try {
    const pos = await locateBrowser();
    let name = DEFAULTS.name;
    try {
      const rev = await reverseGeocode(pos.lat, pos.lon);
      const r = rev.data || {};
      const city = r.city || r.locality || r.principalSubdivision || placeName(state.place);
      name = { ar: city, en: city };
    } catch {}
    applyPlace({ lat: pos.lat, lon: pos.lon, accuracy: pos.accuracy, name, source: "gps" });
    return;
  } catch {
    /* GPS denied or unavailable — fall back to IP */
  }
  const ip = await safe(() => locateByIp(), null);
  if (ip) {
    applyPlace(ip);
    toast(t("action.autoLocated"));
  } else {
    toast(t("error.geoDenied"), { type: "error" });
  }
}

function pickHourIndex(times) {
  const now = Date.now();
  let best = 0, bestD = Infinity;
  times.forEach((ts, i) => { const d = Math.abs(new Date(ts).getTime() - now); if (d < bestD) { bestD = d; best = i; } });
  return best;
}

async function loadForecast(force = false) {
  const p = state.place;
  try {
    setText($("#updated-at"), "…");
    const res = await fetchForecast(p.lat, p.lon, { force });
    state.forecast = res.data;
    renderAll();
    setText($("#updated-at"), new Date().toLocaleTimeString(getLang()==="ar"?"ar-LY-u-nu-latn":"en-GB",{hour:"2-digit",minute:"2-digit"}));
  } catch (e) {
    console.error(e);
    toast(t("error.body"), { type: "error" });
  }
}

function renderAll() {
  applyI18n();
  hydrate(document);
  renderHero();
  renderHourly();
  renderDaily();
  renderDetails();
}

function renderHero() {
  const p = state.place;
  const f = state.forecast;
  if (!f || !f.current) {
    setText($("#hero-place"), placeLabel(p));
    setText($("#loc-name"), placeName(p));
    updatePlaceCard();
    return;
  }
  const cur = f.current;
  const info = wmo(cur.weather_code);
  setText($("#hero-place"), placeLabel(p));
  setText($("#loc-name"), placeName(p));
  setText($("#loc-region"), p.region ? (getLang()==="ar"?p.region.ar:p.region.en) : (p.country||""));
  setText($("#loc-coords"), formatCoords(p.lat, p.lon));
  tickNumber($("#temp-now"), Math.round(cur.temperature_2m));
  setWeatherMood(cur.weather_code, cur.is_day !== 0);
  setText($("#temp-unit"), tempUnit(readUnits().temp));
  setText($("#cond-text"), info.text);
  setHTML($("#cond-glyph"), glyph(info.icon, { size: 110, label: info.text }));
  setText($("#feels-like"), `${Math.round(cur.apparent_temperature)}°`);
  tickNumber($("#stat-humidity"), Number(cur.relative_humidity_2m), { suffix: "%" });
  setText($("#stat-wind"), `${num(cur.wind_speed_10m)} ${t("units.kmh")}`);
  const hIdx = pickHourIndex(f.hourly.time);
  const pop = f.hourly.precipitation_probability ? f.hourly.precipitation_probability[hIdx] : null;
  setText($("#stat-pop"), pop != null ? `${num(pop)}%` : "—");
  // rain next 24h
  let sum24 = 0;
  for (let i = hIdx; i < Math.min(hIdx + 24, f.hourly.precipitation.length); i++) sum24 += (f.hourly.precipitation[i] || 0);
  setText($("#stat-rain24"), `${num(sum24, sum24 >= 10 ? 0 : 1)} ${t("rain.mm")}`);
  // metrics
  const daily = f.daily;
  const sum7 = (daily.precipitation_sum || []).reduce((a,b)=>a+(b||0),0);
  const wet = (daily.precipitation_sum || []).filter(v => (v||0) >= 0.2).length;
  setText($("#m-rain7"), `${num(sum7, sum7>=10?0:1)} ${t("rain.mm")}`);
  setText($("#m-wetdays"), `${t("rain.wetDays")}: ${num(wet)}`);
  setText($("#m-pressure"), `${num(cur.pressure_msl,0)} ${t("units.hpa")}`);
  const uv = daily.uv_index_max ? daily.uv_index_max[0] : null;
  setText($("#m-uv"), uv != null ? num(uv,0) : "—");
  setText($("#m-uv-note"), uv != null ? uvLevel(uv).text : "—");
  const vis = f.hourly.visibility ? f.hourly.visibility[hIdx] : null;
  setText($("#m-vis"), vis != null ? `${num(vis/1000,1)} ${t("units.km")}` : "—");
  setText($("#m-cloud"), `${t("wx.cloudCover")}: ${num(cur.cloud_cover)}%`);
  const badge = $("#rain-now-badge");
  if (badge) {
    const raining = (cur.precipitation || 0) > 0 || (cur.rain || 0) > 0;
    badge.textContent = raining ? t("rain.now") : t("rain.dry");
    badge.className = raining ? "badge badge-rain" : "badge badge-muted";
  }
  // rain fx
  const raining = (cur.precipitation || 0) > 0.1;
  if (raining && !state.rainFx && $("#rain-canvas")) state.rainFx = startRain($("#rain-canvas"));
  if (!raining && state.rainFx) { state.rainFx.stop(); state.rainFx = null; }
  updatePlaceCard();
}

function renderHourly() {
  const f = state.forecast;
  const box = $("#hourly-chart");
  const strip = $("#hour-strip");
  if (!f || !box) return;
  const h = f.hourly;
  const idx = pickHourIndex(h.time);
  const end = Math.min(idx + 24, h.time.length);
  const labels = [], temps = [], probs = [], prec = [];
  for (let i = idx; i < end; i++) {
    const d = new Date(h.time[i]);
    labels.push(d.getHours().toString().padStart(2,"0"));
    temps.push(h.temperature_2m[i]);
    probs.push(h.precipitation_probability ? h.precipitation_probability[i] : 0);
    prec.push(h.precipitation ? h.precipitation[i] : 0);
  }
  setHTML(box, comboChart({
    labels, height: 230,
    bars: [{ values: prec, color: "var(--wx-rain)", label: t("wx.precipitation") }],
    line: { values: probs, color: "color-mix(in oklab, var(--wx-rain) 70%, var(--foreground))", min: 0, max: 100, label: "%" },
    tip: (i) => `${labels[i]}:00 · ${Math.round(temps[i])}° · ${num(prec[i],1)} mm · ${num(probs[i],0)}%`,
    barUnit: "mm", lineUnit: "%",
  }));
  // also temp mini overlay not directly supported; include temps in strip
  if (strip) {
    setHTML(strip, labels.map((lb, i) => {
      const code = h.weather_code ? h.weather_code[idx+i] : 0;
      const info = wmo(code);
      const pmm = prec[i] || 0;
      return `<div class="hour-cell${i===0?" is-now":""}">
        <div class="hour-time">${lb}:00</div>
        <div>${glyph(info.icon,{size:26,label:info.text})}</div>
        <div class="hour-temp">${Math.round(temps[i])}°</div>
        <div class="hour-rain${pmm<0.1?" is-dry":""}">${pmm<0.1?"—":num(pmm,1)+t("rain.mm")}</div>
      </div>`;
    }).join(""));
  }
}

function renderDaily() {
  const f = state.forecast;
  const box = $("#daily-list");
  if (!f || !box) return;
  const d = f.daily;
  const mins = d.temperature_2m_min || [];
  const maxs = d.temperature_2m_max || [];
  const lo = Math.min(...mins), hi = Math.max(...maxs);
  setHTML(box, d.time.map((day, i) => {
    const info = wmo(d.weather_code[i]);
    const p = d.precipitation_sum ? d.precipitation_sum[i] : 0;
    const pop = d.precipitation_probability_max ? d.precipitation_probability_max[i] : null;
    return `<div class="daily-row">
      <div><div class="daily-day">${weekday(day,"short")}</div><span class="daily-date">${dateShort(day)}</span></div>
      <div>${glyph(info.icon,{size:28,label:info.text})}</div>
      <div>
        <div class="daily-cond">${info.text}</div>
        <div class="daily-range"><span class="daily-min">${Math.round(mins[i])}°</span>${rangeBar(mins[i],maxs[i],lo,hi)}<span class="daily-max">${Math.round(maxs[i])}°</span></div>
      </div>
      <div class="daily-precip${p<0.2?" is-dry":""}">${p<0.2?"—":num(p, p>=10?0:1)+" "+t("rain.mm")}${pop!=null?` · ${num(pop,0)}%`:""}</div>
    </div>`;
  }).join(""));
}

function renderDetails() {
  const f = state.forecast;
  const box = $("#detail-grid");
  if (!f || !box) return;
  const cur = f.current;
  const d = f.daily;
  const cells = [
    [t("wx.windGust"), `${num(cur.wind_gusts_10m)} ${t("units.kmh")}`],
    [t("wx.direction"), windDir(cur.wind_direction_10m)],
    [t("wx.pressure"), `${num(cur.pressure_msl,0)} ${t("units.hpa")}`],
    [t("wx.cloudCover"), `${num(cur.cloud_cover)}%`],
    [t("wx.sunrise"), d.sunrise ? time(d.sunrise[0]) : "—"],
    [t("wx.sunset"), d.sunset ? time(d.sunset[0]) : "—"],
    [t("wx.high"), d.temperature_2m_max ? `${Math.round(d.temperature_2m_max[0])}°` : "—"],
    [t("wx.low"), d.temperature_2m_min ? `${Math.round(d.temperature_2m_min[0])}°` : "—"],
  ];
  setHTML(box, cells.map(([k,v]) => `<div class="detail-cell"><div class="k">${k}</div><div class="v">${v}</div></div>`).join(""));
}

/* ------------------------------------------------------------------- radar */
async function initRadar() {
  const el = $("#radar-map");
  if (!el || typeof L === "undefined") return;
  if (!state.map) {
    state.map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomSnap: 0.5,
    }).setView([state.place.lat, state.place.lon], 5);
    L.control.zoom({ position: "bottomright" }).addTo(state.map);
    L.control.attribution({
      position: "bottomleft",
      prefix: '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>',
    }).addTo(state.map);
    refreshMapTiles();
    state.map.on("click", async (e) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      let name = { ar: formatCoords(lat, lon), en: formatCoords(lat, lon) };
      try {
        const rev = await reverseGeocode(lat, lon);
        const r = rev.data || {};
        const city = r.city || r.locality || r.principalSubdivision || formatCoords(lat, lon);
        name = { ar: city, en: city };
      } catch {}
      applyPlace({ lat, lon, name, source: "map" });
    });
    setTimeout(() => state.map?.invalidateSize(), 120);
    if ("ResizeObserver" in window) new ResizeObserver(() => state.map?.invalidateSize()).observe(el);
    window.addEventListener("orientationchange", () => setTimeout(() => state.map?.invalidateSize(), 200));
  }
  updateMapLocation();
  if (state.radarReady) return;
  state.radarReady = true;
  const res = await safe(() => fetchRadar(), null);
  if (!res || !res.data) { toast(t("error.radar"), { type: "error" }); return; }
  state.radar = res.data;
  const past = (res.data.radar && res.data.radar.past) || [];
  const nowcast = (res.data.radar && res.data.radar.nowcast) || [];
  state.radarFrames = [...past.slice(-12), ...nowcast.slice(0, 4)];
  const slider = $("#radar-slider");
  if (slider) { slider.max = String(Math.max(state.radarFrames.length - 1, 0)); slider.value = String(state.radarFrames.length - 1); }
  state.radarIndex = Math.max(state.radarFrames.length - 1, 0);
  showRadarFrame(state.radarIndex);

  on($("#radar-slider"), "input", (e) => { state.radarIndex = Number(e.target.value); showRadarFrame(state.radarIndex); });
  let playing = false, timer = null;
  on($("#radar-play"), "click", () => {
    playing = !playing;
    if (playing) {
      timer = setInterval(() => {
        state.radarIndex = (state.radarIndex + 1) % state.radarFrames.length;
        if (slider) slider.value = String(state.radarIndex);
        showRadarFrame(state.radarIndex);
      }, 700);
    } else { clearInterval(timer); }
  });
  on($("#radar-expand"), "click", () => {
    const shell = $("#radar-shell");
    shell?.classList.toggle("is-full");
    setTimeout(() => state.map?.invalidateSize(), 200);
  });
}

function refreshMapTiles() {
  if (!state.map) return;
  const dark = document.documentElement.classList.contains("dark");
  if (state.baseLayer) state.map.removeLayer(state.baseLayer);
  state.baseLayer = L.tileLayer(dark ? TILES.dark : TILES.light, {
    attribution: TILES.attribution,
    maxZoom: 19,
    className: "osm-base-tiles",
  }).addTo(state.map);
}

function showRadarFrame(i) {
  const frame = state.radarFrames[i];
  if (!frame || !state.map || !state.radar) return;
  const host = state.radar.host || "https://tilecache.rainviewer.com";
  const url = `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
  if (state.radarLayer) state.map.removeLayer(state.radarLayer);
  state.radarLayer = L.tileLayer(url, { opacity: 0.7, zIndex: 10 }).addTo(state.map);
  const d = new Date(frame.time * 1000);
  setText($("#radar-time"), d.toLocaleString(getLang()==="ar"?"ar-LY-u-nu-latn":"en-GB",{hour:"2-digit",minute:"2-digit", day:"numeric", month:"short"}));
}

/* ------------------------------------------------------------ cities grid */
async function renderCitiesGrid() {
  const grid = $("#cities-grid");
  if (!grid) return;
  const cities = libyanCities().slice(0, 12);
  setHTML(grid, cities.map(c => `<a class="city-tile" href="/city/${c.id}.html" data-city-id="${c.id}">
    <div class="city-tile-top"><div><div class="city-tile-name">${getLang()==="ar"?c.ar:c.en}</div><div class="city-tile-region">${getLang()==="ar"?c.region.ar:c.region.en}</div></div>
    <div>${glyph("cloud",{size:30})}</div></div>
    <div class="city-tile-temp" data-ctemp>—</div>
    <div class="city-tile-rain is-dry" data-crain>—</div>
  </a>`).join(""));
  // fetch temps
  const res = await safe(() => fetchMultiCurrent(cities), null);
  if (res && res.data) {
    res.data.forEach((row) => {
      const tile = grid.querySelector(`[data-city-id="${row.city.id}"]`);
      if (!tile || !row.current) return;
      const cur = row.current;
      setText(tile.querySelector("[data-ctemp]"), `${Math.round(cur.temperature_2m)}°`);
      const info = wmo(cur.weather_code);
      const g = tile.querySelector(".wx-glyph, svg");
      if (g) g.outerHTML = glyph(info.icon,{size:30,label:info.text});
      const r = tile.querySelector("[data-crain]");
      const p = cur.precipitation || 0;
      if (r) { r.textContent = p >= 0.1 ? `${num(p,1)} ${t("rain.mm")}` : t("rain.dry"); r.classList.toggle("is-dry", p < 0.1); }
    });
  }
}

/* ----------------------------------------------------------- city page */
async function initCityPage() {
  const main = document.querySelector("[data-city-page]");
  if (!main) return;
  const id = main.dataset.cityId;
  await loadCities("/assets/data/cities.json");
  const { getCityById } = await import("./cities.js");
  const city = getCityById(id);
  if (city) state.place = savePlace(cityToPlace(city));
}

/* --------------------------------------------------------- cities catalog */
async function initCitiesPage() {
  const grid = $("#all-cities-grid");
  if (!grid) return;
  await loadCities("/assets/data/cities.json");
  const cities = libyanCities();
  setHTML(grid, cities.map(c => `<a class="city-tile" href="/city/${c.id}.html"><div class="city-tile-top"><div><div class="city-tile-name">${getLang()==="ar"?c.ar:c.en}</div><div class="city-tile-region">${getLang()==="ar"?c.region.ar:c.region.en}</div></div></div><div class="text-sm text-muted">${getLang()==="ar"?(c.zone||""):(c.zone||"")}</div></a>`).join(""));
}

async function main() {
  initShell();
  initPageMeta();
  await loadCities("/assets/data/cities.json");
  await initCityPage();
  await initCitiesPage();
  // if query params specify a place
  const lat = qs("lat"), lon = qs("lon");
  if (lat && lon) {
    state.place = savePlace({ lat: Number(lat), lon: Number(lon), name: { ar: qs("name")||"موقع", en: qs("name")||"Location" }, source: "url" });
    setPlaceMeta(state.place);
  } else {
    const stored = readPlace();
    if (stored.source === "default") {
      const ip = await safe(() => locateByIp(), null);
      if (ip) {
        state.place = savePlace(ip);
        toast(t("action.autoLocated"));
      }
    }
  }
  if ($("#current-card") || $("#hourly-chart") || document.querySelector("[data-city-page]")) {
    await loadForecast();
  }
  await renderCitiesGrid();
  if ($("#radar-map")) initRadar();
  updatePlaceCard();

  // guides language toggle visibility
  const applyGuideLang = () => {
    const lang = getLang();
    $$(".lang-en").forEach(el => el.style.display = lang === "en" ? "" : "none");
    $$(".lang-ar").forEach(el => el.style.display = lang === "ar" ? "" : "none");
  };
  applyGuideLang();
  window.addEventListener("wx:lang", applyGuideLang);
}

main().catch(console.error);
