import { useEffect } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { scheduleOrCancelTwoDayReminder } from '@/services/notifications';

export function useNotificationSync(): void {
  const activities = useActivityStore((s) => s.activities);

  useEffect(() => {
    scheduleOrCancelTwoDayReminder(activities);
  }, [activities]);
}
