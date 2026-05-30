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
    expect(() => computeGapProfile([], NOW)).toThrow('not implemented');
    expect(() => computeRhythmStability([], NOW)).toThrow('not implemented');
    expect(() => computeBehavioralProfile([], [], [], NOW)).toThrow('not implemented');
  });
});
