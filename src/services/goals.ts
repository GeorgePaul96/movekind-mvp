import { supabase } from './supabase';
import { cacheKeys, readCache, writeCache } from './cache';
import type { Goal } from '@/types';

const TABLE = 'goals';

export async function getGoal(userId: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    const cached = await readCache<Goal>(cacheKeys.goals);
    return cached;
  }
  if (data) await writeCache(cacheKeys.goals, data);
  return (data as Goal) ?? null;
}

export async function upsertGoal(
  userId: string,
  patch: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<Goal> {
  const payload = { user_id: userId, ...patch };
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Goal upsert failed');
  await writeCache(cacheKeys.goals, data);
  return data as Goal;
}
