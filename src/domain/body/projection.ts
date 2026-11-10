import { localDayKey, startOfLocalDay } from '@/domain/garden/days';
import { bmiOf } from '@/domain/body/composition';
import { restingBurn, stepsEnergy } from '@/domain/body/energy';
import type { FormulaSex, Measurement } from '@/types';

/**
 * "At this pace": where the person's own weight trend leads. Pure.
 *
 * The app does not know what people eat, so it cannot project from calories. It reads
 * the trend in their weigh-ins, works out the intake that trend implies, then holds that
 * intake and their activity steady and simulates forward a day at a time (Hall's dynamic
 * model, simplified, with the Forbes rule for how change splits between fat and lean).
 * It ignores water shifts, metabolic adaptation and muscle gained by training.
 */

export const TREND_DAYS = 42;
export const MIN_WEIGH_INS = 4;
export const MIN_SPAN_DAYS = 14;
export const PROJECTION_WEEKS = [4, 12, 26] as const;

/** Energy densities of body fat and lean tissue, kcal per kg (Hall, 2008). */
const FAT_KCAL_PER_KG = 9400;
const LEAN_KCAL_PER_KG = 1800;
/** Forbes's constant, kg (Hall, 2007). */
const FORBES_KG = 10.4;
/** WHO lower end of the adult BMI reference range: nothing is ever shown below it. */
export const BMI_FLOOR = 18.5;
/** Losing more than this share of body weight a week is treated as too fast to project. */
const MAX_WEEKLY_LOSS = 0.01;

export interface Trend {
  slopeKgPerWeek: number;
  /** 95% confidence interval for the slope. */
  low: number;
  high: number;
  /** Weigh-ins used. */
  n: number;
  spanDays: number;
  /** The trend line's value today: steadier than any single weigh-in. */
  fittedNow_kg: number;
}

export interface TrendNeeds {
  needWeighIns: number;
  needDays: number;
}

export const isTrend = (t: Trend | TrendNeeds): t is Trend => 'slopeKgPerWeek' in t;

/** Two-sided 95% t values for 1 to 30 degrees of freedom. */
const T95 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131,
  2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(new Date(y, m - 1, d).getTime() / 86_400_000);
}

/** Least squares line through the last six weeks of weigh-ins. */
export function weightTrend(rows: Measurement[], now: Date): Trend | TrendNeeds {
  const sinceKey = localDayKey(startOfLocalDay(now, -TREND_DAYS));
  const todayKey = localDayKey(now);
  const points = rows
    .filter((r) => r.weight_kg != null && r.day >= sinceKey && r.day <= todayKey)
    .map((r) => ({ x: dayNumber(r.day), y: r.weight_kg as number }))
    .sort((a, b) => a.x - b.x);

  const n = points.length;
  const spanDays = n ? points[n - 1].x - points[0].x : 0;
  if (n < MIN_WEIGH_INS || spanDays < MIN_SPAN_DAYS) {
    return { needWeighIns: Math.max(0, MIN_WEIGH_INS - n), needDays: Math.max(0, MIN_SPAN_DAYS - spanDays) };
  }

  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  const sxx = points.reduce((s, p) => s + (p.x - meanX) ** 2, 0);
  const sxy = points.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0);
  const slope = sxy / sxx; // kg per day
  const intercept = meanY - slope * meanX;
  const sse = points.reduce((s, p) => s + (p.y - (intercept + slope * p.x)) ** 2, 0);
  const se = n > 2 ? Math.sqrt(sse / (n - 2) / sxx) : 0;
  const t = T95[Math.min(n - 2, T95.length) - 1] ?? 2;
  const margin = t * se;

  return {
    slopeKgPerWeek: slope * 7,
    low: (slope - margin) * 7,
    high: (slope + margin) * 7,
    n,
    spanDays,
    fittedNow_kg: intercept + slope * dayNumber(todayKey),
  };
}

export interface BodyPoint {
  weeks: number;
  weight_kg: number;
  bodyFatPct: number;
  fatMass_kg: number;
  leanMass_kg: number;
}

export interface Projection {
  /**
   * ok: a direction to show. steady: the trend can't be told apart from no change.
   * too-fast: the pace is faster than is usually considered healthy, or heads under the
   * reference range; the app shows a calm note instead of numbers.
   */
  status: 'ok' | 'steady' | 'too-fast';
  central: BodyPoint[];
  /** The projections at the two ends of the trend's confidence interval. */
  low: BodyPoint[];
  high: BodyPoint[];
}

export interface ProjectInput {
  sex: FormulaSex;
  age: number;
  height_cm: number;
  start: { weight_kg: number; bodyFatPct: number };
  trend: Trend;
  avgSteps: number | null;
  avgWorkoutKcal: number;
  /** The person's own "what if": extra steps a day on top of their average. */
  extraSteps: number;
}

/** The lean share of a small weight change (Forbes, as restated by Hall). */
const leanShare = (fatMass_kg: number) => FORBES_KG / (FORBES_KG + Math.max(fatMass_kg, 0));
const density = (fatMass_kg: number) => {
  const p = leanShare(fatMass_kg);
  return FAT_KCAL_PER_KG * (1 - p) + LEAN_KCAL_PER_KG * p;
};

function simulate(i: ProjectInput, slopeKgPerWeek: number): BodyPoint[] {
  const w0 = i.start.weight_kg;
  const steps = i.avgSteps ?? 0;
  const burn = (weight: number, extra: number) =>
    restingBurn(i.sex, weight, i.height_cm, i.age) * 1.2 +
    stepsEnergy(steps + extra, i.height_cm, weight) +
    i.avgWorkoutKcal * (weight / w0);

  let weight = w0;
  let fat = (w0 * i.start.bodyFatPct) / 100;
  // The intake their current trend implies, held steady from here.
  const intake = burn(w0, 0) + (slopeKgPerWeek / 7) * density(fat);
  const floorWeight = BMI_FLOOR * (i.height_cm / 100) ** 2;

  const out: BodyPoint[] = [];
  const lastDay = PROJECTION_WEEKS[PROJECTION_WEEKS.length - 1] * 7;
  for (let day = 1; day <= lastDay; day++) {
    const change = (intake - burn(weight, i.extraSteps)) / density(fat);
    fat = Math.max(fat + change * (1 - leanShare(fat)), weight * 0.03);
    weight += change;
    if (PROJECTION_WEEKS.some((w) => w * 7 === day)) {
      const shown = Math.max(weight, floorWeight);
      const shownFat = Math.min(fat, shown * 0.6);
      out.push({
        weeks: day / 7,
        weight_kg: shown,
        fatMass_kg: shownFat,
        leanMass_kg: shown - shownFat,
        bodyFatPct: (shownFat / shown) * 100,
      });
    }
  }
  return out;
}

export function project(i: ProjectInput): Projection {
  const central = simulate(i, i.trend.slopeKgPerWeek);
  const a = simulate(i, i.trend.low);
  const b = simulate(i, i.trend.high);

  const floorWeight = BMI_FLOOR * (i.height_cm / 100) ** 2;
  const tooFast =
    i.trend.slopeKgPerWeek < -MAX_WEEKLY_LOSS * i.start.weight_kg ||
    bmiOf(i.start.weight_kg, i.height_cm) < BMI_FLOOR ||
    central.some((p) => p.weight_kg <= floorWeight + 1e-9);
  const steady = i.trend.low <= 0 && i.trend.high >= 0 && i.extraSteps === 0;

  return { status: tooFast ? 'too-fast' : steady ? 'steady' : 'ok', central, low: a, high: b };
}
