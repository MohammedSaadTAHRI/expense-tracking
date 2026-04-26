import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { dict, type Lang } from './i18n';
import { useLocalState } from './hooks/useLocalState';
import { useReminders } from './hooks/useReminders';
import { useToast } from './hooks/useToast';
import { useCloudSync } from './hooks/useCloudSync';
import type {
  Budgets, CategoryKey, Expense, ExportShape, Goal, Plan,
  RecurringExpense, RecurringPlan,
} from './types';
import type { Currency } from './lib/money';
import type { SyncConfig } from './lib/sync';
import { currentMonthKey } from './lib/date';
import { materializeExpenses, materializePlans } from './lib/recurring';
import { requestPermission, supportsNotifications } from './lib/notifications';
import ExpensesView from './views/ExpensesView';
import type { ExpensesHandle } from './views/ExpensesView';
import ScheduleView from './views/ScheduleView';
import type { ScheduleHandle } from './views/ScheduleView';
import BudgetsView from './views/BudgetsView';
import GoalsView from './views/GoalsView';
import StatsView from './views/StatsView';
import { ToastStack } from './components/ToastStack';
import { CommandPalette, type Command } from './components/CommandPalette';

type Theme = 'light' | 'dark';
type Tab = 'expenses' | 'schedule' | 'budgets' | 'goals' | 'stats';

const TABS: Tab[] = ['expenses', 'schedule', 'budgets', 'goals', 'stats'];

export default function App() {
  const [lang, setLang] = useLocalState<Lang>('lang', 'en');
  const [theme, setTheme] = useLocalState<Theme>('theme', 'light');
  const [currency, setCurrency] = useLocalState<Currency>('currency', 'USD');
  const [tab, setTab] = useLocalState<Tab>('tab', 'expenses');
  const [expenses, setExpenses] = useLocalState<Expense[]>('expenses', []);
  const [plans, setPlans] = useLocalState<Plan[]>('plans', []);
  const [budgets, setBudgets] = useLocalState<Budgets>('budgets', {});
  const [recurringExpenses, setRecurringExpenses] = useLocalState<RecurringExpense[]>('recExpenses', []);
  const [recurringPlans, setRecurringPlans] = useLocalState<RecurringPlan[]>('recPlans', []);
  const [goals, setGoals] = useLocalState<Goal[]>('goals', []);
  const [notifyEnabled, setNotifyEnabled] = useLocalState<boolean>('notifyEnabled', false);
  const [syncConfig, setSyncConfig] = useLocalState<SyncConfig | null>('syncConfig', null);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const expensesRef = useRef<ExpensesHandle>(null);
  const scheduleRef = useRef<ScheduleHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const t = dict[lang];
  const { toasts, push: pushToast, dismiss: dismissToast } = useToast();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

  useEffect(() => {
    setExpenses(prev => materializeExpenses(recurringExpenses, prev));
  }, [recurringExpenses, setExpenses]);

  useEffect(() => {
    setPlans(prev => materializePlans(recurringPlans, prev));
  }, [recurringPlans, setPlans]);

  useReminders(plans, notifyEnabled, t);

  const monthTotal = useMemo(() => {
    const m = currentMonthKey();
    return expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) m[e.category] = (m[e.category] ?? 0) + e.amount;
    return m;
  }, [expenses]);

  const spentThisMonthByCat = useMemo(() => {
    const mk = currentMonthKey();
    const m: Record<string, number> = {};
    for (const e of expenses) {
      if (!e.date.startsWith(mk)) continue;
      m[e.category] = (m[e.category] ?? 0) + e.amount;
    }
    return m;
  }, [expenses]);

  const buildExport = useCallback((): ExportShape => ({
    version: 4,
    expenses, plans, budgets, currency,
    recurringExpenses, recurringPlans, notifyEnabled, goals,
  }), [expenses, plans, budgets, currency, recurringExpenses, recurringPlans, notifyEnabled, goals]);

  const applyImport = useCallback((data: ExportShape) => {
    setExpenses(data.expenses ?? []);
    setPlans(data.plans ?? []);
    setBudgets(data.budgets ?? {});
    setRecurringExpenses(data.recurringExpenses ?? []);
    setRecurringPlans(data.recurringPlans ?? []);
    setGoals(data.goals ?? []);
    if (typeof data.notifyEnabled === 'boolean') setNotifyEnabled(data.notifyEnabled);
    if (data.currency) setCurrency(data.currency as Currency);
  }, [setExpenses, setPlans, setBudgets, setRecurringExpenses, setRecurringPlans, setGoals, setNotifyEnabled, setCurrency]);

  const snapshotKey = useMemo(
    () => JSON.stringify([expenses.length, plans.length, budgets, currency, recurringExpenses.length, recurringPlans.length, goals.length]),
    [expenses, plans, budgets, currency, recurringExpenses, recurringPlans, goals],
  );

  const { status: syncStatus, error: syncError, syncNow, pullNow } = useCloudSync({
    cfg: syncConfig,
    buildExport,
    applyImport,
    snapshotKey,
  });

  // --- Delete handlers with undo toasts ---
  const deleteExpenseWithUndo = useCallback((id: string) => {
    const victim = expenses.find(e => e.id === id);
    if (!victim) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
    pushToast({
      message: t.expenseDeleted,
      actionLabel: t.undo,
      onAction: () => setExpenses(prev => [victim, ...prev.filter(e => e.id !== victim.id)]),
    });
  }, [expenses, setExpenses, pushToast, t]);

  const deletePlanWithUndo = useCallback((id: string) => {
    const victim = plans.find(p => p.id === id);
    if (!victim) return;
    setPlans(prev => prev.filter(p => p.id !== id));
    pushToast({
      message: t.planDeleted,
      actionLabel: t.undo,
      onAction: () => setPlans(prev => [...prev.filter(p => p.id !== victim.id), victim]),
    });
  }, [plans, setPlans, pushToast, t]);

  const reschedulePlan = useCallback((id: string, newDate: string) => {
    const before = plans.find(p => p.id === id);
    if (!before || before.date === newDate) return;
    const deltaDays = Math.round(
      (new Date(newDate).getTime() - new Date(before.date).getTime()) / 86400000,
    );
    let newEnd: string | undefined;
    if (before.endDate) {
      const d = new Date(before.endDate);
      d.setDate(d.getDate() + deltaDays);
      newEnd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    setPlans(prev => prev.map(p => p.id === id ? { ...p, date: newDate, endDate: newEnd } : p));
    pushToast({
      message: `${before.task} → ${newDate}`,
      actionLabel: t.undo,
      onAction: () => setPlans(prev => prev.map(p => p.id === id ? { ...p, date: before.date, endDate: before.endDate } : p)),
    });
  }, [plans, setPlans, pushToast, t]);

  const deleteRecurringExpense = useCallback((id: string) => {
    const tmpl = recurringExpenses.find(r => r.id === id);
    const removedInstances = expenses.filter(e => e.sourceId === id);
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
    setExpenses(prev => prev.filter(e => e.sourceId !== id));
    if (tmpl) {
      pushToast({
        message: t.recurringDeleted,
        actionLabel: t.undo,
        onAction: () => {
          setRecurringExpenses(prev => [...prev, tmpl]);
          setExpenses(prev => [...removedInstances, ...prev]);
        },
      });
    }
  }, [recurringExpenses, expenses, setRecurringExpenses, setExpenses, pushToast, t]);

  const deleteRecurringPlan = useCallback((id: string) => {
    const tmpl = recurringPlans.find(r => r.id === id);
    const removedInstances = plans.filter(p => p.sourceId === id);
    setRecurringPlans(prev => prev.filter(r => r.id !== id));
    setPlans(prev => prev.filter(p => p.sourceId !== id));
    if (tmpl) {
      pushToast({
        message: t.recurringDeleted,
        actionLabel: t.undo,
        onAction: () => {
          setRecurringPlans(prev => [...prev, tmpl]);
          setPlans(prev => [...prev, ...removedInstances]);
        },
      });
    }
  }, [recurringPlans, plans, setRecurringPlans, setPlans, pushToast, t]);

  // --- Global keyboard shortcuts ---
  useEffect(() => {
    const handler = (ev: globalThis.KeyboardEvent) => {
      // Cmd/Ctrl+K → palette
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;

      const target = ev.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
      if (paletteOpen) return;

      if (!typing && ev.key >= '1' && ev.key <= '5') {
        setTab(TABS[Number(ev.key) - 1]);
        ev.preventDefault();
        return;
      }
      if (!typing && ev.key === '/') {
        setTab('expenses');
        setTimeout(() => expensesRef.current?.focusSearch(), 0);
        ev.preventDefault();
        return;
      }
      if (!typing && ev.key.toLowerCase() === 'n') {
        if (tab === 'schedule') scheduleRef.current?.focusTask();
        else {
          setTab('expenses');
          setTimeout(() => expensesRef.current?.focusDesc(), 0);
        }
        ev.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, setTab, paletteOpen]);

  const onTabKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (i + dir + TABS.length) % TABS.length;
    tabRefs.current[next]?.focus();
    setTab(TABS[next]);
  };

  const toggleNotify = async () => {
    if (!supportsNotifications()) return;
    if (notifyEnabled) { setNotifyEnabled(false); return; }
    const ok = await requestPermission();
    setNotifyEnabled(ok);
    if (!ok) alert(t.notifications.denied);
  };

  const doExport = () => {
    const data = buildExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => fileInputRef.current?.click();

  // --- Palette commands ---
  const commands: Command[] = useMemo(() => [
    { id: 'go-expenses', label: t.commands.goExpenses, hint: '1', run: () => setTab('expenses') },
    { id: 'go-schedule', label: t.commands.goSchedule, hint: '2', run: () => setTab('schedule') },
    { id: 'go-budgets',  label: t.commands.goBudgets,  hint: '3', run: () => setTab('budgets') },
    { id: 'go-goals',    label: t.commands.goGoals,    hint: '4', run: () => setTab('goals') },
    { id: 'go-summary',  label: t.commands.goSummary,  hint: '5', run: () => setTab('stats') },
    { id: 'new-expense', label: t.commands.newExpense, hint: 'n', run: () => { setTab('expenses'); setTimeout(() => expensesRef.current?.focusDesc(), 0); } },
    { id: 'new-plan',    label: t.commands.newPlan, run: () => { setTab('schedule'); setTimeout(() => scheduleRef.current?.focusTask(), 0); } },
    { id: 'new-goal',    label: t.commands.newGoal, run: () => setTab('goals') },
    { id: 'today',       label: t.commands.goToday, run: () => { setTab('schedule'); setTimeout(() => scheduleRef.current?.goToday(), 0); } },
    { id: 'theme',       label: t.commands.toggleTheme, run: () => setTheme(theme === 'light' ? 'dark' : 'light') },
    { id: 'lang',        label: t.commands.toggleLang, run: () => setLang(lang === 'en' ? 'de' : 'en') },
    { id: 'export',      label: t.commands.exportData, run: doExport },
    { id: 'import',      label: t.commands.importData, run: triggerImport },
    ...(syncConfig ? [{ id: 'sync', label: t.commands.syncNow, run: syncNow } as Command] : []),
  ], [t, theme, lang, setTab, setTheme, setLang, syncConfig, syncNow]);

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const parsed = JSON.parse(await file.text()) as ExportShape;
            if (!parsed.version || !Array.isArray(parsed.expenses)) throw new Error('shape');
            applyImport(parsed);
            pushToast({ message: t.settings.importOk });
          } catch {
            pushToast({ message: t.settings.importFail });
          } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }}
      />

      <header className="hero">
        <div className="brand">
          <span className="eyebrow">✿ {t.tagline}</span>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="controls">
          <button
            className="pill pill-icon"
            onClick={() => setPaletteOpen(true)}
            aria-label="Command palette"
            title="⌘K"
          >⌘K</button>
          {syncConfig && (
            <span className={`sync-chip sync-${syncStatus}`} title={syncError ?? syncStatus}>
              <span className="sync-dot" aria-hidden="true" />
              {syncStatus === 'syncing' ? '…' : syncStatus === 'error' ? '!' : '✓'}
            </span>
          )}
          <button
            className="pill"
            onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
            aria-label={`Language: ${lang === 'en' ? 'English' : 'Deutsch'}`}
          >
            {lang === 'en' ? 'DE' : 'EN'}
          </button>
          <button
            className="pill"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Theme: ${theme}`}
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((k, i) => (
          <button
            key={k}
            ref={el => { tabRefs.current[i] = el; }}
            role="tab"
            aria-selected={tab === k}
            tabIndex={tab === k ? 0 : -1}
            className={`tab ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
            onKeyDown={e => onTabKey(e, i)}
          >
            {t.tabs[k]}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'expenses' && (
          <ExpensesView
            ref={expensesRef}
            t={t}
            lang={lang}
            currency={currency}
            expenses={expenses}
            recurring={recurringExpenses}
            onAdd={e => setExpenses(prev => [e, ...prev])}
            onUpdate={e => setExpenses(prev => prev.map(x => x.id === e.id ? e : x))}
            onDelete={deleteExpenseWithUndo}
            onAddRecurring={r => setRecurringExpenses(prev => [...prev, r])}
            onDeleteRecurring={deleteRecurringExpense}
            monthTotal={monthTotal}
          />
        )}
        {tab === 'schedule' && (
          <ScheduleView
            ref={scheduleRef}
            t={t}
            plans={plans}
            goals={goals}
            recurring={recurringPlans}
            onAdd={p => setPlans(prev => [...prev, p])}
            onUpdate={p => setPlans(prev => prev.map(x => x.id === p.id ? p : x))}
            onToggle={id => setPlans(prev => prev.map(p => p.id === id ? { ...p, done: !p.done } : p))}
            onDelete={deletePlanWithUndo}
            onReschedule={reschedulePlan}
            onAddRecurring={r => setRecurringPlans(prev => [...prev, r])}
            onDeleteRecurring={deleteRecurringPlan}
          />
        )}
        {tab === 'budgets' && (
          <BudgetsView
            t={t}
            lang={lang}
            currency={currency}
            budgets={budgets}
            spentByCat={spentThisMonthByCat}
            onSet={(cat: CategoryKey, cap) => setBudgets(prev => {
              const next = { ...prev };
              if (cap === null || cap <= 0) delete next[cat];
              else next[cat] = cap;
              return next;
            })}
          />
        )}
        {tab === 'goals' && (
          <GoalsView
            t={t}
            goals={goals}
            plans={plans}
            onAdd={g => setGoals(prev => [...prev, g])}
            onUpdate={g => setGoals(prev => prev.map(x => x.id === g.id ? g : x))}
            onDelete={id => setGoals(prev => {
              // also detach children from this parent
              return prev.filter(x => x.id !== id).map(x => x.parentId === id ? { ...x, parentId: undefined } : x);
            })}
          />
        )}
        {tab === 'stats' && (
          <StatsView
            t={t}
            lang={lang}
            currency={currency}
            total={total}
            monthTotal={monthTotal}
            byCat={byCat}
            expenses={expenses}
            notifyEnabled={notifyEnabled}
            syncConfig={syncConfig}
            syncStatus={syncStatus}
            syncError={syncError}
            onSaveSync={setSyncConfig}
            onSyncNow={syncNow}
            onPullNow={pullNow}
            onToggleNotify={toggleNotify}
            onCurrencyChange={setCurrency}
            onExport={buildExport}
            onImport={applyImport}
            onClear={() => {
              setExpenses([]);
              setPlans([]);
              setBudgets({});
              setRecurringExpenses([]);
              setRecurringPlans([]);
              setGoals([]);
            }}
          />
        )}
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
        placeholder={t.palette.hint}
      />
    </div>
  );
}
