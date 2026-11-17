/**
 * magic.js — Magic UI–inspired motion, implemented with plain DOM/Canvas.
 * Effects: aurora/grid backgrounds, mouse spotlight, border beam support,
 * number ticker, particles/meteors, animated interactive globe, weather moods.
 */
import { wmo } from "./i18n.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let started = false;
const tickState = new WeakMap();
const globe = {
  canvas: null,
  ctx: null,
  points: [],
  selected: null,
  rot: -0.5,
  raf: 0,
  visible: true,
};

const DEFAULT_POINTS = [
  { lat: 32.8872, lon: 13.1913, label: "Tripoli", rain: false },
  { lat: 32.1167, lon: 20.0667, label: "Benghazi", rain: false },
  { lat: 30.0444, lon: 31.2357, label: "Cairo", rain: false },
  { lat: 41.0082, lon: 28.9784, label: "Istanbul", rain: false },
  { lat: 51.5072, lon: -0.1276, label: "London", rain: false },
  { lat: 25.2048, lon: 55.2708, label: "Dubai", rain: false },
  { lat: 28.6139, lon: 77.209, label: "New Delhi", rain: false },
  { lat: 35.6895, lon: 139.6917, label: "Tokyo", rain: false },
  { lat: 40.7128, lon: -74.006, label: "New York", rain: false },
  { lat: -33.8688, lon: 151.2093, label: "Sydney", rain: false },
];

/* ---------------------------------------------------------------- helpers */
function moodFor(code, isDay) {
  const c = Number(code);
  if ([95, 96, 99].includes(c)) return "storm";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "snow";
  if (c === 0 || c === 1) return isDay ? "clear" : "night";
  return isDay ? "cloudy" : "night";
}

/** Swap the photographic background and accent mood for current conditions. */
export function setWeatherMood(code, isDay = true) {
  const mood = moodFor(code, isDay);
  if (document.documentElement.dataset.mood !== mood) {
    document.documentElement.dataset.mood = mood;
    window.dispatchEvent(new CustomEvent("wx:mood", { detail: { mood, code, isDay } }));
  }
  return mood;
}

/** Count a number up/down smoothly. Safe to call repeatedly. */
export function tickNumber(el, target, { duration = 750, decimals = 0, suffix = "" } = {}) {
  if (!el || !Number.isFinite(Number(target))) return;
  const value = Number(target);
  const prevState = tickState.get(el);
  const from = Number.isFinite(prevState?.value) ? prevState.value : value;
  const format = (n) =>
    new Intl.NumberFormat(document.documentElement.lang || "en", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n) + suffix;

  if (prevState?.raf) cancelAnimationFrame(prevState.raf);
  if (reduced || from === value || duration <= 0) {
    el.textContent = format(value);
    tickState.set(el, { value, raf: 0 });
    return;
  }

  el.classList.add("is-ticking");
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(from + (value - from) * eased);
    if (t < 1) {
      const raf = requestAnimationFrame(step);
      tickState.set(el, { value, raf });
    } else {
      el.classList.remove("is-ticking");
      tickState.set(el, { value, raf: 0 });
    }
  };
  tickState.set(el, { value, raf: requestAnimationFrame(step) });
}

/** Update globe locations; called whenever the selected place changes. */
export function setGlobePoints(points, selected = null) {
  globe.points = Array.isArray(points) && points.length ? points : DEFAULT_POINTS;
  if (selected) globe.selected = selected;
  if (globe.ctx) drawGlobe(performance.now());
}

/* --------------------------------------------------------- card spotlight */
function initCards() {
  document.querySelectorAll(".metric, .city-tile, .panel, .card").forEach((el) => el.classList.add("magic-card"));
  document.querySelectorAll(".magic-card").forEach((card) => {
    if (card.dataset.magicBound) return;
    card.dataset.magicBound = "1";
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
    });
  });
}

/* ------------------------------------------------------------ reveal on scroll */
function initReveal() {
  const items = document.querySelectorAll(".magic-reveal");
  if (!items.length) return;
  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------ particles */
function initParticles() {
  const canvas = document.getElementById("magic-particles");
  const host = canvas?.parentElement;
  if (!canvas || !host) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // CSS meteors — a few, with staggered delays.
  if (!host.querySelector(".magic-meteor") && !reduced) {
    for (let i = 0; i < 3; i++) {
      const m = document.createElement("span");
      m.className = "magic-meteor";
      m.style.left = `${18 + i * 30}%`;
      m.style.top = `${-10 - i * 12}%`;
      m.style.animationDelay = `${i * 2.4 + 1}s`;
      host.appendChild(m);
    }
  }

  let stars = [];
  let raf = 0;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = host.clientWidth;
    const h = host.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(90, Math.floor((w * h) / 14000)) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.25,
      a: Math.random() * 0.55 + 0.15,
      s: Math.random() * 0.35 + 0.08,
    }));
    if (reduced) draw(0);
  };

  const draw = (t) => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const alpha = reduced ? s.a : s.a * (0.6 + 0.4 * Math.sin(t * 0.0015 * s.s + s.x));
      ctx.beginPath();
      ctx.fillStyle = `rgba(180, 215, 255, ${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  if (!reduced) {
    const loop = (t) => {
      if (document.hidden) { raf = requestAnimationFrame(loop); return; }
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  new ResizeObserver(resize).observe(host);
  resize();
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf), { once: true });
}

/* ---------------------------------------------------------------- globe */
function project(lat, lon, w, h) {
  const radius = Math.min(w, h) * 0.41;
  const cx = w / 2;
  const cy = h / 2 + 4;
  const tilt = 0.32;
  const lambda = (lon * Math.PI) / 180 + globe.rot;
  const phi = (lat * Math.PI) / 180;
  const cosc = Math.sin(tilt) * Math.sin(phi) + Math.cos(tilt) * Math.cos(phi) * Math.cos(lambda);
  return {
    visible: cosc >= 0,
    x: cx + radius * Math.cos(phi) * Math.sin(lambda),
    y: cy - radius * (Math.cos(tilt) * Math.sin(phi) - Math.sin(tilt) * Math.cos(phi) * Math.cos(lambda)),
    radius,
    cx,
    cy,
  };
}

function graticule(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(150, 200, 255, 0.15)";
  ctx.lineWidth = 1;
  const drawLine = (pts) => {
    let drawing = false;
    ctx.beginPath();
    for (const [lat, lon] of pts) {
      const p = project(lat, lon, w, h);
      if (!p.visible) { drawing = false; continue; }
      if (!drawing) { ctx.moveTo(p.x, p.y); drawing = true; }
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  };
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 4) pts.push([lat, lon]);
    drawLine(pts);
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 4) pts.push([lat, lon]);
    drawLine(pts);
  }
  ctx.restore();
}

function drawGlobe(t = 0) {
  const { canvas, ctx } = globe;
  if (!canvas || !ctx) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ctx.clearRect(0, 0, w, h);

  const centre = project(0, 0, w, h);
  const { radius, cx, cy } = centre;
  const body = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
  body.addColorStop(0, "rgba(36, 92, 150, 0.55)");
  body.addColorStop(0.65, "rgba(14, 40, 80, 0.75)");
  body.addColorStop(1, "rgba(6, 18, 42, 0.92)");
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "rgba(110, 190, 255, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  graticule(ctx, w, h);

  for (const point of globe.points) {
    const p = project(point.lat, point.lon, w, h);
    if (!p.visible) continue;
    const selected = globe.selected && Math.abs(point.lat - globe.selected.lat) < 0.01 && Math.abs(point.lon - globe.selected.lon) < 0.01;
    const colour = point.rain ? "#5ec8ff" : selected ? "#ffffff" : "#8fd0ff";
    const pulse = reduced ? 0 : (Math.sin(t * 0.004 + point.lon) + 1) / 2;
    if (point.rain || selected) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 + pulse * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(94, 200, 255, ${0.22 * (1 - pulse)})`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, selected ? 3.6 : 2.2, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = selected ? 14 : 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function initGlobe() {
  const canvas = document.getElementById("globe-canvas");
  if (!canvas) return;
  globe.canvas = canvas;
  globe.ctx = canvas.getContext("2d");
  globe.points = DEFAULT_POINTS;
  if (!globe.ctx) return;

  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best = null;
    let bestD = 16;
    for (const point of globe.points) {
      const p = project(point.lat, point.lon, canvas.clientWidth, canvas.clientHeight);
      if (!p.visible) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) { bestD = d; best = point; }
    }
    if (best) window.dispatchEvent(new CustomEvent("wx:globe-select", { detail: best }));
  });

  const loop = (t) => {
    if (!globe.visible || document.hidden) { globe.raf = requestAnimationFrame(loop); return; }
    if (!reduced) globe.rot += 0.0012;
    drawGlobe(t);
    globe.raf = requestAnimationFrame(loop);
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { globe.visible = entries[0]?.isIntersecting ?? true; }).observe(canvas);
  }
  new ResizeObserver(() => drawGlobe(performance.now())).observe(canvas);
  globe.raf = requestAnimationFrame(loop);
  window.addEventListener("pagehide", () => cancelAnimationFrame(globe.raf), { once: true });
}

/* ------------------------------------------------------------------ init */
export function initMagic() {
  if (started) return;
  started = true;
  initCards();
  initReveal();
  initParticles();
  initGlobe();
  setWeatherMood(0, true);
}

export { moodFor, DEFAULT_POINTS };
