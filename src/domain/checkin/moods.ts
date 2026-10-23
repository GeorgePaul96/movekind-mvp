import type { UserState } from '@/types';

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
