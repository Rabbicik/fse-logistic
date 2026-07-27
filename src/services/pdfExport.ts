import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LIST_ITEMS, CATEGORIES, ID_DOT_COUNT } from '../constants/listTemplate';

const CHECKBOXES_PER_ROW = 5;
const COPIES = 3;

/*
 * Generuje jeden kwadracik □ jako element HTML
 */
function checkbox(): string {
  return `<span class="cb"></span>`;
}

/*
 * Generuje wiersz kwadracików o podanej liczbie
 */
function checkboxRow(count: number): string {
  return Array.from({ length: count }, () => checkbox()).join('');
}

/*
 * Generuje HTML jednej kopii listy zaopatrzenia
 */
function generateSingleListHtml(): string {
  const categoryBlocks = CATEGORIES.map((cat) => {
    const items = LIST_ITEMS.filter((li) => li.category === cat);
    if (items.length === 0) return '';

    const rows = items
      .map(
        (item) => `
        <tr class="item-row">
          <td class="item-name">${item.name}</td>
          <td class="item-boxes">
            ${checkboxRow(CHECKBOXES_PER_ROW)}
            ${checkboxRow(CHECKBOXES_PER_ROW)}
            ${checkboxRow(CHECKBOXES_PER_ROW)}
          </td>
          <td class="item-unit">/ ${item.unit}</td>
        </tr>`
      )
      .join('');

    return `
      <tr class="cat-header">
        <td colspan="3">${cat.toUpperCase()}</td>
      </tr>
      ${rows}`;
  }).join('');

  const idBoxes = checkboxRow(ID_DOT_COUNT);

  return `
    <div class="list-copy">
      <div class="list-header">
        <span class="brand">FSE Logistic</span>
        <span class="list-title">Lista Zaopatrzenia</span>
      </div>

      <div class="squad-row">
        <span class="squad-label">Zastęp</span>
        <span class="squad-boxes">${idBoxes}</span>
      </div>

      <table>
        <colgroup>
          <col class="col-name" />
          <col class="col-boxes" />
          <col class="col-unit" />
        </colgroup>
        <thead>
          <tr class="table-head">
            <th>Produkt</th>
            <th>
              <span class="head-row">Ilość (1 kw. =)</span>
            </th>
            <th>Jednostka</th>
          </tr>
        </thead>
        <tbody>
          ${categoryBlocks}
        </tbody>
      </table>

      <div class="footer-note">
        Zamaluj długopisem kwadraciki ■ · Skanuj w FSE Logistic
      </div>
    </div>`;
}

/*
 * Generuje pełny HTML dokumentu PDF z ${COPIES} kopiami listy
 * Każda kopia na osobnej stronie (page-break-after)
 */
function generateFullHtml(): string {
  const copies = Array.from({ length: COPIES }, (_, i) => {
    const isLast = i === COPIES - 1;
    return `<div class="page${isLast ? '' : ' page-break'}">${generateSingleListHtml()}</div>`;
  }).join('\n');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>FSE Logistic – Lista Zaopatrzenia</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #111;
      background: #fff;
    }

    .page {
      width: 100%;
    }

    .page-break {
      page-break-after: always;
    }

    /* ── Kwadracik ── */
    .cb {
      display: inline-block;
      width: 4.5mm;
      height: 4.5mm;
      border: 1.2px solid #222;
      margin: 0 0.5mm;
      vertical-align: middle;
      background: #fff;
    }

    /* ── Nagłówek kopii ── */
    .list-copy {
      padding: 0;
    }

    .list-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 2px solid #111;
      padding-bottom: 3mm;
      margin-bottom: 4mm;
    }

    .brand {
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: -0.5pt;
    }

    .list-title {
      font-size: 10pt;
      font-weight: 600;
      color: #444;
    }

    /* ── Wiersz ID zastępu ── */
    .squad-row {
      display: flex;
      align-items: center;
      gap: 4mm;
      margin-bottom: 5mm;
      padding: 2.5mm 3mm;
      border: 1.2px solid #ddd;
      border-radius: 2mm;
      background: #fafafa;
    }

    .squad-label {
      font-size: 10pt;
      font-weight: 700;
      min-width: 14mm;
      color: #111;
    }

    .squad-boxes .cb {
      width: 5mm;
      height: 5mm;
      margin: 0 0.8mm;
    }

    /* ── Tabela produktów ── */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    .col-name  { width: 38%; }
    .col-boxes { width: 47%; }
    .col-unit  { width: 15%; }

    .table-head th {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8pt;
      color: #555;
      padding: 2mm 2mm 1.5mm;
      border-bottom: 1px solid #bbb;
      text-align: left;
    }

    /* ── Nagłówek kategorii ── */
    .cat-header td {
      padding: 2.5mm 2mm 1mm;
      font-size: 8pt;
      font-weight: 800;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 1.2pt;
      border-top: 1px solid #ddd;
      background: #f5f5f5;
    }

    /* ── Wiersz produktu ── */
    .item-row {
      border-bottom: 0.5px solid #e8e8e8;
    }

    .item-name {
      padding: 2.5mm 2mm;
      font-size: 9pt;
      vertical-align: middle;
      color: #111;
    }

    .item-boxes {
      padding: 2mm 2mm;
      white-space: nowrap;
      vertical-align: middle;
    }

    .item-boxes .cb {
      width: 4mm;
      height: 4mm;
      margin: 0 0.4mm;
    }

    /* ── 3 rzędy kwadracików: oddzielone małym odstępem ── */
    .item-boxes .cb:nth-child(5n+1):not(:first-child) {
      margin-left: 2mm;
    }

    .item-unit {
      padding: 2mm 1mm;
      font-size: 8pt;
      color: #555;
      vertical-align: middle;
      white-space: nowrap;
    }

    /* ── Stopka ── */
    .footer-note {
      margin-top: 4mm;
      font-size: 7pt;
      color: #999;
      text-align: center;
      border-top: 0.5px solid #e0e0e0;
      padding-top: 2mm;
    }
  </style>
</head>
<body>
  ${copies}
</body>
</html>`;
}

/*
 * Eksportuje wzór listy do PDF (3 kopie) i otwiera dialog udostępniania
 */
export async function exportListTemplatePdf(): Promise<void> {
  const html = generateFullHtml();

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Pobierz wzór listy FSE',
      UTI: 'com.adobe.pdf',
    });
  }
}
