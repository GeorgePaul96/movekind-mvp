import { supabase } from './supabase';

/**
 * Stripe-ready premium service. The real implementation would call a
 * Supabase Edge Function that creates a Stripe Checkout session, opens
 * the URL, and the function updates profiles.is_premium via webhook.
 */
export interface PremiumStatus {
  isPremium: boolean;
  source: 'profile' | 'unknown';
}

export async function isPremium(userId: string): Promise<PremiumStatus> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return { isPremium: false, source: 'unknown' };
  return { isPremium: Boolean((data as { is_premium: boolean }).is_premium), source: 'profile' };
}

export async function startCheckout(_userId: string): Promise<{ url: string } | null> {
  // Placeholder. Wire to your Stripe-backed Edge Function:
  //
  // const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  //   body: { user_id: _userId },
  // });
  // return data ? { url: data.url } : null;
  return null;
}
