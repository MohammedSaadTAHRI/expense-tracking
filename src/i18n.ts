export type Lang = 'en' | 'de';

export interface Dict {
  appTitle: string;
  tagline: string;
  tabs: { expenses: string; schedule: string; budgets: string; goals: string; stats: string };
  goals: {
    title: string;
    hint: string;
    add: string;
    edit: string;
    titleField: string;
    why: string;
    intention: string;
    intentionHint: string;
    timeframe: string;
    period: string;
    parent: string;
    noParent: string;
    status: string;
    onTrack: string;
    offTrackPlan: string;
    offTrackNoPlan: string;
    recoveryPlan: string;
    recoveryHint: string;
    timeframes: { year: string; quarter: string; month: string; week: string };
    progress: string;
    linkedPlans: string;
    noLinks: string;
    empty: string;
    filterAll: string;
    linkGoal: string;
    suggestBehind: string;
    suggestAhead: string;
  };
  addExpense: string;
  editExpense: string;
  editPlan: string;
  desc: string;
  amount: string;
  category: string;
  date: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  confirmDelete: string;
  total: string;
  thisMonth: string;
  noExpenses: string;
  categories: Record<'groceries' | 'beauty' | 'fashion' | 'home' | 'health' | 'travel' | 'dining' | 'other', string>;
  schedule: {
    title: string;
    add: string;
    taskName: string;
    time: string;
    empty: string;
    done: string;
    all: string;
    on: string;
    today: string;
    prevMonth: string;
    nextMonth: string;
  };
  budgets: {
    title: string;
    hint: string;
    spent: string;
    of: string;
    remaining: string;
    over: string;
    noCap: string;
    setCap: string;
  };
  settings: {
    title: string;
    currency: string;
    export: string;
    import: string;
    importOk: string;
    importFail: string;
    clear: string;
    confirmClear: string;
  };
  theme: { light: string; dark: string };
  byCategory: string;
  months: string[];
  weekdays: string[];
  search: string;
  trends: string;
  recurring: {
    title: string;
    repeat: string;
    weekly: string;
    monthly: string;
    daily: string;
    none: string;
    starting: string;
    templatesExpenses: string;
    templatesPlans: string;
    removeTemplate: string;
  };
  notifications: {
    title: string;
    enable: string;
    enabled: string;
    denied: string;
    unsupported: string;
    reminderBody: string;
  };
  shortcuts: string;
  notes: string;
  notesHint: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  multiDay: string;
  days: string;
  durationDays: string;
  undo: string;
  undone: string;
  expenseDeleted: string;
  planDeleted: string;
  recurringDeleted: string;
  view: { month: string; week: string; day: string };
  streaks: { current: string; longest: string; days: string };
  sync: {
    title: string;
    hint: string;
    url: string;
    token: string;
    save: string;
    syncNow: string;
    pullNow: string;
    statusOff: string;
    statusIdle: string;
    statusSyncing: string;
    statusOk: string;
    statusError: string;
    disconnect: string;
  };
  palette: { title: string; hint: string };
  commands: {
    goExpenses: string;
    goSchedule: string;
    goBudgets: string;
    goGoals: string;
    goSummary: string;
    newGoal: string;
    newExpense: string;
    newPlan: string;
    toggleTheme: string;
    toggleLang: string;
    goToday: string;
    exportData: string;
    importData: string;
    syncNow: string;
  };
}

export const dict: Record<Lang, Dict> = {
  en: {
    appTitle: 'Bloom',
    tagline: 'Your gentle money & time companion',
    tabs: { expenses: 'Expenses', schedule: 'Schedule', budgets: 'Budgets', goals: 'Goals', stats: 'Summary' },
    goals: {
      title: 'Goals',
      hint: 'Set what matters across year, quarter, month, week. Nest small goals under bigger ones. Track honestly — progress monitoring lifts attainment.',
      add: 'Add goal',
      edit: 'Edit goal',
      titleField: 'Goal',
      why: 'Why it matters',
      intention: 'If-then plan',
      intentionHint: 'If [situation], then I will [action]. Specific cue makes follow-through automatic.',
      timeframe: 'Timeframe',
      period: 'Period',
      parent: 'Belongs to',
      noParent: 'Standalone',
      status: 'Status',
      onTrack: 'On track',
      offTrackPlan: 'Off track · with plan',
      offTrackNoPlan: 'Off track · no plan',
      recoveryPlan: 'Recovery plan',
      recoveryHint: 'What single action gets this back on track?',
      timeframes: { year: 'Year', quarter: 'Quarter', month: 'Month', week: 'Week' },
      progress: 'Progress',
      linkedPlans: 'Linked tasks',
      noLinks: 'No tasks linked yet.',
      empty: 'No goals yet. Start with a yearly outcome.',
      filterAll: 'All',
      linkGoal: 'Goal',
      suggestBehind: 'Linked tasks suggest behind. Mark off-track?',
      suggestAhead: 'Linked tasks look healthy.',
    },
    addExpense: 'Add expense',
    editExpense: 'Edit expense',
    editPlan: 'Edit task',
    desc: 'Description',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Delete this?',
    total: 'Total',
    thisMonth: 'This month',
    noExpenses: 'No expenses yet. Add your first one.',
    categories: {
      groceries: 'Groceries',
      beauty: 'Beauty & Wellness',
      fashion: 'Fashion',
      home: 'Home',
      health: 'Health',
      travel: 'Travel',
      dining: 'Dining',
      other: 'Other',
    },
    schedule: {
      title: 'Schedule',
      add: 'Add task',
      taskName: 'What',
      time: 'Time',
      empty: 'No tasks. Enjoy the day.',
      done: 'Done',
      all: 'All tasks',
      on: 'Tasks on',
      today: 'Today',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
    },
    budgets: {
      title: 'Monthly budgets',
      hint: 'Set a monthly cap per category. Progress bar warns when you get close.',
      spent: 'spent',
      of: 'of',
      remaining: 'remaining',
      over: 'over',
      noCap: 'No cap',
      setCap: 'Set monthly cap',
    },
    settings: {
      title: 'Settings',
      currency: 'Currency',
      export: 'Export data',
      import: 'Import data',
      importOk: 'Imported successfully.',
      importFail: 'Import failed. Invalid file.',
      clear: 'Clear all data',
      confirmClear: 'This erases all expenses, tasks and budgets. Continue?',
    },
    theme: { light: 'Light', dark: 'Dark' },
    byCategory: 'By category',
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    weekdays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    search: 'Search…',
    trends: 'Last 6 months',
    recurring: {
      title: 'Recurring',
      repeat: 'Repeat',
      weekly: 'Weekly',
      monthly: 'Monthly',
      daily: 'Daily',
      none: 'None',
      starting: 'Starting',
      templatesExpenses: 'Recurring expenses',
      templatesPlans: 'Recurring tasks',
      removeTemplate: 'Remove recurring',
    },
    notifications: {
      title: 'Reminders',
      enable: 'Enable browser reminders',
      enabled: 'Reminders on',
      denied: 'Reminders blocked by browser',
      unsupported: 'Not supported here',
      reminderBody: 'is starting now',
    },
    shortcuts: 'Keyboard: 1–4 tabs · / search · n new · ⌘K palette',
    notes: 'Notes',
    notesHint: 'Optional details',
    startDate: 'Start',
    endDate: 'End',
    startTime: 'Start time',
    endTime: 'End time',
    multiDay: 'Multi-day',
    days: 'days',
    durationDays: 'Duration (days)',
    undo: 'Undo',
    undone: 'Restored.',
    expenseDeleted: 'Expense removed.',
    planDeleted: 'Task removed.',
    recurringDeleted: 'Recurring removed.',
    view: { month: 'Month', week: 'Week', day: 'Day' },
    streaks: { current: 'Current', longest: 'Best', days: 'days' },
    sync: {
      title: 'Cloud sync',
      hint: 'Point at any HTTPS endpoint that supports GET + PUT (JSONBin, Supabase, personal server, etc). Bearer token optional.',
      url: 'Sync URL',
      token: 'Bearer token',
      save: 'Save & sync',
      syncNow: 'Push now',
      pullNow: 'Pull now',
      statusOff: 'Disabled',
      statusIdle: 'Ready',
      statusSyncing: 'Syncing…',
      statusOk: 'Synced',
      statusError: 'Error',
      disconnect: 'Disconnect',
    },
    palette: { title: 'Commands', hint: 'Type to search, Enter to run' },
    commands: {
      goExpenses: 'Go to Expenses',
      goSchedule: 'Go to Schedule',
      goBudgets: 'Go to Budgets',
      goGoals: 'Go to Goals',
      goSummary: 'Go to Summary',
      newExpense: 'New expense',
      newPlan: 'New task',
      newGoal: 'New goal',
      toggleTheme: 'Toggle theme',
      toggleLang: 'Toggle language',
      goToday: 'Jump to today',
      exportData: 'Export data',
      importData: 'Import data',
      syncNow: 'Sync now',
    },
  },
  de: {
    appTitle: 'Bloom',
    tagline: 'Deine sanfte Geld- & Zeitbegleiterin',
    tabs: { expenses: 'Ausgaben', schedule: 'Kalender', budgets: 'Budgets', goals: 'Ziele', stats: 'Übersicht' },
    goals: {
      title: 'Ziele',
      hint: 'Setze, was zählt — Jahr, Quartal, Monat, Woche. Verschachtle kleine Ziele unter großen. Ehrlich verfolgen — Fortschritt messen erhöht Erfolg.',
      add: 'Ziel hinzufügen',
      edit: 'Ziel bearbeiten',
      titleField: 'Ziel',
      why: 'Warum es zählt',
      intention: 'Wenn-Dann-Plan',
      intentionHint: 'Wenn [Situation], dann werde ich [Aktion]. Konkreter Auslöser macht Umsetzung automatisch.',
      timeframe: 'Zeitraum',
      period: 'Periode',
      parent: 'Gehört zu',
      noParent: 'Eigenständig',
      status: 'Status',
      onTrack: 'Auf Kurs',
      offTrackPlan: 'Vom Kurs · mit Plan',
      offTrackNoPlan: 'Vom Kurs · ohne Plan',
      recoveryPlan: 'Rettungsplan',
      recoveryHint: 'Welche eine Aktion bringt es zurück auf Kurs?',
      timeframes: { year: 'Jahr', quarter: 'Quartal', month: 'Monat', week: 'Woche' },
      progress: 'Fortschritt',
      linkedPlans: 'Verknüpfte Aufgaben',
      noLinks: 'Noch keine Aufgaben verknüpft.',
      empty: 'Noch keine Ziele. Beginne mit einem Jahresziel.',
      filterAll: 'Alle',
      linkGoal: 'Ziel',
      suggestBehind: 'Verknüpfte Aufgaben sehen rückständig aus. Vom Kurs markieren?',
      suggestAhead: 'Verknüpfte Aufgaben sehen gut aus.',
    },
    addExpense: 'Ausgabe hinzufügen',
    editExpense: 'Ausgabe bearbeiten',
    editPlan: 'Aufgabe bearbeiten',
    desc: 'Beschreibung',
    amount: 'Betrag',
    category: 'Kategorie',
    date: 'Datum',
    save: 'Speichern',
    cancel: 'Abbrechen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    confirmDelete: 'Wirklich löschen?',
    total: 'Gesamt',
    thisMonth: 'Dieser Monat',
    noExpenses: 'Noch keine Ausgaben. Füge die erste hinzu.',
    categories: {
      groceries: 'Lebensmittel',
      beauty: 'Beauty & Wellness',
      fashion: 'Mode',
      home: 'Zuhause',
      health: 'Gesundheit',
      travel: 'Reisen',
      dining: 'Essen',
      other: 'Sonstiges',
    },
    schedule: {
      title: 'Kalender',
      add: 'Aufgabe hinzufügen',
      taskName: 'Was',
      time: 'Uhrzeit',
      empty: 'Keine Aufgaben. Genieße den Tag.',
      done: 'Erledigt',
      all: 'Alle Aufgaben',
      on: 'Aufgaben am',
      today: 'Heute',
      prevMonth: 'Vorheriger Monat',
      nextMonth: 'Nächster Monat',
    },
    budgets: {
      title: 'Monatsbudgets',
      hint: 'Lege eine monatliche Obergrenze pro Kategorie fest. Der Balken warnt, wenn es knapp wird.',
      spent: 'ausgegeben',
      of: 'von',
      remaining: 'übrig',
      over: 'über',
      noCap: 'Kein Limit',
      setCap: 'Monatslimit setzen',
    },
    settings: {
      title: 'Einstellungen',
      currency: 'Währung',
      export: 'Daten exportieren',
      import: 'Daten importieren',
      importOk: 'Erfolgreich importiert.',
      importFail: 'Import fehlgeschlagen. Ungültige Datei.',
      clear: 'Alle Daten löschen',
      confirmClear: 'Dies löscht alle Ausgaben, Aufgaben und Budgets. Fortfahren?',
    },
    theme: { light: 'Hell', dark: 'Dunkel' },
    byCategory: 'Nach Kategorie',
    months: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
    weekdays: ['Mo','Di','Mi','Do','Fr','Sa','So'],
    search: 'Suchen…',
    trends: 'Letzte 6 Monate',
    recurring: {
      title: 'Wiederkehrend',
      repeat: 'Wiederholen',
      weekly: 'Wöchentlich',
      monthly: 'Monatlich',
      daily: 'Täglich',
      none: 'Keine',
      starting: 'Ab',
      templatesExpenses: 'Wiederkehrende Ausgaben',
      templatesPlans: 'Wiederkehrende Aufgaben',
      removeTemplate: 'Wiederholung entfernen',
    },
    notifications: {
      title: 'Erinnerungen',
      enable: 'Browser-Erinnerungen aktivieren',
      enabled: 'Erinnerungen an',
      denied: 'Erinnerungen vom Browser blockiert',
      unsupported: 'Hier nicht unterstützt',
      reminderBody: 'beginnt jetzt',
    },
    shortcuts: 'Tasten: 1–4 Tabs · / Suche · n Neu · ⌘K Befehle',
    notes: 'Notizen',
    notesHint: 'Optionale Details',
    startDate: 'Beginn',
    endDate: 'Ende',
    startTime: 'Startzeit',
    endTime: 'Endzeit',
    multiDay: 'Mehrtägig',
    days: 'Tage',
    durationDays: 'Dauer (Tage)',
    undo: 'Rückgängig',
    undone: 'Wiederhergestellt.',
    expenseDeleted: 'Ausgabe entfernt.',
    planDeleted: 'Aufgabe entfernt.',
    recurringDeleted: 'Wiederholung entfernt.',
    view: { month: 'Monat', week: 'Woche', day: 'Tag' },
    streaks: { current: 'Aktuell', longest: 'Bester', days: 'Tage' },
    sync: {
      title: 'Cloud-Sync',
      hint: 'Verweise auf einen HTTPS-Endpunkt mit GET + PUT (JSONBin, Supabase, eigener Server, etc.). Bearer-Token optional.',
      url: 'Sync-URL',
      token: 'Bearer-Token',
      save: 'Speichern & synchronisieren',
      syncNow: 'Jetzt senden',
      pullNow: 'Jetzt laden',
      statusOff: 'Aus',
      statusIdle: 'Bereit',
      statusSyncing: 'Synchronisiert…',
      statusOk: 'Synchronisiert',
      statusError: 'Fehler',
      disconnect: 'Trennen',
    },
    palette: { title: 'Befehle', hint: 'Tippen zum Suchen, Enter zum Ausführen' },
    commands: {
      goExpenses: 'Zu Ausgaben',
      goSchedule: 'Zum Kalender',
      goBudgets: 'Zu Budgets',
      goGoals: 'Zu Zielen',
      goSummary: 'Zur Übersicht',
      newExpense: 'Neue Ausgabe',
      newPlan: 'Neue Aufgabe',
      newGoal: 'Neues Ziel',
      toggleTheme: 'Theme umschalten',
      toggleLang: 'Sprache umschalten',
      goToday: 'Zu heute',
      exportData: 'Daten exportieren',
      importData: 'Daten importieren',
      syncNow: 'Jetzt synchronisieren',
    },
  },
};
