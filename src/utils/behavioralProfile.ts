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
  activities: Activity[],
  reflections: Reflection[],
  intentions: Intention[],
  now: Date,
): RecoveryState {
  const hasActivityHistory = activities.length > 0;
  const daysSinceLast = hasActivityHistory
    ? differenceInCalendarDays(now, new Date(activities[0]!.performed_at))
    : 999;

  const sortedReflections = [...reflections].sort((a, b) =>
    b.week_start.localeCompare(a.week_start),
  );
  const latestReflection = sortedReflections[0] ?? null;
  const wellnessData = latestReflection ? parseWellness(latestReflection.notes) : null;

  // isExtendedAbsence: purely behavioral — gap > threshold; requires activity history
  const isExtendedAbsence = hasActivityHistory && daysSinceLast > EXTENDED_ABSENCE_DAYS;

  // isPatternDisrupted: consecutive unmet intentions (met === false) + gap
  // Filters out null-met intentions — only considers intentions the user responded to
  const intentionsWithMet = [...intentions]
    .filter((i) => i.met !== null)
    .sort((a, b) => b.week_start.localeCompare(a.week_start));
  const isPatternDisrupted =
    intentionsWithMet.length >= CONSECUTIVE_UNMET_THRESHOLD &&
    intentionsWithMet
      .slice(0, CONSECUTIVE_UNMET_THRESHOLD)
      .every((i) => i.met === false) &&
    daysSinceLast > PATTERN_DISRUPTED_GAP_DAYS;

  // isHighStressSignal: uses user-reported wellness data (user told us their state)
  const isHighStressSignal =
    wellnessData !== null &&
    wellnessData.stress >= HIGH_STRESS_THRESHOLD &&
    wellnessData.soreness >= HIGH_SORENESS_THRESHOLD &&
    daysSinceLast > HIGH_STRESS_GAP_DAYS;

  // 4-state action signal — needs_reentry collapses all three flags
  const needsReentry = isExtendedAbsence || isPatternDisrupted || isHighStressSignal;
  let signal: RecoveryState['signal'];
  if (needsReentry) {
    signal = 'needs_reentry';
  } else if (daysSinceLast >= 4 && daysSinceLast <= 10) {
    signal = 'returning';
  } else {
    // Check recent session frequency for thriving
    const weekStart = startOfWeek(now, WEEK_OPTIONS);
    const recentCounts = Array.from({ length: 4 }, (_, i) => {
      const wStart = addDays(weekStart, -7 * (3 - i));
      return activitiesInWeek(activities, wStart).length;
    });
    const avgSessions = recentCounts.reduce((s, c) => s + c, 0) / 4;
    signal = avgSessions > 2 && daysSinceLast < 4 ? 'thriving' : 'stable';
  }

  let reEntryReadiness: RecoveryState['reEntryReadiness'] = 'high';
  if (isExtendedAbsence || isPatternDisrupted) reEntryReadiness = 'low';
  else if (isHighStressSignal || daysSinceLast >= 4) reEntryReadiness = 'medium';

  // Confidence: based on recency of reflection data and activity
  let confidence: Confidence = 'low';
  if (latestReflection) {
    const weeksSinceReflection = Math.floor(
      differenceInCalendarDays(now, new Date(latestReflection.week_start)) / 7,
    );
    if (weeksSinceReflection <= 1 && daysSinceLast < 7) confidence = 'high';
    else if (weeksSinceReflection <= 3) confidence = 'medium';
  }

  return {
    signal,
    isExtendedAbsence,
    isPatternDisrupted,
    isHighStressSignal,
    reEntryReadiness,
    confidence,
  };
}

export function computeReturnReliability(
  activities: Activity[],
  gaps: GapProfile,
  now: Date,
): ReturnReliability {
  const gapCount = gaps.totalGapCount;
  const longestGapDays = gaps.longestGapDays;
  const avgGapDays = gaps.avgGapDays;

  // Count calendar months in trailing 12 months with ≥ 1 activity
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const activeMonthSet = new Set(
    activities
      .filter((a) => new Date(a.performed_at) >= cutoff)
      .map((a) => monthKey(new Date(a.performed_at))),
  );
  const activeMonths = activeMonthSet.size;

  // trackedMonths: months since first activity, clamped to 12
  const sortedAsc = [...activities].sort(
    (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime(),
  );
  const firstDate = sortedAsc.length > 0 ? new Date(sortedAsc[0]!.performed_at) : now;
  const monthsDiff =
    (now.getFullYear() - firstDate.getFullYear()) * 12 +
    (now.getMonth() - firstDate.getMonth());
  const trackedMonths = Math.min(12, Math.max(1, monthsDiff + 1));
  const activeRatio = activeMonths / trackedMonths;

  // Label derivation
  // Note: anchored is checked before insufficient_data because truly anchored users
  // may have zero recorded gaps (intervals always ≤ GAP_DEFINITION_DAYS), yet their
  // high active ratio and low avg interval make the classification unambiguous.
  let label: ReturnReliability['label'];
  if (avgGapDays <= ANCHORED_AVG_GAP_MAX && activeRatio >= ANCHORED_ACTIVE_RATIO_MIN) {
    label = 'anchored';
  } else if (gapCount < 2) {
    label = 'insufficient_data';
  } else if (
    (gaps.trend === 'shrinking' || gaps.trend === 'stable') &&
    activeRatio >= RESILIENT_ACTIVE_RATIO_MIN
  ) {
    label = 'resilient';
  } else if (activeRatio >= INTERMITTENT_ACTIVE_RATIO_MIN) {
    label = 'intermittent';
  } else {
    label = 'fragmented';
  }

  // Force fragmented when gaps are very long and numerous
  if (
    label !== 'insufficient_data' &&
    gapCount >= FRAGMENTED_GAP_COUNT_MIN &&
    avgGapDays >= FRAGMENTED_AVG_GAP_MIN
  ) {
    label = 'fragmented';
  }

  // Confidence: gap-count is the primary signal, but anchored users never accumulate
  // gaps — for them, activeMonths is the right proxy for how much data we have.
  let confidence: Confidence = 'low';
  if (label === 'anchored') {
    if (activeMonths >= 5) confidence = 'high';
    else if (activeMonths >= 2) confidence = 'medium';
  } else {
    if (gapCount >= 5) confidence = 'high';
    else if (gapCount >= 2) confidence = 'medium';
  }

  return { label, gapCount, longestGapDays, activeMonths, confidence };
}

export function detectBehavioralMoments(
  activities: Activity[],
  reflections: Reflection[],
  intentions: Intention[],
  gaps: GapProfile,
  rhythm: RhythmStability,
  returnReliability: ReturnReliability,
  now: Date,
): BehavioralMoment[] {
  const moments: BehavioralMoment[] = [];

  const isoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const recentActivityDate =
    activities.length > 0 ? activities[0]!.performed_at.slice(0, 10) : isoDate(now);

  const isWithinWindow = (observedAt: string, type: MomentType) =>
    differenceInCalendarDays(now, new Date(observedAt)) <= MOMENT_RELEVANCE_DAYS[type];

  // 1. reliable_returner — highest priority, most enduring signal
  if (
    returnReliability.label === 'resilient' &&
    (returnReliability.confidence === 'medium' || returnReliability.confidence === 'high')
  ) {
    const observedAt = recentActivityDate;
    if (isWithinWindow(observedAt, 'reliable_returner')) {
      moments.push({
        type: 'reliable_returner',
        observation:
          "You've returned after every extended gap. That pattern is harder to build than it looks.",
        observedAt,
      });
    }
  }

  // 2. faster_return
  if (moments.length < MAX_MOMENTS && gaps.gapHistory.length >= 2 && gaps.confidence !== 'low') {
    const lastGap = gaps.gapHistory[gaps.gapHistory.length - 1]!;
    if (lastGap < gaps.avgGapDays * FASTER_RETURN_FACTOR) {
      const observedAt = recentActivityDate;
      if (isWithinWindow(observedAt, 'faster_return')) {
        moments.push({
          type: 'faster_return',
          observation: `Back in ${lastGap} days — ${gaps.avgGapDays} is your usual gap.`,
          observedAt,
        });
      }
    }
  }

  // 3. staying_connected
  if (moments.length < MAX_MOMENTS) {
    const sortedRefs = [...reflections].sort((a, b) =>
      b.week_start.localeCompare(a.week_start),
    );
    const latestRef = sortedRefs[0];
    if (latestRef && isWithinWindow(latestRef.week_start, 'staying_connected')) {
      const wellnessData = parseWellness(latestRef.notes);
      const lowEnergy =
        latestRef.energy <= DIFFICULT_WEEK_ENERGY_MAX ||
        (wellnessData !== null && wellnessData.motivation <= DIFFICULT_WEEK_ENERGY_MAX);
      if (lowEnergy) {
        const weekActs = activitiesInWeek(activities, new Date(latestRef.week_start));
        if (weekActs.length > 0) {
          moments.push({
            type: 'staying_connected',
            observation: 'You stayed connected during a low-energy week.',
            observedAt: latestRef.week_start,
          });
        }
      }
    }
  }

  // 4. intention_followed
  if (moments.length < MAX_MOMENTS) {
    const metIntentions = [...intentions]
      .filter((i) => i.met === true)
      .sort((a, b) => b.week_start.localeCompare(a.week_start));
    const latest = metIntentions[0];
    if (latest && isWithinWindow(latest.week_start, 'intention_followed')) {
      const desc =
        latest.description.length > 40
          ? latest.description.slice(0, 40) + '…'
          : latest.description;
      moments.push({
        type: 'intention_followed',
        observation: `You followed through: '${desc}'.`,
        observedAt: latest.week_start,
      });
    }
  }

  // 5. gaps_narrowing
  if (
    moments.length < MAX_MOMENTS &&
    gaps.trend === 'shrinking' &&
    gaps.gapHistory.length >= 3 &&
    gaps.confidence !== 'low'
  ) {
    const observedAt = recentActivityDate;
    if (isWithinWindow(observedAt, 'gaps_narrowing')) {
      moments.push({
        type: 'gaps_narrowing',
        observation: 'The time between your sessions is getting shorter.',
        observedAt,
      });
    }
  }

  // 6. rhythm_rebuilding
  if (
    moments.length < MAX_MOMENTS &&
    rhythm.trajectory === 'stabilizing' &&
    rhythm.confidence !== 'low'
  ) {
    const observedAt = recentActivityDate;
    if (isWithinWindow(observedAt, 'rhythm_rebuilding')) {
      moments.push({
        type: 'rhythm_rebuilding',
        observation: 'More consistent recently than a month ago.',
        observedAt,
      });
    }
  }

  return moments.slice(0, MAX_MOMENTS);
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
