import { TILES, DEFAULTS, LIBYA } from "./config.js";
import { initI18n, t, getLang, toggleLang, wmo, num, tempUnit, time, weekday, dateShort, uvLevel, windDir, readUnits, applyI18n, aqiLevel, seaState } from "./i18n.js";
import { icon, glyph, hydrate } from "./icons.js";
import { comboChart, sunArc, gauge, rangeBar } from "./charts.js";
import { fetchForecast, fetchAir, fetchMarine, fetchQuakes, fetchMultiCurrent, geocodeSearch, safe, quakeDistanceKm } from "./api.js";
import { readPlace, savePlace, placeName, placeLabel, formatCoords, locateBrowser, locateByIp, reverseGeocode } from "./geo.js";
import { $, $$, on, toast, openDialog, closeDialog, bindDialog, initTabs, openSheet, closeSheet, bindSheet, sharePage, debounce, setText, setHTML } from "./ui.js";
import { loadCities, libyanCities, searchCities, cityToPlace, getCityById } from "./cities.js";
import { initMagic, setWeatherMood, tickNumber, setGlobePoints, DEFAULT_POINTS } from "./magic.js";
import { initPwa } from "./pwa.js";
import { initPageMeta, setPlaceMeta } from "./meta.js";

const state = {
  place: readPlace(), forecast: null, air: null, marine: null, quakes: null,
  map: null, baseLayer: null, mapMarker: null, accuracyCircle: null, quakeLayer: null,
};

function qs(name) { return new URL(location.href).searchParams.get(name); }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function globePoints() {
  const here = {
    lat: state.place.lat,
    lon: state.place.lon,
    label: placeName(state.place),
    rain: false,
  };
  const cities = libyanCities().slice(0, 8).map((c) => ({
    lat: c.lat,
    lon: c.lon,
    label: getLang() === "ar" ? c.ar : c.en,
    rain: false,
  }));
  const quakes = ((state.quakes && state.quakes.features) || []).slice(0, 6).map((f) => ({
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    label: `M ${num(f.properties.mag, 1)}`,
    rain: true,
  }));
  return [here, ...cities, ...quakes].filter((p, i, all) =>
    i === 0 || !all.slice(0, i).some((q) => Math.abs(q.lat - p.lat) < 0.01 && Math.abs(q.lon - p.lon) < 0.01),
  );
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
      radius: p.accuracy, color: "#14b8a6", weight: 1, fillColor: "#14b8a6", fillOpacity: 0.08,
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
  if (reload) loadAll(true);
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
  initI18n(); initMagic(); initPwa(); hydrate(); initTabs(); bindDialog($("#search-dialog")); bindSheet($("#nav-sheet"));
  const path = location.pathname.replace(/\/index\.html$/, "/");
  $$('[data-nav]').forEach((a) => a.setAttribute("aria-current", a.getAttribute("data-nav") === path ? "page" : "false"));
  on($("#btn-lang"), "click", () => { toggleLang(); renderAll(); });
  on($("#btn-theme"), "click", () => { setTheme("toggle"); if (state.map) refreshMapTiles(); });
  on($("#btn-menu"), "click", () => openSheet("nav-sheet"));
  on($("#open-search"), "click", () => { openDialog("search-dialog"); $("#search-input")?.focus(); });
  on($("#btn-locate"), "click", locateMe);
  on($("#map-locate"), "click", locateMe);
  on($("#btn-refresh"), "click", () => loadAll(true));
  window.addEventListener("wx:globe-select", (e) => {
    const p = e.detail;
    if (p) applyPlace({ lat: p.lat, lon: p.lon, name: { ar: p.label, en: p.label }, source: "globe" });
  });
  on($("#btn-share"), "click", () => sharePage({ title: document.title, url: location.href }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea/i.test(document.activeElement?.tagName)) { e.preventDefault(); openDialog("search-dialog"); $("#search-input")?.focus(); }
  });
  const input = $("#search-input");
  if (input) on(input, "input", debounce(() => doSearch(input.value), 180));
  window.addEventListener("wx:lang", () => renderAll());
}

async function doSearch(q) {
  const box = $("#search-results"); if (!box) return;
  const results = searchCities(q, { limit: 10 });
  let geo = [];
  if (q && q.trim().length >= 3) {
    const r = await safe(() => geocodeSearch(q.trim(), { count: 5, language: getLang() }), null);
    if (r && r.data && r.data.results) geo = r.data.results.map((g) => ({ id:null, lat:g.latitude, lon:g.longitude, ar:g.name, en:g.name, region:{ar:g.country||"",en:g.country||""} }));
  }
  const merged = [...results, ...geo.filter(g => !results.some(r => Math.abs(r.lat-g.lat)<0.05 && Math.abs(r.lon-g.lon)<0.05))];
  if (!merged.length) { setHTML(box, `<div class="text-sm text-muted p-3">${t("action.noResults")}</div>`); return; }
  setHTML(box, merged.map((c) => `<button class="command-item" data-lat="${c.lat}" data-lon="${c.lon}" data-ar="${(c.ar||"").replace(/"/g,'&quot;')}" data-en="${(c.en||"").replace(/"/g,'&quot;')}" data-id="${c.id||""}" data-region-ar="${(c.region?.ar||"").replace(/"/g,'&quot;')}" data-region-en="${(c.region?.en||"").replace(/"/g,'&quot;')}"><span>${icon("pin",{size:"sm"})}</span><span>${getLang()==="ar"?c.ar:c.en}</span><span class="command-meta">${getLang()==="ar"?(c.region?.ar||""):(c.region?.en||"")}</span></button>`).join(""));
  $$(".command-item", box).forEach((btn) => on(btn, "click", () => {
    const place = {
      id: btn.dataset.id || null,
      lat: Number(btn.dataset.lat),
      lon: Number(btn.dataset.lon),
      name: { ar: btn.dataset.ar, en: btn.dataset.en },
      region: { ar: btn.dataset.regionAr, en: btn.dataset.regionEn },
      source: "search",
    };
    closeDialog("search-dialog"); applyPlace(place);
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

function pickHourIndex(times){ const now=Date.now(); let b=0,d=Infinity; times.forEach((ts,i)=>{const dd=Math.abs(new Date(ts).getTime()-now); if(dd<d){d=dd;b=i;}}); return b; }

async function loadAll(force=false) {
  const p = state.place;
  setText($("#updated-at"), "…");
  const [fRes, airRes, marineRes, quakeRes] = await Promise.all([
    safe(() => fetchForecast(p.lat, p.lon, { force }), null),
    safe(() => fetchAir(p.lat, p.lon, { force }), null),
    safe(() => fetchMarine(p.lat, p.lon, { force }), null),
    safe(() => fetchQuakes(p.lat, p.lon, { force, days: 30, minMag: 2.5 }), null),
  ]);
  state.forecast = fRes?.data || null;
  state.air = airRes?.data || null;
  state.marine = marineRes?.data || null;
  state.quakes = quakeRes?.data || null;
  renderAll();
  setText($("#updated-at"), new Date().toLocaleTimeString(getLang()==="ar"?"ar-LY-u-nu-latn":"en-GB",{hour:"2-digit",minute:"2-digit"}));
  renderMapLayers();
}

function renderAll(){ applyI18n(); hydrate(document); renderHero(); renderHourly(); renderDaily(); renderDetails(); renderAir(); renderMarine(); renderQuakes(); updatePlaceCard(); }

function renderHero(){
  const p = state.place; const f = state.forecast;
  setText($("#hero-place"), placeLabel(p)); setText($("#loc-name"), placeName(p));
  setText($("#loc-region"), p.region ? (getLang()==="ar"?p.region.ar:p.region.en) : (p.country||""));
  setText($("#loc-coords"), formatCoords(p.lat, p.lon));
  if (!f || !f.current) return;
  const cur = f.current; const info = wmo(cur.weather_code);
  tickNumber($("#temp-now"), Math.round(cur.temperature_2m));
  setWeatherMood(cur.weather_code, cur.is_day !== 0);
  setText($("#temp-unit"), tempUnit(readUnits().temp));
  setText($("#cond-text"), info.text); setHTML($("#cond-glyph"), glyph(info.icon,{size:110,label:info.text}));
  setText($("#feels-like"), `${Math.round(cur.apparent_temperature)}°`);
  tickNumber($("#stat-humidity"), Number(cur.relative_humidity_2m), { suffix: "%" });
  setText($("#stat-wind"), `${num(cur.wind_speed_10m)} ${t("units.kmh")}`);
  setText($("#stat-pressure"), `${num(cur.pressure_msl,0)} ${t("units.hpa")}`);
  const hIdx = pickHourIndex(f.hourly.time);
  const uv = f.hourly.uv_index ? f.hourly.uv_index[hIdx] : (f.daily.uv_index_max?f.daily.uv_index_max[0]:null);
  setText($("#stat-uv"), uv!=null ? `${num(uv,0)} ${uvLevel(uv).text}` : "—");
  const b = $("#cond-badge"); if (b) b.textContent = info.text;
}

function renderHourly(){
  const f = state.forecast; const box = $("#hourly-chart"); const strip = $("#hour-strip"); if (!f || !box) return;
  const h = f.hourly; const idx = pickHourIndex(h.time); const end = Math.min(idx+24, h.time.length);
  const labels=[], temps=[], prec=[], probs=[];
  for (let i=idx;i<end;i++){ const d=new Date(h.time[i]); labels.push(d.getHours().toString().padStart(2,"0")); temps.push(h.temperature_2m[i]); prec.push(h.precipitation?h.precipitation[i]:0); probs.push(h.precipitation_probability?h.precipitation_probability[i]:0); }
  setHTML(box, comboChart({ labels, height:220, bars:[{values:prec,color:"var(--wx-rain)"}], line:{values:temps,color:"var(--wx-temp)",min:Math.min(...temps)-2,max:Math.max(...temps)+2,label:"°"}, tip:(i)=>`${labels[i]}:00 · ${Math.round(temps[i])}° · ${num(prec[i],1)}mm`, barUnit:"mm", lineUnit:"°" }));
  if (strip) setHTML(strip, labels.map((lb,i)=>{ const code=h.weather_code?h.weather_code[idx+i]:0; const info=wmo(code); return `<div class="hour-cell${i===0?" is-now":""}"><div class="hour-time">${lb}:00</div><div>${glyph(info.icon,{size:26,label:info.text})}</div><div class="hour-temp">${Math.round(temps[i])}°</div></div>`; }).join(""));
}

function renderDaily(){
  const f=state.forecast; const box=$("#daily-list"); if(!f||!box) return; const d=f.daily; const mins=d.temperature_2m_min||[], maxs=d.temperature_2m_max||[]; const lo=Math.min(...mins), hi=Math.max(...maxs);
  setHTML(box, d.time.map((day,i)=>{ const info=wmo(d.weather_code[i]); const p=d.precipitation_sum?d.precipitation_sum[i]:0; return `<div class="daily-row"><div><div class="daily-day">${weekday(day,"short")}</div><span class="daily-date">${dateShort(day)}</span></div><div>${glyph(info.icon,{size:28,label:info.text})}</div><div><div class="daily-cond">${info.text}</div><div class="daily-range"><span class="daily-min">${Math.round(mins[i])}°</span>${rangeBar(mins[i],maxs[i],lo,hi)}<span class="daily-max">${Math.round(maxs[i])}°</span></div></div><div class="daily-precip${p<0.2?" is-dry":""}">${p<0.2?"—":num(p,p>=10?0:1)+" "+t("rain.mm")}</div></div>`; }).join(""));
}

function renderDetails(){
  const f=state.forecast; if(!f) return; const cur=f.current; const d=f.daily;
  if (d.sunrise && d.sunset) {
    const sr=new Date(d.sunrise[0]).getTime(), ss=new Date(d.sunset[0]).getTime();
    setHTML($("#sun-arc"), sunArc({sunrise:sr,sunset:ss,now:Date.now()}));
    setText($("#sunrise"), time(d.sunrise[0])); setText($("#sunset"), time(d.sunset[0]));
  }
  const cells=[[t("wx.windGust"),`${num(cur.wind_gusts_10m)} ${t("units.kmh")}`],[t("wx.direction"),windDir(cur.wind_direction_10m)],[t("wx.cloudCover"),`${num(cur.cloud_cover)}%`],[t("wx.visibility"), f.hourly.visibility?`${num(f.hourly.visibility[pickHourIndex(f.hourly.time)]/1000,1)} ${t("units.km")}`:"—"]];
  setHTML($("#detail-grid"), cells.map(([k,v])=>`<div class="detail-cell"><div class="k">${k}</div><div class="v">${v}</div></div>`).join(""));
}

function renderAir(){
  const box=$("#air-card"); if(!box) return; const a=state.air?.current;
  if(!a){ setHTML(box, `<div class="text-sm text-muted">—</div>`); return; }
  const lvl=aqiLevel(a.european_aqi);
  const pm25 = a.pm2_5!=null?num(a.pm2_5,1):"—"; const pm10=a.pm10!=null?num(a.pm10,1):"—"; const dust=a.dust!=null?num(a.dust,1):"—";
  setHTML(box, `<div class="gauge-wrap"><div>${gauge({value:a.european_aqi||0,max:120,color:"var(--chart-2)",label:t("wx.aqi"),display:num(a.european_aqi,0)})}</div><div><div class="font-semibold">${lvl.text}</div><div class="text-sm text-muted mt-1">PM2.5: ${pm25} · PM10: ${pm10}</div><div class="text-sm text-muted">${t("wx.dust")}: ${dust}</div></div></div>`);
}

function renderMarine(){
  const box=$("#marine-card"); if(!box) return; const m=state.marine?.current;
  if(!m){ setHTML(box, `<div class="text-sm text-muted">—</div>`); return; }
  const st=seaState(m.wave_height);
  setHTML(box, `<div class="stack gap-2"><div class="flex items-center justify-between"><span class="text-sm text-muted">${t("wx.sea")}</span><span class="font-semibold">${st.text}</span></div>
    <div class="flex items-center justify-between"><span class="text-sm text-muted">${t("wx.waveHeight")}</span><span>${m.wave_height!=null?num(m.wave_height,1)+" m":"—"}</span></div>
    <div class="flex items-center justify-between"><span class="text-sm text-muted">${t("wx.wavePeriod")}</span><span>${m.wave_period!=null?num(m.wave_period,1)+" s":"—"}</span></div>
    <div class="flex items-center justify-between"><span class="text-sm text-muted">${t("wx.seaTemp")}</span><span>${m.sea_surface_temperature!=null?num(m.sea_surface_temperature,1)+"°":"—"}</span></div></div>`);
}

function renderQuakes(){
  const data=state.quakes; const feats=(data&&data.features)||[];
  const mini=$("#quake-mini");
  if (mini) {
    setHTML(mini, feats.length
      ? feats.slice(0,4).map(f=>{
          const mag=f.properties.mag||0;
          const cls=mag>=5?"mag-severe":mag>=4?"mag-high":mag>=3?"mag-mid":"mag-low";
          const when=new Date(f.properties.time);
          return `<div class="flex items-center justify-between gap-2"><span class="quake-row-mag ${cls}">M ${num(mag,1)}</span><span class="text-sm text-muted truncate">${esc(f.properties.place||"")}</span><span class="text-xs text-muted">${when.toLocaleTimeString(getLang()==="ar"?"ar-LY-u-nu-latn":"en-GB",{hour:"2-digit",minute:"2-digit"})}</span></div>`;
        }).join("")
      : `<div class="text-sm text-muted">${t("wx.quakesEmpty")}</div>`);
  }
  setGlobePoints(globePoints(), state.place);
  const body=$("#quakes-body"); if(!body) return;
  if(!feats.length){ setHTML(body, `<tr><td colspan="4" class="text-muted">${t("wx.quakesEmpty")}</td></tr>`); return; }
  const p=state.place;
  const rows=feats.slice(0,8).map(f=>{
    const mag=f.properties.mag; const dist=quakeDistanceKm(f,p.lat,p.lon); const depth=f.geometry.coordinates[2]; const when=new Date(f.properties.time);
    const cls=mag>=5?"mag-severe":mag>=4?"mag-high":mag>=3?"mag-mid":"mag-low";
    return `<tr><td><span class="quake-row-mag ${cls}">${num(mag,1)}</span></td><td>${dist!=null?num(dist,0)+" "+t("units.km"):"—"}</td><td>${depth!=null?num(depth,0)+" km":"—"}</td><td>${when.toLocaleString(getLang()==="ar"?"ar-LY-u-nu-latn":"en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</td></tr>`;
  }).join("");
  setHTML(body, rows);
}

function refreshMapTiles(){
  if(!state.map) return; const dark=document.documentElement.classList.contains("dark");
  if(state.baseLayer) state.map.removeLayer(state.baseLayer);
  state.baseLayer=L.tileLayer(dark?TILES.dark:TILES.light,{attribution:TILES.attribution,maxZoom:19,className:"osm-base-tiles"}).addTo(state.map);
}

function initMap(){
  const el=$("#main-map"); if(!el||typeof L==="undefined"||state.map) return;
  state.map=L.map(el,{
    zoomControl:false, attributionControl:false,
    scrollWheelZoom:true, touchZoom:true, doubleClickZoom:true, boxZoom:true, keyboard:true, zoomSnap:0.5
  }).setView([state.place.lat,state.place.lon],5);
  L.control.zoom({position:"bottomright"}).addTo(state.map);
  L.control.attribution({position:"bottomleft",prefix:'<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>'}).addTo(state.map);
  refreshMapTiles();
  state.map.on("click", async (e) => {
    const lat=e.latlng.lat, lon=e.latlng.lng;
    let name={ar:formatCoords(lat,lon),en:formatCoords(lat,lon)};
    try {
      const rev=await reverseGeocode(lat,lon); const r=rev.data||{};
      const city=r.city||r.locality||r.principalSubdivision||formatCoords(lat,lon);
      name={ar:city,en:city};
    } catch {}
    applyPlace({lat,lon,name,source:"map"});
  });
  setTimeout(()=>state.map?.invalidateSize(),120);
  if("ResizeObserver" in window) new ResizeObserver(()=>state.map?.invalidateSize()).observe(el);
  window.addEventListener("orientationchange",()=>setTimeout(()=>state.map?.invalidateSize(),200));
  updateMapLocation();
  renderMapLayers();
}

function renderMapLayers(){
  if(!state.map||typeof L==="undefined") return;
  if(state.quakeLayer){ state.map.removeLayer(state.quakeLayer); state.quakeLayer=null; }
  const feats=(state.quakes&&state.quakes.features)||[];
  if(feats.length){
    state.quakeLayer=L.layerGroup(feats.map(f=>{
      const [lon,lat,depth]=f.geometry.coordinates; const mag=f.properties.mag||0;
      const color=mag>=5?"#ef4444":mag>=4?"#f97316":mag>=3?"#eab308":"#22c55e";
      return L.circleMarker([lat,lon],{radius:Math.max(4,mag*2),color,fillColor:color,fillOpacity:0.35,weight:1}).bindPopup(`<b>M ${num(mag,1)}</b><br>${f.properties.place||""}`);
    })).addTo(state.map);
  }
}

async function renderCitiesGrid(){
  const grid=$("#cities-grid"); if(!grid) return;
  const cities=libyanCities().slice(0,12);
  setHTML(grid, cities.map(c=>`<a class="city-tile" href="/city/${c.id}.html" data-city-id="${c.id}"><div class="city-tile-top"><div><div class="city-tile-name">${getLang()==="ar"?c.ar:c.en}</div><div class="city-tile-region">${getLang()==="ar"?c.region.ar:c.region.en}</div></div><div>${glyph("cloud",{size:30})}</div></div><div class="city-tile-temp" data-ctemp>—</div><div class="city-tile-rain is-dry" data-crain>—</div></a>`).join(""));
  const res=await safe(()=>fetchMultiCurrent(cities),null);
  if(res&&res.data){ res.data.forEach((row)=>{ const tile=grid.querySelector(`[data-city-id="${row.city.id}"]`); if(!tile||!row.current) return; const cur=row.current; setText(tile.querySelector("[data-ctemp]"), `${Math.round(cur.temperature_2m)}°`); const info=wmo(cur.weather_code); const g=tile.querySelector(".wx-glyph, svg"); if(g) g.outerHTML=glyph(info.icon,{size:30,label:info.text}); }); }
}

async function initCityPage(){ const main=document.querySelector("[data-city-page]"); if(!main) return; await loadCities("/assets/data/cities.json"); const city=getCityById(main.dataset.cityId); if(city) state.place=savePlace(cityToPlace(city)); }
async function initCitiesPage(){ const grid=$("#all-cities-grid"); if(!grid) return; await loadCities("/assets/data/cities.json"); setHTML(grid, libyanCities().map(c=>`<a class="city-tile" href="/city/${c.id}.html"><div class="city-tile-name">${getLang()==="ar"?c.ar:c.en}</div><div class="city-tile-region">${getLang()==="ar"?c.region.ar:c.region.en}</div></a>`).join("")); }

async function main(){
  initShell(); initPageMeta(); await loadCities("/assets/data/cities.json"); await initCityPage(); await initCitiesPage();
  const lat=qs("lat"), lon=qs("lon");
  if(lat&&lon){ state.place=savePlace({lat:Number(lat),lon:Number(lon),name:{ar:qs("name")||"موقع",en:qs("name")||"Location"},source:"url"}); setPlaceMeta(state.place); }
  else if(readPlace().source==="default") {
    const ip=await safe(()=>locateByIp(), null);
    if(ip){ state.place=savePlace(ip); toast(t("action.autoLocated")); }
  }
  if($("#current-card")||document.querySelector("[data-city-page]")) await loadAll();
  await renderCitiesGrid();
  if($("#main-map")) initMap();
  updatePlaceCard();
  const applyGuideLang=()=>{ const lang=getLang(); $$(".lang-en").forEach(el=>el.style.display=lang==="en"?"":"none"); $$(".lang-ar").forEach(el=>el.style.display=lang==="ar"?"":"none"); };
  applyGuideLang(); window.addEventListener("wx:lang", applyGuideLang);
}
main().catch(console.error);
