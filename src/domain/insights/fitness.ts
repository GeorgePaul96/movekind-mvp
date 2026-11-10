import { startOfLocalDay } from '@/domain/garden/days';
import type { FormulaSex, PulseLog, Workout, WorkoutType } from '@/types';

/** Movement usually done "taking it easy"; the other types count as breathing hard. */
const EASY_TYPES: ReadonlySet<WorkoutType> = new Set<WorkoutType>(['walk', 'yoga', 'other']);

/**
 * Estimated cardio fitness (VO2peak, ml per kg per minute) without an exercise test:
 * the HUNT non-exercise model (Nes and others, 2011). Pure.
 *
 * The equation's coefficients are the published ones. The activity index is the product
 * of how often, how hard and how long someone moves; the scoring below follows the
 * commonly used reading of the HUNT questionnaire (0 to 45) and is filled in from logged
 * movement, so the app shows what it assumed. "Fitness age" is deliberately not offered:
 * its reference table could not be checked against the source.
 */

/** The model's standard error, ml per kg per minute. */
export const VO2_ERROR: Record<FormulaSex, number> = { male: 5.7, female: 5.1 };

export const FITNESS_WEEKS = 4;
const PULSE_FRESH_DAYS = 30;

export interface ActivityIndex {
  index: number;
  perWeek: number;
  avgMinutes: number;
  /** How hard, as the model words it. */
  intensity: 'easy' | 'breathing-hard';
}

export function activityIndex(workouts: Workout[], now: Date): ActivityIndex {
  const since = startOfLocalDay(now, -(FITNESS_WEEKS * 7 - 1));
  const recent = workouts.filter((w) => new Date(w.created_at) >= since);
  const perWeek = recent.length / FITNESS_WEEKS;
  const avgMinutes = recent.length ? recent.reduce((s, w) => s + w.minutes, 0) / recent.length : 0;
  const harder = recent.filter((w) => !EASY_TYPES.has(w.type)).length;

  const frequency = perWeek < 1 ? 0 : perWeek < 2 ? 1 : perWeek < 4 ? 2 : 3;
  const duration = avgMinutes >= 30 ? 1.5 : 1;
  // Logged types cannot show "near exhaustion", so the top score (10) is never assumed.
  const intensity = recent.length && harder * 2 >= recent.length ? 'breathing-hard' : 'easy';
  return { index: frequency * duration * (intensity === 'easy' ? 1 : 5), perWeek, avgMinutes, intensity };
}

export function vo2peak(i: {
  sex: FormulaSex;
  age: number;
  waist_cm: number;
  restingPulse: number;
  activityIndex: number;
}): number {
  return i.sex === 'male'
    ? 100.27 - 0.296 * i.age - 0.369 * i.waist_cm - 0.155 * i.restingPulse + 0.226 * i.activityIndex
    : 74.736 - 0.247 * i.age - 0.259 * i.waist_cm - 0.114 * i.restingPulse + 0.198 * i.activityIndex;
}

/** The latest resting pulse counted in the last 30 days. */
export function restingPulse(pulses: PulseLog[], now: Date): number | null {
  const since = startOfLocalDay(now, -PULSE_FRESH_DAYS).toISOString();
  const fresh = pulses.filter((p) => p.created_at >= since).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return fresh[0]?.bpm ?? null;
}
