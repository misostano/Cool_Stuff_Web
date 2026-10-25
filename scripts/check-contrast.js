// =============================================================================
// scripts/check-contrast.js  –  v0.2.0
// Skontroluje kontrast farieb z src/_data/palette.js podľa WCAG 2.x
// pre svetlý aj tmavý režim.  Spustenie:  npm run check:contrast
//   - text:           min. 4,5 : 1 (AA);  hlavný text min. 7 : 1 (AAA)
//   - hrany a obrysy: min. 3 : 1
// Pri nesplnení skončí s chybou (exit kód 1).
// =============================================================================
import palette from '../src/_data/palette.js';

function luminance(hex) {
  const n = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failures = 0;
const rows = [];

function check(mode, label, fg, bg, min) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failures += 1;
  rows.push(`${ok ? 'OK  ' : 'CHYBA'}  ${mode.padEnd(5)} ${label.padEnd(34)} ${r.toFixed(2).padStart(6)} : 1  (min ${min})`);
}

for (const mode of ['light', 'dark']) {
  const c = palette[mode];
  const name = mode === 'light' ? 'svetlý' : 'tmavý';
  check(name, 'hlavný text / pozadie', c.fg, c.bg, 7);
  check(name, 'hlavný text / karty', c.fg, c.surface, 7);
  check(name, 'vedľajší text / pozadie', c.muted, c.bg, 7);
  check(name, 'vedľajší text / karty', c.muted, c.surface, 7);
  check(name, 'odkaz / pozadie', c.link, c.bg, 7);
  check(name, 'odkaz / karty', c.link, c.surface, 7);
  check(name, 'hrany / pozadie', c.border, c.bg, 3);
  check(name, 'hrany / karty', c.border, c.surface, 3);
  check(name, 'obrys fokusu / pozadie', c.focus, c.bg, 3);
  check(name, 'obrys fokusu / karty', c.focus, c.surface, 3);
  for (const [key, v] of Object.entries(palette.accents)) {
    check(name, `akcent ${key} / pozadie`, v[mode], c.bg, 4.5);
    check(name, `akcent ${key} / karty`, v[mode], c.surface, 4.5);
  }
}

console.log(rows.join('\n'));
console.log(failures ? `\nNesplnených kontrol: ${failures}` : '\nVšetky kontroly kontrastu prešli.');
process.exit(failures ? 1 : 0);
