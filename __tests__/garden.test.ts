import { gardenState, type GardenInput } from '../src/domain/garden/garden';
import { localDayKey } from '../src/domain/garden/days';

// Local-time dates so day boundaries are the phone's, not UTC.
const at = (day: number, h = 12, m = 0) => new Date(2026, 9, day, h, m).toISOString();
const NOW = new Date(2026, 9, 20, 12, 0);

const empty: GardenInput = { checkIns: [], water: [], workouts: [], stepsToday: null };
const glasses = (n: number, day = 20) => Array.from({ length: n }, (_, i) => ({ created_at: at(day, 8, i) }));

describe('gardenState', () => {
  it('empty input is a calm sprout garden', () => {
    expect(gardenState(empty, NOW)).toEqual({
      stream: 0, ducks: false, grass: 1, tree: 0, birds: false, flowers: [], resting: true,
    });
  });

  it('one glass makes the stream visibly fuller', () => {
    expect(gardenState({ ...empty, water: glasses(1) }, NOW).stream).toBe(1);
  });

  it('three glasses bring ducks', () => {
    const g = gardenState({ ...empty, water: glasses(3) }, NOW);
    expect(g.stream).toBe(2);
    expect(g.ducks).toBe(true);
  });

  it('nine glasses cap at 4', () => {
    expect(gardenState({ ...empty, water: glasses(9) }, NOW).stream).toBe(4);
  });

  it('resets at local midnight', () => {
    const late = [0, 1, 2].map((i) => ({ created_at: new Date(2026, 9, 19, 23, 57 + i).toISOString() }));
    expect(gardenState({ ...empty, water: late }, new Date(2026, 9, 20, 0, 1)).stream).toBe(0);
  });

  it('the first workout grows the tree', () => {
    const g = gardenState({ ...empty, workouts: [{ minutes: 10, created_at: at(20) }] }, NOW);
    expect(g.tree).toBe(1);
  });

  it('tree never shrinks over time', () => {
    const input = { ...empty, workouts: [{ minutes: 200, created_at: at(1) }] };
    const later = new Date(2026, 11, 20, 12);
    expect(gardenState(input, later).tree).toBe(gardenState(input, NOW).tree);
  });

  it('birds arrive at 180 minutes', () => {
    const w = (minutes: number) => ({ ...empty, workouts: [{ minutes, created_at: at(20) }] });
    expect(gardenState(w(179), NOW).birds).toBe(false);
    const g = gardenState(w(180), NOW);
    expect(g.tree).toBe(3);
    expect(g.birds).toBe(true);
  });

  it('steps unknown keeps grass calm, never below 1', () => {
    expect(gardenState({ ...empty, stepsToday: null }, NOW).grass).toBe(1);
    expect(gardenState({ ...empty, stepsToday: 0 }, NOW).grass).toBe(1);
    expect(gardenState({ ...empty, stepsToday: 3000 }, NOW).grass).toBe(2);
    expect(gardenState({ ...empty, stepsToday: 8000 }, NOW).grass).toBe(4);
  });

  it('one flower per day, latest mood wins', () => {
    const checkIns = [
      { energy_score: 1, created_at: at(20, 8) },
      { energy_score: 5, created_at: at(20, 10) },
    ];
    expect(gardenState({ ...empty, checkIns }, NOW).flowers).toEqual([
      { day: localDayKey(NOW), mood: 'activated' },
    ]);
  });

  it('flowers older than 28 days fall out of the bed', () => {
    const checkIns = [
      { energy_score: 4, created_at: new Date(2026, 8, 20, 12).toISOString() }, // 30 days back
      { energy_score: 2, created_at: at(19) },
    ];
    const flowers = gardenState({ ...empty, checkIns }, NOW).flowers;
    expect(flowers.map((f) => f.mood)).toEqual(['recovering']);
  });

  it('resting after three quiet days, awake after any log', () => {
    const old = { ...empty, water: glasses(2, 17) };
    expect(gardenState(old, NOW).resting).toBe(true);
    expect(gardenState({ ...empty, water: glasses(1, 18) }, NOW).resting).toBe(false);
    expect(gardenState({ ...old, checkIns: [{ energy_score: 2, created_at: at(20) }] }, NOW).resting).toBe(false);
  });

  it('the past garden ignores later entries', () => {
    const input = { ...empty, workouts: [{ minutes: 30, created_at: at(21) }] };
    expect(gardenState(input, NOW).tree).toBe(0);
  });
});

describe('localDayKey', () => {
  it('is the local calendar day', () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
