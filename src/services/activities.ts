import { supabase } from './supabase';
import { cacheKeys, readCache, writeCache } from './cache';
import type { Activity, NewActivity } from '@/types';

const ACTIVITIES_TABLE = 'activities';

export async function listActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from(ACTIVITIES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(200);

  if (error) {
    // Fall back to local cache when offline.
    const cached = await readCache<Activity[]>(cacheKeys.activities);
    if (cached) return cached;
    throw error;
  }

  const activities = (data ?? []) as Activity[];
  await writeCache(cacheKeys.activities, activities);
  return activities;
}

export async function createActivity(
  userId: string,
  input: NewActivity,
): Promise<Activity> {
  const payload = {
    user_id: userId,
    type: input.type,
    duration_minutes: input.duration_minutes,
    effort: input.effort,
    moods: input.moods,
    notes: input.notes ?? null,
    performed_at: input.performed_at,
  };

  const { data, error } = await supabase
    .from(ACTIVITIES_TABLE)
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Activity insert failed');
  return data as Activity;
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase
    .from(ACTIVITIES_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
