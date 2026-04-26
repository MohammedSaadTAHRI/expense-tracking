import { fmtDate } from './date';
import type { Plan } from '../types';

export function planDates(p: Plan): string[] {
  const start = p.date;
  const end = p.endDate && p.endDate >= start ? p.endDate : start;
  if (start === end) return [start];
  const out: string[] = [];
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last) {
    out.push(fmtDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function planSpansDate(p: Plan, date: string): boolean {
  const start = p.date;
  const end = p.endDate && p.endDate >= start ? p.endDate : start;
  return date >= start && date <= end;
}

export function planDayCount(p: Plan): number {
  return planDates(p).length;
}

export function buildPlansByDate(plans: Plan[]): Record<string, Plan[]> {
  const m: Record<string, Plan[]> = {};
  for (const p of plans) {
    for (const d of planDates(p)) {
      (m[d] ??= []).push(p);
    }
  }
  return m;
}
