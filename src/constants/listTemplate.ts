import { ListItem, Squad } from '../types';

/*
 * Definicja artykułów listy zaopatrzenia FSE.
 * column: numer kolumny wydruku (1=lewa, 2=środek, 3=prawa)
 * colRow: wiersz wewnątrz kolumny (0-based, licząc od pierwszego produktu, pomijając nagłówki kategorii)
 * Układ odpowiada plikowi lista_zaopatrzenia.html (trzy kolumny na jednej stronie A4)
 */
export const LIST_ITEMS: ListItem[] = [
  // ── KOLUMNA 1: Napoje, Mięso, Pieczywo, Nabiał ──
  { id: 'water_still',  name: 'Woda niegazowana',       category: 'Napoje',            rowIndex: 0,  maxDots: 5, unit: '0,5 L',   column: 1, colRow: 0 },
  { id: 'water_sparkling', name: 'Woda gazowana',        category: 'Napoje',            rowIndex: 1,  maxDots: 5, unit: '1,5 L',   column: 1, colRow: 1 },
  { id: 'juice',        name: 'Sok owocowy',             category: 'Napoje',            rowIndex: 2,  maxDots: 5, unit: '1 L',     column: 1, colRow: 2 },
  { id: 'tea',          name: 'Herbata ekspresowa',      category: 'Napoje',            rowIndex: 3,  maxDots: 5, unit: '100 szt.',column: 1, colRow: 3 },
  { id: 'chicken',      name: 'Pierś z kurczaka',        category: 'Mięso',             rowIndex: 4,  maxDots: 5, unit: '200 g',   column: 1, colRow: 4 },
  { id: 'sausage',      name: 'Kiełbasa',                category: 'Mięso',             rowIndex: 5,  maxDots: 5, unit: '200 g',   column: 1, colRow: 5 },
  { id: 'ham',          name: 'Szynka / Wędlina',        category: 'Mięso',             rowIndex: 6,  maxDots: 5, unit: '200 g',   column: 1, colRow: 6 },
  { id: 'bread',        name: 'Chleb',                   category: 'Pieczywo',          rowIndex: 7,  maxDots: 5, unit: '1 szt.', column: 1, colRow: 7 },
  { id: 'rolls',        name: 'Bułki',                   category: 'Pieczywo',          rowIndex: 8,  maxDots: 5, unit: '6 szt.', column: 1, colRow: 8 },
  { id: 'butter',       name: 'Masło',                   category: 'Nabiał',            rowIndex: 9,  maxDots: 5, unit: '200 g',   column: 1, colRow: 9 },
  { id: 'milk',         name: 'Mleko',                   category: 'Nabiał',            rowIndex: 10, maxDots: 5, unit: '1 L',     column: 1, colRow: 10 },
  { id: 'cheese',       name: 'Ser żółty',               category: 'Nabiał',            rowIndex: 11, maxDots: 5, unit: '200 g',   column: 1, colRow: 11 },
  { id: 'eggs',         name: 'Jajka',                   category: 'Nabiał',            rowIndex: 12, maxDots: 5, unit: '10 szt.',column: 1, colRow: 12 },

  // ── KOLUMNA 2: Suche/Konserwy, Słodycze, Warzywa ──
  { id: 'pasta',        name: 'Makaron',                 category: 'Suche / Konserwy',  rowIndex: 13, maxDots: 5, unit: '400 g',   column: 2, colRow: 0 },
  { id: 'rice',         name: 'Ryż',                     category: 'Suche / Konserwy',  rowIndex: 14, maxDots: 5, unit: '500 g',   column: 2, colRow: 1 },
  { id: 'groats',       name: 'Kasza',                   category: 'Suche / Konserwy',  rowIndex: 15, maxDots: 5, unit: '400 g',   column: 2, colRow: 2 },
  { id: 'cans',         name: 'Konserwy mięsne',         category: 'Suche / Konserwy',  rowIndex: 16, maxDots: 5, unit: '1 szt.', column: 2, colRow: 3 },
  { id: 'beans',        name: 'Fasola / Groch',          category: 'Suche / Konserwy',  rowIndex: 17, maxDots: 5, unit: '400 g',   column: 2, colRow: 4 },
  { id: 'tomato',       name: 'Przecier pomidorowy',     category: 'Suche / Konserwy',  rowIndex: 18, maxDots: 5, unit: '500 g',   column: 2, colRow: 5 },
  { id: 'chocolate',    name: 'Czekolada',               category: 'Słodycze / Przekąski', rowIndex: 19, maxDots: 5, unit: '100 g', column: 2, colRow: 6 },
  { id: 'crackers',     name: 'Herbatniki / Ciastka',    category: 'Słodycze / Przekąski', rowIndex: 20, maxDots: 5, unit: '200 g', column: 2, colRow: 7 },
  { id: 'jam',          name: 'Dżem / Nutella',          category: 'Słodycze / Przekąski', rowIndex: 21, maxDots: 5, unit: '250 g', column: 2, colRow: 8 },
  { id: 'fruit',        name: 'Owoce (mix)',             category: 'Warzywa i Owoce',   rowIndex: 22, maxDots: 5, unit: '1 kg',   column: 2, colRow: 9 },
  { id: 'vegetables',   name: 'Warzywa (mix)',           category: 'Warzywa i Owoce',   rowIndex: 23, maxDots: 5, unit: '1 kg',   column: 2, colRow: 10 },
  { id: 'potato',       name: 'Ziemniaki',               category: 'Warzywa i Owoce',   rowIndex: 24, maxDots: 5, unit: '2 kg',   column: 2, colRow: 11 },

  // ── KOLUMNA 3: Przyprawy, Sprzęt, Higieniczne ──
  { id: 'salt',         name: 'Sól / Pieprz / Przyp.',  category: 'Przyprawy',         rowIndex: 25, maxDots: 5, unit: '1 kpl.', column: 3, colRow: 0 },
  { id: 'oil',          name: 'Olej / Oliwa',           category: 'Przyprawy',         rowIndex: 26, maxDots: 5, unit: '500 ml', column: 3, colRow: 1 },
  { id: 'sauce',        name: 'Sos / Ketchup',          category: 'Przyprawy',         rowIndex: 27, maxDots: 5, unit: '1 szt.', column: 3, colRow: 2 },
  { id: 'plates',       name: 'Talerze jednorazowe',    category: 'Sprzęt jednorazowy',rowIndex: 28, maxDots: 5, unit: '10 szt.',column: 3, colRow: 3 },
  { id: 'cutlery',      name: 'Sztućce jednorazowe',    category: 'Sprzęt jednorazowy',rowIndex: 29, maxDots: 5, unit: '10 kpl.',column: 3, colRow: 4 },
  { id: 'cups',         name: 'Kubki jednorazowe',      category: 'Sprzęt jednorazowy',rowIndex: 30, maxDots: 5, unit: '10 szt.',column: 3, colRow: 5 },
  { id: 'foil',         name: 'Folia aluminiowa',       category: 'Sprzęt jednorazowy',rowIndex: 31, maxDots: 5, unit: '1 rol.', column: 3, colRow: 6 },
  { id: 'gas',          name: 'Gaz do kuchenki',        category: 'Sprzęt jednorazowy',rowIndex: 32, maxDots: 5, unit: '1 szt.', column: 3, colRow: 7 },
  { id: 'trash_bags',   name: 'Worki na śmieci',        category: 'Higieniczne',       rowIndex: 33, maxDots: 5, unit: '10 szt.',column: 3, colRow: 8 },
  { id: 'soap',         name: 'Mydło / Żel',            category: 'Higieniczne',       rowIndex: 34, maxDots: 5, unit: '1 szt.', column: 3, colRow: 9 },
  { id: 'toilet_paper', name: 'Papier toaletowy',       category: 'Higieniczne',       rowIndex: 35, maxDots: 5, unit: '4 rol.', column: 3, colRow: 10 },
];

export const CATEGORIES = [
  'Napoje',
  'Mięso',
  'Pieczywo',
  'Nabiał',
  'Suche / Konserwy',
  'Słodycze / Przekąski',
  'Warzywa i Owoce',
  'Przyprawy',
  'Sprzęt jednorazowy',
  'Higieniczne',
];

export const SQUAD_COLORS = [
  '#FF6B35',
  '#F7C59F',
  '#1DAFEC',
  '#A8E6CE',
  '#FF8B94',
  '#B4A7D6',
  '#FFD93D',
  '#6BCB77',
];

export const DEFAULT_SQUADS: Squad[] = [
  { id: 1, name: 'Zastęp 1', color: SQUAD_COLORS[0] },
  { id: 2, name: 'Zastęp 2', color: SQUAD_COLORS[1] },
  { id: 3, name: 'Zastęp 3', color: SQUAD_COLORS[2] },
  { id: 4, name: 'Zastęp 4', color: SQUAD_COLORS[3] },
  { id: 5, name: 'Zastęp 5', color: SQUAD_COLORS[4] },
];

export const ID_DOT_COUNT = 10;
