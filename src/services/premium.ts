/**
 * Premium purchase entry point (stub).
 *
 * Local-first: premium is a flag on the on-device profile (`useProfileStore`).
 * Real purchases will come from App Store / Google Play billing (e.g. RevenueCat),
 * which needs no server of our own. Until that is wired, this returns null and
 * the Paywall falls back to the beta self-upgrade.
 */
export async function startCheckout(_profileId: string): Promise<{ url: string } | null> {
  return null;
}
