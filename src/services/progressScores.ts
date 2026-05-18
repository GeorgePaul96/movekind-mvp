import { supabase } from './supabase';
import type { ComputedScores, ProgressScore } from '@/types';

const TABLE = 'progress_scores';

export async function persistWeeklyScores(
  userId: string,
  weekStartIso: string,
  scores: ComputedScores,
): Promise<ProgressScore> {
  const payload = {
    user_id: userId,
    week_start: weekStartIso,
    ...scores,
    computed_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'user_id,week_start' })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('progress_scores upsert failed');
  return data as ProgressScore;
}

export async function listProgressScores(
  userId: string,
  limit = 12,
): Promise<ProgressScore[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ProgressScore[];
}
