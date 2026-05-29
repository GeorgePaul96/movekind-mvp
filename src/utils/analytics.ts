import type {
  Activity,
  ActivityType,
  ComputedScores,
  Reflection,
} from '@/types';
import { addDays, isAfter, startOfWeek } from 'date-fns';
import { WEEK_OPTIONS } from './date';

const STRENGTH_TYPES: readonly ActivityType[] = ['weights', 'sport'];
const ENDURANCE_TYPES: readonly ActivityType[] = ['run', 'cycle', 'swim'];
const RECOVERY_TYPES: readonly ActivityType[] = ['yoga', 'stretch', 'walk'];

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
  const minutesScore = Math.min(1, minutes / 90) * 60;
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
  const recoveryActs = weekly.filter((a) => RECOVERY_TYPES.includes(a.type));
  const recoveryMinutes = recoveryActs.reduce(
    (s, a) => s + a.duration_minutes,
    0,
  );
  const minutesScore = Math.min(1, recoveryMinutes / 60) * 50;
  const hasEasyDay = weekly.some((a) => a.effort <= 4);
  const easyDayBonus = hasEasyDay ? 20 : 0;
  const subjective = reflection ? (reflection.recovery / 10) * 30 : 15;
  return clampScore(minutesScore + easyDayBonus + subjective);
}

export function overallScore(parts: Omit<ComputedScores, 'overall'>): number {
  const { consistency, strength, endurance, recovery } = parts;
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
  const consistency = consistencyScore(activities, reflection, weeklySessionsTarget, now);
  const strength = strengthScore(activities, now);
  const endurance = enduranceScore(activities, now);
  const recovery = recoveryScore(activities, reflection, now);
  const overall = overallScore({ consistency, strength, endurance, recovery });
  return { consistency, strength, endurance, recovery, overall };
}

// ─── Movement Rhythm ─────────────────────────────────────────────────────────
// Replaces streak-based thinking with a compassionate rhythm model.
// Rest days and recovery weeks are never penalized — they are celebrated.

export interface MovementRhythm {
  label: string;
  emoji: string;
  description: string;
  // 0-4: gentle/rebuilding, 5-7: steady, 8-10: thriving
  intensity: number;
}

export function computeMovementRhythm(
  activities: Activity[],
  weeksBack: number = 4,
  now: Date = new Date(),
): MovementRhythm {
  const currentStart = startOfWeek(now, WEEK_OPTIONS);

  // Gather per-week counts over the last N weeks
  const weekCounts = Array.from({ length: weeksBack }, (_, i) => {
    const wStart = addDays(currentStart, -7 * (weeksBack - 1 - i));
    return activitiesInWeek(activities, wStart).length;
  });

  const totalActiveDays = new Set(
    activities.map((a) => new Date(a.performed_at).toDateString()),
  ).size;

  const thisWeekActs = activitiesInWeek(activities, currentStart);
  const thisWeekCount = thisWeekActs.length;

  // How many weeks had at least 1 activity
  const activeWeeks = weekCounts.filter((c) => c > 0).length;

  // Avg activities per active week (only counting weeks the user showed up)
  const avgPerActiveWeek =
    activeWeeks > 0
      ? weekCounts.reduce((s, c) => s + c, 0) / activeWeeks
      : 0;

  // Did user move this week yet?
  const movingThisWeek = thisWeekCount > 0;

  // Returning after a quiet stretch
  const lastWeekStart = addDays(currentStart, -7);
  const lastWeekCount = activitiesInWeek(activities, lastWeekStart).length;
  const isReturning = lastWeekCount === 0 && movingThisWeek;

  // Is this a deliberately restorative week (all activities are recovery types)?
  const isRestorativeWeek =
    thisWeekCount > 0 &&
    thisWeekActs.every((a) => RECOVERY_TYPES.includes(a.type));

  // No movement logged at all
  if (totalActiveDays === 0) {
    return {
      label: 'First Step',
      emoji: '🌱',
      description: 'Nothing logged yet. First session counts the same as every other.',
      intensity: 0,
    };
  }

  // Returning after a break
  if (isReturning) {
    return {
      label: 'Rebuilding Momentum',
      emoji: '🌿',
      description: 'Back after a gap. The return is the move.',
      intensity: 3,
    };
  }

  // Purely restorative week
  if (isRestorativeWeek) {
    return {
      label: 'Restorative Week',
      emoji: '🌸',
      description: 'Deliberate recovery week. Adaptation happens during rest.',
      intensity: 4,
    };
  }

  // Rest week (nothing logged, but has history)
  if (!movingThisWeek && totalActiveDays > 0) {
    return {
      label: 'Rest Week',
      emoji: '🌙',
      description: 'Quiet week, no sessions. Your body is still adapting.',
      intensity: 2,
    };
  }

  // Steady rhythm across weeks
  if (activeWeeks >= 3 && avgPerActiveWeek >= 2) {
    return {
      label: 'Steady Rhythm',
      emoji: '🍃',
      description: 'Consistent across weeks. This pattern is how lasting change works.',
      intensity: 8,
    };
  }

  // Gentle momentum
  if (thisWeekCount >= 1 && activeWeeks >= 2) {
    return {
      label: 'Gentle Flow',
      emoji: '🌱',
      description: 'Moving across multiple weeks. The pattern is forming.',
      intensity: 5,
    };
  }

  // Just getting started
  return {
    label: 'Fresh Start',
    emoji: '✨',
    description: 'Early days. Whatever you log here counts.',
    intensity: 3,
  };
}

// ─── Trend Analytics ─────────────────────────────────────────────────────────

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
