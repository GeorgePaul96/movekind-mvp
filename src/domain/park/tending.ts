import type { GardenInput } from '@/domain/garden/garden';
import { localDayKey, startOfLocalDay } from '@/domain/garden/days';

export type TendableObject = 'river' | 'tree' | 'flowerbed' | 'hammock';

/**
 * Objects not yet tended today, so the park can let them shimmer softly. Pure; days are local.
 * The hammock only joins once sleep data is passed in (from stage 2), so it never shimmers
 * for something the app can't log yet.
 */
export function untendedToday(
  input: GardenInput & { sleep?: { day: string }[] },
  now: Date,
): Set<TendableObject> {
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = startOfLocalDay(now, 1);
  const today = (rows: { created_at: string }[]) =>
    rows.some((r) => {
      const t = new Date(r.created_at);
      return t >= todayStart && t < tomorrowStart;
    });

  const out = new Set<TendableObject>();
  if (!today(input.water)) out.add('river');
  if (!today(input.workouts)) out.add('tree');
  if (!today(input.checkIns)) out.add('flowerbed');
  if (input.sleep && !input.sleep.some((s) => s.day === localDayKey(now))) out.add('hammock');
  return out;
}
