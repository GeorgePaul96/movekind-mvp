import { db } from '@/services/db';
import { computeBehavioralProfile, type BehavioralProfile } from '@/domain/behavioral';

const WINDOW_DAYS = 90;
const MAX_ROWS = 200;

/**
 * Reads the last 90 days of local history and computes a BehavioralProfile.
 * Returns null on error (callers fall back to a default).
 * Lives in services (not hooks) so non-component callers (e.g. the session store) can use it.
 */
export async function fetchBehavioralProfile(): Promise<BehavioralProfile | null> {
  try {
    const sinceIso = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
    const [sessions, checkIns, ratings] = await Promise.all([
      db.sessions.list({ since: sinceIso, statuses: ['completed', 'abandoned'] }),
      db.checkIns.since(sinceIso),
      db.ratings.list(sinceIso),
    ]);
    return computeBehavioralProfile(
      sessions.slice(0, MAX_ROWS),
      checkIns.slice(0, MAX_ROWS),
      ratings.slice(0, MAX_ROWS),
    );
  } catch {
    return null;
  }
}
