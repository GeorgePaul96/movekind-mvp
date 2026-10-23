/**
 * What the app shows first. Pure so it can be tested.
 * First launch → onboarding (a name, then how the garden grows) → the app.
 */
export type RootRoute = 'Onboarding' | 'Main';

export function rootRoute(s: { onboarded: boolean }): RootRoute {
  return s.onboarded ? 'Main' : 'Onboarding';
}
