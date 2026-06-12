import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

  await scheduleStateAwareNotification('regulated', true); // Default init nudge
}

/**
 * Selective notification cancellation and replacement (fixes cancelAll bug).
 */
export async function scheduleStateAwareNotification(
  yesterdayState: string,
  yesterdayCompleted: boolean
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // 1. Fetch all scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    // 2. Selectively cancel only daily nudge notifications to avoid wiping others
    for (const n of scheduled) {
      if (n.content.data?.kind === 'daily-nudge') {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    // 3. Formulate state-aware copy
    let body = "Check in when you're ready to compose today's nervous system session.";
    
    if (yesterdayState === 'overloaded') {
      body = yesterdayCompleted
        ? "Yesterday was Overloaded and you still showed up for active recovery. Check in when you're ready to tune today."
        : "Checking in after an Overloaded day is the best step. Take a breath and let's check in.";
    } else if (yesterdayState === 'activated') {
      body = yesterdayCompleted
        ? "You channeled your Activated energy yesterday. Let's check in to see how your body has recovered."
        : "Energy resets daily. Let's see how your capacity is looking this morning.";
    } else if (yesterdayState === 'recovering') {
      body = "You gently mobilized yesterday. Let's see if we are ready for strength today.";
    } else if (yesterdayState === 'regulated') {
      body = "You completed a steady session yesterday. Tap to compose today's capacity routine.";
    }

    // 4. Schedule new notification for 9am tomorrow
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MoveKind',
        body,
        data: { kind: 'daily-nudge' },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch (err) {
    console.warn('Could not schedule state-aware notification:', err);
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
