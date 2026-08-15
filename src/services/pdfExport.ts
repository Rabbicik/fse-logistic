import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  LIST_ITEMS,
  CATEGORIES,
  CATEGORIES_FR,
  ITEM_TRANSLATIONS_FR,
} from '../constants/listTemplate';

const COPIES = 1;

function checkbox(num: number, extraClass = ''): string {
  return `<span class="cb ${extraClass}">${num}</span>`;
}

function checkboxRow(count: number, extraClass = ''): string {
  return Array.from({ length: count }, (_, i) => checkbox(i + 1, extraClass)).join('');
}

function renderColumn(colIndex: 1 | 2 | 3, lang: 'pl' | 'fr' = 'pl'): string {
  const colCats = CATEGORIES.filter((cat) =>
    LIST_ITEMS.some((li) => li.category === cat && li.column === colIndex)
  );

  return colCats
    .map((cat) => {
      const items = LIST_ITEMS.filter((li) => li.category === cat && li.column === colIndex);
      const catDisplayName = lang === 'fr' ? (CATEGORIES_FR[cat] || cat) : cat;

      const rows = items
        .map((item) => {
          const maxDots = item.maxDots || 5;
          const itemName = lang === 'fr' ? (ITEM_TRANSLATIONS_FR[item.id]?.name || item.name) : item.name;
          const itemUnit = lang === 'fr' ? (ITEM_TRANSLATIONS_FR[item.id]?.unit || item.unit) : item.unit;

          return `
        <div class="item">
          <div class="item-left"><span class="timing-mark"></span><span class="item-name">${itemName}</span></div>
          <div class="item-right">
            <div class="boxes">${checkboxRow(maxDots)}</div>
            <span class="unit">/ ${itemUnit}</span>
          </div>
        </div>`;
        })
        .join('');

      return `
        <div class="cat">
          <span class="cat-name"><span class="timing-mark"></span>${catDisplayName}</span>
        </div>
        ${rows}`;
    })
    .join('');
}

function generateSingleListHtml(lang: 'pl' | 'fr' = 'pl'): string {
  const isFr = lang === 'fr';

  const squadLabel = isFr ? 'ID PATROUILLE :' : 'ID ZASTĘPU:';
  const noteLabel = isFr
    ? 'Cochez le code de votre patrouille (ex. Patrouille 5 = bulles 1 et 3)'
    : 'Zamaluj kod swojego zastępu (np. Zastęp 5 = kółko 1 i 3)';

  const bubblesHtml = Array.from({ length: 4 }, (_, i) => `<span class="squad-bubble">${i + 1}</span>`).join('');

  const footerFill = isFr
    ? 'Remplir les bulles <strong>●</strong> au stylo'
    : 'Wypełnij kółka <strong>●</strong> długopisem';
  const footerUnit = isFr ? '1 bulle = 1 unité' : '1 kółko = 1 jednostka';
  const footerScan = isFr ? 'Scanner via <strong>FSE Logistic</strong>' : 'Skanuj przez <strong>FSE Logistic</strong>';

  return `
  <div class="list-page">
    <div class="squad-row">
      <span class="squad-label">${squadLabel}</span>
      <div class="squad-bubbles">
        ${bubblesHtml}
      </div>
      <span class="squad-note">${noteLabel}</span>
    </div>

    <div class="columns">
      <div class="col">${renderColumn(1, lang)}</div>
      <div class="col">${renderColumn(2, lang)}</div>
      <div class="col">${renderColumn(3, lang)}</div>
    </div>

    <div class="footer">
      <span>${footerFill}</span>
      <span>&bull;</span>
      <span>${footerUnit}</span>
      <span>&bull;</span>
      <span>${footerScan}</span>
    </div>
  </div>`;
}

export function generateFullHtml(lang: 'pl' | 'fr' = 'pl'): string {
  const isFr = lang === 'fr';
  const docTitle = isFr ? 'FSE Logistic – Feuille de Ravitaillement' : 'FSE Logistic – Lista Zaopatrzenia';

  const copies = Array.from({ length: COPIES }, (_, i) => {
    const isLast = i === COPIES - 1;
    return `<div class="page${isLast ? '' : ' page-break'}">${generateSingleListHtml(lang)}</div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${docTitle}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 7.8pt;
      color: #0f172a;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .page { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
    .page-break { page-break-after: always; }

    .list-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      background: #fff;
      padding: 8mm 10mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .squad-row {
      display: flex;
      align-items: center;
      height: 8.5mm;
      margin-bottom: 2.5mm;
      padding: 0 4mm;
      border: 1.2px solid #94a3b8;
      border-radius: 1.5mm;
      background: #f8fafc;
    }
    .squad-label { font-size: 8.5pt; font-weight: 800; color: #0f172a; margin-right: 4mm; }
    .squad-bubbles { display: flex; align-items: center; gap: 2.2mm; }
    .squad-bubble {
      width: 5.0mm;
      height: 5.0mm;
      border: 0.8px solid #475569;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6.5pt;
      font-weight: 800;
      color: #334155;
    }
    .squad-note { font-size: 6.8pt; color: #64748b; margin-left: auto; font-style: italic; font-weight: 600; }

    .columns {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0 3mm;
    }
    .col {
      display: flex;
      flex-direction: column;
    }

    .timing-mark {
      width: 2.2mm;
      height: 2.0mm;
      background: #000;
      border-radius: 0.2mm;
      margin-right: 1.2mm;
      flex-shrink: 0;
    }

    .cat {
      height: 7.6mm;
      font-size: 7.2pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      background: #e2e8f0;
      border-top: 1px solid #94a3b8;
      border-bottom: 1px solid #94a3b8;
      padding: 0 1mm;
      display: flex;
      align-items: center;
    }
    .cat-name { display: flex; align-items: center; flex: 1; overflow: hidden; white-space: nowrap; }

    .item {
      height: 7.6mm;
      border-bottom: 0.4px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.2mm;
    }
    .item-left { display: flex; align-items: center; flex: 1; min-width: 0; padding-right: 0.5mm; }
    .item-name {
      font-size: 7.0pt;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-right { display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0; }
    .boxes { display: flex; align-items: center; gap: 0.5mm; }

    .cb {
      width: 4.9mm;
      height: 4.9mm;
      border: 0.6px solid #888;
      border-radius: 50%;
      background: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 6.2pt;
      font-weight: 700;
      color: #777;
    }
    .unit {
      font-size: 5.8pt;
      font-weight: 600;
      color: #475569;
      margin-left: 0.8mm;
      width: 7.6mm;
      text-align: left;
      white-space: nowrap;
    }

    .footer {
      height: 5mm;
      margin-top: 2mm;
      font-size: 6.8pt;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3mm;
    }
    .footer strong { color: #0f172a; }
  </style>
</head>
<body>
  ${copies}
</body>
</html>`;
}

export async function exportListTemplatePdf(lang: 'pl' | 'fr' = 'pl'): Promise<void> {
  const html = generateFullHtml(lang);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: lang === 'fr' ? 'Télécharger la liste FSE' : 'Pobierz wzór listy FSE',
      UTI: 'com.adobe.pdf',
    });
  }
}
