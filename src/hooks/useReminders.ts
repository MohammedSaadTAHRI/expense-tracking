import { useEffect, useRef } from 'react';
import type { Plan } from '../types';
import type { Dict } from '../i18n';
import { today } from '../lib/date';
import { notify } from '../lib/notifications';

const CHECK_INTERVAL_MS = 30_000;

export function useReminders(plans: Plan[], enabled: boolean, t: Dict) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = today();
      for (const p of plans) {
        if (p.done || p.date !== todayStr || p.time !== hhmm) continue;
        if (firedRef.current.has(p.id)) continue;
        firedRef.current.add(p.id);
        notify(p.task, t.notifications.reminderBody);
      }
    };
    tick();
    const id = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [plans, enabled, t]);
}
