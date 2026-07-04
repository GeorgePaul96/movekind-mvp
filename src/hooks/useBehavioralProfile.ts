import { useEffect, useState } from 'react';
import { fetchBehavioralProfile } from '@/services/behavioralProfile';
import type { BehavioralProfile } from '@/domain/behavioral';

export function useBehavioralProfile(): { profile: BehavioralProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<BehavioralProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const p = await fetchBehavioralProfile();
      if (active) {
        setProfile(p);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { profile, loading };
}
