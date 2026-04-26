import type { ExportShape } from '../types';

export interface SyncConfig {
  url: string;
  token?: string;
}

export interface SyncEnvelope {
  updatedAt: number;
  data: ExportShape;
}

async function request(cfg: SyncConfig, init: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (cfg.token) headers['Authorization'] = `Bearer ${cfg.token}`;
  return fetch(cfg.url, { ...init, headers });
}

export async function push(cfg: SyncConfig, data: ExportShape): Promise<void> {
  const envelope: SyncEnvelope = { updatedAt: Date.now(), data };
  const res = await request(cfg, { method: 'PUT', body: JSON.stringify(envelope) });
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);
}

export async function pull(cfg: SyncConfig): Promise<SyncEnvelope | null> {
  const res = await request(cfg, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  const raw = await res.json();
  if (!raw || typeof raw !== 'object') return null;
  // Accept envelope or bare export shape
  if ('updatedAt' in raw && 'data' in raw) return raw as SyncEnvelope;
  return { updatedAt: 0, data: raw as ExportShape };
}
