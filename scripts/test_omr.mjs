/*
 * Test regresyjny analizatora OMR — uruchamia PRAWDZIWY kod z
 * src/services/omrCore.ts na zdjęciach referencyjnych w scripts/fixtures/.
 *
 *   npm run test:omr
 *
 * Zestawy: idealny skan, zdjęcie z perspektywą/cieniem, zdjęcie do góry
 * nogami oraz „trudne” (ołówek, mocne niedoświetlenie, perspektywa 2.2%).
 * Wymagane 100% zgodności ilości i ID zastępu — każdy spadek to regresja.
 */
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'package.json'));

// 1. Zbuduj czysty rdzeń do CommonJS (bez zależności natywnych)
execSync(`npx tsc -p ${path.join(__dirname, 'tsconfig.omr-test.json')}`, {
  cwd: root,
  stdio: 'inherit',
});
const { analyzeOmr, rgbaToGray } = require(path.join(root, '.omr-test-build/services/omrCore.js'));
const jpeg = require('jpeg-js');

// 2. Przypadki testowe
const CASES = [
  ['scan_flat.jpg', 'expected.json', 'idealny skan'],
  ['scan_photo.jpg', 'expected.json', 'zdjęcie (perspektywa + cień)'],
  ['scan_flip.jpg', 'expected.json', 'zdjęcie do góry nogami'],
  ['scan_hard.jpg', 'expected_hard.json', 'trudne (ołówek, niedoświetlenie)'],
];

let failures = 0;
for (const [file, expFile, label] of CASES) {
  const raw = jpeg.decode(readFileSync(path.join(__dirname, 'fixtures', file)), {
    useTArray: true,
    maxMemoryUsageInMB: 256,
  });
  const expected = JSON.parse(readFileSync(path.join(__dirname, 'fixtures', expFile), 'utf8'));
  const gray = rgbaToGray(raw.data, raw.width, raw.height);
  const t0 = Date.now();
  let res;
  try {
    res = analyzeOmr(gray);
  } catch (e) {
    console.error(`✗ ${file} (${label}): WYJĄTEK — ${e.message}`);
    failures++;
    continue;
  }
  const ms = Date.now() - t0;
  const misses = [];
  res.items.forEach((it, i) => {
    if (it.quantity !== expected.items[i].quantity) {
      misses.push(`    ${it.itemId}: odczyt ${it.quantity}, oczekiwano ${expected.items[i].quantity}`);
    }
  });
  const squadOk = res.squadId === expected.squadId;
  const ok = misses.length === 0 && squadOk;
  console.log(
    `${ok ? '✓' : '✗'} ${file} (${label}): zastęp ${res.squadId}${squadOk ? '' : ` ≠ ${expected.squadId}`}, ` +
      `artykuły ${res.items.length - misses.length}/${res.items.length}, ${ms}ms`
  );
  misses.slice(0, 10).forEach((m) => console.log(m));
  if (!ok) failures++;
}

if (failures) {
  console.error(`\n${failures} przypadków NIE przeszło.`);
  process.exit(1);
}
console.log('\nWszystkie przypadki OK.');
