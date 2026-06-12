import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * One-shot loader called inside the authenticated layer.
 * Refreshes user preferences/profile from Supabase if needed.
 */
export function useBootstrapData(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    // PostHog user identification can be initialized here
  }, [user]);
}
