import { untendedToday } from '../src/domain/park/tending';
import type { GardenInput } from '../src/domain/garden/garden';

const NOW = new Date(2026, 9, 27, 12);
const at = (day: number, h = 9, m = 0) => new Date(2026, 9, day, h, m).toISOString();
const empty: GardenInput = { checkIns: [], water: [], workouts: [], stepsToday: null };

describe('untendedToday', () => {
  it('a fresh day needs everything', () => {
    expect([...untendedToday(empty, NOW)].sort()).toEqual(['flowerbed', 'river', 'tree']);
  });

  it('logging water stops the river shimmering', () => {
    const u = untendedToday({ ...empty, water: [{ created_at: at(27) }] }, NOW);
    expect(u.has('river')).toBe(false);
    expect(u.has('tree')).toBe(true);
  });

  it('a workout tends the tree and a check-in tends the flowerbed', () => {
    const u = untendedToday(
      { ...empty, workouts: [{ minutes: 20, created_at: at(27) }], checkIns: [{ energy_score: 4, created_at: at(27) }] },
      NOW,
    );
    expect(u.has('tree')).toBe(false);
    expect(u.has('flowerbed')).toBe(false);
  });

  it('untended resets at local midnight', () => {
    const u = untendedToday({ ...empty, water: [{ created_at: at(26, 23, 59) }] }, NOW);
    expect(u.has('river')).toBe(true);
  });

  it('hammock only joins once sleep exists', () => {
    expect(untendedToday(empty, NOW).has('hammock')).toBe(false);
    expect(untendedToday({ ...empty, sleep: [] }, NOW).has('hammock')).toBe(true);
    expect(untendedToday({ ...empty, sleep: [{ day: '2026-10-27' }] }, NOW).has('hammock')).toBe(false);
  });
});
