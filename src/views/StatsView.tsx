import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { CategoryKey, Expense, ExportShape } from '../types';
import type { Dict, Lang } from '../i18n';
import type { Currency } from '../lib/money';
import type { SyncConfig } from '../lib/sync';
import type { SyncStatus } from '../hooks/useCloudSync';
import { CURRENCIES, formatMoney, currencySymbol } from '../lib/money';
import TrendsChart from '../components/TrendsChart';
import { supportsNotifications } from '../lib/notifications';

interface Props {
  t: Dict;
  lang: Lang;
  currency: Currency;
  total: number;
  monthTotal: number;
  byCat: Record<string, number>;
  expenses: Expense[];
  notifyEnabled: boolean;
  syncConfig: SyncConfig | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  onSaveSync: (cfg: SyncConfig | null) => void;
  onSyncNow: () => void;
  onPullNow: () => void;
  onToggleNotify: () => void;
  onCurrencyChange: (c: Currency) => void;
  onExport: () => ExportShape;
  onImport: (data: ExportShape) => void;
  onClear: () => void;
}

export default function StatsView({
  t, lang, currency, total, monthTotal, byCat, expenses,
  notifyEnabled, onToggleNotify,
  syncConfig, syncStatus, syncError,
  onSaveSync, onSyncNow, onPullNow,
  onCurrencyChange, onExport, onImport, onClear,
}: Props) {
  const [syncUrl, setSyncUrl] = useState(syncConfig?.url ?? '');
  const [syncToken, setSyncToken] = useState(syncConfig?.token ?? '');
  const fileRef = useRef<HTMLInputElement>(null);
  const max = Math.max(1, ...Object.values(byCat));
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const doExport = () => {
    const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportShape;
      if (!parsed.version || !Array.isArray(parsed.expenses)) throw new Error('shape');
      onImport(parsed);
      alert(t.settings.importOk);
    } catch {
      alert(t.settings.importFail);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doClear = () => {
    if (confirm(t.settings.confirmClear)) onClear();
  };

  return (
    <section className="stack">
      <div className="grid-two">
        <div className="summary-card">
          <span>{t.thisMonth}</span>
          <strong>{formatMoney(monthTotal, currency, lang)}</strong>
        </div>
        <div className="summary-card alt">
          <span>{t.total}</span>
          <strong>{formatMoney(total, currency, lang)}</strong>
        </div>
      </div>

      <div className="card">
        <h3>{t.trends}</h3>
        <TrendsChart expenses={expenses} lang={lang} currency={currency} t={t} />
      </div>

      <div className="card">
        <h3>{t.byCategory}</h3>
        {entries.length === 0 && <p className="empty">{t.noExpenses}</p>}
        <div className="bars">
          {entries.map(([k, v]) => (
            <div key={k} className="bar-row">
              <span className="bar-label">{t.categories[k as CategoryKey]}</span>
              <div className="bar-track">
                <div className={`bar-fill chip-${k}`} style={{ width: `${(v / max) * 100}%` }} />
              </div>
              <span className="bar-val">{formatMoney(v, currency, lang)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>{t.settings.title}</h3>
        <div className="settings-row">
          <label>{t.settings.currency}</label>
          <select value={currency} onChange={e => onCurrencyChange(e.target.value as Currency)}>
            {CURRENCIES.map(c => (
              <option key={c} value={c}>{c} ({currencySymbol(c)})</option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <button className="pill" onClick={doExport}>{t.settings.export}</button>
          <button className="pill" onClick={() => fileRef.current?.click()}>{t.settings.import}</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={doImport}
          />
        </div>
        <div className="settings-row">
          <button className="pill danger" onClick={doClear}>{t.settings.clear}</button>
        </div>
      </div>

      <div className="card">
        <h3>{t.sync.title}</h3>
        <p className="hint">{t.sync.hint}</p>
        <div className="form" style={{ marginTop: '0.75rem' }}>
          <input
            type="url"
            placeholder={t.sync.url}
            value={syncUrl}
            onChange={e => setSyncUrl(e.target.value)}
            aria-label={t.sync.url}
          />
          <input
            type="password"
            placeholder={t.sync.token}
            value={syncToken}
            onChange={e => setSyncToken(e.target.value)}
            aria-label={t.sync.token}
          />
          <div className="settings-row">
            <span className={`sync-dot sync-${syncStatus}`} aria-hidden="true" />
            <span className="sync-status">
              {syncStatus === 'off' && t.sync.statusOff}
              {syncStatus === 'idle' && t.sync.statusIdle}
              {syncStatus === 'syncing' && t.sync.statusSyncing}
              {syncStatus === 'ok' && t.sync.statusOk}
              {syncStatus === 'error' && `${t.sync.statusError}: ${syncError ?? ''}`}
            </span>
          </div>
          <div className="settings-row">
            <button
              className="primary"
              onClick={() => onSaveSync(syncUrl ? { url: syncUrl, token: syncToken || undefined } : null)}
            >
              {t.sync.save}
            </button>
            {syncConfig && (
              <>
                <button className="pill" onClick={onSyncNow}>{t.sync.syncNow}</button>
                <button className="pill" onClick={onPullNow}>{t.sync.pullNow}</button>
                <button
                  className="pill danger"
                  onClick={() => { setSyncUrl(''); setSyncToken(''); onSaveSync(null); }}
                >
                  {t.sync.disconnect}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>{t.notifications.title}</h3>
        {!supportsNotifications() ? (
          <p className="hint">{t.notifications.unsupported}</p>
        ) : (
          <div className="settings-row">
            <button
              className={`pill ${notifyEnabled ? 'pill-on' : ''}`}
              onClick={onToggleNotify}
              aria-pressed={notifyEnabled}
            >
              {notifyEnabled ? `✓ ${t.notifications.enabled}` : t.notifications.enable}
            </button>
          </div>
        )}
      </div>

      <p className="hint shortcuts">{t.shortcuts}</p>
    </section>
  );
}
