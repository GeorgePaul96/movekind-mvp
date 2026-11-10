import { create } from 'zustand';
import { db } from '@/services/db';
import { telemetry } from '@/services/telemetry';
import { friendlyErrorMessage } from '@/services/network';
import { requestStepsAccess, stepsByDay, stepsStatus, type StepsStatus } from '@/services/steps';
import { mapEnergyToState, moodToEnergy, yardMoodOf, yardMoodToEnergy } from '@/domain/checkin/moods';
import { isSameLocalDay, localDayKey, startOfLocalDay } from '@/domain/garden/days';
import type { GardenInput } from '@/domain/garden/garden';
import type { CheckIn, GoodThing, Meal, MealLog, SleepFeel, SleepLog, UserState, WaterLog, Workout, WorkoutType, YardMood } from '@/types';

/** Stamped on check-ins logged by the garden app (the old session engine is gone). */
export const GARDEN_VERSION = 'garden-1';

/** The meals the food sheet offers, in display order. */
export const MEALS: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Sleep hours are kept to the half hour, between 0 and 24. */
export function tidySleepHours(hours: number): number {
  if (!Number.isFinite(hours)) return 0;
  return Math.min(24, Math.max(0, Math.round(hours * 2) / 2));
}

const HISTORY_DAYS = 60;
/** Two weeks: this week and last, for the Changes comparison. */
const STEP_DAYS = 14;

interface GardenStoreState {
  checkIns: CheckIn[];
  water: WaterLog[];
  workouts: Workout[];
  meals: MealLog[];
  sleep: SleepLog[];
  /** "One good thing" notes, newest day first. */
  goodThings: GoodThing[];
  /** Saves today's good thing (saving again replaces it; empty text removes it). */
  saveGoodThing: (text: string) => Promise<void>;
  todayGoodThing: () => GoodThing | null;
  /** Today's steps; null until the phone shares them (then the grass keeps a calm default). */
  stepsToday: number | null;
  /** Daily steps for the last two weeks, keyed by localDayKey. */
  stepsByDay: Record<string, number>;
  /** Whether the phone shares steps ('unknown' until first checked). */
  stepsStatus: StepsStatus | 'unknown';
  loaded: boolean;
  error: string | null;

  load: () => Promise<void>;
  /** Re-reads steps if access was already given. Never asks for permission. */
  refreshSteps: () => Promise<void>;
  /** Asks the phone for step access (from a tap), then reads steps. */
  allowSteps: () => Promise<void>;
  logMood: (mood: UserState) => Promise<void>;
  addGlass: () => Promise<void>;
  removeLastGlassToday: () => Promise<void>;
  addWorkout: (type: WorkoutType, minutes: number) => Promise<void>;
  updateWorkout: (id: string, patch: Partial<Pick<Workout, 'type' | 'minutes'>>) => Promise<void>;
  removeWorkout: (id: string) => Promise<void>;
  todayMood: () => UserState | null;
  /** Marks today's check-in as feeling unwell (or not). Needs a mood picked today first. */
  setUnwell: (unwell: boolean) => Promise<void>;
  todayUnwell: () => boolean;
  /** Logs today's yard mood (re-picking edits today's check-in). */
  logYardMood: (mood: YardMood) => Promise<void>;
  todayYardMood: () => YardMood | null;
  /** Which meals were logged today, in MEALS order. */
  mealsToday: () => Meal[];
  /** Makes today's meals exactly this set: adds the new ones, removes the unticked ones. */
  setMealsToday: (meals: Meal[]) => Promise<void>;
  /** This morning's sleep log, if there is one. */
  lastNightSleep: () => SleepLog | null;
  /** Logs last night's sleep (logging again this morning edits it). */
  logSleep: (hours: number, feel: SleepFeel | null) => Promise<void>;
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
    meals: [],
    sleep: [],
    goodThings: [],

    saveGoodThing: (text) =>
      guarded(async () => {
        const saved = await db.goodThings.setDay(localDayKey(new Date()), text.slice(0, 280));
        set({ goodThings: await db.goodThings.all() });
        // Only that a note was written. The words never leave the phone.
        if (saved) telemetry.capture('logged', { kind: 'good_thing' });
      }),

    todayGoodThing: () => get().goodThings.find((g) => g.day === localDayKey(new Date())) ?? null,

    stepsToday: null,
    stepsByDay: {},
    stepsStatus: 'unknown',
    loaded: false,
    error: null,

    load: async () => {
      try {
        const since = startOfLocalDay(new Date(), -HISTORY_DAYS).toISOString();
        const [checkIns, water, workouts, meals, sleep, goodThings] = await Promise.all([
          db.checkIns.since(since),
          db.water.since(since),
          db.workouts.all(),
          db.meals.since(since),
          db.sleep.since(since),
          db.goodThings.all(),
        ]);
        set({ checkIns, water, workouts, meals, sleep, goodThings, loaded: true, error: null });
      } catch (err) {
        set({ error: friendlyErrorMessage(err), loaded: true });
      }
    },

    refreshSteps: async () => {
      const status = await stepsStatus();
      if (status !== 'granted') {
        set({ stepsStatus: status, stepsToday: null, stepsByDay: {} });
        return;
      }
      const days = await stepsByDay(STEP_DAYS);
      set({ stepsStatus: status, stepsByDay: days, stepsToday: days[localDayKey(new Date())] ?? null });
    },

    allowSteps: async () => {
      await requestStepsAccess();
      await get().refreshSteps();
    },

    logMood: (mood) =>
      guarded(async () => {
        // A day is one check-in: re-picking today's mood edits it (one flower per day).
        const today = get().checkIns.find((c) => isToday(c.created_at));
        const energy_score = moodToEnergy(mood);
        if (today) {
          // Clears any yard mood, so the two pickers can never disagree about today.
          await db.checkIns.update(today.id, { energy_score, mood: undefined });
          set((s) => ({
            checkIns: s.checkIns.map((c) => (c.id === today.id ? { ...c, energy_score, mood: undefined } : c)),
          }));
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

    setUnwell: (unwell) =>
      guarded(async () => {
        const today = get().checkIns.find((c) => isToday(c.created_at));
        if (!today) return;
        await db.checkIns.update(today.id, { unwell });
        set((s) => ({ checkIns: s.checkIns.map((c) => (c.id === today.id ? { ...c, unwell } : c)) }));
        // Deliberately no telemetry: how someone feels physically never leaves the phone.
      }),

    todayUnwell: () => !!get().checkIns.find((c) => isToday(c.created_at))?.unwell,

    todayMood: () => {
      const today = get().checkIns.find((c) => isToday(c.created_at));
      return today ? mapEnergyToState(today.energy_score) : null;
    },

    logYardMood: (mood) =>
      guarded(async () => {
        const today = get().checkIns.find((c) => isToday(c.created_at));
        const energy_score = yardMoodToEnergy(mood);
        if (today) {
          await db.checkIns.update(today.id, { energy_score, mood });
          set((s) => ({ checkIns: s.checkIns.map((c) => (c.id === today.id ? { ...c, energy_score, mood } : c)) }));
        } else {
          const row = await db.checkIns.add({
            energy_score,
            mood,
            sleep_quality: null,
            intention: null,
            engine_version: GARDEN_VERSION,
          });
          set((s) => ({ checkIns: [row, ...s.checkIns] }));
        }
        telemetry.capture('logged', { kind: 'mood' });
      }),

    todayYardMood: () => {
      const today = get().checkIns.find((c) => isToday(c.created_at));
      return today ? yardMoodOf(today) : null;
    },

    mealsToday: () => {
      const eaten = new Set(get().meals.filter((m) => isToday(m.created_at)).map((m) => m.meal));
      return MEALS.filter((m) => eaten.has(m));
    },

    setMealsToday: (meals) =>
      guarded(async () => {
        const wanted = new Set(meals);
        const todays = get().meals.filter((m) => isToday(m.created_at));
        const have = new Set(todays.map((m) => m.meal));
        const toRemove = todays.filter((m) => !wanted.has(m.meal));
        const toAdd = MEALS.filter((m) => wanted.has(m) && !have.has(m));
        try {
          for (const row of toRemove) await db.meals.remove(row.id);
          for (const meal of toAdd) await db.meals.add(meal);
        } finally {
          // Re-read, so memory matches disk even if a write in the middle failed.
          set({ meals: await db.meals.since(startOfLocalDay(new Date(), -HISTORY_DAYS).toISOString()) });
        }
        if (toAdd.length) telemetry.capture('logged', { kind: 'food' });
      }),

    lastNightSleep: () => get().sleep.find((s) => s.night_of === localDayKey(new Date())) ?? null,

    logSleep: (hours, feel) =>
      guarded(async () => {
        const tidy = tidySleepHours(hours);
        const existing = get().lastNightSleep();
        if (existing) {
          await db.sleep.update(existing.id, { hours: tidy, feel });
          set((s) => ({ sleep: s.sleep.map((r) => (r.id === existing.id ? { ...r, hours: tidy, feel } : r)) }));
        } else {
          const row = await db.sleep.add({ night_of: localDayKey(new Date()), hours: tidy, feel });
          set((s) => ({ sleep: [row, ...s.sleep] }));
        }
        telemetry.capture('logged', { kind: 'sleep' });
      }),

    gardenInput: () => {
      const { checkIns, water, workouts, stepsToday } = get();
      return { checkIns, water, workouts, stepsToday };
    },
  };
});
