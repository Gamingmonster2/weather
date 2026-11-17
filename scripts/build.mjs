import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SITES = [
  {
    id: "rain",
    name: "Rain.ly",
    domain: "https://www.rain.ly",
    tagline: "Precipitation intelligence & rain radar",
    taglineAr: "استخبارات الهطول ورادار الأمطار",
  },
  {
    id: "weather",
    name: "weather.com.ly",
    domain: "https://weather.com.ly",
    tagline: "Weather, earthquake & marine observatory",
    taglineAr: "مرصد الطقس والزلازل والبحر",
  },
];

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else if (e.isFile()) await fs.copyFile(s, d);
  }
}

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ""));
}

function stripFrontMatter(src) {
  if (!src.startsWith("---")) return { meta: {}, body: src };
  const end = src.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: src };
  const block = src.slice(3, end).trim();
  const body = src.slice(end + 4).trim();
  const meta = {};
  for (const line of block.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[k] = v;
  }
  return { meta, body };
}

function mdToHtml(md) {
  // very small markdown subset for guide content (headings, paragraphs, lists, bold, links, blockquote, hr, table-lite)
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    // Standalone image: ![caption | descriptive alt](/assets/articles/x.jpg)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (imgMatch) {
      const bits = imgMatch[1].split("|");
      const caption = (bits[0] || "").trim();
      const alt = (bits.slice(1).join("|") || bits[0] || "").trim();
      out.push([
        '<figure class="article-figure magic-card">',
        '<div class="article-figure-media">',
        `<img src="${esc(imgMatch[2])}" alt="${esc(alt)}" loading="eager" decoding="async">`,
        "</div>",
        caption ? `<figcaption>${inline(caption)}</figcaption>` : "",
        "</figure>",
      ].join(""));
      i++; continue;
    }
    if (/^### /.test(line)) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (/^## /.test(line)) { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (/^# /.test(line)) { out.push(`<h1>${inline(line.slice(2))}</h1>`); i++; continue; }
    if (/^---+$/.test(line.trim())) { out.push("<hr>"); i++; continue; }
    if (/^> /.test(line)) {
      const b = [];
      while (i < lines.length && /^> /.test(lines[i])) { b.push(lines[i].slice(2)); i++; }
      out.push(`<blockquote><p>${inline(b.join(" "))}</p></blockquote>`);
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(`<li>${inline(lines[i].slice(2))}</li>`); i++; }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\d+\.\s*/, ""))}</li>`); i++; }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,3} |>|[-*] |\d+\. |---|!\[)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

async function readJSON(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function loadGuides(siteId) {
  const dir = path.join(ROOT, "content", siteId);
  if (!(await exists(dir))) return [];
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
  const guides = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    const { meta, body } = stripFrontMatter(raw);
    const slug = meta.slug || f.replace(/\.md$/, "").replace(/\.(ar|en)$/, "");
    const lang = meta.lang || (f.includes(".ar.") ? "ar" : "en");
    guides.push({
      slug,
      lang,
      title: meta.title || slug,
      description: meta.description || "",
      date: meta.date || "2026-01-01",
      read: meta.read || "5",
      html: mdToHtml(body),
      site: siteId,
    });
  }
  return guides;
}

function pageMeta(site, page, extra = {}) {
  const base = {
    lang: "en",
    dir: "ltr",
    title: `${site.name} — ${extra.title || site.tagline}`,
    description: extra.description || site.tagline,
    canonical: `${site.domain}${extra.path || "/"}`,
    ogImage: `${site.domain}/assets/og-${site.id}.svg`,
    brand: site.id,
    siteName: site.name,
    path: extra.path || "/",
  };
  return { ...base, ...extra };
}

function headTags(meta) {
  const altAr = meta.canonical.replace(/\/$/, "") || meta.canonical;
  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="${meta.brand === "rain" ? "#0b1220" : "#f5f7fa"}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="${meta.siteName}">
  <meta name="apple-mobile-web-app-status-bar-style" content="${meta.brand === "rain" ? "black-translucent" : "default"}">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/assets/icons/${meta.brand}-192.png">
  <link rel="canonical" href="${meta.canonical}">
  <link rel="alternate" hreflang="ar" href="${meta.canonical}">
  <link rel="alternate" hreflang="en" href="${meta.canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${meta.siteName}">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:url" content="${meta.canonical}">
  <meta property="og:image" content="${meta.ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">`;
}

function manifestFor(site) {
  const colors = site.id === "rain"
    ? { bg: "#0b1220", theme: "#0b1220" }
    : { bg: "#f5f7fa", theme: "#0f766e" };
  return {
    id: "/",
    name: `${site.name} — ${site.tagline}`,
    short_name: site.id === "rain" ? "Rain.ly" : "weather.com.ly",
    description: site.tagline,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: colors.bg,
    theme_color: colors.theme,
    lang: "en",
    dir: "ltr",
    icons: [
      { src: `/assets/icons/${site.id}-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/assets/icons/${site.id}-512.png`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
    shortcuts: [
      { name: "Cities", short_name: "Cities", url: "/cities.html", icons: [{ src: `/assets/icons/${site.id}-192.png`, sizes: "192x192" }] },
      { name: "Guides", short_name: "Guides", url: "/guides.html", icons: [{ src: `/assets/icons/${site.id}-192.png`, sizes: "192x192" }] },
    ],
  };
}

function serviceWorkerFor(site, buildId) {
  const cache = `wx-${site.id}-${buildId}`;
  const icon = `/assets/icons/${site.id}-192.png`;
  return `/* Generated by scripts/build.mjs — cache id: ${cache} */
const CACHE = "${cache}";
const SHELL = [
  "/", "/index.html", "/manifest.webmanifest", "${icon}",
  "/assets/css/tokens.css", "/assets/css/base.css", "/assets/css/components.css",
  "/assets/css/weather.css", "/assets/css/magic.css", "/assets/css/brand-${site.id}.css",
  "/assets/js/config.js", "/assets/js/i18n.js", "/assets/js/api.js", "/assets/js/geo.js",
  "/assets/js/ui.js", "/assets/js/icons.js", "/assets/js/charts.js", "/assets/js/cities.js",
  "/assets/js/magic.js", "/assets/js/pwa.js", "/assets/js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("wx-${site.id}-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
`;
}

async function buildSite(site, cities, allGuides) {
  const dist = path.join(ROOT, "dist", site.id);
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(path.join(dist, "assets", "js"), { recursive: true });
  await fs.mkdir(path.join(dist, "assets", "css"), { recursive: true });
  await fs.mkdir(path.join(dist, "assets", "data"), { recursive: true });
  await fs.mkdir(path.join(dist, "city"), { recursive: true });
  await fs.mkdir(path.join(dist, "guides"), { recursive: true });

  // shared assets
  if (await exists(path.join(ROOT, "shared", "css"))) await copyDir(path.join(ROOT, "shared", "css"), path.join(dist, "assets", "css"));
  if (await exists(path.join(ROOT, "shared", "js"))) await copyDir(path.join(ROOT, "shared", "js"), path.join(dist, "assets", "js"));
  await fs.copyFile(path.join(ROOT, "shared", "data", "cities.json"), path.join(dist, "assets", "data", "cities.json"));
  const sharedAssets = path.join(ROOT, "shared", "assets");
  if (await exists(sharedAssets)) await copyDir(sharedAssets, path.join(dist, "assets"));

  // site-specific assets
  const appCss = path.join(ROOT, "apps", site.id, `${site.id}.css`);
  if (await exists(appCss)) await fs.copyFile(appCss, path.join(dist, "assets", "css", `brand-${site.id}.css`));
  const brandCss = path.join(ROOT, "apps", site.id, "brand.css");
  if (await exists(brandCss)) await fs.copyFile(brandCss, path.join(dist, "assets", "css", `brand-${site.id}.css`));
  const appJs = path.join(ROOT, "apps", site.id, "app.js");
  if (await exists(appJs)) await fs.copyFile(appJs, path.join(dist, "assets", "js", "app.js"));
  const assetsDir = path.join(ROOT, "apps", site.id, "assets");
  if (await exists(assetsDir)) await copyDir(assetsDir, path.join(dist, "assets"));

  const layoutPath = path.join(ROOT, "apps", site.id, "layout.html");
  const layout = await fs.readFile(layoutPath, "utf8");
  const pagesDir = path.join(ROOT, "apps", site.id, "pages");

  const siteGuides = allGuides.filter((g) => g.site === site.id);
  const cross = SITES.find((s) => s.id !== site.id);

  const baseVars = {
    brand: site.id,
    siteName: site.name,
    domain: site.domain,
    crossName: cross.name,
    crossUrl: cross.domain,
    year: String(new Date().getFullYear()),
  };

  const writePage = async (outRel, pageName, meta, vars = {}) => {
    const pagePath = path.join(pagesDir, `${pageName}.html`);
    let body = "";
    if (await exists(pagePath)) body = await fs.readFile(pagePath, "utf8");
    body = render(body, { ...baseVars, ...vars, ...meta });
    const html = render(layout, {
      ...baseVars,
      ...vars,
      ...meta,
      head: headTags(meta),
      body,
    });
    const outPath = path.join(dist, outRel);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, html, "utf8");
  };

  // Core pages
  await writePage("index.html", "index", pageMeta(site, "index", { path: "/" }));
  await writePage("about.html", "about", pageMeta(site, "about", { path: "/about.html", title: `${site.name} — About this weather project` }));
  await writePage("guides.html", "guides", pageMeta(site, "guides", {
    path: "/guides.html",
    title: `${site.name} — Rain radar & weather guides`,
    description: `Bilingual guides to live rain maps, radar, hourly forecasts and weather in Libya from ${site.name}.`,
  }));
  await writePage("cities.html", "cities", pageMeta(site, "cities", {
    path: "/cities.html",
    title: `${site.name} — Libyan cities & live weather`,
    description: `Live weather, rain and forecast conditions for cities across Libya on ${site.name}.`,
  }));
  await writePage("credits.html", "credits", pageMeta(site, "credits", {
    path: "/credits.html",
    title: `${site.name} — Image credits`,
    description: `Photo credits and licences for images used on ${site.name}.`,
  }));
  await writePage("404.html", "404", pageMeta(site, "404", { path: "/404.html", title: "Not found" }));

  // City pages (Libyan)
  for (const city of cities.libya) {
    const pathUrl = `/city/${city.id}.html`;
    const title = `Weather in ${city.en}`;
    const desc = `Live conditions, hourly rain and 7-day forecast for ${city.en}, ${city.region.en}, Libya.`;
    await writePage(`city/${city.id}.html`, "city", pageMeta(site, "city", { path: pathUrl, title, description: desc }), {
      cityId: city.id,
      cityEn: city.en,
      cityAr: city.ar,
      cityLat: String(city.lat),
      cityLon: String(city.lon),
      cityRegionEn: city.region.en,
      cityRegionAr: city.region.ar,
      cityZone: city.zone,
      zoneTextEn: (cities.zones[city.zone] || {}).en || "",
      zoneTextAr: (cities.zones[city.zone] || {}).ar || "",
    });
  }

  // Guide pages
  const urls = ["/", "/about.html", "/guides.html", "/cities.html"];
  for (const city of cities.libya) urls.push(`/city/${city.id}.html`);

  const guidesBySlug = new Map();
  for (const g of siteGuides) {
    if (!guidesBySlug.has(g.slug)) guidesBySlug.set(g.slug, {});
    guidesBySlug.get(g.slug)[g.lang] = g;
  }
  for (const [slug, langs] of guidesBySlug) {
    const en = langs.en || langs.ar;
    const ar = langs.ar || langs.en;
    const pathUrl = `/guides/${slug}.html`;
    const bodyHtml = `
      <article class="prose" data-guide-slug="${slug}">
        <div class="lang-en" lang="en" dir="ltr">${en.html}</div>
        <div class="lang-ar" lang="ar" dir="rtl">${ar.html}</div>
      </article>`;
    // render guide page via guide template shell
    const guidePagePath = path.join(pagesDir, "guide.html");
    let pageBody = "";
    if (await exists(guidePagePath)) pageBody = await fs.readFile(guidePagePath, "utf8");
    pageBody = pageBody.replace("<!-- @guide -->", bodyHtml);
    pageBody = render(pageBody, { ...baseVars, guideTitle: en.title, guideTitleAr: ar.title, guideDesc: en.description, slug });
    const meta = pageMeta(site, "guide", { path: pathUrl, title: en.title, description: en.description || site.tagline });
    const html = render(layout, { ...baseVars, ...meta, head: headTags(meta), body: pageBody });
    const outPath = path.join(dist, "guides", `${slug}.html`);
    await fs.writeFile(outPath, html, "utf8");
    urls.push(pathUrl);
  }

  // robots.txt
  await fs.writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`, "utf8");

  // sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${site.domain}${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  await fs.writeFile(path.join(dist, "sitemap.xml"), sitemap, "utf8");

  // _headers / _redirects for Cloudflare Pages convenience
  await fs.writeFile(path.join(dist, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n", "utf8");

  // PWA installability
  await fs.writeFile(path.join(dist, "manifest.webmanifest"), JSON.stringify(manifestFor(site), null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(dist, "sw.js"), serviceWorkerFor(site, Date.now().toString(36)), "utf8");

  // Pages Advanced Mode worker: keep every output self-contained so any
  // deployment path (Git integration, Direct Upload or Workers) gets /api/fetch.
  const workerSrc = path.join(ROOT, "workers", "_worker.js");
  if (await exists(workerSrc)) await fs.copyFile(workerSrc, path.join(dist, "_worker.js"));

  console.log(`Built ${site.id} -> dist/${site.id} (${urls.length} urls)`);
}

async function main() {
  const cities = await readJSON(path.join(ROOT, "shared", "data", "cities.json"));
  const guidesRain = await loadGuides("rain");
  const guidesWeather = await loadGuides("weather");
  const allGuides = [...guidesRain, ...guidesWeather];
  for (const site of SITES) {
    await buildSite(site, cities, allGuides);
  }
  console.log("Build complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
