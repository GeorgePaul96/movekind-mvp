import type { UserState } from '@/types';
import { mapEnergyToState } from '@/domain/checkin/moods';
import { localDayKey, startOfLocalDay } from './days';

/**
 * What the garden shows, derived purely from what the user logged. No I/O, no clock:
 * `now` is a parameter, so `gardenState(input, aMonthAgo)` is the garden as it was then.
 *
 * The garden only grows or rests. Stream and grass have a floor (a trickle, short grass),
 * reset each local morning; the tree grows from all-time workout minutes and never shrinks.
 */

export interface GardenInput {
  checkIns: { energy_score: number; created_at: string }[];
  water: { created_at: string }[];
  workouts: { minutes: number; created_at: string }[];
  stepsToday: number | null;
}

export interface GardenState {
  stream: 0 | 1 | 2 | 3 | 4;
  ducks: boolean;
  grass: 1 | 2 | 3 | 4;
  tree: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  birds: boolean;
  flowers: { day: string; mood: UserState }[];
  resting: boolean;
}

/** Cumulative workout minutes needed for each tree stage (sprout … second tree). */
export const TREE_STAGE_MINUTES = [0, 1, 60, 180, 360, 600, 1000] as const;

const FLOWER_DAYS = 28;
const QUIET_DAYS_BEFORE_REST = 3; // today and the two days before

function streamLevel(glasses: number): GardenState['stream'] {
  if (glasses >= 7) return 4;
  if (glasses >= 5) return 3;
  if (glasses >= 3) return 2;
  if (glasses >= 1) return 1;
  return 0;
}

function grassLevel(steps: number | null): GardenState['grass'] {
  if (steps === null || steps < 2000) return 1;
  if (steps < 5000) return 2;
  if (steps < 8000) return 3;
  return 4;
}

function treeStage(minutes: number): GardenState['tree'] {
  let stage = 0;
  TREE_STAGE_MINUTES.forEach((need, i) => {
    if (minutes >= need) stage = i;
  });
  return stage as GardenState['tree'];
}

export function gardenState(input: GardenInput, now: Date): GardenState {
  const upToNow = <T extends { created_at: string }>(rows: T[]) =>
    rows.filter((r) => new Date(r.created_at) <= now);
  const water = upToNow(input.water);
  const workouts = upToNow(input.workouts);
  const checkIns = upToNow(input.checkIns);

  const todayStart = startOfLocalDay(now);
  const since = (start: Date) => (r: { created_at: string }) => new Date(r.created_at) >= start;

  const stream = streamLevel(water.filter(since(todayStart)).length);
  const tree = treeStage(workouts.reduce((sum, w) => sum + w.minutes, 0));

  // One flower per local day; the latest check-in that day decides its colour.
  const latestByDay = new Map<string, { at: string; energy: number }>();
  for (const c of checkIns.filter(since(startOfLocalDay(now, -(FLOWER_DAYS - 1))))) {
    const day = localDayKey(new Date(c.created_at));
    const prev = latestByDay.get(day);
    if (!prev || c.created_at > prev.at) latestByDay.set(day, { at: c.created_at, energy: c.energy_score });
  }
  const flowers = [...latestByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, { energy }]) => ({ day, mood: mapEnergyToState(energy) }));

  // Resting means "away for a while", so a brand-new garden (nothing logged yet) is awake.
  const everything = [...water, ...workouts, ...checkIns];
  const awakeSince = since(startOfLocalDay(now, -(QUIET_DAYS_BEFORE_REST - 1)));
  const resting = everything.length > 0 && !everything.some(awakeSince);

  return {
    stream,
    ducks: stream >= 2,
    grass: grassLevel(input.stepsToday),
    tree,
    birds: tree >= 3,
    flowers,
    resting,
  };
}
