// =============================================================================
// src/_data/site.js  –  v0.2.0
// Hlavné nastavenie webu. Tu menia názov, autora, jazyky a limity.
// =============================================================================

export default {
  // Adresa webu bez lomky na konci. Pri nasadení ju nastaví GitHub Actions
  // automaticky (aj pre vlastnú doménu). Lokálne sa použije zástupná hodnota.
  url: (process.env.SITE_URL || 'https://UZIVATEL.github.io').replace(/\/+$/, ''),

  // Meno do päty stránky (©). ZMEŇTE NA SVOJE.
  author: 'Meno Priezvisko',

  // Jazyk na koreni adresy (/). Ostatné jazyky majú predponu (/en/).
  defaultLang: 'sk',

  // Zoznam jazykov. Pridanie jazyka: pozri README, časť „Pridanie jazyka“.
  languages: [
    {
      code: 'sk',
      label: 'Slovenčina',
      short: 'SK',
      locale: 'sk-SK',
      ogLocale: 'sk_SK',
      paths: { archive: 'archiv', tags: 'tagy', feed: 'feed.xml' },
    },
    {
      code: 'en',
      label: 'English',
      short: 'EN',
      locale: 'en-GB',
      ogLocale: 'en_GB',
      paths: { archive: 'archive', tags: 'tags', feed: 'feed.xml' },
    },
  ],

  // Texty hlavičky a vyhľadávačov (podľa jazyka). ZMEŇTE PODĽA SEBA.
  name: { sk: 'Môj web', en: 'My site' },
  tagline: {
    sk: 'Chémia, speedcubing, aerospace a ďalšie témy',
    en: 'Chemistry, speedcubing, aerospace and more',
  },
  description: {
    sk: 'Osobný blog o chémii, speedcubingu, letectve a kozmonautike a o ďalších témach.',
    en: 'A personal blog about chemistry, speedcubing, aviation and spaceflight, and other topics.',
  },

  postsPerPage: 12, // počet príspevkov na stranu v archíve
  feedItems: 20, // počet položiek v kanáli (RSS/Atom)
  year: new Date().getFullYear(),

  // Funkcie, ktoré sa dajú vypnúť jedným riadkom.
  features: {
    openGraph: true, // náhľady pri zdieľaní odkazu
    printStyles: true, // štýl pre tlač
  },
};
