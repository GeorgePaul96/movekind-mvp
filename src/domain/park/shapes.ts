/**
 * The river and the footpath as centre lines in world pixels: the river winds down in an S below
 * the hammock, the path winds in an S from the foot of the tree around the flowerbed. Pure
 * geometry, so the drawing and the tests agree.
 */
import type { ParkLayout, Rect } from './layout';

export type Pt = [number, number];

const n = (v: number) => String(Number(v.toFixed(2)));
const fmt = ([x, y]: Pt) => `${n(x)} ${n(y)}`;

/** Catmull-Rom control points for the segment from pts[i] to pts[i + 1]. */
function controls(pts: Pt[], i: number): [Pt, Pt, Pt, Pt] {
  const p0 = pts[Math.max(i - 1, 0)]!;
  const p1 = pts[i]!;
  const p2 = pts[i + 1]!;
  const p3 = pts[Math.min(i + 2, pts.length - 1)]!;
  const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
  const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
  return [p1, c1, c2, p2];
}

/** A smooth SVG curve through every point. */
export function smoothPath(pts: Pt[]): string {
  let d = `M${fmt(pts[0]!)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [, c1, c2, p2] = controls(pts, i);
    d += ` C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return d;
}

/** Points along the same smooth curve, `perSegment` per stretch between given points. */
export function sampleSpline(pts: Pt[], perSegment: number): Pt[] {
  const out: Pt[] = [pts[0]!];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b, c, e] = controls(pts, i);
    for (let s = 1; s <= perSegment; s++) {
      const t = s / perSegment;
      const u = 1 - t;
      const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
      out.push([w[0] * a[0] + w[1] * b[0] + w[2] * c[0] + w[3] * e[0], w[0] * a[1] + w[1] * b[1] + w[2] * c[1] + w[3] * e[1]]);
    }
  }
  return out;
}

/** Width of the river at normalized progress t in [0, 1] from hilltop source to bottom edge. */
export const riverWidthAt = (t: number): number => 10 + 34 * Math.pow(Math.max(0, Math.min(1, t)), 0.9);

/** Width of the footpath at normalized progress t in [0, 1] from tree foot to bottom edge. */
export const pathWidthAt = (t: number): number => 12 + 22 * Math.pow(Math.max(0, Math.min(1, t)), 0.9);

/**
 * Builds a closed SVG path for a ribbon that widens along `pts` according to `widthAt(t)`.
 * Uses local normals along `sampleSpline` so both banks curve smoothly without round stroke caps.
 */
export function ribbonPath(pts: Pt[], widthAt: (t: number) => number): string {
  const spine = sampleSpline(pts, 8);
  const left: Pt[] = [];
  const right: Pt[] = [];
  const total = Math.max(1, spine.length - 1);

  for (let i = 0; i < spine.length; i++) {
    const prev = spine[Math.max(0, i - 1)]!;
    const next = spine[Math.min(spine.length - 1, i + 1)]!;
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const half = widthAt(i / total) / 2;
    const [px, py] = spine[i]!;
    left.push([px + nx * half, py + ny * half]);
    right.push([px - nx * half, py - ny * half]);
  }

  const rightRev = right.slice().reverse();
  const dLeft = smoothPath(left);
  const dRight = smoothPath(rightRev).replace(/^M[^C]+/, `L${fmt(rightRev[0]!)}`);
  return `${dLeft} ${dRight} Z`;
}

/**
 * Places grass tufts along the foreground and river banks while strictly skipping any tuft that
 * comes within the local ribbon half-width + safety margin of the river or footpath.
 */
export function grassTufts(layout: ParkLayout, courses: ParkCourses = parkCourses(layout)): Pt[] {
  const { worldW: W, worldH: H, objects } = layout;
  const riverPts = sampleSpline(courses.river, 12);
  const walkPts = sampleSpline(courses.walkway, 12);
  const bed = objects.flowerbed;

  const candidates: Pt[] = [];
  const count = Math.round(W / 28);
  for (let i = 0; i < count; i++) {
    const x = 14 + i * 28;
    const y = H * 0.89 - (i % 3) * 8;
    candidates.push([x, y]);
  }

  // Bank tufts nestled safely beside the upper/mid river bends and spring rocks
  const s = courses.river[0]!;
  candidates.push(
    [s[0] - 28, s[1] + 6],
    [s[0] + 28, s[1] + 8],
    [W * 0.64, H * 0.56],
    [W * 0.94, H * 0.66],
    [W * 0.54, H * 0.78],
  );

  const safeFromCourse = (pt: Pt, spine: Pt[], widthFn: (t: number) => number, pad: number): boolean => {
    const nPts = Math.max(1, spine.length - 1);
    for (let i = 0; i < spine.length; i++) {
      const sp = spine[i]!;
      const half = widthFn(i / nPts) / 2;
      if (Math.hypot(pt[0] - sp[0], pt[1] - sp[1]) < half + pad) {
        return false;
      }
    }
    return true;
  };

  return candidates.filter((pt) => {
    if (!safeFromCourse(pt, riverPts, riverWidthAt, 11)) return false;
    if (!safeFromCourse(pt, walkPts, pathWidthAt, 9)) return false;
    const clearBedX = Math.abs(pt[0] - (bed.x + bed.w / 2)) > (bed.w * 1.15) / 2 + 8;
    const clearBedY = Math.abs(pt[1] - (bed.y + bed.h / 2)) > (bed.w * 1.15 * 0.5) / 2 + 8;
    return clearBedX || clearBedY;
  });
}

/** The fawn's box, as a share of the screen's width. */
const FAWN_SIZE = 0.22;
/** Where the nose lands at the bottom of a drink, from the feet, as a share of the fawn's size. */
export const FAWN_NOSE_DIP: Pt = [-0.525, -0.336];

/**
 * Computes where the fawn stands on the right bank and where its nose dips into the water,
 * derived directly from the river's spline so it fits every screen size.
 */
export function fawnSpot(layout: ParkLayout, courses: ParkCourses = parkCourses(layout)): {
  feet: Pt;
  water: Pt;
  duck: Pt;
  size: number;
} {
  const { worldW: W, worldH: H } = layout;
  const size = Math.round(W * FAWN_SIZE);
  const spine = sampleSpline(courses.river, 12);
  const targetY = H * 0.745;
  let water = spine[Math.floor(spine.length * 0.55)]!;
  let minDiff = Infinity;
  for (const pt of spine) {
    const diff = Math.abs(pt[1] - targetY);
    if (diff < minDiff) {
      minDiff = diff;
      water = pt;
    }
  }
  const feet: Pt = [water[0] - FAWN_NOSE_DIP[0] * size + W * 0.015, water[1] - FAWN_NOSE_DIP[1] * size];
  // Place the duck on the next bend down so the fawn and duck never collide
  const duckY = H * 0.81;
  let duck = courses.river[4]!;
  let minDuckDiff = Infinity;
  for (const pt of spine) {
    const diff = Math.abs(pt[1] - duckY);
    if (diff < minDuckDiff) {
      minDuckDiff = diff;
      duck = pt;
    }
  }
  return { feet, water, duck, size };
}

/** The rabbit's figure of eight, on the open grass between the path and the river: its middle and reach. */
export const rabbitSpot = ({ worldW: W, worldH: H }: ParkLayout): { at: Pt; rx: number; ry: number } => ({
  at: [W * 0.49, H * 0.875],
  rx: W * 0.08,
  ry: 12,
});

const centre = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];

export interface ParkCourses {
  /** The river's centre line, from the hilltop to below the bottom edge. */
  river: Pt[];
  /** The footpath's centre line, from the foot of the tree to below the bottom edge. */
  walkway: Pt[];
}

export function parkCourses({ worldW: W, worldH: H, objects }: ParkLayout): ParkCourses {
  const at = (u: number, v: number): Pt => [u * W, v * H];
  return {
    river: [at(0.62, 0.46), at(0.7, 0.53), at(0.9, 0.6), centre(objects.river), at(0.63, 0.8), at(0.9, 0.92), at(0.8, 1.04)],
    walkway: [at(0.3, 0.555), at(0.46, 0.585), at(0.56, 0.66), at(0.5, 0.75), centre(objects.path), at(0.25, 0.87), at(0.36, 0.95), at(0.46, 1.04)],
  };
}
