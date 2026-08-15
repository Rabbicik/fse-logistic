import * as ImageManipulator from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import * as base64js from 'base64-js';
import { ScannedItem, DebugData, Point, RowDebug, CheckboxDebug } from '../types';
import {
  OMR_GEOMETRY,
  CATEGORY_BLOCKS,
  CategoryBlock,
  computeQuantity,
  binaryDotsToNumber,
  numberToBinaryDots,
} from '../constants/listTemplate';

export interface AnalysisResult {
  squadId: number;
  squadDots: boolean[];
  items: ScannedItem[];
  debugData?: DebugData;
}

const ANALYSIS_W = 1600;

// ---------------------------------------------------------------------------
// POMOCNICZE FUNKCJE PIKSELI
// ---------------------------------------------------------------------------
function getLum(data: Uint8Array, px: number, py: number, imgW: number, imgH: number): number {
  const x = Math.max(0, Math.min(imgW - 1, Math.round(px)));
  const y = Math.max(0, Math.min(imgH - 1, Math.round(py)));
  const idx = (y * imgW + x) * 4;
  if (idx < 0 || idx + 2 >= data.length) return 255;
  return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
}

function avgRadius(data: Uint8Array, cx: number, cy: number, imgW: number, imgH: number, r: number): number {
  let sum = 0;
  let count = 0;
  const rInt = Math.max(1, Math.round(r));
  for (let dy = -rInt; dy <= rInt; dy++) {
    for (let dx = -rInt; dx <= rInt; dx++) {
      if (dx * dx + dy * dy <= rInt * rInt) {
        sum += getLum(data, cx + dx, cy + dy, imgW, imgH);
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 255;
}

// ---------------------------------------------------------------------------
// RZUTOWANIE WSPÓŁRZĘDNYCH MM DO PIKSELI PRZYCIĘTEGO DOKUMENTU A4
// ---------------------------------------------------------------------------
function mmToPixel(
  xMm: number,
  yMm: number,
  imgW: number,
  imgH: number
): Point {
  const normX = xMm / OMR_GEOMETRY.PAGE_W_MM;
  const normY = yMm / OMR_GEOMETRY.PAGE_H_MM;
  return {
    x: normX * imgW,
    y: normY * imgH,
  };
}

function analyzeSquadSubRegion(
  data: Uint8Array,
  W: number,
  H: number,
  pxPerMm: number
): { squadId: number; squadDots: boolean[]; debugCheckboxes: CheckboxDebug[] } {
  const squadYMm = OMR_GEOMETRY.SQUAD.ROW_Y_MM;
  const squadRadiusPx = OMR_GEOMETRY.SQUAD.BUBBLE_RADIUS_MM * pxPerMm;
  const squadDots: boolean[] = [];
  const debugCheckboxes: CheckboxDebug[] = [];

  // Próbkowanie lokalnego tła papieru w sekcji Zastępu
  const pRefLeft = mmToPixel(OMR_GEOMETRY.SQUAD.BUBBLES_X_MM[0] - 8, squadYMm, W, H);
  const pRefRight = mmToPixel(OMR_GEOMETRY.SQUAD.BUBBLES_X_MM[OMR_GEOMETRY.SQUAD.COUNT - 1] + 12, squadYMm, W, H);
  const localPaperBg = (
    avgRadius(data, pRefLeft.x, pRefLeft.y, W, H, 4) +
    avgRadius(data, pRefRight.x, pRefRight.y, W, H, 4)
  ) / 2;

  for (let i = 0; i < OMR_GEOMETRY.SQUAD.COUNT; i++) {
    const bubbleXMm = OMR_GEOMETRY.SQUAD.BUBBLES_X_MM[i];
    const pt = mmToPixel(bubbleXMm, squadYMm, W, H);
    const evalRes = evaluateBubbleWithBg(data, W, H, pt.x, pt.y, squadRadiusPx, localPaperBg);

    squadDots.push(evalRes.isMarked);

    debugCheckboxes.push({
      point: pt,
      isMarked: evalRes.isMarked,
      lum: evalRes.meanLum,
      bg: localPaperBg,
      bounds: { yMin: pt.y - squadRadiusPx, yMax: pt.y + squadRadiusPx },
    });
  }

  const detectedId = binaryDotsToNumber(squadDots);
  const squadId = detectedId > 0 && detectedId <= 15 ? detectedId : (detectedId > 0 ? detectedId : 1);

  return {
    squadId,
    squadDots,
    debugCheckboxes,
  };
}

// ---------------------------------------------------------------------------
// ETAP 2: DETEKCJA POCZĄTKU KATEGORII (CATEGORY HEADER LOCK)
// ---------------------------------------------------------------------------
function findCategoryHeaderY(
  data: Uint8Array,
  W: number,
  H: number,
  block: CategoryBlock,
  pxPerMm: number
): number {
  const colConfig = OMR_GEOMETRY.COLUMNS.COLS[block.colIndex];
  const nominalYMm = OMR_GEOMETRY.COLUMNS.ROW_START_Y_MM + block.startRowIdx * OMR_GEOMETRY.COLUMNS.ROW_H_MM;
  const nominalPt = mmToPixel(colConfig.timingX, nominalYMm, W, H);

  const searchRangePx = Math.round(OMR_GEOMETRY.COLUMNS.ROW_H_MM * 0.45 * pxPerMm);
  const startY = Math.max(0, Math.round(nominalPt.y - searchRangePx));
  const endY   = Math.min(H - 1, Math.round(nominalPt.y + searchRangePx));

  const trackHalfW = Math.max(1, Math.round(1.0 * pxPerMm));

  let minLum = 255;
  let bestY = nominalPt.y;

  for (let y = startY; y <= endY; y++) {
    let sum = 0;
    let n = 0;
    for (let dx = -trackHalfW; dx <= trackHalfW; dx++) {
      sum += getLum(data, nominalPt.x + dx, y, W, H);
      n++;
    }
    const avg = n > 0 ? sum / n : 255;
    if (avg < minLum) {
      minLum = avg;
      bestY = y;
    }
  }

  return minLum < 140 ? bestY : nominalPt.y;
}

// ---------------------------------------------------------------------------
// ETAP 3: SYNCHRONIZACJA WIERSZA Z PASKIEM TAKTUJĄCYM
// ---------------------------------------------------------------------------
function syncRowY(
  data: Uint8Array,
  W: number,
  H: number,
  expectedTimingPt: Point,
  pxPerMm: number
): { syncedY: number; timingCenter: Point } {
  const searchRangePx = Math.round(OMR_GEOMETRY.COLUMNS.ROW_H_MM * 0.45 * pxPerMm);
  const trackHalfW = Math.max(1, Math.round(1.0 * pxPerMm));

  let minLum = 255;
  let bestY = expectedTimingPt.y;

  const startY = Math.max(0, Math.round(expectedTimingPt.y - searchRangePx));
  const endY   = Math.min(H - 1, Math.round(expectedTimingPt.y + searchRangePx));

  for (let y = startY; y <= endY; y++) {
    let sum = 0;
    let n = 0;
    for (let dx = -trackHalfW; dx <= trackHalfW; dx++) {
      sum += getLum(data, expectedTimingPt.x + dx, y, W, H);
      n++;
    }
    const avg = n > 0 ? sum / n : 255;
    if (avg < minLum) {
      minLum = avg;
      bestY = y;
    }
  }

  const syncedY = minLum < 140 ? bestY : expectedTimingPt.y;
  return { syncedY, timingCenter: { x: expectedTimingPt.x, y: syncedY } };
}

// ---------------------------------------------------------------------------
// ETAP 4: EWALUACJA GĘSTOŚCI WYPEŁNIENIA KÓŁKA (FILL-RATIO %)
// ---------------------------------------------------------------------------
interface BubbleEvaluation {
  isMarked: boolean;
  fillRatio: number;
  meanLum: number;
}

function evaluateBubbleWithBg(
  data: Uint8Array,
  W: number,
  H: number,
  cx: number,
  cy: number,
  radiusPx: number,
  bgLum: number
): BubbleEvaluation {
  // Promień wewnętrzny 70% promienia kółka (omija szarą ramkę)
  const innerR = Math.max(2, Math.round(radiusPx * 0.70));
  const darkDeltaThreshold = 28;

  let darkPixels = 0;
  let totalPixels = 0;
  let sumLum = 0;

  for (let dy = -innerR; dy <= innerR; dy++) {
    for (let dx = -innerR; dx <= innerR; dx++) {
      if (dx * dx + dy * dy <= innerR * innerR) {
        const lum = getLum(data, cx + dx, cy + dy, W, H);
        sumLum += lum;
        totalPixels++;
        if (bgLum - lum > darkDeltaThreshold) {
          darkPixels++;
        }
      }
    }
  }

  const fillRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
  const meanLum = totalPixels > 0 ? sumLum / totalPixels : 255;

  const isMarked = fillRatio >= 0.38 || (bgLum - meanLum > 36 && fillRatio >= 0.25);

  return {
    isMarked,
    fillRatio,
    meanLum,
  };
}

// ---------------------------------------------------------------------------
// ETAP 5: ANALIZA WYIZOLOWANEGO BLOKU KATEGORII (ZOOM & ANALYZE)
// ---------------------------------------------------------------------------
function analyzeCategoryBlock(
  data: Uint8Array,
  W: number,
  H: number,
  block: CategoryBlock,
  pxPerMm: number
): { items: ScannedItem[]; rowDebugs: RowDebug[] } {
  const colConfig = OMR_GEOMETRY.COLUMNS.COLS[block.colIndex];
  const cbRadiusPx = OMR_GEOMETRY.COLUMNS.CB_RADIUS_MM * pxPerMm;

  // 1. Dokładny początek nagłówka kategorii
  const headerYPx = findCategoryHeaderY(data, W, H, block, pxPerMm);

  // 2. Próbkowanie lokalnego tła papieru w tym bloku
  const pBgLeft = mmToPixel(colConfig.leftMm + 4, 0, W, H);
  const localCategoryBg = avgRadius(data, pBgLeft.x, headerYPx + Math.round(8 * pxPerMm), W, H, 5);

  const scannedItems: ScannedItem[] = [];
  const rowDebugs: RowDebug[] = [];

  // 3. Skanowanie każdego wiersza produktu
  block.items.forEach((item, itemIdx) => {
    const rowOffsetMm = (itemIdx + 1) * OMR_GEOMETRY.COLUMNS.ROW_H_MM;
    const expectedYPx = headerYPx + rowOffsetMm * pxPerMm;

    const expectedTimingPt: Point = {
      x: mmToPixel(colConfig.timingX, 0, W, H).x,
      y: expectedYPx,
    };

    const { syncedY, timingCenter } = syncRowY(data, W, H, expectedTimingPt, pxPerMm);

    let markedCount = 0;
    const filled: boolean[] = [false, false, false, false, false];
    const debugCheckboxes: CheckboxDebug[] = [];

    for (let b = 0; b < (item.maxDots || 5); b++) {
      const cbFromRightMm = OMR_GEOMETRY.COLUMNS.CB_FROM_RIGHT_MM[b];
      const cbXMm = colConfig.rightMm - cbFromRightMm;
      const finalX = mmToPixel(cbXMm, 0, W, H).x;
      const finalY = syncedY;

      const evalRes = evaluateBubbleWithBg(data, W, H, finalX, finalY, cbRadiusPx, localCategoryBg);

      debugCheckboxes.push({
        point: { x: finalX, y: finalY },
        isMarked: evalRes.isMarked,
        lum: evalRes.meanLum,
        bg: localCategoryBg,
        bounds: { yMin: finalY - cbRadiusPx, yMax: finalY + cbRadiusPx },
      });

      if (evalRes.isMarked) {
        filled[b] = true;
        markedCount = b + 1;
      }
    }

    const totalQuantity = computeQuantity(markedCount, item);
    scannedItems.push({
      itemId: item.id,
      quantity: markedCount,
      totalQuantity,
      filled,
    });

    rowDebugs.push({
      itemId: item.id,
      expectedY: expectedYPx,
      localAnchor: timingCenter,
      rowLineY: syncedY,
      checkboxes: debugCheckboxes,
    });
  });

  return { items: scannedItems, rowDebugs };
}

// ---------------------------------------------------------------------------
// GŁÓWNA FUNKCJA ANALIZY OMR
// ---------------------------------------------------------------------------
export async function analyzeListImage(imageUri: string): Promise<AnalysisResult> {
  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: ANALYSIS_W } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.90, base64: true }
  );
  if (!resized.base64) throw new Error('Nie można przetworzyć obrazu z aparatu');

  const raw = jpeg.decode(base64js.toByteArray(resized.base64), { useTArray: true, maxMemoryUsageInMB: 96 });
  const data = raw.data as Uint8Array;
  const W = raw.width;
  const H = raw.height;

  const pxPerMm = W / OMR_GEOMETRY.PAGE_W_MM;

  const debugData: DebugData = {
    globalAnchors: [
      { x: 0, y: 0 },
      { x: W, y: 0 },
      { x: 0, y: H },
      { x: W, y: H },
    ],
    squadCheckboxes: [],
    rows: [],
  };

  // ── ETAP 1: Zbliżenie i analiza fragmentu Zastępu ──────────────────────────
  const squadResult = analyzeSquadSubRegion(data, W, H, pxPerMm);
  debugData.squadCheckboxes = squadResult.debugCheckboxes;

  // ── ETAP 2: Zbliżenie i analiza każdej kategorii osobno ───────────────────
  const allItems: ScannedItem[] = [];

  for (const block of CATEGORY_BLOCKS) {
    const blockResult = analyzeCategoryBlock(data, W, H, block, pxPerMm);
    allItems.push(...blockResult.items);
    debugData.rows.push(...blockResult.rowDebugs);
  }

  return {
    squadId: squadResult.squadId,
    squadDots: squadResult.squadDots,
    items: allItems,
    debugData,
  };
}

export { numberToBinaryDots, binaryDotsToNumber } from '../constants/listTemplate';
