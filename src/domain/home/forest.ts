import type { SkyPhase } from '@/domain/garden/sky';
import type { CareKind } from '@/domain/home/care';

/**
 * Today's forest, as pure data: which pictures stand where. Pure: no React, no clock.
 *
 * The forest itself (trees, bushes, grass, rocks) is always there and fills the whole width,
 * however wide the screen is. Each kind of care noted today brings something into the clearing;
 * nothing is ever taken away for what was not noted. A visitor animal comes once anything is
 * noted, a different one each day. When the day is closed it is night, and a bunny settles down.
 *
 * `x` is the centre as a share of the width; `size` is the picture's height as a share of the
 * scene's height; `depth` runs from 0 (far back, on the horizon) to 1 (the front edge).
 * Pieces with a `kind` can be tapped to open that check-in page.
 */

export type ForestSpriteId =
  | 'oak' | 'blockTree' | 'pine' | 'tallPine' | 'umbrella'
  | 'bush' | 'bushTall' | 'bushLow' | 'grass' | 'grassTall' | 'grassBlades'
  | 'boulder' | 'stack' | 'rocks'
  | 'tent' | 'lantern' | 'pond' | 'flowers' | 'flowersTall' | 'mushrooms'
  | 'bunny' | 'deer' | 'fox' | 'bee' | 'chick' | 'hedgehog';

export type PlacedRole = 'backdrop' | 'frame' | 'ground' | 'care' | 'good' | 'visitor' | 'night';

export interface Placed {
  /** Stable key for React. */
  key: string;
  id: ForestSpriteId;
  x: number;
  size: number;
  depth: number;
  role: PlacedRole;
  /** The check-in page this piece opens, for pieces brought by care. */
  kind?: CareKind;
  /** Whether it sways in the breeze (trees and grass). */
  sways: boolean;
  /** Mirror it left to right, so repeated trees do not look stamped. */
  flip: boolean;
}

const VISITORS: ForestSpriteId[] = ['fox', 'hedgehog', 'chick', 'bee'];
const BACK_TREES: ForestSpriteId[] = ['pine', 'oak', 'tallPine', 'blockTree', 'pine', 'umbrella'];
const GRASSES: ForestSpriteId[] = ['grass', 'grassTall', 'grassBlades'];

/** A small stable number from a string, so the same day always looks the same. */
function hash(s: string): number {
  let n = 7;
  for (const ch of s) n = (n * 31 + ch.charCodeAt(0)) % 100003;
  return n;
}

/** A repeatable 0..1 value for slot `k` of a row, so layouts never jump between renders. */
const jitter = (k: number, salt: number) => ((Math.sin(k * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1;

export function forestScene(i: {
  done: Record<CareKind, boolean>;
  goodThing: boolean;
  closed: boolean;
  dayKey: string;
  /** The scene's width in points: wider screens get more trees, never stretched ones. */
  width: number;
}): Placed[] {
  const out: Placed[] = [];
  const width = Math.max(240, i.width);

  // The far tree line: a tree roughly every 46 points, so the forest always fills the width.
  const backCount = Math.round(width / 46);
  for (let k = 0; k < backCount; k++) {
    out.push({
      key: `back-${k}`,
      id: BACK_TREES[k % BACK_TREES.length],
      x: (k + 0.5) / backCount + (jitter(k, 1) - 0.5) * 0.03,
      size: 0.34 + jitter(k, 2) * 0.12,
      depth: 0.02 * jitter(k, 3),
      role: 'backdrop',
      sways: true,
      flip: jitter(k, 4) > 0.5,
    });
  }

  // Big trees framing the clearing at both edges, and bushes at their feet.
  out.push(
    { key: 'frame-l1', id: 'oak', x: 0.06, size: 0.72, depth: 0.12, role: 'frame', sways: true, flip: false },
    { key: 'frame-l2', id: 'tallPine', x: 0.19, size: 0.62, depth: 0.08, role: 'frame', sways: true, flip: true },
    { key: 'frame-r1', id: 'umbrella', x: 0.93, size: 0.66, depth: 0.14, role: 'frame', sways: true, flip: true },
    { key: 'frame-r2', id: 'pine', x: 0.8, size: 0.56, depth: 0.06, role: 'frame', sways: true, flip: false },
    { key: 'bush-l', id: 'bushTall', x: 0.13, size: 0.2, depth: 0.42, role: 'ground', sways: false, flip: false },
    { key: 'bush-r', id: 'bush', x: 0.88, size: 0.17, depth: 0.48, role: 'ground', sways: false, flip: true },
    { key: 'bush-m', id: 'bushLow', x: 0.55, size: 0.08, depth: 0.2, role: 'ground', sways: false, flip: false },
    { key: 'rock-1', id: 'boulder', x: 0.66, size: 0.11, depth: 0.28, role: 'ground', sways: false, flip: false },
    { key: 'rock-2', id: 'stack', x: 0.3, size: 0.1, depth: 0.25, role: 'ground', sways: false, flip: true },
  );

  // What today's care brought into the clearing.
  const care = (key: string, id: ForestSpriteId, x: number, size: number, depth: number, kind: CareKind) =>
    out.push({ key, id, x, size, depth, role: 'care', kind, sways: false, flip: false });
  if (i.done.sleep) care('tent', 'tent', 0.42, 0.28, 0.32, 'sleep');
  if (i.done.water) care('pond', 'pond', 0.7, 0.13, 0.58, 'water');
  if (i.done.food) care('mushrooms', 'mushrooms', 0.27, 0.13, 0.68, 'food');
  if (i.done.mood) {
    care('flowers-tall', 'flowersTall', 0.52, 0.15, 0.74, 'mood');
    care('flowers', 'flowers', 0.08, 0.08, 0.86, 'mood');
  }
  if (i.done.movement) care('deer', 'deer', 0.83, 0.24, 0.76, 'movement');
  if (i.goodThing) out.push({ key: 'lantern', id: 'lantern', x: 0.6, size: 0.3, depth: 0.42, role: 'good', sways: false, flip: false });

  const anything = Object.values(i.done).some(Boolean) || i.goodThing;
  if (i.closed) {
    out.push({ key: 'bunny', id: 'bunny', x: 0.36, size: 0.2, depth: 0.92, role: 'night', sways: false, flip: false });
  } else if (anything) {
    const id = VISITORS[hash(i.dayKey) % VISITORS.length];
    out.push({ key: 'visitor', id, x: 0.4, size: 0.19, depth: 0.9, role: 'visitor', sways: false, flip: hash(i.dayKey) % 2 === 1 });
  }

  // Grass tufts along the front edge, again by width.
  const grassCount = Math.round(width / 70);
  for (let k = 0; k < grassCount; k++) {
    out.push({
      key: `grass-${k}`,
      id: GRASSES[k % GRASSES.length],
      x: (k + 0.3 + jitter(k, 5) * 0.4) / grassCount,
      size: 0.07 + jitter(k, 6) * 0.04,
      depth: 0.97 + jitter(k, 7) * 0.03,
      role: 'ground',
      sways: true,
      flip: jitter(k, 8) > 0.5,
    });
  }

  return out.sort((a, b) => a.depth - b.depth);
}

/** Which sky to show: the phone's time of day, and always night once the day is closed. */
export function forestSky(phase: SkyPhase, closed: boolean): 'morning' | 'day' | 'night' {
  if (closed || phase === 'night') return 'night';
  if (phase === 'dawn' || phase === 'dusk') return 'morning';
  return 'day';
}

/** The scene's height for a given width: taller on bigger screens, within calm limits. */
export function forestHeight(width: number): number {
  return Math.round(Math.min(460, Math.max(300, width * 0.86)));
}

/** Where the grass starts, as a share of the scene's height. */
export const GROUND_LINE = 0.5;
