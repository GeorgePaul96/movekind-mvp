import {
  clampScore,
  consistencyScore,
  strengthScore,
  enduranceScore,
  recoveryScore,
  overallScore,
  computeScores,
  weeklyMinutes,
  percentChange,
} from '../src/utils/analytics';
import type { Activity, Reflection } from '../src/types';

const FIXED_NOW = new Date('2025-06-04T10:00:00Z'); // Wednesday

function mkActivity(part: Partial<Activity>): Activity {
  return {
    id: part.id ?? 'a-' + Math.random().toString(36).slice(2),
    user_id: 'u',
    type: part.type ?? 'walk',
    duration_minutes: part.duration_minutes ?? 30,
    effort: part.effort ?? 5,
    moods: part.moods ?? [],
    notes: part.notes ?? null,
    performed_at: part.performed_at ?? new Date('2025-06-03T10:00:00Z').toISOString(),
    created_at: part.created_at ?? new Date().toISOString(),
  };
}

const mkReflection = (p: Partial<Reflection>): Reflection => ({
  id: 'r',
  user_id: 'u',
  week_start: '2025-06-02',
  energy: p.energy ?? 6,
  recovery: p.recovery ?? 6,
  consistency: p.consistency ?? 6,
  mood: p.mood ?? 6,
  notes: null,
  created_at: new Date().toISOString(),
});

describe('clampScore', () => {
  it('clamps NaN to 0', () => expect(clampScore(NaN)).toBe(0));
  it('clamps negatives to 0', () => expect(clampScore(-3)).toBe(0));
  it('clamps over 100 to 100', () => expect(clampScore(140)).toBe(100));
  it('rounds correctly', () => expect(clampScore(72.6)).toBe(73));
});

describe('consistencyScore', () => {
  it('returns 0 with no activities', () => {
    expect(consistencyScore([], null, 4, FIXED_NOW)).toBe(0);
  });

  it('scales with unique days up to the target', () => {
    const acts = [
      mkActivity({ performed_at: '2025-06-02T08:00:00Z' }), // Mon
      mkActivity({ performed_at: '2025-06-03T08:00:00Z' }), // Tue
    ];
    const score = consistencyScore(acts, null, 4, FIXED_NOW);
    // 2 of 4 sessions = 50%
    expect(score).toBe(50);
  });

  it('blends reflection consistency (70/30)', () => {
    const acts = Array.from({ length: 4 }, (_, i) =>
      mkActivity({ performed_at: new Date(2025, 5, 2 + i, 8).toISOString() }),
    );
    const score = consistencyScore(
      acts,
      mkReflection({ consistency: 5 }),
      4,
      FIXED_NOW,
    );
    // 100 * 0.7 + 50 * 0.3 = 85
    expect(score).toBe(85);
  });
});

describe('strengthScore', () => {
  it('is 0 when no strength activities', () => {
    expect(
      strengthScore(
        [mkActivity({ type: 'walk', performed_at: '2025-06-03T08:00:00Z' })],
        FIXED_NOW,
      ),
    ).toBe(0);
  });

  it('rewards minutes plus effort', () => {
    const acts = [
      mkActivity({
        type: 'weights',
        duration_minutes: 45,
        effort: 8,
        performed_at: '2025-06-03T08:00:00Z',
      }),
      mkActivity({
        type: 'weights',
        duration_minutes: 45,
        effort: 8,
        performed_at: '2025-06-04T08:00:00Z',
      }),
    ];
    expect(strengthScore(acts, FIXED_NOW)).toBeGreaterThanOrEqual(85);
  });
});

describe('enduranceScore', () => {
  it('credits cardio types', () => {
    const acts = [
      mkActivity({
        type: 'run',
        duration_minutes: 40,
        effort: 7,
        performed_at: '2025-06-03T08:00:00Z',
      }),
    ];
    expect(enduranceScore(acts, FIXED_NOW)).toBeGreaterThan(0);
  });
});

describe('recoveryScore', () => {
  it('rewards easy days and reflection recovery', () => {
    const acts = [
      mkActivity({
        type: 'yoga',
        duration_minutes: 30,
        effort: 2,
        performed_at: '2025-06-03T08:00:00Z',
      }),
    ];
    const score = recoveryScore(
      acts,
      mkReflection({ recovery: 8 }),
      FIXED_NOW,
    );
    expect(score).toBeGreaterThan(60);
  });
});

describe('overallScore', () => {
  it('weights consistency highest', () => {
    const a = overallScore({
      consistency: 100,
      strength: 0,
      endurance: 0,
      recovery: 0,
    });
    const b = overallScore({
      consistency: 0,
      strength: 100,
      endurance: 100,
      recovery: 100,
    });
    expect(a).toBeGreaterThan(b * 0.6); // consistency carries a lot
  });
});

describe('computeScores', () => {
  it('returns all five fields and overall consistent with parts', () => {
    const acts = [
      mkActivity({ type: 'walk', performed_at: '2025-06-02T08:00:00Z', duration_minutes: 30, effort: 4 }),
      mkActivity({ type: 'weights', performed_at: '2025-06-03T08:00:00Z', duration_minutes: 40, effort: 7 }),
      mkActivity({ type: 'run', performed_at: '2025-06-04T08:00:00Z', duration_minutes: 30, effort: 6 }),
    ];
    const s = computeScores(acts, mkReflection({}), 4, FIXED_NOW);
    expect(typeof s.consistency).toBe('number');
    expect(typeof s.strength).toBe('number');
    expect(typeof s.endurance).toBe('number');
    expect(typeof s.recovery).toBe('number');
    expect(typeof s.overall).toBe('number');
    expect(s.overall).toBeGreaterThan(0);
  });
});

describe('weeklyMinutes', () => {
  it('returns one entry per week', () => {
    const acts = [
      mkActivity({ performed_at: '2025-06-03T08:00:00Z', duration_minutes: 30 }),
      mkActivity({ performed_at: '2025-05-27T08:00:00Z', duration_minutes: 45 }),
    ];
    const data = weeklyMinutes(acts, 4, FIXED_NOW);
    expect(data).toHaveLength(4);
    expect(data[data.length - 1]!.minutes).toBeGreaterThanOrEqual(30);
  });
});

describe('percentChange', () => {
  it('handles empty', () => expect(percentChange([])).toBe(0));
  it('handles zero baseline', () => expect(percentChange([0, 10])).toBe(100));
  it('computes increase', () => expect(percentChange([50, 75])).toBe(50));
  it('computes decrease', () => expect(percentChange([100, 90])).toBe(-10));
});
