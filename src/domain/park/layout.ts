/**
 * Single-screen diorama layout. Pure: screen size in, world size and object rects out.
 * The hero tree stands towards the left corner, with the path and river winding down from the
 * hill; everything else frames it cleanly with room at the bottom for the 56pt drawer peek.
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
  startX: number;
}

/** Max horizontal parallax offset (in points) when dragging the scene. */
export const PARALLAX = { sky: 6, far: 12, mid: 20, world: 0 } as const;

const MIN_TARGET = 48;
const BOTTOM_RESERVE = 76; // 56pt drawer peek + breathing room

const PLACES: Record<ParkObject, { cx: number; cy: number; w: number; h: number }> = {
  tree: { cx: 0.3, cy: 0.41, w: 0.44, h: 0.3 },
  hammock: { cx: 0.86, cy: 0.47, w: 0.24, h: 0.14 },
  flowerbed: { cx: 0.24, cy: 0.68, w: 0.36, h: 0.11 },
  river: { cx: 0.78, cy: 0.7, w: 0.34, h: 0.26 },
  path: { cx: 0.38, cy: 0.8, w: 0.36, h: 0.12 },
};

export function parkLayout(screenW: number, screenH: number): ParkLayout {
  const worldW = screenW;
  const worldH = screenH;
  const safeH = Math.max(screenH - BOTTOM_RESERVE, screenH * 0.82);
  const objects = {} as Record<ParkObject, Rect>;

  for (const [name, p] of Object.entries(PLACES) as [ParkObject, (typeof PLACES)[ParkObject]][]) {
    const w = Math.max(Math.round(p.w * screenW), MIN_TARGET);
    const h = Math.max(Math.round(p.h * screenH), MIN_TARGET);
    const rawY = Math.round(p.cy * screenH - h / 2);
    const y = Math.min(rawY, safeH - h);
    objects[name] = { x: Math.round(p.cx * screenW - w / 2), y, w, h };
  }

  return { worldW, worldH, objects, startX: 0 };
}
