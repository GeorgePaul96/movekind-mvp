import { navyBodyFat } from '../src/domain/body/composition';
import { isTrend, project, weightTrend, type ProjectInput, type Trend } from '../src/domain/body/projection';
import { estimateHip, silhouette, waistAtBodyFat } from '../src/domain/body/silhouette';
import type { Measurement } from '../src/types';

const NOW = new Date(2026, 10, 10, 12);
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (daysAgo: number) => {
  const d = new Date(2026, 10, 10 - daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const weighIn = (daysAgo: number, weight_kg: number): Measurement => ({
  id: `${daysAgo}`,
  day: dayKey(daysAgo),
  weight_kg,
  created_at: new Date(2026, 10, 10 - daysAgo, 8).toISOString(),
});
/** Weekly weigh-ins over four weeks on an exact line. */
const line = (start: number, perWeek: number) => [28, 21, 14, 7, 0].map((ago) => weighIn(ago, start + (perWeek * (28 - ago)) / 7));

const trendOf = (rows: Measurement[]): Trend => {
  const t = weightTrend(rows, NOW);
  if (!isTrend(t)) throw new Error('expected a trend');
  return t;
};
const input = (trend: Trend, over: Partial<ProjectInput> = {}): ProjectInput => ({
  sex: 'male',
  age: 35,
  height_cm: 178,
  start: { weight_kg: trend.fittedNow_kg, bodyFatPct: 25 },
  trend,
  avgSteps: 6000,
  avgWorkoutKcal: 50,
  extraSteps: 0,
  ...over,
});

describe('weightTrend', () => {
  it('asks for more weigh-ins before drawing a line', () => {
    expect(weightTrend([weighIn(20, 80), weighIn(10, 80), weighIn(0, 80)], NOW)).toEqual({ needWeighIns: 1, needDays: 0 });
    expect(weightTrend([], NOW)).toEqual({ needWeighIns: 4, needDays: 14 });
  });

  it('asks for more days when the weigh-ins are bunched together', () => {
    const rows = [3, 2, 1, 0].map((ago) => weighIn(ago, 80));
    expect(weightTrend(rows, NOW)).toEqual({ needWeighIns: 0, needDays: 11 });
  });

  it('ignores rows without a weight and weigh-ins older than six weeks', () => {
    const rows = [weighIn(60, 99), weighIn(50, 99), { ...weighIn(5, 0), weight_kg: undefined }, weighIn(0, 80)];
    expect(weightTrend(rows, NOW)).toEqual({ needWeighIns: 3, needDays: 14 });
  });

  it('finds an exact slope with no spread', () => {
    const t = trendOf(line(90, -0.5));
    expect(t.slopeKgPerWeek).toBeCloseTo(-0.5, 6);
    expect(t.low).toBeCloseTo(-0.5, 6);
    expect(t.high).toBeCloseTo(-0.5, 6);
    expect(t.fittedNow_kg).toBeCloseTo(88, 6);
    expect(t.n).toBe(5);
    expect(t.spanDays).toBe(28);
  });

  it('gives a wider interval for noisy weigh-ins', () => {
    const noisy = [28, 21, 14, 7, 0].map((ago, k) => weighIn(ago, 80 + (k % 2 ? 0.8 : -0.8)));
    const t = trendOf(noisy);
    expect(t.low).toBeLessThan(0);
    expect(t.high).toBeGreaterThan(0);
  });
});

describe('project', () => {
  it('slows over time instead of running in a straight line', () => {
    const t = trendOf(line(90, -0.5));
    const p = project(input(t));
    expect(p.status).toBe('ok');
    expect(p.central.map((x) => x.weeks)).toEqual([4, 12, 26]);
    const lost = t.fittedNow_kg - p.central[2].weight_kg;
    expect(lost).toBeGreaterThan(0);
    expect(lost).toBeLessThan(13); // 26 weeks at 0.5 kg would be 13
    expect(p.central[0].weight_kg).toBeGreaterThan(p.central[1].weight_kg);
  });

  it('starts at the pace of the trend', () => {
    const t = trendOf(line(90, -0.5));
    const p = project(input(t));
    expect(t.fittedNow_kg - p.central[0].weight_kg).toBeCloseTo(2, 0);
  });

  it('fat and lean always add up to the weight', () => {
    const p = project(input(trendOf(line(90, -0.5))));
    for (const pt of [...p.central, ...p.low, ...p.high]) {
      expect(pt.fatMass_kg + pt.leanMass_kg).toBeCloseTo(pt.weight_kg, 6);
      expect(Number.isFinite(pt.bodyFatPct)).toBe(true);
    }
  });

  it('most of a loss comes from fat, some from lean (Forbes)', () => {
    const t = trendOf(line(90, -0.5));
    const p = project(input(t));
    const startFat = t.fittedNow_kg * 0.25;
    const fatLost = startFat - p.central[2].fatMass_kg;
    const leanLost = t.fittedNow_kg - startFat - p.central[2].leanMass_kg;
    expect(fatLost).toBeGreaterThan(leanLost);
    expect(leanLost).toBeGreaterThan(0);
  });

  it('a flat trend is steady', () => {
    const p = project(input(trendOf(line(80, 0))));
    expect(p.status).toBe('steady');
    expect(p.central[2].weight_kg).toBeCloseTo(80, 6);
  });

  it('a gaining trend projects upward and also slows', () => {
    const t = trendOf(line(80, 0.4));
    const p = project(input(t));
    expect(p.status).toBe('ok');
    const gained = p.central[2].weight_kg - t.fittedNow_kg;
    expect(gained).toBeGreaterThan(0);
    expect(gained).toBeLessThan(0.4 * 26);
  });

  it('refuses to project a pace faster than 1% of body weight a week', () => {
    const p = project(input(trendOf(line(74.8, -1.2))));
    expect(p.status).toBe('too-fast');
  });

  it('never shows a weight under the reference range', () => {
    const t = trendOf(line(62, -0.5));
    const p = project(input(t, { start: { weight_kg: t.fittedNow_kg, bodyFatPct: 12 } }));
    const floor = 18.5 * 1.78 ** 2;
    expect(p.status).toBe('too-fast');
    for (const pt of [...p.central, ...p.low, ...p.high]) expect(pt.weight_kg).toBeGreaterThanOrEqual(floor - 1e-9);
  });

  it('extra steps end lighter than the same pace without them', () => {
    const t = trendOf(line(90, -0.2));
    const base = project(input(t));
    const more = project(input(t, { extraSteps: 3000 }));
    expect(more.central[2].weight_kg).toBeLessThan(base.central[2].weight_kg);
  });

  it('works with no step access', () => {
    const p = project(input(trendOf(line(90, -0.3)), { avgSteps: null }));
    expect(Number.isFinite(p.central[2].weight_kg)).toBe(true);
  });
});

describe('silhouette', () => {
  const now = { sex: 'male' as const, height_cm: 178, neck_cm: 38, waist_cm: 90 };

  it('the inverted Navy formula returns the waist it started from', () => {
    const bf = navyBodyFat(now)!;
    expect(waistAtBodyFat({ ...now, bodyFatPct: bf }).waist_cm).toBeCloseTo(90, 1);

    const woman = { sex: 'female' as const, height_cm: 165, neck_cm: 33, waist_cm: 75, hip_cm: 98 };
    const back = waistAtBodyFat({ ...woman, bodyFatPct: navyBodyFat(woman)! });
    expect(back.waist_cm).toBeCloseTo(75, 1);
    expect(back.hip_cm!).toBeCloseTo(98, 1);
  });

  it('less body fat means a smaller waist', () => {
    const bf = navyBodyFat(now)!;
    expect(waistAtBodyFat({ ...now, bodyFatPct: bf - 5 }).waist_cm).toBeLessThan(90);
  });

  it('a larger waist draws a wider waist, at the same height', () => {
    const box = { width: 160, height: 320 };
    const a = silhouette({ height_cm: 178, neck_cm: 38, waist_cm: 80, hip_cm: estimateHip('male', 80), bodyFatPct: 15 }, box);
    const b = silhouette({ height_cm: 178, neck_cm: 38, waist_cm: 105, hip_cm: estimateHip('male', 105), bodyFatPct: 28 }, box);
    expect(b.rows.waist).toBeGreaterThan(a.rows.waist);
    expect(b.rows.hip).toBeGreaterThan(a.rows.hip);
    expect(a.head.r).toBeCloseTo(b.head.r, 6);
  });

  it('draws a finite outline that fits the box', () => {
    const box = { width: 160, height: 320 };
    const o = silhouette({ height_cm: 150, neck_cm: 45, waist_cm: 160, hip_cm: 170, bodyFatPct: 55 }, box);
    expect(o.path).not.toMatch(/NaN|Infinity|undefined/);
    expect(o.path.startsWith('M')).toBe(true);
    expect(o.arms).toHaveLength(2);
    for (const arm of o.arms) expect(Number.isFinite(arm.x2 + arm.y2 + arm.width)).toBe(true);
  });
});
