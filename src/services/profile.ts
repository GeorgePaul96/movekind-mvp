import { supabase } from './supabase';
import { cacheKeys, readCache, writeCache } from './cache';
import type { Profile } from '@/types';

const TABLE = 'profiles';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    return readCache<Profile>(cacheKeys.profile);
  }
  if (data) await writeCache(cacheKeys.profile, data);
  return (data as Profile) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'name' | 'is_premium'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Profile update failed');
  await writeCache(cacheKeys.profile, data);
  return data as Profile;
}
