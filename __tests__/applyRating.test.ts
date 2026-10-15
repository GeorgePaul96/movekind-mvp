import { applyRating } from '../src/domain/sessions/applyRating';

const NOW = new Date('2026-10-15T10:00:00.000Z');

describe('applyRating (port of sync_user_exercise_stats)', () => {
  it('creates a stat for a first-time exercise', () => {
    const out = applyRating([], ['a'], 2, NOW, 'u');
    expect(out).toEqual([
      expect.objectContaining({
        user_id: 'u',
        exercise_id: 'a',
        times_completed: 1,
        average_energy_delta: 2,
        last_completed_at: NOW.toISOString(),
      }),
    ]);
  });

  it('updates a running average for a known exercise', () => {
    const first = applyRating([], ['a'], 2, NOW, 'u');
    const second = applyRating(first, ['a'], -1, NOW, 'u');
    expect(second[0]).toMatchObject({ times_completed: 2, average_energy_delta: 0.5 });
  });

  it('handles several exercises and leaves others alone', () => {
    const base = applyRating([], ['a', 'b'], 1, NOW, 'u');
    const out = applyRating(base, ['b'], 3, NOW, 'u');
    expect(out.find((s) => s.exercise_id === 'a')).toMatchObject({ times_completed: 1, average_energy_delta: 1 });
    expect(out.find((s) => s.exercise_id === 'b')).toMatchObject({ times_completed: 2, average_energy_delta: 2 });
  });

  it('does not mutate its input', () => {
    const base = applyRating([], ['a'], 1, NOW, 'u');
    const snapshot = JSON.stringify(base);
    applyRating(base, ['a'], 2, NOW, 'u');
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it('counts a repeated exercise in one session once per occurrence, like the trigger loop', () => {
    const out = applyRating([], ['a', 'a'], 2, NOW, 'u');
    expect(out[0]).toMatchObject({ times_completed: 2, average_energy_delta: 2 });
  });
});
