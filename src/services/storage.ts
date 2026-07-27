import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scan, Squad } from '../types';
import { DEFAULT_SQUADS } from '../constants/listTemplate';

const KEYS = {
  SCANS: 'fse_scans',
  SQUADS: 'fse_squads',
};

export async function loadScans(): Promise<Scan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SCANS);
    if (!raw) return [];
    return JSON.parse(raw) as Scan[];
  } catch {
    return [];
  }
}

export async function saveScan(scan: Scan): Promise<void> {
  const existing = await loadScans();
  const updated = [scan, ...existing];
  await AsyncStorage.setItem(KEYS.SCANS, JSON.stringify(updated));
}

export async function deleteScan(scanId: string): Promise<void> {
  const existing = await loadScans();
  const updated = existing.filter((s) => s.id !== scanId);
  await AsyncStorage.setItem(KEYS.SCANS, JSON.stringify(updated));
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
  await AsyncStorage.multiRemove([KEYS.SCANS, KEYS.SQUADS]);
}
