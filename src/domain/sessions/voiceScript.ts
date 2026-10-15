import type { Exercise } from '@/types';

/**
 * Exactly what the guide says aloud — the single source of truth shared by the session
 * player (what to play) and scripts/voice/generate.mjs (what to record). Pure.
 *
 * Order: announce the exercise → "Take care." + the source's warnings → coaching cues.
 * Warnings are NEVER trimmed: people following by voice may not be looking at the screen.
 * Only cues are trimmed on low-energy days (maxCues from speechParamsForState).
 */
export const TAKE_CARE = 'Take care.';

export function announceLine(exercise: Exercise): string {
  return `Next exercise: ${exercise.name}.`;
}

export function spokenLinesFor(exercise: Exercise, maxCues: number): string[] {
  const cautions = exercise.cautions ?? [];
  return [
    announceLine(exercise),
    ...(cautions.length > 0 ? [TAKE_CARE, ...cautions] : []),
    ...exercise.cues.slice(0, maxCues),
  ];
}

/** Every line any of these exercises can speak, de-duplicated — the generator's to-do list. */
export function allSpokenLines(exercises: Exercise[]): string[] {
  const lines = new Set<string>();
  for (const e of exercises) for (const line of spokenLinesFor(e, Infinity)) lines.add(line);
  return [...lines];
}
