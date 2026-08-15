import { ListItem } from '../types';

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

export const DEFAULT_SQUADS: import('../types').Squad[] = [
  { id: 1, name: 'Zastęp 1', color: SQUAD_COLORS[0] },
  { id: 2, name: 'Zastęp 2', color: SQUAD_COLORS[1] },
  { id: 3, name: 'Zastęp 3', color: SQUAD_COLORS[2] },
  { id: 4, name: 'Zastęp 4', color: SQUAD_COLORS[3] },
  { id: 5, name: 'Zastęp 5', color: SQUAD_COLORS[4] },
  { id: 6, name: 'Zastęp 6', color: SQUAD_COLORS[5] },
  { id: 7, name: 'Zastęp 7', color: SQUAD_COLORS[6] },
  { id: 8, name: 'Zastęp 8', color: SQUAD_COLORS[7] },
  { id: 9, name: 'Zastęp 9', color: SQUAD_COLORS[8] },
  { id: 10, name: 'Zastęp 10', color: SQUAD_COLORS[9] },
  { id: 11, name: 'Zastęp 11', color: SQUAD_COLORS[10] },
  { id: 12, name: 'Zastęp 12', color: SQUAD_COLORS[11] },
  { id: 13, name: 'Zastęp 13', color: SQUAD_COLORS[12] },
  { id: 14, name: 'Zastęp 14', color: SQUAD_COLORS[13] },
  { id: 15, name: 'Zastęp 15', color: SQUAD_COLORS[14] },
];

export const CATEGORIES = [
  'Owoce',
  'Warzywa',
  'Pieczywo',
  'Mięso',
  'Wędliny',
  'Nabiał',
  'Produkty sypkie',
  'Konserwy',
  'Sosy',
  'Przyprawy',
];

/*
 * dotValue: ile jednostek (wg. pola unit) reprezentuje 1 zaznaczone kółko.
 * Wartość wynika bezpośrednio z listy zaopatrzenia HTML (np. "/ 2 szt." → dotValue: 2).
 * Przeliczenie: totalQuantity = ilość_kropek × dotValue
 */
export const LIST_ITEMS: ListItem[] = [
  { id: 'jablka', name: 'Jabłka', category: 'Owoce', rowIndex: 0, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 1, colRow: 0 },
  { id: 'banany', name: 'Banany', category: 'Owoce', rowIndex: 1, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 1, colRow: 1 },
  { id: 'nektarynka', name: 'Nektarynka', category: 'Owoce', rowIndex: 2, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 1, colRow: 2 },
  { id: 'arbuz', name: 'Arbuz', category: 'Owoce', rowIndex: 3, maxDots: 5, unit: '1 kg', dotValue: 1, column: 1, colRow: 3 },
  { id: 'ziemniaki', name: 'Ziemniaki', category: 'Warzywa', rowIndex: 4, maxDots: 5, unit: '500 g', dotValue: 500, column: 1, colRow: 4 },
  { id: 'cebula', name: 'Cebula', category: 'Warzywa', rowIndex: 5, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 1, colRow: 5 },
  { id: 'marchew', name: 'Marchew', category: 'Warzywa', rowIndex: 6, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 1, colRow: 6 },
  { id: 'pietruszka', name: 'Pietruszka', category: 'Warzywa', rowIndex: 7, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 1, colRow: 7 },
  { id: 'pomidory', name: 'Pomidory', category: 'Warzywa', rowIndex: 8, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 1, colRow: 8 },
  { id: 'ogorki', name: 'Ogórki', category: 'Warzywa', rowIndex: 9, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 1, colRow: 9 },
  { id: 'papryka', name: 'Papryka', category: 'Warzywa', rowIndex: 10, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 1, colRow: 10 },
  { id: 'czosnek', name: 'Czosnek', category: 'Warzywa', rowIndex: 11, maxDots: 5, unit: '1 gł.', dotValue: 1, column: 1, colRow: 11 },
  { id: 'salata_mix', name: 'Sałata mix', category: 'Warzywa', rowIndex: 12, maxDots: 5, unit: '1 op.', dotValue: 1, column: 1, colRow: 12 },
  { id: 'salata_glowka', name: 'Sałata (główka)', category: 'Warzywa', rowIndex: 13, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 1, colRow: 13 },
  { id: 'pieczarki', name: 'Pieczarki', category: 'Warzywa', rowIndex: 14, maxDots: 5, unit: '250 g', dotValue: 250, column: 1, colRow: 14 },
  { id: 'brokuly', name: 'Brokuły', category: 'Warzywa', rowIndex: 15, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 1, colRow: 15 },
  { id: 'chleb', name: 'Chleb', category: 'Pieczywo', rowIndex: 16, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 1, colRow: 16 },
  { id: 'chleb_tostowy', name: 'Chleb tostowy', category: 'Pieczywo', rowIndex: 17, maxDots: 5, unit: '1 op.', dotValue: 1, column: 1, colRow: 17 },
  { id: 'bulki', name: 'Bułki', category: 'Pieczywo', rowIndex: 18, maxDots: 5, unit: '4 szt.', dotValue: 4, column: 1, colRow: 18 },
  { id: 'tortilla', name: 'Tortilla', category: 'Pieczywo', rowIndex: 19, maxDots: 5, unit: '1 op.', dotValue: 1, column: 1, colRow: 19 },
  { id: 'piers_z_kurczaka', name: 'Pierś z kurczaka', category: 'Mięso', rowIndex: 20, maxDots: 5, unit: '400 g', dotValue: 400, column: 2, colRow: 0 },
  { id: 'mieso_mielone', name: 'Mięso mielone', category: 'Mięso', rowIndex: 21, maxDots: 5, unit: '400 g', dotValue: 400, column: 2, colRow: 1 },
  { id: 'schab', name: 'Schab', category: 'Mięso', rowIndex: 22, maxDots: 5, unit: '400 g', dotValue: 400, column: 2, colRow: 2 },
  { id: 'udka_z_kurczaka', name: 'Udka z kurczaka', category: 'Mięso', rowIndex: 23, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 2, colRow: 3 },
  { id: 'skrzydelka_z_kurczaka', name: 'Skrzydełka z kurczaka', category: 'Mięso', rowIndex: 24, maxDots: 5, unit: '500 g', dotValue: 500, column: 2, colRow: 4 },
  { id: 'watrobka', name: 'Wątróbka', category: 'Mięso', rowIndex: 25, maxDots: 5, unit: '400 g', dotValue: 400, column: 2, colRow: 5 },
  { id: 'boczek', name: 'Boczek', category: 'Mięso', rowIndex: 26, maxDots: 5, unit: '200 g', dotValue: 200, column: 2, colRow: 6 },
  { id: 'parowki', name: 'Parówki', category: 'Wędliny', rowIndex: 27, maxDots: 5, unit: '4 szt.', dotValue: 4, column: 2, colRow: 7 },
  { id: 'szynka', name: 'Szynka', category: 'Wędliny', rowIndex: 28, maxDots: 5, unit: '150 g', dotValue: 150, column: 2, colRow: 8 },
  { id: 'kielbasa', name: 'Kiełbasa', category: 'Wędliny', rowIndex: 29, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 2, colRow: 9 },
  { id: 'mleko', name: 'Mleko', category: 'Nabiał', rowIndex: 30, maxDots: 5, unit: '1 L', dotValue: 1, column: 2, colRow: 10 },
  { id: 'maslo', name: 'Masło', category: 'Nabiał', rowIndex: 31, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 2, colRow: 11 },
  { id: 'jajka', name: 'Jajka', category: 'Nabiał', rowIndex: 32, maxDots: 5, unit: '4 szt.', dotValue: 4, column: 2, colRow: 12 },
  { id: 'ser_zolty_plasterki', name: 'Ser żółty (plasterki)', category: 'Nabiał', rowIndex: 33, maxDots: 5, unit: '150 g', dotValue: 150, column: 2, colRow: 13 },
  { id: 'ser_zolty_kostka', name: 'Ser żółty (kostka)', category: 'Nabiał', rowIndex: 34, maxDots: 5, unit: '250 g', dotValue: 250, column: 2, colRow: 14 },
  { id: 'twarog', name: 'Twaróg', category: 'Nabiał', rowIndex: 35, maxDots: 5, unit: '250 g', dotValue: 250, column: 2, colRow: 15 },
  { id: 'smietana_18', name: 'Śmietana 18%', category: 'Nabiał', rowIndex: 36, maxDots: 5, unit: '1 op.', dotValue: 1, column: 2, colRow: 16 },
  { id: 'smietanka_30', name: 'Śmietanka 30%', category: 'Nabiał', rowIndex: 37, maxDots: 5, unit: '1 op.', dotValue: 1, column: 2, colRow: 17 },
  { id: 'jogurt_naturalny', name: 'Jogurt naturalny', category: 'Nabiał', rowIndex: 38, maxDots: 5, unit: '1 op.', dotValue: 1, column: 2, colRow: 18 },
  { id: 'serek_wiejski', name: 'Serek wiejski', category: 'Nabiał', rowIndex: 39, maxDots: 5, unit: '1 op.', dotValue: 1, column: 2, colRow: 19 },
  { id: 'jogurt_smakowe', name: 'Jogurt smakowe', category: 'Nabiał', rowIndex: 40, maxDots: 5, unit: '2 szt.', dotValue: 2, column: 2, colRow: 20 },
  { id: 'maka_pszenna', name: 'Mąka pszenna', category: 'Produkty sypkie', rowIndex: 41, maxDots: 5, unit: '1 kg', dotValue: 1, column: 3, colRow: 0 },
  { id: 'cukier', name: 'Cukier', category: 'Produkty sypkie', rowIndex: 42, maxDots: 5, unit: '1 kg', dotValue: 1, column: 3, colRow: 1 },
  { id: 'makaron_swiderki', name: 'Makaron świderki', category: 'Produkty sypkie', rowIndex: 43, maxDots: 5, unit: '500 g', dotValue: 500, column: 3, colRow: 2 },
  { id: 'makaron_spaghetti', name: 'Makaron spaghetti', category: 'Produkty sypkie', rowIndex: 44, maxDots: 5, unit: '500 g', dotValue: 500, column: 3, colRow: 3 },
  { id: 'ryz', name: 'Ryż', category: 'Produkty sypkie', rowIndex: 45, maxDots: 5, unit: '400 g', dotValue: 400, column: 3, colRow: 4 },
  { id: 'kasza_gryczana', name: 'Kasza gryczana', category: 'Produkty sypkie', rowIndex: 46, maxDots: 5, unit: '400 g', dotValue: 400, column: 3, colRow: 5 },
  { id: 'kasza_jeczmienna', name: 'Kasza jęczmienna', category: 'Produkty sypkie', rowIndex: 47, maxDots: 5, unit: '400 g', dotValue: 400, column: 3, colRow: 6 },
  { id: 'platki_owsiane', name: 'Płatki owsiane', category: 'Produkty sypkie', rowIndex: 48, maxDots: 5, unit: '500 g', dotValue: 500, column: 3, colRow: 7 },
  { id: 'platki_na_mleko', name: 'Płatki na mleko', category: 'Produkty sypkie', rowIndex: 49, maxDots: 5, unit: '500 g', dotValue: 500, column: 3, colRow: 8 },
  { id: 'bulka_tarta', name: 'Bułka tarta', category: 'Produkty sypkie', rowIndex: 50, maxDots: 5, unit: '500 g', dotValue: 500, column: 3, colRow: 9 },
  { id: 'olej', name: 'Olej', category: 'Produkty sypkie', rowIndex: 51, maxDots: 5, unit: '1 L', dotValue: 1, column: 3, colRow: 10 },
  { id: 'passata', name: 'Passata', category: 'Konserwy', rowIndex: 52, maxDots: 5, unit: '500 g', dotValue: 500, column: 3, colRow: 11 },
  { id: 'groszek', name: 'Groszek', category: 'Konserwy', rowIndex: 53, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 12 },
  { id: 'kukurydza', name: 'Kukurydza', category: 'Konserwy', rowIndex: 54, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 13 },
  { id: 'tunczyk', name: 'Tuńczyk', category: 'Konserwy', rowIndex: 55, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 14 },
  { id: 'fasola', name: 'Fasola', category: 'Konserwy', rowIndex: 56, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 15 },
  { id: 'ketchup', name: 'Ketchup', category: 'Sosy', rowIndex: 57, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 3, colRow: 16 },
  { id: 'majonez', name: 'Majonez', category: 'Sosy', rowIndex: 58, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 3, colRow: 17 },
  { id: 'musztarda', name: 'Musztarda', category: 'Sosy', rowIndex: 59, maxDots: 5, unit: '1 szt.', dotValue: 1, column: 3, colRow: 18 },
  { id: 'sol', name: 'Sól', category: 'Przyprawy', rowIndex: 60, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 19 },
  { id: 'pieprz', name: 'Pieprz', category: 'Przyprawy', rowIndex: 61, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 20 },
  { id: 'papryka_slodka', name: 'Papryka słodka', category: 'Przyprawy', rowIndex: 62, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 21 },
  { id: 'papryka_ostra', name: 'Papryka ostra', category: 'Przyprawy', rowIndex: 63, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 22 },
  { id: 'czosnek_granulowany', name: 'Czosnek granulowany', category: 'Przyprawy', rowIndex: 64, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 23 },
  { id: 'ziola_prowansalskie', name: 'Zioła prowansalskie', category: 'Przyprawy', rowIndex: 65, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 24 },
  { id: 'oregano', name: 'Oregano', category: 'Przyprawy', rowIndex: 66, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 25 },
  { id: 'przyprawa_do_kurczaka', name: 'Przyprawa do kurczaka', category: 'Przyprawy', rowIndex: 67, maxDots: 5, unit: '1 op.', dotValue: 1, column: 3, colRow: 26 },
];

/*
 * Tłumaczenia kategorii i produktów na język francuski (FSE)
 */
export const CATEGORIES_FR: Record<string, string> = {
  'Owoce': 'FRUITS',
  'Warzywa': 'LÉGUMES',
  'Pieczywo': 'BOULANGERIE',
  'Mięso': 'VIANDES',
  'Wędliny': 'CHARCUTERIE',
  'Nabiał': 'PRODUITS LAITIERS',
  'Produkty sypkie': 'ÉPICERIE',
  'Konserwy': 'CONSERVES',
  'Sosy': 'SAUCES',
  'Przyprawy': 'ÉPICES',
};

export const ITEM_TRANSLATIONS_FR: Record<string, { name: string; unit: string }> = {
  jablka: { name: 'Pommes', unit: '2 pcs' },
  banany: { name: 'Bananes', unit: '2 pcs' },
  nektarynka: { name: 'Nectarines', unit: '2 pcs' },
  arbuz: { name: 'Pastèque', unit: '1 kg' },
  ziemniaki: { name: 'Pommes de terre', unit: '500 g' },
  cebula: { name: 'Oignons', unit: '1 pc' },
  marchew: { name: 'Carottes', unit: '2 pcs' },
  pietruszka: { name: 'Panais / Persil', unit: '1 pc' },
  pomidory: { name: 'Tomates', unit: '2 pcs' },
  ogorki: { name: 'Concombres', unit: '2 pcs' },
  papryka: { name: 'Poivrons', unit: '1 pc' },
  czosnek: { name: 'Ail (tête)', unit: '1 tête' },
  salata_mix: { name: 'Salade mix', unit: '1 pqt' },
  salata_glowka: { name: 'Salade (pomme)', unit: '1 pc' },
  pieczarki: { name: 'Champignons', unit: '250 g' },
  brokuly: { name: 'Brocoli', unit: '1 pc' },
  chleb: { name: 'Pain', unit: '1 pc' },
  chleb_tostowy: { name: 'Pain de mie', unit: '1 pqt' },
  bulki: { name: 'Petits pains', unit: '4 pcs' },
  tortilla: { name: 'Galettes / Tortillas', unit: '1 pqt' },
  piers_z_kurczaka: { name: 'Blanc de poulet', unit: '400 g' },
  mieso_mielone: { name: 'Viande hachée', unit: '400 g' },
  schab: { name: 'Côtes de porc', unit: '400 g' },
  udka_z_kurczaka: { name: 'Cuisses de poulet', unit: '2 pcs' },
  skrzydelka_z_kurczaka: { name: 'Ailes de poulet', unit: '500 g' },
  watrobka: { name: 'Foie de volaille', unit: '400 g' },
  boczek: { name: 'Lardons / Poitrine', unit: '200 g' },
  parowki: { name: 'Saucisses Strasbourg', unit: '4 pcs' },
  szynka: { name: 'Jambon blanc', unit: '150 g' },
  kielbasa: { name: 'Saucisses fumées', unit: '2 pcs' },
  mleko: { name: 'Lait', unit: '1 L' },
  maslo: { name: 'Beurre', unit: '1 pc' },
  jajka: { name: 'Œufs', unit: '4 pcs' },
  ser_zolty_plasterki: { name: 'Fromage en tranches', unit: '150 g' },
  ser_zolty_kostka: { name: 'Fromage en bloc', unit: '250 g' },
  twarog: { name: 'Fromage blanc', unit: '250 g' },
  smietana_18: { name: 'Crème fraîche 18%', unit: '1 pot' },
  smietanka_30: { name: 'Crème liquide 30%', unit: '1 pot' },
  jogurt_naturalny: { name: 'Yaourt nature', unit: '1 pot' },
  serek_wiejski: { name: 'Cottage cheese', unit: '1 pot' },
  jogurt_smakowe: { name: 'Yaourts aux fruits', unit: '2 pcs' },
  maka_pszenna: { name: 'Farine de blé', unit: '1 kg' },
  cukier: { name: 'Sucre', unit: '1 kg' },
  makaron_swiderki: { name: 'Pâtes torsades', unit: '500 g' },
  makaron_spaghetti: { name: 'Spaghetti', unit: '500 g' },
  ryz: { name: 'Riz', unit: '400 g' },
  kasza_gryczana: { name: 'Sarrasin', unit: '400 g' },
  kasza_jeczmienna: { name: 'Orge perlé', unit: '400 g' },
  platki_owsiane: { name: 'Flocons d\'avoine', unit: '500 g' },
  platki_na_mleko: { name: 'Céréales', unit: '500 g' },
  bulka_tarta: { name: 'Chapelure', unit: '500 g' },
  olej: { name: 'Huile', unit: '1 L' },
  passata: { name: 'Coulis de tomates', unit: '500 g' },
  groszek: { name: 'Petits pois', unit: '1 boîte' },
  kukurydza: { name: 'Maïs doux', unit: '1 boîte' },
  tunczyk: { name: 'Thon en boîte', unit: '1 boîte' },
  fasola: { name: 'Haricots rouges', unit: '1 boîte' },
  ketchup: { name: 'Ketchup', unit: '1 flac.' },
  majonez: { name: 'Mayonnaise', unit: '1 pot' },
  musztarda: { name: 'Moutarde', unit: '1 pot' },
  sol: { name: 'Sel', unit: '1 pqt' },
  pieprz: { name: 'Poivre', unit: '1 pqt' },
  papryka_slodka: { name: 'Paprika doux', unit: '1 pqt' },
  papryka_ostra: { name: 'Paprika fort', unit: '1 pqt' },
  czosnek_granulowany: { name: 'Ail moulu', unit: '1 pqt' },
  ziola_prowansalskie: { name: 'Herbes de Provence', unit: '1 pqt' },
  oregano: { name: 'Origan', unit: '1 pqt' },
  przyprawa_do_kurczaka: { name: 'Épices poulet', unit: '1 pqt' },
};

/*
 * Oblicza całkowitą ilość produktu na podstawie liczby zaznaczonych kółek.
 * Wzór: totalQuantity = dots × item.dotValue
 */
export function computeQuantity(dots: number, item: ListItem): number {
  return dots * item.dotValue;
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

export interface CategoryBlock {
  name: string;
  column: 1 | 2 | 3;
  colIndex: number;
  items: ListItem[];
  itemCount: number;
  startRowIdx: number;
}

export const CATEGORY_BLOCKS: CategoryBlock[] = [];

for (let col = 1; col <= 3; col++) {
  const colIndex = col - 1;
  const colCats = CATEGORIES.filter(cat => LIST_ITEMS.some(li => li.category === cat && li.column === col));
  let curRowIdx = 0;
  for (const cat of colCats) {
    const items = LIST_ITEMS.filter(li => li.category === cat && li.column === col);
    CATEGORY_BLOCKS.push({
      name: cat,
      column: col as 1 | 2 | 3,
      colIndex,
      items,
      itemCount: items.length,
      startRowIdx: curRowIdx,
    });
    curRowIdx += 1 + items.length;
  }
}

// ---------------------------------------------------------------------------
// STAŁE GEOMETRII OMR v2.0 (w milimetrach)
// ---------------------------------------------------------------------------
export const OMR_GEOMETRY = {
  PAGE_W_MM: 210,
  PAGE_H_MM: 297,

  // Wymiary bazowe znormalizowanego obrazu (px)
  CANONICAL_W: 1600,
  CANONICAL_H: 2263, // 1600 * (297 / 210)

  // Sekcja Kodu Binarnego Zastępu (4 kropki: 1, 2, 4, 8 dla 15 zastępów)
  SQUAD: {
    ROW_Y_MM: 11.75,
    BUBBLE_RADIUS_MM: 2.4, // 4.8mm średnicy
    COUNT: 4,
    // Pozycje X środków 4 kółek zastępów
    BUBBLES_X_MM: [45.0, 53.0, 61.0, 69.0],
  },

  // Siatka kolumn
  COLUMNS: {
    ROW_START_Y_MM: 21.8, // Pierwszy wiersz (Owoce / Mięso / Produkty sypkie)
    ROW_H_MM: 7.6,         // Powiększony raster każdego wiersza

    // Lewa i prawa krawędź treści dla każdej kolumny
    COLS: [
      { leftMm: 10.0, rightMm: 70.67, timingX: 11.7 },
      { leftMm: 74.67, rightMm: 135.34, timingX: 76.37 },
      { leftMm: 139.34, rightMm: 200.0, timingX: 141.04 },
    ],

    // Pozycje 5 kratek OMR mierzone od prawej krawędzi kolumny
    // cb5 (najbardziej po prawej) do cb1 (najbardziej po lewej)
    CB_RADIUS_MM: 2.45, // 4.9mm średnicy
    CB_FROM_RIGHT_MM: [32.45, 27.05, 21.65, 16.25, 10.85],
  },
};
