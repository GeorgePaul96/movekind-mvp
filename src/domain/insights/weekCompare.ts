import type { Session, UserState } from '@/types';
import { mapEnergyToState } from '@/domain/checkin/moods';

export interface WeekCheckIn { energy_score: number; created_at: string }
export interface WeekSession { created_at: string; status: Session['status']; seconds: number }
export interface WeekStats { days: number; minutes: number }
export interface WeekComparison {
  thisWeek: WeekStats;
  lastWeek: WeekStats;
  /** Mon→Sun of the current week: the latest mood that day, or null. */
  daily: (UserState | null)[];
}

import { isSameLocalDay, weekBounds } from '@/domain/garden/days';
export { isSameLocalDay, weekBounds };

/** Monday = 0 … Sunday = 6. */
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function compareWeeks(
  checkIns: WeekCheckIn[],
  sessions: WeekSession[],
  now: Date = new Date(),
): WeekComparison {
  const { lastStart, thisStart, nextStart } = weekBounds(now);
  const inThis = (t: Date) => t >= thisStart && t < nextStart;
  const inLast = (t: Date) => t >= lastStart && t < thisStart;

  const thisDays = new Set<string>();
  const lastDays = new Set<string>();
  const daily: (UserState | null)[] = [null, null, null, null, null, null, null];
  const latestAt: number[] = [-1, -1, -1, -1, -1, -1, -1];

  for (const ci of checkIns) {
    const t = new Date(ci.created_at);
    if (inThis(t)) {
      thisDays.add(dayKey(t));
      const i = weekdayIndex(t);
      if (t.getTime() > latestAt[i]!) {
        latestAt[i] = t.getTime();
        daily[i] = mapEnergyToState(ci.energy_score);
      }
    } else if (inLast(t)) {
      lastDays.add(dayKey(t));
    }
  }

  let thisSeconds = 0;
  let lastSeconds = 0;
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    const t = new Date(s.created_at);
    if (inThis(t)) thisSeconds += s.seconds;
    else if (inLast(t)) lastSeconds += s.seconds;
  }

  return {
    thisWeek: { days: thisDays.size, minutes: Math.round(thisSeconds / 60) },
    lastWeek: { days: lastDays.size, minutes: Math.round(lastSeconds / 60) },
    daily,
  };
}
