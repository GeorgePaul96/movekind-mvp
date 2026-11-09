import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';
import { tidySleepHours, useGardenStore } from '../src/store/gardenStore';
import { telemetry } from '../src/services/telemetry';
import { localDayKey } from '../src/domain/garden/days';
import { mapEnergyToState, YARD_MOODS, yardMoodOf, yardMoodToEnergy } from '../src/domain/checkin/moods';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => 'denied',
  requestStepsAccess: async () => false,
  stepsByDay: async () => ({}),
}));
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

const store = () => useGardenStore.getState();
const ALL_TIME = new Date(0).toISOString();

const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

/** Simulates closing and reopening the app. */
async function restart() {
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], meals: [], sleep: [], loaded: false });
  await store().load();
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({
    checkIns: [], water: [], workouts: [], meals: [], sleep: [],
    stepsToday: null, stepsByDay: {}, stepsStatus: 'unknown', loaded: false, error: null,
  });
});

describe('yard moods (domain)', () => {
  it('lists the five moods in tile order', () => {
    expect(YARD_MOODS).toEqual(['tired', 'low', 'frustrated', 'steady', 'buzzing']);
  });

  it('each mood round-trips through its stored row', () => {
    for (const m of YARD_MOODS) expect(yardMoodOf({ energy_score: yardMoodToEnergy(m), mood: m })).toBe(m);
  });

  it('older rows without a mood get the closest one from their energy', () => {
    expect([1, 2, 3, 4, 5].map((energy_score) => yardMoodOf({ energy_score }))).toEqual([
      'tired', 'low', 'low', 'steady', 'buzzing',
    ]);
  });

  it('frustrated reads as recovering in the garden', () => {
    expect(mapEnergyToState(yardMoodToEnergy('frustrated'))).toBe('recovering');
  });
});

describe('yard moods (store)', () => {
  it('logYardMood saves the mood and a matching energy score', async () => {
    await store().logYardMood('frustrated');
    expect(store().todayYardMood()).toBe('frustrated');
    const [row] = await db.checkIns.all();
    expect(row).toMatchObject({ mood: 'frustrated', energy_score: 3 });
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'mood' });
  });

  it('re-picking edits today instead of adding a second check-in', async () => {
    await store().logYardMood('tired');
    await store().logYardMood('buzzing');
    expect(await db.checkIns.all()).toHaveLength(1);
    expect(store().todayYardMood()).toBe('buzzing');
    expect(store().todayMood()).toBe('activated');
  });

  it('survives a restart', async () => {
    await store().logYardMood('low');
    await restart();
    expect(store().todayYardMood()).toBe('low');
  });

  it('is null until a mood is picked today, and ignores yesterday', async () => {
    expect(store().todayYardMood()).toBeNull();
    useGardenStore.setState({
      checkIns: [{
        id: 'y', user_id: 'u', energy_score: 5, mood: 'buzzing', sleep_quality: null,
        intention: null, engine_version: 'garden-1', created_at: yesterdayIso(),
      }],
    });
    expect(store().todayYardMood()).toBeNull();
  });

  it('the old four-mood picker clears a stale yard mood', async () => {
    await store().logYardMood('frustrated');
    await store().logMood('regulated');
    expect(store().todayYardMood()).toBe('steady');
    await restart();
    expect(store().todayYardMood()).toBe('steady');
  });

  it('keeps feeling unwell when the yard mood changes', async () => {
    await store().logYardMood('tired');
    await store().setUnwell(true);
    await store().logYardMood('steady');
    expect(store().todayUnwell()).toBe(true);
  });
});

describe('meals', () => {
  it('setMealsToday adds and removes to match the set, in meal order', async () => {
    await store().setMealsToday(['dinner', 'breakfast']);
    expect(store().mealsToday()).toEqual(['breakfast', 'dinner']);
    await store().setMealsToday(['breakfast', 'snack']);
    expect(store().mealsToday()).toEqual(['breakfast', 'snack']);
    const stored = (await db.meals.since(ALL_TIME)).map((m) => m.meal).sort();
    expect(stored).toEqual(['breakfast', 'snack']);
  });

  it('picking the same meal twice keeps one row', async () => {
    await store().setMealsToday(['lunch']);
    await store().setMealsToday(['lunch']);
    expect(await db.meals.since(ALL_TIME)).toHaveLength(1);
  });

  it('never touches yesterday', async () => {
    const old = await db.meals.add('lunch');
    await AsyncStorage.setItem(
      '@movekind/db/meals',
      JSON.stringify([{ ...old, created_at: yesterdayIso() }]),
    );
    await restart();
    await store().setMealsToday([]);
    expect(store().mealsToday()).toEqual([]);
    expect(await db.meals.since(ALL_TIME)).toHaveLength(1);
  });

  it('reports food only when a meal was added, never which one', async () => {
    await store().setMealsToday(['lunch']);
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'food' });
    (telemetry.capture as jest.Mock).mockClear();
    await store().setMealsToday([]);
    expect(telemetry.capture).not.toHaveBeenCalled();
  });

  it('survives a restart', async () => {
    await store().setMealsToday(['breakfast']);
    await restart();
    expect(store().mealsToday()).toEqual(['breakfast']);
  });
});

describe('sleep', () => {
  it('logSleep saves this morning, and logging again edits it', async () => {
    await store().logSleep(7, null);
    await store().logSleep(7.5, 'deep');
    expect(store().lastNightSleep()).toMatchObject({ hours: 7.5, feel: 'deep', night_of: localDayKey(new Date()) });
    expect(await db.sleep.since(ALL_TIME)).toHaveLength(1);
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'sleep' });
  });

  it('is null with nothing logged this morning', () => {
    useGardenStore.setState({
      sleep: [{ id: 'old', night_of: '2000-01-01', hours: 8, feel: null, created_at: yesterdayIso() }],
    });
    expect(store().lastNightSleep()).toBeNull();
  });

  it('keeps hours to the half hour between 0 and 24', () => {
    expect(tidySleepHours(7.3)).toBe(7.5);
    expect(tidySleepHours(-2)).toBe(0);
    expect(tidySleepHours(30)).toBe(24);
    expect(tidySleepHours(Number.NaN)).toBe(0);
  });

  it('survives a restart', async () => {
    await store().logSleep(6.5, 'restless');
    await restart();
    expect(store().lastNightSleep()).toMatchObject({ hours: 6.5, feel: 'restless' });
  });
});

describe('db: meals and sleep', () => {
  it('sleep update persists', async () => {
    const row = await db.sleep.add({ night_of: '2026-11-09', hours: 7, feel: null });
    await db.sleep.update(row.id, { hours: 8, feel: 'deep' });
    __resetDbCacheForTests();
    expect(await db.sleep.since(ALL_TIME)).toEqual([{ ...row, hours: 8, feel: 'deep' }]);
  });

  it('eraseAll clears meals and sleep', async () => {
    await db.meals.add('dinner');
    await db.sleep.add({ night_of: '2026-11-09', hours: 7, feel: 'okay' });
    await db.eraseAll();
    __resetDbCacheForTests();
    expect(await db.meals.since(ALL_TIME)).toEqual([]);
    expect(await db.sleep.since(ALL_TIME)).toEqual([]);
  });
});
