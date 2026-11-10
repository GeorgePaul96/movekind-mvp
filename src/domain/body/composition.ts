import type { BodyProfile, FormulaSex, Measurement } from '@/types';

/**
 * Body composition from a tape measure and a scale. Pure: no I/O, no clock.
 * Every formula here is cited in src/constants/sources.ts. Lengths are centimetres,
 * weights kilograms.
 */

/** The Navy method's standard error, in body fat percentage points. */
export const BODY_FAT_ERROR = 3.5;

const ADULT_AGE = 18;

/** Age this calendar year (birthdays are not asked for). */
export function ageFrom(birthYear: number, now: Date): number {
  return now.getFullYear() - birthYear;
}

/** The formulas are for adults: false for under 18s and for a missing birth year. */
export function isAdult(profile: Pick<BodyProfile, 'birth_year'> | null, now: Date): boolean {
  return profile?.birth_year != null && ageFrom(profile.birth_year, now) >= ADULT_AGE;
}

export type MergedMeasurement = Pick<Measurement, 'weight_kg' | 'neck_cm' | 'waist_cm' | 'hip_cm'>;

/** The newest value of each field (people weigh in more often than they measure). */
export function latestMeasurement(rows: Measurement[]): MergedMeasurement | null {
  if (!rows.length) return null;
  const merged: MergedMeasurement = {};
  for (const row of [...rows].sort((a, b) => a.day.localeCompare(b.day))) {
    if (row.weight_kg != null) merged.weight_kg = row.weight_kg;
    if (row.neck_cm != null) merged.neck_cm = row.neck_cm;
    if (row.waist_cm != null) merged.waist_cm = row.waist_cm;
    if (row.hip_cm != null) merged.hip_cm = row.hip_cm;
  }
  return merged;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Body fat % by the US Navy circumference method (Hodgdon and Beckett, 1984), centimetres.
 * Null when a measurement is missing or impossible (a waist no larger than the neck).
 */
export function navyBodyFat(i: {
  sex: FormulaSex;
  height_cm: number;
  neck_cm: number;
  waist_cm: number;
  hip_cm?: number;
}): number | null {
  if (!(i.height_cm > 0) || !(i.neck_cm > 0) || !(i.waist_cm > 0)) return null;
  let density: number;
  if (i.sex === 'male') {
    const girth = i.waist_cm - i.neck_cm;
    if (!(girth > 0)) return null;
    density = 1.0324 - 0.19077 * Math.log10(girth) + 0.15456 * Math.log10(i.height_cm);
  } else {
    if (i.hip_cm == null || !(i.hip_cm > 0)) return null;
    const girth = i.waist_cm + i.hip_cm - i.neck_cm;
    if (!(girth > 0)) return null;
    density = 1.29579 - 0.35004 * Math.log10(girth) + 0.221 * Math.log10(i.height_cm);
  }
  const pct = 495 / density - 450;
  return Number.isFinite(pct) ? clamp(pct, 3, 60) : null;
}

/**
 * Body fat % from BMI, age and sex (Deurenberg, 1991). Rougher than the tape method:
 * used only so a projection can start from weigh-ins alone.
 */
export function deurenbergBodyFat(sex: FormulaSex, bmi: number, age: number): number {
  return clamp(1.2 * bmi + 0.23 * age - 10.8 * (sex === 'male' ? 1 : 0) - 5.4, 3, 60);
}

export function bmiOf(weight_kg: number, height_cm: number): number {
  const m = height_cm / 100;
  return weight_kg / (m * m);
}

export interface Composition {
  weight_kg: number;
  bmi: number;
  /** Null until the tape measurements the formula needs are in. */
  bodyFatPct: number | null;
  fatMass_kg: number | null;
  leanMass_kg: number | null;
  /** Fat-free mass index: lean mass / height squared. */
  ffmi: number | null;
  waistToHeight: number | null;
}

/** The report's numbers. Null without height, weight or an adult birth year. */
export function composition(
  profile: BodyProfile | null,
  latest: MergedMeasurement | null,
  now: Date,
): Composition | null {
  if (!profile || !latest || !isAdult(profile, now)) return null;
  const { height_cm, sex } = profile;
  const { weight_kg, neck_cm, waist_cm, hip_cm } = latest;
  if (!height_cm || !weight_kg) return null;

  const bodyFatPct =
    sex && neck_cm && waist_cm ? navyBodyFat({ sex, height_cm, neck_cm, waist_cm, hip_cm }) : null;
  const fatMass_kg = bodyFatPct == null ? null : (weight_kg * bodyFatPct) / 100;
  const leanMass_kg = fatMass_kg == null ? null : weight_kg - fatMass_kg;
  const m = height_cm / 100;
  return {
    weight_kg,
    bmi: bmiOf(weight_kg, height_cm),
    bodyFatPct,
    fatMass_kg,
    leanMass_kg,
    ffmi: leanMass_kg == null ? null : leanMass_kg / (m * m),
    waistToHeight: waist_cm ? waist_cm / height_cm : null,
  };
}

/** Where a value sits against its source's reference range. Deliberately neutral words. */
export type Band = 'below' | 'within' | 'above';

export const BMI_RANGE: readonly [number, number] = [18.5, 25];
export const WAIST_TO_HEIGHT_RANGE: readonly [number, number] = [0.4, 0.5];

const band = (v: number, [lo, hi]: readonly [number, number]): Band =>
  v < lo ? 'below' : v >= hi ? 'above' : 'within';

/** WHO adult reference range: 18.5 up to 25. */
export const bmiBand = (bmi: number): Band => band(bmi, BMI_RANGE);
/** NICE 2022: 0.4 up to 0.5. */
export const waistToHeightBand = (ratio: number): Band => band(ratio, WAIST_TO_HEIGHT_RANGE);
