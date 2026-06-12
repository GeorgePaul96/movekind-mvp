import type { Exercise, UserState, SessionBlock, UserExerciseStats } from '@/types';

export interface ComposerInput {
  state: UserState;
  exercises: Exercise[];
  recentExerciseIds: string[];
  userStats?: UserExerciseStats[];
}

export interface ComposedBlock {
  exercise: Exercise;
  target_duration: number; // in seconds
}

/**
 * Pure composer function.
 * Composes a list of exercises and target durations based on the user's capacity state.
 */
export function composeSession(input: ComposerInput): ComposedBlock[] {
  const { state, exercises, recentExerciseIds, userStats = [] } = input;
  
  if (exercises.length === 0) {
    return [];
  }

  // Define the category sequence for each state
  const stateSequence: Record<UserState, { category: Exercise['category']; duration: number }[]> = {
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

  const sequence = stateSequence[state];
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
