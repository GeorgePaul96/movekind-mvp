import type { UserState } from '@/types';
import { CHANGES_COPY } from '@/constants/copy';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { localDayKey, startOfLocalDay, weekBounds } from './days';
import type { GardenInput } from './garden';

export type ChangeKind = 'steps' | 'workouts' | 'water' | 'checkins' | 'welcome';
export interface ChangeLine {
  kind: ChangeKind;
  text: string;
}

const ORDER: ChangeKind[] = ['steps', 'workouts', 'water', 'checkins'];
type Trend = 'up' | 'same' | 'quieter';
const RANK: Record<Trend, number> = { up: 0, same: 1, quieter: 2 };

/**
 * This week so far against the *same stretch* of last week (Monday to this moment's
 * weekday and time), so early in the week nothing reads as "quieter" by default.
 * Ups first, then steady, then gentle lines that never state a shortfall.
 */
export function weeklyChanges(input: GardenInput & { stepsByDay?: Record<string, number> }, now: Date): ChangeLine[] {
  const { lastStart, thisStart } = weekBounds(now);
  const elapsed = now.getTime() - thisStart.getTime();
  const lastEnd = new Date(lastStart.getTime() + elapsed);

  const inWindow = (d: Date, start: Date, end: Date) => d >= start && d <= end;
  const count = (rows: { created_at: string }[], start: Date, end: Date) =>
    rows.filter((r) => inWindow(new Date(r.created_at), start, end)).length;
  const days = (rows: { created_at: string }[], start: Date, end: Date) =>
    new Set(rows.filter((r) => inWindow(new Date(r.created_at), start, end)).map((r) => localDayKey(new Date(r.created_at))))
      .size;

  const steps = input.stepsByDay ?? {};
  const stepDays = (start: Date, end: Date) =>
    Object.entries(steps).filter(([day]) => {
      const [y, m, d] = day.split('-').map(Number);
      return inWindow(new Date(y!, m! - 1, d!), startOfLocalDay(start), end);
    });

  const anythingBefore =
    [...input.water, ...input.workouts, ...input.checkIns].some((r) => new Date(r.created_at) < thisStart) ||
    stepDays(new Date(0), new Date(thisStart.getTime() - 1)).length > 0;
  if (!anythingBefore) return [{ kind: 'welcome', text: CHANGES_COPY.welcome }];

  const lines: (ChangeLine & { trend: Trend })[] = [];
  const trendOf = (now: number, last: number): Trend | null =>
    now === 0 && last === 0 ? null : now > last ? 'up' : now === last ? 'same' : 'quieter';

  const avgSteps = (start: Date, end: Date) => {
    const entries = stepDays(start, end);
    return entries.length === 0 ? 0 : entries.reduce((s, [, v]) => s + v, 0) / entries.length;
  };
  if (input.stepsByDay) {
    const thisAvg = avgSteps(thisStart, now);
    const lastAvg = avgSteps(lastStart, lastEnd);
    const diff = Math.round((thisAvg - lastAvg) / 100) * 100;
    const t: Trend | null =
      diff > 0 ? 'up' : diff < 0 ? 'quieter' : thisAvg > 0 || lastAvg > 0 ? 'same' : null;
    if (t) lines.push({ kind: 'steps', trend: t, text: t === 'up' ? CHANGES_COPY.stepsUp(diff) : t === 'same' ? CHANGES_COPY.stepsSame : CHANGES_COPY.stepsQuieter });
  }

  const w = [count(input.workouts, thisStart, now), count(input.workouts, lastStart, lastEnd)] as const;
  const wt = trendOf(w[0], w[1]);
  if (wt)
    lines.push({
      kind: 'workouts',
      trend: wt,
      text: wt === 'up' ? CHANGES_COPY.workoutsUp(w[0], w[0] - w[1]) : wt === 'same' ? CHANGES_COPY.workoutsSame : CHANGES_COPY.workoutsQuieter,
    });

  const wa = trendOf(count(input.water, thisStart, now), count(input.water, lastStart, lastEnd));
  if (wa)
    lines.push({
      kind: 'water',
      trend: wa,
      text: wa === 'up' ? CHANGES_COPY.waterUp : wa === 'same' ? CHANGES_COPY.waterSame : CHANGES_COPY.waterQuieter,
    });

  const c = [days(input.checkIns, thisStart, now), days(input.checkIns, lastStart, lastEnd)] as const;
  const ct = trendOf(c[0], c[1]);
  if (ct)
    lines.push({
      kind: 'checkins',
      trend: ct,
      text: ct === 'up' ? CHANGES_COPY.checkinsUp(c[0]) : ct === 'same' ? CHANGES_COPY.checkinsSame : CHANGES_COPY.checkinsQuieter,
    });

  return lines
    .sort((a, b) => RANK[a.trend] - RANK[b.trend] || ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
    .map(({ kind, text }) => ({ kind, text }));
}

/** The mood flowerbed, one row per local (Monday-start) week, oldest first. */
export function flowersByWeek(
  checkIns: GardenInput['checkIns'],
  now: Date,
  weeks = 4,
): { weekStart: string; flowers: { day: string; mood: UserState }[] }[] {
  const { thisStart } = weekBounds(now);
  const starts = Array.from({ length: weeks }, (_, i) => startOfLocalDay(thisStart, -7 * (weeks - 1 - i)));

  const latestByDay = new Map<string, { at: string; energy: number }>();
  for (const c of checkIns) {
    const at = new Date(c.created_at);
    if (at < starts[0]! || at > now) continue;
    const day = localDayKey(at);
    const prev = latestByDay.get(day);
    if (!prev || c.created_at > prev.at) latestByDay.set(day, { at: c.created_at, energy: c.energy_score });
  }

  return starts.map((start) => {
    const end = startOfLocalDay(start, 7);
    const flowers = [...latestByDay.entries()]
      .filter(([day]) => day >= localDayKey(start) && day < localDayKey(end))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, { energy }]) => ({ day, mood: mapEnergyToState(energy) }));
    return { weekStart: localDayKey(start), flowers };
  });
}
