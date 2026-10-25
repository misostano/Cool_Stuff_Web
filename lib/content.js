// =============================================================================
// lib/content.js  –  v0.2.0
// Pravidlá, ktoré z UMIESTNENIA súboru odvodia jeho úlohu a adresu.
//
//   src/sk/aerospace/index.md                        -> sekcia           /aerospace/
//   src/sk/aerospace/hydroplany/index.md             -> podsekcia        /aerospace/hydroplany/
//   src/sk/aerospace/hydroplany/clanok.md            -> príspevok        /aerospace/hydroplany/clanok/
//   src/sk/aerospace/clanok.md                       -> príspevok        /aerospace/clanok/
//   src/en/...  rovnako, ale s predponou             /en/aerospace/...
//
// Sekcia s `pageType: page` vo front matter je jednoduchá stránka (napr. O mne).
// Koncept: `draft: true` – príspevok sa zverejní až po odstránení tohto riadku
// (pri `npm start` je viditeľný, pri `npm run build` sa vynechá).
// =============================================================================
import site from '../src/_data/site.js';
import { isValidSlug } from './slug.js';
import { createUrls } from './urls.js';

const urls = createUrls(site);
const LANG_CODES = site.languages.map((l) => l.code);

const LAYOUTS = {
  home: 'layouts/home.njk',
  section: 'layouts/section.njk',
  subsection: 'layouts/subsection.njk',
  post: 'layouts/post.njk',
  page: 'layouts/page.njk',
};

/** Rozloží cestu súboru (page.filePathStem) na jazyk a časti. */
function parsePath(filePathStem) {
  const parts = filePathStem.split('/').filter(Boolean);
  const lang = parts[0];
  const rest = parts.slice(1);
  const isIndex = rest[rest.length - 1] === 'index';
  const segs = isIndex ? rest.slice(0, -1) : rest;
  return { lang, isIndex, segs };
}

function baseKind({ isIndex, segs }) {
  if (isIndex) {
    if (segs.length === 0) return 'home';
    if (segs.length === 1) return 'section';
    if (segs.length === 2) return 'subsection';
    return 'invalid';
  }
  return segs.length === 2 || segs.length === 3 ? 'post' : 'invalid';
}

function explain(inputPath, lang) {
  return (
    `Súbor ${inputPath} je na nepodporovanom mieste. Povolené umiestnenia:\n` +
    `  src/${lang}/<sekcia>/index.md\n` +
    `  src/${lang}/<sekcia>/<podsekcia>/index.md\n` +
    `  src/${lang}/<sekcia>/<príspevok>.md\n` +
    `  src/${lang}/<sekcia>/<podsekcia>/<príspevok>.md`
  );
}

/** Vytvorí „directory data“ pre jeden jazyk (používa src/sk/sk.11tydata.js a pod.). */
export function createDirectoryData(lang) {
  const analyse = (data) => {
    const parsed = parsePath(data.page.filePathStem);
    if (!LANG_CODES.includes(parsed.lang)) {
      throw new Error(`Neznámy jazykový priečinok v ceste ${data.page.inputPath}`);
    }
    let kind = baseKind(parsed);
    if (kind === 'invalid') throw new Error(explain(data.page.inputPath, lang));
    for (const s of parsed.segs) {
      if (!isValidSlug(s)) {
        throw new Error(
          `${data.page.inputPath}: názov „${s}“ nie je povolený. ` +
            'Používajte malé písmená bez diakritiky, číslice a pomlčky (napr. moj-prispevok).',
        );
      }
    }
    if (kind === 'section' && data.pageType === 'page') kind = 'page';
    return { ...parsed, kind };
  };

  return {
    lang,
    eleventyComputed: {
      kind: (data) => analyse(data).kind,

      sectionSlug: (data) => analyse(data).segs[0] ?? null,

      // Podsekcia: pre index podsekcie aj pre príspevok v nej.
      subSlug: (data) => {
        const a = analyse(data);
        if (a.kind === 'subsection') return a.segs[1];
        if (a.kind === 'post' && a.segs.length === 3) return a.segs[1];
        return null;
      },

      layout: (data) => LAYOUTS[analyse(data).kind],

      permalink: (data) => {
        const a = analyse(data);
        const isBuild = process.env.ELEVENTY_RUN_MODE === 'build';
        if (data.draft && isBuild) return false; // koncepty sa nezverejňujú
        const prefix = urls.prefix(a.lang);
        return a.segs.length ? `${prefix}/${a.segs.join('/')}/` : `${prefix}/`;
      },
    },
  };
}
