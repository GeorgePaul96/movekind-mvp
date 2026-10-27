/**
 * The park's long shapes: the back hill, the river and the walkway. Pure geometry in world
 * pixels, so the drawing and the tests agree on where things run.
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

/**
 * A closed band along a curve, `startWidth` wide at the first point and `endWidth` at the last:
 * a river or path that is narrow far away and wide up close.
 */
export function ribbon(pts: Pt[], startWidth: number, endWidth: number): string {
  const s = sampleSpline(pts, 10);
  const lengths = [0];
  for (let i = 1; i < s.length; i++) lengths.push(lengths[i - 1]! + Math.hypot(s[i]![0] - s[i - 1]![0], s[i]![1] - s[i - 1]![1]));
  const total = lengths[lengths.length - 1] || 1;
  const left: Pt[] = [];
  const right: Pt[] = [];
  s.forEach((p, i) => {
    const a = s[Math.max(i - 1, 0)]!;
    const b = s[Math.min(i + 1, s.length - 1)]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const half = (startWidth + (endWidth - startWidth) * (lengths[i]! / total)) / 2;
    left.push([p[0] + nx * half, p[1] + ny * half]);
    right.push([p[0] - nx * half, p[1] - ny * half]);
  });
  return `M${left.map(fmt).join(' L')} L${right.reverse().map(fmt).join(' L')} Z`;
}

const centre = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];

export interface ParkCourses {
  /** The back hill's crest, from beyond the left edge to beyond the right. */
  hill: Pt[];
  /** The river's centre line: rises on the hill crest, ends below the bottom edge. */
  river: Pt[];
  /** The walkway's centre line: from the hammock's feet to below the bottom edge. */
  walkway: Pt[];
}

export function parkCourses({ worldW: W, worldH: H, objects }: ParkLayout): ParkCourses {
  const at = (u: number, v: number): Pt => [u * W, v * H];
  const source = at(0.5, 0.555);
  const hill: Pt[] = [
    at(-0.02, 0.5), at(0.1, 0.49), at(0.2, 0.505), at(0.3, 0.535), at(0.4, 0.56),
    source, at(0.6, 0.53), at(0.7, 0.515), at(0.8, 0.53), at(0.9, 0.51), at(1.02, 0.5),
  ];
  const river: Pt[] = [source, at(0.47, 0.58), centre(objects.river), at(0.445, 0.7), at(0.4, 0.8), at(0.36, 0.92), at(0.33, 1.06)];
  const hm = objects.hammock;
  const walkway: Pt[] = [
    [hm.x + hm.w / 2, hm.y + hm.h], at(0.76, 0.62), at(0.68, 0.72), centre(objects.path), at(0.63, 0.92), at(0.66, 1.06),
  ];
  return { hill, river, walkway };
}
