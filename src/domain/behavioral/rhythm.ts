import type { Session } from '@/types';
import type { RhythmStability } from './types';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WEEKS_WINDOW = 8;

export function computeRhythm(sessions: Session[], now: Date = new Date()): RhythmStability {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .map((s) => new Date(s.created_at).getTime())
    .sort((a, b) => a - b);

  if (completed.length === 0) {
    return { weeklyVariance: 0, avgWeeklySessions: 0, trajectory: 'insufficient_data', observation: null };
  }

  const nowMs = now.getTime();
  const firstMs = completed[0]!;
  const weeksSpan = Math.min(WEEKS_WINDOW, Math.floor((nowMs - firstMs) / WEEK_MS) + 1);
  const counts: number[] = new Array(Math.max(1, weeksSpan)).fill(0);

  for (const t of completed) {
    const weeksAgo = Math.floor((nowMs - t) / WEEK_MS); // 0 = current week
    if (weeksAgo < counts.length) counts[counts.length - 1 - weeksAgo] += 1; // newest at end
  }

  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const weeklyVariance = Math.round((counts.reduce((a, c) => a + (c - mean) ** 2, 0) / counts.length) * 100) / 100;
  const avgWeeklySessions = Math.round(mean * 10) / 10;

  let trajectory: RhythmStability['trajectory'] = 'insufficient_data';
  let observation: string | null = null;

  if (counts.length >= 2) {
    const n = counts.length;
    const lastWeek = counts[n - 1]!;
    const prevWeek = counts[n - 2]!;
    const half = Math.floor(n / 2);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const firstHalfAvg = avg(counts.slice(0, half));
    const secondHalfAvg = avg(counts.slice(half));

    if (prevWeek === 0 && lastWeek > 0) {
      trajectory = 'rebuilding';
      observation = "You're rebuilding your rhythm. Welcome back.";
    } else if (weeklyVariance <= 0.5) {
      trajectory = 'stable';
      observation = 'Your weekly rhythm is steady.';
    } else if (secondHalfAvg > firstHalfAvg) {
      trajectory = 'stabilizing';
      observation = 'Your rhythm is becoming more consistent.';
    } else if (secondHalfAvg < firstHalfAvg) {
      trajectory = 'fragmenting';
      observation = "Your rhythm has loosened lately — that's okay.";
    } else {
      trajectory = 'stable';
      observation = 'Your weekly rhythm is steady.';
    }
  }

  return { weeklyVariance, avgWeeklySessions, trajectory, observation };
}
