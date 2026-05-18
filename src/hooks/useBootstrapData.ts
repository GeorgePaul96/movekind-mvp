import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * One-shot loader called inside the authenticated layer.
 * Hydrates caches, then refreshes from Supabase.
 */
export function useBootstrapData(): void {
  const user = useAuthStore((s) => s.user);
  const hydrateActs = useActivityStore((s) => s.hydrate);
  const loadActs = useActivityStore((s) => s.load);
  const hydrateRefs = useReflectionStore((s) => s.hydrate);
  const loadRefs = useReflectionStore((s) => s.load);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrateActs();
    hydrateRefs();
    hydrateSettings();
  }, [hydrateActs, hydrateRefs, hydrateSettings]);

  useEffect(() => {
    if (!user) return;
    loadActs(user.id);
    loadRefs(user.id);
  }, [user, loadActs, loadRefs]);
}
