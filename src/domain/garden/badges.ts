import { BADGE_COPY } from '@/constants/copy';
import { treeStageFor, type GardenState } from './garden';

const MAX_STAGE = BADGE_COPY.tree.length - 1;

/** The two pills on the garden card: what the sky/water and the tree are doing. */
export function gardenBadges(s: GardenState): { sky: string; tree: string } {
  return {
    sky: s.weather === 'rain' ? BADGE_COPY.rain : s.resting ? BADGE_COPY.resting : BADGE_COPY.stream[s.stream],
    tree: BADGE_COPY.tree[s.tree],
  };
}

/** One-line description of a tree stage ("A tiny sprout", "A tree full of fruit"). */
export function treeCaption(stage: GardenState['tree']): string {
  return BADGE_COPY.caption[stage];
}

/**
 * The honest line under the workout log: what adding `addMinutes` to `currentMinutes`
 * (all-time workout minutes) will actually grow.
 */
export function workoutGrowthLine(currentMinutes: number, addMinutes: number): string {
  const now = treeStageFor(currentMinutes);
  const next = treeStageFor(currentMinutes + addMinutes);
  if (next > now) return BADGE_COPY.growth[next];
  return now === MAX_STAGE ? BADGE_COPY.growthFull : BADGE_COPY.growthMore;
}
