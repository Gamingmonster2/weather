import { TILES, DEFAULTS, LIBYA } from "./config.js";
import { initI18n, t, getLang, toggleLang, wmo, num, tempUnit, time, weekday, dateShort, uvLevel, windDir, readUnits, applyI18n, aqiLevel, seaState } from "./i18n.js";
import { icon, glyph, hydrate } from "./icons.js";
import { comboChart, sunArc, gauge, rangeBar } from "./charts.js";
import { fetchForecast, fetchAir, fetchMarine, fetchQuakes, fetchMultiCurrent, geocodeSearch, safe, quakeDistanceKm } from "./api.js";
import { readPlace, savePlace, placeName, placeLabel, formatCoords, locateBrowser, reverseGeocode } from "./geo.js";
import { $, $$, on, toast, openDialog, closeDialog, bindDialog, initTabs, openSheet, closeSheet, bindSheet, sharePage, debounce, setText, setHTML } from "./ui.js";
import { loadCities, libyanCities, searchCities, cityToPlace, getCityById } from "./cities.js";

const state = { place: readPlace(), forecast: null, map: null, quakeLayer: null };

function qs(name) { return new URL(location.href).searchParams.get(name); }

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
  initI18n(); hydrate(); initTabs(); bindDialog($("#search-dialog")); bindSheet($("#nav-sheet"));
  const path = location.pathname.replace(/\/index\.html$/, "/");
  $$('[data-nav]').forEach((a) => a.setAttribute("aria-current", a.getAttribute("data-nav") === path ? "page" : "false"));
  on($("#btn-lang"), "click", () => { toggleLang(); renderAll(); });
  on($("#btn-theme"), "click", () => { setTheme("toggle"); if (state.map) refreshMapTiles(); });
  on($("#btn-menu"), "click", () => openSheet("nav-sheet"));
  on($("#open-search"), "click", () => { openDialog("search-dialog"); $("#search-input")?.focus(); });
  on($("#btn-locate"), "click", locateMe);
  on($("#btn-refresh"), "click", () => loadAll(true));
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
    state.place = savePlace({ id: btn.dataset.id || null, lat: Number(btn.dataset.lat), lon: Number(btn.dataset.lon), name: { ar: btn.dataset.ar, en: btn.dataset.en }, region: { ar: btn.dataset.regionAr, en: btn.dataset.regionEn }, source: "search" });
    closeDialog("search-dialog"); loadAll(true);
  }));
}

async function locateMe() {
  try {
    toast(t("action.locating"));
    const pos = await locateBrowser();
    let name = DEFAULTS.name;
    try { const rev = await reverseGeocode(pos.lat, pos.lon); const r = rev.data || {}; const city = r.city || r.locality || DEFAULTS.name.en; name = { ar: city, en: city }; } catch {}
    state.place = savePlace({ lat: pos.lat, lon: pos.lon, name, source: "gps" });
    loadAll(true);
  } catch { toast(t("error.geoDenied"), { type: "error" }); }
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

function renderAll(){ applyI18n(); hydrate(document); renderHero(); renderHourly(); renderDaily(); renderDetails(); renderAir(); renderMarine(); renderQuakes(); }

function renderHero(){
  const p = state.place; const f = state.forecast;
  setText($("#hero-place"), placeLabel(p)); setText($("#loc-name"), placeName(p));
  setText($("#loc-region"), p.region ? (getLang()==="ar"?p.region.ar:p.region.en) : (p.country||""));
  setText($("#loc-coords"), formatCoords(p.lat, p.lon));
  if (!f || !f.current) return;
  const cur = f.current; const info = wmo(cur.weather_code);
  setText($("#temp-now"), Math.round(cur.temperature_2m)); setText($("#temp-unit"), tempUnit(readUnits().temp));
  setText($("#cond-text"), info.text); setHTML($("#cond-glyph"), glyph(info.icon,{size:110,label:info.text}));
  setText($("#feels-like"), `${Math.round(cur.apparent_temperature)}°`);
  setText($("#stat-humidity"), `${num(cur.relative_humidity_2m)}%`);
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
  const body=$("#quakes-body"); if(!body) return; const data=state.quakes; const feats=(data&&data.features)||[];
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
  state.baseLayer=L.tileLayer(dark?TILES.dark:TILES.light,{attribution:TILES.attribution,maxZoom:19}).addTo(state.map);
}

function initMap(){
  const el=$("#main-map"); if(!el||typeof L==="undefined"||state.map) return;
  state.map=L.map(el,{zoomControl:true}).setView([state.place.lat,state.place.lon],6);
  refreshMapTiles();
  L.circleMarker([state.place.lat,state.place.lon],{radius:7,color:"var(--primary)",fillColor:"var(--primary)",fillOpacity:0.9,weight:2}).addTo(state.map);
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
  initShell(); await loadCities("/assets/data/cities.json"); await initCityPage(); await initCitiesPage();
  const lat=qs("lat"), lon=qs("lon"); if(lat&&lon) state.place=savePlace({lat:Number(lat),lon:Number(lon),name:{ar:qs("name")||"موقع",en:qs("name")||"Location"},source:"url"});
  if($("#current-card")||document.querySelector("[data-city-page]")) await loadAll();
  await renderCitiesGrid();
  const mapTab=document.querySelector('[data-tab="tab-map"]'); if(mapTab) on(mapTab,"click",()=>setTimeout(initMap,50),{once:true});
  if($("#main-map")&&document.querySelector("#tab-map")?.classList.contains("is-active")) initMap();
  const applyGuideLang=()=>{ const lang=getLang(); $$(".lang-en").forEach(el=>el.style.display=lang==="en"?"":"none"); $$(".lang-ar").forEach(el=>el.style.display=lang==="ar"?"":"none"); };
  applyGuideLang(); window.addEventListener("wx:lang", applyGuideLang);
}
main().catch(console.error);
