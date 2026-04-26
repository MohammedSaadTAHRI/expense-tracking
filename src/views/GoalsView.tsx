import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Dict } from '../i18n';
import type { Goal, GoalStatus, GoalTimeframe, Plan } from '../types';
import { uid } from '../storage';
import {
  TIMEFRAMES, TIMEFRAME_RANK,
  canParent, formatPeriodKey, periodKeyFor, progressFor, suggestStatus,
} from '../lib/goals';

interface Props {
  t: Dict;
  goals: Goal[];
  plans: Plan[];
  onAdd: (g: Goal) => void;
  onUpdate: (g: Goal) => void;
  onDelete: (id: string) => void;
}

type StatusLabelKey = 'onTrack' | 'offTrackPlan' | 'offTrackNoPlan';

const STATUS_META: Record<GoalStatus, { glyph: string; cls: string; key: StatusLabelKey }> = {
  'on-track':           { glyph: '🌱', cls: 'goal-on',     key: 'onTrack' },
  'off-track-plan':     { glyph: '⚠',  cls: 'goal-warn',   key: 'offTrackPlan' },
  'off-track-no-plan':  { glyph: '🚨', cls: 'goal-danger', key: 'offTrackNoPlan' },
};

export default function GoalsView({ t, goals, plans, onAdd, onUpdate, onDelete }: Props) {
  const [filter, setFilter] = useState<'' | GoalTimeframe>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [intention, setIntention] = useState('');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('quarter');
  const [periodKey, setPeriodKey] = useState<string>(periodKeyFor('quarter'));
  const [parentId, setParentId] = useState<string>('');
  const [status, setStatus] = useState<GoalStatus>('on-track');
  const [recoveryPlan, setRecoveryPlan] = useState('');

  const reset = () => {
    setEditingId(null);
    setTitle(''); setWhy(''); setIntention('');
    setTimeframe('quarter'); setPeriodKey(periodKeyFor('quarter'));
    setParentId(''); setStatus('on-track'); setRecoveryPlan('');
  };

  const onTimeframeChange = (tf: GoalTimeframe) => {
    setTimeframe(tf);
    setPeriodKey(periodKeyFor(tf));
    setParentId('');
  };

  const draftGoal: Goal = {
    id: editingId ?? '',
    title, notes: why || undefined,
    intention: intention || undefined,
    timeframe, periodKey,
    parentId: parentId || undefined,
    status,
    recoveryPlan: status === 'off-track-plan' ? (recoveryPlan || undefined) : undefined,
    createdAt: '',
  };

  const parentOptions = useMemo(
    () => goals.filter(g => g.id !== editingId && canParent(g, draftGoal)),
    [goals, editingId, timeframe, periodKey],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (status === 'off-track-plan' && !recoveryPlan.trim()) return;

    if (editingId) {
      const prev = goals.find(g => g.id === editingId);
      if (!prev) return;
      onUpdate({ ...draftGoal, id: editingId, createdAt: prev.createdAt });
    } else {
      onAdd({ ...draftGoal, id: uid(), createdAt: new Date().toISOString() });
    }
    reset();
  };

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setTitle(g.title);
    setWhy(g.notes ?? '');
    setIntention(g.intention ?? '');
    setTimeframe(g.timeframe);
    setPeriodKey(g.periodKey);
    setParentId(g.parentId ?? '');
    setStatus(g.status);
    setRecoveryPlan(g.recoveryPlan ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setGoalStatus = (g: Goal, next: GoalStatus) => {
    if (next === 'off-track-plan' && !(g.recoveryPlan ?? '').trim()) {
      const ans = window.prompt(t.goals.recoveryHint, g.recoveryPlan ?? '');
      if (!ans || !ans.trim()) return;
      onUpdate({ ...g, status: 'off-track-plan', recoveryPlan: ans.trim() });
      return;
    }
    onUpdate({ ...g, status: next, recoveryPlan: next === 'off-track-plan' ? g.recoveryPlan : undefined });
  };

  const goalsById = useMemo(() => Object.fromEntries(goals.map(g => [g.id, g])), [goals]);

  const sorted = useMemo(() => {
    const filtered = filter ? goals.filter(g => g.timeframe === filter) : goals;
    return filtered.slice().sort((a, b) => {
      const tr = TIMEFRAME_RANK[a.timeframe] - TIMEFRAME_RANK[b.timeframe];
      if (tr !== 0) return tr;
      if (a.periodKey !== b.periodKey) return a.periodKey.localeCompare(b.periodKey);
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [goals, filter]);

  return (
    <section className="stack">
      <div className="card">
        <h3>{t.goals.title}</h3>
        <p className="hint">{t.goals.hint}</p>
        <div className="row goal-filter" role="tablist">
          <button
            type="button"
            className={`pill sm ${filter === '' ? 'pill-on' : ''}`}
            onClick={() => setFilter('')}
          >{t.goals.filterAll}</button>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              type="button"
              className={`pill sm ${filter === tf ? 'pill-on' : ''}`}
              onClick={() => setFilter(tf)}
            >{t.goals.timeframes[tf]}</button>
          ))}
        </div>
      </div>

      <form className="card form" onSubmit={submit}>
        <h3>{editingId ? t.goals.edit : t.goals.add}</h3>
        <input
          placeholder={t.goals.titleField}
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <div className="row">
          <label className="field">
            <span className="field-label">{t.goals.timeframe}</span>
            <select value={timeframe} onChange={e => onTimeframeChange(e.target.value as GoalTimeframe)}>
              {TIMEFRAMES.map(tf => (
                <option key={tf} value={tf}>{t.goals.timeframes[tf]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">{t.goals.period}</span>
            <input
              value={periodKey}
              onChange={e => setPeriodKey(e.target.value)}
              placeholder={periodKeyFor(timeframe)}
            />
          </label>
        </div>
        <label className="select-label">
          <span>{t.goals.parent}</span>
          <select value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">{t.goals.noParent}</option>
            {parentOptions.map(g => (
              <option key={g.id} value={g.id}>
                {t.goals.timeframes[g.timeframe]} · {formatPeriodKey(g.timeframe, g.periodKey, t.months)} — {g.title}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="notes-input"
          placeholder={t.goals.why}
          value={why}
          onChange={e => setWhy(e.target.value)}
          rows={2}
        />
        <textarea
          className="notes-input"
          placeholder={`${t.goals.intention} — ${t.goals.intentionHint}`}
          value={intention}
          onChange={e => setIntention(e.target.value)}
          rows={2}
        />
        <div className="row">
          <label className="select-label">
            <span>{t.goals.status}</span>
            <select value={status} onChange={e => setStatus(e.target.value as GoalStatus)}>
              <option value="on-track">{t.goals.onTrack}</option>
              <option value="off-track-plan">{t.goals.offTrackPlan}</option>
              <option value="off-track-no-plan">{t.goals.offTrackNoPlan}</option>
            </select>
          </label>
          {status === 'off-track-plan' && (
            <input
              placeholder={t.goals.recoveryHint}
              value={recoveryPlan}
              onChange={e => setRecoveryPlan(e.target.value)}
              required
              aria-label={t.goals.recoveryPlan}
            />
          )}
        </div>
        <div className="row">
          <button type="submit" className="primary">{t.save}</button>
          {editingId && (
            <button type="button" className="pill" onClick={reset}>{t.cancel}</button>
          )}
        </div>
      </form>

      <div className="list">
        {sorted.length === 0 && <p className="empty">{t.goals.empty}</p>}
        {sorted.map(g => {
          const prog = progressFor(g, plans);
          const meta = STATUS_META[g.status];
          const parent = g.parentId ? goalsById[g.parentId] : undefined;
          const sug = suggestStatus(g, plans);
          const linked = plans.filter(p => p.goalId === g.id);

          return (
            <div key={g.id} className={`card goal-card ${meta.cls}`}>
              <div className="goal-head">
                <div className="goal-title-block">
                  <div className="goal-meta-top">
                    <span className={`chip chip-tf-${g.timeframe}`}>{t.goals.timeframes[g.timeframe]}</span>
                    <span className="goal-period">{formatPeriodKey(g.timeframe, g.periodKey, t.months)}</span>
                    {parent && (
                      <span className="goal-parent" title={parent.title}>↑ {parent.title}</span>
                    )}
                  </div>
                  <h4 className="goal-title">{g.title}</h4>
                  {g.notes && <p className="goal-why">{g.notes}</p>}
                  {g.intention && <p className="goal-intention"><strong>If-then:</strong> {g.intention}</p>}
                </div>
                <div className="item-actions">
                  <button className="ghost" onClick={() => startEdit(g)} aria-label={t.edit}>✎</button>
                  <button className="ghost" onClick={() => onDelete(g.id)} aria-label={t.delete}>✕</button>
                </div>
              </div>

              <div className="goal-status-row">
                {(['on-track', 'off-track-plan', 'off-track-no-plan'] as GoalStatus[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`status-pill ${g.status === s ? 'on' : ''} status-${s}`}
                    onClick={() => setGoalStatus(g, s)}
                  >
                    {STATUS_META[s].glyph} {t.goals[STATUS_META[s].key]}
                  </button>
                ))}
              </div>

              {g.status === 'off-track-plan' && g.recoveryPlan && (
                <p className="goal-recovery"><strong>{t.goals.recoveryPlan}:</strong> {g.recoveryPlan}</p>
              )}

              <div className="goal-progress">
                <div className="bar-track">
                  <div
                    className={`bar-fill ${meta.cls}-fill`}
                    style={{ width: `${prog.pct}%` }}
                  />
                </div>
                <div className="budget-meta">
                  <span>{t.goals.progress}: {prog.done}/{prog.total} ({prog.pct}%)</span>
                  {prog.total > 0 && (
                    <span className={sug.hint === 'behind' ? 'over' : ''}>
                      {sug.hint === 'behind' ? t.goals.suggestBehind : t.goals.suggestAhead}
                    </span>
                  )}
                </div>
              </div>

              <details className="goal-links">
                <summary>{t.goals.linkedPlans} ({linked.length})</summary>
                {linked.length === 0 && <p className="hint">{t.goals.noLinks}</p>}
                {linked.map(p => (
                  <div key={p.id} className={`item tight ${p.done ? 'done' : ''}`}>
                    <div className="item-body">
                      <div className="item-desc">{p.task}</div>
                      <div className="item-meta">
                        <span>{p.date}{p.endDate ? ` → ${p.endDate}` : ''}</span>
                        <span>{p.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </details>
            </div>
          );
        })}
      </div>
    </section>
  );
}
