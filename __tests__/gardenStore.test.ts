import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';
import { useGardenStore } from '../src/store/gardenStore';
import { telemetry } from '../src/services/telemetry';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

const store = () => useGardenStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, loaded: false, error: null });
  (telemetry.capture as jest.Mock).mockClear();
});

describe('gardenStore', () => {
  it('logMood saves a check-in', async () => {
    await store().logMood('regulated');
    expect(store().todayMood()).toBe('regulated');
    expect(await db.checkIns.all()).toHaveLength(1);
  });

  it("re-picking today's mood replaces the flower", async () => {
    await store().logMood('overloaded');
    await store().logMood('activated');
    const rows = await db.checkIns.all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.energy_score).toBe(5);
    expect(store().todayMood()).toBe('activated');
  });

  it('five quick glasses all land', async () => {
    await Promise.all([1, 2, 3, 4, 5].map(() => store().addGlass()));
    expect(store().water).toHaveLength(5);
    __resetDbCacheForTests();
    await store().load();
    expect(store().water).toHaveLength(5);
  });

  it('removeLastGlassToday never touches yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    useGardenStore.setState({ water: [{ id: 'old', created_at: yesterday.toISOString() }] });
    await store().removeLastGlassToday();
    expect(store().water.map((w) => w.id)).toEqual(['old']);
    await store().addGlass();
    await store().removeLastGlassToday();
    expect(store().water.map((w) => w.id)).toEqual(['old']);
  });

  it('addWorkout grows gardenInput().workouts', async () => {
    await store().addWorkout('walk', 20);
    expect(store().gardenInput().workouts).toEqual([
      expect.objectContaining({ minutes: 20 }),
    ]);
    const id = store().workouts[0]!.id;
    await store().updateWorkout(id, { minutes: 45 });
    expect(store().workouts[0]!.minutes).toBe(45);
    await store().removeWorkout(id);
    expect(store().workouts).toEqual([]);
  });

  it('load reads back moods, water and workouts', async () => {
    await store().logMood('recovering');
    await store().addGlass();
    await store().addWorkout('yoga', 30);
    useGardenStore.setState({ checkIns: [], water: [], workouts: [], loaded: false });
    await store().load();
    expect(store().loaded).toBe(true);
    expect(store().checkIns).toHaveLength(1);
    expect(store().water).toHaveLength(1);
    expect(store().workouts).toHaveLength(1);
  });

  it('telemetry carries only the kind', async () => {
    await store().addGlass();
    await store().addWorkout('run', 30);
    await store().logMood('regulated');
    expect((telemetry.capture as jest.Mock).mock.calls).toEqual([
      ['logged', { kind: 'water' }],
      ['logged', { kind: 'workout' }],
      ['logged', { kind: 'mood' }],
    ]);
  });
});
