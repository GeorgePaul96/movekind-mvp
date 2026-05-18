import { startOfWeek, format, addDays, differenceInCalendarDays } from 'date-fns';

export const WEEK_OPTIONS = { weekStartsOn: 1 as const }; // Monday

export function currentWeekStart(today: Date = new Date()): Date {
  return startOfWeek(today, WEEK_OPTIONS);
}

export function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function weekStartIso(d: Date = new Date()): string {
  return isoDate(currentWeekStart(d));
}

export function previousWeeks(count: number, today: Date = new Date()): Date[] {
  const start = currentWeekStart(today);
  return Array.from({ length: count }, (_, i) =>
    addDays(start, -7 * (count - 1 - i)),
  );
}

export function shortDay(d: Date): string {
  return format(d, 'EEEEE'); // M, T, W ...
}

export function daysSince(iso: string, today: Date = new Date()): number {
  return differenceInCalendarDays(today, new Date(iso));
}
