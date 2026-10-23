/** Local-calendar helpers. Days are the phone's days, never UTC. */

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' of the local calendar day. */
export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return localDayKey(a) === localDayKey(b);
}

/** Local midnight `days` days before (negative) or after `d`. */
export function startOfLocalDay(d: Date, days = 0): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Monday = 0 … Sunday = 6. */
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Monday-start local weeks around `now`. */
export function weekBounds(now: Date): { lastStart: Date; thisStart: Date; nextStart: Date } {
  const thisStart = startOfLocalDay(now, -weekdayIndex(now));
  return { lastStart: startOfLocalDay(thisStart, -7), thisStart, nextStart: startOfLocalDay(thisStart, 7) };
}
