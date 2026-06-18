import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';
import { computeBehavioralProfile, type BehavioralProfile } from '@/domain/behavioral';
import type { Session, CheckIn, PostRating } from '@/types';

const WINDOW_DAYS = 90;
const MAX_ROWS = 200;

export function useBehavioralProfile(): { profile: BehavioralProfile | null; loading: boolean } {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [ratings, setRatings] = useState<PostRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (active) setLoading(false);
          return;
        }
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
        if (!active) return;
        setSessions((sessRes.data as Session[]) ?? []);
        setCheckIns((ciRes.data as CheckIn[]) ?? []);
        setRatings((prRes.data as PostRating[]) ?? []);
      } catch {
        // graceful empty state — leave arrays empty
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const profile = useMemo(
    () => computeBehavioralProfile(sessions, checkIns, ratings),
    [sessions, checkIns, ratings],
  );

  return { profile, loading };
}
