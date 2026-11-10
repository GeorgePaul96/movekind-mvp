/** Display and entry units. Everything is stored metric; these convert at the edge. Pure. */
export type Units = 'metric' | 'imperial';

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

export const toDisplayLength = (cm: number, units: Units) => (units === 'imperial' ? cm / CM_PER_INCH : cm);
export const fromDisplayLength = (value: number, units: Units) => (units === 'imperial' ? value * CM_PER_INCH : value);
export const toDisplayWeight = (kg: number, units: Units) => (units === 'imperial' ? kg / KG_PER_LB : kg);
export const fromDisplayWeight = (value: number, units: Units) => (units === 'imperial' ? value * KG_PER_LB : value);

export const lengthUnit = (units: Units) => (units === 'imperial' ? 'in' : 'cm');
export const weightUnit = (units: Units) => (units === 'imperial' ? 'lb' : 'kg');

/** One decimal place, without a trailing ".0". */
export function tidy(n: number, places = 1): string {
  const f = 10 ** places;
  return String(Math.round(n * f) / f);
}

/** Reads what someone typed ("80,5" or "80.5"). Null when it is not a number. */
export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(',', '.');
  if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** Plausible human limits, metric. Anything outside is treated as a typing slip. */
export const LIMITS = {
  height_cm: [120, 230],
  weight_kg: [30, 300],
  neck_cm: [20, 70],
  waist_cm: [40, 200],
  hip_cm: [50, 200],
  bpm: [30, 200],
} as const satisfies Record<string, readonly [number, number]>;

export const within = (value: number, [lo, hi]: readonly [number, number]) => value >= lo && value <= hi;
