import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';
import { useBodyStore } from '../src/store/bodyStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { telemetry } from '../src/services/telemetry';
import { sanitizeProperties } from '../src/services/telemetryPrivacy';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

const store = () => useBodyStore.getState();

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  store().clear();
  await useSettingsStore.getState().reset();
});

describe('bodyStore', () => {
  it('starts with an empty profile and a 7.5 hour sleep need', async () => {
    await store().load();
    expect(store().profile).toEqual({ sex: null, birth_year: null, height_cm: null, sleep_need_hours: 7.5 });
  });

  it('two saves on one day leave one merged row', async () => {
    await store().logMeasurement({ weight_kg: 80 });
    await store().logMeasurement({ waist_cm: 90, weight_kg: undefined });
    const rows = await db.measurements.all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ weight_kg: 80, waist_cm: 90 });
    expect(store().measurements).toHaveLength(1);
  });

  it('reports only that a measurement was logged', async () => {
    await store().logMeasurement({ weight_kg: 80 });
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'measurement' });
  });

  it('logs a pulse, newest first', async () => {
    await store().logPulse(61.4);
    expect(store().pulses[0].bpm).toBe(61);
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'pulse' });
  });

  it('eraseAll clears body data', async () => {
    await store().saveProfile({ sex: 'male', birth_year: 1990, height_cm: 178 });
    await store().logMeasurement({ weight_kg: 80 });
    await store().logPulse(60);
    await db.eraseAll();
    __resetDbCacheForTests();
    expect(await db.measurements.all()).toEqual([]);
    expect(await db.pulse.all()).toEqual([]);
    expect((await db.body.get()).height_cm).toBeNull();
  });
});

describe('body settings', () => {
  it('body numbers are off by default and survive a restart once on', async () => {
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().bodyEnabled).toBe(false);
    expect(useSettingsStore.getState().units).toBe('metric');
    await useSettingsStore.getState().setBodyEnabled(true);
    await useSettingsStore.getState().setUnits('imperial');
    useSettingsStore.setState({ bodyEnabled: false, units: 'metric' });
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().bodyEnabled).toBe(true);
    expect(useSettingsStore.getState().units).toBe('imperial');
  });
});

describe('telemetry privacy', () => {
  it('strips body values', () => {
    expect(
      sanitizeProperties({ kind: 'measurement', weight_kg: 80, waist_cm: 90, neck_cm: 38, hip_cm: 100, height_cm: 178, bpm: 60, birth_year: 1990, sex: 'male' }),
    ).toEqual({ kind: 'measurement' });
  });
});
