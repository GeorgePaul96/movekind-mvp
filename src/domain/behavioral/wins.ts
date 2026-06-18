import type { Session } from '@/types';
import type { GapProfile, RhythmStability, SelfEfficacyWin } from './types';

const DAY_MS = 86_400_000;
const RECENT_WINDOW_DAYS = 14;

interface DatedWin extends SelfEfficacyWin {
  at: number; // event epoch ms, for recency ordering
}

export function detectWins(
  sessions: Session[],
  gaps: GapProfile,
  rhythm: RhythmStability,
  now: Date = new Date(),
): SelfEfficacyWin[] {
  const nowMs = now.getTime();
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const lastCompletedMs = completed.length
    ? new Date(completed[completed.length - 1]!.created_at).getTime()
    : 0;

  const wins: DatedWin[] = [];
  const lastInterval = gaps.gapHistory.length ? gaps.gapHistory[gaps.gapHistory.length - 1]! : null;

  if (gaps.hasHistory && lastInterval != null && gaps.avgGapDays > 0 && lastInterval < gaps.avgGapDays) {
    wins.push({ type: 'faster_return', observation: 'You came back faster than your usual rhythm. That counts.', at: lastCompletedMs });
  }

  const recentOverloaded = completed
    .filter((s) => s.state === 'overloaded')
    .filter((s) => nowMs - new Date(s.created_at).getTime() <= RECENT_WINDOW_DAYS * DAY_MS);
  if (recentOverloaded.length) {
    const at = new Date(recentOverloaded[recentOverloaded.length - 1]!.created_at).getTime();
    wins.push({ type: 'difficult_week_log', observation: "You showed up for movement even on an overloaded day. That's real strength.", at });
  }

  if (gaps.trend === 'shrinking') {
    wins.push({ type: 'gap_shrinking', observation: "The space between your sessions is shrinking — you're returning more easily.", at: lastCompletedMs });
  }

  if (rhythm.trajectory === 'stabilizing' || rhythm.trajectory === 'stable') {
    wins.push({ type: 'rhythm_stabilizing', observation: 'Your weekly rhythm is finding its footing.', at: lastCompletedMs });
  }

  return wins
    .sort((a, b) => b.at - a.at)
    .slice(0, 3)
    .map(({ at, ...win }) => win);
}
