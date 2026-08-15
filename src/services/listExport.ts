import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ShoppingList, ListItem } from '../types';
import { LIST_ITEMS, CATEGORIES, formatTotalQuantity } from '../constants/listTemplate';

export interface AggregatedItem {
  item: ListItem;
  dots: number; // suma kółek ze wszystkich zastępów
  amount: string; // sformatowana ilość końcowa, np. '1,5 kg'
}

/*
 * Agreguje skany listy: suma kółek per artykuł ze wszystkich zastępów.
 * Ilość końcowa = suma_kółek × dotValue (liniowe, więc sumowanie kółek
 * przed przeliczeniem daje ten sam wynik).
 */
export function aggregateList(list: ShoppingList): AggregatedItem[] {
  const dotsByItem = new Map<string, number>();
  for (const scan of list.scans) {
    for (const si of scan.items) {
      dotsByItem.set(si.itemId, (dotsByItem.get(si.itemId) ?? 0) + si.quantity);
    }
  }
  return LIST_ITEMS.filter((li) => (dotsByItem.get(li.id) ?? 0) > 0).map((li) => {
    const dots = dotsByItem.get(li.id) ?? 0;
    return { item: li, dots, amount: formatTotalQuantity(li, dots) };
  });
}

/*
 * Buduje treść pliku .txt: zagregowane ilości pogrupowane wg kategorii.
 */
export function buildTxt(list: ShoppingList): string {
  const agg = aggregateList(list);
  const scannedSquads = [...list.scans].map((s) => s.squadId).sort((a, b) => a - b);

  const created = new Date(list.createdAt);
  const stamp = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;

  const lines: string[] = [];
  lines.push(list.name);
  lines.push(`Data: ${stamp}`);
  lines.push(`Zastępy (${list.scans.length}): ${scannedSquads.join(', ') || '—'}`);
  lines.push('');

  const nameWidth = Math.max(...agg.map((a) => a.item.name.length), 10) + 2;
  for (const cat of CATEGORIES) {
    const catItems = agg.filter((a) => a.item.category === cat);
    if (catItems.length === 0) continue;
    lines.push(`== ${cat.toUpperCase()} ==`);
    for (const a of catItems) {
      lines.push(`${a.item.name.padEnd(nameWidth)}${a.amount}`);
    }
    lines.push('');
  }

  if (agg.length === 0) lines.push('(pusta lista)');
  return lines.join('\n');
}

/** Nazwa pliku bez polskich znaków i spacji */
export function txtFileName(list: ShoppingList): string {
  const pl: Record<string, string> = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  };
  const slug = list.name
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => pl[m])
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${slug || 'lista_zakupow'}.txt`;
}

/*
 * Zapisuje zagregowaną listę do pliku .txt i otwiera arkusz udostępniania
 * (zapis do Plików, wysyłka itd.).
 */
export async function exportListTxt(list: ShoppingList): Promise<void> {
  const content = buildTxt(list);
  const file = new File(Paths.cache, txtFileName(list));
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/plain',
      dialogTitle: list.name,
    });
  }
}
