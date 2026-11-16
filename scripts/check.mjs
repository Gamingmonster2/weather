import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let errors = 0;
function fail(msg) { console.error("FAIL:", msg); errors++; }
function ok(msg) { console.log("OK:", msg); }

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

function collectDictKeys(i18nSrc) {
  const keys = new Set();
  // find keys like "nav.overview": or 'nav.overview':
  const re = /["']([a-zA-Z0-9_.-]+)["']\s*:/g;
  let m;
  // only inside DICT block roughly: collect all quoted keys that look like our style
  while ((m = re.exec(i18nSrc))) {
    if (m[1].includes(".") || /^(en|ar)$/.test(m[1]) === false) keys.add(m[1]);
  }
  return keys;
}

async function checkI18nKeys(siteId) {
  const dist = path.join(ROOT, "dist", siteId);
  const i18nPath = path.join(dist, "assets", "js", "i18n.js");
  if (!(await exists(i18nPath))) { fail(`${siteId}: missing assets/js/i18n.js`); return; }
  const src = await fs.readFile(i18nPath, "utf8");
  const keys = collectDictKeys(src);
  const files = (await walk(dist)).filter((f) => f.endsWith(".html") || f.endsWith(".js"));
  let missing = 0;
  for (const f of files) {
    if (f.endsWith("i18n.js")) continue;
    const text = await fs.readFile(f, "utf8");
    const re = /data-i18n(?:-placeholder|-aria|-title)?=["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(text))) {
      const k = m[1];
      // check key exists in either en or ar dict (simple substring check)
      if (!src.includes(`"${k}"`) && !src.includes(`'${k}'`)) {
        console.error(`  missing i18n key "${k}" in ${path.relative(dist, f)}`);
        missing++;
      }
    }
  }
  if (missing) fail(`${siteId}: ${missing} missing i18n key(s)`); else ok(`${siteId}: i18n keys present`);
}

async function checkLinks(siteId) {
  const dist = path.join(ROOT, "dist", siteId);
  const htmlFiles = (await walk(dist)).filter((f) => f.endsWith(".html"));
  let bad = 0;
  for (const f of htmlFiles) {
    const text = await fs.readFile(f, "utf8");
    // internal href/src starting with /
    const re = /(href|src)=["'](\/[^"'#?]+)/g;
    let m;
    while ((m = re.exec(text))) {
      const ref = m[2];
      if (ref.startsWith("//")) continue; // protocol-relative external
      const target = path.join(dist, ref);
      if (!(await exists(target))) {
        console.error(`  broken ref ${ref} in ${path.relative(dist, f)}`);
        bad++;
      }
    }
  }
  if (bad) fail(`${siteId}: ${bad} broken internal link(s)/asset(s)`); else ok(`${siteId}: internal links/assets resolve`);
}

async function checkJsSyntax(siteId) {
  const dist = path.join(ROOT, "dist", siteId);
  const jsFiles = (await walk(dist)).filter((f) => f.endsWith(".js") || f.endsWith(".mjs"));
  let bad = 0;
  for (const f of jsFiles) {
    const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
    if (r.status !== 0) {
      console.error(`  syntax error in ${path.relative(dist, f)}: ${(r.stderr || "").trim()}`);
      bad++;
    }
  }
  if (bad) fail(`${siteId}: ${bad} JS syntax error(s)`); else ok(`${siteId}: JS syntax OK (${jsFiles.length} files)`);
}

async function checkRequired(siteId) {
  const dist = path.join(ROOT, "dist", siteId);
  const req = ["index.html", "404.html", "sitemap.xml", "robots.txt", "assets/css/tokens.css", "assets/js/app.js", "assets/data/cities.json"];
  let bad = 0;
  for (const r of req) {
    if (!(await exists(path.join(dist, r)))) { console.error(`  missing ${r}`); bad++; }
  }
  if (bad) fail(`${siteId}: missing required files`); else ok(`${siteId}: required files present`);
}

async function main() {
  for (const site of ["rain", "weather"]) {
    const dist = path.join(ROOT, "dist", site);
    if (!(await exists(dist))) { fail(`dist/${site} does not exist. Run build first.`); continue; }
    await checkRequired(site);
    await checkJsSyntax(site);
    await checkLinks(site);
    await checkI18nKeys(site);
  }
  if (errors) {
    console.error(`\n${errors} check(s) failed.`);
    process.exit(1);
  } else {
    console.log("\nAll checks passed.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
