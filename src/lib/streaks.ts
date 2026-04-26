import type { Plan, RecurringPlan } from '../types';
import { today } from './date';

export interface Streak {
  current: number;
  longest: number;
}

// Count consecutive done instances backward from today.
// An instance is "due" if its date <= today. Streak breaks on the first past-due instance that isn't done.
export function streakFor(template: RecurringPlan, plans: Plan[]): Streak {
  const todayStr = today();
  const instances = plans
    .filter(p => p.sourceId === template.id && p.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  let current = 0;
  let longest = 0;
  let run = 0;
  let started = false;

  for (const p of instances) {
    if (p.done) {
      run++;
      if (!started) current = run;
      longest = Math.max(longest, run);
    } else {
      started = true;
      run = 0;
    }
  }
  if (!started) current = run;
  longest = Math.max(longest, current);
  return { current, longest };
}
