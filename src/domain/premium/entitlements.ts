import type { Exercise } from '@/types';

/**
 * Premium entitlements (Phase 5). Pure — no I/O, no React.
 *
 * The tier gates exactly two things: **extended insights & history** and
 * **additional exercise packs**. The core check-in → session loop, every
 * recovery feature, and voice/cue quality are intentionally NOT here and must
 * never be added — paywalling them would break the anti-guilt promise.
 */
export type PremiumFeature = 'extended_insights' | 'exercise_packs';

export const PREMIUM_FEATURES: readonly PremiumFeature[] = [
  'extended_insights',
  'exercise_packs',
];

/** Whether the user may use a given feature. Un-gated features are open to all. */
export function hasAccess(feature: PremiumFeature, isPremium: boolean): boolean {
  if (!PREMIUM_FEATURES.includes(feature)) return true;
  return isPremium;
}

/**
 * How many days of Journey history a user can see. Free users get a rolling
 * window; premium unlocks the full record (Infinity = no cap).
 */
export const FREE_INSIGHTS_WINDOW_DAYS = 30;

export function insightsWindowDays(isPremium: boolean): number {
  return isPremium ? Infinity : FREE_INSIGHTS_WINDOW_DAYS;
}

/**
 * The exercises a user is allowed to compose from. Free users never see
 * premium-pack exercises; premium users see everything. A missing `is_premium`
 * flag reads as free, so this is a no-op until premium packs are seeded.
 */
export function visibleExercises(exercises: Exercise[], isPremium: boolean): Exercise[] {
  if (isPremium) return exercises;
  return exercises.filter((ex) => !ex.is_premium);
}
