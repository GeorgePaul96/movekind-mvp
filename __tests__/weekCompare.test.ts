import { compareWeeks, weekBounds, isSameLocalDay } from '../src/domain/insights/weekCompare';

// Thursday 2026-10-08 15:00 local. This week = Mon 10-05 .. Sun 10-11.
const NOW = new Date(2026, 9, 8, 15, 0, 0);
const at = (d: number, h = 9, m = 0) => new Date(2026, 9, d, h, m).toISOString();

describe('weekBounds', () => {
  it('starts weeks on local Monday midnight', () => {
    const { lastStart, thisStart, nextStart } = weekBounds(NOW);
    expect(thisStart).toEqual(new Date(2026, 9, 5));
    expect(lastStart).toEqual(new Date(2026, 8, 28));
    expect(nextStart).toEqual(new Date(2026, 9, 12));
  });

  it('treats Sunday as the end of the week, not the start', () => {
    expect(weekBounds(new Date(2026, 9, 11, 22)).thisStart).toEqual(new Date(2026, 9, 5));
  });
});

describe('compareWeeks', () => {
  it('counts each day once even with several check-ins', () => {
    const r = compareWeeks([
      { energy_score: 2, created_at: at(6, 8) },
      { energy_score: 4, created_at: at(6, 20) },
      { energy_score: 1, created_at: at(7) },
    ], [], NOW);
    expect(r.thisWeek.days).toBe(2);
  });

  it("colors a day by that day's latest check-in", () => {
    const r = compareWeeks([
      { energy_score: 4, created_at: at(6, 20) },
      { energy_score: 2, created_at: at(6, 8) },
    ], [], NOW);
    expect(r.daily).toEqual([null, 'regulated', null, null, null, null, null]);
  });

  it('splits this week from last week and ignores older data', () => {
    const r = compareWeeks([
      { energy_score: 3, created_at: at(5) },
      { energy_score: 3, created_at: new Date(2026, 9, 4, 23, 59).toISOString() },
      { energy_score: 3, created_at: new Date(2026, 8, 28, 0, 0).toISOString() },
      { energy_score: 3, created_at: new Date(2026, 8, 27, 12).toISOString() },
    ], [], NOW);
    expect(r.thisWeek.days).toBe(1);
    expect(r.lastWeek.days).toBe(2);
  });

  it('sums minutes only from completed sessions, rounded per week', () => {
    const r = compareWeeks([], [
      { created_at: at(6), status: 'completed', seconds: 300 },
      { created_at: at(7), status: 'completed', seconds: 150 },
      { created_at: at(7), status: 'abandoned', seconds: 600 },
      { created_at: new Date(2026, 9, 1, 9).toISOString(), status: 'completed', seconds: 90 },
    ], NOW);
    expect(r.thisWeek.minutes).toBe(8); // 450s = 7.5 → 8
    expect(r.lastWeek.minutes).toBe(2); // 90s = 1.5 → 2
  });

  it('handles an empty history', () => {
    expect(compareWeeks([], [], NOW)).toEqual({
      thisWeek: { days: 0, minutes: 0 },
      lastWeek: { days: 0, minutes: 0 },
      daily: [null, null, null, null, null, null, null],
    });
  });
});

describe('isSameLocalDay', () => {
  it('compares calendar days in local time', () => {
    expect(isSameLocalDay(new Date(2026, 9, 8, 0, 1), new Date(2026, 9, 8, 23, 59))).toBe(true);
    expect(isSameLocalDay(new Date(2026, 9, 8, 23, 59), new Date(2026, 9, 9, 0, 1))).toBe(false);
  });
});
