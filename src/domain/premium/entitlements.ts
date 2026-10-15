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

/**
 * Free-until-launch (decided 2026-10-16): MoveKind is entirely free until it has
 * enough users to justify a Pro plan. While this is false, everyone is treated as
 * Pro — no paywall, nothing locked. Flip to true only when Pro launches, and only
 * ever gate NEW things then: never take back something people already had free.
 */
export const PRO_PLAN_LIVE = false;

/** What the app should treat the user as. Use this — never `profile.is_premium` directly. */
export function effectivePremium(isPremium: boolean, live: boolean = PRO_PLAN_LIVE): boolean {
  return !live || isPremium;
}

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
