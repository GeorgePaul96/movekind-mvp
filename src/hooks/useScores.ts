import { useMemo } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import { computeScores } from '@/utils/analytics';
import { weekStartIso } from '@/utils/date';

export function useScores() {
  const activities = useActivityStore((s) => s.activities);
  const reflections = useReflectionStore((s) => s.reflections);

  return useMemo(() => {
    const thisWeek = weekStartIso();
    const reflection = reflections.find((r) => r.week_start === thisWeek) ?? null;
    return computeScores(activities, reflection);
  }, [activities, reflections]);
}
