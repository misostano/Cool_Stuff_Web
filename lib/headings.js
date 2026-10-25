// =============================================================================
// lib/headings.js  –  v0.2.0
// Doplní nadpisom h2/h3 v článku atribút id (kvôli odkazom a obsahu článku)
// a vie z nich zostaviť zoznam pre obsah (TOC).  Funguje bez ďalších balíkov.
// =============================================================================
import { slugify } from './slug.js';

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function textOf(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|nbsp);|&#39;/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();
}

/** Vráti { html, items } – html s id na nadpisoch, items = [{ level, id, text }]. */
export function processHeadings(html) {
  const used = new Set();
  const items = [];

  // Najprv zaregistrujeme už existujúce id, aby sa neopakovali.
  for (const m of html.matchAll(/<h[23][^>]*\sid=["']([^"']+)["']/gi)) used.add(m[1]);

  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, level, attrs = '', inner) => {
    const text = textOf(inner);
    const existing = /\sid=["']([^"']+)["']/i.exec(attrs);
    if (existing) {
      items.push({ level: Number(level), id: existing[1], text });
      return match;
    }
    const base = slugify(text) || 'cast';
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    items.push({ level: Number(level), id, text });
    return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });

  return { html: out, items };
}
