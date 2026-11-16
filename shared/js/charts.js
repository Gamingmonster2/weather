/**
 * charts.js — dependency-free SVG charts tuned for meteorological data.
 * Everything returns an SVG string so it can be injected or server-rendered.
 */

const NS = 'xmlns="http://www.w3.org/2000/svg"';
let uid = 0;
const nextId = (p) => `${p}-${++uid}`;

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const n = value / base;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * base;
}

/** Catmull-Rom → cubic Bezier, so lines feel organic but stay exact. */
function smooth(points) {
  if (points.length < 2) return points.length ? `M${points[0][0]},${points[0][1]}` : "";
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(
      2,
    )},${p2[1].toFixed(2)}`;
  }
  return d;
}

function axisLabels(labels, count, width, left, step) {
  if (!labels.length) return "";
  const every = Math.max(1, Math.ceil(labels.length / count));
  let out = "";
  labels.forEach((label, i) => {
    if (i % every !== 0 && i !== labels.length - 1) return;
    const x = left + step * (i + 0.5);
    out += `<text x="${x.toFixed(1)}" y="${width}" text-anchor="middle">${esc(label)}</text>`;
  });
  return out;
}

/**
 * Combined stacked-bar + line chart.
 * @param {{
 *  labels:string[],
 *  bars?:{values:number[], color:string, label?:string}[],
 *  line?:{values:number[], color:string, label?:string, min?:number, max?:number},
 *  height?:number, barUnit?:string, lineUnit?:string, tip?:Function
 * }} opts
 */
export function comboChart(opts) {
  const { labels = [], bars = [], line = null, height = 220 } = opts;
  const W = 760;
  const H = height;
  const pad = { t: 16, r: line ? 34 : 14, b: 26, l: 34 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = Math.max(labels.length, 1);
  const step = innerW / n;

  const stacked = labels.map((_, i) => bars.reduce((sum, b) => sum + (Number(b.values[i]) || 0), 0));
  const barMax = niceMax(Math.max(...stacked, 0.2));
  const lineVals = line ? line.values.map((v) => Number(v) || 0) : [];
  const lineMin = line && Number.isFinite(line.min) ? line.min : 0;
  const lineMax = line && Number.isFinite(line.max) ? line.max : 100;

  const y = (v, max) => pad.t + innerH - (Math.max(0, v) / max) * innerH;
  const cy = (v) => y(v - lineMin, lineMax - lineMin);

  const gradId = nextId("g");
  let defs = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${line ? line.color : "var(--primary)"}" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="${line ? line.color : "var(--primary)"}" stop-opacity="0.02"/>
  </linearGradient></defs>`;

  let grid = "";
  for (let i = 0; i <= 3; i++) {
    const value = (barMax / 3) * i;
    const gy = y(value, barMax);
    grid += `<line x1="${pad.l}" y1="${gy.toFixed(1)}" x2="${W - pad.r}" y2="${gy.toFixed(1)}"/>`;
    grid += `<text x="${pad.l - 7}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${Number(
      value.toFixed(value < 1 ? 1 : 0),
    )}</text>`;
  }

  let barsMarkup = "";
  const barW = Math.max(2.5, Math.min(16, step * 0.52));
  labels.forEach((_, i) => {
    let acc = 0;
    const x = pad.l + step * (i + 0.5) - barW / 2;
    const parts = [];
    bars.forEach((b) => {
      const v = Number(b.values[i]) || 0;
      if (v <= 0) return;
      const h = (v / barMax) * innerH;
      const yy = pad.t + innerH - (acc + v) / barMax * innerH;
      parts.push(
        `<rect class="chart-bar" x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${barW.toFixed(
          1,
        )}" height="${Math.max(h, 0.8).toFixed(1)}" rx="${Math.min(2.2, barW / 3).toFixed(
          1,
        )}" fill="${b.color}"/>`,
      );
      acc += v;
    });
    if (parts.length) {
      const title = opts.tip ? opts.tip(i) : `${labels[i]} · ${acc.toFixed(1)} ${opts.barUnit || ""}`;
      barsMarkup += `<g><title>${esc(title)}</title>${parts.join("")}</g>`;
    }
  });

  let lineMarkup = "";
  if (line && lineVals.length) {
    const pts = lineVals.map((v, i) => [pad.l + step * (i + 0.5), cy(v)]);
    const path = smooth(pts);
    const base = pad.t + innerH;
    const area = `${path} L${pts[pts.length - 1][0].toFixed(2)},${base} L${pts[0][0].toFixed(2)},${base} Z`;
    lineMarkup = `<path class="chart-area" d="${area}" fill="url(#${gradId})"/>
      <path class="chart-line" d="${path}" stroke="${line.color}"/>`;
    pts.forEach((p, i) => {
      if (i % Math.max(1, Math.round(n / 12)) !== 0 && i !== n - 1) return;
      const tip = opts.tip
        ? opts.tip(i)
        : `${labels[i]} · ${Math.round(lineVals[i])}${opts.lineUnit || ""}`;
      lineMarkup += `<g><title>${esc(tip)}</title><circle class="chart-dot" cx="${p[0].toFixed(
        1,
      )}" cy="${p[1].toFixed(1)}" r="2.6" fill="${line.color}"/></g>`;
    });
    if (line.label) {
      lineMarkup += `<text x="${W - pad.r + 6}" y="${pad.t + 4}" fill="${line.color}" font-size="9">${esc(
        line.label,
      )}</text>`;
    }
  }

  return `<svg ${NS} viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="none" role="img">
    ${defs}
    <g class="chart-grid">${grid}</g>
    ${barsMarkup}
    ${lineMarkup}
    <g class="chart-axis">${axisLabels(labels, 8, H - pad.b + 16, pad.l, step)}</g>
  </svg>`;
}

/** Temperature area chart. */
export function areaChart(opts) {
  const { values = [], labels = [], color = "var(--wx-temp)", height = 170, min, max } = opts;
  const W = 760;
  const H = height;
  const pad = { t: 18, r: 12, b: 24, l: 30 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = Math.max(values.length, 1);
  const step = innerW / n;
  const lo = Number.isFinite(min) ? min : Math.floor(Math.min(...values) - 2);
  const hi = Number.isFinite(max) ? max : Math.ceil(Math.max(...values) + 2);
  const span = Math.max(hi - lo, 1);
  const y = (v) => pad.t + innerH - ((v - lo) / span) * innerH;
  const pts = values.map((v, i) => [pad.l + step * (i + 0.5), y(Number(v))]);
  const gradId = nextId("a");
  const base = pad.t + innerH;
  const path = smooth(pts);
  const area = `${path} L${pts[pts.length - 1][0].toFixed(2)},${base} L${pts[0][0].toFixed(2)},${base} Z`;

  let grid = "";
  for (let i = 0; i <= 3; i++) {
    const v = lo + (span / 3) * i;
    const gy = y(v);
    grid += `<line x1="${pad.l}" y1="${gy.toFixed(1)}" x2="${W - pad.r}" y2="${gy.toFixed(1)}"/>`;
    grid += `<text x="${pad.l - 6}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${Math.round(v)}°</text>`;
  }

  let dots = "";
  pts.forEach((p, i) => {
    if (i % Math.max(1, Math.round(n / 8)) !== 0 && i !== n - 1) return;
    dots += `<circle class="chart-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(
      1,
    )}" r="2.8" fill="${color}"/>`;
  });

  return `<svg ${NS} viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="none" role="img">
    <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
    </linearGradient></defs>
    <g class="chart-grid">${grid}</g>
    <path class="chart-area" d="${area}" fill="url(#${gradId})"/>
    <path class="chart-line" d="${path}" stroke="${color}"/>
    ${dots}
    <g class="chart-axis">${axisLabels(labels, 8, H - pad.b + 14, pad.l, step)}</g>
  </svg>`;
}

/** Tiny inline sparkline (no axes, no labels). */
export function sparkline(values = [], color = "var(--primary)", opts = {}) {
  const W = opts.width || 120;
  const H = opts.height || 30;
  const pad = 3;
  if (!values.length) return "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, 0.001);
  const step = (W - pad * 2) / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => [pad + i * step, H - pad - ((v - lo) / span) * (H - pad * 2)]);
  const d = smooth(pts);
  const gid = nextId("s");
  return `<svg ${NS} viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${d} L${W - pad},${H} L${pad},${H} Z" fill="url(#${gid})"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx, cy, r, start, end) {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

/** 270° gauge. */
export function gauge(opts) {
  const { value = 0, max = 100, color = "var(--primary)", size = 108, label = "", display } = opts;
  const pct = Math.max(0, Math.min(1, Number(value) / (max || 1)));
  const cx = 60;
  const cy = 60;
  const r = 44;
  const track = arcPath(cx, cy, r, -135, 135);
  return `<div class="gauge" style="width:${size}px;height:${size}px">
    <svg ${NS} viewBox="0 0 120 120" aria-hidden="true">
      <path class="gauge-track" d="${track}" fill="none" stroke-width="9" stroke-linecap="round"/>
      <path class="gauge-fill" d="${track}" fill="none" stroke="${color}" stroke-width="9"
        pathLength="100" stroke-dasharray="100" stroke-dashoffset="${(100 - pct * 100).toFixed(1)}"/>
    </svg>
    <div class="gauge-text"><b>${esc(display ?? Math.round(Number(value) || 0))}</b><span>${esc(label)}</span></div>
  </div>`;
}

/** Sun position arc between sunrise and sunset. */
export function sunArc(opts) {
  const { sunrise, sunset, now = Date.now(), height = 104 } = opts;
  const W = 300;
  const H = height;
  const cy = H - 16;
  const cx = W / 2;
  const rx = 126;
  const ry = H - 34;
  const t = Math.max(0, Math.min(1, (now - sunrise) / Math.max(sunset - sunrise, 1)));

  const point = (f) => [cx - rx * Math.cos(Math.PI * f), cy - ry * Math.sin(Math.PI * f)];
  const [sx, sy] = point(0);
  const [ex, ey] = point(1);
  const [px, py] = point(t);

  const arc = `M${sx.toFixed(1)},${sy.toFixed(1)} A${rx},${ry} 0 0 1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
  const up = t >= 1 ? arc : `M${sx.toFixed(1)},${sy.toFixed(1)} A${rx},${ry} 0 0 1 ${px.toFixed(1)},${py.toFixed(1)}`;

  return `<svg ${NS} viewBox="0 0 ${W} ${H}" class="sun-arc" aria-hidden="true">
    <path class="arc" d="${arc}"/>
    <line class="horizon" x1="8" y1="${cy}" x2="${W - 8}" y2="${cy}"/>
    <path class="arc-fill" d="${up}" pathLength="100" stroke-dasharray="100"/>
    <circle class="sun" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6.5"/>
  </svg>`;
}

/** Stacked horizontal comparison bar (used for 7-day ranges / AQI bands). */
export function rangeBar(min, max, lo, hi, color = "var(--wx-temp)") {
  const span = Math.max(hi - lo, 1);
  const start = Math.max(0, Math.min(100, ((min - lo) / span) * 100));
  const end = Math.max(0, Math.min(100, ((max - lo) / span) * 100));
  return `<span class="range-bar"><span style="inset-inline-start:${start.toFixed(
    1,
  )}%;width:${Math.max(end - start, 4).toFixed(1)}%;background:${color}"></span></span>`;
}
