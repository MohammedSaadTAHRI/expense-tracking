import type { Expense } from '../types';
import type { Lang, Dict } from '../i18n';
import type { Currency } from '../lib/money';
import { formatMoney } from '../lib/money';

interface Props {
  expenses: Expense[];
  lang: Lang;
  currency: Currency;
  t: Dict;
  months?: number;
}

export default function TrendsChart({ expenses, lang, currency, t, months = 6 }: Props) {
  const now = new Date();
  const buckets: { key: string; label: string; total: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: t.months[d.getMonth()].slice(0, 3),
      total: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const e of expenses) {
    const k = e.date.slice(0, 7);
    const i = idx.get(k);
    if (i !== undefined) buckets[i].total += e.amount;
  }
  const max = Math.max(1, ...buckets.map(b => b.total));
  const W = 320;
  const H = 140;
  const bw = W / buckets.length;
  const pad = 18;

  return (
    <div className="trends">
      <svg viewBox={`0 0 ${W} ${H + pad}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Trend">
        {buckets.map((b, i) => {
          const barH = (b.total / max) * (H - 20);
          const x = i * bw + bw * 0.15;
          const y = H - barH;
          const w = bw * 0.7;
          return (
            <g key={b.key}>
              <rect x={x} y={y} width={w} height={barH} rx="4" className="trend-bar" />
              <text x={i * bw + bw / 2} y={H + 12} textAnchor="middle" className="trend-label">
                {b.label}
              </text>
              {b.total > 0 && (
                <title>{`${b.label}: ${formatMoney(b.total, currency, lang)}`}</title>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
