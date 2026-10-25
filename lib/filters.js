// =============================================================================
// lib/filters.js  –  v0.2.0
// Filtre (`{{ hodnota | filter }}`) a globálne funkcie (`{{ funkcia() }}`)
// dostupné v šablónach Nunjucks.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import palette from '../src/_data/palette.js';
import { processHeadings } from './headings.js';

const SRC_DIR = path.resolve('src');

/** CSS premenné farieb z palette.js (light-dark(): svetlý, tmavý). */
export function buildThemeCss(p) {
  const out = [':root{color-scheme:light dark;'];
  for (const key of Object.keys(p.light)) {
    out.push(`--${key}:light-dark(${p.light[key]},${p.dark[key]});`);
  }
  for (const [name, v] of Object.entries(p.accents)) {
    out.push(`--${name}:light-dark(${v.light},${v.dark});`);
  }
  out.push('}');
  out.push(':root[data-theme="light"]{color-scheme:light}');
  out.push(':root[data-theme="dark"]{color-scheme:dark}');
  for (const name of Object.keys(p.accents)) out.push(`.acc-${name}{--accent:var(--${name})}`);
  return out.join('');
}

function pluralForm(n, forms, lang) {
  const abs = Math.abs(Number(n));
  if (lang === 'sk' || lang === 'cs') {
    if (abs === 1) return forms[0];
    if (abs >= 2 && abs <= 4) return forms[1];
    return forms[2];
  }
  return abs === 1 ? forms[0] : forms[1] ?? forms[0];
}

export function registerFilters(eleventyConfig, model, site) {
  const dateFormats = new Map();
  const localeOf = (lang) => site.languages.find((l) => l.code === lang)?.locale ?? lang;

  // --- filtre ----------------------------------------------------------------
  eleventyConfig.addFilter('dateFmt', (date, lang) => {
    if (!(date instanceof Date)) return '';
    const locale = localeOf(lang);
    if (!dateFormats.has(locale)) {
      dateFormats.set(
        locale,
        new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
      );
    }
    return dateFormats.get(locale).format(date);
  });
  eleventyConfig.addFilter('isoDate', (date) => (date instanceof Date ? date.toISOString().slice(0, 10) : ''));
  eleventyConfig.addFilter('isoFull', (date) => (date instanceof Date ? date.toISOString() : ''));
  eleventyConfig.addFilter('plural', (n, forms, lang) => pluralForm(n, forms, lang));
  eleventyConfig.addFilter('fmt', (text, vars = {}) =>
    String(text).replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m)),
  );
  eleventyConfig.addFilter('inlineFile', (relativePath) =>
    fs.readFileSync(path.join(SRC_DIR, relativePath), 'utf8'),
  );
  eleventyConfig.addFilter('addHeadingIds', (html) => processHeadings(String(html)).html);
  eleventyConfig.addFilter('tocItems', (html) => processHeadings(String(html)).items);

  // --- globálne funkcie ------------------------------------------------------
  const global = (name, fn) => eleventyConfig.addNunjucksGlobal(name, fn);
  const u = model.urls;

  global('themeCss', () => buildThemeCss(palette));
  global('langInfo', (lang) => u.langInfo(lang));
  global('homeUrl', (lang) => u.homeUrl(lang));
  global('archiveUrl', (lang) => u.archiveUrl(lang));
  global('tagsUrl', (lang) => u.tagsUrl(lang));
  global('tagUrl', (lang, slug) => u.tagUrl(lang, slug));
  global('feedUrl', (lang) => u.feedUrl(lang));

  global('entryOf', (url) => model.get().entryOf(url));
  global('sectionsOf', (lang) => model.get().sections(lang));
  global('sectionEntry', (lang, slug) => model.get().sectionEntry(lang, slug));
  global('subsectionsOf', (lang, section) => model.get().subsections(lang, section));
  global('subsectionEntry', (lang, section, sub) => model.get().subsectionEntry(lang, section, sub));
  global('postsDirect', (lang, section) => model.get().postsDirect(lang, section));
  global('postsInSub', (lang, section, sub) => model.get().postsInSub(lang, section, sub));
  global('latestPosts', (lang, n) => model.get().latestPosts(lang, n));
  global('allTags', (lang) => model.get().allTags(lang));
  global('neighbors', (url) => model.get().neighbors(url));
  global('switchLinks', (url, lang) => model.get().switchLinks(url, lang));
  global('hreflangLinks', (url, lang) => model.get().hreflangLinks(url, lang));
  global('sitemapUrls', () => model.get().sitemapUrls());
}
