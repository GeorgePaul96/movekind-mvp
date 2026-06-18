import type { Session, CheckIn, PostRating } from '@/types';
import type { GapProfile, RhythmStability, RecoveryState } from './types';

export function computeRecovery(
  sessions: Session[],
  checkIns: CheckIn[],
  ratings: PostRating[],
  gaps: GapProfile,
  rhythm: RhythmStability,
): RecoveryState {
  const byNewest = <T extends { created_at: string }>(xs: T[]) =>
    [...xs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const checkInsDesc = byNewest(checkIns);
  const latest = checkInsDesc[0] ?? null;
  const recentCheckIns = checkInsDesc.slice(0, 5);
  const lowEnergyCount = recentCheckIns.filter((c) => c.energy_score <= 2).length;
  const poorSleepCount = recentCheckIns.filter((c) => c.sleep_quality === 'poor').length;

  // Consecutive abandoned sessions among the most recent, before any completion.
  let consecutiveAbandoned = 0;
  for (const s of byNewest(sessions)) {
    if (s.status === 'abandoned') consecutiveAbandoned++;
    else if (s.status === 'completed') break;
  }

  const isMotivationalCollapse = gaps.lastGapDays > 10 && latest != null && latest.energy_score <= 2;
  const isAvoidanceSpiral = consecutiveAbandoned >= 2 && gaps.lastGapDays > 7;
  const isBurnoutRisk = lowEnergyCount >= 3 && (rhythm.trajectory === 'fragmenting' || poorSleepCount >= 2);

  let reEntryReadiness: RecoveryState['reEntryReadiness'] = 'medium';
  if (latest) {
    if (latest.energy_score >= 4 && latest.sleep_quality === 'good') reEntryReadiness = 'high';
    else if (latest.energy_score <= 2 || latest.sleep_quality === 'poor') reEntryReadiness = 'low';
  }

  const recentRatings = byNewest(ratings).slice(0, 5);
  const avgRatingDelta = recentRatings.length
    ? recentRatings.reduce((a, r) => a + r.rating_delta, 0) / recentRatings.length
    : 0;

  const lastInterval = gaps.gapHistory.length ? gaps.gapHistory[gaps.gapHistory.length - 1]! : 0;
  const justReturned = lastInterval > 3 && gaps.lastGapDays <= 2;

  let signal: RecoveryState['signal'];
  if (isMotivationalCollapse) signal = 'collapse';
  else if (isAvoidanceSpiral) signal = 'spiral';
  else if (isBurnoutRisk) signal = 'burnout_risk';
  else if (!gaps.hasHistory || justReturned) signal = 'returning';
  else if (
    (rhythm.trajectory === 'stable' || rhythm.trajectory === 'stabilizing') &&
    rhythm.avgWeeklySessions >= 2 &&
    avgRatingDelta > 0
  ) signal = 'thriving';
  else signal = 'stable';

  return { signal, isMotivationalCollapse, isAvoidanceSpiral, isBurnoutRisk, reEntryReadiness };
}
