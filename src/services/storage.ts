import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scan, Squad, ShoppingList } from '../types';
import { DEFAULT_SQUADS } from '../constants/listTemplate';

const KEYS = {
  /** stary format (płaska lista skanów) — tylko do migracji */
  LEGACY_SCANS: 'fse_scans',
  LISTS: 'fse_lists',
  ACTIVE_LIST: 'fse_active_list_id',
  SQUADS: 'fse_squads',
};

export function defaultListName(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `lista_zakupów_${y}${m}${d}`;
}

export function newShoppingList(name?: string): ShoppingList {
  return {
    id: `list_${Date.now()}`,
    name: (name && name.trim()) || defaultListName(),
    createdAt: new Date().toISOString(),
    scans: [],
  };
}

/*
 * Ładuje listy zakupów. Jednorazowo migruje stary płaski magazyn skanów
 * (fse_scans) do pierwszej nazwanej listy.
 */
export async function loadLists(): Promise<ShoppingList[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LISTS);
    if (raw) return JSON.parse(raw) as ShoppingList[];

    const legacyRaw = await AsyncStorage.getItem(KEYS.LEGACY_SCANS);
    if (legacyRaw) {
      const legacyScans = JSON.parse(legacyRaw) as Scan[];
      // stary format mógł mieć wiele skanów na zastęp — zostaw najnowszy
      const bySquad = new Map<number, Scan>();
      for (const s of [...legacyScans].reverse()) bySquad.set(s.squadId, s);
      const migrated: ShoppingList = { ...newShoppingList(), scans: [...bySquad.values()] };
      await saveLists([migrated]);
      await saveActiveListId(migrated.id);
      await AsyncStorage.removeItem(KEYS.LEGACY_SCANS);
      return [migrated];
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveLists(lists: ShoppingList[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.LISTS, JSON.stringify(lists));
}

export async function loadActiveListId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.ACTIVE_LIST);
  } catch {
    return null;
  }
}

export async function saveActiveListId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE_LIST, id);
}

export async function loadSquads(): Promise<Squad[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SQUADS);
    if (!raw) return DEFAULT_SQUADS;
    return JSON.parse(raw) as Squad[];
  } catch {
    return DEFAULT_SQUADS;
  }
}

export async function saveSquads(squads: Squad[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SQUADS, JSON.stringify(squads));
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.LEGACY_SCANS,
    KEYS.LISTS,
    KEYS.ACTIVE_LIST,
    KEYS.SQUADS,
  ]);
}
