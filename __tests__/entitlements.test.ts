import {
  hasAccess,
  visibleExercises,
  insightsWindowDays,
  PREMIUM_FEATURES,
  FREE_INSIGHTS_WINDOW_DAYS,
} from '../src/domain/premium/entitlements';
import type { Exercise } from '../src/types';

const ex = (id: string, is_premium?: boolean): Exercise => ({
  id,
  name: `Ex ${id}`,
  category: 'mobilize',
  base_difficulty: 1,
  cues: [],
  illustration_ref: '',
  created_at: '',
  is_premium,
});

describe('entitlements: hasAccess', () => {
  it('grants gated features only to premium users', () => {
    expect(hasAccess('extended_insights', true)).toBe(true);
    expect(hasAccess('extended_insights', false)).toBe(false);
    expect(hasAccess('exercise_packs', true)).toBe(true);
    expect(hasAccess('exercise_packs', false)).toBe(false);
  });

  it('gates exactly the two chosen features and nothing else', () => {
    expect([...PREMIUM_FEATURES].sort()).toEqual(['exercise_packs', 'extended_insights']);
  });
});

describe('entitlements: visibleExercises', () => {
  const lib = [ex('1'), ex('2', true), ex('3'), ex('4', true)];

  it('hides premium-pack exercises from free users', () => {
    const visible = visibleExercises(lib, false);
    expect(visible.map((e) => e.id)).toEqual(['1', '3']);
  });

  it('shows the whole library to premium users', () => {
    expect(visibleExercises(lib, true)).toHaveLength(4);
  });

  it('is a no-op when no exercise is flagged premium (current DB state)', () => {
    const freeOnly = [ex('1'), ex('2'), ex('3')];
    expect(visibleExercises(freeOnly, false)).toHaveLength(3);
  });
});

describe('entitlements: insightsWindowDays', () => {
  it('caps free history and unlocks the full record for premium', () => {
    expect(insightsWindowDays(false)).toBe(FREE_INSIGHTS_WINDOW_DAYS);
    expect(insightsWindowDays(true)).toBe(Infinity);
  });
});
