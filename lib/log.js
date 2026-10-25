// =============================================================================
// lib/log.js  –  v0.2.0
// Jednoduché logovanie buildu: do konzoly + do súborov v priečinku logs/.
//   logs/latest.log              – posledný build (vždy prepísaný)
//   logs/build-RRRRMMDD-HHMMSS.log – archív buildov (uchováva sa posledných 20)
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = path.resolve('logs');
const KEEP_LAST = 20;

const state = { startedAt: Date.now(), lines: [], warnings: 0, errors: 0 };

function push(level, message) {
  state.lines.push(`${new Date().toISOString()} [${level}] ${message}`);
}

export const log = {
  info(message) {
    push('INFO', message);
  },
  warn(message) {
    state.warnings += 1;
    console.warn(`[web] POZOR: ${message}`);
    push('WARN', message);
  },
  error(message) {
    state.errors += 1;
    console.error(`[web] CHYBA: ${message}`);
    push('ERROR', message);
  },
  get warnings() {
    return state.warnings;
  },
  get errors() {
    return state.errors;
  },
};

/** Vynuluje stav pred každým novým buildom (dôležité pri `npm start`). */
export function resetLog() {
  state.startedAt = Date.now();
  state.lines = [];
  state.warnings = 0;
  state.errors = 0;
}

function stampForFile(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

function rotate() {
  const files = fs
    .readdirSync(LOG_DIR)
    .filter((f) => /^build-\d{8}-\d{6}\.log$/.test(f))
    .sort();
  const surplus = files.length - KEEP_LAST;
  for (let i = 0; i < surplus; i += 1) {
    fs.rmSync(path.join(LOG_DIR, files[i]), { force: true });
  }
}

/** Zapíše log buildu do súborov a vráti cestu k archívnej kópii. */
export function writeLog(extraLines = []) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const seconds = ((Date.now() - state.startedAt) / 1000).toFixed(2);
  const summary = [
    `--- Súhrn buildu: ${seconds} s, upozornení: ${state.warnings}, chýb: ${state.errors} ---`,
  ];
  const body = [...state.lines, ...extraLines, ...summary].join('\n') + '\n';
  const archive = path.join(LOG_DIR, `build-${stampForFile()}.log`);
  fs.writeFileSync(archive, body, 'utf8');
  fs.writeFileSync(path.join(LOG_DIR, 'latest.log'), body, 'utf8');
  rotate();
  return archive;
}

/** Pripojí riadky (napr. výsledok kontroly výstupu) k poslednému logu. */
export function appendToLatestLog(lines) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const text = lines.join('\n') + '\n';
  fs.appendFileSync(path.join(LOG_DIR, 'latest.log'), text, 'utf8');
  const newest = fs
    .readdirSync(LOG_DIR)
    .filter((f) => /^build-\d{8}-\d{6}\.log$/.test(f))
    .sort()
    .pop();
  if (newest) fs.appendFileSync(path.join(LOG_DIR, newest), text, 'utf8');
}
