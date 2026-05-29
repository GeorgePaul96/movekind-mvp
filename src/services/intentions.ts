import { supabase } from './supabase';

export interface Intention {
  id: string;
  user_id: string;
  week_start: string;
  description: string;
  intended_day: string | null;
  intended_time: string | null;
  met: boolean | null;
  created_at: string;
  updated_at: string;
}

export type NewIntention = Pick<
  Intention,
  'week_start' | 'description' | 'intended_day' | 'intended_time'
>;

export async function getIntention(
  userId: string,
  weekStart: string,
): Promise<Intention | null> {
  const { data, error } = await supabase
    .from('intentions')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();
  if (error) return null;
  return (data as Intention) ?? null;
}

export async function upsertIntention(
  userId: string,
  input: NewIntention,
): Promise<Intention | null> {
  const { data, error } = await supabase
    .from('intentions')
    .upsert(
      {
        user_id: userId,
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,week_start' },
    )
    .select('*')
    .single();
  if (error) return null;
  return data as Intention;
}

export async function markIntentionMet(id: string, met: boolean): Promise<void> {
  const { error } = await supabase
    .from('intentions')
    .update({ met, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
