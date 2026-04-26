import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { CategoryKey, Expense, ExpenseFrequency, RecurringExpense } from '../types';
import type { Dict, Lang } from '../i18n';
import type { Currency } from '../lib/money';
import { formatMoney, parseAmount, stringifyAmount } from '../lib/money';
import { today } from '../lib/date';
import { uid } from '../storage';
import { useDebounce } from '../hooks/useDebounce';
import { ExpenseRow } from '../components/ExpenseRow';

const CATS: CategoryKey[] = ['groceries', 'beauty', 'fashion', 'home', 'health', 'travel', 'dining', 'other'];

interface Props {
  t: Dict;
  lang: Lang;
  currency: Currency;
  expenses: Expense[];
  recurring: RecurringExpense[];
  onAdd: (e: Expense) => void;
  onUpdate: (e: Expense) => void;
  onDelete: (id: string) => void;
  onAddRecurring: (r: RecurringExpense) => void;
  onDeleteRecurring: (id: string) => void;
  monthTotal: number;
}

export interface ExpensesHandle {
  focusDesc: () => void;
  focusSearch: () => void;
}

const ExpensesView = forwardRef<ExpensesHandle, Props>(function ExpensesView(
  {
    t, lang, currency, expenses, recurring,
    onAdd, onUpdate, onDelete,
    onAddRecurring, onDeleteRecurring,
    monthTotal,
  },
  ref,
) {
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryKey>('groceries');
  const [date, setDate] = useState(today());
  const [repeat, setRepeat] = useState<'' | ExpenseFrequency>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const descRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusDesc: () => descRef.current?.focus(),
    focusSearch: () => searchRef.current?.focus(),
  }));

  const reset = () => {
    setDesc(''); setNotes(''); setAmount(''); setCategory('groceries');
    setDate(today()); setRepeat(''); setEditingId(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = parseAmount(amount, lang);
    if (!desc || n === null) return;
    const trimmedNotes = notes.trim() || undefined;
    if (editingId) {
      onUpdate({ id: editingId, desc, notes: trimmedNotes, amount: n, category, date });
    } else {
      onAdd({ id: uid(), desc, notes: trimmedNotes, amount: n, category, date });
      if (repeat) {
        onAddRecurring({
          id: uid(), desc, notes: trimmedNotes, amount: n, category,
          startDate: date, frequency: repeat,
        });
      }
    }
    reset();
  };

  const startEdit = useCallback((ex: Expense) => {
    setEditingId(ex.id);
    setDesc(ex.desc);
    setNotes(ex.notes ?? '');
    setAmount(stringifyAmount(ex.amount, lang));
    setCategory(ex.category);
    setDate(ex.date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lang]);

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
  }, [onDelete]);

  const debouncedQuery = useDebounce(query, 200);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(e =>
      e.desc.toLowerCase().includes(q) ||
      (e.notes?.toLowerCase().includes(q) ?? false) ||
      t.categories[e.category].toLowerCase().includes(q),
    );
  }, [expenses, debouncedQuery, t]);

  return (
    <section className="stack">
      <div className="summary-card">
        <span>{t.thisMonth}</span>
        <strong>{formatMoney(monthTotal, currency, lang)}</strong>
      </div>

      <form className="card form" onSubmit={submit}>
        <h3>{editingId ? t.editExpense : t.addExpense}</h3>
        <input
          ref={descRef}
          placeholder={t.desc}
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <div className="row">
          <input
            inputMode="decimal"
            placeholder={t.amount}
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <select value={category} onChange={e => setCategory(e.target.value as CategoryKey)}>
            {CATS.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}
          </select>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <textarea
          className="notes-input"
          placeholder={`${t.notes} — ${t.notesHint}`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />
        {!editingId && (
          <div className="row">
            <label className="select-label">
              <span>{t.recurring.repeat}</span>
              <select value={repeat} onChange={e => setRepeat(e.target.value as '' | ExpenseFrequency)}>
                <option value="">{t.recurring.none}</option>
                <option value="weekly">{t.recurring.weekly}</option>
                <option value="monthly">{t.recurring.monthly}</option>
              </select>
            </label>
          </div>
        )}
        <div className="row">
          <button type="submit" className="primary">{t.save}</button>
          {editingId && (
            <button type="button" className="pill" onClick={reset}>{t.cancel}</button>
          )}
        </div>
      </form>

      {recurring.length > 0 && (
        <div className="card">
          <h3>{t.recurring.templatesExpenses}</h3>
          <div className="list tight">
            {recurring.map(r => (
              <div key={r.id} className="item">
                <div>
                  <div className="item-desc">{r.desc}</div>
                  <div className="item-meta">
                    <span className={`chip chip-${r.category}`}>{t.categories[r.category]}</span>
                    <span>{t.recurring[r.frequency]}</span>
                    <span>{t.recurring.starting} {r.startDate}</span>
                  </div>
                </div>
                <div className="item-right">
                  <strong>{formatMoney(r.amount, currency, lang)}</strong>
                  <button
                    className="ghost"
                    onClick={() => onDeleteRecurring(r.id)}
                    aria-label={t.recurring.removeTemplate}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={searchRef}
        className="search"
        placeholder={t.search}
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label={t.search}
      />

      <div className="list">
        {filtered.length === 0 && <p className="empty">{t.noExpenses}</p>}
        {filtered.map(e => (
          <ExpenseRow
            key={e.id}
            expense={e}
            t={t}
            lang={lang}
            currency={currency}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </section>
  );
});

export default ExpensesView;
