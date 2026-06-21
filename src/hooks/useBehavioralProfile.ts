import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { computeBehavioralProfile, type BehavioralProfile } from '@/domain/behavioral';
import type { Session, CheckIn, PostRating } from '@/types';

const WINDOW_DAYS = 90;
const MAX_ROWS = 200;

/**
 * Fetches the user's recent history and computes a BehavioralProfile.
 * Returns null when unauthenticated or on error (callers fall back to a default).
 * Plain async function (no React) so non-component callers (e.g. the session store) can reuse it.
 */
export async function fetchBehavioralProfile(): Promise<BehavioralProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const sinceIso = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
    const [sessRes, ciRes, prRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', user.id)
        .in('status', ['completed', 'abandoned']).gte('created_at', sinceIso)
        .order('created_at', { ascending: false }).limit(MAX_ROWS),
      supabase.from('check_ins').select('*').eq('user_id', user.id)
        .gte('created_at', sinceIso).order('created_at', { ascending: false }).limit(MAX_ROWS),
      // post_ratings has no user_id column; RLS scopes rows to the user's own sessions.
      supabase.from('post_ratings').select('*')
        .gte('created_at', sinceIso).order('created_at', { ascending: false }).limit(MAX_ROWS),
    ]);

    return computeBehavioralProfile(
      (sessRes.data as Session[]) ?? [],
      (ciRes.data as CheckIn[]) ?? [],
      (prRes.data as PostRating[]) ?? [],
    );
  } catch {
    return null;
  }
}

export function useBehavioralProfile(): { profile: BehavioralProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<BehavioralProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const p = await fetchBehavioralProfile();
      if (active) {
        setProfile(p);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { profile, loading };
}
