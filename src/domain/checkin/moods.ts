import type { CheckIn, UserState, YardMood } from '@/types';

/** The four one-tap moods, lowest to highest energy. Order is the tile order. */
export const MOODS: readonly UserState[] = ['overloaded', 'recovering', 'regulated', 'activated'];

// Score 3 is intentionally unused by tiles: it maps to 'recovering' like 2, so the
// tiles pick the unambiguous anchor of each state.
const ENERGY_FOR_MOOD: Record<UserState, number> = {
  overloaded: 1,
  recovering: 2,
  regulated: 4,
  activated: 5,
};

export function moodToEnergy(mood: UserState): number {
  return ENERGY_FOR_MOOD[mood];
}

/** energy_score (1–5) → mood (also the flower colour in the garden). */
export function mapEnergyToState(score: number): UserState {
  if (score === 1) return 'overloaded';
  if (score <= 3) return 'recovering';
  if (score === 4) return 'regulated';
  return 'activated';
}

/** The five yard moods, in tile order. */
export const YARD_MOODS: readonly YardMood[] = ['tired', 'low', 'frustrated', 'steady', 'buzzing'];

// Frustrated takes the score tiles never used (3), so it reads as 'recovering' in the garden.
const ENERGY_FOR_YARD_MOOD: Record<YardMood, number> = {
  tired: 1,
  low: 2,
  frustrated: 3,
  steady: 4,
  buzzing: 5,
};

/** The energy_score written alongside a yard mood, so the garden and Changes keep working. */
export function yardMoodToEnergy(mood: YardMood): number {
  return ENERGY_FOR_YARD_MOOD[mood];
}

/** A check-in's yard mood: the stored one, or for older rows the closest one to its energy score. */
export function yardMoodOf(checkIn: Pick<CheckIn, 'energy_score' | 'mood'>): YardMood {
  if (checkIn.mood) return checkIn.mood;
  const s = checkIn.energy_score;
  if (s <= 1) return 'tired';
  if (s <= 3) return 'low';
  if (s === 4) return 'steady';
  return 'buzzing';
}
