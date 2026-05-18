import { supabase } from './supabase';
import { cacheKeys, readCache, writeCache } from './cache';
import type { NewReflection, Reflection } from '@/types';

const TABLE = 'reflections';

export async function listReflections(userId: string): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(52);

  if (error) {
    const cached = await readCache<Reflection[]>(cacheKeys.reflections);
    if (cached) return cached;
    throw error;
  }
  const reflections = (data ?? []) as Reflection[];
  await writeCache(cacheKeys.reflections, reflections);
  return reflections;
}

export async function upsertReflection(
  userId: string,
  input: NewReflection,
): Promise<Reflection> {
  const payload = { user_id: userId, ...input };
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'user_id,week_start' })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Reflection upsert failed');
  return data as Reflection;
}
