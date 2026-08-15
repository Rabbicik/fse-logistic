import { useState, useEffect, useCallback } from 'react';
import { Scan, Squad, ShoppingList } from '../types';
import {
  loadLists,
  saveLists,
  loadActiveListId,
  saveActiveListId,
  loadSquads,
  saveSquads,
  newShoppingList,
} from '../services/storage';

/*
 * Stan aplikacji: nazwane listy zakupów + zastępy.
 * `scans` to skany AKTYWNEJ listy (maks. jeden na zastęp) — ekrany
 * agregują właśnie po nich. addScan nadpisuje istniejący skan zastępu.
 */
export function useScans() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [ls, activeId, sq] = await Promise.all([
      loadLists(),
      loadActiveListId(),
      loadSquads(),
    ]);
    setLists(ls || []);
    setActiveListId(activeId && ls.some((l) => l.id === activeId) ? activeId : ls[0]?.id ?? null);
    setSquads(sq || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeList = lists.find((l) => l.id === activeListId) ?? null;
  const scans: Scan[] = activeList?.scans ?? [];

  const persist = useCallback(async (nextLists: ShoppingList[], nextActiveId?: string) => {
    setLists(nextLists);
    await saveLists(nextLists);
    if (nextActiveId !== undefined) {
      setActiveListId(nextActiveId);
      await saveActiveListId(nextActiveId);
    }
  }, []);

  /** Tworzy nową listę (domyślna nazwa: lista_zakupów_RRRRMMDD) i aktywuje ją */
  const createList = useCallback(
    async (name?: string): Promise<ShoppingList> => {
      const list = newShoppingList(name);
      await persist([list, ...lists], list.id);
      return list;
    },
    [lists, persist]
  );

  const selectList = useCallback(
    async (id: string) => {
      if (!lists.some((l) => l.id === id)) return;
      setActiveListId(id);
      await saveActiveListId(id);
    },
    [lists]
  );

  const deleteList = useCallback(
    async (id: string) => {
      const next = lists.filter((l) => l.id !== id);
      const nextActive = activeListId === id ? next[0]?.id ?? null : activeListId;
      await persist(next, nextActive ?? undefined);
      if (nextActive === null) setActiveListId(null);
    },
    [lists, activeListId, persist]
  );

  /** Czy aktywna lista ma już skan tego zastępu (skan nadpisze poprzedni)? */
  const hasScanForSquad = useCallback(
    (squadId: number) => scans.some((s) => s.squadId === squadId),
    [scans]
  );

  /**
   * Dodaje skan do aktywnej listy. Skan tego samego zastępu NADPISUJE
   * poprzedni. Gdy nie ma żadnej listy — tworzy nową z domyślną nazwą.
   * Zwraca true, jeśli nadpisano wcześniejszy skan.
   */
  const addScan = useCallback(
    async (scan: Scan): Promise<boolean> => {
      let target = activeList;
      let base = lists;
      let activeId = activeListId ?? undefined;
      if (!target) {
        target = newShoppingList();
        base = [target, ...lists];
        activeId = target.id;
      }
      const replaced = target.scans.some((s) => s.squadId === scan.squadId);
      const updated: ShoppingList = {
        ...target,
        scans: [scan, ...target.scans.filter((s) => s.squadId !== scan.squadId)],
      };
      await persist(base.map((l) => (l.id === updated.id ? updated : l)), activeId);
      return replaced;
    },
    [lists, activeList, activeListId, persist]
  );

  const removeScan = useCallback(
    async (scanId: string) => {
      if (!activeList) return;
      const updated = { ...activeList, scans: activeList.scans.filter((s) => s.id !== scanId) };
      await persist(lists.map((l) => (l.id === updated.id ? updated : l)));
    },
    [lists, activeList, persist]
  );

  const updateSquads = useCallback(async (updated: Squad[]) => {
    await saveSquads(updated);
    setSquads(updated);
  }, []);

  const getScansForSquad = useCallback(
    (squadId: number) => scans.filter((s) => s.squadId === squadId),
    [scans]
  );

  return {
    lists,
    activeList,
    scans,
    squads,
    loading,
    refresh,
    createList,
    selectList,
    deleteList,
    hasScanForSquad,
    addScan,
    removeScan,
    updateSquads,
    getScansForSquad,
  };
}
