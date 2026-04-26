export type CategoryKey =
  | 'groceries' | 'beauty' | 'fashion' | 'home'
  | 'health' | 'travel' | 'dining' | 'other';

export interface Expense {
  id: string;
  desc: string;
  notes?: string;
  amount: number;
  category: CategoryKey;
  date: string;
  sourceId?: string;
  goalId?: string;
}

export interface Plan {
  id: string;
  task: string;
  notes?: string;
  date: string;       // start date
  endDate?: string;   // optional multi-day end (inclusive)
  time: string;       // start time HH:MM
  endTime?: string;   // optional end time HH:MM
  done: boolean;
  sourceId?: string;
  goalId?: string;
}

export type GoalTimeframe = 'year' | 'quarter' | 'month' | 'week';
export type GoalStatus = 'on-track' | 'off-track-plan' | 'off-track-no-plan';

// Wheel of Life domains — validated framework for life-area goal categorization.
export type GoalCategory =
  | 'career' | 'finance' | 'health' | 'learning'
  | 'relationships' | 'lifestyle' | 'mindset' | 'other';

export interface Goal {
  id: string;
  title: string;
  notes?: string;            // why / outcome — SMART
  intention?: string;        // implementation intention: "if X then Y" (Gollwitzer 1999)
  timeframe: GoalTimeframe;
  periodKey: string;         // year=YYYY, quarter=YYYY-Q#, month=YYYY-MM, week=YYYY-W##
  parentId?: string;         // link to larger-timeframe goal
  category?: GoalCategory;   // life-area domain (Wheel of Life)
  status: GoalStatus;
  recoveryPlan?: string;     // required when status=off-track-plan
  createdAt: string;         // ISO date
}

export type ExpenseFrequency = 'weekly' | 'monthly';
export type PlanFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringExpense {
  id: string;
  desc: string;
  notes?: string;
  amount: number;
  category: CategoryKey;
  startDate: string;
  frequency: ExpenseFrequency;
}

export interface RecurringPlan {
  id: string;
  task: string;
  notes?: string;
  time: string;
  endTime?: string;
  startDate: string;
  durationDays?: number; // occurrence length; default 0 (same day)
  frequency: PlanFrequency;
}

export type Budgets = Partial<Record<CategoryKey, number>>;

export interface ExportShape {
  version: 2 | 3 | 4;
  expenses: Expense[];
  plans: Plan[];
  budgets: Budgets;
  currency: string;
  recurringExpenses?: RecurringExpense[];
  recurringPlans?: RecurringPlan[];
  notifyEnabled?: boolean;
  goals?: Goal[];
}
