import type { Session } from '@/types';
import type { FollowThrough } from './types';

export function computeFollowThrough(sessions: Session[]): FollowThrough {
  const terminal = sessions
    .filter((s) => s.status === 'completed' || s.status === 'abandoned')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const completed = terminal.filter((s) => s.status === 'completed').length;
  const total = terminal.length;
  const abandoned = total - completed;

  if (total === 0) {
    return {
      completed: 0, abandoned: 0, total: 0, completionRate: 0,
      hasHistory: false, trend: 'insufficient_data', observation: null,
    };
  }

  const completionRate = Math.round((completed / total) * 100) / 100;

  let trend: FollowThrough['trend'] = 'insufficient_data';
  if (total >= 4) {
    const half = Math.floor(total / 2);
    const earlier = terminal.slice(0, half);
    const recent = terminal.slice(total - half);
    const rate = (arr: Session[]) =>
      arr.filter((s) => s.status === 'completed').length / arr.length;
    const earlierRate = rate(earlier);
    const recentRate = rate(recent);
    const tol = 0.15;
    if (recentRate > earlierRate + tol) trend = 'building';
    else if (recentRate < earlierRate - tol) trend = 'wavering';
    else trend = 'steady';
  }

  const pct = Math.round(completionRate * 100);
  let observation: string;
  if (completionRate >= 0.8) {
    observation = `You finish what you start — about ${pct}% of the sessions you begin.`;
  } else if (completionRate >= 0.5) {
    observation = `You complete around ${pct}% of the sessions you start. That's real follow-through.`;
  } else {
    observation = `Starting counts too — every session you begin builds trust (${pct}% completed so far).`;
  }
  if (trend === 'building') observation += " And it's been climbing lately.";

  return { completed, abandoned, total, completionRate, hasHistory: true, trend, observation };
}
