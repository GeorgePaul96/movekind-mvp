import type { Session, CheckIn, PostRating } from '@/types';
import type { BehavioralProfile } from './types';
import { computeGapProfile } from './gaps';
import { computeRhythm } from './rhythm';
import { computeRecovery } from './recovery';
import { detectWins } from './wins';

export * from './types';
export { computeGapProfile } from './gaps';
export { computeRhythm } from './rhythm';
export { computeRecovery } from './recovery';
export { detectWins } from './wins';

export function computeBehavioralProfile(
  sessions: Session[],
  checkIns: CheckIn[],
  ratings: PostRating[],
  now: Date = new Date(),
): BehavioralProfile {
  const gaps = computeGapProfile(sessions, now);
  const rhythm = computeRhythm(sessions, now);
  const recovery = computeRecovery(sessions, checkIns, ratings, gaps, rhythm);
  const wins = detectWins(sessions, gaps, rhythm, now);
  return { gaps, rhythm, recovery, wins };
}
