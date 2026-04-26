import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { DragEvent, FormEvent } from 'react';
import type { Goal, Plan, PlanFrequency, RecurringPlan } from '../types';
import { formatPeriodKey } from '../lib/goals';
import type { Dict } from '../i18n';
import { fmtDate, today } from '../lib/date';
import { uid } from '../storage';
import { streakFor } from '../lib/streaks';
import { buildPlansByDate, planDayCount } from '../lib/plans';

type ViewMode = 'month' | 'week' | 'day';

interface Props {
  t: Dict;
  plans: Plan[];
  goals: Goal[];
  recurring: RecurringPlan[];
  onAdd: (p: Plan) => void;
  onUpdate: (p: Plan) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, newDate: string) => void;
  onAddRecurring: (r: RecurringPlan) => void;
  onDeleteRecurring: (id: string) => void;
}

export interface ScheduleHandle {
  focusTask: () => void;
  goToday: () => void;
}

const DRAG_MIME = 'application/x-bloom-plan-id';

function timeLabel(p: Pick<Plan, 'time' | 'endTime'>): string {
  return p.endTime ? `${p.time} – ${p.endTime}` : p.time;
}

const ScheduleView = forwardRef<ScheduleHandle, Props>(function ScheduleView(
  { t, plans, goals, recurring, onAdd, onUpdate, onToggle, onDelete, onReschedule, onAddRecurring, onDeleteRecurring },
  ref,
) {
  const now = new Date();
  const [task, setTask] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('09:00');
  const [endTimeInput, setEndTimeInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [repeat, setRepeat] = useState<'' | PlanFrequency>('');
  const [goalId, setGoalId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(today());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [mode, setMode] = useState<ViewMode>('month');
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const taskRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({
    focusTask: () => taskRef.current?.focus(),
    goToday: () => {
      const n = new Date();
      setViewYear(n.getFullYear());
      setViewMonth(n.getMonth());
      setSelected(fmtDate(n));
    },
  }));

  const reset = () => {
    setTask(''); setNotes(''); setEndDateInput(''); setEndTimeInput(''); setDuration('');
    setRepeat(''); setGoalId(''); setEditingId(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!task) return;
    const trimmedNotes = notes.trim() || undefined;
    const endDate = endDateInput && endDateInput > selected ? endDateInput : undefined;
    const endTime = endTimeInput && endTimeInput !== time ? endTimeInput : undefined;

    const linkedGoal = goalId || undefined;
    if (editingId) {
      const prev = plans.find(p => p.id === editingId);
      onUpdate({
        id: editingId,
        task, notes: trimmedNotes,
        date: selected, endDate, time, endTime,
        done: prev?.done ?? false,
        sourceId: prev?.sourceId,
        goalId: linkedGoal,
      });
    } else if (repeat) {
      // Recurring: only create template. Materialize creates startDate instance + future ones.
      const d = parseInt(duration || '0', 10);
      onAddRecurring({
        id: uid(), task, notes: trimmedNotes, time, endTime,
        startDate: selected,
        durationDays: Number.isFinite(d) && d > 0 ? d : undefined,
        frequency: repeat,
        goalId: linkedGoal,
      });
    } else {
      onAdd({ id: uid(), task, notes: trimmedNotes, date: selected, endDate, time, endTime, done: false, goalId: linkedGoal });
    }
    reset();
  };

  const startEditPlan = (p: Plan) => {
    setEditingId(p.id);
    setTask(p.task);
    setNotes(p.notes ?? '');
    setTime(p.time);
    setEndTimeInput(p.endTime ?? '');
    setSelected(p.date);
    setEndDateInput(p.endDate ?? '');
    setDuration('');
    setRepeat('');
    setGoalId(p.goalId ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const plansByDate = useMemo(() => buildPlansByDate(plans), [plans]);
  const goalsById = useMemo(() => Object.fromEntries(goals.map(g => [g.id, g])), [goals]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startPad = (first.getDay() + 6) % 7;
    const arr: (string | null)[] = [];
    for (let i = 0; i < startPad; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(fmtDate(new Date(viewYear, viewMonth, d)));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [viewYear, viewMonth]);

  const weekDates = useMemo(() => {
    const sel = new Date(selected);
    const dow = (sel.getDay() + 6) % 7;
    const start = new Date(sel);
    start.setDate(sel.getDate() - dow);
    const out: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(fmtDate(d));
    }
    return out;
  }, [selected]);

  const prev = () => {
    if (mode === 'month') {
      const m = viewMonth - 1;
      if (m < 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(m);
    } else if (mode === 'week') {
      const d = new Date(selected); d.setDate(d.getDate() - 7); setSelected(fmtDate(d));
    } else {
      const d = new Date(selected); d.setDate(d.getDate() - 1); setSelected(fmtDate(d));
    }
  };
  const next = () => {
    if (mode === 'month') {
      const m = viewMonth + 1;
      if (m > 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(m);
    } else if (mode === 'week') {
      const d = new Date(selected); d.setDate(d.getDate() + 7); setSelected(fmtDate(d));
    } else {
      const d = new Date(selected); d.setDate(d.getDate() + 1); setSelected(fmtDate(d));
    }
  };
  const goToday = () => {
    const n = new Date();
    setViewYear(n.getFullYear());
    setViewMonth(n.getMonth());
    setSelected(fmtDate(n));
  };

  const todayStr = today();
  const visiblePlans = (plansByDate[selected] ?? [])
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleDelete = (id: string) => onDelete(id);

  const onDragStart = (e: DragEvent, planId: string) => {
    e.dataTransfer.setData(DRAG_MIME, planId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: DragEvent, date: string) => {
    if (Array.from(e.dataTransfer.types).includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverDate(date);
    }
  };
  const onDragLeave = () => setDragOverDate(null);
  const onDrop = (e: DragEvent, date: string) => {
    const id = e.dataTransfer.getData(DRAG_MIME);
    setDragOverDate(null);
    if (!id) return;
    e.preventDefault();
    onReschedule(id, date);
  };

  const title =
    mode === 'month' ? `${t.months[viewMonth]} ${viewYear}`
    : mode === 'week' ? `${weekDates[0]} → ${weekDates[6]}`
    : selected;

  const handleDeleteTemplate = (id: string) => onDeleteRecurring(id);

  return (
    <section className="stack">
      <div className="card calendar">
        <div className="cal-head">
          <button className="ghost" onClick={prev} aria-label={t.schedule.prevMonth}>‹</button>
          <div className="cal-title">
            <strong>{title}</strong>
            <button className="pill sm" onClick={goToday}>{t.schedule.today}</button>
          </div>
          <button className="ghost" onClick={next} aria-label={t.schedule.nextMonth}>›</button>
        </div>

        <div className="view-switch" role="tablist" aria-label="View mode">
          {(['month', 'week', 'day'] as ViewMode[]).map(m => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`view-opt ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {t.view[m]}
            </button>
          ))}
        </div>

        {mode === 'month' && (
          <>
            <div className="cal-weekdays" role="row">
              {t.weekdays.map(w => <div key={w} className="cal-wd" role="columnheader">{w}</div>)}
            </div>
            <div className="cal-grid" role="grid">
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="cal-cell empty-cell" />;
                const dayPlans = plansByDate[d] ?? [];
                const isToday = d === todayStr;
                const isSel = d === selected;
                const isDragOver = d === dragOverDate;
                const allDone = dayPlans.length > 0 && dayPlans.every(p => p.done);
                const label = `${d}${dayPlans.length ? `, ${dayPlans.length}` : ''}`;
                return (
                  <button
                    key={d}
                    className={`cal-cell ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''} ${allDone ? 'all-done' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    onClick={() => setSelected(d)}
                    onDragOver={e => onDragOver(e, d)}
                    onDragLeave={onDragLeave}
                    onDrop={e => onDrop(e, d)}
                    aria-label={label}
                    aria-pressed={isSel}
                  >
                    <span className="cal-num">{Number(d.slice(8, 10))}</span>
                    {dayPlans.length > 0 && (
                      <span className="cal-dots" aria-hidden="true">
                        {dayPlans.slice(0, 3).map(p => (
                          <span key={p.id} className={`dot ${p.done ? 'dot-done' : ''}`} />
                        ))}
                        {dayPlans.length > 3 && <span className="more">+{dayPlans.length - 3}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === 'week' && (
          <div className="week-grid">
            {weekDates.map(d => {
              const dayPlans = (plansByDate[d] ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));
              const isToday = d === todayStr;
              const isSel = d === selected;
              const isDragOver = d === dragOverDate;
              const dayNum = Number(d.slice(8, 10));
              const wd = t.weekdays[(new Date(d).getDay() + 6) % 7];
              return (
                <div
                  key={d}
                  className={`week-col ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={e => onDragOver(e, d)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, d)}
                  onClick={() => setSelected(d)}
                >
                  <div className="week-col-head">
                    <span className="week-wd">{wd}</span>
                    <span className="week-day">{dayNum}</span>
                  </div>
                  <div className="week-col-body">
                    {dayPlans.map(p => {
                      const multi = p.endDate && p.endDate > p.date;
                      return (
                        <div
                          key={`${p.id}-${d}`}
                          className={`week-chip ${p.done ? 'done' : ''} ${multi ? 'multi' : ''}`}
                          draggable={!multi || d === p.date}
                          onDragStart={e => onDragStart(e, p.id)}
                          title={p.notes ? `${timeLabel(p)} — ${p.task}\n${p.notes}` : `${timeLabel(p)} — ${p.task}`}
                        >
                          <span className="week-time">{timeLabel(p)}</span>
                          <span className="week-task">{p.task}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'day' && (
          <div className="day-timeline">
            {Array.from({ length: 24 }, (_, h) => {
              const label = `${String(h).padStart(2, '0')}:00`;
              const hourPlans = visiblePlans.filter(p => Number(p.time.slice(0, 2)) === h);
              return (
                <div key={h} className="day-hour">
                  <div className="day-hour-label">{label}</div>
                  <div className="day-hour-body">
                    {hourPlans.map(p => (
                      <div
                        key={p.id}
                        className={`day-chip ${p.done ? 'done' : ''}`}
                        draggable
                        onDragStart={e => onDragStart(e, p.id)}
                      >
                        <span className="week-time">{timeLabel(p)}</span>
                        <span className="week-task">{p.task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form className="card form" onSubmit={submit}>
        <h3>{editingId ? t.editPlan : t.schedule.add}</h3>
        <input
          ref={taskRef}
          placeholder={t.schedule.taskName}
          value={task}
          onChange={e => setTask(e.target.value)}
        />
        <div className="row">
          <label className="field">
            <span className="field-label">{t.startDate}</span>
            <input type="date" value={selected} onChange={e => setSelected(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">{t.endDate}</span>
            <input
              type="date"
              value={endDateInput}
              min={selected}
              onChange={e => setEndDateInput(e.target.value)}
            />
          </label>
        </div>
        <div className="row">
          <label className="field">
            <span className="field-label">{t.startTime}</span>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">{t.endTime}</span>
            <input
              type="time"
              value={endTimeInput}
              onChange={e => setEndTimeInput(e.target.value)}
            />
          </label>
        </div>
        <textarea
          className="notes-input"
          placeholder={`${t.notes} — ${t.notesHint}`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />
        {goals.length > 0 && (
          <label className="select-label">
            <span>{t.goals.linkGoal}</span>
            <select value={goalId} onChange={e => setGoalId(e.target.value)}>
              <option value="">—</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>
                  {t.goals.timeframes[g.timeframe]} · {formatPeriodKey(g.timeframe, g.periodKey, t.months)} — {g.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {!editingId && (
          <div className="row">
            <label className="select-label">
              <span>{t.recurring.repeat}</span>
              <select value={repeat} onChange={e => setRepeat(e.target.value as '' | PlanFrequency)}>
                <option value="">{t.recurring.none}</option>
                <option value="daily">{t.recurring.daily}</option>
                <option value="weekly">{t.recurring.weekly}</option>
                <option value="monthly">{t.recurring.monthly}</option>
              </select>
            </label>
            {repeat && (
              <input
                inputMode="numeric"
                placeholder={t.durationDays}
                value={duration}
                onChange={e => setDuration(e.target.value.replace(/[^0-9]/g, ''))}
                aria-label={t.durationDays}
              />
            )}
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
          <h3>{t.recurring.templatesPlans}</h3>
          <div className="list tight">
            {recurring.map(r => {
              const s = streakFor(r, plans);
              return (
                <div key={r.id} className="item">
                  <div className="item-body">
                    <div className="item-desc">{r.task}</div>
                    <div className="item-meta">
                      <span>{timeLabel(r)}</span>
                      <span>{t.recurring[r.frequency]}</span>
                      <span className="streak" title={`${t.streaks.current}: ${s.current} · ${t.streaks.longest}: ${s.longest}`}>
                        🔥 {s.current}{s.longest > s.current ? ` · ${s.longest}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    className="ghost"
                    onClick={() => handleDeleteTemplate(r.id)}
                    aria-label={t.recurring.removeTemplate}
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="list">
        <h4 className="list-head">{t.schedule.on} {selected}</h4>
        {visiblePlans.length === 0 && <p className="empty">{t.schedule.empty}</p>}
        {visiblePlans.map(p => {
          const span = planDayCount(p);
          const linkedGoal = p.goalId ? goalsById[p.goalId] : undefined;
          return (
            <div
              key={p.id}
              className={`item ${p.done ? 'done' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, p.id)}
            >
              <label className="check">
                <input type="checkbox" checked={p.done} onChange={() => onToggle(p.id)} />
                <div className="item-body">
                  <div className="item-desc">
                    {p.task}
                    {p.sourceId && <span className="badge-rec" aria-label="recurring">↻</span>}
                    {span > 1 && <span className="chip chip-span">{span} {t.days}</span>}
                  </div>
                  <div className="item-meta">
                    <span>{timeLabel(p)}</span>
                    {p.endDate && p.endDate !== p.date && (
                      <span className="meta-date">{p.date} → {p.endDate}</span>
                    )}
                    {linkedGoal && (
                      <span className={`chip chip-tf-${linkedGoal.timeframe} chip-goal-link`} title={linkedGoal.title}>
                        ◎ {linkedGoal.title}
                      </span>
                    )}
                  </div>
                  {p.notes && <p className="item-notes">{p.notes}</p>}
                </div>
              </label>
              <div className="item-actions">
                <button className="ghost" onClick={() => startEditPlan(p)} aria-label={t.edit}>✎</button>
                <button className="ghost" onClick={() => handleDelete(p.id)} aria-label={t.delete}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

export default ScheduleView;
