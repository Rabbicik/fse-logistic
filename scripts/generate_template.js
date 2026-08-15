/*
 * JEDYNE ŹRÓDŁO PRAWDY geometrii OMR (v3).
 *
 * Ten skrypt generuje z tych samych stałych:
 *   1. lista_zaopatrzenia.html / lista_zaopatrzenia_fr.html  (szablony do druku)
 *   2. src/constants/omrGeometry.gen.ts                       (współrzędne dla analizatora)
 *   3. src/services/templateHtml.gen.ts                       (HTML dla expo-print w aplikacji)
 *
 * Każdy element istotny dla OMR (znaczniki narożne, kółka, paski taktujące)
 * jest pozycjonowany ABSOLUTNIE w mm — układ nie zależy od fontów ani od
 * zawartości tekstu, więc wydruk z Chrome, iOS i Androida ma identyczną
 * geometrię. NIE edytuj plików *.gen.ts ani HTML ręcznie — uruchom:
 *
 *   node scripts/generate_template.js
 */
const fs = require('fs');
const path = require('path');

const DATA = require('../src/constants/listItems.json');

// ---------------------------------------------------------------------------
// GEOMETRIA (mm)
// ---------------------------------------------------------------------------
const G = {
  PAGE_W: 210,
  PAGE_H: 297,

  // Znaczniki narożne (fiducials) — pełne czarne kwadraty.
  FID_SIDE: 6,
  FID_CENTERS: [
    [8, 8],       // TL
    [202, 8],     // TR
    [8, 289],     // BL
    [202, 289],   // BR
  ],

  // Nagłówek strony (czysto wizualny)
  HEADER_Y: 5.5,
  HEADER_H: 7,

  // Wiersz ID zastępu (kod binarny 1,2,4,8)
  SQUAD_BOX: { x: 14, y: 14, w: 182, h: 9 },
  SQUAD_BUBBLE_R: 2.5,
  SQUAD_BUBBLE_Y: 18.5,
  SQUAD_BUBBLE_X: [48, 57, 66, 75],

  // Siatka kolumn
  COL_LEFT: [8, 73.667, 139.333],
  COL_RIGHT: [70.667, 136.333, 202],

  // Wiersze (sloty): kategoria zajmuje 1 slot, każdy artykuł 1 slot
  ROW_START_Y: 27,   // górna krawędź slotu 0
  ROW_PITCH: 7.6,

  // Kółka odpowiedzi
  CB_R: 2.45,
  CB_PITCH: 5.6,
  CB_LAST_FROM_RIGHT: 11.95, // środek ostatniego (5.) kółka od prawej krawędzi kolumny

  // Pasek taktujący (timing mark)
  TIMING_W: 2.2,
  TIMING_H: 2.0,
  TIMING_FROM_LEFT: 1.7, // środek znacznika od lewej krawędzi kolumny

  FOOTER_Y: 268,
};

// Odległości środków 5 kółek od prawej krawędzi kolumny (kółko 1 -> 5)
const CB_FROM_RIGHT = Array.from({ length: 5 }, (_, b) =>
  +(G.CB_LAST_FROM_RIGHT + (4 - b) * G.CB_PITCH).toFixed(3)
);

const slotCenter = (slotIdx) => +(G.ROW_START_Y + slotIdx * G.ROW_PITCH + G.ROW_PITCH / 2).toFixed(3);

// ---------------------------------------------------------------------------
// UKŁAD WIERSZY: kolumna -> [kategoria, artykuły...] wg listItems.json
// ---------------------------------------------------------------------------
function buildLayout() {
  const rows = [];      // { itemId, column, slotIdx, yMm, bubbleXMm[], timingXMm }
  const catRows = [];   // { name, column, slotIdx, yMm, timingXMm }
  for (let col = 1; col <= 3; col++) {
    const colCats = DATA.categories.filter((c) =>
      DATA.items.some((i) => i.category === c && i.column === col)
    );
    let slot = 0;
    for (const cat of colCats) {
      catRows.push({
        name: cat,
        column: col,
        slotIdx: slot,
        yMm: slotCenter(slot),
        timingXMm: +(G.COL_LEFT[col - 1] + G.TIMING_FROM_LEFT).toFixed(3),
      });
      slot += 1;
      for (const item of DATA.items.filter((i) => i.category === cat && i.column === col)) {
        rows.push({
          itemId: item.id,
          column: col,
          slotIdx: slot,
          yMm: slotCenter(slot),
          bubbleXMm: CB_FROM_RIGHT.map((d) => +(G.COL_RIGHT[col - 1] - d).toFixed(3)),
          timingXMm: +(G.COL_LEFT[col - 1] + G.TIMING_FROM_LEFT).toFixed(3),
        });
        slot += 1;
      }
    }
    const bottom = G.ROW_START_Y + slot * G.ROW_PITCH;
    if (bottom > G.FOOTER_Y - 2) {
      throw new Error(`Kolumna ${col} nie mieści się na stronie (koniec ${bottom}mm)`);
    }
  }
  return { rows, catRows };
}

const { rows: OMR_ROWS, catRows: CAT_ROWS } = buildLayout();

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
const mm = (v) => `${+v.toFixed(3)}mm`;

function abs(x, y, w, h, extra = '') {
  return `position:absolute;left:${mm(x)};top:${mm(y)};width:${mm(w)};height:${mm(h)};${extra}`;
}

function circle(cx, cy, r, extra = '') {
  return abs(cx - r, cy - r, 2 * r, 2 * r, `border-radius:50%;${extra}`);
}

function generateHtml(lang) {
  const isFr = lang === 'fr';
  const t = {
    title: isFr ? 'FSE Logistic – Feuille de Ravitaillement' : 'FSE Logistic – Lista Zaopatrzenia',
    subtitle: isFr ? 'Feuille de Ravitaillement' : 'Lista Zaopatrzenia',
    squadLabel: isFr ? 'ID ÉQUIPE:' : 'ID ZASTĘPU:',
    squadNote: isFr
      ? 'Noircis le code de ton équipe (ex. Équipe 5 = cercles 1 et 3)'
      : 'Zamaluj kod swojego zastępu (np. Zastęp 5 = kółko 1 i 3)',
    footer: isFr
      ? 'Remplis les cercles au stylo • 1 cercle = 1 unité • Scanne avec FSE Logistic'
      : 'Wypełnij kółka długopisem • 1 kółko = 1 jednostka • Skanuj przez FSE Logistic',
  };

  const el = [];

  // Znaczniki narożne
  for (const [cx, cy] of G.FID_CENTERS) {
    el.push(`<div style="${abs(cx - G.FID_SIDE / 2, cy - G.FID_SIDE / 2, G.FID_SIDE, G.FID_SIDE, 'background:#000;')}"></div>`);
  }

  // Nagłówek
  el.push(`<div style="${abs(16, G.HEADER_Y, 178, G.HEADER_H, 'display:flex;align-items:baseline;justify-content:space-between;border-bottom:0.5mm solid #0f172a;')}">` +
    `<span style="font-size:14pt;font-weight:900;letter-spacing:-0.5pt;">FSE Logistic</span>` +
    `<span style="font-size:9pt;font-weight:600;color:#475569;">${t.subtitle}</span></div>`);

  // Wiersz ID zastępu
  const sb = G.SQUAD_BOX;
  el.push(`<div style="${abs(sb.x, sb.y, sb.w, sb.h, 'border:1.2px solid #94a3b8;border-radius:1.5mm;background:#f8fafc;')}"></div>`);
  el.push(`<div style="${abs(sb.x + 4, sb.y, 26, sb.h, 'display:flex;align-items:center;font-size:8.5pt;font-weight:800;')}">${t.squadLabel}</div>`);
  G.SQUAD_BUBBLE_X.forEach((x, i) => {
    el.push(`<div style="${circle(x, G.SQUAD_BUBBLE_Y, G.SQUAD_BUBBLE_R, 'border:0.8px solid #475569;background:#fff;display:flex;align-items:center;justify-content:center;font-size:6pt;font-weight:700;color:#b6bcc6;')}">${i + 1}</div>`);
  });
  el.push(`<div style="${abs(sb.x + 78, sb.y, sb.w - 82, sb.h, 'display:flex;align-items:center;justify-content:flex-end;font-size:6.8pt;color:#64748b;font-style:italic;font-weight:600;')}">${t.squadNote}</div>`);

  // Kategorie
  for (const cr of CAT_ROWS) {
    const left = G.COL_LEFT[cr.column - 1];
    const right = G.COL_RIGHT[cr.column - 1];
    const top = cr.yMm - G.ROW_PITCH / 2;
    const name = isFr ? (DATA.categoriesFr[cr.name] || cr.name) : cr.name;
    el.push(`<div style="${abs(left, top + 0.4, right - left, G.ROW_PITCH - 0.8, 'background:#e2e8f0;border-top:1px solid #94a3b8;border-bottom:1px solid #94a3b8;')}"></div>`);
    // pasek taktujący w wierszu kategorii
    el.push(`<div style="${abs(cr.timingXMm - G.TIMING_W / 2, cr.yMm - G.TIMING_H / 2, G.TIMING_W, G.TIMING_H, 'background:#000;border-radius:0.2mm;')}"></div>`);
    el.push(`<div style="${abs(left + 4.5, top, right - left - 5, G.ROW_PITCH, 'display:flex;align-items:center;font-size:7.2pt;font-weight:900;text-transform:uppercase;color:#0f172a;white-space:nowrap;overflow:hidden;')}">${name}</div>`);
  }

  // Artykuły
  const itemById = Object.fromEntries(DATA.items.map((i) => [i.id, i]));
  for (const row of OMR_ROWS) {
    const item = itemById[row.itemId];
    const left = G.COL_LEFT[row.column - 1];
    const right = G.COL_RIGHT[row.column - 1];
    const top = row.yMm - G.ROW_PITCH / 2;
    const name = isFr ? item.nameFr : item.name;
    const unit = isFr ? item.unitFr : item.unit;
    const firstBubbleLeft = row.bubbleXMm[0] - G.CB_R;

    // delikatna linia oddzielająca (kończy się przed kółkami)
    el.push(`<div style="${abs(left, top + G.ROW_PITCH - 0.2, firstBubbleLeft - left - 1, 0.2, 'background:#e2e8f0;')}"></div>`);
    // pasek taktujący
    el.push(`<div style="${abs(row.timingXMm - G.TIMING_W / 2, row.yMm - G.TIMING_H / 2, G.TIMING_W, G.TIMING_H, 'background:#000;border-radius:0.2mm;')}"></div>`);
    // nazwa artykułu
    el.push(`<div style="${abs(left + 4.5, top, firstBubbleLeft - left - 5.5, G.ROW_PITCH, 'display:flex;align-items:center;font-size:7pt;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;')}">${name}</div>`);
    // kółka
    row.bubbleXMm.forEach((x, b) => {
      el.push(`<div style="${circle(x, row.yMm, G.CB_R, 'border:0.6px solid #888;background:#fff;display:flex;align-items:center;justify-content:center;font-size:5.5pt;font-weight:700;color:#c2c7cf;')}">${b + 1}</div>`);
    });
    // jednostka
    el.push(`<div style="${abs(right - 9.2, top, 9.2, G.ROW_PITCH, 'display:flex;align-items:center;font-size:5.6pt;font-weight:600;color:#475569;white-space:nowrap;overflow:hidden;')}">/ ${unit}</div>`);
  }

  // Stopka
  el.push(`<div style="${abs(16, G.FOOTER_Y, 178, 5, 'display:flex;align-items:center;justify-content:center;border-top:1px solid #cbd5e1;font-size:6.8pt;color:#64748b;')}">${t.footer}</div>`);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>${t.title}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 210mm; }
body {
  font-family: Arial, Helvetica, sans-serif;
  color: #0f172a;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.list-page { position: relative; width: 210mm; height: 297mm; background: #fff; overflow: hidden; page-break-after: avoid; }
</style>
</head>
<body>
<div class="list-page">
${el.join('\n')}
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// EMISJA PLIKÓW
// ---------------------------------------------------------------------------
const root = path.resolve(__dirname, '..');

const htmlPl = generateHtml('pl');
const htmlFr = generateHtml('fr');
fs.writeFileSync(path.join(root, 'lista_zaopatrzenia.html'), htmlPl);
fs.writeFileSync(path.join(root, 'lista_zaopatrzenia_fr.html'), htmlFr);

// omrGeometry.gen.ts — w pełni zmaterializowane współrzędne
const geomTs = `/*
 * AUTO-GENERATED by scripts/generate_template.js — NIE EDYTUJ RĘCZNIE.
 * Zmiany geometrii: edytuj scripts/generate_template.js i uruchom go ponownie.
 */

export const OMR_PAGE = { W_MM: ${G.PAGE_W}, H_MM: ${G.PAGE_H} } as const;

export const FIDUCIALS = {
  sideMm: ${G.FID_SIDE},
  /** TL, TR, BL, BR */
  centersMm: ${JSON.stringify(G.FID_CENTERS)} as ReadonlyArray<readonly [number, number]>,
} as const;

export const SQUAD_GEOM = {
  bubbleRadiusMm: ${G.SQUAD_BUBBLE_R},
  yMm: ${G.SQUAD_BUBBLE_Y},
  bubbleXMm: ${JSON.stringify(G.SQUAD_BUBBLE_X)},
} as const;

export const ITEM_GEOM = {
  bubbleRadiusMm: ${G.CB_R},
  bubblePitchMm: ${G.CB_PITCH},
  rowPitchMm: ${G.ROW_PITCH},
  timingWMm: ${G.TIMING_W},
  timingHMm: ${G.TIMING_H},
} as const;

export interface OmrRow {
  itemId: string;
  column: 1 | 2 | 3;
  yMm: number;
  bubbleXMm: number[];
  timingXMm: number;
}

export const OMR_ROWS: OmrRow[] = ${JSON.stringify(OMR_ROWS.map(({ slotIdx, ...r }) => r), null, 2)};

export const CATEGORY_ROWS: { name: string; column: 1 | 2 | 3; yMm: number; timingXMm: number }[] = ${JSON.stringify(CAT_ROWS.map(({ slotIdx, ...r }) => r), null, 2)};
`;
fs.writeFileSync(path.join(root, 'src/constants/omrGeometry.gen.ts'), geomTs);

// templateHtml.gen.ts — gotowy HTML dla expo-print w aplikacji
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const tmplTs = `/*
 * AUTO-GENERATED by scripts/generate_template.js — NIE EDYTUJ RĘCZNIE.
 * Ten sam HTML co lista_zaopatrzenia*.html w katalogu głównym repo.
 */

export const TEMPLATE_HTML_PL = \`${esc(htmlPl)}\`;

export const TEMPLATE_HTML_FR = \`${esc(htmlFr)}\`;
`;
fs.writeFileSync(path.join(root, 'src/services/templateHtml.gen.ts'), tmplTs);

console.log(`OK: ${OMR_ROWS.length} wierszy artykułów, ${CAT_ROWS.length} kategorii.`);
console.log('Wygenerowano: lista_zaopatrzenia.html, lista_zaopatrzenia_fr.html,');
console.log('              src/constants/omrGeometry.gen.ts, src/services/templateHtml.gen.ts');
