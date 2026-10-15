import type { UserExerciseStats } from '@/types';

/**
 * Pure port of the former Postgres trigger `sync_user_exercise_stats()`.
 * For every completed exercise in a rated session: first time → n=1, avg=delta;
 * otherwise avg = (avg·n + delta)/(n+1), n+1. Returns a new array; input untouched.
 */
export function applyRating(
  stats: UserExerciseStats[],
  exerciseIds: string[],
  ratingDelta: number,
  now: Date,
  userId: string,
): UserExerciseStats[] {
  const byId = new Map(stats.map((s) => [s.exercise_id, { ...s }]));
  for (const exerciseId of exerciseIds) {
    const cur = byId.get(exerciseId);
    if (!cur) {
      byId.set(exerciseId, {
        id: `stat-${exerciseId}`,
        user_id: userId,
        exercise_id: exerciseId,
        times_completed: 1,
        average_energy_delta: ratingDelta,
        average_session_completion_rate: 0,
        last_completed_at: now.toISOString(),
      });
    } else {
      const n = cur.times_completed;
      cur.average_energy_delta = (cur.average_energy_delta * n + ratingDelta) / (n + 1);
      cur.times_completed = n + 1;
      cur.last_completed_at = now.toISOString();
    }
  }
  return [...byId.values()];
}
