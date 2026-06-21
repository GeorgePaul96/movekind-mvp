import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { nudgeBodyFor } from '@/constants/copy';
import type { RecoverySignal } from '@/domain/behavioral/types';

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

  await scheduleAdaptiveNudge(null); // neutral default until a profile is computed
}

/**
 * Reschedules the single repeating 9am "daily-nudge" with copy adapted to the
 * user's recovery signal. Cancels only its own daily-nudge entries (not others).
 */
export async function scheduleAdaptiveNudge(signal: RecoverySignal | null): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.kind === 'daily-nudge') {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MoveKind',
        body: nudgeBodyFor(signal),
        data: { kind: 'daily-nudge' },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch (err) {
    console.warn('Could not schedule adaptive nudge:', err);
  }
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
