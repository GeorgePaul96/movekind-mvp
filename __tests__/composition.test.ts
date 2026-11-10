import {
  ageFrom,
  bmiBand,
  composition,
  deurenbergBodyFat,
  isAdult,
  latestMeasurement,
  navyBodyFat,
  waistToHeightBand,
} from '../src/domain/body/composition';
import { averageActivity, dailyBurn, restingBurn, stepsEnergy, workoutEnergy } from '../src/domain/body/energy';
import type { BodyProfile, Measurement, Workout } from '../src/types';

const NOW = new Date(2026, 10, 10, 12);
const man: BodyProfile = { sex: 'male', birth_year: 1991, height_cm: 178, sleep_need_hours: 7.5 };
const m = (day: string, v: Partial<Measurement>): Measurement => ({ id: day, day, created_at: `${day}T08:00:00`, ...v });

describe('Navy body fat', () => {
  it('matches a worked male example', () => {
    const pct = navyBodyFat({ sex: 'male', height_cm: 178, neck_cm: 38, waist_cm: 90 })!;
    expect(pct).toBeGreaterThan(20.1);
    expect(pct).toBeLessThan(20.2);
  });

  it('agrees with the published inch form of the same male equation', () => {
    const inch = (cm: number) => cm / 2.54;
    const published = 86.01 * Math.log10(inch(90) - inch(38)) - 70.041 * Math.log10(inch(178)) + 36.76;
    expect(navyBodyFat({ sex: 'male', height_cm: 178, neck_cm: 38, waist_cm: 90 })!).toBeCloseTo(published, 0);
  });

  it('agrees with the published inch form of the female equation', () => {
    const inch = (cm: number) => cm / 2.54;
    const published = 163.205 * Math.log10(inch(75) + inch(98) - inch(33)) - 97.684 * Math.log10(inch(165)) - 78.387;
    expect(navyBodyFat({ sex: 'female', height_cm: 165, neck_cm: 33, waist_cm: 75, hip_cm: 98 })!).toBeCloseTo(published, 0);
  });

  it('is null for an impossible tape reading, never NaN', () => {
    expect(navyBodyFat({ sex: 'male', height_cm: 178, neck_cm: 40, waist_cm: 40 })).toBeNull();
    expect(navyBodyFat({ sex: 'male', height_cm: 178, neck_cm: 40, waist_cm: 30 })).toBeNull();
    expect(navyBodyFat({ sex: 'male', height_cm: 0, neck_cm: 38, waist_cm: 90 })).toBeNull();
  });

  it('needs hips for the female formula', () => {
    expect(navyBodyFat({ sex: 'female', height_cm: 165, neck_cm: 33, waist_cm: 75 })).toBeNull();
  });

  it('more waist means more body fat', () => {
    const a = navyBodyFat({ sex: 'male', height_cm: 178, neck_cm: 38, waist_cm: 85 })!;
    const b = navyBodyFat({ sex: 'male', height_cm: 178, neck_cm: 38, waist_cm: 100 })!;
    expect(b).toBeGreaterThan(a);
  });
});

describe('composition', () => {
  it('takes the newest value of each field', () => {
    const latest = latestMeasurement([
      m('2026-11-01', { weight_kg: 81, neck_cm: 38, waist_cm: 90 }),
      m('2026-11-08', { weight_kg: 80 }),
    ]);
    expect(latest).toEqual({ weight_kg: 80, neck_cm: 38, waist_cm: 90 });
    expect(latestMeasurement([])).toBeNull();
  });

  it('builds the report numbers', () => {
    const c = composition(man, { weight_kg: 80, neck_cm: 38, waist_cm: 90 }, NOW)!;
    expect(c.bmi).toBeCloseTo(25.25, 1);
    expect(c.fatMass_kg! + c.leanMass_kg!).toBeCloseTo(80, 6);
    expect(c.fatMass_kg!).toBeCloseTo(80 * 0.2015, 0);
    expect(c.waistToHeight).toBeCloseTo(0.506, 2);
    expect(c.ffmi!).toBeCloseTo(c.leanMass_kg! / 1.78 ** 2, 6);
  });

  it('shows BMI alone with only height and weight', () => {
    const c = composition(man, { weight_kg: 80 }, NOW)!;
    expect(c.bmi).toBeGreaterThan(0);
    expect(c.bodyFatPct).toBeNull();
    expect(c.leanMass_kg).toBeNull();
    expect(c.waistToHeight).toBeNull();
  });

  it('is null for under 18s and for missing details', () => {
    expect(composition({ ...man, birth_year: 2012 }, { weight_kg: 50 }, NOW)).toBeNull();
    expect(composition({ ...man, birth_year: null }, { weight_kg: 80 }, NOW)).toBeNull();
    expect(composition({ ...man, height_cm: null }, { weight_kg: 80 }, NOW)).toBeNull();
    expect(composition(man, {}, NOW)).toBeNull();
    expect(composition(null, null, NOW)).toBeNull();
    expect(isAdult({ birth_year: 2008 }, NOW)).toBe(true);
    expect(isAdult({ birth_year: 2009 }, NOW)).toBe(false);
    expect(ageFrom(1991, NOW)).toBe(35);
  });

  it('bands use neutral reference ranges', () => {
    expect(bmiBand(18.4)).toBe('below');
    expect(bmiBand(22)).toBe('within');
    expect(bmiBand(25)).toBe('above');
    expect(waistToHeightBand(0.45)).toBe('within');
    expect(waistToHeightBand(0.5)).toBe('above');
  });

  it('Deurenberg fallback matches its formula', () => {
    expect(deurenbergBodyFat('male', 25, 35)).toBeCloseTo(1.2 * 25 + 0.23 * 35 - 10.8 - 5.4, 6);
    expect(deurenbergBodyFat('female', 22, 30)).toBeCloseTo(1.2 * 22 + 0.23 * 30 - 5.4, 6);
  });
});

describe('energy', () => {
  it('Mifflin-St Jeor worked examples', () => {
    expect(restingBurn('male', 80, 178, 35)).toBe(1742.5);
    expect(restingBurn('female', 65, 165, 30)).toBe(1370.25);
  });

  it('walking 10,000 steps costs a plausible amount', () => {
    // 10,000 steps at 178 cm is about 7.4 km; at 0.5 kcal per kg per km and 80 kg, about 295 kcal.
    expect(stepsEnergy(10000, 178, 80)).toBeCloseTo(294.8, 0);
    expect(stepsEnergy(0, 178, 80)).toBe(0);
  });

  it('walks and runs add nothing when steps already count them', () => {
    expect(workoutEnergy('walk', 60, 80, true)).toBe(0);
    expect(workoutEnergy('run', 30, 80, true)).toBe(0);
    expect(workoutEnergy('walk', 60, 80, false)).toBeCloseTo(200, 6);
    expect(workoutEnergy('gym', 60, 80, true)).toBeCloseTo(200, 6);
  });

  it('daily burn adds living, steps and workouts', () => {
    const burn = dailyBurn({ sex: 'male', weight_kg: 80, height_cm: 178, age: 35, avgSteps: 10000, avgWorkoutKcal: 100 });
    expect(burn).toBeCloseTo(1742.5 * 1.2 + stepsEnergy(10000, 178, 80) + 100, 6);
  });

  it('averages the last two weeks of activity', () => {
    const w = (daysAgo: number, type: Workout['type'], minutes: number): Workout => ({
      id: `${daysAgo}`,
      type,
      minutes,
      created_at: new Date(2026, 10, 10 - daysAgo, 9).toISOString(),
    });
    const noSteps = averageActivity([w(1, 'gym', 60), w(20, 'gym', 60)], undefined, 80, NOW);
    expect(noSteps.avgSteps).toBeNull();
    expect(noSteps.avgWorkoutKcal).toBeCloseTo(200 / 14, 6);

    const withSteps = averageActivity([w(1, 'walk', 60)], { '2026-11-09': 8000, '2026-11-10': 6000, '2026-09-01': 99999 }, 80, NOW);
    expect(withSteps.avgSteps).toBe(7000);
    expect(withSteps.avgWorkoutKcal).toBe(0);
  });
});
