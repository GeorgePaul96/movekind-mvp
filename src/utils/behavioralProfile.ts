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

// ─── Sub-functions (exported for independent testing) ─────────────────────────

export function computeGapProfile(_activities: Activity[], _now: Date): GapProfile {
  throw new Error('not implemented');
}

export function computeRhythmStability(_activities: Activity[], _now: Date): RhythmStability {
  throw new Error('not implemented');
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
