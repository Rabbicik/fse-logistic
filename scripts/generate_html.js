const fs = require('fs');
const path = require('path');

function slugify(text) {
  const pl = { 'ą':'a', 'ć':'c', 'ę':'e', 'ł':'l', 'ń':'n', 'ó':'o', 'ś':'s', 'ź':'z', 'ż':'z' };
  return text.toLowerCase().replace(/[ąćęłńóśźż]/g, match => pl[match]).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const rawData = [
  { cat: 'Owoce', items: [
    { n: 'Jabłka', u: '2 szt.' }, { n: 'Banany', u: '2 szt.' }, { n: 'Nektarynka', u: '2 szt.' }, { n: 'Arbuz', u: '1 kg' }
  ]},
  { cat: 'Warzywa', items: [
    { n: 'Ziemniaki', u: '500 g' }, { n: 'Cebula', u: '1 szt.' }, { n: 'Marchew', u: '2 szt.' }, { n: 'Pietruszka', u: '1 szt.' },
    { n: 'Pomidory', u: '2 szt.' }, { n: 'Ogórki', u: '2 szt.' }, { n: 'Papryka', u: '1 szt.' }, { n: 'Czosnek', u: '1 gł.' },
    { n: 'Sałata mix', u: '1 op.' }, { n: 'Sałata (główka)', u: '1 szt.' }, { n: 'Pieczarki', u: '250 g' }, { n: 'Brokuły', u: '1 szt.' }
  ]},
  { cat: 'Pieczywo', items: [
    { n: 'Chleb', u: '1 szt.' }, { n: 'Chleb tostowy', u: '1 op.' }, { n: 'Bułki', u: '4 szt.' }, { n: 'Tortilla', u: '1 op.' }
  ]},
  { cat: 'Mięso', items: [
    { n: 'Pierś z kurczaka', u: '400 g' }, { n: 'Mięso mielone', u: '400 g' }, { n: 'Schab', u: '400 g' },
    { n: 'Udka z kurczaka', u: '2 szt.' }, { n: 'Skrzydełka z kurczaka', u: '500 g' }, { n: 'Wątróbka', u: '400 g' }, { n: 'Boczek', u: '200 g' }
  ]},
  { cat: 'Wędliny', items: [
    { n: 'Parówki', u: '4 szt.' }, { n: 'Szynka', u: '150 g' }, { n: 'Kiełbasa', u: '2 szt.' }
  ]},
  { cat: 'Nabiał', items: [
    { n: 'Mleko', u: '1 L' }, { n: 'Masło', u: '1 szt.' }, { n: 'Jajka', u: '4 szt.' },
    { n: 'Ser żółty (plasterki)', u: '150 g' }, { n: 'Ser żółty (kostka)', u: '250 g' }, { n: 'Twaróg', u: '250 g' },
    { n: 'Śmietana 18%', u: '1 op.' }, { n: 'Śmietanka 30%', u: '1 op.' }, { n: 'Jogurt naturalny', u: '1 op.' },
    { n: 'Serek wiejski', u: '1 op.' }, { n: 'Jogurt smakowe', u: '2 szt.' }
  ]},
  { cat: 'Produkty sypkie', items: [
    { n: 'Mąka pszenna', u: '1 kg' }, { n: 'Cukier', u: '1 kg' }, { n: 'Makaron świderki', u: '500 g' },
    { n: 'Makaron spaghetti', u: '500 g' }, { n: 'Ryż', u: '400 g' }, { n: 'Kasza gryczana', u: '400 g' },
    { n: 'Kasza jęczmienna', u: '400 g' }, { n: 'Płatki owsiane', u: '500 g' }, { n: 'Płatki na mleko', u: '500 g' },
    { n: 'Bułka tarta', u: '500 g' }, { n: 'Olej', u: '1 L' }
  ]},
  { cat: 'Konserwy', items: [
    { n: 'Passata', u: '500 g' }, { n: 'Groszek', u: '1 op.' }, { n: 'Kukurydza', u: '1 op.' },
    { n: 'Tuńczyk', u: '1 op.' }, { n: 'Fasola', u: '1 op.' }
  ]},
  { cat: 'Sosy', items: [
    { n: 'Ketchup', u: '1 szt.' }, { n: 'Majonez', u: '1 szt.' }, { n: 'Musztarda', u: '1 szt.' }
  ]},
  { cat: 'Przyprawy', items: [
    { n: 'Sól', u: '1 op.' }, { n: 'Pieprz', u: '1 op.' }, { n: 'Papryka słodka', u: '1 op.' },
    { n: 'Papryka ostra', u: '1 op.' }, { n: 'Czosnek granulowany', u: '1 op.' }, { n: 'Zioła prowansalskie', u: '1 op.' },
    { n: 'Oregano', u: '1 op.' }, { n: 'Przyprawa do kurczaka', u: '1 op.' }
  ]}
];

const items = [];
let col = 1;
for (const group of rawData) {
  if (group.cat === 'Mięso') col = 2;
  if (group.cat === 'Produkty sypkie') col = 3;
  
  for (const item of group.items) {
    items.push({
      id: slugify(item.n),
      name: item.n.charAt(0).toUpperCase() + item.n.slice(1),
      unit: item.u,
      cat: group.cat,
      col: col
    });
  }
}

const PAGE_W = 190;
const PAGE_H = 277;
const PAD_X = 8;
const PAD_Y = 12;

const HDR_H = 12;
const HDR_MB = 6;
const SQUAD_H = 14;
const SQUAD_MB = 6;
const COL_GAP = 5;
const COL_W = (PAGE_W - 2 * PAD_X - 2 * COL_GAP) / 3;

const ITEM_H = 6.2;
const CAT_H = 5.5;
const CAT_MT = 2.5;

function generateColumn(colNum) {
  let html = `<div class="col">\n`;
  const colItems = items.filter(i => i.col === colNum);
  let prevCat = '';

  for (const item of colItems) {
    if (item.cat !== prevCat) {
      const mt = prevCat === '' ? 'style="margin-top: 0"' : '';
      html += `      <div class="cat" ${mt}>${item.cat}</div>\n`;
      prevCat = item.cat;
    }
    html += `      <div class="item">
        <span class="item-name"><span class="item-marker"></span>${item.name}</span>
        <div class="item-right">
          <div class="boxes"><span class="cb"></span><span class="cb"></span><span class="cb"></span><span class="cb"></span><span class="cb"></span></div>
          <span class="unit">/ ${item.unit}</span>
        </div>
      </div>\n`;
  }
  html += `    </div>`;
  return html;
}

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>FSE Logistic – Lista Zaopatrzenia</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      color: #111;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .list-page {
      position: relative;
      width: ${PAGE_W}mm;
      height: ${PAGE_H}mm;
      background: #fff;
    }

    .anchor {
      position: absolute;
      width: 7mm;
      height: 7mm;
      background: #000;
      z-index: 10;
    }
    .anchor.tl { top: 0; left: 0; }
    .anchor.tr { top: 0; right: 0; }
    .anchor.bl { bottom: 0; left: 0; }
    .anchor.br { bottom: 0; right: 0; }

    .list-content {
      padding: ${PAD_Y}mm ${PAD_X}mm;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      height: ${HDR_H}mm;
      margin-bottom: ${HDR_MB}mm;
      border-bottom: 2px solid #111;
    }
    .brand { font-size: 16pt; font-weight: 900; letter-spacing: -0.5pt; }
    .subtitle { font-size: 10pt; font-weight: 600; color: #444; }

    .squad-row {
      display: flex;
      align-items: center;
      height: ${SQUAD_H}mm;
      margin-bottom: ${SQUAD_MB}mm;
      padding: 0 4mm;
      border: 1.5px solid #aaa;
      border-radius: 1.5mm;
      background: #f5f5f5;
    }
    .squad-label { font-size: 10pt; font-weight: 800; width: 18mm; }
    .squad-note { font-size: 7pt; color: #777; margin-left: auto; font-style: italic; }

    .cb {
      display: inline-block;
      width: 3.5mm;
      height: 3.5mm;
      border: 1px solid #333;
      margin-right: 0.5mm;
      vertical-align: middle;
      background: #fff;
    }
    .cb:last-child { margin-right: 0; }
    
    .cb-lg {
      width: 6mm;
      height: 6mm;
      margin-right: 1.5mm;
      border-width: 1.5px;
    }

    .columns {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0 ${COL_GAP}mm;
    }
    .col { border-right: 0.5px dotted #ccc; padding-right: 2.5mm; }
    .col:last-child { border-right: none; padding-right: 0; }

    .cat {
      height: ${CAT_H}mm;
      margin-top: ${CAT_MT}mm;
      font-size: 7pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #222;
      background: #eaeaea;
      padding: 0.5mm 1.5mm;
      border-radius: 0.8mm;
      display: flex;
      align-items: center;
    }

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: ${ITEM_H}mm;
      border-bottom: 0.5px solid #eee;
    }
    .item-marker {
      display: inline-block;
      width: 1.8mm;
      height: 1.8mm;
      background: #000;
      margin-right: 1.2mm;
      vertical-align: middle;
    }
    .item-name { font-size: 7pt; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 0.5mm; display: flex; align-items: center; }
    .item-right { display: flex; align-items: center; width: 28mm; justify-content: flex-end; }
    .boxes { display: flex; align-items: center; }
    .unit { font-size: 5pt; color: #666; margin-left: 1mm; width: 6.5mm; text-align: left; white-space: nowrap; }

    .footer {
      margin-top: 4mm;
      padding-top: 2mm;
      font-size: 7.5pt;
      color: #999;
      text-align: center;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="list-page">
    <div class="anchor tl"></div>
    <div class="anchor tr"></div>
    <div class="anchor bl"></div>
    <div class="anchor br"></div>
    
    <div class="list-content">
      <div class="page-header">
        <span class="brand">FSE Logistic</span>
        <span class="subtitle">Lista Zaopatrzenia</span>
      </div>

      <div class="squad-row">
        <span class="squad-label">Zastęp</span>
        <span class="cb cb-lg"></span><span class="cb cb-lg"></span><span class="cb cb-lg"></span>
        <span class="cb cb-lg"></span><span class="cb cb-lg"></span><span class="cb cb-lg"></span>
        <span class="cb cb-lg"></span><span class="cb cb-lg"></span><span class="cb cb-lg"></span>
        <span class="cb cb-lg"></span>
        <span class="squad-note">zamaluj kwadraciki = nr (binarnie)</span>
      </div>

      <div class="columns">
        ${generateColumn(1)}
        ${generateColumn(2)}
        ${generateColumn(3)}
      </div>

      <div class="footer">
        1 kratka = 1 jednostka (z reguły porcja dla 2 os.) &nbsp;·&nbsp; Skanuj przez FSE Logistic
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.resolve(__dirname, '../lista_zaopatrzenia.html'), html);
console.log('lista_zaopatrzenia.html generated.');

const tsTemplate = `import { ListItem } from '../types';

export const CATEGORIES = [
${rawData.map(g => "  '" + g.cat + "',").join('\n')}
];

export const LIST_ITEMS: ListItem[] = [
${items.map((item, idx) => {
  const colItems = items.filter(i => i.col === item.col);
  const colIndex = colItems.findIndex(i => i.id === item.id);
  return `  { id: '${item.id}', name: '${item.name}', category: '${item.cat}', rowIndex: ${idx}, maxDots: 5, unit: '${item.unit}', column: ${item.col}, colRow: ${colIndex} },`;
}).join('\n')}
];
`;
fs.writeFileSync(path.resolve(__dirname, '../src/constants/listTemplate.ts'), tsTemplate);
console.log('listTemplate.ts updated.');

// --- GENERATE LAYOUT COORDINATES FOR imageAnalysis.ts ---
const idCbStart = PAD_X + 4 + 18; 
const idCbStep = 6 + 1.5; 
const idCbX = Array.from({length: 10}, (_, i) => parseFloat(((idCbStart + 3 + i * idCbStep) / PAGE_W).toFixed(3)));
const idCbY = parseFloat(((PAD_Y + HDR_H + HDR_MB + SQUAD_H / 2) / PAGE_H).toFixed(3));

const markerX = [
  parseFloat(((PAD_X + 0.5 + 0.9) / PAGE_W).toFixed(3)), 
  parseFloat(((PAD_X + COL_W + COL_GAP + 0.5 + 0.9) / PAGE_W).toFixed(3)),
  parseFloat(((PAD_X + 2*(COL_W + COL_GAP) + 0.5 + 0.9) / PAGE_W).toFixed(3))
];

const itemCbStart = COL_W - 28; 
const itemCbStep = 3.5 + 0.5; 
const itemCbX_col1 = Array.from({length: 5}, (_, i) => parseFloat(((PAD_X + itemCbStart + 1.75 + i * itemCbStep) / PAGE_W).toFixed(3)));
const itemCbX_col2 = Array.from({length: 5}, (_, i) => parseFloat(((PAD_X + COL_W + COL_GAP + itemCbStart + 1.75 + i * itemCbStep) / PAGE_W).toFixed(3)));
const itemCbX_col3 = Array.from({length: 5}, (_, i) => parseFloat(((PAD_X + 2*(COL_W + COL_GAP) + itemCbStart + 1.75 + i * itemCbStep) / PAGE_W).toFixed(3)));

const contentStartY = parseFloat(((PAD_Y + HDR_H + HDR_MB + SQUAD_H + SQUAD_MB) / PAGE_H).toFixed(3));
const itemH = parseFloat((ITEM_H / PAGE_H).toFixed(3));

const tsCode = "const LAYOUT = {\n" +
  "  contentStartY: " + contentStartY + ",\n\n" +
  "  idCheckboxX: [" + idCbX.join(', ') + "],\n" +
  "  idCheckboxY: " + idCbY + ",\n\n" +
  "  markerX: [" + markerX.join(', ') + "],\n\n" +
  "  columns: [\n" +
  "    { checkboxX: [" + itemCbX_col1.join(', ') + "] },\n" +
  "    { checkboxX: [" + itemCbX_col2.join(', ') + "] },\n" +
  "    { checkboxX: [" + itemCbX_col3.join(', ') + "] },\n" +
  "  ] as const,\n\n" +
  "  itemH: " + itemH + ",\n" +
  "};";

console.log('\nReplace LAYOUT in imageAnalysis.ts with:\n');
console.log(tsCode);
