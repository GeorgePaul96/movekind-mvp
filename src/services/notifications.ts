import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_LINES } from '@/constants/copy';
import { pickRandom } from '@/utils/format';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
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
    },
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
