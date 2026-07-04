/**
 * Network-failure classification and calm, anti-guilt user messaging.
 *
 * Supabase-js rejects (throws) on transport failures — the React Native fetch
 * layer surfaces these as `TypeError: Network request failed`, and timeouts as
 * `AbortError`. Database/RLS errors are *returned* as `{ error }`, not thrown,
 * so this helper only needs to recognize transport-level failures.
 */

/** Calm copy shown when the user appears to be offline. Never blames them. */
export const NETWORK_ERROR_MESSAGE =
  "You seem to be offline. Nothing's lost — we'll pick up right where you are once you're reconnected.";

const NETWORK_HINTS = [
  'network request failed',
  'failed to fetch',
  'fetch failed',
  'network error',
  'connection',
  'timeout',
  'timed out',
  'unreachable',
  'offline',
];

export function isNetworkError(err: unknown): boolean {
  if (!err) return false;

  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'TypeError') {
      // RN fetch transport failures arrive as TypeError; AbortError is a timeout.
      if (err.name === 'AbortError') return true;
    }
    const msg = err.message?.toLowerCase() ?? '';
    return NETWORK_HINTS.some((hint) => msg.includes(hint));
  }

  if (typeof err === 'object') {
    const msg = String((err as { message?: unknown }).message ?? '').toLowerCase();
    return NETWORK_HINTS.some((hint) => msg.includes(hint));
  }

  return false;
}

/** Maps any thrown error to user-facing copy: calm offline message, or the raw message. */
export function friendlyErrorMessage(err: unknown): string {
  if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again in a moment.';
}
