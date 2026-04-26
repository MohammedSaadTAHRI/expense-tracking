import { memo } from 'react';
import type { Expense } from '../types';
import type { Dict, Lang } from '../i18n';
import type { Currency } from '../lib/money';
import { formatMoney } from '../lib/money';

interface Props {
  expense: Expense;
  t: Dict;
  lang: Lang;
  currency: Currency;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}

function ExpenseRowBase({ expense: e, t, lang, currency, onEdit, onDelete }: Props) {
  return (
    <div className={`item item-striped stripe-${e.category}`}>
      <div className="item-body">
        <div className="item-desc">
          {e.desc}
          {e.sourceId && <span className="badge-rec" aria-label="recurring">↻</span>}
        </div>
        <div className="item-meta">
          <span className={`chip chip-${e.category}`}>{t.categories[e.category]}</span>
          <span className="meta-date">{e.date}</span>
        </div>
        {e.notes && <p className="item-notes">{e.notes}</p>}
      </div>
      <div className="item-right">
        <strong className="item-amount">{formatMoney(e.amount, currency, lang)}</strong>
        <div className="item-actions">
          <button className="ghost" onClick={() => onEdit(e)} aria-label={t.edit}>✎</button>
          <button className="ghost" onClick={() => onDelete(e.id)} aria-label={t.delete}>✕</button>
        </div>
      </div>
    </div>
  );
}

export const ExpenseRow = memo(ExpenseRowBase);
