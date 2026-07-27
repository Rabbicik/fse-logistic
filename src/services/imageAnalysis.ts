import * as ImageManipulator from 'expo-image-manipulator';
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

/*
 * Geometria wydrukowanej listy (znormalizowana do zakresu 0-1)
 * Oparty na pliku lista_zaopatrzenia.html (A4, marginesy 8mm/10mm)
 *
 * Strona drukowana: 190mm × 281mm
 * Nagłówek + wiersz zastępu: ~33mm → 0.117
 * Każdy element: ~7mm → 0.025
 * Nagłówek kategorii: ~8mm → 0.028
 * Margines przed nagłówkiem kategorii: ~3mm → 0.011
 */
const LAYOUT = {
  contentStartY: 0.117,

  /*
   * Wiersz ID zastępu – 10 kwadracików (większe, 5mm) wycentrowane
   * między etykietą "Zastęp" a prawym marginesem
   * Przybliżone środki x dla 10 kwadracików:
   */
  idCheckboxX: [0.14, 0.17, 0.20, 0.23, 0.26, 0.29, 0.32, 0.35, 0.38, 0.41],
  idCheckboxY: 0.075,

  /*
   * Trzy kolumny: x-pozycje centrum każdego z 5 kwadracików w wierszu produktu
   * Kolumna 1 – kwadraciki zaczynają się ok. 60% szerokości kolumny
   * Kolumna 2 – środek strony + analogicznie
   * Kolumna 3 – prawa kolumna
   */
  columns: [
    { checkboxX: [0.148, 0.177, 0.207, 0.236, 0.266] },
    { checkboxX: [0.481, 0.511, 0.540, 0.570, 0.599] },
    { checkboxX: [0.815, 0.844, 0.874, 0.903, 0.933] },
  ] as const,

  /*
   * Wysokości elementów (jako ułamek całkowitej wysokości strony)
   */
  itemH: 0.025,
  catH: 0.028,
  catMarginH: 0.011,
};

/*
 * Oblicza środek Y (znormalizowany) dla danego produktu w kolumnie.
 * Uwzględnia kategorie w danej kolumnie i ich nagłówki.
 */
function computeItemYCenter(column: 1 | 2 | 3, colRow: number): number {
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

/*
 * Oblicza jasność (0-255) piksela wokół punktu (x, y) na obrazie.
 * Uśrednia NxN pikseli wokół punktu dla odporności na szumy.
 */
function sampleBrightness(
  data: Uint8ClampedArray,
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
  data: Uint8ClampedArray,
  nx: number,
  ny: number,
  imgWidth: number,
  imgHeight: number
): boolean {
  const cx = nx * imgWidth;
  const cy = ny * imgHeight;
  // Zmniejszony promień do 2 px (5x5 px) na środku kwadratu – omija to ewentualne czarne obwódki pustych pól
  const brightness = sampleBrightness(data, cx, cy, imgWidth, 2);
  return brightness < FILL_THRESHOLD;
}

/*
 * Główna funkcja analizy obrazu listy zaopatrzenia.
 * Zwraca ID zastępu (binarnie z 10 kwadracikami) i ilości artykułów.
 */
export async function analyzeListImage(imageUri: string): Promise<AnalysisResult> {
  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 900 } }],
    { format: ImageManipulator.SaveFormat.PNG, base64: true }
  );

  if (!resized.base64) {
    throw new Error('Nie można przetworzyć obrazu');
  }

  const { width, height } = resized;
  const data = base64ToPixels(resized.base64, width, height);

  const squadDots: boolean[] = LAYOUT.idCheckboxX.map((nx) =>
    isFilledAt(data, nx, LAYOUT.idCheckboxY, width, height)
  );

  const squadId = binaryToNumber(squadDots);

  const items: ScannedItem[] = LIST_ITEMS.map((item) => {
    const colIndex = item.column - 1;
    const xPositions = LAYOUT.columns[colIndex].checkboxX;
    const yCenter = computeItemYCenter(item.column, item.colRow);

    const filled = xPositions.map((nx) =>
      isFilledAt(data, nx, yCenter, width, height)
    );

    return {
      itemId: item.id,
      quantity: filled.filter(Boolean).length,
      filled,
    };
  });

  return { squadId, squadDots, items };
}

/*
 * Konwertuje base64 PNG na tablicę danych RGBA pikselowych.
 * Na React Native nie ma dostępu do Canvas – używamy atob() do wyciągnięcia bajtów.
 */
function base64ToPixels(
  base64: string,
  width: number,
  height: number
): Uint8ClampedArray {
  const byteCount = width * height * 4;
  const arr = new Uint8ClampedArray(byteCount);

  try {
    const raw = atob(base64);
    for (let i = 0; i < Math.min(raw.length, byteCount); i++) {
      arr[i] = raw.charCodeAt(i);
    }
  } catch {
    arr.fill(200);
  }

  return arr;
}

/*
 * Konwertuje tablicę zamalowanych kwadracików (MSB first) na liczbę całkowitą.
 */
function binaryToNumber(dots: boolean[]): number {
  return dots.reduce(
    (acc, filled, i) => acc + (filled ? Math.pow(2, dots.length - 1 - i) : 0),
    0
  );
}

/*
 * Konwertuje numer zastępu na reprezentację binarną (tablica boolean).
 */
export function numberToBinaryDots(
  num: number,
  length: number = ID_DOT_COUNT
): boolean[] {
  return Array.from({ length }, (_, i) => (num >> (length - 1 - i) & 1) === 1);
}
