import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { REMINDER_COPY } from '@/constants/copy';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go (SDK 53+) on Android throws as soon as `expo-notifications` is *imported*,
 * which would crash the app at launch before any try/catch runs. So the module is
 * required lazily and only where it works: dev builds, store builds, and iOS.
 * Everywhere else every function below is a quiet no-op.
 */
const isExpoGoAndroid =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const Notifications: NotificationsModule | null =
  Platform.OS === 'web' || isExpoGoAndroid ? null : (require('expo-notifications') as NotificationsModule);

export const notificationsAvailable = Notifications !== null;

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  } as any),
});

const REMINDER_KIND = 'daily-reminder';
/** Scheduled by the old session app; cleared so a reminder the user never chose stops firing. */
const LEGACY_KINDS = ['daily-nudge'];

async function cancelReminders(): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    const kind = n.content.data?.kind;
    if (kind === REMINDER_KIND || LEGACY_KINDS.includes(kind as string)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/**
 * Turns on the one optional daily reminder (9:00, local). Asks for permission only now,
 * never at launch. Resolves false when notifications are unavailable or not allowed.
 */
export async function enableDailyReminder(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return false;

    await cancelReminders();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'MoveKind', body: REMINDER_COPY.body, data: { kind: REMINDER_KIND } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
    });
    return true;
  } catch (err) {
    console.warn('Could not schedule the daily reminder:', err);
    return false;
  }
}

/** Turns the reminder off (and clears any reminder the old app scheduled). */
export async function disableDailyReminder(): Promise<void> {
  try {
    await cancelReminders();
  } catch {
    // best effort
  }
}
