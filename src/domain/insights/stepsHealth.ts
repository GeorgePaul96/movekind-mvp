import { localDayKey, startOfLocalDay } from '@/domain/garden/days';

/**
 * Where the person's recent steps sit on the published steps and long-term health curve
 * (Paluch and others, 2022: 15 cohorts, about 47,000 adults). Pure.
 * This is an association seen across large groups, not a promise for one person.
 */

export const STEPS_DAYS = 14;
export const MIN_STEP_DAYS = 7;

/**
 * The study's four groups: median steps a day and risk relative to the least active group.
 * The first three ratios are from the paper's abstract; the fourth (0.47) matches the
 * paper's reported 40 to 53% lower risk across the upper groups.
 */
export const STEPS_CURVE: readonly (readonly [number, number])[] = [
  [3553, 1],
  [5801, 0.6],
  [7842, 0.55],
  [10901, 0.47],
];

/** Risk relative to the least active group, read off the curve (flat beyond its ends). */
export function relativeRiskAt(steps: number): number {
  const first = STEPS_CURVE[0];
  const last = STEPS_CURVE[STEPS_CURVE.length - 1];
  if (steps <= first[0]) return first[1];
  if (steps >= last[0]) return last[1];
  for (let k = 1; k < STEPS_CURVE.length; k++) {
    const [x1, y1] = STEPS_CURVE[k - 1];
    const [x2, y2] = STEPS_CURVE[k];
    if (steps <= x2) return y1 + ((steps - x1) / (x2 - x1)) * (y2 - y1);
  }
  return last[1];
}

export function stepsHealth(
  stepsByDay: Record<string, number> | undefined,
  age: number,
  now: Date,
): { average: number; relativeRisk: number; plateau: [number, number]; days: number } | null {
  if (!stepsByDay) return null;
  const sinceKey = localDayKey(startOfLocalDay(now, -STEPS_DAYS));
  const todayKey = localDayKey(now);
  // Today is still in progress, so it is left out of the average.
  const days = Object.entries(stepsByDay).filter(([day]) => day >= sinceKey && day < todayKey);
  if (days.length < MIN_STEP_DAYS) return null;
  const average = Math.round(days.reduce((sum, [, n]) => sum + n, 0) / days.length);
  return {
    average,
    relativeRisk: relativeRiskAt(average),
    // Where the benefit levels off, by age group, as the paper reports it.
    plateau: age >= 60 ? [6000, 8000] : [8000, 10000],
    days: days.length,
  };
}
