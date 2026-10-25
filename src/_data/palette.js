// =============================================================================
// src/_data/palette.js  –  v0.2.0
// Jediný zdroj farieb pre svetlý aj tmavý režim.
//   - z tohto súboru sa pri builde vygenerujú CSS premenné (light-dark()),
//   - ten istý súbor kontroluje skript `npm run check:contrast` (WCAG kontrast).
// Farby sa menia TU, nie v CSS.
// =============================================================================

export default {
  // Základné farby: [svetlý režim, tmavý režim]
  light: {
    bg: '#f7f7f5', // pozadie stránky
    surface: '#ffffff', // karty, dlaždice, tabuľky
    fg: '#1b1d20', // hlavný text
    muted: '#444a52', // vedľajší text
    link: '#0a4aa6', // odkazy
    border: '#7d848d', // hrany prvkov (min. 3:1)
    rule: '#d3d6da', // jemné oddeľovacie čiary
    focus: '#0b57d0', // obrys pri klávesnici
  },
  dark: {
    bg: '#121417',
    surface: '#1a1d22',
    fg: '#e6e8eb',
    muted: '#b4bac3',
    link: '#8ab4ff',
    border: '#737a85',
    rule: '#2c3138',
    focus: '#8ab4ff',
  },

  // Akcentové farby sekcií (a1 … a6). Prideľujú sa v index.md sekcie: accent: a1
  accents: {
    a1: { light: '#1d4f9e', dark: '#8ab4ff' }, // modrá
    a2: { light: '#0a6650', dark: '#5fd4b4' }, // zelená
    a3: { light: '#904300', dark: '#ffb066' }, // oranžová
    a4: { light: '#6a2c9c', dark: '#c9a4ff' }, // fialová
    a5: { light: '#9c2650', dark: '#ff9bbd' }, // ružová
    a6: { light: '#404a56', dark: '#adb7c3' }, // neutrálna sivá
  },
};
