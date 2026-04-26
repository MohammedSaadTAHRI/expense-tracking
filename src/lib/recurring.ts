import { fmtDate, today } from './date';
import type {
  Expense, Plan, RecurringExpense, RecurringPlan,
  ExpenseFrequency, PlanFrequency,
} from '../types';

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function expenseStep(d: Date, f: ExpenseFrequency): Date {
  return f === 'weekly' ? addDays(d, 7) : addMonths(d, 1);
}

function planStep(d: Date, f: PlanFrequency): Date {
  if (f === 'daily') return addDays(d, 1);
  if (f === 'weekly') return addDays(d, 7);
  return addMonths(d, 1);
}

function dates(start: string, stepFn: (d: Date) => Date, endStr: string): string[] {
  const out: string[] = [];
  let d = parseDate(start);
  const end = parseDate(endStr);
  let guard = 0;
  while (d <= end && guard < 5000) {
    out.push(fmtDate(d));
    d = stepFn(d);
    guard++;
  }
  return out;
}

export function materializeExpenses(
  templates: RecurringExpense[],
  existing: Expense[],
): Expense[] {
  if (templates.length === 0) return existing;
  const seen = new Set<string>();
  for (const e of existing) {
    if (e.sourceId) seen.add(`${e.sourceId}:${e.date}`);
  }
  const end = today();
  const added: Expense[] = [];
  for (const t of templates) {
    for (const date of dates(t.startDate, d => expenseStep(d, t.frequency), end)) {
      const key = `${t.id}:${date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      added.push({
        id: `rec-${t.id}-${date}`,
        desc: t.desc,
        notes: t.notes,
        amount: t.amount,
        category: t.category,
        date,
        sourceId: t.id,
      });
    }
  }
  return added.length ? [...added, ...existing] : existing;
}

export function materializePlans(
  templates: RecurringPlan[],
  existing: Plan[],
  lookaheadDays = 60,
): Plan[] {
  if (templates.length === 0) return existing;
  const seen = new Set<string>();
  for (const p of existing) {
    if (p.sourceId) seen.add(`${p.sourceId}:${p.date}`);
  }
  const horizon = addDays(new Date(), lookaheadDays);
  const endStr = fmtDate(horizon);
  const added: Plan[] = [];
  for (const t of templates) {
    for (const date of dates(t.startDate, d => planStep(d, t.frequency), endStr)) {
      const key = `${t.id}:${date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const duration = t.durationDays && t.durationDays > 0 ? t.durationDays : 0;
      let endDate: string | undefined;
      if (duration > 0) {
        const d = new Date(date);
        d.setDate(d.getDate() + duration);
        endDate = fmtDate(d);
      }
      added.push({
        id: `rec-${t.id}-${date}`,
        task: t.task,
        notes: t.notes,
        time: t.time,
        endTime: t.endTime,
        date,
        endDate,
        done: false,
        sourceId: t.id,
        goalId: t.goalId,
      });
    }
  }
  return added.length ? [...existing, ...added] : existing;
}
