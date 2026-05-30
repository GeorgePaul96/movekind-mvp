import { format, startOfWeek } from 'date-fns';
import type { Activity, Reflection } from '../src/types';
import type { Intention } from '../src/services/intentions';
import type { GapProfile, RhythmStability, ReturnReliability } from '../src/utils/behavioralProfile';
import {
  computeGapProfile,
  computeRhythmStability,
  computeRecoveryState,
  computeReturnReliability,
  detectBehavioralMoments,
  computeBehavioralProfile,
  GAP_DEFINITION_DAYS,
} from '../src/utils/behavioralProfile';

const NOW = new Date('2026-06-15T10:00:00Z');
const WEEK_OPTS = { weekStartsOn: 1 as const };

function act(daysAgo: number, overrides: Partial<Activity> = {}): Activity {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `a-${daysAgo}-${Math.random().toString(36).slice(2)}`,
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

function ref(weeksAgo: number, overrides: Partial<Reflection> = {}): Reflection {
  const d = new Date(NOW);
  d.setDate(d.getDate() - weeksAgo * 7);
  const monday = startOfWeek(d, WEEK_OPTS);
  return {
    id: `r-${weeksAgo}-${Math.random().toString(36).slice(2)}`,
    user_id: 'u',
    week_start: format(monday, 'yyyy-MM-dd'),
    energy: 6,
    recovery: 6,
    consistency: 6,
    mood: 6,
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function int(
  weeksAgo: number,
  met: boolean | null,
  description = 'walk on tuesday',
): Intention {
  const d = new Date(NOW);
  d.setDate(d.getDate() - weeksAgo * 7);
  const monday = startOfWeek(d, WEEK_OPTS);
  return {
    id: `i-${weeksAgo}-${Math.random().toString(36).slice(2)}`,
    user_id: 'u',
    week_start: format(monday, 'yyyy-MM-dd'),
    description,
    intended_day: null,
    intended_time: null,
    met,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('behavioralProfile stubs compile', () => {
  it('throws on all stubs', () => {
    expect(() => computeRhythmStability([], NOW)).toThrow('not implemented');
    expect(() => computeBehavioralProfile([], [], [], NOW)).toThrow('not implemented');
  });
});

describe('computeGapProfile', () => {
  it('returns empty profile with no activities', () => {
    const p = computeGapProfile([], NOW);
    expect(p.hasHistory).toBe(false);
    expect(p.lastGapDays).toBe(0);
    expect(p.avgGapDays).toBe(0);
    expect(p.gapHistory).toEqual([]);
    expect(p.totalGapCount).toBe(0);
    expect(p.longestGapDays).toBe(0);
    expect(p.trend).toBe('insufficient_data');
    expect(p.observation).toBeNull();
    expect(p.confidence).toBe('low');
  });

  it('returns hasHistory=true with one activity and no gaps', () => {
    const p = computeGapProfile([act(1)], NOW);
    expect(p.hasHistory).toBe(true);
    expect(p.lastGapDays).toBe(1);
    expect(p.totalGapCount).toBe(0);
    expect(p.trend).toBe('insufficient_data');
  });

  it('detects a single completed gap', () => {
    // Activity 2 days ago and 20 days ago → gap of 18 days
    const activities = [act(2), act(20)];
    const p = computeGapProfile(activities, NOW);
    expect(p.totalGapCount).toBe(1);
    expect(p.gapHistory).toHaveLength(1);
    expect(p.gapHistory[0]).toBe(18);
    expect(p.longestGapDays).toBe(18);
    expect(p.avgGapDays).toBe(18);
    expect(p.confidence).toBe('low');
  });

  it('does not count short breaks as gaps', () => {
    const activities = [act(1), act(2), act(3)];
    const p = computeGapProfile(activities, NOW);
    expect(p.totalGapCount).toBe(0);
    expect(p.gapHistory).toHaveLength(0);
  });

  it('computes trend as shrinking when last gap < avg * 0.8', () => {
    const activities = [
      act(1),   // most recent
      act(9),   // gap of 8 days
      act(25),  // gap of 16 days
      act(43),  // gap of 18 days
      act(63),  // gap of 20 days
    ];
    const p = computeGapProfile(activities, NOW);
    // gaps: [20, 18, 16, 8], avg = 15.5, last = 8, 8 < 15.5 * 0.8 = 12.4 → shrinking
    expect(p.trend).toBe('shrinking');
    expect(p.confidence).toBe('medium'); // 4 gaps → medium
  });

  it('computes trend as growing when last gap > avg * 1.2', () => {
    const activities = [
      act(1),
      act(31),  // gap of 30 days
      act(36),  // gap of 5
      act(41),  // gap of 5
      act(46),  // gap of 5
    ];
    const p = computeGapProfile(activities, NOW);
    // gaps: [5, 5, 5, 30], avg = 11.25, last = 30, 30 > 11.25 * 1.2 = 13.5 → growing
    expect(p.trend).toBe('growing');
  });

  it('computes trend as stable when last gap is near average', () => {
    const activities = [
      act(1),
      act(12),  // gap 11
      act(22),  // gap 10
      act(32),  // gap 10
      act(42),  // gap 10
    ];
    const p = computeGapProfile(activities, NOW);
    expect(p.trend).toBe('stable');
  });

  it('fires observation only when trend is shrinking and last gap < avg * 0.8', () => {
    const activities = [act(1), act(9), act(25), act(43), act(63)];
    const p = computeGapProfile(activities, NOW);
    expect(p.observation).not.toBeNull();
    expect(p.observation).toContain('days');
  });

  it('does not fire observation when trend is growing', () => {
    const activities = [act(1), act(31), act(36), act(41), act(46)];
    const p = computeGapProfile(activities, NOW);
    expect(p.observation).toBeNull();
  });

  it('returns high confidence with 5+ completed gaps', () => {
    const activities = [
      act(1), act(10), act(20), act(30), act(40), act(50), act(60),
    ];
    const p = computeGapProfile(activities, NOW);
    expect(p.confidence).toBe('high');
  });

  it('retains only the last GAP_HISTORY_SIZE gaps in gapHistory but counts all in totalGapCount', () => {
    const activities = [
      act(1), act(10), act(20), act(30), act(40), act(50), act(60), act(70),
    ];
    const p = computeGapProfile(activities, NOW);
    expect(p.gapHistory.length).toBeLessThanOrEqual(5);
    expect(p.totalGapCount).toBeGreaterThan(5);
  });
});
