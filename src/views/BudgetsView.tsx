import type { Budgets, CategoryKey } from '../types';
import type { Dict, Lang } from '../i18n';
import { formatMoney, parseAmount, stringifyAmount } from '../lib/money';
import type { Currency } from '../lib/money';

const CATS: CategoryKey[] = ['groceries', 'beauty', 'fashion', 'home', 'health', 'travel', 'dining', 'other'];

interface Props {
  t: Dict;
  lang: Lang;
  currency: Currency;
  budgets: Budgets;
  spentByCat: Record<string, number>;
  onSet: (cat: CategoryKey, cap: number | null) => void;
}

export default function BudgetsView({ t, lang, currency, budgets, spentByCat, onSet }: Props) {
  return (
    <section className="stack">
      <div className="card">
        <h3>{t.budgets.title}</h3>
        <p className="hint">{t.budgets.hint}</p>
      </div>

      <div className="list">
        {CATS.map(cat => {
          const cap = budgets[cat] ?? 0;
          const spent = spentByCat[cat] ?? 0;
          const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
          const over = cap > 0 && spent > cap;
          const warn = cap > 0 && pct >= 80 && !over;
          const remaining = cap - spent;

          return (
            <div key={`${cat}-${cap}`} className="card budget-row">
              <div className="budget-head">
                <span className={`chip chip-${cat}`}>{t.categories[cat]}</span>
                <input
                  inputMode="decimal"
                  className="cap-input"
                  placeholder={t.budgets.noCap}
                  defaultValue={cap > 0 ? stringifyAmount(cap, lang) : ''}
                  aria-label={`${t.budgets.setCap} ${t.categories[cat]}`}
                  onBlur={e => {
                    const n = parseAmount(e.target.value, lang);
                    onSet(cat, n);
                  }}
                />
              </div>
              {cap > 0 && (
                <>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${over ? 'bar-over' : warn ? 'bar-warn' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="budget-meta">
                    <span>
                      {formatMoney(spent, currency, lang)} {t.budgets.of} {formatMoney(cap, currency, lang)}
                    </span>
                    <span className={over ? 'over' : ''}>
                      {over
                        ? `${formatMoney(spent - cap, currency, lang)} ${t.budgets.over}`
                        : `${formatMoney(Math.max(0, remaining), currency, lang)} ${t.budgets.remaining}`}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
