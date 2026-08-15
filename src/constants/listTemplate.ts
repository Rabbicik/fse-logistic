import { ListItem } from '../types';
import LIST_DATA from './listItems.json';

/*
 * Katalog artykułów pochodzi z src/constants/listItems.json — tego samego
 * pliku, z którego scripts/generate_template.js generuje szablon wydruku
 * i geometrię OMR (src/constants/omrGeometry.gen.ts). Jedno źródło prawdy.
 */

export const ID_DOT_COUNT = 4;

export const SQUAD_COLORS = [
  '#FF6B35', // 1
  '#F7C59F', // 2
  '#EFEFD0', // 3
  '#004E89', // 4
  '#1A659E', // 5
  '#F95738', // 6
  '#EE964B', // 7
  '#F4D35E', // 8
  '#2EC4B6', // 9
  '#E71D36', // 10
  '#9B5DE5', // 11
  '#F15BB5', // 12
  '#00BBF9', // 13
  '#00F5D4', // 14
  '#70E000', // 15
];

export const DEFAULT_SQUADS: import('../types').Squad[] = SQUAD_COLORS.map((color, i) => ({
  id: i + 1,
  name: `Zastęp ${i + 1}`,
  color,
}));

export const CATEGORIES: string[] = LIST_DATA.categories;

export const LIST_ITEMS: ListItem[] = LIST_DATA.items.map((item, idx) => {
  const colItems = LIST_DATA.items.filter((i) => i.column === item.column);
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    rowIndex: idx,
    maxDots: item.maxDots,
    unit: item.unit,
    dotValue: item.dotValue,
    column: item.column as 1 | 2 | 3,
    colRow: colItems.findIndex((i) => i.id === item.id),
  };
});

/*
 * Oblicza całkowitą ilość produktu na podstawie liczby zaznaczonych kółek.
 * Wzór: totalQuantity = dots × item.dotValue
 */
export function computeQuantity(dots: number, item: ListItem): number {
  return dots * item.dotValue;
}

/** Jednostka bez wiodącej liczby: '2 szt.' → 'szt.', '400 g' → 'g' */
export function unitBase(unit: string): string {
  return unit.replace(/^[\d.,]+\s*/, '');
}

/*
 * Formatuje KOŃCOWĄ ilość do kupienia: kółka × dotValue + jednostka.
 * Np. Jabłka ('2 szt.', dotValue 2) przy 3 kółkach → '6 szt.'
 * Gramy od 1000 wzwyż pokazujemy w kg ('1,5 kg').
 */
export function formatTotalQuantity(item: ListItem, dots: number): string {
  const total = computeQuantity(dots, item);
  const base = unitBase(item.unit);
  if (base === 'g' && total >= 1000) {
    const kg = Math.round((total / 1000) * 100) / 100;
    return `${String(kg).replace('.', ',')} kg`;
  }
  return `${total} ${base}`;
}

/*
 * Konwersja kodu binarnego 4 kropek (1, 2, 4, 8) na numer zastępu 1..15
 */
export function binaryDotsToNumber(dots: boolean[]): number {
  let num = 0;
  for (let i = 0; i < Math.min(dots.length, 4); i++) {
    if (dots[i]) num += (1 << i);
  }
  return num;
}

export function numberToBinaryDots(num: number, length = 4): boolean[] {
  const dots: boolean[] = [];
  for (let i = 0; i < length; i++) {
    dots.push(Boolean(num & (1 << i)));
  }
  return dots;
}
