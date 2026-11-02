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
