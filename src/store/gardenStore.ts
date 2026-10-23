import { create } from 'zustand';
import { db } from '@/services/db';
import { telemetry } from '@/services/telemetry';
import { friendlyErrorMessage } from '@/services/network';
import { mapEnergyToState, moodToEnergy } from '@/domain/checkin/moods';
import { isSameLocalDay, startOfLocalDay } from '@/domain/garden/days';
import type { GardenInput } from '@/domain/garden/garden';
import type { CheckIn, UserState, WaterLog, Workout, WorkoutType } from '@/types';

/** Stamped on check-ins logged by the garden app (the old session engine is gone). */
export const GARDEN_VERSION = 'garden-1';

const HISTORY_DAYS = 60;

interface GardenStoreState {
  checkIns: CheckIn[];
  water: WaterLog[];
  workouts: Workout[];
  /** Today's steps; null until the step counter arrives (stage 2). */
  stepsToday: number | null;
  loaded: boolean;
  error: string | null;

  load: () => Promise<void>;
  logMood: (mood: UserState) => Promise<void>;
  addGlass: () => Promise<void>;
  removeLastGlassToday: () => Promise<void>;
  addWorkout: (type: WorkoutType, minutes: number) => Promise<void>;
  updateWorkout: (id: string, patch: Partial<Pick<Workout, 'type' | 'minutes'>>) => Promise<void>;
  removeWorkout: (id: string) => Promise<void>;
  todayMood: () => UserState | null;
  gardenInput: () => GardenInput;
}

const isToday = (iso: string) => isSameLocalDay(new Date(iso), new Date());

/**
 * Everything the garden grows from. Stores own the db calls (components stay thin).
 * Each log reports only *what kind* of thing was logged, never its value.
 */
export const useGardenStore = create<GardenStoreState>((set, get) => {
  // Runs a write; on failure keeps a calm message and rethrows so the UI can offer a retry.
  async function guarded<T>(op: () => Promise<T>): Promise<T> {
    try {
      const result = await op();
      set({ error: null });
      return result;
    } catch (err) {
      set({ error: friendlyErrorMessage(err) });
      throw err;
    }
  }

  return {
    checkIns: [],
    water: [],
    workouts: [],
    stepsToday: null,
    loaded: false,
    error: null,

    load: async () => {
      try {
        const since = startOfLocalDay(new Date(), -HISTORY_DAYS).toISOString();
        const [checkIns, water, workouts] = await Promise.all([
          db.checkIns.since(since),
          db.water.since(since),
          db.workouts.all(),
        ]);
        set({ checkIns, water, workouts, loaded: true, error: null });
      } catch (err) {
        set({ error: friendlyErrorMessage(err), loaded: true });
      }
    },

    logMood: (mood) =>
      guarded(async () => {
        // A day is one check-in: re-picking today's mood edits it (one flower per day).
        const today = get().checkIns.find((c) => isToday(c.created_at));
        const energy_score = moodToEnergy(mood);
        if (today) {
          await db.checkIns.update(today.id, { energy_score });
          set((s) => ({ checkIns: s.checkIns.map((c) => (c.id === today.id ? { ...c, energy_score } : c)) }));
        } else {
          const row = await db.checkIns.add({
            energy_score,
            sleep_quality: null,
            intention: null,
            engine_version: GARDEN_VERSION,
          });
          set((s) => ({ checkIns: [row, ...s.checkIns] }));
        }
        telemetry.capture('logged', { kind: 'mood' });
      }),

    addGlass: () =>
      guarded(async () => {
        const glass = await db.water.add();
        set((s) => ({ water: [...s.water, glass] }));
        telemetry.capture('logged', { kind: 'water' });
      }),

    removeLastGlassToday: () =>
      guarded(async () => {
        const last = [...get().water].reverse().find((w) => isToday(w.created_at));
        if (!last) return;
        await db.water.remove(last.id);
        set((s) => ({ water: s.water.filter((w) => w.id !== last.id) }));
      }),

    addWorkout: (type, minutes) =>
      guarded(async () => {
        const workout = await db.workouts.add({ type, minutes });
        set((s) => ({ workouts: [workout, ...s.workouts] }));
        telemetry.capture('logged', { kind: 'workout' });
      }),

    updateWorkout: (id, patch) =>
      guarded(async () => {
        await db.workouts.update(id, patch);
        set((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
      }),

    removeWorkout: (id) =>
      guarded(async () => {
        await db.workouts.remove(id);
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
      }),

    todayMood: () => {
      const today = get().checkIns.find((c) => isToday(c.created_at));
      return today ? mapEnergyToState(today.energy_score) : null;
    },

    gardenInput: () => {
      const { checkIns, water, workouts, stepsToday } = get();
      return { checkIns, water, workouts, stepsToday };
    },
  };
});
