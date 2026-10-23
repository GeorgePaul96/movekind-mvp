import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CheckIn, Profile, WaterLog, Workout } from '@/types';
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

/** Tables the guided-session app kept; testers' phones may still have them. */
const LEGACY_TABLES = ['sessions', 'session_blocks', 'post_ratings', 'user_exercise_stats'];

const userId = async () => (await profileDoc.get()).id;

export const db = {
  profile: {
    get: () => profileDoc.get(),
    update: (patch: Partial<Omit<Profile, 'id'>>) => profileDoc.update(patch),
  },

  checkIns: {
    add: async (input: Pick<CheckIn, 'energy_score' | 'sleep_quality' | 'intention' | 'engine_version'>) =>
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

  /** Removes the old session app's tables. Safe to run on every launch. */
  dropLegacy: async () => {
    await AsyncStorage.multiRemove(LEGACY_TABLES.map((t) => PREFIX + t));
  },

  /** Deletes everything this app stored, including the profile. */
  eraseAll: async () => {
    await Promise.all([profileDoc.clear(), checkInTable.clear(), waterTable.clear(), workoutTable.clear()]);
  },
};
