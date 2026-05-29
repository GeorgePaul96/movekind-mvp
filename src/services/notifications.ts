import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { differenceInDays } from 'date-fns';
import type { Activity } from '@/types';
import type { MovementMode } from '@/utils/movementState';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  } as any),
});

const DAILY_NUDGE_ID = 'movekind-daily-nudge';
const TWO_DAY_ID = 'movekind-two-day-rule';

// State-aware copy — each mode gets contextually appropriate language.
// RESTING returns null to suppress the daily nudge entirely.
function dailyNudgeCopy(mode: MovementMode): string | null {
  switch (mode) {
    case 'inactive':
      return "It's been a while. One small movement — no performance required.";
    case 'returning':
      return 'Back at it. Start with whatever feels manageable today.';
    case 'resting':
      return null; // no nudge during deliberate rest
    case 'building':
      return "You've been moving. Keep the pattern going.";
    case 'steady':
      return 'Solid rhythm this week. How does your body feel today?';
  }
}

export async function initNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== 'granted') {
    const ask = await Notifications.requestPermissionsAsync();
    if (ask.status !== 'granted') return;
  }
  // Schedule the daily nudge with the default (building) copy.
  // useNotificationSync will update it with the real mode once data loads.
  await scheduleDailyNudge('building');
}

export async function scheduleDailyNudge(mode: MovementMode): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel only the daily nudge — never touch other scheduled notifications.
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_NUDGE_ID);
  } catch {
    // Not scheduled yet — ignore.
  }

  const body = dailyNudgeCopy(mode);
  if (!body) return; // RESTING mode: no nudge

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NUDGE_ID,
      content: {
        title: 'MoveKind',
        body,
        data: { kind: 'daily-nudge', mode },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch {
    // Best-effort — non-fatal.
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

export async function scheduleOrCancelTwoDayReminder(
  activities: Activity[],
): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel only the 2-day reminder — never touch other scheduled notifications.
  try {
    await Notifications.cancelScheduledNotificationAsync(TWO_DAY_ID);
  } catch {
    // Not scheduled yet — ignore.
  }

  if (activities.length === 0) return;

  const daysSinceLast = differenceInDays(new Date(), new Date(activities[0]!.performed_at));

  // Only fire when the user has been inactive for exactly 2 days.
  if (daysSinceLast !== 2) return;

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
