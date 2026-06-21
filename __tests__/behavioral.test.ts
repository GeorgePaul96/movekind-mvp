import type { Session, CheckIn, PostRating } from '../src/types';
import type { GapProfile, RhythmStability } from '../src/domain/behavioral/types';
import { computeGapProfile } from '../src/domain/behavioral/gaps';
import { computeRhythm } from '../src/domain/behavioral/rhythm';
import { computeRecovery } from '../src/domain/behavioral/recovery';
import { detectWins } from '../src/domain/behavioral/wins';
import { computeBehavioralProfile } from '../src/domain/behavioral';
import { computeFollowThrough } from '../src/domain/behavioral/followThrough';

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
  return { weeklyVariance: 0, avgWeeklySessions: 2, weeklyCounts: [], trajectory: 'stable', observation: null, ...o };
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

  test('exposes weeklyCounts series (oldest → newest)', () => {
    expect(computeRhythm([], NOW).weeklyCounts).toEqual([]);
    const sessions = [1, 3, 8, 10, 15, 17, 22, 24].map((d) => session({ created_at: daysAgo(d) }));
    expect(computeRhythm(sessions, NOW).weeklyCounts).toEqual([2, 2, 2, 2]);
  });
});

describe('computeRecovery', () => {
  test('long gap + low energy → collapse', () => {
    const r = computeRecovery([], [checkIn({ energy_score: 1 })], [], gapProfile({ lastGapDays: 12 }), rhythmProfile());
    expect(r.isMotivationalCollapse).toBe(true);
    expect(r.signal).toBe('collapse');
  });

  test('two consecutive abandons + gap > 7 → spiral', () => {
    const sessions = [
      session({ created_at: daysAgo(2), status: 'abandoned' }),
      session({ created_at: daysAgo(4), status: 'abandoned' }),
      session({ created_at: daysAgo(20), status: 'completed' }),
    ];
    const r = computeRecovery(sessions, [checkIn({ energy_score: 3 })], [], gapProfile({ lastGapDays: 8 }), rhythmProfile());
    expect(r.isAvoidanceSpiral).toBe(true);
    expect(r.signal).toBe('spiral');
  });

  test('no history → returning', () => {
    const r = computeRecovery([], [], [], gapProfile({ hasHistory: false }), rhythmProfile({ trajectory: 'insufficient_data' }));
    expect(r.signal).toBe('returning');
  });

  test('steady rhythm + positive ratings → thriving', () => {
    const r = computeRecovery(
      [], [checkIn({ energy_score: 4, sleep_quality: 'good' })], [rating({ rating_delta: 2 }), rating({ rating_delta: 1 })],
      gapProfile({ lastGapDays: 3, trend: 'stable' }),
      rhythmProfile({ trajectory: 'stable', avgWeeklySessions: 3 }),
    );
    expect(r.signal).toBe('thriving');
    expect(r.reEntryReadiness).toBe('high');
  });

  test('repeated low energy + fragmenting → burnout_risk', () => {
    const lows = [checkIn({ energy_score: 2 }), checkIn({ energy_score: 1 }), checkIn({ energy_score: 2 })];
    const r = computeRecovery([], lows, [], gapProfile({ lastGapDays: 4 }), rhythmProfile({ trajectory: 'fragmenting' }));
    expect(r.isBurnoutRisk).toBe(true);
    expect(r.signal).toBe('burnout_risk');
  });
});

describe('detectWins', () => {
  test('most recent gap below average → faster_return', () => {
    const wins = detectWins(
      [session({ created_at: daysAgo(1) })],
      gapProfile({ avgGapDays: 7, gapHistory: [9, 8, 4] }),
      rhythmProfile({ trajectory: 'fragmenting' }),
      NOW,
    );
    expect(wins.some((w) => w.type === 'faster_return')).toBe(true);
  });

  test('completed an overloaded session recently → difficult_week_log', () => {
    const wins = detectWins(
      [session({ created_at: daysAgo(3), state: 'overloaded', status: 'completed' })],
      gapProfile({ trend: 'stable' }),
      rhythmProfile({ trajectory: 'fragmenting' }),
      NOW,
    );
    expect(wins.some((w) => w.type === 'difficult_week_log')).toBe(true);
  });

  test('caps at 3 wins, most recent first', () => {
    const wins = detectWins(
      [session({ created_at: daysAgo(2), state: 'overloaded' })],
      gapProfile({ avgGapDays: 7, gapHistory: [9, 4], trend: 'shrinking' }),
      rhythmProfile({ trajectory: 'stabilizing' }),
      NOW,
    );
    expect(wins.length).toBeLessThanOrEqual(3);
  });

  test('no signals → no wins', () => {
    const wins = detectWins([], gapProfile({ hasHistory: false, gapHistory: [], avgGapDays: 0, trend: 'insufficient_data' }), rhythmProfile({ trajectory: 'fragmenting' }), NOW);
    expect(wins).toEqual([]);
  });

  test('orders wins most-recent-first by underlying event date', () => {
    const sessions = [
      session({ created_at: daysAgo(10), state: 'overloaded', status: 'completed' }),
      session({ created_at: daysAgo(1), state: 'regulated', status: 'completed' }),
    ];
    const wins = detectWins(
      sessions,
      gapProfile({ avgGapDays: 7, gapHistory: [9, 4], trend: 'shrinking' }),
      rhythmProfile({ trajectory: 'fragmenting' }),
      NOW,
    );
    const types = wins.map((w) => w.type);
    // difficult_week_log's event (daysAgo 10) is older than the gap-based wins,
    // which are keyed to the most recent completed session (daysAgo 1), so it sorts last.
    expect(types.indexOf('difficult_week_log')).toBe(types.length - 1);
    expect(types[0]).not.toBe('difficult_week_log');
  });
});

describe('computeFollowThrough', () => {
  test('no terminal sessions → no history', () => {
    const ft = computeFollowThrough([]);
    expect(ft.hasHistory).toBe(false);
    expect(ft.total).toBe(0);
    expect(ft.completionRate).toBe(0);
    expect(ft.trend).toBe('insufficient_data');
    expect(ft.observation).toBeNull();
  });

  test('counts only terminal sessions and computes the rate', () => {
    const sessions = [
      session({ created_at: daysAgo(20), status: 'completed' }),
      session({ created_at: daysAgo(16), status: 'completed' }),
      session({ created_at: daysAgo(12), status: 'completed' }),
      session({ created_at: daysAgo(8), status: 'completed' }),
      session({ created_at: daysAgo(4), status: 'abandoned' }),
      session({ created_at: daysAgo(2), status: 'generated' }), // non-terminal → ignored
    ];
    const ft = computeFollowThrough(sessions);
    expect(ft.completed).toBe(4);
    expect(ft.abandoned).toBe(1);
    expect(ft.total).toBe(5);
    expect(ft.completionRate).toBe(0.8);
    expect(ft.hasHistory).toBe(true);
    expect(ft.observation).toContain('80%');
  });

  test('improving completion over time → building trend', () => {
    const sessions = [
      session({ created_at: daysAgo(30), status: 'abandoned' }),
      session({ created_at: daysAgo(28), status: 'abandoned' }),
      session({ created_at: daysAgo(26), status: 'abandoned' }),
      session({ created_at: daysAgo(6), status: 'completed' }),
      session({ created_at: daysAgo(4), status: 'completed' }),
      session({ created_at: daysAgo(2), status: 'completed' }),
    ];
    const ft = computeFollowThrough(sessions);
    expect(ft.trend).toBe('building');
    expect(ft.observation).toContain('climbing');
  });
});

describe('computeBehavioralProfile', () => {
  test('assembles all five sub-profiles', () => {
    const sessions = [1, 8, 15, 22].map((d) => session({ created_at: daysAgo(d) }));
    const profile = computeBehavioralProfile(sessions, [checkIn()], [rating()], NOW);
    expect(profile).toHaveProperty('gaps');
    expect(profile).toHaveProperty('rhythm');
    expect(profile).toHaveProperty('recovery');
    expect(Array.isArray(profile.wins)).toBe(true);
    expect(profile.wins.length).toBeLessThanOrEqual(3);
    expect(profile).toHaveProperty('followThrough');
  });

  test('empty inputs never throw and report no history', () => {
    const profile = computeBehavioralProfile([], [], [], NOW);
    expect(profile.gaps.hasHistory).toBe(false);
    expect(profile.recovery.signal).toBe('returning');
    expect(profile.wins).toEqual([]);
    expect(profile.followThrough.hasHistory).toBe(false);
  });
});

// Factories above are reused by later tasks in this file.
export { session, checkIn, rating, gapProfile, rhythmProfile, daysAgo, NOW };
