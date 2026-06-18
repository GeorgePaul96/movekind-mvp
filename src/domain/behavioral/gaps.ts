import type { Session } from '@/types';
import type { GapProfile } from './types';

const DAY_MS = 86_400_000;

function daysBetween(earlier: number, later: number): number {
  return Math.max(0, Math.floor((later - earlier) / DAY_MS));
}

export function computeGapProfile(sessions: Session[], now: Date = new Date()): GapProfile {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .map((s) => new Date(s.created_at).getTime())
    .sort((a, b) => a - b);

  if (completed.length === 0) {
    return { hasHistory: false, lastGapDays: 0, avgGapDays: 0, gapHistory: [], trend: 'insufficient_data', observation: null };
  }

  const intervals: number[] = [];
  for (let i = 1; i < completed.length; i++) {
    intervals.push(daysBetween(completed[i - 1]!, completed[i]!));
  }

  const gapHistory = intervals.slice(-5);
  const avgGapDays = intervals.length
    ? Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10
    : 0;
  const lastGapDays = daysBetween(completed[completed.length - 1]!, now.getTime());

  let trend: GapProfile['trend'] = 'insufficient_data';
  let observation: string | null = null;

  if (intervals.length >= 3) {
    const half = Math.floor(intervals.length / 2);
    const earlier = intervals.slice(0, half);
    const recent = intervals.slice(intervals.length - half);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const earlierAvg = avg(earlier);
    const recentAvg = avg(recent);
    const tolerance = Math.max(1, earlierAvg * 0.15);

    if (recentAvg < earlierAvg - tolerance) {
      trend = 'shrinking';
      observation = 'Your gaps between sessions are shrinking.';
    } else if (recentAvg > earlierAvg + tolerance) {
      trend = 'growing';
      observation = 'Your gaps between sessions have been growing — no judgment, just noticing.';
    } else {
      trend = 'stable';
      observation = 'Your rhythm between sessions is holding steady.';
    }
  }

  return { hasHistory: true, lastGapDays, avgGapDays, gapHistory, trend, observation };
}
