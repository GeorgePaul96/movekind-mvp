/**
 * Expo Go (SDK 53+) on Android throws the moment `expo-notifications` is imported
 * ("runtime not ready: … removed from Expo Go"). The app must still boot there:
 * the service may not load the module at all in that environment.
 */

import { Platform } from 'react-native';

Object.defineProperty(Platform, 'OS', { get: () => 'android' });

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'storeClient' },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));
jest.mock('expo-notifications', () => {
  throw new Error('expo-notifications: Android Push notifications … removed from Expo Go');
});

describe('notifications service in Expo Go on Android', () => {
  it('loads without importing expo-notifications', () => {
    expect(() => require('../src/services/notifications')).not.toThrow();
  });

  it('every entry point is a quiet no-op', async () => {
    const svc = require('../src/services/notifications');
    expect(svc.notificationsAvailable).toBe(false);
    await expect(svc.enableDailyReminder()).resolves.toBe(false);
    await expect(svc.disableDailyReminder()).resolves.toBeUndefined();
  });
});
