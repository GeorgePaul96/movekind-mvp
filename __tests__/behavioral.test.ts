import type { Session, CheckIn, PostRating } from '../src/types';
import type { GapProfile, RhythmStability } from '../src/domain/behavioral/types';
import { computeGapProfile } from '../src/domain/behavioral/gaps';
import { computeRhythm } from '../src/domain/behavioral/rhythm';

const DAY = 86_400_000;
const NOW = new Date('2026-06-18T12:00:00.000Z');
const daysAgo = (n: number): string => new Date(NOW.getTime() - n * DAY).toISOString();

let _id = 0;
const uid = () => `id${_id++}`;

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: uid(), user_id: 'u1', check_in_id: null, state: 'regulated',
    status: 'completed', engine_version: 'v2.3', created_at: daysAgo(0), ...overrides,
  };
}
function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: uid(), user_id: 'u1', energy_score: 3, sleep_quality: 'fair',
    engine_version: 'v2.3', created_at: daysAgo(0), ...overrides,
  };
}
function rating(overrides: Partial<PostRating> = {}): PostRating {
  return { id: uid(), session_id: 's1', rating_delta: 1, notes: null, created_at: daysAgo(0), ...overrides };
}
function gapProfile(o: Partial<GapProfile> = {}): GapProfile {
  return { hasHistory: true, lastGapDays: 2, avgGapDays: 3, gapHistory: [3, 3], trend: 'stable', observation: null, ...o };
}
function rhythmProfile(o: Partial<RhythmStability> = {}): RhythmStability {
  return { weeklyVariance: 0, avgWeeklySessions: 2, trajectory: 'stable', observation: null, ...o };
}

describe('computeGapProfile', () => {
  test('no completed sessions → no history', () => {
    const g = computeGapProfile([], NOW);
    expect(g.hasHistory).toBe(false);
    expect(g.trend).toBe('insufficient_data');
    expect(g.gapHistory).toEqual([]);
  });

  test('computes intervals, average, last gap, and a shrinking trend', () => {
    const sessions = [
      session({ created_at: daysAgo(40) }),
      session({ created_at: daysAgo(30) }),
      session({ created_at: daysAgo(22) }),
      session({ created_at: daysAgo(16) }),
      session({ created_at: daysAgo(12) }),
    ];
    const g = computeGapProfile(sessions, NOW);
    expect(g.hasHistory).toBe(true);
    expect(g.gapHistory).toEqual([10, 8, 6, 4]);
    expect(g.avgGapDays).toBe(7);
    expect(g.lastGapDays).toBe(12);
    expect(g.trend).toBe('shrinking');
  });

  test('ignores abandoned sessions', () => {
    const sessions = [
      session({ created_at: daysAgo(10), status: 'completed' }),
      session({ created_at: daysAgo(5), status: 'abandoned' }),
    ];
    const g = computeGapProfile(sessions, NOW);
    expect(g.gapHistory).toEqual([]); // only one completed session → no intervals
    expect(g.lastGapDays).toBe(10);
  });
});

describe('computeRhythm', () => {
  test('no sessions → insufficient_data', () => {
    const r = computeRhythm([], NOW);
    expect(r.trajectory).toBe('insufficient_data');
    expect(r.avgWeeklySessions).toBe(0);
  });

  test('steady 2/week across 4 weeks → stable, zero variance', () => {
    const sessions = [1, 3, 8, 10, 15, 17, 22, 24].map((d) => session({ created_at: daysAgo(d) }));
    const r = computeRhythm(sessions, NOW);
    expect(r.avgWeeklySessions).toBe(2);
    expect(r.weeklyVariance).toBe(0);
    expect(r.trajectory).toBe('stable');
  });

  test('activity after an empty week → rebuilding', () => {
    const sessions = [1, 20, 22].map((d) => session({ created_at: daysAgo(d) }));
    const r = computeRhythm(sessions, NOW);
    expect(r.trajectory).toBe('rebuilding');
  });
});

// Factories above are reused by later tasks in this file.
export { session, checkIn, rating, gapProfile, rhythmProfile, daysAgo, NOW };
