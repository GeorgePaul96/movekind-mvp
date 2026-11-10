import { localDayKey, startOfLocalDay } from '@/domain/garden/days';
import type { SleepLog } from '@/types';

/**
 * Sleep balance: how the last two weeks of logged nights compare with the person's own
 * sleep need. Pure. A night that was not logged is skipped, never treated as no sleep.
 */

export const SLEEP_NIGHTS = 14;
export const MIN_SLEEP_NIGHTS = 5;
/** The adult recommendation the need can be set within (AASM and SRS, 2015). */
export const SLEEP_NEED_RANGE: readonly [number, number] = [7, 9];

export function sleepBalance(
  sleep: SleepLog[],
  needHours: number,
  now: Date,
): { hoursBehind: number; nights: number } | null {
  const sinceKey = localDayKey(startOfLocalDay(now, -(SLEEP_NIGHTS - 1)));
  const todayKey = localDayKey(now);
  const byNight = new Map<string, number>();
  for (const s of sleep) {
    if (s.night_of >= sinceKey && s.night_of <= todayKey && !byNight.has(s.night_of)) byNight.set(s.night_of, s.hours);
  }
  if (byNight.size < MIN_SLEEP_NIGHTS) return null;
  const balance = [...byNight.values()].reduce((sum, hours) => sum + (needHours - hours), 0);
  return { hoursBehind: Math.max(0, Math.round(balance * 2) / 2), nights: byNight.size };
}
