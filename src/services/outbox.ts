import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { isNetworkError } from '@/services/network';

/**
 * Offline outbox for post-session ratings.
 *
 * A rating feeds the server-side stats trigger, so losing it when the network
 * blips would silently degrade personalization. When the online write fails,
 * we persist the rating here and replay it on the next app launch (or the next
 * successful sync). Self-contained by design: a rating references an already
 * -created session id, so it can be replayed with no server round-trip first.
 */

const KEY = '@movekind/outbox/ratings';

export interface PendingRating {
  sessionId: string;
  ratingDelta: number;
  notes: string | null;
  queuedAt: string;
}

async function read(): Promise<PendingRating[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingRating[]) : [];
  } catch {
    return [];
  }
}

async function write(entries: PendingRating[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // swallow — an unwritable cache must never crash the completion flow
  }
}

export async function enqueueRating(
  entry: Omit<PendingRating, 'queuedAt'>,
): Promise<void> {
  const entries = await read();
  // De-dupe on sessionId: one rating per session; a re-submit replaces the old.
  const next = entries
    .filter((e) => e.sessionId !== entry.sessionId)
    .concat({ ...entry, queuedAt: new Date().toISOString() });
  await write(next);
}

export async function getPendingRatings(): Promise<PendingRating[]> {
  return read();
}

async function sendRating(entry: PendingRating): Promise<void> {
  const { error: ratingErr } = await supabase.from('post_ratings').insert({
    session_id: entry.sessionId,
    rating_delta: entry.ratingDelta,
    notes: entry.notes,
  });
  if (ratingErr) throw ratingErr;

  const { error: sessErr } = await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', entry.sessionId);
  if (sessErr) throw sessErr;
}

/**
 * Replays queued ratings. Successful sends are removed; entries that fail on a
 * network error are kept for the next attempt. A non-network failure (e.g. the
 * session was deleted server-side) drops the entry so it can't wedge the queue.
 * Returns how many were flushed and how many remain.
 */
export async function syncPendingRatings(): Promise<{ flushed: number; remaining: number }> {
  const entries = await read();
  if (entries.length === 0) return { flushed: 0, remaining: 0 };

  const kept: PendingRating[] = [];
  let flushed = 0;

  for (const entry of entries) {
    try {
      await sendRating(entry);
      flushed += 1;
    } catch (err) {
      if (isNetworkError(err)) {
        kept.push(entry); // still offline — try again later
      }
      // else: permanent failure — drop it rather than block the queue forever
    }
  }

  await write(kept);
  return { flushed, remaining: kept.length };
}
