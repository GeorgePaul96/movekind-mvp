/**
 * Where everything sits in the park. Pure: screen size in, world size and object rects out.
 * The park is a panorama 2.2 screens wide that pans horizontally; the same rects place the
 * drawings and the tappable hotspots, so what you see is exactly what you can tap.
 */
export type ParkObject = 'river' | 'tree' | 'flowerbed' | 'hammock' | 'path';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParkLayout {
  worldW: number;
  worldH: number;
  objects: Record<ParkObject, Rect>;
  /** Scroll offset the park opens at: the tree and the river in view. */
  startX: number;
}

/** How far each layer moves for one point of foreground scroll (far layers move least). */
export const PARALLAX = { sky: 0.15, far: 0.35, mid: 0.6, world: 1 } as const;

const WORLD_SCREENS = 2.2;
const MIN_TARGET = 44;

/** Centre (fractions of world width / height) and size (fractions of screen width / height). */
const PLACES: Record<ParkObject, { cx: number; cy: number; w: number; h: number }> = {
  flowerbed: { cx: 0.12, cy: 0.78, w: 0.28, h: 0.08 },
  tree: { cx: 0.2, cy: 0.42, w: 0.28, h: 0.22 },
  river: { cx: 0.42, cy: 0.62, w: 0.3, h: 0.12 },
  path: { cx: 0.62, cy: 0.82, w: 0.28, h: 0.1 },
  hammock: { cx: 0.8, cy: 0.5, w: 0.3, h: 0.14 },
};

export function parkLayout(screenW: number, screenH: number): ParkLayout {
  const worldW = Math.round(screenW * WORLD_SCREENS);
  const worldH = screenH;
  const objects = {} as Record<ParkObject, Rect>;
  for (const [name, p] of Object.entries(PLACES) as [ParkObject, (typeof PLACES)[ParkObject]][]) {
    const w = Math.min(Math.max(p.w * screenW, MIN_TARGET), 0.3 * screenW);
    const h = Math.max(p.h * screenH, MIN_TARGET);
    objects[name] = { x: p.cx * worldW - w / 2, y: p.cy * worldH - h / 2, w, h };
  }
  const startX = Math.min(Math.max(0.12 * worldW, 0), worldW - screenW);
  return { worldW, worldH, objects, startX };
}
