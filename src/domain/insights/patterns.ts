import { localDayKey, startOfLocalDay } from '@/domain/garden/days';
import type { CheckIn, SleepLog, WaterLog, Workout } from '@/types';

/**
 * Patterns: the person's own links between things they already log. Pure.
 * Deliberately cautious: a pattern is only named when there is enough to go on, and it
 * is only ever a direction ("tends to"), never a number and never a cause.
 */

export type PatternKind = 'sleep-mood' | 'movement-mood' | 'steps-mood' | 'water-mood';

export interface Pattern {
  kind: PatternKind;
  /** up: mood ran higher on the days with more of it. */
  direction: 'up' | 'down';
}

export const PATTERN_DAYS = 60;
const MIN_DAYS = 14;
const MIN_GROUP = 5;
/** Half a standard deviation: a difference worth mentioning. */
const MIN_EFFECT = 0.5;
/** A night counts as a longer night from here (the low end of the adult recommendation). */
const LONG_NIGHT_HOURS = 7;

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

function compare(more: number[], less: number[]): 'up' | 'down' | null {
  if (more.length + less.length < MIN_DAYS || more.length < MIN_GROUP || less.length < MIN_GROUP) return null;
  const a = mean(more);
  const b = mean(less);
  if (a === b) return null;
  const ss = [...more.map((x) => (x - a) ** 2), ...less.map((x) => (x - b) ** 2)].reduce((s, x) => s + x, 0);
  const sd = Math.sqrt(ss / (more.length + less.length - 2));
  const effect = sd === 0 ? Infinity : Math.abs(a - b) / sd;
  if (effect < MIN_EFFECT) return null;
  return a > b ? 'up' : 'down';
}

function median(xs: number[]): number {
  const s = [...xs].sort((p, q) => p - q);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function patterns(
  i: {
    checkIns: CheckIn[];
    sleep: SleepLog[];
    workouts: Workout[];
    water: WaterLog[];
    stepsByDay?: Record<string, number>;
  },
  now: Date,
): Pattern[] {
  const sinceKey = localDayKey(startOfLocalDay(now, -PATTERN_DAYS));
  const todayKey = localDayKey(now);
  const inWindow = (day: string) => day >= sinceKey && day <= todayKey;
  const dayOf = (iso: string) => localDayKey(new Date(iso));

  // One mood per day (a day is one check-in).
  const mood = new Map<string, number>();
  for (const c of i.checkIns) {
    const day = dayOf(c.created_at);
    if (inWindow(day) && !mood.has(day)) mood.set(day, c.energy_score);
  }

  const split = (value: (day: string) => number | undefined, isMore: (v: number) => boolean) => {
    const more: number[] = [];
    const less: number[] = [];
    for (const [day, energy] of mood) {
      const v = value(day);
      if (v === undefined) continue; // not logged that day: skipped, never treated as zero
      (isMore(v) ? more : less).push(energy);
    }
    return compare(more, less);
  };
  const splitAtMedian = (byDay: Map<string, number>) => {
    const paired = [...mood.keys()].map((d) => byDay.get(d)).filter((v): v is number => v !== undefined);
    if (!paired.length) return null;
    const mid = median(paired);
    return split((day) => byDay.get(day), (v) => v > mid);
  };

  const out: Pattern[] = [];
  const add = (kind: PatternKind, direction: 'up' | 'down' | null) => {
    if (direction) out.push({ kind, direction });
  };

  const sleepByDay = new Map(i.sleep.filter((s) => inWindow(s.night_of)).map((s) => [s.night_of, s.hours]));
  add('sleep-mood', split((day) => sleepByDay.get(day), (h) => h >= LONG_NIGHT_HOURS));

  // Movement is yes or no for the day, so a day without a workout is a real "no".
  const moved = new Set(i.workouts.map((w) => dayOf(w.created_at)));
  add('movement-mood', split((day) => (moved.has(day) ? 1 : 0), (v) => v === 1));

  if (i.stepsByDay) {
    const steps = new Map(Object.entries(i.stepsByDay).filter(([day]) => inWindow(day) && day !== todayKey));
    add('steps-mood', splitAtMedian(steps));
  }

  const glasses = new Map<string, number>();
  for (const w of i.water) {
    const day = dayOf(w.created_at);
    if (inWindow(day) && day !== todayKey) glasses.set(day, (glasses.get(day) ?? 0) + 1);
  }
  add('water-mood', splitAtMedian(glasses));

  return out;
}
