/**
 * What the app shows first. Pure so it can be tested.
 * Onboarding → the one-time "Before you move" safety notice → the app.
 * No exercise is ever reachable before the safety notice has been accepted.
 */
export type RootRoute = 'Onboarding' | 'SafetyNotice' | 'Main';

export function rootRoute(s: { onboarded: boolean; safetyAcknowledged: boolean }): RootRoute {
  if (!s.onboarded) return 'Onboarding';
  if (!s.safetyAcknowledged) return 'SafetyNotice';
  return 'Main';
}
