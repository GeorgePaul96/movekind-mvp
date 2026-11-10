import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyProfile, CheckIn, GoodThing, MealLog, Measurement, Profile, PulseLog, SleepLog, WaterLog, Workout } from '@/types';
import { createDoc, createTable, PREFIX } from './table';

export { __resetDbCacheForTests } from './table';

/**
 * MoveKind's only data layer. Everything lives on this phone (AsyncStorage);
 * nothing is sent to a server. Stores and screens call `db.*`, never
 * AsyncStorage directly, so moving to SQLite or adding sync later touches
 * this folder only.
 */

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const nowIso = () => new Date().toISOString();
const newestFirst = <T extends { created_at: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

const profileDoc = createDoc<Profile>('profile', () => ({
  id: newId(),
  name: null,
  created_at: nowIso(),
}));
const checkInTable = createTable<CheckIn>('check_ins');
const waterTable = createTable<WaterLog>('water');
const workoutTable = createTable<Workout>('workouts');
const mealTable = createTable<MealLog>('meals');
const sleepTable = createTable<SleepLog>('sleep');
const bodyDoc = createDoc<BodyProfile>('body', () => ({
  sex: null,
  birth_year: null,
  height_cm: null,
  sleep_need_hours: 7.5,
}));
const measurementTable = createTable<Measurement>('measurements');
const pulseTable = createTable<PulseLog>('pulse');
const goodThingTable = createTable<GoodThing>('good_things');

type MeasurementValues = Pick<Measurement, 'weight_kg' | 'neck_cm' | 'waist_cm' | 'hip_cm'>;
/** Drops undefined keys so an upsert never erases a value measured earlier that day. */
function defined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Tables the guided-session app kept; testers' phones may still have them. */
const LEGACY_TABLES = ['sessions', 'session_blocks', 'post_ratings', 'user_exercise_stats'];

const userId = async () => (await profileDoc.get()).id;

export const db = {
  profile: {
    get: () => profileDoc.get(),
    update: (patch: Partial<Omit<Profile, 'id'>>) => profileDoc.update(patch),
  },

  checkIns: {
    add: async (
      input: Pick<CheckIn, 'energy_score' | 'sleep_quality' | 'intention' | 'engine_version'> & Pick<Partial<CheckIn>, 'mood'>,
    ) =>
      checkInTable.insert({ ...input, id: newId(), user_id: await userId(), created_at: nowIso() }),
    update: (id: string, patch: Partial<CheckIn>) => checkInTable.update(id, patch),
    all: async () => newestFirst(await checkInTable.all()),
    since: async (iso: string) => newestFirst((await checkInTable.all()).filter((c) => c.created_at >= iso)),
  },

  water: {
    add: () => waterTable.insert({ id: newId(), created_at: nowIso() }),
    since: async (iso: string) => (await waterTable.all()).filter((w) => w.created_at >= iso),
    remove: (id: string) => waterTable.remove(id),
  },

  workouts: {
    add: (input: Pick<Workout, 'type' | 'minutes'>) =>
      workoutTable.insert({ ...input, id: newId(), created_at: nowIso() }),
    all: async () => newestFirst(await workoutTable.all()),
    update: (id: string, patch: Partial<Pick<Workout, 'type' | 'minutes'>>) => workoutTable.update(id, patch),
    remove: (id: string) => workoutTable.remove(id),
  },

  meals: {
    add: (meal: MealLog['meal']) => mealTable.insert({ id: newId(), meal, created_at: nowIso() }),
    since: async (iso: string) => (await mealTable.all()).filter((m) => m.created_at >= iso),
    remove: (id: string) => mealTable.remove(id),
  },

  sleep: {
    add: (input: Pick<SleepLog, 'night_of' | 'hours' | 'feel'>) =>
      sleepTable.insert({ ...input, id: newId(), created_at: nowIso() }),
    update: (id: string, patch: Partial<Pick<SleepLog, 'hours' | 'feel'>>) => sleepTable.update(id, patch),
    since: async (iso: string) => newestFirst((await sleepTable.all()).filter((s) => s.created_at >= iso)),
  },

  goodThings: {
    /** Newest day first. */
    all: async () => [...(await goodThingTable.all())].sort((a, b) => b.day.localeCompare(a.day)),
    /** One per day: writing again that day replaces it; empty text removes it. */
    setDay: async (day: string, text: string): Promise<GoodThing | null> => {
      const existing = (await goodThingTable.all()).find((g) => g.day === day);
      const tidy = text.trim();
      if (!tidy) {
        if (existing) await goodThingTable.remove(existing.id);
        return null;
      }
      if (existing) return (await goodThingTable.update(existing.id, { text: tidy })) ?? existing;
      return goodThingTable.insert({ id: newId(), day, text: tidy, created_at: nowIso() });
    },
  },

  /** The opt-in Body section's details (formula sex, birth year, height, sleep need). */
  body: {
    get: () => bodyDoc.get(),
    update: (patch: Partial<BodyProfile>) => bodyDoc.update(patch),
  },

  measurements: {
    /** Oldest day first. */
    all: async () => [...(await measurementTable.all())].sort((a, b) => a.day.localeCompare(b.day)),
    /** One row per day: merges these values into that day's row, or starts it. */
    upsertDay: async (day: string, values: MeasurementValues): Promise<Measurement> => {
      const existing = (await measurementTable.all()).find((m) => m.day === day);
      if (existing) {
        const updated = await measurementTable.update(existing.id, defined(values));
        return updated ?? existing;
      }
      return measurementTable.insert({ ...defined(values), id: newId(), day, created_at: nowIso() });
    },
    remove: (id: string) => measurementTable.remove(id),
  },

  pulse: {
    add: (bpm: number) => pulseTable.insert({ id: newId(), bpm, created_at: nowIso() }),
    all: async () => newestFirst(await pulseTable.all()),
  },

  /** Removes the old session app's tables. Safe to run on every launch. */
  dropLegacy: async () => {
    await AsyncStorage.multiRemove(LEGACY_TABLES.map((t) => PREFIX + t));
  },

  /** Deletes everything this app stored, including the profile. */
  eraseAll: async () => {
    await Promise.all([
      profileDoc.clear(),
      checkInTable.clear(),
      waterTable.clear(),
      workoutTable.clear(),
      mealTable.clear(),
      sleepTable.clear(),
      bodyDoc.clear(),
      measurementTable.clear(),
      pulseTable.clear(),
      goodThingTable.clear(),
    ]);
  },
};
