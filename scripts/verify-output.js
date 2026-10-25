// =============================================================================
// scripts/verify-output.js  –  v0.2.0
// Kontrola hotového webu v priečinku _site (beží po builde):
//   - povinné súbory (404, sitemap, robots, kanály pre každý jazyk),
//   - rozbité interné odkazy (a, link, img, script) vrátane hreflang a canonical,
//   - obrázky bez alt textu (prázdny alt je povolený len pri dekoratívnych dlaždiciach),
//   - každá stránka má jazyk (lang) a práve jeden nadpis h1,
//   - upozornenie na neobvykle veľké stránky.
// Výsledok sa vypíše aj pripojí k logs/latest.log.  Pri chybe končí kódom 1.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import site from '../src/_data/site.js';
import { appendToLatestLog } from '../lib/log.js';

const ROOT = path.resolve('_site');
const SIZE_WARN_BYTES = 100 * 1024;
const errors = [];
const warnings = [];

if (!fs.existsSync(ROOT)) {
  console.error('[web] CHYBA: priečinok _site neexistuje. Najprv spustite build.');
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(ROOT);
const rel = (f) => '/' + path.relative(ROOT, f).split(path.sep).join('/');
const fileSet = new Set(files.map(rel));
const htmlFiles = files.filter((f) => f.endsWith('.html'));

// --- povinné súbory ---------------------------------------------------------
const required = ['/404.html', '/sitemap.xml', '/robots.txt', '/favicon.svg'];
for (const l of site.languages) {
  const prefix = l.code === site.defaultLang ? '' : `/${l.code}`;
  required.push(`${prefix}/index.html`, `${prefix}/${l.paths.feed}`, `${prefix}/${l.paths.archive}/index.html`);
  required.push(`${prefix}/${l.paths.tags}/index.html`);
}
for (const r of required) if (!fileSet.has(r)) errors.push(`Chýba povinný súbor ${r}`);

// --- existencia cieľa odkazu --------------------------------------------------
function targetExists(urlPath) {
  const clean = decodeURIComponent(urlPath);
  if (fileSet.has(clean)) return true;
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return fileSet.has(`${withSlash}index.html`);
}

const attrRe = /\b(href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;

for (const file of htmlFiles) {
  const page = rel(file);
  const pageUrl = page.endsWith('/index.html') ? page.slice(0, -'index.html'.length) : page;
  const html = fs.readFileSync(file, 'utf8');
  const bytes = Buffer.byteLength(html);
  if (bytes > SIZE_WARN_BYTES) warnings.push(`${page}: stránka má ${(bytes / 1024).toFixed(0)} kB (odporúčaný limit 100 kB).`);

  if (!/<html[^>]*\slang=/i.test(html)) errors.push(`${page}: chýba atribút lang na <html>.`);
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count !== 1) errors.push(`${page}: očakáva sa presne jeden <h1>, nájdených ${h1Count}.`);

  for (const m of html.matchAll(attrRe)) {
    const value = (m[3] ?? m[4] ?? m[5] ?? '').trim();
    if (!value || value.startsWith('#') || /^(mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    let target = value;
    if (/^https?:\/\//i.test(value)) {
      if (!value.startsWith(site.url)) continue; // vonkajší odkaz sa nekontroluje
      target = value.slice(site.url.length) || '/';
    } else if (value.startsWith('//')) {
      continue;
    }
    const resolved = new URL(target, `https://x.invalid${pageUrl}`);
    if (!targetExists(resolved.pathname)) errors.push(`${page}: rozbitý odkaz ${value}`);
  }

  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    const t = tag[0];
    const alt = /\balt\s*=\s*("([^"]*)"|'([^']*)')/i.exec(t);
    if (!alt) errors.push(`${page}: obrázok bez atribútu alt: ${t.slice(0, 80)}`);
    else if (!(alt[2] ?? alt[3]).trim() && !/data-decor/i.test(t)) {
      errors.push(`${page}: obrázok s prázdnym alt textom (doplňte popis): ${t.slice(0, 80)}`);
    }
  }
}

// --- výpis a zápis do logu ----------------------------------------------------
const summary = [
  `--- Kontrola výstupu: stránok ${htmlFiles.length}, súborov ${files.length}, upozornení ${warnings.length}, chýb ${errors.length} ---`,
  ...warnings.map((w) => `[WARN] ${w}`),
  ...errors.map((e) => `[ERROR] ${e}`),
];
appendToLatestLog(summary);

for (const w of warnings) console.warn(`[web] POZOR: ${w}`);
for (const e of errors) console.error(`[web] CHYBA: ${e}`);
console.log(
  errors.length
    ? `[web] Kontrola výstupu zlyhala (chýb: ${errors.length}).`
    : `[web] Kontrola výstupu prešla: ${htmlFiles.length} stránok, bez rozbitých odkazov.`,
);
process.exit(errors.length ? 1 : 0);
