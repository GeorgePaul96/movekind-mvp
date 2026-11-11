import React from 'react';
import { Share } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InsightsView from '../src/screens/main/InsightsView';
import { BODY_COPY, INSIGHTS_COPY } from '../src/constants/copy';
import { __resetDbCacheForTests, db } from '../src/services/db';
import { useBodyStore } from '../src/store/bodyStore';
import { useGardenStore } from '../src/store/gardenStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { buildReport } from '../src/domain/insights/report';
import { bodySummary } from '../src/domain/body/summary';
import { fromDisplayWeight, parseNumber, toDisplayLength } from '../src/domain/body/units';
import type { BodyProfile, Measurement } from '../src/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => 'denied',
  requestStepsAccess: async () => false,
  stepsByDay: async () => ({}),
}));

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const row = (daysAgo: number, v: Partial<Measurement>): Measurement => ({
  id: `m${daysAgo}`,
  day: dayKey(daysAgo),
  created_at: new Date().toISOString(),
  ...v,
});
const man: BodyProfile = { sex: 'male', birth_year: new Date().getFullYear() - 35, height_cm: 178, sleep_need_hours: 7.5 };

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useBodyStore.setState({ profile: null, measurements: [], pulses: [], loaded: true });
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], meals: [], sleep: [], stepsByDay: {}, stepsStatus: 'unknown' });
  await useSettingsStore.getState().reset();
});

const enable = () =>
  act(async () => {
    await useSettingsStore.getState().markBodyNoticeSeen();
    await useSettingsStore.getState().setBodyEnabled(true);
  });

describe('InsightsView', () => {
  it('shows no body numbers until they are switched on', () => {
    useBodyStore.setState({ profile: man, measurements: [row(0, { weight_kg: 80 })] });
    render(<InsightsView />);
    expect(screen.getByText(INSIGHTS_COPY.patternsTitle)).toBeTruthy();
    expect(screen.getByText(INSIGHTS_COPY.exportButton)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.reportTitle)).toBeNull();
    expect(screen.queryByText(INSIGHTS_COPY.sleepTitle)).toBeNull();
    expect(screen.queryByText(INSIGHTS_COPY.fitnessTitle)).toBeNull();
  });

  it('asks for details first once switched on', async () => {
    render(<InsightsView />);
    await enable();
    expect(screen.getByText(BODY_COPY.detailsTitle)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.reportTitle)).toBeNull();
  });

  it('saves details and rejects a slip', async () => {
    render(<InsightsView />);
    await enable();
    fireEvent.press(screen.getByText(BODY_COPY.saveDetails));
    expect(screen.getByText(BODY_COPY.invalid.sex)).toBeTruthy();
    fireEvent.press(screen.getByText(BODY_COPY.sex.male));
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.birthYear), '1990');
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.height('cm')), '500');
    fireEvent.press(screen.getByText(BODY_COPY.saveDetails));
    expect(screen.getByText(BODY_COPY.invalid.height)).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.height('cm')), '178');
    await act(async () => fireEvent.press(screen.getByText(BODY_COPY.saveDetails)));
    await waitFor(() => expect(useBodyStore.getState().profile?.height_cm).toBe(178));
    expect((await db.body.get()).sex).toBe('male');
    expect(screen.getByText(BODY_COPY.needWeight)).toBeTruthy();
  });

  it('under 18s see a kind note and no numbers', async () => {
    useBodyStore.setState({ profile: { ...man, birth_year: new Date().getFullYear() - 15 }, measurements: [row(0, { weight_kg: 50 })] });
    render(<InsightsView />);
    await enable();
    expect(screen.getByText(BODY_COPY.minor)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.reportTitle)).toBeNull();
    expect(screen.queryByText(INSIGHTS_COPY.fitnessTitle)).toBeNull();
  });

  it('shows the report with sources, and says how many weigh-ins a trend still needs', async () => {
    useBodyStore.setState({ profile: man, measurements: [row(3, { weight_kg: 81 }), row(0, { weight_kg: 80, neck_cm: 38, waist_cm: 90 })] });
    render(<InsightsView />);
    await enable();
    expect(screen.getByText(BODY_COPY.reportTitle)).toBeTruthy();
    expect(screen.getByText('80 kg')).toBeTruthy();
    expect(screen.getByText(BODY_COPY.rows.leanMass)).toBeTruthy();
    expect(screen.getAllByText(/^Source: /).length).toBeGreaterThan(2);
    expect(screen.getByText(BODY_COPY.needMore(2, 11))).toBeTruthy();
  });

  it('rejects impossible measurements kindly and stores imperial entries as metric', async () => {
    useBodyStore.setState({ profile: man, measurements: [] });
    render(<InsightsView />);
    await enable();
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.weight('kg')), '5');
    fireEvent.press(screen.getByText(BODY_COPY.saveMeasure));
    expect(screen.getByText(BODY_COPY.invalid.weight)).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.weight('kg')), '80');
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.waist('cm')), '500');
    fireEvent.press(screen.getByText(BODY_COPY.saveMeasure));
    expect(screen.getByText(BODY_COPY.invalid.waist)).toBeTruthy();
    expect(useBodyStore.getState().measurements).toHaveLength(0);

    await act(async () => useSettingsStore.getState().setUnits('imperial'));
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.weight('lb')), '180');
    fireEvent.changeText(screen.getByLabelText(BODY_COPY.waist('in')), '');
    await act(async () => fireEvent.press(screen.getByText(BODY_COPY.saveMeasure)));
    await waitFor(() => expect(useBodyStore.getState().measurements).toHaveLength(1));
    expect(useBodyStore.getState().measurements[0].weight_kg).toBe(81.6);
  });

  it('shows a projection with figures once there is a trend', async () => {
    const rows = [28, 21, 14, 7, 0].map((ago) => row(ago, { weight_kg: 90 - ((28 - ago) / 7) * 0.4, neck_cm: 39, waist_cm: 98 }));
    useBodyStore.setState({ profile: man, measurements: rows });
    render(<InsightsView />);
    await enable();
    expect(screen.getByText(BODY_COPY.later(12))).toBeTruthy();
    expect(screen.getByText(BODY_COPY.now)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(BODY_COPY.spanA11y(26)));
    expect(screen.getByText(BODY_COPY.later(26))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(BODY_COPY.whatIfMore));
    expect(screen.getByText(BODY_COPY.whatIf(1000))).toBeTruthy();
  });

  it('replaces a too-fast projection with a calm note and no figures', async () => {
    const rows = [28, 21, 14, 7, 0].map((ago) => row(ago, { weight_kg: 75 - ((28 - ago) / 7) * 1.3, neck_cm: 38, waist_cm: 85 }));
    useBodyStore.setState({ profile: man, measurements: rows });
    render(<InsightsView />);
    await enable();
    expect(screen.getByText(BODY_COPY.tooFast)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.now)).toBeNull();
    expect(screen.queryByText(BODY_COPY.whatIfTitle)).toBeNull();
  });

  it('shares a report', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    render(<InsightsView />);
    await act(async () => fireEvent.press(screen.getByText(INSIGHTS_COPY.exportButton)));
    expect(share).toHaveBeenCalledTimes(1);
    expect((share.mock.calls[0][0] as { message: string }).message).toContain(INSIGHTS_COPY.report.heading);
  });
});

describe('report', () => {
  const NOW = new Date();
  const measurements = [28, 21, 14, 7, 0].map((ago) => row(ago, { weight_kg: 90 - ((28 - ago) / 7) * 0.4, neck_cm: 39, waist_cm: 98 }));
  const base = { name: 'Sam', checkIns: [], water: [], workouts: [], meals: [], sleep: [], patterns: [], units: 'metric' as const };
  const body = {
    profile: man,
    measurements,
    pulses: [],
    summary: bodySummary({ profile: man, measurements, workouts: [] }, NOW),
    sleepBalance: { hoursBehind: 3, nights: 8 },
    stepsHealth: { average: 6400, relativeRisk: 0.58, plateau: [8000, 10000] as [number, number] },
  };

  it('leaves every body number out when the section is off', () => {
    const r = buildReport({ ...base, bodyEnabled: false, body }, NOW);
    expect(r.text).not.toMatch(/kg|Body fat|kcal|Sources/i);
    expect(r.json).not.toMatch(/weight_kg|waist_cm|measurements|birth_year/);
    expect(JSON.parse(r.json).name).toBe('Sam');
  });

  it('includes the numbers, the projection and their sources when on', () => {
    const r = buildReport({ ...base, bodyEnabled: true, body }, NOW);
    expect(r.text).toContain(BODY_COPY.rows.bodyFat);
    expect(r.text).toContain(BODY_COPY.later(26));
    expect(r.text).toContain('Hodgdon');
    expect(r.text).toContain('Hall KD');
    expect(r.text).toContain('Paluch');
    expect(r.text).not.toContain('—');
    expect(JSON.parse(r.json).measurements).toHaveLength(5);
  });
});

describe('units', () => {
  it('converts and parses', () => {
    expect(Math.round(fromDisplayWeight(180, 'imperial') * 10) / 10).toBe(81.6);
    expect(toDisplayLength(254, 'imperial')).toBeCloseTo(100, 6);
    expect(parseNumber('80,5')).toBe(80.5);
    expect(parseNumber(' 80.5 ')).toBe(80.5);
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('-4')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });
});
