import { addDays, differenceInCalendarDays, startOfWeek } from 'date-fns';
import { activitiesInWeek } from './analytics';
import { WEEK_OPTIONS } from './date';
import { parseWellness } from '@/types';
import type { Activity, Reflection } from '@/types';
import type { Intention } from '@/services/intentions';

// ─── Heuristic Constants ──────────────────────────────────────────────────────
// All thresholds are calibrated estimates, not psychological truths.
// Tune these as real usage data accumulates.

// Gap detection
export const GAP_DEFINITION_DAYS = 3;
export const GAP_HISTORY_SIZE = 5;

// RecoveryState
export const EXTENDED_ABSENCE_DAYS = 10;
export const PATTERN_DISRUPTED_GAP_DAYS = 7;
export const CONSECUTIVE_UNMET_THRESHOLD = 2;
export const HIGH_STRESS_GAP_DAYS = 5;
export const HIGH_STRESS_THRESHOLD = 7;
export const HIGH_SORENESS_THRESHOLD = 7;

// Trend sensitivity
export const TREND_SHRINKING_FACTOR = 0.8;
export const TREND_GROWING_FACTOR = 1.2;
export const FASTER_RETURN_FACTOR = 0.8;

// Rhythm stability
export const RHYTHM_WINDOW_WEEKS = 8;
export const STABILIZING_VARIANCE_FACTOR = 0.7;
export const FRAGMENTING_VARIANCE_FACTOR = 1.3;
export const STABLE_VARIANCE_MAX = 1.5;
export const STABLE_AVG_SESSIONS_MIN = 0.5;

// ReturnReliability labels
export const ANCHORED_AVG_GAP_MAX = 5;
export const ANCHORED_ACTIVE_RATIO_MIN = 0.8;
export const RESILIENT_ACTIVE_RATIO_MIN = 0.5;
export const INTERMITTENT_ACTIVE_RATIO_MIN = 0.3;
export const FRAGMENTED_AVG_GAP_MIN = 20;
export const FRAGMENTED_GAP_COUNT_MIN = 3;

// Moments
export const MAX_MOMENTS = 3;
export const DIFFICULT_WEEK_ENERGY_MAX = 4;
export const MOMENT_RELEVANCE_DAYS: Record<MomentType, number> = {
  reliable_returner: 60,
  faster_return: 14,
  staying_connected: 14,
  intention_followed: 14,
  gaps_narrowing: 30,
  rhythm_rebuilding: 30,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type Confidence = 'low' | 'medium' | 'high';

export interface GapProfile {
  hasHistory: boolean;
  lastGapDays: number;
  avgGapDays: number;
  gapHistory: number[];
  totalGapCount: number;
  longestGapDays: number;
  trend: 'shrinking' | 'stable' | 'growing' | 'insufficient_data';
  observation: string | null;
  confidence: Confidence;
}

export interface RhythmStability {
  weeklyVariance: number;
  avgWeeklySessions: number;
  trajectory:
    | 'stabilizing'
    | 'stable'
    | 'fragmenting'
    | 'rebuilding'
    | 'insufficient_data';
  observation: string | null;
  confidence: Confidence;
}

export interface RecoveryState {
  signal: 'needs_reentry' | 'returning' | 'stable' | 'thriving';
  isExtendedAbsence: boolean;
  isPatternDisrupted: boolean;
  isHighStressSignal: boolean;
  reEntryReadiness: 'high' | 'medium' | 'low';
  confidence: Confidence;
}

export interface ReturnReliability {
  // NOTE FOR 3A-2 CONSUMERS: When label === 'insufficient_data',
  // use rhythm and recovery as the primary behavioral signals instead.
  label:
    | 'anchored'
    | 'resilient'
    | 'intermittent'
    | 'fragmented'
    | 'insufficient_data';
  gapCount: number;
  longestGapDays: number;
  activeMonths: number;
  confidence: Confidence;
}

export type MomentType =
  | 'reliable_returner'
  | 'faster_return'
  | 'staying_connected'
  | 'intention_followed'
  | 'gaps_narrowing'
  | 'rhythm_rebuilding';

export interface BehavioralMoment {
  type: MomentType;
  observation: string;
  observedAt: string;
}

export interface BehavioralProfile {
  gaps: GapProfile;
  rhythm: RhythmStability;
  recovery: RecoveryState;
  returnReliability: ReturnReliability;
  moments: BehavioralMoment[];
  // Aggregate confidence: minimum across all four domains.
  // Consumers can gate on this single value without inspecting each domain.
  profileConfidence: Confidence;
  // Future domains — add as optional fields here:
  // bodyPattern?: BodyPattern;
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function populationVariance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
}

// ─── Sub-functions (exported for independent testing) ─────────────────────────

export function computeGapProfile(activities: Activity[], now: Date): GapProfile {
  if (activities.length === 0) {
    return {
      hasHistory: false,
      lastGapDays: 0,
      avgGapDays: 0,
      gapHistory: [],
      totalGapCount: 0,
      longestGapDays: 0,
      trend: 'insufficient_data',
      observation: null,
      confidence: 'low',
    };
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime(),
  );

  const allGaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = differenceInCalendarDays(
      new Date(sorted[i]!.performed_at),
      new Date(sorted[i - 1]!.performed_at),
    );
    if (gap > GAP_DEFINITION_DAYS) allGaps.push(gap);
  }

  const totalGapCount = allGaps.length;
  const longestGapDays = allGaps.length > 0 ? Math.max(...allGaps) : 0;
  const avgGapDays =
    allGaps.length > 0
      ? Math.round(allGaps.reduce((s, g) => s + g, 0) / allGaps.length)
      : 0;
  const gapHistory = allGaps.slice(-GAP_HISTORY_SIZE);
  const lastGapDays = differenceInCalendarDays(
    now,
    new Date(sorted[sorted.length - 1]!.performed_at),
  );

  let trend: GapProfile['trend'] = 'insufficient_data';
  if (gapHistory.length >= 2) {
    const lastGap = gapHistory[gapHistory.length - 1]!;
    if (lastGap < avgGapDays * TREND_SHRINKING_FACTOR) trend = 'shrinking';
    else if (lastGap > avgGapDays * TREND_GROWING_FACTOR) trend = 'growing';
    else trend = 'stable';
  }

  let observation: string | null = null;
  if (
    trend === 'shrinking' &&
    gapHistory.length >= 2 &&
    lastGapDays < avgGapDays * FASTER_RETURN_FACTOR
  ) {
    observation = `Back in ${lastGapDays} days — ${avgGapDays} is your usual.`;
  }

  let confidence: Confidence = 'low';
  if (gapHistory.length >= 5) confidence = 'high';
  else if (gapHistory.length >= 3) confidence = 'medium';

  return {
    hasHistory: true,
    lastGapDays,
    avgGapDays,
    gapHistory,
    totalGapCount,
    longestGapDays,
    trend,
    observation,
    confidence,
  };
}

export function computeRhythmStability(activities: Activity[], now: Date): RhythmStability {
  const weekStart = startOfWeek(now, WEEK_OPTIONS);
  const weekCounts = Array.from({ length: RHYTHM_WINDOW_WEEKS }, (_, i) => {
    const wStart = addDays(weekStart, -7 * (RHYTHM_WINDOW_WEEKS - 1 - i));
    return activitiesInWeek(activities, wStart).length;
  });

  const activeWeeks = weekCounts.filter((c) => c > 0).length;
  const mean = weekCounts.reduce((s, c) => s + c, 0) / RHYTHM_WINDOW_WEEKS;
  const variance = populationVariance(weekCounts);

  const firstHalf = weekCounts.slice(0, 4);
  const secondHalf = weekCounts.slice(4);
  const firstVariance = populationVariance(firstHalf);
  const secondVariance = populationVariance(secondHalf);

  let trajectory: RhythmStability['trajectory'];
  if (activeWeeks < 2) {
    trajectory = 'insufficient_data';
  } else if (
    secondVariance < firstVariance * STABILIZING_VARIANCE_FACTOR &&
    secondHalf.some((c) => c > 0)
  ) {
    trajectory = 'stabilizing';
  } else if (variance < STABLE_VARIANCE_MAX && mean >= STABLE_AVG_SESSIONS_MIN) {
    trajectory = 'stable';
  } else if (secondVariance > firstVariance * FRAGMENTING_VARIANCE_FACTOR) {
    trajectory = 'fragmenting';
  } else if (secondVariance < firstVariance && secondHalf.some((c) => c > 0)) {
    trajectory = 'rebuilding';
  } else {
    trajectory = 'insufficient_data';
  }

  const observation: string | null =
    trajectory === 'stabilizing'
      ? 'More consistent across recent weeks than the month before.'
      : trajectory === 'stable'
        ? 'Consistent week-to-week. Weeks like these compound.'
        : null;

  let confidence: Confidence = 'low';
  if (activeWeeks >= 5) confidence = 'high';
  else if (activeWeeks >= 2) confidence = 'medium';

  return {
    weeklyVariance: Math.round(variance * 10) / 10,
    avgWeeklySessions: Math.round(mean * 10) / 10,
    trajectory,
    observation,
    confidence,
  };
}

export function computeRecoveryState(
  _activities: Activity[],
  _reflections: Reflection[],
  _intentions: Intention[],
  _now: Date,
): RecoveryState {
  throw new Error('not implemented');
}

export function computeReturnReliability(
  _activities: Activity[],
  _gaps: GapProfile,
  _now: Date,
): ReturnReliability {
  throw new Error('not implemented');
}

export function detectBehavioralMoments(
  _activities: Activity[],
  _reflections: Reflection[],
  _intentions: Intention[],
  _gaps: GapProfile,
  _rhythm: RhythmStability,
  _returnReliability: ReturnReliability,
  _now: Date,
): BehavioralMoment[] {
  throw new Error('not implemented');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

export function computeBehavioralProfile(
  _activities: Activity[],
  _reflections: Reflection[],
  _intentions: Intention[],
  _now: Date = new Date(),
): BehavioralProfile {
  throw new Error('not implemented');
}
