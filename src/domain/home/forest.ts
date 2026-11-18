import type { SkyPhase } from '@/domain/garden/sky';
import type { CareKind } from '@/domain/home/care';

/**
 * Today's forest, as pure data: which pictures stand where. Each kind of care noted today
 * brings something into the clearing; nothing is ever taken away for what was not noted. The
 * trees are always there. A visitor animal comes once anything is noted, a different one each
 * day. When the day is closed it is night, and a bunny settles down.
 *
 * Positions are shares of the scene's width (`x`, the centre) and the picture's height as a
 * share of the scene's height (`size`). Back items are drawn first.
 */

export type ForestSpriteId =
  | 'tree' | 'treeTall' | 'treeRound' | 'treeCrooked' | 'pine'
  | 'plant' | 'rocks' | 'stones' | 'tent' | 'fence' | 'lantern' | 'pond'
  | 'flowers' | 'flowersTall' | 'mushrooms'
  | 'bunny' | 'deer' | 'fox' | 'bee' | 'chick' | 'hedgehog';

export interface Placed {
  id: ForestSpriteId;
  x: number;
  size: number;
  /** 0 = far back (higher up, smaller), 1 = front. */
  depth: number;
  /** Why it is there, for the screen reader summary. */
  reason: 'always' | CareKind | 'good' | 'visitor' | 'night';
}

const VISITORS: ForestSpriteId[] = ['fox', 'hedgehog', 'chick', 'bee', 'deer'];

/** A small stable number from a day key, so the same day always gets the same visitor. */
function dayNumber(dayKey: string): number {
  let n = 0;
  for (const ch of dayKey) n = (n * 31 + ch.charCodeAt(0)) % 9973;
  return n;
}

export function forestScene(i: {
  done: Record<CareKind, boolean>;
  goodThing: boolean;
  closed: boolean;
  dayKey: string;
}): Placed[] {
  const out: Placed[] = [
    // The clearing's edge: always here, whatever the day held.
    { id: 'pine', x: 0.07, size: 0.7, depth: 0, reason: 'always' },
    { id: 'treeRound', x: 0.2, size: 0.78, depth: 0.05, reason: 'always' },
    { id: 'treeTall', x: 0.82, size: 0.74, depth: 0, reason: 'always' },
    { id: 'tree', x: 0.94, size: 0.66, depth: 0.1, reason: 'always' },
    { id: 'rocks', x: 0.62, size: 0.16, depth: 0.2, reason: 'always' },
  ];
  const add = (p: Placed) => out.push(p);
  if (i.done.sleep) add({ id: 'tent', x: 0.4, size: 0.34, depth: 0.3, reason: 'sleep' });
  if (i.done.water) add({ id: 'pond', x: 0.7, size: 0.16, depth: 0.55, reason: 'water' });
  if (i.done.food) add({ id: 'mushrooms', x: 0.27, size: 0.17, depth: 0.7, reason: 'food' });
  if (i.done.mood) {
    add({ id: 'flowersTall', x: 0.5, size: 0.2, depth: 0.75, reason: 'mood' });
    add({ id: 'flowers', x: 0.13, size: 0.12, depth: 0.85, reason: 'mood' });
  }
  if (i.goodThing) add({ id: 'lantern', x: 0.6, size: 0.4, depth: 0.45, reason: 'good' });
  if (i.done.movement) add({ id: 'deer', x: 0.84, size: 0.3, depth: 0.8, reason: 'movement' });

  const anything = Object.values(i.done).some(Boolean) || i.goodThing;
  if (i.closed) {
    add({ id: 'bunny', x: 0.36, size: 0.26, depth: 0.95, reason: 'night' });
  } else if (anything) {
    const options = VISITORS.filter((v) => !(v === 'deer' && i.done.movement));
    add({ id: options[dayNumber(i.dayKey) % options.length], x: 0.45, size: 0.24, depth: 0.95, reason: 'visitor' });
  }
  return out.sort((a, b) => a.depth - b.depth);
}

/** Which sky to show: the phone's time of day, and always night once the day is closed. */
export function forestSky(phase: SkyPhase, closed: boolean): 'morning' | 'day' | 'night' {
  if (closed || phase === 'night') return 'night';
  if (phase === 'dawn' || phase === 'dusk') return 'morning';
  return 'day';
}
