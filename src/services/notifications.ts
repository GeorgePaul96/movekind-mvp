import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_LINES } from '@/constants/copy';
import { pickRandom } from '@/utils/format';
import { differenceInDays } from 'date-fns';
import type { Activity } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  } as any),
});

export async function initNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== 'granted') {
    const ask = await Notifications.requestPermissionsAsync();
    if (ask.status !== 'granted') return;
  }

  // Avoid stacking — cancel and reschedule a single daily nudge.
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'MoveKind',
      body: pickRandom(NOTIFICATION_LINES),
      data: { kind: 'daily-nudge' },
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    } as any,
  });
}


export async function sendNow(body: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'MoveKind', body },
      trigger: null,
    });
  } catch {
    // ignore — notifications are best effort
  }
}

const TWO_DAY_ID = 'movekind-two-day-rule';

export async function scheduleOrCancelTwoDayReminder(
  activities: Activity[],
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Always cancel any existing scheduled reminder first.
  try {
    await Notifications.cancelScheduledNotificationAsync(TWO_DAY_ID);
  } catch {
    // Notification may not exist — ignore.
  }

  if (activities.length === 0) return;

  const daysSinceLast = differenceInDays(new Date(), new Date(activities[0]!.performed_at));

  // Only fire when the user has been inactive for exactly 2 days.
  // More than 2 days is handled by the MovementStateCard anti-avoidance system.
  if (daysSinceLast !== 2) return;

  // Schedule for 7pm today if 7pm has not yet passed.
  const scheduledTime = new Date();
  scheduledTime.setHours(19, 0, 0, 0);
  if (scheduledTime <= new Date()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: TWO_DAY_ID,
      content: {
        title: 'MoveKind',
        body: 'Tomorrow is worth protecting. Just 10 minutes is enough.',
        data: { kind: 'two-day-rule' },
      },
      trigger: { date: scheduledTime } as any,
    });
  } catch {
    // Best-effort — non-fatal.
  }
}
