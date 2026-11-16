import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SITES = [
  { id: "rain", port: 8788 },
  { id: "weather", port: 8789 },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webp": "image/webp",
};

async function serveSite({ id, port }) {
  const root = path.join(ROOT, "dist", id);
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      let filePath = path.join(root, pathname);
      if (!filePath.startsWith(root)) {
        res.writeHead(403); res.end("Forbidden"); return;
      }
      let stat;
      try { stat = await fs.stat(filePath); } catch { stat = null; }
      if (stat && stat.isDirectory()) filePath = path.join(filePath, "index.html");
      let data;
      try { data = await fs.readFile(filePath); } catch {
        // try 404.html
        try {
          data = await fs.readFile(path.join(root, "404.html"));
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
          res.end(data);
          return;
        } catch {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(data);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(String(e));
    }
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  console.log(`${id} -> http://127.0.0.1:${port}/`);
  return server;
}

async function main() {
  for (const s of SITES) {
    try { await fs.access(path.join(ROOT, "dist", s.id)); }
    catch { console.error(`dist/${s.id} not found. Run: npm run build`); process.exit(1); }
  }
  const servers = [];
  for (const s of SITES) servers.push(await serveSite(s));
  console.log("Press Ctrl+C to stop.");
  process.on("SIGINT", () => { servers.forEach((s) => s.close()); process.exit(0); });
}

main().catch((err) => { console.error(err); process.exit(1); });
