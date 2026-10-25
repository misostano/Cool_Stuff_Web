// =============================================================================
// lib/urls.js  –  v0.2.0
// Jediné miesto, ktoré rozhoduje o tvare adries:
//   predvolený jazyk (SK) je na koreni:  /aerospace/hydroplany/
//   ostatné jazyky majú predponu:        /en/aerospace/hydroplanes/
// =============================================================================

export function createUrls(site) {
  const langInfo = (code) => {
    const info = site.languages.find((l) => l.code === code);
    if (!info) throw new Error(`Neznámy jazyk „${code}“. Skontrolujte src/_data/site.js.`);
    return info;
  };
  const prefix = (lang) => (lang === site.defaultLang ? '' : `/${lang}`);

  return {
    langInfo,
    prefix,
    homeUrl: (lang) => `${prefix(lang)}/`,
    archiveUrl: (lang, number = 1) =>
      `${prefix(lang)}/${langInfo(lang).paths.archive}/${number > 1 ? `${number}/` : ''}`,
    tagsUrl: (lang) => `${prefix(lang)}/${langInfo(lang).paths.tags}/`,
    tagUrl: (lang, slug) => `${prefix(lang)}/${langInfo(lang).paths.tags}/${slug}/`,
    feedUrl: (lang) => `${prefix(lang)}/${langInfo(lang).paths.feed}`,
  };
}
