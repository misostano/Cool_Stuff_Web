// =============================================================================
// lib/model.js  –  v0.2.0
// „Model webu“: z hotových stránok Eleventy zostaví jednotný prehľad
//   sekcie -> podsekcie -> príspevky, tagy, preklady, susedné príspevky,
//   adresy pre prepínač jazyka a hreflang.
// Model vzniká raz pri každom builde (v prvej kolekcii) a šablóny ho čítajú
// cez funkcie zaregistrované v lib/filters.js.
// Zároveň tu prebieha kontrola obsahu – chyby zastavia build s jasnou správou.
// =============================================================================
import { log } from './log.js';
import { slugify } from './slug.js';
import { createUrls } from './urls.js';

const CONTENT_KINDS = new Set(['home', 'section', 'subsection', 'post', 'page']);
// Názvy, ktoré Eleventy používa pre vlastné kolekcie – nesmú byť tagom.
const RESERVED_TAGS = new Set(['all', 'langPages', 'archivePages', 'tagPages']);

export function createModel(site) {
  const urls = createUrls(site);
  let current = null;

  return {
    urls,
    reset() {
      current = null;
    },
    /** Zavolá sa z kolekcií. Postaví model a pri chybách obsahu zastaví build. */
    ensure(api) {
      if (!current) {
        current = buildModel(api.getAll(), site, urls);
        report(current);
      }
      if (current.errors.length) {
        throw new Error('Obsah webu obsahuje chyby:\n - ' + current.errors.join('\n - '));
      }
      return current;
    },
    /** Zavolá sa zo šablón (po vytvorení kolekcií). */
    get() {
      if (!current) throw new Error('Model webu ešte nie je pripravený.');
      return current;
    },
  };
}

function report(m) {
  for (const code of m.langCodes) {
    log.info(
      `Jazyk ${code}: sekcií ${m.sections(code).length}, príspevkov ${m.postCount(code)}, tagov ${m.allTags(code).length}`,
    );
  }
  for (const w of m.warnings) log.warn(w);
  for (const e of m.errors) log.error(e);
}

// ----------------------------------------------------------------------------
// Pomocné funkcie
// ----------------------------------------------------------------------------
function normalizeTags(raw, where, errors) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const label = String(t).trim();
    if (!label) continue;
    const slug = slugify(label);
    if (!slug) {
      errors.push(`${where}: tag „${label}“ sa nedá previesť na adresu (použite písmená alebo číslice).`);
      continue;
    }
    if (RESERVED_TAGS.has(label) || RESERVED_TAGS.has(slug)) {
      errors.push(`${where}: tag „${label}“ je vyhradený pre systém, zvoľte iný názov.`);
      continue;
    }
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ label, slug });
  }
  return out;
}

function makeEntry(item, d, errors) {
  const where = item.inputPath;
  let date = null;
  if (d.date !== undefined && d.date !== null && d.date !== '') {
    date = d.date instanceof Date ? d.date : new Date(d.date);
    if (Number.isNaN(date.getTime())) {
      errors.push(`${where}: neplatný dátum „${d.date}“ (použite tvar 2026-10-24).`);
      date = null;
    }
  }
  const order = Number(d.order);
  return {
    url: item.url,
    inputPath: where,
    lang: d.lang,
    kind: d.kind,
    title: d.title ? String(d.title) : '',
    description: d.description ? String(d.description) : '',
    order: Number.isFinite(order) ? order : 999,
    hasOrder: Number.isFinite(order),
    date,
    tags: normalizeTags(d.tags, where, errors),
    translationKey: d.translationKey ? String(d.translationKey) : null,
    sectionSlug: d.sectionSlug ?? null,
    subSlug: d.subSlug ?? null,
    accent: d.accent ? String(d.accent) : null,
    tileImage: d.tileImage ? String(d.tileImage) : null,
    toc: Boolean(d.toc),
    // Doplní sa neskôr:
    section: null,
    sub: null,
    count: 0,
    badge: '',
    sectionTitle: '',
    subTitle: '',
  };
}

/** Odľahčená „karta“ príspevku pre stránky archívu a tagov (bez cyklických odkazov). */
function toCard(e) {
  return {
    url: e.url,
    lang: e.lang,
    title: e.title,
    description: e.description,
    date: e.date,
    tags: e.tags,
    accent: e.accent,
    sectionTitle: e.sectionTitle,
    subTitle: e.subTitle,
  };
}

const byOrderThenTitle = (a, b) => a.order - b.order || a.title.localeCompare(b.title, a.lang);
const byDateDesc = (a, b) =>
  (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.title.localeCompare(b.title, a.lang);

// ----------------------------------------------------------------------------
// Zostavenie modelu
// ----------------------------------------------------------------------------
function buildModel(items, site, urls) {
  const langCodes = site.languages.map((l) => l.code);
  const errors = [];
  const warnings = [];
  const entries = [];

  for (const item of items) {
    const d = item.data || {};
    if (!CONTENT_KINDS.has(d.kind) || !langCodes.includes(d.lang)) continue;
    if (!item.url) continue; // koncept alebo vypnutá stránka
    entries.push(makeEntry(item, d, errors));
  }

  const byUrl = new Map(entries.map((e) => [e.url, e]));
  const sectionMap = new Map();
  const subMap = new Map();
  for (const e of entries) {
    if (e.kind === 'section' || e.kind === 'page') sectionMap.set(`${e.lang}|${e.sectionSlug}`, e);
    if (e.kind === 'subsection') subMap.set(`${e.lang}|${e.sectionSlug}|${e.subSlug}`, e);
  }

  // --- väzby, akcenty, názvy -------------------------------------------------
  for (const e of entries) {
    if (e.kind === 'section' || e.kind === 'page') {
      e.section = e;
      e.accent = e.accent || 'a6';
    }
  }
  for (const e of entries) {
    if (e.kind === 'subsection' || e.kind === 'post') {
      e.section = sectionMap.get(`${e.lang}|${e.sectionSlug}`) || null;
      if (!e.section) {
        errors.push(`${e.inputPath}: v priečinku chýba súbor index.md sekcie „${e.sectionSlug}“.`);
      }
      if (e.subSlug) {
        e.sub = subMap.get(`${e.lang}|${e.sectionSlug}|${e.subSlug}`) || null;
        if (!e.sub && e.kind === 'post') {
          errors.push(`${e.inputPath}: v priečinku chýba súbor index.md podsekcie „${e.subSlug}“.`);
        }
      }
      if (e.kind === 'subsection') e.sub = e;
      e.accent = e.accent || e.section?.accent || 'a6';
    }
    if (e.kind === 'home') e.accent = e.accent || 'a6';
  }
  for (const e of entries) {
    e.sectionTitle = e.section?.title ?? '';
    e.subTitle = e.sub && e.sub !== e ? e.sub.title : e.kind === 'subsection' ? e.title : '';
    if (e.kind === 'section' || e.kind === 'page') {
      e.badge = e.hasOrder ? String(e.order).padStart(2, '0') : e.title.slice(0, 2).toUpperCase();
    } else if (e.kind === 'subsection') {
      e.badge = e.title.trim().slice(0, 2).toUpperCase();
    }
    if (e.kind === 'post') {
      if (e.section) e.section.count += 1;
      if (e.sub) e.sub.count += 1;
    }
  }

  // --- kontroly obsahu -------------------------------------------------------
  const reservedTop = new Set(['assets', 'favicon.svg', 'robots.txt', 'sitemap.xml', '404.html']);
  for (const l of site.languages) {
    reservedTop.add(l.paths.archive);
    reservedTop.add(l.paths.tags);
  }
  for (const e of entries) {
    const where = e.inputPath;
    if (e.kind !== 'home' && !e.title) errors.push(`${where}: chýba povinné pole title.`);
    if (e.kind === 'post') {
      if (!e.date) errors.push(`${where}: príspevok musí mať pole date (napr. date: 2026-10-24).`);
      if (!e.description) warnings.push(`${where}: príspevok nemá description (krátky popis pre zoznamy a vyhľadávače).`);
    }
    if (['section', 'subsection', 'page'].includes(e.kind)) {
      if (!e.translationKey) warnings.push(`${where}: chýba translationKey, prepínač jazyka nenájde preklad.`);
      if (!e.description) warnings.push(`${where}: chýba description.`);
    }
    if ((e.kind === 'section' || e.kind === 'page') && !e.hasOrder) {
      warnings.push(`${where}: chýba order (poradie sekcie v menu).`);
    }
    if ((e.kind === 'section' || e.kind === 'page') && reservedTop.has(e.sectionSlug)) {
      errors.push(`${where}: názov sekcie „${e.sectionSlug}“ koliduje so systémovou adresou, zvoľte iný.`);
    }
    if ((e.kind === 'section' || e.kind === 'page') && e.lang === site.defaultLang && langCodes.includes(e.sectionSlug)) {
      errors.push(`${where}: názov sekcie „${e.sectionSlug}“ koliduje s kódom jazyka.`);
    }
  }

  // --- preklady --------------------------------------------------------------
  const translations = new Map();
  for (const e of entries) {
    if (!e.translationKey) continue;
    const slot = translations.get(e.translationKey) || {};
    if (slot[e.lang]) {
      errors.push(
        `translationKey „${e.translationKey}“ je v jazyku ${e.lang} použitý dvakrát: ${slot[e.lang].inputPath} a ${e.inputPath}.`,
      );
      continue;
    }
    slot[e.lang] = e;
    translations.set(e.translationKey, slot);
  }
  for (const [key, slot] of translations) {
    const kinds = new Set(Object.values(slot).map((e) => e.kind));
    if (kinds.size > 1) warnings.push(`translationKey „${key}“ spája rôzne typy stránok (${[...kinds].join(', ')}).`);
  }

  // --- zoznamy ---------------------------------------------------------------
  const sectionsBy = {};
  const subsBy = {};
  const postsBy = {};
  const postsBySection = new Map();
  for (const code of langCodes) {
    sectionsBy[code] = [];
    subsBy[code] = new Map();
    postsBy[code] = [];
  }
  for (const e of entries) {
    if (e.kind === 'section' || e.kind === 'page') sectionsBy[e.lang].push(e);
    else if (e.kind === 'subsection') {
      const list = subsBy[e.lang].get(e.sectionSlug) || [];
      list.push(e);
      subsBy[e.lang].set(e.sectionSlug, list);
    } else if (e.kind === 'post') {
      postsBy[e.lang].push(e);
      const key = `${e.lang}|${e.sectionSlug}`;
      postsBySection.set(key, [...(postsBySection.get(key) || []), e]);
    }
  }
  for (const code of langCodes) {
    sectionsBy[code].sort(byOrderThenTitle);
    for (const list of subsBy[code].values()) list.sort(byOrderThenTitle);
    postsBy[code].sort(byDateDesc);
  }
  for (const list of postsBySection.values()) list.sort(byDateDesc);

  // --- tagy ------------------------------------------------------------------
  const tagMaps = {};
  for (const code of langCodes) tagMaps[code] = new Map();
  for (const code of langCodes) {
    for (const p of postsBy[code]) {
      for (const t of p.tags) {
        const rec = tagMaps[code].get(t.slug) || { slug: t.slug, label: t.label, posts: [] };
        rec.posts.push(p);
        tagMaps[code].set(t.slug, rec);
      }
    }
  }
  const tagList = (lang) =>
    [...tagMaps[lang].values()]
      .map((r) => ({
        slug: r.slug,
        label: r.label,
        count: r.posts.length,
        url: urls.tagUrl(lang, r.slug),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, lang));

  // --- generované stránky ----------------------------------------------------
  const generated = new Map();
  const langPages = langCodes.map((code) => ({
    lang: code,
    homeUrl: urls.homeUrl(code),
    feedUrl: urls.feedUrl(code),
    tagsUrl: urls.tagsUrl(code),
    archiveUrl: urls.archiveUrl(code),
  }));
  const archivePages = [];
  const tagPages = [];
  for (const code of langCodes) {
    const list = postsBy[code];
    const total = Math.max(1, Math.ceil(list.length / site.postsPerPage));
    for (let n = 1; n <= total; n += 1) {
      const url = urls.archiveUrl(code, n);
      archivePages.push({
        lang: code,
        number: n,
        total,
        url,
        prevUrl: n > 1 ? urls.archiveUrl(code, n - 1) : null,
        nextUrl: n < total ? urls.archiveUrl(code, n + 1) : null,
        totalPosts: list.length,
        posts: list.slice((n - 1) * site.postsPerPage, n * site.postsPerPage).map(toCard),
      });
      generated.set(url, { type: 'archive', lang: code, number: n });
    }
    generated.set(urls.tagsUrl(code), { type: 'tags', lang: code });
    for (const rec of tagMaps[code].values()) {
      const url = urls.tagUrl(code, rec.slug);
      tagPages.push({
        lang: code,
        slug: rec.slug,
        label: rec.label,
        url,
        count: rec.posts.length,
        posts: [...rec.posts].sort(byDateDesc).map(toCard),
      });
      generated.set(url, { type: 'tag', lang: code, slug: rec.slug });
    }
  }
  generated.set('/404.html', { type: 'notfound', lang: site.defaultLang });

  // --- prepínač jazyka a hreflang --------------------------------------------
  const urlInfo = (url) => {
    const e = byUrl.get(url);
    if (e) return { type: 'content', entry: e };
    return generated.get(url) || null;
  };

  function alternate(info, code) {
    const home = { url: urls.homeUrl(code), exact: false };
    if (!info) return home;
    if (info.type === 'content') {
      const e = info.entry;
      if (e.kind === 'home') return { url: urls.homeUrl(code), exact: true };
      const hit = e.translationKey ? translations.get(e.translationKey)?.[code] : null;
      if (hit) return { url: hit.url, exact: true };
      if (e.kind === 'post' && e.section?.translationKey) {
        const sec = translations.get(e.section.translationKey)?.[code];
        if (sec) return { url: sec.url, exact: false };
      }
      return home;
    }
    switch (info.type) {
      case 'archive':
        return { url: urls.archiveUrl(code), exact: info.number === 1 };
      case 'tags':
        return { url: urls.tagsUrl(code), exact: true };
      case 'tag':
        return tagMaps[code].has(info.slug)
          ? { url: urls.tagUrl(code, info.slug), exact: true }
          : { url: urls.tagsUrl(code), exact: false };
      default:
        return home;
    }
  }

  function switchLinks(url, currentLang) {
    const info = urlInfo(url);
    return site.languages.map((L) => {
      if (L.code === currentLang) return { lang: L.code, short: L.short, label: L.label, url, exact: true };
      const alt = alternate(info, L.code);
      return { lang: L.code, short: L.short, label: L.label, url: alt.url, exact: alt.exact };
    });
  }

  function hreflangLinks(url, currentLang) {
    const exact = switchLinks(url, currentLang).filter((a) => a.exact);
    return exact.length > 1 ? exact : [];
  }

  // --- verejné funkcie modelu ------------------------------------------------
  const postsInSection = (lang, section) => postsBySection.get(`${lang}|${section}`) || [];

  return {
    errors,
    warnings,
    langCodes,
    langPages,
    archivePages,
    tagPages,

    entryOf: (url) => byUrl.get(url) || null,
    sections: (lang) => sectionsBy[lang] || [],
    sectionEntry: (lang, slug) => sectionMap.get(`${lang}|${slug}`) || null,
    subsections: (lang, section) => subsBy[lang]?.get(section) || [],
    subsectionEntry: (lang, section, sub) => subMap.get(`${lang}|${section}|${sub}`) || null,
    postsInSection,
    postsDirect: (lang, section) => postsInSection(lang, section).filter((p) => !p.subSlug),
    postsInSub: (lang, section, sub) => postsInSection(lang, section).filter((p) => p.subSlug === sub),
    latestPosts: (lang, n) => (postsBy[lang] || []).slice(0, n),
    postCount: (lang) => (postsBy[lang] || []).length,
    allTags: tagList,
    switchLinks,
    hreflangLinks,

    /** Starší a novší príspevok v rámci tej istej podsekcie (alebo sekcie). */
    neighbors(url) {
      const e = byUrl.get(url);
      if (!e || e.kind !== 'post') return { older: null, newer: null };
      const group = e.subSlug
        ? postsInSection(e.lang, e.sectionSlug).filter((p) => p.subSlug === e.subSlug)
        : postsInSection(e.lang, e.sectionSlug).filter((p) => !p.subSlug);
      const i = group.findIndex((p) => p.url === url);
      return { newer: i > 0 ? group[i - 1] : null, older: i >= 0 && i < group.length - 1 ? group[i + 1] : null };
    },

    /** Zoznam adries pre sitemap.xml aj s jazykovými alternatívami. */
    sitemapUrls() {
      const list = [...entries.map((e) => ({ url: e.url, lang: e.lang }))];
      for (const p of archivePages) list.push({ url: p.url, lang: p.lang });
      for (const code of langCodes) list.push({ url: urls.tagsUrl(code), lang: code });
      for (const p of tagPages) list.push({ url: p.url, lang: p.lang });
      return list
        .sort((a, b) => a.url.localeCompare(b.url))
        .map((u) => ({ url: u.url, alternates: hreflangLinks(u.url, u.lang) }));
    },
  };
}
