import { localDayKey, startOfLocalDay } from '@/domain/garden/days';
import type { FormulaSex, Workout, WorkoutType } from '@/types';

/**
 * Energy use, in kcal a day. Pure. Sources in src/constants/sources.ts.
 * These are population estimates: shown as a range, never as a precise figure.
 */

/** Daily burn is shown as plus or minus this share. */
export const BURN_ERROR = 0.1;

/** Resting burn, Mifflin-St Jeor (1990). */
export function restingBurn(sex: FormulaSex, weight_kg: number, height_cm: number, age: number): number {
  return 10 * weight_kg + 6.25 * height_cm - 5 * age + (sex === 'male' ? 5 : -161);
}

/** Step length as a share of height. */
const STRIDE_PER_HEIGHT = 0.414;
/** Net cost of walking, kcal per kg per km (ACSM walking equation, 0.1 ml O2 per kg per metre). */
const WALK_KCAL_PER_KG_KM = 0.5;

/** Energy spent on walking these steps, beyond resting. */
export function stepsEnergy(steps: number, height_cm: number, weight_kg: number): number {
  const km = (steps * STRIDE_PER_HEIGHT * height_cm) / 100 / 1000;
  return km * WALK_KCAL_PER_KG_KM * weight_kg;
}

/** Approximate METs from the 2011 Compendium of Physical Activities, one general value per type. */
export const WORKOUT_MET: Record<WorkoutType, number> = {
  walk: 3.5,
  run: 8.3,
  yoga: 2.5,
  gym: 3.5,
  cycle: 6.8,
  sport: 6,
  dance: 5,
  other: 4,
};

/**
 * Energy a logged workout added beyond resting. When the phone shares steps, walks and
 * runs add nothing here: the steps already contain them.
 */
export function workoutEnergy(type: WorkoutType, minutes: number, weight_kg: number, stepsAvailable: boolean): number {
  if (stepsAvailable && (type === 'walk' || type === 'run')) return 0;
  return (WORKOUT_MET[type] - 1) * weight_kg * (minutes / 60);
}

/** Resting burn times this covers digesting food and ordinary non-walking living. */
const LIVING_FACTOR = 1.2;

export function dailyBurn(i: {
  sex: FormulaSex;
  weight_kg: number;
  height_cm: number;
  age: number;
  avgSteps: number | null;
  avgWorkoutKcal: number;
}): number {
  return (
    restingBurn(i.sex, i.weight_kg, i.height_cm, i.age) * LIVING_FACTOR +
    stepsEnergy(i.avgSteps ?? 0, i.height_cm, i.weight_kg) +
    i.avgWorkoutKcal
  );
}

export const ACTIVITY_DAYS = 14;

/** Average steps and workout energy per day over the last two weeks. */
export function averageActivity(
  workouts: Workout[],
  stepsByDay: Record<string, number> | undefined,
  weight_kg: number,
  now: Date,
): { avgSteps: number | null; avgWorkoutKcal: number } {
  const since = startOfLocalDay(now, -(ACTIVITY_DAYS - 1));
  const sinceKey = localDayKey(since);
  const todayKey = localDayKey(now);

  const stepDays = Object.entries(stepsByDay ?? {}).filter(([day]) => day >= sinceKey && day <= todayKey);
  const avgSteps = stepDays.length ? stepDays.reduce((sum, [, n]) => sum + n, 0) / stepDays.length : null;

  const stepsAvailable = avgSteps != null;
  const kcal = workouts
    .filter((w) => new Date(w.created_at) >= since)
    .reduce((sum, w) => sum + workoutEnergy(w.type, w.minutes, weight_kg, stepsAvailable), 0);
  return { avgSteps, avgWorkoutKcal: kcal / ACTIVITY_DAYS };
}
