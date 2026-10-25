import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { localDayKey, startOfLocalDay } from '@/domain/garden/days';

/**
 * Daily steps from the phone's own counter, so the garden's grass can grow without a watch:
 * the iOS pedometer on iPhone, Health Connect on Android. Steps never leave the phone.
 *
 * Expo Go on Android has no Health Connect module, so there (and on web) this is a quiet
 * "not here" and nothing native is ever loaded. Every function resolves; none throws.
 */
export type StepsStatus = 'granted' | 'ask' | 'denied' | 'unavailable' | 'needs-full-app';

type HealthConnect = typeof import('react-native-health-connect');
type Sensors = typeof import('expo-sensors');

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const STEPS_PERMISSION = [{ accessType: 'read', recordType: 'Steps' }] as const;

function healthConnect(): HealthConnect | null {
  try {
    return require('react-native-health-connect') as HealthConnect;
  } catch {
    return null;
  }
}

function pedometer(): Sensors['Pedometer'] | null {
  try {
    return (require('expo-sensors') as Sensors).Pedometer;
  } catch {
    return null;
  }
}

/** Health Connect must be initialised once per launch before any call. */
let hcReady: Promise<HealthConnect | null> | null = null;
function readyHealthConnect(): Promise<HealthConnect | null> {
  hcReady ??= (async () => {
    const hc = healthConnect();
    if (!hc) return null;
    if ((await hc.getSdkStatus()) !== hc.SdkAvailabilityStatus.SDK_AVAILABLE) return null;
    return (await hc.initialize()) ? hc : null;
  })().catch(() => null);
  return hcReady;
}

const hasSteps = (perms: { accessType: string; recordType: string }[]) =>
  perms.some((p) => p.accessType === 'read' && p.recordType === 'Steps');

export async function stepsStatus(): Promise<StepsStatus> {
  try {
    if (Platform.OS === 'ios') {
      const p = pedometer();
      if (!p || !(await p.isAvailableAsync())) return 'unavailable';
      const { status } = await p.getPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'ask';
    }
    if (Platform.OS === 'android') {
      if (isExpoGo) return 'needs-full-app';
      const hc = await readyHealthConnect();
      if (!hc) return 'unavailable';
      return hasSteps(await hc.getGrantedPermissions()) ? 'granted' : 'ask';
    }
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/** Asks the phone for step access. Only ever called from a tap, never at launch. */
export async function requestStepsAccess(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const p = pedometer();
      return !!p && (await p.requestPermissionsAsync()).status === 'granted';
    }
    if (Platform.OS === 'android' && !isExpoGo) {
      const hc = await readyHealthConnect();
      return !!hc && hasSteps(await hc.requestPermission([...STEPS_PERMISSION]));
    }
    return false;
  } catch {
    return false;
  }
}

/** Steps for each of the last `days` local days (today up to `now`), keyed by localDayKey. */
export async function stepsByDay(days: number, now: Date = new Date()): Promise<Record<string, number>> {
  const ranges = Array.from({ length: days }, (_, i) => {
    const back = days - 1 - i;
    const start = startOfLocalDay(now, -back);
    return { key: localDayKey(start), start, end: back === 0 ? now : startOfLocalDay(now, -back + 1) };
  });
  try {
    if (Platform.OS === 'ios') {
      const p = pedometer();
      if (!p) return {};
      const out: Record<string, number> = {};
      for (const r of ranges) out[r.key] = (await p.getStepCountAsync(r.start, r.end)).steps;
      return out;
    }
    if (Platform.OS === 'android' && !isExpoGo) {
      const hc = await readyHealthConnect();
      if (!hc) return {};
      const out: Record<string, number> = {};
      for (const r of ranges) {
        const result = await hc.aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter: { operator: 'between', startTime: r.start.toISOString(), endTime: r.end.toISOString() },
        });
        out[r.key] = result.COUNT_TOTAL;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}
