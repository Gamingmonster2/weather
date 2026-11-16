/**
 * icons.js — inline SVG icon set (stroke UI icons + filled weather glyphs).
 * No icon fonts, no CDN, no runtime cost beyond the markup itself.
 */

const UI = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
  pin: '<path d="M12 21.2s7-6.4 7-11.2a7 7 0 1 0-14 0c0 4.8 7 11.2 7 11.2Z"/><circle cx="12" cy="10" r="2.5"/>',
  crosshair: '<circle cx="12" cy="12" r="7.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  navigation: '<path d="m3.2 11.4 17.6-7.8-7.8 17.6-2.1-7.7-7.7-2.1Z"/>',
  heart: '<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21.4l8.8-8.4a5.2 5.2 0 0 0 0-7.4Z"/>',
  share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.4 10.8 7.2-4.4M8.4 13.2l7.2 4.4"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M19.4 4.6l-1.6 1.6M6.2 17.8l-1.6 1.6"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7.2 7.2 0 0 0 10 10Z"/>',
  cloud: '<path d="M17.6 19H7a4.5 4.5 0 0 1-.6-8.96A6.2 6.2 0 0 1 18 11.3h-.2A3.9 3.9 0 0 1 17.6 19Z"/>',
  droplet: '<path d="M12 2.7 6.6 9a7.3 7.3 0 1 0 10.8 0L12 2.7Z"/>',
  droplets: '<path d="M8 3.2 4.6 7.1a4.4 4.4 0 1 0 6.8 0L8 3.2Z"/><path d="M16.5 9.5 13.8 12.6a3.7 3.7 0 1 0 5.7 0l-3-3.1Z"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
  thermometer: '<path d="M10 14.5V4.9a2 2 0 1 1 4 0v9.6a4 4 0 1 1-4 0Z"/>',
  gauge: '<path d="M4 18a8.5 8.5 0 1 1 16 0"/><path d="m12 15 4.2-4.4"/><circle cx="12" cy="16" r="1.4"/>',
  eye: '<path d="M2.2 12S5.8 5.8 12 5.8 21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 4v5h-5"/>',
  map: '<path d="m9 3.5 6 2.6 5.4-2.6a.7.7 0 0 1 1 .6v14.4a.7.7 0 0 1-.4.6l-6 2.9-6-2.6-5.4 2.6a.7.7 0 0 1-1-.6V7.1a.7.7 0 0 1 .4-.6l6-2.9Z"/><path d="M9 3.5v16.6M15 6.1v16.6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  layers: '<path d="m12 3 9 4.6-9 4.6-9-4.6L12 3Z"/><path d="m3 12.4 9 4.6 9-4.6"/><path d="m3 17.2 9 4.6 9-4.6"/>',
  alert: '<path d="M10.3 4.1 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/>',
  activity: '<path d="M2.5 12h4l2.5-7 5 14 2.5-7h5"/>',
  waves: '<path d="M2 7.5c1.8-2 3.4-2 5.2 0s3.4 2 5.2 0 3.4-2 5.2 0 3 2 4.4 1"/><path d="M2 13c1.8-2 3.4-2 5.2 0s3.4 2 5.2 0 3.4-2 5.2 0 3 2 4.4 1"/><path d="M2 18.5c1.8-2 3.4-2 5.2 0s3.4 2 5.2 0 3.4-2 5.2 0 3 2 4.4 1"/>',
  leaf: '<path d="M20.5 3.5C9.5 3.5 4 8.5 4 14.5a5 5 0 0 0 5 5c6 0 11.5-5.5 11.5-16Z"/><path d="M4.5 20.5 15 10"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  arrowRight: '<path d="M4 12h16M13 5l7 7-7 7"/>',
  arrowUpRight: '<path d="M6 18 18 6M8 6h10v10"/>',
  external: '<path d="M14 3.5h6.5V10"/><path d="M20.5 3.5 10 14"/><path d="M18.5 14v5.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5V7A1.5 1.5 0 0 1 4.5 5.5H10"/>',
  code: '<path d="m8.5 6.5-6 5.5 6 5.5"/><path d="m15.5 6.5 6 5.5-6 5.5"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/>',
  play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
  pause: '<rect x="6.5" y="4.5" width="3.5" height="15" rx="1"/><rect x="14" y="4.5" width="3.5" height="15" rx="1"/>',
  expand: '<path d="M9 3.5H4.5A1 1 0 0 0 3.5 4.5V9M15 3.5h4.5a1 1 0 0 1 1 1V9M20.5 15v4.5a1 1 0 0 1-1 1H15M9 20.5H4.5a1 1 0 0 1-1-1V15"/>',
  minimize: '<path d="M4 9h5V4M20 9h-5V4M15 20v-5h5M9 20v-5H4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  sunrise: '<path d="M12 3v5M6 18a6 6 0 0 1 12 0"/><path d="M2.5 18h19"/><path d="m6.5 8.5 1.8 1.8M17.5 8.5l-1.8 1.8"/>',
  sunset: '<path d="M12 8V3M6 18a6 6 0 0 1 12 0"/><path d="M2.5 18h19"/><path d="m6.5 12.5 1.8-1.8M17.5 12.5l-1.8-1.8"/>',
  sparkle: '<path d="m12 3 1.9 4.9L18.8 9.8l-4.9 1.9L12 16.6l-1.9-4.9L5.2 9.8l4.9-1.9L12 3Z"/><path d="m18.4 15.4.9 2.2 2.1.8-2.1.8-.9 2.2-.9-2.2-2.1-.8 2.1-.8.9-2.2Z"/>',
  database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/><path d="M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  shield: '<path d="M12 3 20 6v5.5c0 5-3.4 8.4-8 9.5-4.6-1.1-8-4.5-8-9.5V6l8-3Z"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h4"/>',
  wifiOff: '<path d="m2 2 20 20"/><path d="M8.5 16.5a4.5 4.5 0 0 1 6 0"/><path d="M5 13a9.5 9.5 0 0 1 3.5-2.2M19 13a9.5 9.5 0 0 0-2.4-1.7"/><path d="M2.5 9.5a14 14 0 0 1 4-2.3M21.5 9.5a14 14 0 0 0-3.6-2.2"/><path d="M12 20h.01"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  ruler: '<path d="m3 15 6-6 3 3 3-3 6 6-6 6-3-3-3 3-6-6Z"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5v-15Z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
  flag: '<path d="M5 21V4M5 4h11l-1.5 4L16 12H5"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  thermometerSun: '<path d="M12 3v9.5"/><circle cx="12" cy="16" r="4"/><path d="M12 16h0"/>',
  layersOff: '<path d="m3 3 18 18"/><path d="m12 3 9 4.6-3.4 1.7M3.2 12.4 12 17l3-1.5"/><path d="M3.4 17.2 12 21.8l4-2"/>',
};

const SIZES = { sm: 14, md: 16, lg: 20 };

/**
 * @param {string} name
 * @param {{size?:number|'sm'|'md'|'lg', cls?:string, stroke?:number}} [opts]
 */
export function icon(name, opts = {}) {
  const body = UI[name] || UI.info;
  const size = typeof opts.size === "number" ? opts.size : SIZES[opts.size] || 18;
  const cls = opts.cls ? ` ${opts.cls}` : "";
  return `<svg class="i${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${
    opts.stroke || 1.7
  }" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

const cloud = `<g class="g-cloud"><circle cx="24.5" cy="36" r="9.5"/><circle cx="34" cy="30.5" r="12.5"/><circle cx="43.5" cy="36.5" r="9"/><rect x="21" y="35" width="25" height="10.5" rx="5.25"/></g>`;
const cloudBack = `<g class="g-cloud-back" opacity="0.55"><circle cx="30" cy="28" r="9"/><circle cx="40" cy="26" r="10"/><rect x="27" y="27" width="18" height="8" rx="4"/></g>`;

function rays(cx, cy, inner, outer) {
  let out = "";
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const x1 = cx + Math.cos(a) * inner;
    const y1 = cy + Math.sin(a) * inner;
    const x2 = cx + Math.cos(a) * outer;
    const y2 = cy + Math.sin(a) * outer;
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
  return `<g stroke="var(--wx-uv)" stroke-width="3.4" stroke-linecap="round">${out}</g>`;
}

function drops(ys, x = [24, 32, 40]) {
  return x
    .map(
      (cx, i) =>
        `<line x1="${cx}" y1="${ys}" x2="${cx - 2.2}" y2="${ys + 7 + (i % 2) * 3}" stroke="var(--wx-rain)" stroke-width="3.6" stroke-linecap="round"/>`,
    )
    .join("");
}

const GLYPH = {
  sun: `<circle class="g-sun" cx="32" cy="32" r="11"/>${rays(32, 32, 16.5, 23)}`,
  moon: `<path class="g-moon" d="M41.5 39.5A17 17 0 1 1 26 15a13 13 0 0 0 15.5 24.5Z"/><circle class="g-star" cx="44" cy="20" r="1.6"/><circle class="g-star" cx="49" cy="26" r="1.1"/>`,
  cloud: cloud,
  "sun-cloud": `${rays(24, 24, 10.5, 16)}<circle class="g-sun" cx="24" cy="24" r="8"/>${cloud}`,
  "moon-cloud": `<path class="g-moon" d="M30 24.5A10.5 10.5 0 1 1 21 10a8 8 0 0 0 9 14.5Z"/>${cloud}`,
  drizzle: `${cloud}${drops(48)}`,
  rain: `${cloud}${drops(48)}`,
  "rain-heavy": `${cloudBack}${cloud}${drops(47, [22, 29, 36, 43])}`,
  showers: `${cloud}${drops(48, [24, 33, 42])}`,
  storm: `${cloud}<path class="g-bolt" d="M35 45 26 58h7l-2.5 5.5L42 50h-7.5l3-5h-2.5Z"/>`,
  snow: `${cloud}<g stroke="var(--wx-snow)" stroke-width="2.2" stroke-linecap="round"><path d="M24 50v8M20.5 52.5l7 3.5M27.5 52.5l-7 3.5"/><path d="M40 50v8M36.5 52.5l7 3.5M43.5 52.5l-7 3.5"/></g>`,
  fog: `${cloud}<g stroke="var(--wx-fog)" stroke-width="3.2" stroke-linecap="round"><path d="M18 51h20"/><path d="M26 58h20"/></g>`,
  wind: `<g stroke="var(--wx-wind)" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M12 24h22a6 6 0 1 0-6-6"/><path d="M12 34h28a6 6 0 1 1-6 6"/><path d="M12 44h16"/></g>`,
};

export function glyph(name, opts = {}) {
  const body = GLYPH[name] || GLYPH.cloud;
  const size = opts.size || 64;
  const cls = opts.cls ? ` ${opts.cls}` : "";
  return `<svg class="wx-glyph${cls}" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${
    opts.label || ""
  }">${body}</svg>`;
}

export function hasGlyph(name) {
  return Boolean(GLYPH[name]);
}

export function hydrate(root) {
  if (typeof document === "undefined") return;
  (root || document).querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.getAttribute("data-icon");
    const size = el.getAttribute("data-size") || "md";
    el.innerHTML = icon(name, { size });
    el.removeAttribute("data-icon");
  });
}
