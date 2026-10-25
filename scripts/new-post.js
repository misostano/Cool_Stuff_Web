// =============================================================================
// scripts/new-post.js  –  v0.2.0
// Vytvorí nový príspevok so správnym názvom súboru a hlavičkou (front matter).
//
// Použitie (z priečinka projektu):
//   npm run novy-prispevok -- --jazyk sk --sekcia aerospace --podsekcia hydroplany --nazov "Môj nový článok"
//
// Voliteľné:  --tagy "tag1, tag2"   --kluc kluc-prekladu   --koncept
// Pomoc:      npm run novy-prispevok -- --help
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from '../lib/slug.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function help() {
  console.log(`Použitie:
  npm run novy-prispevok -- --jazyk sk --sekcia aerospace --podsekcia hydroplany --nazov "Názov článku"

Povinné:  --jazyk (sk | en)   --sekcia (priečinok sekcie)   --nazov "Názov"
Voliteľné: --podsekcia (priečinok podsekcie)  --tagy "a, b"  --kluc kluc-prekladu  --koncept`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.jazyk || !args.sekcia || !args.nazov || args.nazov === true) {
  help();
  process.exit(args.help ? 0 : 1);
}

const dir = path.join('src', String(args.jazyk), String(args.sekcia), args.podsekcia ? String(args.podsekcia) : '');
const indexFile = path.join(dir, 'index.md');
if (!fs.existsSync(indexFile)) {
  console.error(`CHYBA: priečinok ${dir} neexistuje alebo v ňom chýba index.md.`);
  process.exit(1);
}

const slug = slugify(args.nazov);
if (!slug) {
  console.error('CHYBA: z názvu sa nedá vytvoriť názov súboru.');
  process.exit(1);
}
const target = path.join(dir, `${slug}.md`);
if (fs.existsSync(target)) {
  console.error(`CHYBA: súbor ${target} už existuje.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const tags = String(args.tagy && args.tagy !== true ? args.tagy : '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);
const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;

const lines = [
  '---',
  `title: ${q(args.nazov)}`,
  'description: "Krátky popis príspevku (1 až 2 vety)."',
  `date: ${today}`,
  `tags: [${tags.map(q).join(', ')}]`,
];
if (args.kluc && args.kluc !== true) lines.push(`translationKey: ${args.kluc}`);
if (args.koncept) lines.push('draft: true');
lines.push('---', '', 'Sem napíšte text príspevku.', '');

fs.writeFileSync(target, lines.join('\n'), 'utf8');
console.log(`Vytvorené: ${target}`);
