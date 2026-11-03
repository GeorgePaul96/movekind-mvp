import type { GardenState } from '@/domain/garden/garden';
import type { ParkLayout } from './layout';
import type { Pt } from './shapes';

/**
 * Pip, the seed who lives in the park. Pure: what Pip looks like and what it noticed come from
 * the garden alone. Pip never asks for anything and never mentions what didn't happen.
 */
export type PipMood = 'happy' | 'cheer' | 'rainy' | 'sleepy';

export type PipNotice =
  | 'hello'
  | 'riverFull'
  | 'riverAwake'
  | 'treeGrowing'
  | 'birds'
  | 'flowerToday'
  | 'grassTall'
  | 'calm'
  | 'rainy'
  | 'sleepy';

/** Resting or night wins (Pip naps), then rain (Pip holds a leaf), then a fresh log (Pip cheers). */
export function pipMood(state: GardenState, night: boolean, cheering: boolean): PipMood {
  if (state.resting || night) return 'sleepy';
  if (state.weather === 'rain') return 'rainy';
  return cheering ? 'cheer' : 'happy';
}

/** The things Pip can mention, in the order a tap cycles through them. Only what is there. */
export function pipNotices(state: GardenState, untended: Set<string>, night: boolean): PipNotice[] {
  if (state.resting || night) return ['sleepy'];
  if (state.weather === 'rain') return ['rainy'];
  const out: PipNotice[] = ['hello'];
  if (state.stream >= 3) out.push('riverFull');
  else if (state.stream >= 1) out.push('riverAwake');
  if (!untended.has('flowerbed')) out.push('flowerToday');
  if (state.birds) out.push('birds');
  else if (state.tree >= 1) out.push('treeGrowing');
  if (state.grass >= 3) out.push('grassTall');
  out.push('calm');
  return out;
}

/** Pip stands by the foot of the tree, just above where the path begins, clear of the river. */
export function pipSpot({ worldW: W, worldH: H }: ParkLayout): { feet: Pt; size: number } {
  const size = Math.round(Math.min(72, Math.max(48, W * 0.13)));
  return { feet: [W * 0.5, H * 0.555], size };
}
