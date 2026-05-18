import type {
  Activity,
  ActivityType,
  ComputedScores,
  Reflection,
} from '@/types';
import { addDays, isAfter, startOfWeek } from 'date-fns';
import { WEEK_OPTIONS } from './date';

/**
 * Analytics — pure functions that turn raw data into 0..100 scores.
 *
 * Design notes:
 * - All functions are side-effect-free so they can be unit-tested.
 * - Each sub-score is clamped to [0, 100] and rounded to an integer.
 * - "now" is injectable so tests can pin time.
 */

const STRENGTH_TYPES: readonly ActivityType[] = ['weights', 'sport'];
const ENDURANCE_TYPES: readonly ActivityType[] = ['run', 'cycle', 'swim'];
const RECOVERY_TYPES: readonly ActivityType[] = ['yoga', 'stretch', 'walk'];

const DEFAULT_WEEKLY_MINUTES_TARGET = 150;
const DEFAULT_WEEKLY_SESSIONS_TARGET = 4;

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

/**
 * Consistency reflects "did you show up across the week", weighted toward
 * variety of days rather than total volume.
 */
export function consistencyScore(
  activities: Activity[],
  reflection: Reflection | null,
  weeklySessionsTarget = DEFAULT_WEEKLY_SESSIONS_TARGET,
  now: Date = new Date(),
): number {
  const weekStart = startOfWeek(now, WEEK_OPTIONS);
  const weekly = activitiesInWeek(activities, weekStart);
  const uniqueDays = new Set(
    weekly.map((a) => new Date(a.performed_at).toDateString()),
  ).size;
  const sessionRatio = Math.min(1, uniqueDays / weeklySessionsTarget);
  let score = sessionRatio * 100;
  if (reflection) {
    // Blend 70/30 with the user's own felt sense of consistency.
    score = score * 0.7 + (reflection.consistency / 10) * 100 * 0.3;
  }
  return clampScore(score);
}

export function strengthScore(
  activities: Activity[],
  now: Date = new Date(),
): number {
  const weekStart = startOfWeek(now, WEEK_OPTIONS);
  const weekly = activitiesInWeek(activities, weekStart);
  const strengthActs = weekly.filter((a) => STRENGTH_TYPES.includes(a.type));
  if (strengthActs.length === 0) return 0;
  const minutes = strengthActs.reduce((s, a) => s + a.duration_minutes, 0);
  const avgEffort =
    strengthActs.reduce((s, a) => s + a.effort, 0) / strengthActs.length;
  // 90 minutes of strength work per week = full minutes credit.
  const minutesScore = Math.min(1, minutes / 90) * 60;
  // Effort 1..10 maps to 0..40.
  const effortScore = (avgEffort / 10) * 40;
  return clampScore(minutesScore + effortScore);
}

export function enduranceScore(
  activities: Activity[],
  now: Date = new Date(),
): number {
  const weekStart = startOfWeek(now, WEEK_OPTIONS);
  const weekly = activitiesInWeek(activities, weekStart);
  const enduranceActs = weekly.filter((a) =>
    ENDURANCE_TYPES.includes(a.type),
  );
  if (enduranceActs.length === 0) return 0;
  const minutes = enduranceActs.reduce((s, a) => s + a.duration_minutes, 0);
  const avgEffort =
    enduranceActs.reduce((s, a) => s + a.effort, 0) / enduranceActs.length;
  // 120 minutes of cardio = full minutes credit.
  const minutesScore = Math.min(1, minutes / 120) * 70;
  const effortScore = (avgEffort / 10) * 30;
  return clampScore(minutesScore + effortScore);
}

export function recoveryScore(
  activities: Activity[],
  reflection: Reflection | null,
  now: Date = new Date(),
): number {
  const weekStart = startOfWeek(now, WEEK_OPTIONS);
  const weekly = activitiesInWeek(activities, weekStart);

  // Base: did the user include any restorative work?
  const recoveryActs = weekly.filter((a) => RECOVERY_TYPES.includes(a.type));
  const recoveryMinutes = recoveryActs.reduce(
    (s, a) => s + a.duration_minutes,
    0,
  );
  const minutesScore = Math.min(1, recoveryMinutes / 60) * 50;

  // Avoid penalising rest weeks — having a low-effort day actually helps.
  const hasEasyDay = weekly.some((a) => a.effort <= 4);
  const easyDayBonus = hasEasyDay ? 20 : 0;

  // Subjective recovery from reflection (if available).
  const subjective = reflection ? (reflection.recovery / 10) * 30 : 15;

  return clampScore(minutesScore + easyDayBonus + subjective);
}

export function overallScore(parts: Omit<ComputedScores, 'overall'>): number {
  const { consistency, strength, endurance, recovery } = parts;
  // Weight consistency highest — that's the MoveKind philosophy.
  const weighted =
    consistency * 0.4 + endurance * 0.25 + strength * 0.2 + recovery * 0.15;
  return clampScore(weighted);
}

export function computeScores(
  activities: Activity[],
  reflection: Reflection | null,
  weeklySessionsTarget = DEFAULT_WEEKLY_SESSIONS_TARGET,
  now: Date = new Date(),
): ComputedScores {
  const consistency = consistencyScore(
    activities,
    reflection,
    weeklySessionsTarget,
    now,
  );
  const strength = strengthScore(activities, now);
  const endurance = enduranceScore(activities, now);
  const recovery = recoveryScore(activities, reflection, now);
  const overall = overallScore({ consistency, strength, endurance, recovery });
  return { consistency, strength, endurance, recovery, overall };
}

/**
 * Bin the last `weeks` weeks' activities by total minutes.
 * Returns oldest -> newest.
 */
export function weeklyMinutes(
  activities: Activity[],
  weeks: number,
  now: Date = new Date(),
): { label: string; minutes: number }[] {
  const currentStart = startOfWeek(now, WEEK_OPTIONS);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(currentStart, -7 * (weeks - 1 - i));
    const end = addDays(start, 7);
    const total = activities
      .filter((a) => {
        const t = new Date(a.performed_at);
        return !isAfter(start, t) && isAfter(end, t);
      })
      .reduce((s, a) => s + a.duration_minutes, 0);
    return { label: `W${i + 1}`, minutes: total };
  });
}

/**
 * Used by the energy and recovery trend charts.
 */
export function weeklyReflectionTrend(
  reflections: Reflection[],
  key: 'energy' | 'recovery' | 'consistency' | 'mood',
  weeks: number,
  now: Date = new Date(),
): { label: string; value: number }[] {
  const currentStart = startOfWeek(now, WEEK_OPTIONS);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(currentStart, -7 * (weeks - 1 - i));
    const iso = start.toISOString().slice(0, 10);
    const match = reflections.find((r) => r.week_start === iso);
    return { label: `W${i + 1}`, value: match ? match[key] : 0 };
  });
}

export function percentChange(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0]!;
  const last = values[values.length - 1]!;
  if (first === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 100);
}
