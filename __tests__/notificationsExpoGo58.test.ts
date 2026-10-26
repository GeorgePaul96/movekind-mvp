/**
 * SDK 58: Expo Go may not report itself through Constants.executionEnvironment, so the
 * service also asks expo's isRunningInExpoGo(). And if loading expo-notifications throws
 * anyway, launch must not crash.
 */
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'bare' },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));
let mockInExpoGo = true;
jest.mock('expo', () => ({ isRunningInExpoGo: () => mockInExpoGo }));
let mockLoads = 0;
jest.mock('expo-notifications', () => {
  mockLoads++;
  throw new Error("[runtime not ready]: Error: Cannot find native module 'ExpoTopicSubscriptionModule'");
});

/** Loads a fresh copy of the service on Android (each isolated load gets its own Platform). */
function loadOnAndroid() {
  let svc: typeof import('../src/services/notifications');
  jest.isolateModules(() => {
    const { Platform } = require('react-native');
    Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });
    svc = require('../src/services/notifications');
  });
  return svc!;
}

beforeEach(() => {
  mockLoads = 0;
});

describe('notifications on SDK 58', () => {
  it('Expo Go detected by isRunningInExpoGo never loads expo-notifications', async () => {
    mockInExpoGo = true;
    const svc = loadOnAndroid();
    expect(svc.notificationsAvailable).toBe(false);
    expect(mockLoads).toBe(0);
    await expect(svc.enableDailyReminder()).resolves.toBe(false);
  });

  it('if loading the module throws anyway, the app still starts and notifications are a no-op', async () => {
    mockInExpoGo = false;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const svc = loadOnAndroid();
    expect(mockLoads).toBe(1);
    expect(svc.notificationsAvailable).toBe(false);
    await expect(svc.disableDailyReminder()).resolves.toBeUndefined();
    warn.mockRestore();
  });
});
