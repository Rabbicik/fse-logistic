import * as ImageManipulator from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import * as base64js from 'base64-js';
import { ScannedItem } from '../types';
import { LIST_ITEMS, ID_DOT_COUNT } from '../constants/listTemplate';

interface AnalysisResult {
  squadId: number;
  squadDots: boolean[];
  items: ScannedItem[];
}

/*
 * Próg jasności poniżej którego piksel uznawany jest za zamalowany.
 * 0 = czarny, 255 = biały
 */
const FILL_THRESHOLD = 120;

const LAYOUT = {
  contentStartY: 0.181,

  idCheckboxX: [0.174, 0.213, 0.253, 0.292, 0.332, 0.371, 0.411, 0.45, 0.489, 0.529],
  idCheckboxY: 0.134,

  markerX: [0.049, 0.364, 0.678],

  columns: [
    { checkboxX: [0.192, 0.213, 0.234, 0.255, 0.276] },
    { checkboxX: [0.506, 0.527, 0.548, 0.569, 0.59] },
    { checkboxX: [0.82, 0.841, 0.862, 0.883, 0.904] },
  ] as const,

  itemH: 0.022,
  catH: 0.020,
  catMarginH: 0.009,
};

/*
 * Oblicza przewidywany środek Y (znormalizowany) dla danego produktu w kolumnie.
 */
function computeExpectedYCenter(column: 1 | 2 | 3, colRow: number): number {
  const colItems = LIST_ITEMS.filter((i) => i.column === column);

  let cumY = LAYOUT.contentStartY;
  let prevCategory = '';
  let rowsProcessed = 0;

  for (const item of colItems) {
    if (item.category !== prevCategory) {
      if (prevCategory !== '') {
        cumY += LAYOUT.catMarginH;
      }
      cumY += LAYOUT.catH;
      prevCategory = item.category;
    }

    if (rowsProcessed === colRow) {
      return cumY + LAYOUT.itemH / 2;
    }

    cumY += LAYOUT.itemH;
    rowsProcessed++;
  }

  return cumY;
}

function sampleBrightness(
  data: Uint8ClampedArray | Uint8Array,
  cx: number,
  cy: number,
  imgWidth: number,
  radius: number
): number {
  let total = 0;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 0 || py < 0 || px >= imgWidth) continue;

      const idx = (py * imgWidth + px) * 4;
      if (idx + 2 >= data.length) continue;

      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      total += lum;
      count++;
    }
  }

  return count > 0 ? total / count : 255;
}

function isFilledAt(
  data: Uint8ClampedArray | Uint8Array,
  nx: number,
  ny: number,
  imgWidth: number,
  imgHeight: number
): boolean {
  const cx = nx * imgWidth;
  const cy = ny * imgHeight;
  const brightness = sampleBrightness(data, cx, cy, imgWidth, 2);
  return brightness < FILL_THRESHOLD;
}

/*
 * Dynamiczne wyszukiwanie markerów (czarnych kropek ■) w kolumnie.
 */
function findMarkersInColumn(data: Uint8ClampedArray | Uint8Array, markerX: number, imgWidth: number, imgHeight: number): number[] {
  const markers: number[] = [];
  const startY = Math.floor(LAYOUT.contentStartY * imgHeight);
  const endY = Math.floor(imgHeight * 0.95);
  const mx = markerX * imgWidth;
  
  let inMarker = false;
  let markerTop = 0;
  
  for (let y = startY; y < endY; y++) {
    // Sprawdzamy jasność w bardzo małym promieniu, aby zidentyfikować czarny punkt
    const brightness = sampleBrightness(data, mx, y, imgWidth, 1);
    const isDark = brightness < 100; // Ostry próg dla markera
    
    if (isDark && !inMarker) {
      inMarker = true;
      markerTop = y;
    } else if (!isDark && inMarker) {
      inMarker = false;
      const markerBottom = y;
      const markerHeight = (markerBottom - markerTop) / imgHeight;
      
      // Marker ma ok. 1.8mm, cała strona 277mm -> ~0.0065. Tolerancja od 0.002 do 0.015
      if (markerHeight > 0.002 && markerHeight < 0.015) {
        markers.push((markerTop + markerBottom) / 2 / imgHeight);
      }
    }
  }
  return markers;
}

function snapToNearestMarker(expectedY: number, markers: number[]): number {
  if (markers.length === 0) return expectedY;
  
  let closest = markers[0];
  let minDiff = Math.abs(expectedY - closest);
  
  for (let i = 1; i < markers.length; i++) {
    const diff = Math.abs(expectedY - markers[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = markers[i];
    }
  }
  
  // Jeśli najbliższy marker jest bliżej niż 1x wysokość wiersza, przyciągaj. W przeciwnym razie użyj kalkulowanego Y.
  if (minDiff < LAYOUT.itemH) {
    return closest;
  }
  return expectedY;
}

export async function analyzeListImage(imageUri: string): Promise<AnalysisResult> {
  // Zmniejszamy rozdzielczość do 600px i zapisujemy jako JPEG, żeby nie wywalić apki brakiem pamięci
  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 600 } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8, base64: true }
  );

  if (!resized.base64) {
    throw new Error('Nie można przetworzyć obrazu');
  }

  // 1. Zdekoduj Base64 do tablicy bajtów (surowy plik JPEG)
  const jpegBytes = base64js.toByteArray(resized.base64);
  
  // 2. Rozpakuj JPEG do surowych pikseli RGBA
  const rawImageData = jpeg.decode(jpegBytes, { useTArray: true });
  const data = rawImageData.data; // To jest Uint8Array z danymi RGBA
  const width = rawImageData.width;
  const height = rawImageData.height;

  const squadDots: boolean[] = LAYOUT.idCheckboxX.map((nx) =>
    isFilledAt(data, nx, LAYOUT.idCheckboxY, width, height)
  );

  const squadId = binaryToNumber(squadDots);

  // Wyszukaj markery dla każdej kolumny
  const colMarkers = LAYOUT.markerX.map(mx => findMarkersInColumn(data, mx, width, height));

  const items: ScannedItem[] = LIST_ITEMS.map((item) => {
    const colIndex = item.column - 1;
    const xPositions = LAYOUT.columns[colIndex].checkboxX;
    
    const expectedY = computeExpectedYCenter(item.column, item.colRow);
    const markersForCol = colMarkers[colIndex];
    
    // Używamy dynamicznego snappingu do markera
    const trueYCenter = snapToNearestMarker(expectedY, markersForCol);

    const filled = xPositions.map((nx) =>
      isFilledAt(data, nx, trueYCenter, width, height)
    );

    return {
      itemId: item.id,
      quantity: filled.filter(Boolean).length,
      filled,
    };
  });

  return { squadId, squadDots, items };
}

function binaryToNumber(dots: boolean[]): number {
  return dots.reduce(
    (acc, filled, i) => acc + (filled ? Math.pow(2, dots.length - 1 - i) : 0),
    0
  );
}

export function numberToBinaryDots(
  num: number,
  length: number = ID_DOT_COUNT
): boolean[] {
  return Array.from({ length }, (_, i) => (num >> (length - 1 - i) & 1) === 1);
}
