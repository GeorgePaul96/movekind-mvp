import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { REMINDER_COPY } from '@/constants/copy';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go on Android has no push-notification module: importing `expo-notifications` there throws
 * at load ("runtime not ready"), which would crash launch. So the module is required lazily and
 * only where it works: dev builds, store builds, and iOS. Expo Go is detected two ways because
 * SDK 58's Expo Go doesn't always report itself through `executionEnvironment`, and the require
 * is wrapped so an unexpected failure still leaves a working app. Elsewhere every function is a no-op.
 */
const isExpoGo = isRunningInExpoGo() || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function loadNotifications(): NotificationsModule | null {
  if (Platform.OS === 'web' || (Platform.OS === 'android' && isExpoGo)) return null;
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch (err) {
    console.warn('Notifications are unavailable here:', err);
    return null;
  }
}

const Notifications = loadNotifications();

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
