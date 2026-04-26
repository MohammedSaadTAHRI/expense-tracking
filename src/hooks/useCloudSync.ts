import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExportShape } from '../types';
import { pull, push, type SyncConfig } from '../lib/sync';

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'off';

interface Options {
  cfg: SyncConfig | null;
  buildExport: () => ExportShape;
  applyImport: (data: ExportShape) => void;
  snapshotKey: string; // any string that changes whenever state changes (for auto-push)
}

const PUSH_DEBOUNCE_MS = 2000;

export function useCloudSync({ cfg, buildExport, applyImport, snapshotKey }: Options) {
  const [status, setStatus] = useState<SyncStatus>(cfg ? 'idle' : 'off');
  const [error, setError] = useState<string | null>(null);
  const pushTimer = useRef<number | null>(null);
  const hasPulledRef = useRef(false);
  const suppressAutoPushRef = useRef(false);

  const syncNow = useCallback(async () => {
    if (!cfg) return;
    setStatus('syncing');
    setError(null);
    try {
      await push(cfg, buildExport());
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }, [cfg, buildExport]);

  const pullNow = useCallback(async () => {
    if (!cfg) return;
    setStatus('syncing');
    setError(null);
    try {
      const env = await pull(cfg);
      if (env?.data) {
        suppressAutoPushRef.current = true;
        applyImport(env.data);
        queueMicrotask(() => { suppressAutoPushRef.current = false; });
      }
      setStatus('ok');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }, [cfg, applyImport]);

  // Initial pull
  useEffect(() => {
    if (!cfg) {
      setStatus('off');
      hasPulledRef.current = false;
      return;
    }
    if (hasPulledRef.current) return;
    hasPulledRef.current = true;
    pullNow();
  }, [cfg, pullNow]);

  // Debounced auto-push on state change
  useEffect(() => {
    if (!cfg || !hasPulledRef.current || suppressAutoPushRef.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      syncNow();
    }, PUSH_DEBOUNCE_MS);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [snapshotKey, cfg, syncNow]);

  return { status, error, syncNow, pullNow };
}
