import { useState, useEffect, useCallback } from 'react';
import { Scan, Squad } from '../types';
import { loadScans, saveScan, deleteScan, loadSquads, saveSquads } from '../services/storage';

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, sq] = await Promise.all([loadScans(), loadSquads()]);
    setScans(s || []);
    setSquads(sq || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addScan = useCallback(async (scan: Scan) => {
    await saveScan(scan);
    setScans((prev) => [scan, ...prev]);
  }, []);

  const removeScan = useCallback(async (scanId: string) => {
    await deleteScan(scanId);
    setScans((prev) => prev.filter((s) => s.id !== scanId));
  }, []);

  const updateSquads = useCallback(async (updated: Squad[]) => {
    await saveSquads(updated);
    setSquads(updated);
  }, []);

  const getScansForSquad = useCallback(
    (squadId: number) => scans.filter((s) => s.squadId === squadId),
    [scans]
  );

  return {
    scans,
    squads,
    loading,
    refresh,
    addScan,
    removeScan,
    updateSquads,
    getScansForSquad,
  };
}
