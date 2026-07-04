import type { Exercise, UserState, SessionBlock, UserExerciseStats } from '@/types';
import type { BehavioralProfile } from '@/domain/behavioral/types';

export interface ComposerInput {
  state: UserState;
  exercises: Exercise[];
  recentExerciseIds: string[];
  userStats?: UserExerciseStats[];
  /**
   * Optional behavioral profile (Composer v3). When present, it modulates the
   * session's length and intensity — gentler after gaps/burnout, richer when
   * the user is thriving. Absent (or neutral) → baseline composition, unchanged.
   */
  profile?: BehavioralProfile;
}

export interface ComposedBlock {
  exercise: Exercise;
  target_duration: number; // in seconds
}

type SequenceStep = { category: Exercise['category']; duration: number };

/** Categories that carry real physical load — the ones we trim/scale for re-entry. */
const HIGH_INTENSITY: Exercise['category'][] = ['strengthen', 'move'];

const GENTLE_DURATION_SCALE = 0.7;
const ENERGIZED_DURATION_SCALE = 1.15;
const GAP_GENTLE_THRESHOLD_DAYS = 14;
const WAVERING_COMPLETION_THRESHOLD = 0.5;

type ReEntryMode = 'gentle' | 'normal' | 'energized';

/**
 * Derives how hard/long today's session should be from the behavioral profile.
 * Gentle wins over energized when signals conflict — protecting the user is the
 * safer default, consistent with the anti-guilt philosophy.
 */
export function reEntryModeFor(profile?: BehavioralProfile): ReEntryMode {
  if (!profile) return 'normal';

  const { recovery, gaps, followThrough } = profile;

  const gentle =
    recovery.reEntryReadiness === 'low' ||
    recovery.signal === 'collapse' ||
    recovery.signal === 'spiral' ||
    recovery.signal === 'burnout_risk' ||
    (gaps.hasHistory && gaps.lastGapDays >= GAP_GENTLE_THRESHOLD_DAYS) ||
    (followThrough.hasHistory && followThrough.completionRate < WAVERING_COMPLETION_THRESHOLD);
  if (gentle) return 'gentle';

  if (recovery.reEntryReadiness === 'high' && recovery.signal === 'thriving') {
    return 'energized';
  }

  return 'normal';
}

/**
 * Transforms the base per-state sequence for the chosen re-entry mode.
 * - gentle: scale durations down and drop the longest high-intensity block
 *   (never below two blocks).
 * - energized: lengthen the high-intensity blocks.
 * - normal: unchanged.
 */
function applyReEntryMode(sequence: SequenceStep[], mode: ReEntryMode): SequenceStep[] {
  if (mode === 'normal') return sequence;

  if (mode === 'energized') {
    return sequence.map((step) =>
      HIGH_INTENSITY.includes(step.category)
        ? { ...step, duration: Math.round(step.duration * ENERGIZED_DURATION_SCALE) }
        : step,
    );
  }

  // gentle
  const scaled = sequence.map((step) => ({
    ...step,
    duration: Math.round(step.duration * GENTLE_DURATION_SCALE),
  }));

  const highIntensityIdxs = scaled
    .map((step, i) => ({ i, step }))
    .filter(({ step }) => HIGH_INTENSITY.includes(step.category))
    .sort((a, b) => b.step.duration - a.step.duration);

  if (highIntensityIdxs.length > 0 && scaled.length > 2) {
    const removeIdx = highIntensityIdxs[0]!.i;
    return scaled.filter((_, i) => i !== removeIdx);
  }

  return scaled;
}

/**
 * Pure composer function.
 * Composes a list of exercises and target durations based on the user's capacity state.
 */
export function composeSession(input: ComposerInput): ComposedBlock[] {
  const { state, exercises, recentExerciseIds, userStats = [], profile } = input;

  if (exercises.length === 0) {
    return [];
  }

  // Define the category sequence for each state
  const stateSequence: Record<UserState, SequenceStep[]> = {
    overloaded: [
      { category: 'regulate', duration: 180 },   // 3 mins somatic/breathing
      { category: 'downshift', duration: 300 },  // 5 mins resting stretch
      { category: 'downshift', duration: 300 },  // 5 mins calming pose
    ],
    recovering: [
      { category: 'mobilize', duration: 180 },   // 3 mins joint opening
      { category: 'regulate', duration: 180 },   // 3 mins somatic release
      { category: 'downshift', duration: 240 },  // 4 mins grounding downshift
    ],
    regulated: [
      { category: 'mobilize', duration: 180 },   // 3 mins prep
      { category: 'strengthen', duration: 360 }, // 6 mins bodyweight strength
      { category: 'move', duration: 240 },       // 4 mins moderate movement
      { category: 'downshift', duration: 180 },  // 3 mins cool down
    ],
    activated: [
      { category: 'regulate', duration: 120 },   // 2 mins focusing breath
      { category: 'strengthen', duration: 420 }, // 7 mins progressive strength
      { category: 'move', duration: 300 },       // 5 mins intense movement
      { category: 'downshift', duration: 120 },  // 2 mins short grounding
    ],
  };

  // Composer v3: modulate the base sequence by the behavioral profile.
  const sequence = applyReEntryMode(stateSequence[state], reEntryModeFor(profile));
  const composed: ComposedBlock[] = [];
  const selectedExerciseIds = new Set<string>();

  for (const step of sequence) {
    // 1. Filter exercises matching this category
    const candidates = exercises.filter(
      (ex) => ex.category === step.category && !selectedExerciseIds.has(ex.id)
    );

    if (candidates.length === 0) {
      // Fallback: allow already selected exercise if library is too small
      const fallbackCandidates = exercises.filter((ex) => ex.category === step.category);
      if (fallbackCandidates.length > 0) {
        composed.push({
          exercise: fallbackCandidates[0]!,
          target_duration: step.duration,
        });
      }
      continue;
    }

    // 2. Score candidates to select the best one
    // Scoring rules:
    // - Base score: 100
    // - Penalty if exercise was recently completed: -100 (anti-repetition)
    // - Bonus if userStats shows high average energy delta: (delta * 10)
    const scoredCandidates = candidates.map((ex) => {
      let score = 100;

      // Anti-repetition penalty
      const recentIndex = recentExerciseIds.indexOf(ex.id);
      if (recentIndex !== -1) {
        // More recent means higher penalty
        score -= (100 - recentIndex * 20);
      }

      // Adaptive user preference weighting
      const stat = userStats.find((s) => s.exercise_id === ex.id);
      if (stat) {
        // Boost score based on historical performance delta
        score += Math.round(stat.average_energy_delta * 15);
      }

      return { exercise: ex, score };
    });

    // Sort scored candidates descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Pick the top scoring candidate
    const chosen = scoredCandidates[0]!.exercise;
    composed.push({
      exercise: chosen,
      target_duration: step.duration,
    });
    selectedExerciseIds.add(chosen.id);
  }

  return composed;
}
