import { isSameLocalDay, localDayKey } from '@/domain/garden/days';
import type { CheckIn, MealLog, SleepLog, WaterLog, Workout } from '@/types';

/**
 * What has been cared for today, for the row of dots on the simple home. Pure.
 * A dot only ever fills: nothing here counts what is missing or sets a target.
 */
export const CARE_KINDS = ['mood', 'water', 'food', 'movement', 'sleep'] as const;
export type CareKind = (typeof CARE_KINDS)[number];

export function careToday(
  i: { checkIns: CheckIn[]; water: WaterLog[]; meals: MealLog[]; workouts: Workout[]; sleep: SleepLog[] },
  now: Date,
): Record<CareKind, boolean> {
  const today = (iso: string) => isSameLocalDay(new Date(iso), now);
  return {
    mood: i.checkIns.some((c) => today(c.created_at)),
    water: i.water.some((w) => today(w.created_at)),
    food: i.meals.some((m) => today(m.created_at)),
    movement: i.workouts.some((w) => today(w.created_at)),
    sleep: i.sleep.some((s) => s.night_of === localDayKey(now)),
  };
}

export function partOfDay(d: Date): 'morning' | 'afternoon' | 'evening' {
  const h = d.getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

/** Slow breathing as the NHS describes it: in for a count of five, out for a count of five. */
export const BREATH_COUNT = 5;
export const BREATH_MINUTES = [1, 3, 5] as const;

/** Where a breathing session is after `elapsed` whole seconds. */
export function breathAt(elapsed: number, minutes: number): { phase: 'in' | 'out' | 'done'; count: number } {
  if (elapsed >= minutes * 60) return { phase: 'done', count: 0 };
  const inCycle = elapsed % (BREATH_COUNT * 2);
  return inCycle < BREATH_COUNT
    ? { phase: 'in', count: inCycle + 1 }
    : { phase: 'out', count: inCycle - BREATH_COUNT + 1 };
}
