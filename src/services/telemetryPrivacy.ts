/**
 * Privacy-first telemetry contract (Phase 5). Pure — safe to unit test without
 * loading the PostHog SDK.
 *
 * Contract:
 * - Measure *completion and return rhythm* (session counts, states, blocks) —
 *   never a user's absence.
 * - Never send raw body/health data or PII as event properties. Capacity is
 *   private; analytics only needs that a session happened, not how tired the
 *   person was or how much better they felt.
 */

/**
 * Property keys stripped from every event before it leaves the device.
 * Scope: raw self-reported body/health signals and PII only. Engagement metrics
 * (block counts/indexes, durations, states) are kept — they *are* completion &
 * rhythm, which the contract explicitly wants to measure.
 */
export const BLOCKED_PROPERTY_KEYS: readonly string[] = [
  // Raw self-reported body/health signals
  'energyScore', 'energy_score',
  'sleepQuality', 'sleep_quality',
  'ratingDelta', 'rating_delta',
  'notes',
  // Direct PII
  'email', 'name',
];

const BLOCKED = new Set(BLOCKED_PROPERTY_KEYS);

/** Returns a copy of `props` with body-data / PII keys removed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeProperties(
  props?: Record<string, any>,
): Record<string, any> | undefined {
  if (!props) return props;
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!BLOCKED.has(key)) clean[key] = value;
  }
  return clean;
}
