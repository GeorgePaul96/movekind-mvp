import { patterns } from '../src/domain/insights/patterns';
import { sleepBalance } from '../src/domain/insights/sleepDebt';
import { relativeRiskAt, stepsHealth } from '../src/domain/insights/stepsHealth';
import { activityIndex, restingPulse, vo2peak } from '../src/domain/insights/fitness';
import type { CheckIn, SleepLog, WaterLog, Workout } from '../src/types';

const NOW = new Date(2026, 10, 10, 12);
const pad = (n: number) => String(n).padStart(2, '0');
const at = (daysAgo: number, hour = 9) => new Date(2026, 10, 10 - daysAgo, hour);
const key = (daysAgo: number) => {
  const d = at(daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const checkIn = (daysAgo: number, energy_score: number): CheckIn => ({
  id: `c${daysAgo}`,
  user_id: 'u',
  energy_score,
  sleep_quality: null,
  intention: null,
  engine_version: 'garden-1',
  created_at: at(daysAgo).toISOString(),
});
const night = (daysAgo: number, hours: number): SleepLog => ({
  id: `s${daysAgo}`,
  night_of: key(daysAgo),
  hours,
  feel: null,
  created_at: at(daysAgo, 7).toISOString(),
});
const workout = (daysAgo: number, type: Workout['type'] = 'gym', minutes = 40): Workout => ({
  id: `w${daysAgo}${type}`,
  type,
  minutes,
  created_at: at(daysAgo, 18).toISOString(),
});
const glass = (daysAgo: number, n: number): WaterLog[] =>
  Array.from({ length: n }, (_, k) => ({ id: `g${daysAgo}-${k}`, created_at: at(daysAgo, 10 + k).toISOString() }));
const empty = { checkIns: [], sleep: [], workouts: [], water: [] };

describe('patterns', () => {
  it('names a link between longer nights and mood', () => {
    const days = Array.from({ length: 20 }, (_, k) => k + 1);
    const result = patterns(
      {
        ...empty,
        checkIns: days.map((d) => checkIn(d, d % 2 ? 4 : 2)),
        sleep: days.map((d) => night(d, d % 2 ? 8 : 5.5)),
      },
      NOW,
    );
    expect(result).toContainEqual({ kind: 'sleep-mood', direction: 'up' });
  });

  it('says nothing with fewer than two weeks of paired days', () => {
    const days = Array.from({ length: 10 }, (_, k) => k + 1);
    const result = patterns(
      { ...empty, checkIns: days.map((d) => checkIn(d, d % 2 ? 4 : 2)), sleep: days.map((d) => night(d, d % 2 ? 8 : 5.5)) },
      NOW,
    );
    expect(result.find((p) => p.kind === 'sleep-mood')).toBeUndefined();
  });

  it('says nothing when the two kinds of day look the same', () => {
    const days = Array.from({ length: 20 }, (_, k) => k + 1);
    const result = patterns(
      { ...empty, checkIns: days.map(() => 3).map((e, k) => checkIn(k + 1, e)), sleep: days.map((d) => night(d, d % 2 ? 8 : 5.5)) },
      NOW,
    );
    expect(result).toEqual([]);
  });

  it('needs at least five days in each group', () => {
    const days = Array.from({ length: 20 }, (_, k) => k + 1);
    const result = patterns(
      { ...empty, checkIns: days.map((d) => checkIn(d, d <= 3 ? 5 : 2)), sleep: days.map((d) => night(d, d <= 3 ? 8 : 5)) },
      NOW,
    );
    expect(result.find((p) => p.kind === 'sleep-mood')).toBeUndefined();
  });

  it('skips nights that were not logged instead of counting them as short', () => {
    const days = Array.from({ length: 30 }, (_, k) => k + 1);
    // Only 8 nights logged, all long, all good moods; the other days have low moods and no sleep log.
    const result = patterns(
      { ...empty, checkIns: days.map((d) => checkIn(d, d <= 8 ? 5 : 1)), sleep: days.filter((d) => d <= 8).map((d) => night(d, 8)) },
      NOW,
    );
    expect(result.find((p) => p.kind === 'sleep-mood')).toBeUndefined();
  });

  it('finds movement and mood, in either direction', () => {
    const days = Array.from({ length: 20 }, (_, k) => k + 1);
    const up = patterns(
      { ...empty, checkIns: days.map((d) => checkIn(d, d % 2 ? 4 : 2)), workouts: days.filter((d) => d % 2).map((d) => workout(d)) },
      NOW,
    );
    expect(up).toContainEqual({ kind: 'movement-mood', direction: 'up' });
    const down = patterns(
      { ...empty, checkIns: days.map((d) => checkIn(d, d % 2 ? 2 : 4)), workouts: days.filter((d) => d % 2).map((d) => workout(d)) },
      NOW,
    );
    expect(down).toContainEqual({ kind: 'movement-mood', direction: 'down' });
  });

  it('finds steps and water against the person own median', () => {
    const days = Array.from({ length: 13 }, (_, k) => k + 1);
    const extra = Array.from({ length: 7 }, (_, k) => k + 14);
    const all = [...days, ...extra];
    const result = patterns(
      {
        ...empty,
        checkIns: all.map((d) => checkIn(d, d % 2 ? 4 : 2)),
        water: all.flatMap((d) => glass(d, d % 2 ? 7 : 2)),
        stepsByDay: Object.fromEntries(all.map((d) => [key(d), d % 2 ? 9000 : 3000])),
      },
      NOW,
    );
    expect(result).toContainEqual({ kind: 'water-mood', direction: 'up' });
    expect(result).toContainEqual({ kind: 'steps-mood', direction: 'up' });
  });

  it('handles no data at all', () => {
    expect(patterns(empty, NOW)).toEqual([]);
  });
});

describe('sleepBalance', () => {
  it('adds up the shortfall over logged nights', () => {
    const nights = [0, 1, 2, 3, 4, 5].map((d) => night(d, 6.5));
    expect(sleepBalance(nights, 7.5, NOW)).toEqual({ hoursBehind: 6, nights: 6 });
  });

  it('needs five logged nights', () => {
    expect(sleepBalance([0, 1, 2, 3].map((d) => night(d, 5)), 7.5, NOW)).toBeNull();
  });

  it('a night not logged changes nothing', () => {
    const logged = [0, 2, 4, 6, 8].map((d) => night(d, 7));
    expect(sleepBalance(logged, 7.5, NOW)).toEqual({ hoursBehind: 2.5, nights: 5 });
  });

  it('longer nights pay it back, and it never goes below level', () => {
    const mixed = [night(0, 6), night(1, 9), night(2, 7.5), night(3, 7.5), night(4, 7.5)];
    expect(sleepBalance(mixed, 7.5, NOW)!.hoursBehind).toBe(0);
    expect(sleepBalance([0, 1, 2, 3, 4].map((d) => night(d, 9)), 7.5, NOW)!.hoursBehind).toBe(0);
  });

  it('ignores nights older than two weeks', () => {
    const old = [20, 21, 22, 23, 24].map((d) => night(d, 4));
    expect(sleepBalance(old, 7.5, NOW)).toBeNull();
  });
});

describe('stepsHealth', () => {
  const steps = (days: number, n: number) => Object.fromEntries(Array.from({ length: days }, (_, k) => [key(k + 1), n]));

  it('needs a week of steps', () => {
    expect(stepsHealth(steps(6, 8000), 35, NOW)).toBeNull();
    expect(stepsHealth(undefined, 35, NOW)).toBeNull();
  });

  it('leaves out today, which is still in progress', () => {
    const r = stepsHealth({ ...steps(7, 8000), [key(0)]: 100 }, 35, NOW)!;
    expect(r.average).toBe(8000);
    expect(r.days).toBe(7);
  });

  it('reads the published points off the curve', () => {
    expect(relativeRiskAt(3553)).toBe(1);
    expect(relativeRiskAt(5801)).toBeCloseTo(0.6, 6);
    expect(relativeRiskAt(7842)).toBeCloseTo(0.55, 6);
    expect(relativeRiskAt(10901)).toBeCloseTo(0.47, 6);
    expect(relativeRiskAt(1000)).toBe(1);
    expect(relativeRiskAt(30000)).toBe(0.47);
  });

  it('more steps never read as higher risk', () => {
    let last = 1;
    for (let s = 2000; s <= 14000; s += 500) {
      const r = relativeRiskAt(s);
      expect(r).toBeLessThanOrEqual(last);
      last = r;
    }
  });

  it('levels off earlier for people 60 and over', () => {
    expect(stepsHealth(steps(8, 7000), 65, NOW)!.plateau).toEqual([6000, 8000]);
    expect(stepsHealth(steps(8, 7000), 40, NOW)!.plateau).toEqual([8000, 10000]);
  });
});

describe('fitness estimate', () => {
  it('matches the published equations', () => {
    expect(vo2peak({ sex: 'male', age: 40, waist_cm: 90, restingPulse: 60, activityIndex: 15 })).toBeCloseTo(
      100.27 - 0.296 * 40 - 0.369 * 90 - 0.155 * 60 + 0.226 * 15,
      6,
    );
    // 100.27 - 11.84 - 33.21 - 9.3 + 3.39 = 49.31
    expect(vo2peak({ sex: 'male', age: 40, waist_cm: 90, restingPulse: 60, activityIndex: 15 })).toBeCloseTo(49.31, 2);
    // 74.736 - 9.88 - 20.72 - 7.41 + 2.97 = 39.696
    expect(vo2peak({ sex: 'female', age: 40, waist_cm: 80, restingPulse: 65, activityIndex: 15 })).toBeCloseTo(39.696, 2);
  });

  it('a higher resting pulse or a larger waist reads as lower fitness', () => {
    const base = { sex: 'male' as const, age: 40, waist_cm: 90, restingPulse: 60, activityIndex: 15 };
    expect(vo2peak({ ...base, restingPulse: 80 })).toBeLessThan(vo2peak(base));
    expect(vo2peak({ ...base, waist_cm: 105 })).toBeLessThan(vo2peak(base));
    expect(vo2peak({ ...base, activityIndex: 22.5 })).toBeGreaterThan(vo2peak(base));
  });

  it('builds the activity index from the last four weeks', () => {
    expect(activityIndex([], NOW).index).toBe(0);
    // Three 40-minute gym sessions a week: frequency 2, duration 1.5, breathing hard 5.
    const regular = Array.from({ length: 12 }, (_, k) => workout(k * 2 + 1));
    const a = activityIndex(regular, NOW);
    expect(a.perWeek).toBe(3);
    expect(a.index).toBe(15);
    expect(a.intensity).toBe('breathing-hard');
    // Short easy yoga once a week.
    const gentle = [1, 8, 15, 22].map((d) => workout(d, 'yoga', 20));
    expect(activityIndex(gentle, NOW)).toMatchObject({ index: 1, intensity: 'easy' });
    // Older than four weeks does not count.
    expect(activityIndex([workout(40)], NOW).index).toBe(0);
  });

  it('uses the latest pulse from the last 30 days', () => {
    const p = (daysAgo: number, bpm: number) => ({ id: `${daysAgo}`, bpm, created_at: at(daysAgo).toISOString() });
    expect(restingPulse([p(40, 70)], NOW)).toBeNull();
    expect(restingPulse([p(10, 66), p(2, 61), p(40, 70)], NOW)).toBe(61);
    expect(restingPulse([], NOW)).toBeNull();
  });
});
