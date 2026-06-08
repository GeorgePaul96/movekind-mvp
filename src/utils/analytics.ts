import type {
  Activity,
  ActivityType,
  ComputedScores,
  Reflection,
} from '@/types';
import { addDays, isAfter, startOfWeek } from 'date-fns';
import { WEEK_OPTIONS } from './date';

export function clampScore(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

export function activitiesInWeek(
  activities: Activity[],
  weekStart: Date,
): Activity[] {
  const weekEnd = addDays(weekStart, 7);
  return activities.filter((a) => {
    const t = new Date(a.performed_at);
    return !isAfter(weekStart, t) && isAfter(weekEnd, t);
  });
}

// Placeholder simple calculations for Phase 1 pivot

export function energyScore(reflection: Reflection | null): number {
  if (!reflection) return 50;
  return clampScore((reflection.energy / 10) * 100);
}

export function stressLoadScore(
  activities: Activity[],
  now = new Date(),
): number {
  const weekly = activitiesInWeek(activities, startOfWeek(now));
  // Placeholder: just scale by number of activities
  const count = weekly.length;
  return clampScore((count / 5) * 100);
}

export function recoveryStateScore(
  reflection: Reflection | null,
): number {
  if (!reflection) return 50;
  return clampScore((reflection.recovery / 10) * 100);
}

export function computeScores(
  activities: Activity[],
  reflection: Reflection | null,
  now = new Date(),
): ComputedScores {
  return {
    energy: energyScore(reflection),
    stressLoad: stressLoadScore(activities, now),
    recoveryState: recoveryStateScore(reflection),
  };
}

export function percentChange(values: number[]): number {
  if (values.length < 2) return 0;
  const oldVal = values[0];
  const newVal = values[values.length - 1];
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  const change = ((newVal - oldVal) / oldVal) * 100;
  return Math.round(change);
}

import { previousWeeks, isoDate } from './date';

export function weeklyMinutes(
  activities: Activity[],
  weeksBack = 4,
): Array<{ label: string; minutes: number }> {
  const result = [];
  const starts = previousWeeks(weeksBack);
  for (const start of starts) {
    const weeklyActs = activities.filter((a) => {
      const t = new Date(a.performed_at);
      return !isAfter(start, t) && isAfter(addDays(start, 7), t);
    });
    const mins = weeklyActs.reduce((s, a) => s + a.duration_minutes, 0);
    // basic label formatting 'MM/DD'
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    result.push({ label, minutes: mins });
  }
  return result;
}

export function weeklyReflectionTrend(
  reflections: Reflection[],
  key: 'energy' | 'recovery' | 'mood',
  weeksBack = 4,
): Array<{ label: string; value: number }> {
  const result = [];
  const starts = previousWeeks(weeksBack);
  for (const start of starts) {
    const iso = isoDate(start);
    const match = reflections.find((r) => r.week_start === iso);
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    result.push({ label, value: match ? match[key] : 0 });
  }
  return result;
}
