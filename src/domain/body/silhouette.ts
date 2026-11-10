import type { FormulaSex } from '@/types';

/**
 * A plain front-view figure whose widths follow the tape measurements. Pure geometry:
 * the component only draws what this returns. Not a likeness: a simple outline so a
 * change in waist or hips can be seen, nothing more.
 */

const NAVY = {
  male: { a: 1.0324, girth: 0.19077, height: 0.15456 },
  female: { a: 1.29579, girth: 0.35004, height: 0.221 },
} as const;

/**
 * The waist (and hips) that go with a body fat %, by turning the Navy formula around.
 * Neck and height are held fixed; for the female formula waist and hips keep their
 * current proportion.
 */
export function waistAtBodyFat(i: {
  sex: FormulaSex;
  height_cm: number;
  neck_cm: number;
  bodyFatPct: number;
  waist_cm: number;
  hip_cm?: number;
}): { waist_cm: number; hip_cm?: number } {
  const k = NAVY[i.sex];
  const bodyDensity = 495 / (i.bodyFatPct + 450);
  const girth = 10 ** ((k.a + k.height * Math.log10(i.height_cm) - bodyDensity) / k.girth);
  if (i.sex === 'male' || i.hip_cm == null) {
    const waist_cm = girth + i.neck_cm;
    // Hips follow the waist in proportion when they were measured.
    return { waist_cm, hip_cm: i.hip_cm == null ? undefined : (i.hip_cm * waist_cm) / i.waist_cm };
  }
  const total = girth + i.neck_cm;
  const share = i.waist_cm / (i.waist_cm + i.hip_cm);
  return { waist_cm: total * share, hip_cm: total * (1 - share) };
}

/** Typical waist to hip ratio, used only to sketch hips that were not measured. */
export function estimateHip(sex: FormulaSex, waist_cm: number): number {
  return waist_cm / (sex === 'male' ? 0.92 : 0.8);
}

export interface Outline {
  /** Torso and legs, one closed path. */
  path: string;
  head: { cx: number; cy: number; r: number };
  /** Arms as round-ended lines. */
  arms: { x1: number; y1: number; x2: number; y2: number; width: number }[];
  /** Half-widths in box units, for tests and labels. */
  rows: { shoulder: number; waist: number; hip: number };
  width: number;
  height: number;
}

type Pt = [number, number];

/** A soft closed curve through the midpoints of a polygon. */
function smoothPath(points: Pt[]): string {
  const n = points.length;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (v: number) => (Math.round(v * 10) / 10).toString();
  const start = mid(points[n - 1], points[0]);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let k = 0; k < n; k++) {
    const p = points[k];
    const m = mid(p, points[(k + 1) % n]);
    d += ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d} Z`;
}

/** Share of a girth seen from the front (a torso is wider than it is deep). */
const FRONT_SHARE = 0.34;

export function silhouette(
  i: { height_cm: number; neck_cm: number; waist_cm: number; hip_cm: number; bodyFatPct: number },
  box: { width: number; height: number },
): Outline {
  const pad = box.height * 0.03;
  const scale = (box.height - pad * 2) / i.height_cm; // box units per cm
  const cx = box.width / 2;
  const y = (share: number) => pad + share * i.height_cm * scale;
  const softness = 1 + (Math.min(60, Math.max(3, i.bodyFatPct)) - 20) / 200;

  const neck = (i.neck_cm / Math.PI / 2) * scale * 1.1;
  const waist = (i.waist_cm * FRONT_SHARE * scale) / 2;
  const hip = (i.hip_cm * FRONT_SHARE * scale) / 2;
  const shoulder = Math.max(i.height_cm * 0.118 * softness * scale, waist * 0.95);
  const chest = Math.max((shoulder * 0.84 + waist) / 2, waist * 0.98);
  const thigh = hip * 0.5;
  const knee = i.height_cm * 0.03 * softness * scale;
  const ankle = i.height_cm * 0.02 * scale;
  const legX = Math.max(hip * 0.5, knee + 1);

  const right: Pt[] = [
    [neck, y(0.125)],
    [neck * 1.15, y(0.16)],
    [shoulder, y(0.185)],
    [chest, y(0.27)],
    [waist, y(0.4)],
    [hip, y(0.5)],
    [legX + thigh, y(0.57)],
    [legX + knee, y(0.74)],
    [legX + ankle, y(0.95)],
    [legX + ankle, y(0.985)],
    [legX - ankle, y(0.985)],
    [legX - ankle, y(0.95)],
    [legX - knee, y(0.74)],
    [Math.max(legX - thigh, 0.5), y(0.57)],
    [0, y(0.535)],
  ];
  const left = right
    .slice(0, -1)
    .reverse()
    .map(([x, py]): Pt => [-x, py]);
  const points = [...right, ...left].map(([x, py]): Pt => [cx + x, py]);

  const armWidth = i.height_cm * 0.045 * softness * scale;
  const armTop = y(0.21);
  const armEnd = y(0.49);
  const reach = Math.max(shoulder, hip) + armWidth * 0.9;

  return {
    path: smoothPath(points),
    head: { cx, cy: y(0.065), r: i.height_cm * 0.058 * scale },
    arms: [
      { x1: cx + shoulder, y1: armTop, x2: cx + reach, y2: armEnd, width: armWidth },
      { x1: cx - shoulder, y1: armTop, x2: cx - reach, y2: armEnd, width: armWidth },
    ],
    rows: { shoulder, waist, hip },
    width: box.width,
    height: box.height,
  };
}
