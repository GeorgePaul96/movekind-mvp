import { isSameLocalDay, localDayKey, startOfLocalDay } from '@/domain/garden/days';
import { yardMoodOf } from '@/domain/checkin/moods';
import type { CalorieLog, CheckIn, GoodThing, Meal, MealLog, PauseKind, SleepLog, WaterLog, Workout, WorkoutType, YardMood } from '@/types';

/**
 * The day has a shape. Pure helpers for the three moments that make the app more than a
 * notebook: the morning's pace (read from sleep and mood), "same as yesterday" during the
 * day, and closing the day in the evening.
 *
 * Deliberately not here: targets, scores that fall when someone is away, calorie ranges,
 * or anything that tells a person how to move or what to eat. A pace only describes the day.
 */

export type Pace = 'rest' | 'gentle' | 'steady' | 'bright';
export type PaceReason = 'pause' | 'short-night' | 'low-mood' | 'mixed' | 'standard';

const MOOD_SCORE: Record<YardMood, number> = { tired: 1, low: 2, frustrated: 2, steady: 4, buzzing: 5 };

/** 1 (very short) to 4 (a full night). A very long night is read as a tired one, not a great one. */
function sleepScore(hours: number): number {
  if (hours < 5.5) return 1;
  if (hours < 6.5) return 2;
  if (hours < 7.5) return 3;
  if (hours <= 9) return 4;
  return 3;
}

/**
 * Today's pace from what is actually known. Null when nothing is known: the app never
 * assumes a night or a mood that was not noted.
 */
export function dayPace(i: {
  sleepHours: number | null;
  mood: YardMood | null;
  pause: PauseKind | null;
}): { pace: Pace; reason: PaceReason } | null {
  if (i.pause) return { pace: 'rest', reason: 'pause' };
  const sleep = i.sleepHours == null ? null : sleepScore(i.sleepHours);
  const mood = i.mood == null ? null : MOOD_SCORE[i.mood];
  if (sleep == null && mood == null) return null;

  // Either one being very low settles it: a hard day is never talked up.
  if (sleep === 1) return { pace: 'rest', reason: 'short-night' };
  if (mood === 1) return { pace: 'rest', reason: 'low-mood' };

  if (sleep == null) {
    return { pace: mood === 5 ? 'bright' : mood === 4 ? 'steady' : 'gentle', reason: 'standard' };
  }
  if (mood == null) return { pace: sleep === 2 ? 'gentle' : 'steady', reason: 'standard' };

  // A good night with a low mood, or a short night with high energy: take it gently.
  if ((sleep <= 2 && mood >= 4) || (sleep >= 4 && mood <= 2)) return { pace: 'gentle', reason: 'mixed' };
  if (sleep + mood <= 5) return { pace: 'gentle', reason: 'standard' };
  if (mood === 5 && sleep >= 3) return { pace: 'bright', reason: 'standard' };
  return { pace: 'steady', reason: 'standard' };
}

export interface DayLogs {
  checkIns: CheckIn[];
  water: WaterLog[];
  meals: MealLog[];
  workouts: Workout[];
  sleep: SleepLog[];
  goodThings: GoodThing[];
}

/** What actually happened on a day. Only facts: nothing here knows about anything left undone. */
export interface DayFacts {
  mood: YardMood | null;
  glasses: number;
  meals: Meal[];
  moveMinutes: number;
  sleepHours: number | null;
  goodThing: string | null;
}

const MEAL_ORDER: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function dayFacts(i: DayLogs, day: Date): DayFacts {
  const on = (iso: string) => isSameLocalDay(new Date(iso), day);
  const key = localDayKey(day);
  const check = i.checkIns.find((c) => on(c.created_at));
  const eaten = new Set(i.meals.filter((m) => on(m.created_at)).map((m) => m.meal));
  return {
    mood: check ? yardMoodOf(check) : null,
    glasses: i.water.filter((w) => on(w.created_at)).length,
    meals: MEAL_ORDER.filter((m) => eaten.has(m)),
    moveMinutes: i.workouts.filter((w) => on(w.created_at)).reduce((sum, w) => sum + w.minutes, 0),
    sleepHours: i.sleep.find((s) => s.night_of === key)?.hours ?? null,
    goodThing: i.goodThings.find((g) => g.day === key)?.text ?? null,
  };
}

export const hasAnything = (f: DayFacts) =>
  f.mood != null || f.glasses > 0 || f.meals.length > 0 || f.moveMinutes > 0 || f.sleepHours != null || f.goodThing != null;

/**
 * "Same as yesterday": what yesterday held that today does not yet, so a routine day
 * takes one tap instead of typing it all again.
 */
export function yesterdayRepeat(
  i: { meals: MealLog[]; workouts: Workout[]; calories: CalorieLog[] },
  now: Date,
): { meals: Meal[]; workouts: { type: WorkoutType; minutes: number }[]; kcal: number | null } {
  const yesterday = startOfLocalDay(now, -1);
  const was = (iso: string) => isSameLocalDay(new Date(iso), yesterday);
  const is = (iso: string) => isSameLocalDay(new Date(iso), now);

  const todayMeals = new Set(i.meals.filter((m) => is(m.created_at)).map((m) => m.meal));
  const yesterdayMeals = new Set(i.meals.filter((m) => was(m.created_at)).map((m) => m.meal));
  // Offer the meals only while today's food is still empty: never overwrite what was noted.
  const meals = todayMeals.size === 0 ? MEAL_ORDER.filter((m) => yesterdayMeals.has(m)) : [];

  const todays = i.workouts.filter((w) => is(w.created_at));
  const seen = new Set<string>();
  const workouts = i.workouts
    .filter((w) => was(w.created_at))
    .map((w) => ({ type: w.type, minutes: w.minutes }))
    .filter((w) => {
      const id = `${w.type}:${w.minutes}`;
      if (seen.has(id) || todays.some((t) => t.type === w.type && t.minutes === w.minutes)) return false;
      seen.add(id);
      return true;
    });

  const todayKcal = i.calories.find((c) => c.day === localDayKey(now));
  const kcal = todayKcal ? null : (i.calories.find((c) => c.day === localDayKey(yesterday))?.kcal ?? null);
  return { meals, workouts, kcal };
}

/** From six in the evening the home offers to close the day first. */
export const isEvening = (now: Date) => now.getHours() >= 18;
