import { subDays, startOfWeek, addDays, format } from 'date-fns';
import { WEEK_OPTIONS } from './date';
import { activitiesInWeek } from './analytics';
import type { Activity } from '@/types';

export type RhythmLabel =
  | 'Finding Your Way'
  | 'Early Rhythm'
  | 'Growing Consistency'
  | 'Steady Rhythm'
  | 'Deep Rhythm';

export interface RhythmScore {
  percentage: number; // 0–100, integer
  activeDays: number; // unique days with activity in last 28
  label: RhythmLabel;
}

export function computeRhythmScore(
  activities: Activity[],
  now: Date = new Date(),
): RhythmScore {
  const cutoff = subDays(now, 28);
  const activeDaySet = new Set(
    activities
      .filter((a) => new Date(a.performed_at) >= cutoff)
      .map((a) => new Date(a.performed_at).toDateString()),
  );
  const activeDays = activeDaySet.size;
  const percentage = Math.round((activeDays / 28) * 100);

  let label: RhythmLabel;
  if (percentage <= 20) label = 'Finding Your Way';
  else if (percentage <= 43) label = 'Early Rhythm';        // ~12 days
  else if (percentage <= 57) label = 'Growing Consistency'; // ~16 days
  else if (percentage <= 78) label = 'Steady Rhythm';       // ~22 days
  else label = 'Deep Rhythm';

  return { percentage, activeDays, label };
}

export interface WeekCount {
  label: string;     // short date, e.g. "May 15"
  sessions: number;
  isCurrent: boolean;
}

export function weeklySessionCounts(
  activities: Activity[],
  weeks: number = 12,
  now: Date = new Date(),
): WeekCount[] {
  const currentStart = startOfWeek(now, WEEK_OPTIONS);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(currentStart, -7 * (weeks - 1 - i));
    return {
      label: format(start, 'MMM d'),
      sessions: activitiesInWeek(activities, start).length,
      isCurrent: i === weeks - 1,
    };
  });
}
