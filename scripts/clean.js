// scripts/clean.js (v0.2.0) – zmaže priečinok _site pred novým buildom.
import fs from 'node:fs';

fs.rmSync('_site', { recursive: true, force: true });
console.log('[web] Priečinok _site vyčistený.');
