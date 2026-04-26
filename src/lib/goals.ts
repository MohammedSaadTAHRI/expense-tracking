import type { Goal, GoalCategory, GoalTimeframe, Plan } from '../types';

export const TIMEFRAMES: GoalTimeframe[] = ['year', 'quarter', 'month', 'week'];

// Wheel of Life — 8 life domains used for categorizing personal goals.
export const CATEGORIES: GoalCategory[] = [
  'career', 'finance', 'health', 'learning',
  'relationships', 'lifestyle', 'mindset', 'other',
];

export const CATEGORY_GLYPH: Record<GoalCategory, string> = {
  career: '💼',
  finance: '💰',
  health: '💪',
  learning: '📚',
  relationships: '💞',
  lifestyle: '🌿',
  mindset: '🧘',
  other: '✨',
};

// rank: lower = larger timeframe (parent must be lower-or-equal)
export const TIMEFRAME_RANK: Record<GoalTimeframe, number> = {
  year: 0, quarter: 1, month: 2, week: 3,
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// ISO 8601 week number (Mon-start)
function isoWeek(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+t - +yStart) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

export function periodKeyFor(tf: GoalTimeframe, d: Date = new Date()): string {
  const y = d.getFullYear();
  if (tf === 'year') return String(y);
  if (tf === 'quarter') return `${y}-Q${Math.floor(d.getMonth() / 3) + 1}`;
  if (tf === 'month') return `${y}-${pad2(d.getMonth() + 1)}`;
  const iw = isoWeek(d);
  return `${iw.year}-W${pad2(iw.week)}`;
}

// derive timeframe period a date string falls into
function periodKeyFromDate(tf: GoalTimeframe, dateStr: string): string {
  return periodKeyFor(tf, new Date(dateStr));
}

// returns true if goal A can be parent of B (A must be larger timeframe and overlap period)
export function canParent(parent: Goal, child: Goal): boolean {
  if (parent.id === child.id) return false;
  if (TIMEFRAME_RANK[parent.timeframe] >= TIMEFRAME_RANK[child.timeframe]) return false;
  // child period must roll up into parent period
  return rollsUpInto(child.timeframe, child.periodKey, parent.timeframe, parent.periodKey);
}

function rollsUpInto(
  childTf: GoalTimeframe, childKey: string,
  parentTf: GoalTimeframe, parentKey: string,
): boolean {
  // check by sampling start of child period and computing parent key
  const sample = sampleDate(childTf, childKey);
  if (!sample) return false;
  return periodKeyFor(parentTf, sample) === parentKey;
}

function sampleDate(tf: GoalTimeframe, key: string): Date | null {
  if (tf === 'year') return new Date(Number(key), 0, 2);
  if (tf === 'quarter') {
    const [y, q] = key.split('-Q');
    return new Date(Number(y), (Number(q) - 1) * 3, 2);
  }
  if (tf === 'month') {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 2);
  }
  const [y, w] = key.split('-W');
  // approx Mon of ISO week
  const jan4 = new Date(Number(y), 0, 4);
  const jan4Dow = jan4.getDay() || 7;
  const mon1 = new Date(jan4); mon1.setDate(jan4.getDate() - jan4Dow + 1);
  const d = new Date(mon1); d.setDate(mon1.getDate() + (Number(w) - 1) * 7);
  return d;
}

export interface GoalProgress {
  total: number;
  done: number;
  pct: number;
}

export function progressFor(goal: Goal, plans: Plan[]): GoalProgress {
  const linked = plans.filter(p => p.goalId === goal.id);
  // also count plans that fall in goal period? — skip for simplicity, explicit link only
  const done = linked.filter(p => p.done).length;
  const total = linked.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, pct };
}

// suggest status: high progress + no overdue → on-track
export function suggestStatus(goal: Goal, plans: Plan[]): { hint: 'ahead' | 'behind' | 'flat' } {
  const linked = plans.filter(p => p.goalId === goal.id);
  if (linked.length === 0) return { hint: 'flat' };
  const overdue = linked.filter(p => !p.done && periodKeyFromDate(goal.timeframe, p.date) <= goal.periodKey).length;
  const done = linked.filter(p => p.done).length;
  if (overdue > done) return { hint: 'behind' };
  return { hint: 'ahead' };
}

export function formatPeriodKey(tf: GoalTimeframe, key: string, monthNames: string[]): string {
  if (tf === 'year') return key;
  if (tf === 'quarter') return key.replace('-', ' ');
  if (tf === 'month') {
    const [y, m] = key.split('-');
    return `${monthNames[Number(m) - 1]} ${y}`;
  }
  return key.replace('-W', ' · W');
}
