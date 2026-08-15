/*
 * OMR CORE v3 — czysty moduł analizy (bez zależności od Expo / React Native).
 *
 * Wejście: obraz w skali szarości (Uint8Array) przyciętego dokumentu A4.
 * Potok:
 *   1. Detekcja 4 znaczników narożnych (fiducials) drukowanych na szablonie.
 *   2. Homografia mm → px (DLT z 4 punktów) — usuwa resztkową perspektywę,
 *      błędy kadrowania ML Kit i różnice proporcji obrazu.
 *   3. Dla każdego wiersza: lokalne tło papieru (mediana z próbek wokół kółek),
 *      korekta Y na pasku taktującym, ocena wypełnienia kółek WZGLĘDEM
 *      pozostałych kółek w tym samym wierszu (odporność na cień, długopis
 *      vs. ołówek, cyfry wydrukowane w kółkach).
 *   4. Wynik z poziomem pewności (confidence) per wiersz.
 *
 * Geometria pochodzi WYŁĄCZNIE z src/constants/omrGeometry.gen.ts,
 * generowanego przez scripts/generate_template.js z tych samych stałych,
 * z których powstaje drukowany szablon.
 */
import {
  OMR_PAGE,
  FIDUCIALS,
  SQUAD_GEOM,
  ITEM_GEOM,
  OMR_ROWS,
} from '../constants/omrGeometry.gen';
import { Point, DebugData, CheckboxDebug, RowDebug } from '../types';

export class FiducialError extends Error {
  constructor(corner: string) {
    super(
      `Nie wykryto znaczników narożnych (${corner}). ` +
        'Upewnij się, że cała kartka — razem z czarnymi kwadratami w rogach — jest na zdjęciu, ' +
        'i że jest to wydruk aktualnego szablonu.'
    );
    this.name = 'FiducialError';
  }
}

export interface GrayImage {
  data: Uint8Array; // luminancja 0..255, W*H
  width: number;
  height: number;
}

export interface CoreItemResult {
  itemId: string;
  /** liczba jednostek (kółek) odczytana z wiersza */
  quantity: number;
  filled: boolean[];
  /** 0..1 — jak pewny jest odczyt tego wiersza */
  confidence: number;
}

export interface CoreResult {
  squadId: number; // 0 = nie rozpoznano
  squadDots: boolean[];
  squadConfidence: number;
  items: CoreItemResult[];
  debug: DebugData;
}

// ---------------------------------------------------------------------------
// OBRAZ POMOCNICZO
// ---------------------------------------------------------------------------
export function rgbaToGray(rgba: Uint8Array, width: number, height: number): GrayImage {
  const g = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = (0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]) | 0;
  }
  return { data: g, width, height };
}

function lumAt(img: GrayImage, x: number, y: number): number {
  const xi = x < 0 ? 0 : x >= img.width ? img.width - 1 : x | 0;
  const yi = y < 0 ? 0 : y >= img.height ? img.height - 1 : y | 0;
  return img.data[yi * img.width + xi];
}

/** średnia luminancja w kole o promieniu r px */
function discMean(img: GrayImage, cx: number, cy: number, r: number): number {
  const rI = Math.max(1, Math.round(r));
  let sum = 0;
  let n = 0;
  for (let dy = -rI; dy <= rI; dy++) {
    for (let dx = -rI; dx <= rI; dx++) {
      if (dx * dx + dy * dy <= rI * rI) {
        sum += lumAt(img, cx + dx, cy + dy);
        n++;
      }
    }
  }
  return n ? sum / n : 255;
}

/** obraz całkowy (summed-area table) do szybkich średnich po oknach */
function integralImage(img: GrayImage): Uint32Array {
  const { data, width: W, height: H } = img;
  const ii = new Uint32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let rowSum = 0;
    const src = y * W;
    const dst = (y + 1) * (W + 1);
    const prev = y * (W + 1);
    for (let x = 0; x < W; x++) {
      rowSum += data[src + x];
      ii[dst + x + 1] = ii[prev + x + 1] + rowSum;
    }
  }
  return ii;
}

function windowMean(ii: Uint32Array, W: number, x0: number, y0: number, x1: number, y1: number): number {
  const s =
    ii[y1 * (W + 1) + x1] - ii[y0 * (W + 1) + x1] - ii[y1 * (W + 1) + x0] + ii[y0 * (W + 1) + x0];
  const n = (x1 - x0) * (y1 - y0);
  return n > 0 ? s / n : 255;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ---------------------------------------------------------------------------
// ETAP 1: DETEKCJA ZNACZNIKÓW NAROŻNYCH
// ---------------------------------------------------------------------------
const CORNER_NAMES = ['lewy górny', 'prawy górny', 'lewy dolny', 'prawy dolny'];

function findFiducials(img: GrayImage): Point[] {
  const { width: W, height: H } = img;
  const ii = integralImage(img);
  const sidePx = FIDUCIALS.sideMm * (W / OMR_PAGE.W_MM);
  const s = Math.max(4, Math.round(sidePx));
  const qw = Math.round(W * 0.28);
  const qh = Math.round(H * 0.28);

  const quadrants: [number, number][] = [
    [0, 0],
    [W - qw, 0],
    [0, H - qh],
    [W - qw, H - qh],
  ];

  const centers: Point[] = [];
  for (let q = 0; q < 4; q++) {
    const [qx, qy] = quadrants[q];
    // 1. Kandydaci: najciemniejsze okna s×s w ćwiartce (krok s/4)
    const stride = Math.max(1, Math.round(s / 4));
    const candidates: { mean: number; x: number; y: number }[] = [];
    for (let y = qy; y + s <= qy + qh; y += stride) {
      for (let x = qx; x + s <= qx + qw; x += stride) {
        candidates.push({ mean: windowMean(ii, W, x, y, x + s, y + s), x, y });
      }
    }
    candidates.sort((a, b) => a.mean - b.mean);

    // 2. Waliduj kandydatów (pomijając sąsiadów już sprawdzonych):
    //    zwarty, mniej-więcej kwadratowy blob o powierzchni ~s² — a nie np.
    //    ciemna krawędź stołu wzdłuż brzegu kadru.
    let found: Point | null = null;
    const tried: { x: number; y: number }[] = [];
    for (const cand of candidates.slice(0, 24)) {
      if (found) break;
      if (tried.some((t) => Math.abs(t.x - cand.x) < s && Math.abs(t.y - cand.y) < s)) continue;
      tried.push(cand);

      const roiPad = s;
      const rx0 = Math.max(0, cand.x - roiPad);
      const ry0 = Math.max(0, cand.y - roiPad);
      const rx1 = Math.min(W, cand.x + s + roiPad);
      const ry1 = Math.min(H, cand.y + s + roiPad);
      const roiMean = windowMean(ii, W, rx0, ry0, rx1, ry1);
      const roiArea = (rx1 - rx0) * (ry1 - ry0);
      // średnia ROI zawiera znacznik; oszacuj poziom papieru po odjęciu bloba
      const paper = Math.min(
        255,
        (roiMean * roiArea - cand.mean * s * s) / Math.max(1, roiArea - s * s)
      );
      if (paper - cand.mean < 40) continue; // za mały kontrast — to nie znacznik
      const thr = (cand.mean + paper) / 2;

      // Przebieg 1: wstępny centroid wszystkich ciemnych pikseli w ROI
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let y = ry0; y < ry1; y++) {
        for (let x = rx0; x < rx1; x++) {
          if (img.data[y * W + x] < thr) {
            sx += x;
            sy += y;
            n++;
          }
        }
      }
      if (n === 0) continue;
      const cx0 = sx / n;
      const cy0 = sy / n;

      // Przebieg 2: tylko piksele blisko centroidu (odcina zabłąkany tusz
      // nagłówka/tekstu w ROI), dopiero na nich walidacja kształtu.
      const keepR = 0.8 * s;
      sx = 0;
      sy = 0;
      n = 0;
      let bx0 = rx1;
      let bx1 = rx0;
      let by0 = ry1;
      let by1 = ry0;
      for (let y = ry0; y < ry1; y++) {
        for (let x = rx0; x < rx1; x++) {
          if (img.data[y * W + x] < thr && Math.abs(x - cx0) <= keepR && Math.abs(y - cy0) <= keepR) {
            sx += x;
            sy += y;
            n++;
            if (x < bx0) bx0 = x;
            if (x > bx1) bx1 = x;
            if (y < by0) by0 = y;
            if (y > by1) by1 = y;
          }
        }
      }
      if (n === 0) continue;
      const bw = bx1 - bx0 + 1;
      const bh = by1 - by0 + 1;
      const aspect = bw / bh;
      const bboxFill = n / (bw * bh);
      const expected = s * s;
      const okArea = n >= expected * 0.3 && n <= expected * 2.6;
      const okShape = aspect > 0.55 && aspect < 1.8 && bboxFill > 0.55;
      if (okArea && okShape) {
        found = { x: sx / n + 0.5, y: sy / n + 0.5 };
      }
    }
    if (!found) throw new FiducialError(CORNER_NAMES[q]);
    centers.push(found);
  }
  return centers; // [TL, TR, BL, BR]
}

// ---------------------------------------------------------------------------
// ETAP 2: HOMOGRAFIA mm → px (DLT, 4 punkty)
// ---------------------------------------------------------------------------
export type Homography = number[]; // [h0..h7], h8 = 1

function solveHomography(srcMm: ReadonlyArray<readonly [number, number]>, dstPx: Point[]): Homography {
  // 8 równań: x' = (h0 X + h1 Y + h2)/(h6 X + h7 Y + 1), analogicznie y'
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [X, Y] = srcMm[i];
    const { x, y } = dstPx[i];
    A.push([X, Y, 1, 0, 0, 0, -x * X, -x * Y]);
    b.push(x);
    A.push([0, 0, 0, X, Y, 1, -y * X, -y * Y]);
    b.push(y);
  }
  // Eliminacja Gaussa z częściowym wyborem elementu głównego
  const n = 8;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    }
    if (Math.abs(A[piv][col]) < 1e-12) throw new Error('Homografia zdegenerowana');
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }
  const h = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * h[c];
    h[r] = s / A[r][r];
  }
  return h;
}

function project(h: Homography, xMm: number, yMm: number): Point {
  const w = h[6] * xMm + h[7] * yMm + 1;
  return {
    x: (h[0] * xMm + h[1] * yMm + h[2]) / w,
    y: (h[3] * xMm + h[4] * yMm + h[5]) / w,
  };
}

/** lokalna skala px/mm w otoczeniu punktu (średnia z osi X i Y) */
function localScale(h: Homography, xMm: number, yMm: number): number {
  const p0 = project(h, xMm, yMm);
  const px = project(h, xMm + 1, yMm);
  const py = project(h, xMm, yMm + 1);
  const sx = Math.hypot(px.x - p0.x, px.y - p0.y);
  const sy = Math.hypot(py.x - p0.x, py.y - p0.y);
  return (sx + sy) / 2;
}

// ---------------------------------------------------------------------------
// ETAP 3: OCENA KÓŁEK WZGLĘDEM WIERSZA
// ---------------------------------------------------------------------------
const DARK_DELTA = 30; // piksel „ciemny”, gdy tło − lum > DARK_DELTA
const FILL_STRONG = 0.45; // bezwzględnie zaznaczone
const FILL_WEAK_MIN = 0.3; // minimalne wypełnienie dla progu względnego
const FILL_WEAK_OVER_BASE = 0.22; // ile ponad najczystsze kółko wiersza

interface BubbleEval {
  fill: number;
  mean: number;
}

function evalBubble(img: GrayImage, cx: number, cy: number, rPx: number, paper: number): BubbleEval {
  const innerR = Math.max(2, rPx * 0.68);
  const rI = Math.round(innerR);
  let dark = 0;
  let n = 0;
  let sum = 0;
  for (let dy = -rI; dy <= rI; dy++) {
    for (let dx = -rI; dx <= rI; dx++) {
      if (dx * dx + dy * dy <= rI * rI) {
        const l = lumAt(img, cx + dx, cy + dy);
        sum += l;
        n++;
        if (paper - l > DARK_DELTA) dark++;
      }
    }
  }
  return { fill: n ? dark / n : 0, mean: n ? sum / n : 255 };
}

interface RowDecision {
  filled: boolean[];
  quantity: number;
  confidence: number;
}

/**
 * Decyzja względna: kółko jest zaznaczone, gdy jego wypełnienie jest wysokie
 * bezwzględnie LUB wyraźnie odstaje od najczystszego kółka w tym wierszu.
 * Ilość (tylko tryb 'count'): ciągłe 1..k → k; pojedyncze kółko k → k
 * (użytkownik zaznaczył „swoją cyfrę”); wzorzec z dziurami → liczba
 * zaznaczonych, niska pewność. Tryb 'binary' (kod zastępu): dziury są
 * oczekiwane, bez kary do pewności.
 */
function decideRow(fills: number[], mode: 'count' | 'binary' = 'count'): RowDecision {
  const base = Math.min(...fills);
  const weakThr = Math.max(FILL_WEAK_MIN, base + FILL_WEAK_OVER_BASE);
  const filled = fills.map((f) => f >= FILL_STRONG || f >= weakThr);

  let confidence = 1;
  for (const f of fills) {
    const boundary = Math.min(FILL_STRONG, weakThr);
    const margin = Math.abs(f - boundary) / 0.15;
    confidence = Math.min(confidence, Math.max(0.05, Math.min(1, margin)));
  }

  const markedIdx = filled.flatMap((m, i) => (m ? [i] : []));
  const count = markedIdx.length;
  let quantity = count;
  if (mode === 'count') {
    if (count === 1 && markedIdx[0] > 0) {
      // pojedynczo zaznaczona cyfra k → ilość k
      quantity = markedIdx[0] + 1;
      confidence *= 0.7;
    } else if (count > 0 && markedIdx[count - 1] !== count - 1) {
      // wzorzec nieciągły
      confidence *= 0.5;
    }
  }
  return { filled, quantity, confidence };
}

/** próbki czystego papieru wokół kółek wiersza → mediana */
function rowPaperLevel(
  img: GrayImage,
  h: Homography,
  bubbleXMm: number[],
  yMm: number,
  scale: number
): number {
  const probes: number[] = [];
  const probeR = 0.55 * scale;
  for (const x of bubbleXMm) {
    for (const dy of [-3.3, 3.3]) {
      const p = project(h, x, yMm + dy);
      probes.push(discMean(img, p.x, p.y, probeR));
    }
  }
  const pl = project(h, bubbleXMm[0] - 4.2, yMm);
  probes.push(discMean(img, pl.x, pl.y, probeR));
  return median(probes);
}

/**
 * Korekta Y wiersza na pasku taktującym: szukamy najciemniejszego okna
 * wzdłuż osi Y wokół oczekiwanej pozycji znacznika. Zwraca poprawkę w px.
 */
function timingDeltaY(
  img: GrayImage,
  h: Homography,
  timingXMm: number,
  yMm: number,
  scale: number,
  paper: number
): number {
  const center = project(h, timingXMm, yMm);
  const rangePx = Math.round(2.4 * scale);
  const halfW = Math.max(1, Math.round(1.3 * scale));
  const halfH = Math.max(1, Math.round(0.6 * scale));
  let bestVal = 256;
  let bestDy = 0;
  for (let dy = -rangePx; dy <= rangePx; dy++) {
    let sum = 0;
    let n = 0;
    for (let yy = -halfH; yy <= halfH; yy++) {
      for (let xx = -halfW; xx <= halfW; xx++) {
        sum += lumAt(img, center.x + xx, center.y + dy + yy);
        n++;
      }
    }
    const m = sum / n;
    if (m < bestVal) {
      bestVal = m;
      bestDy = dy;
    }
  }
  // akceptuj tylko wyraźnie ciemny znacznik — inaczej zostań przy homografii
  return bestVal < paper - 45 ? bestDy : 0;
}

// ---------------------------------------------------------------------------
// GŁÓWNA ANALIZA
// ---------------------------------------------------------------------------
/**
 * Kwadratowe znaczniki narożne są symetryczne, więc kartka sfotografowana
 * „do góry nogami” dałaby poprawną homografię o obróconym układzie.
 * Rozstrzygamy orientację asymetrią szablonu: paski taktujące leżą przy
 * LEWEJ krawędzi każdej kolumny — właściwa orientacja daje ciemne próbki
 * we wszystkich 68 pozycjach, odwrócona trafia w tekst/papier.
 */
function timingScore(img: GrayImage, h: Homography): number {
  let sum = 0;
  for (const row of OMR_ROWS) {
    const p = project(h, row.timingXMm, row.yMm);
    sum += discMean(img, p.x, p.y, 0.8 * localScale(h, row.timingXMm, row.yMm));
  }
  return sum / OMR_ROWS.length; // niżej = ciemniej = lepiej
}

export function analyzeOmr(img: GrayImage): CoreResult {
  const fiducials = findFiducials(img);
  const hUp = solveHomography(FIDUCIALS.centersMm, fiducials);
  // orientacja odwrócona: TL↔BR, TR↔BL
  const hDown = solveHomography(
    FIDUCIALS.centersMm,
    [fiducials[3], fiducials[2], fiducials[1], fiducials[0]]
  );
  const h = timingScore(img, hUp) <= timingScore(img, hDown) ? hUp : hDown;

  const debug: DebugData = {
    globalAnchors: fiducials,
    squadCheckboxes: [],
    rows: [],
  };

  // ── ID zastępu ─────────────────────────────────────────────────────────
  const sqScale = localScale(h, SQUAD_GEOM.bubbleXMm[1], SQUAD_GEOM.yMm);
  const sqPaperProbes: number[] = [];
  for (let i = 0; i < SQUAD_GEOM.bubbleXMm.length - 1; i++) {
    const mid = (SQUAD_GEOM.bubbleXMm[i] + SQUAD_GEOM.bubbleXMm[i + 1]) / 2;
    const p = project(h, mid, SQUAD_GEOM.yMm);
    sqPaperProbes.push(discMean(img, p.x, p.y, 0.55 * sqScale));
  }
  for (const x of [SQUAD_GEOM.bubbleXMm[0] - 5.5, SQUAD_GEOM.bubbleXMm[3] + 5.5]) {
    const p = project(h, x, SQUAD_GEOM.yMm);
    sqPaperProbes.push(discMean(img, p.x, p.y, 0.55 * sqScale));
  }
  const sqPaper = median(sqPaperProbes);
  const sqFills: number[] = [];
  const sqPts: Point[] = [];
  for (const x of SQUAD_GEOM.bubbleXMm) {
    const p = project(h, x, SQUAD_GEOM.yMm);
    sqPts.push(p);
    sqFills.push(evalBubble(img, p.x, p.y, SQUAD_GEOM.bubbleRadiusMm * sqScale, sqPaper).fill);
  }
  const sqDecision = decideRow(sqFills, 'binary');
  const squadDots = sqDecision.filled;
  let squadId = 0;
  for (let i = 0; i < 4; i++) if (squadDots[i]) squadId += 1 << i;
  if (squadId < 1 || squadId > 15) squadId = 0; // nie rozpoznano — decyzja użytkownika w UI
  sqPts.forEach((p, i) => {
    const rPx = SQUAD_GEOM.bubbleRadiusMm * sqScale;
    debug.squadCheckboxes.push({
      point: p,
      isMarked: squadDots[i],
      lum: sqFills[i],
      bg: sqPaper,
      bounds: { yMin: p.y - rPx, yMax: p.y + rPx },
    } as CheckboxDebug);
  });

  // ── Wiersze artykułów ──────────────────────────────────────────────────
  const items: CoreItemResult[] = [];
  for (const row of OMR_ROWS) {
    const scale = localScale(h, row.bubbleXMm[2], row.yMm);
    const paper = rowPaperLevel(img, h, row.bubbleXMm, row.yMm, scale);
    const dY = timingDeltaY(img, h, row.timingXMm, row.yMm, scale, paper);

    const fills: number[] = [];
    const debugCheckboxes: CheckboxDebug[] = [];
    const rPx = ITEM_GEOM.bubbleRadiusMm * scale;
    for (const x of row.bubbleXMm) {
      const p = project(h, x, row.yMm);
      const cy = p.y + dY;
      const ev = evalBubble(img, p.x, cy, rPx, paper);
      fills.push(ev.fill);
      debugCheckboxes.push({
        point: { x: p.x, y: cy },
        isMarked: false, // uzupełnione niżej po decyzji wiersza
        lum: ev.mean,
        bg: paper,
        bounds: { yMin: cy - rPx, yMax: cy + rPx },
      });
    }
    const decision = decideRow(fills);
    decision.filled.forEach((m, i) => (debugCheckboxes[i].isMarked = m));

    items.push({
      itemId: row.itemId,
      quantity: decision.quantity,
      filled: decision.filled,
      confidence: decision.confidence,
    });

    const timingPt = project(h, row.timingXMm, row.yMm);
    const rowDebug: RowDebug = {
      itemId: row.itemId,
      expectedY: project(h, row.bubbleXMm[0], row.yMm).y,
      localAnchor: { x: timingPt.x, y: timingPt.y + dY },
      rowLineY: project(h, row.bubbleXMm[0], row.yMm).y + dY,
      checkboxes: debugCheckboxes,
    };
    debug.rows.push(rowDebug);
  }

  return {
    squadId,
    squadDots,
    squadConfidence: sqDecision.confidence,
    items,
    debug,
  };
}
