/**
 * Steps come from the phone's own counter: the iOS pedometer on iPhone, Health Connect on
 * Android (development/store builds only; Expo Go on Android can't read daily steps).
 */
import { Platform } from 'react-native';

let mockOS = 'ios';
let mockEnv = 'bare';
Object.defineProperty(Platform, 'OS', { get: () => mockOS });

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { get executionEnvironment() { return mockEnv; } },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));

const mockPedometer = {
  isAvailableAsync: jest.fn(async () => true),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getStepCountAsync: jest.fn(async (start: Date) => ({ steps: start.getDate() * 100 })),
};
jest.mock('expo-sensors', () => ({ Pedometer: mockPedometer }));

const mockHC = {
  getSdkStatus: jest.fn(async () => 3),
  SdkAvailabilityStatus: { SDK_UNAVAILABLE: 1, SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2, SDK_AVAILABLE: 3 },
  initialize: jest.fn(async () => true),
  getGrantedPermissions: jest.fn(async () => [{ accessType: 'read', recordType: 'Steps' }]),
  requestPermission: jest.fn(async () => [{ accessType: 'read', recordType: 'Steps' }]),
  aggregateRecord: jest.fn(async ({ timeRangeFilter }: any) => ({
    COUNT_TOTAL: new Date(timeRangeFilter.startTime).getDate() * 10,
  })),
};
jest.mock('react-native-health-connect', () => mockHC);

function load(os: string, env = 'bare') {
  mockOS = os;
  mockEnv = env;
  let svc: typeof import('../src/services/steps');
  jest.isolateModules(() => {
    svc = require('../src/services/steps');
  });
  return svc!;
}

const NOW = new Date(2026, 9, 21, 15);

beforeEach(() => jest.clearAllMocks());

describe('steps on iPhone', () => {
  it("iOS reads today's steps from the pedometer", async () => {
    const svc = load('ios');
    expect(await svc.stepsStatus()).toBe('granted');
    const days = await svc.stepsByDay(2, NOW);
    expect(days).toEqual({ '2026-10-20': 2000, '2026-10-21': 2100 });
    const [start, end] = (mockPedometer.getStepCountAsync.mock.calls as any[]).at(-1)!;
    expect(start).toEqual(new Date(2026, 9, 21));
    expect(end).toEqual(NOW);
  });

  it('asks only when requested, and reports a refusal', async () => {
    mockPedometer.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    const svc = load('ios');
    expect(await svc.stepsStatus()).toBe('ask');
    expect(mockPedometer.requestPermissionsAsync).not.toHaveBeenCalled();
    mockPedometer.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    await expect(svc.requestStepsAccess()).resolves.toBe(false);
  });

  it('denied access resolves to empty and never throws', async () => {
    mockPedometer.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    mockPedometer.getStepCountAsync.mockRejectedValueOnce(new Error('not authorized'));
    const svc = load('ios');
    expect(await svc.stepsStatus()).toBe('denied');
    await expect(svc.stepsByDay(1, NOW)).resolves.toEqual({});
  });
});

describe('steps on Android', () => {
  it('Android reads aggregated steps from Health Connect', async () => {
    const svc = load('android');
    expect(await svc.stepsStatus()).toBe('granted');
    expect(await svc.stepsByDay(2, NOW)).toEqual({ '2026-10-20': 200, '2026-10-21': 210 });
    const last = (mockHC.aggregateRecord.mock.calls as any[]).at(-1)![0];
    expect(last.recordType).toBe('Steps');
    expect(new Date(last.timeRangeFilter.startTime)).toEqual(new Date(2026, 9, 21));
  });

  it('missing Health Connect app resolves to unavailable', async () => {
    mockHC.getSdkStatus.mockResolvedValueOnce(1);
    const svc = load('android');
    expect(await svc.stepsStatus()).toBe('unavailable');
  });

  it('requests only the read-steps permission', async () => {
    mockHC.getGrantedPermissions.mockResolvedValueOnce([]);
    const svc = load('android');
    expect(await svc.stepsStatus()).toBe('ask');
    await expect(svc.requestStepsAccess()).resolves.toBe(true);
    expect(mockHC.requestPermission).toHaveBeenCalledWith([{ accessType: 'read', recordType: 'Steps' }]);
  });

  it('Expo Go on Android needs the full app and never touches Health Connect', async () => {
    const svc = load('android', 'storeClient');
    expect(await svc.stepsStatus()).toBe('needs-full-app');
    await expect(svc.stepsByDay(3, NOW)).resolves.toEqual({});
    expect(mockHC.initialize).not.toHaveBeenCalled();
  });
});

describe('steps on web', () => {
  it('is unavailable', async () => {
    const svc = load('web');
    expect(await svc.stepsStatus()).toBe('unavailable');
  });
});
