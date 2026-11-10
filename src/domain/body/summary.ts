import {
  ageFrom,
  bmiOf,
  composition,
  deurenbergBodyFat,
  isAdult,
  latestMeasurement,
  type Composition,
  type MergedMeasurement,
} from '@/domain/body/composition';
import { averageActivity, dailyBurn, restingBurn } from '@/domain/body/energy';
import { isTrend, project, weightTrend, type Projection, type Trend, type TrendNeeds } from '@/domain/body/projection';
import type { BodyProfile, Measurement, Workout } from '@/types';

/**
 * Everything the Body section shows, worked out in one place so the screen and the
 * exported report can never disagree. Pure.
 */
export interface BodySummary {
  /** details: sex, birth year or height missing. minor: under 18. weight: no weigh-in yet. */
  state: 'details' | 'minor' | 'weight' | 'ready';
  age: number | null;
  latest: MergedMeasurement | null;
  composition: Composition | null;
  /** The body fat the projection starts from, and whether it is the rougher BMI estimate. */
  bodyFat: { pct: number; estimated: boolean } | null;
  burn: { resting: number; daily: number; hasSteps: boolean } | null;
  trend: Trend | TrendNeeds | null;
  projection: Projection | null;
}

export function bodySummary(
  i: {
    profile: BodyProfile | null;
    measurements: Measurement[];
    workouts: Workout[];
    stepsByDay?: Record<string, number>;
    extraSteps?: number;
  },
  now: Date,
): BodySummary {
  const none: BodySummary = {
    state: 'details',
    age: null,
    latest: null,
    composition: null,
    bodyFat: null,
    burn: null,
    trend: null,
    projection: null,
  };
  const p = i.profile;
  if (!p || !p.sex || p.birth_year == null || !p.height_cm) return none;
  const age = ageFrom(p.birth_year, now);
  if (!isAdult(p, now)) return { ...none, state: 'minor', age };

  const latest = latestMeasurement(i.measurements);
  const comp = composition(p, latest, now);
  if (!latest || !comp) return { ...none, state: 'weight', age, latest };

  const weight = comp.weight_kg;
  const bodyFat =
    comp.bodyFatPct != null
      ? { pct: comp.bodyFatPct, estimated: false }
      : { pct: deurenbergBodyFat(p.sex, bmiOf(weight, p.height_cm), age), estimated: true };

  const activity = averageActivity(i.workouts, i.stepsByDay, weight, now);
  const burn = {
    resting: restingBurn(p.sex, weight, p.height_cm, age),
    daily: dailyBurn({ sex: p.sex, weight_kg: weight, height_cm: p.height_cm, age, ...activity }),
    hasSteps: activity.avgSteps != null,
  };

  const trend = weightTrend(i.measurements, now);
  const projection = isTrend(trend)
    ? project({
        sex: p.sex,
        age,
        height_cm: p.height_cm,
        start: { weight_kg: trend.fittedNow_kg, bodyFatPct: bodyFat.pct },
        trend,
        ...activity,
        extraSteps: i.extraSteps ?? 0,
      })
    : null;

  return { state: 'ready', age, latest, composition: comp, bodyFat, burn, trend, projection };
}
