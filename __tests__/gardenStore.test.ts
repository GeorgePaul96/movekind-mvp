import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';
import { useGardenStore } from '../src/store/gardenStore';
import { telemetry } from '../src/services/telemetry';
import { localDayKey } from '../src/domain/garden/days';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockSteps = {
  stepsStatus: jest.fn(async () => 'granted'),
  requestStepsAccess: jest.fn(async () => true),
  stepsByDay: jest.fn(async () => ({ [localDayKey(new Date())]: 4321, '2000-01-01': 10 })),
};
// Looked up at call time: imports run before mockSteps is initialised.
jest.mock('../src/services/steps', () => ({
  stepsStatus: () => mockSteps.stepsStatus(),
  requestStepsAccess: () => mockSteps.requestStepsAccess(),
  stepsByDay: () => mockSteps.stepsByDay(),
}));
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

const store = () => useGardenStore.getState();

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, stepsByDay: {}, stepsStatus: 'unknown', loaded: false, error: null });
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

  it('gardenStore fills stepsToday after refreshSteps', async () => {
    await store().refreshSteps();
    expect(store().stepsStatus).toBe('granted');
    expect(store().stepsToday).toBe(4321);
    expect(store().gardenInput().stepsToday).toBe(4321);
    expect(mockSteps.requestStepsAccess).not.toHaveBeenCalled();
  });

  it('never reads steps without access, and keeps the calm default', async () => {
    mockSteps.stepsStatus.mockResolvedValueOnce('ask');
    await store().refreshSteps();
    expect(store().stepsStatus).toBe('ask');
    expect(store().stepsToday).toBeNull();
    expect(mockSteps.stepsByDay).not.toHaveBeenCalled();
  });

  it('allowSteps asks once, then reads the steps', async () => {
    mockSteps.stepsStatus.mockResolvedValueOnce('ask');
    await store().refreshSteps();
    await store().allowSteps();
    expect(mockSteps.requestStepsAccess).toHaveBeenCalledTimes(1);
    expect(store().stepsToday).toBe(4321);
  });

  it('a refused request leaves steps off without an error', async () => {
    mockSteps.stepsStatus.mockResolvedValueOnce('ask').mockResolvedValueOnce('denied');
    mockSteps.requestStepsAccess.mockResolvedValueOnce(false);
    await store().refreshSteps();
    await store().allowSteps();
    expect(store().stepsStatus).toBe('denied');
    expect(store().stepsToday).toBeNull();
    expect(store().error).toBeNull();
  });

  it("setUnwell marks today's check-in and survives a restart", async () => {
    await store().logMood('regulated');
    await store().setUnwell(true);
    expect(store().todayUnwell()).toBe(true);
    __resetDbCacheForTests();
    await store().load();
    expect(store().todayUnwell()).toBe(true);
    expect((await db.checkIns.all())[0]!.unwell).toBe(true);
    await store().setUnwell(false);
    expect(store().todayUnwell()).toBe(false);
  });

  it('setUnwell does nothing before a mood is picked today', async () => {
    await store().setUnwell(true);
    expect(store().todayUnwell()).toBe(false);
    expect(await db.checkIns.all()).toEqual([]);
  });

  it('re-picking the mood keeps today unwell', async () => {
    await store().logMood('overloaded');
    await store().setUnwell(true);
    await store().logMood('regulated');
    expect(store().todayUnwell()).toBe(true);
  });

  it('feeling unwell is never sent as telemetry', async () => {
    await store().logMood('regulated');
    (telemetry.capture as jest.Mock).mockClear();
    await store().setUnwell(true);
    expect(telemetry.capture).not.toHaveBeenCalled();
  });
});
