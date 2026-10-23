import { Platform } from 'react-native';

Object.defineProperty(Platform, 'OS', { get: () => 'ios' });

const mockN = {
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => [
    { identifier: 'old', content: { data: { kind: 'daily-reminder' } } },
    { identifier: 'other', content: { data: { kind: 'something-else' } } },
  ]),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
};
jest.mock('expo-notifications', () => mockN);

// Required (not imported) so the service loads after mockN exists.
const { disableDailyReminder, enableDailyReminder } = require('../src/services/notifications');
import { REMINDER_COPY } from '../src/constants/copy';

beforeEach(() => jest.clearAllMocks());

describe('daily reminder', () => {
  it('enabling schedules one daily reminder', async () => {
    mockN.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    await expect(enableDailyReminder()).resolves.toBe(true);
    expect(mockN.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old');
    expect(mockN.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('other');
    expect(mockN.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockN.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'MoveKind', body: REMINDER_COPY.body, data: { kind: 'daily-reminder' } },
      trigger: { type: 'daily', hour: 9, minute: 0 },
    });
  });

  it('denied permission resolves false and schedules nothing', async () => {
    mockN.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockN.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    await expect(enableDailyReminder()).resolves.toBe(false);
    expect(mockN.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('disabling cancels only the reminder', async () => {
    await disableDailyReminder();
    expect(mockN.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockN.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old');
  });

  it('the reminder copy is calm and never guilt-tripping', () => {
    expect(REMINDER_COPY.body).not.toMatch(/miss|streak|don't forget|lost|behind/i);
  });
});
