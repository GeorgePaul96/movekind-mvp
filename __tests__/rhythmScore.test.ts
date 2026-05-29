import { computeRhythmScore, weeklySessionCounts } from '../src/utils/rhythmScore';
import type { Activity } from '../src/types';

const FIXED_NOW = new Date('2025-06-04T10:00:00Z'); // Wednesday

function mkAct(daysAgo: number, overrides: Partial<Activity> = {}): Activity {
  const d = new Date(FIXED_NOW);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: 'a-' + Math.random().toString(36).slice(2),
    user_id: 'u',
    type: 'walk',
    duration_minutes: 30,
    effort: 5,
    moods: [],
    notes: null,
    performed_at: d.toISOString(),
    created_at: d.toISOString(),
    ...overrides,
  };
}

describe('computeRhythmScore', () => {
  it('returns 0 active days and Finding Your Way for empty activities', () => {
    const r = computeRhythmScore([], FIXED_NOW);
    expect(r.percentage).toBe(0);
    expect(r.activeDays).toBe(0);
    expect(r.label).toBe('Finding Your Way');
  });

  it('counts unique active days in the 28-day window', () => {
    const acts = Array.from({ length: 7 }, (_, i) => mkAct(i));
    const r = computeRhythmScore(acts, FIXED_NOW);
    expect(r.activeDays).toBe(7);
    expect(r.percentage).toBe(25); // 7/28 * 100 = 25
  });

  it('excludes activities older than 28 days', () => {
    const acts = [mkAct(29), mkAct(1)];
    expect(computeRhythmScore(acts, FIXED_NOW).activeDays).toBe(1);
  });

  it('counts each calendar day only once regardless of session count', () => {
    const d = new Date(FIXED_NOW);
    d.setDate(d.getDate() - 1);
    const ts = d.toISOString();
    const acts = [mkAct(0, { performed_at: ts }), mkAct(0, { performed_at: ts })];
    expect(computeRhythmScore(acts, FIXED_NOW).activeDays).toBe(1);
  });

  it('labels 25+ active days as Deep Rhythm', () => {
    const acts = Array.from({ length: 25 }, (_, i) => mkAct(i));
    expect(computeRhythmScore(acts, FIXED_NOW).label).toBe('Deep Rhythm');
  });

  it('labels 17–22 active days as Steady Rhythm', () => {
    const acts = Array.from({ length: 18 }, (_, i) => mkAct(i));
    expect(computeRhythmScore(acts, FIXED_NOW).label).toBe('Steady Rhythm');
  });

  it('labels 12–16 active days as Growing Consistency', () => {
    const acts = Array.from({ length: 13 }, (_, i) => mkAct(i));
    expect(computeRhythmScore(acts, FIXED_NOW).label).toBe('Growing Consistency');
  });
});

describe('weeklySessionCounts', () => {
  it('returns exactly N entries', () => {
    expect(weeklySessionCounts([], 12, FIXED_NOW)).toHaveLength(12);
  });

  it('marks only the last entry as current', () => {
    const weeks = weeklySessionCounts([], 12, FIXED_NOW);
    const currentCount = weeks.filter((w) => w.isCurrent).length;
    expect(currentCount).toBe(1);
    expect(weeks[11]!.isCurrent).toBe(true);
  });

  it('counts sessions correctly in a known week', () => {
    // Monday of the current week = 2025-06-02 (FIXED_NOW is Wed Jun 4)
    const acts = [
      mkAct(2),  // Jun 2 — this week
      mkAct(1),  // Jun 3 — this week
      mkAct(0),  // Jun 4 — this week
    ];
    const weeks = weeklySessionCounts(acts, 4, FIXED_NOW);
    expect(weeks[3]!.sessions).toBe(3);
  });
});
