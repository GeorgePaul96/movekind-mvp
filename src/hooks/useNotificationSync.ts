import { useEffect, useMemo } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import {
  scheduleOrCancelTwoDayReminder,
  scheduleDailyNudge,
} from '@/services/notifications';
import { computeMovementState } from '@/utils/movementState';

export function useNotificationSync(): void {
  const activities = useActivityStore((s) => s.activities);
  const reflections = useReflectionStore((s) => s.reflections);

  const mode = useMemo(
    () => computeMovementState(activities, reflections).mode,
    [activities, reflections],
  );

  // 2-day reminder: re-evaluate whenever activities change.
  useEffect(() => {
    scheduleOrCancelTwoDayReminder(activities);
  }, [activities]);

  // Daily nudge: re-schedule only when mode changes, not on every activity.
  useEffect(() => {
    scheduleDailyNudge(mode);
  }, [mode]);
}
