/**
 * Cloudflare Pages Advanced Mode worker (_worker.js)
 * - Serves static assets via env.ASSETS
 * - Provides /api/fetch?url=... allowlisted CORS/proxy for keyless data sources
 * - Adds security headers
 */

const ALLOW = [
  "https://api.open-meteo.com/",
  "https://geocoding-api.open-meteo.com/",
  "https://air-quality-api.open-meteo.com/",
  "https://marine-api.open-meteo.com/",
  "https://earthquake.usgs.gov/",
  "https://ipwho.is/",
  "https://api.rainviewer.com/",
  "https://api.bigdatacloud.net/",
  "https://wttr.in/",
  "https://tilecache.rainviewer.com/",
];

function isAllowed(target) {
  return ALLOW.some((p) => target.startsWith(p));
}

function securityHeaders(resp, url) {
  const h = new Headers(resp.headers);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "SAMEORIGIN");
  h.set("Permissions-Policy", "geolocation=(self)");
  // CSP: allow leaflet from unpkg, fonts from google, tiles and apis
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://tilecache.rainviewer.com",
    "connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com https://air-quality-api.open-meteo.com https://marine-api.open-meteo.com https://earthquake.usgs.gov https://ipwho.is https://api.rainviewer.com https://api.bigdatacloud.net https://wttr.in https://tilecache.rainviewer.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  if (!h.has("Content-Security-Policy")) h.set("Content-Security-Policy", csp);
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}

async function handleProxy(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  if (!target) return new Response("Missing url", { status: 400 });
  let parsed;
  try { parsed = new URL(target); } catch { return new Response("Bad url", { status: 400 }); }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return new Response("Bad scheme", { status: 400 });
  if (!isAllowed(parsed.toString())) return new Response("Forbidden target", { status: 403 });

  const upstream = await fetch(parsed.toString(), {
    method: "GET",
    headers: { "Accept": request.headers.get("Accept") || "application/json, text/plain, */*" },
  });
  const headers = new Headers(upstream.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "public, max-age=300");
  headers.delete("Set-Cookie");
  return new Response(upstream.body, { status: upstream.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/fetch") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      return handleProxy(request);
    }

    // Serve static assets
    let resp = await env.ASSETS.fetch(request);

    // SPA-ish fallback for clean paths (optional)
    if (resp.status === 404 && request.method === "GET" && !url.pathname.includes(".")) {
      const indexUrl = new URL("/index.html", url);
      resp = await env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return securityHeaders(resp, url);
  },
};
