import {
  computePersonalBests,
  detectPersonalBestEvents,
} from '../src/utils/personalBests';
import type { Activity } from '../src/types';

function mkAct(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a-' + Math.random().toString(36).slice(2),
    user_id: 'u',
    type: 'walk',
    duration_minutes: 30,
    effort: 5,
    moods: [],
    notes: null,
    performed_at: new Date('2025-06-01T10:00:00Z').toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('computePersonalBests', () => {
  it('returns zeros for empty activities', () => {
    const b = computePersonalBests([]);
    expect(b.longestSessionMinutes).toBe(0);
    expect(b.mostSessionsIn7Days).toBe(0);
  });

  it('finds the longest session', () => {
    const acts = [mkAct({ duration_minutes: 30 }), mkAct({ duration_minutes: 60 })];
    expect(computePersonalBests(acts).longestSessionMinutes).toBe(60);
  });

  it('counts max sessions in any rolling 7-day window', () => {
    const base = new Date('2025-06-01T10:00:00Z');
    const acts = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return mkAct({ performed_at: d.toISOString() });
    });
    expect(computePersonalBests(acts).mostSessionsIn7Days).toBe(5);
  });

  it('does not count sessions more than 7 days apart in the same window', () => {
    const acts = [
      mkAct({ performed_at: '2025-06-01T10:00:00Z' }),
      mkAct({ performed_at: '2025-06-09T10:00:00Z' }), // 8 days later
    ];
    expect(computePersonalBests(acts).mostSessionsIn7Days).toBe(1);
  });
});

describe('detectPersonalBestEvents', () => {
  it('returns empty array when there are no existing activities (first session)', () => {
    expect(detectPersonalBestEvents(mkAct({ duration_minutes: 45 }), [])).toHaveLength(0);
  });

  it('detects a new longest session', () => {
    const existing = [mkAct({ duration_minutes: 30 })];
    const events = detectPersonalBestEvents(mkAct({ duration_minutes: 45 }), existing);
    const longest = events.find((e) => e.type === 'longest_session');
    expect(longest).toBeDefined();
    expect(longest!.newValue).toBe(45);
    expect(typeof longest!.message).toBe('string');
  });

  it('does not fire when new session is shorter than existing best', () => {
    const existing = [mkAct({ duration_minutes: 60 })];
    const events = detectPersonalBestEvents(mkAct({ duration_minutes: 30 }), existing);
    const longest = events.find((e) => e.type === 'longest_session');
    expect(longest).toBeUndefined();
  });

  it('does not fire when new session exactly equals existing best', () => {
    const existing = [mkAct({ duration_minutes: 30 })];
    const events = detectPersonalBestEvents(mkAct({ duration_minutes: 30 }), existing);
    const longest = events.find((e) => e.type === 'longest_session');
    expect(longest).toBeUndefined();
  });

  it('detects most sessions in 7 days', () => {
    const base = new Date('2025-06-01T10:00:00Z');
    const existing = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return mkAct({ performed_at: d.toISOString() });
    });
    const newAct = mkAct({ performed_at: new Date('2025-06-04T10:00:00Z').toISOString() });
    const events = detectPersonalBestEvents(newAct, existing);
    const weekEvent = events.find((e) => e.type === 'most_weekly_sessions');
    expect(weekEvent).toBeDefined();
    expect(weekEvent!.newValue).toBe(4);
  });

  it('fires most_weekly_sessions when going from 1 to 2 sessions in a week', () => {
    const base = new Date('2025-06-01T10:00:00Z');
    const existing = [mkAct({ performed_at: base.toISOString() })];
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    const newAct = mkAct({ performed_at: d.toISOString() });
    const events = detectPersonalBestEvents(newAct, existing);
    const weekEvent = events.find((e) => e.type === 'most_weekly_sessions');
    expect(weekEvent).toBeDefined();
    expect(weekEvent!.newValue).toBe(2);
  });
});
