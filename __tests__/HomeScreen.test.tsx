import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../src/screens/main/HomeScreen';
import { BODY_COPY, HOME_COPY, INSIGHTS_COPY, WATER_COPY, WORKOUT_COPY, YARD_COPY } from '../src/constants/copy';
import { breathAt, careToday } from '../src/domain/home/care';
import { __resetDbCacheForTests, db } from '../src/services/db';
import { telemetry } from '../src/services/telemetry';
import { useBodyStore } from '../src/store/bodyStore';
import { useGardenStore } from '../src/store/gardenStore';
import { useSettingsStore } from '../src/store/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => 'ask',
  requestStepsAccess: async () => false,
  stepsByDay: async () => ({}),
}));
jest.mock('../src/services/notifications', () => ({
  enableDailyReminder: jest.fn(async () => true),
  disableDailyReminder: jest.fn(),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({
    checkIns: [], water: [], workouts: [], meals: [], sleep: [], goodThings: [],
    stepsToday: null, stepsByDay: {}, stepsStatus: 'unknown', loaded: false, error: null,
  });
  useBodyStore.getState().clear();
  await useSettingsStore.getState().reset();
});

const open = async () => {
  render(<HomeScreen />);
  await waitFor(() => expect(useGardenStore.getState().loaded).toBe(true));
};

describe('the simple home', () => {
  it('opens on Today with nothing noted and no targets', async () => {
    await open();
    expect(screen.getByText(/^Good (morning|afternoon|evening)$/)).toBeTruthy();
    expect(screen.getByLabelText(HOME_COPY.careA11y(HOME_COPY.care.water, false))).toBeTruthy();
    expect(screen.getByText(WATER_COPY.count(0))).toBeTruthy();
    expect(screen.queryByText(/goal|target|streak|missed/i)).toBeNull();
  });

  it('logs water, and the water dot warms up', async () => {
    await open();
    await act(async () => fireEvent.press(screen.getByText(HOME_COPY.waterAdd)));
    await waitFor(() => expect(screen.getByText(WATER_COPY.count(1))).toBeTruthy());
    expect(screen.getByLabelText(HOME_COPY.careA11y(HOME_COPY.care.water, true))).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByLabelText(HOME_COPY.waterUndoA11y)));
    await waitFor(() => expect(screen.getByText(WATER_COPY.count(0))).toBeTruthy());
  });

  it('logs a mood and answers kindly', async () => {
    await open();
    await act(async () => fireEvent.press(screen.getByText(YARD_COPY.moods.tired.label)));
    await waitFor(() => expect(screen.getByText(HOME_COPY.moodLine.tired)).toBeTruthy());
    expect(useGardenStore.getState().todayYardMood()).toBe('tired');
    await act(async () => fireEvent.press(screen.getByText(HOME_COPY.unwell)));
    await waitFor(() => expect(screen.getByText(HOME_COPY.unwellLine)).toBeTruthy());
  });

  it('logs meals by toggling', async () => {
    await open();
    await act(async () => fireEvent.press(screen.getByText(YARD_COPY.foodSheet.meals.lunch)));
    await waitFor(() => expect(useGardenStore.getState().mealsToday()).toEqual(['lunch']));
    await act(async () => fireEvent.press(screen.getByText(YARD_COPY.foodSheet.meals.lunch)));
    await waitFor(() => expect(useGardenStore.getState().mealsToday()).toEqual([]));
  });

  it('logs movement and can remove it', async () => {
    await open();
    expect(screen.queryByText(HOME_COPY.movementAdd)).toBeNull();
    fireEvent.press(screen.getByText(WORKOUT_COPY.types.yoga));
    fireEvent.press(screen.getByLabelText(WORKOUT_COPY.durationA11y(20)));
    await act(async () => fireEvent.press(screen.getByText(HOME_COPY.movementAdd)));
    await waitFor(() => expect(screen.getByText(WORKOUT_COPY.entry('yoga', 20))).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByLabelText(WORKOUT_COPY.deleteA11y('yoga', 20))));
    await waitFor(() => expect(useGardenStore.getState().workouts).toHaveLength(0));
  });

  it('logs sleep in half hours', async () => {
    await open();
    fireEvent.press(screen.getByLabelText(HOME_COPY.sleepMoreA11y));
    fireEvent.press(screen.getByText(YARD_COPY.sleepSheet.feels.deep));
    await act(async () => fireEvent.press(screen.getByText(HOME_COPY.sleepSave)));
    await waitFor(() => expect(useGardenStore.getState().lastNightSleep()).toMatchObject({ hours: 7.5, feel: 'deep' }));
  });

  it('keeps one good thing a day, and never sends the words', async () => {
    await open();
    fireEvent.changeText(screen.getByLabelText(HOME_COPY.goodLabel), '  Tea in the sun  ');
    await act(async () => fireEvent.press(screen.getByText(HOME_COPY.goodSave)));
    await waitFor(() => expect(useGardenStore.getState().todayGoodThing()?.text).toBe('Tea in the sun'));
    fireEvent.changeText(screen.getByLabelText(HOME_COPY.goodLabel), 'A call with Mum');
    await act(async () => fireEvent.press(screen.getByText(HOME_COPY.goodSave)));
    await waitFor(() => expect(useGardenStore.getState().todayGoodThing()?.text).toBe('A call with Mum'));
    expect(await db.goodThings.all()).toHaveLength(1);
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'good_thing' });
    expect(JSON.stringify((telemetry.capture as jest.Mock).mock.calls)).not.toContain('Mum');
    // Clearing it removes it.
    fireEvent.changeText(screen.getByLabelText(HOME_COPY.goodLabel), '');
    await act(async () => fireEvent.press(screen.getByText(HOME_COPY.goodSave)));
    await waitFor(() => expect(useGardenStore.getState().goodThings).toHaveLength(0));
  });

  it('paces a slow breath', async () => {
    jest.useFakeTimers();
    try {
      render(<HomeScreen />);
      fireEvent.press(screen.getByText(HOME_COPY.breathStart));
      expect(screen.getByText(HOME_COPY.breathIn)).toBeTruthy();
      act(() => jest.advanceTimersByTime(5000));
      expect(screen.getByText(HOME_COPY.breathOut)).toBeTruthy();
      act(() => jest.advanceTimersByTime(55000));
      expect(screen.getByText(HOME_COPY.breathDone)).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('reaches every other part of the app from the tabs', async () => {
    await open();
    fireEvent.press(screen.getByLabelText(HOME_COPY.tabA11y(HOME_COPY.tabs.insights)));
    expect(screen.getByText(INSIGHTS_COPY.patternsTitle)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.reportTitle)).toBeNull();
    fireEvent.press(screen.getByLabelText(HOME_COPY.tabA11y(HOME_COPY.tabs.you)));
    expect(screen.getByLabelText(BODY_COPY.switchLabel)).toBeTruthy();
    expect(screen.getByLabelText(HOME_COPY.yardLabel)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(HOME_COPY.tabA11y(HOME_COPY.tabs.changes)));
    expect(screen.queryByLabelText(HOME_COPY.yardLabel)).toBeNull();
  });

  it('the yard is off by default and the choice survives a restart', async () => {
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().yardHome).toBe(false);
    await useSettingsStore.getState().setYardHome(true);
    useSettingsStore.setState({ yardHome: false });
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().yardHome).toBe(true);
  });
});

describe('home maths', () => {
  it('a dot fills when its kind is noted today, and only then', () => {
    const now = new Date(2026, 10, 10, 12);
    const iso = new Date(2026, 10, 10, 9).toISOString();
    const yesterday = new Date(2026, 10, 9, 9).toISOString();
    const none = { checkIns: [], water: [], meals: [], workouts: [], sleep: [] };
    expect(careToday(none, now)).toEqual({ mood: false, water: false, food: false, movement: false, sleep: false });
    expect(
      careToday(
        {
          ...none,
          water: [{ id: 'w', created_at: iso }],
          meals: [{ id: 'm', meal: 'lunch', created_at: yesterday }],
          sleep: [{ id: 's', night_of: '2026-11-10', hours: 7, feel: null, created_at: iso }],
        },
        now,
      ),
    ).toEqual({ mood: false, water: true, food: false, movement: false, sleep: true });
  });

  it('breathing is five in, five out, then done', () => {
    expect(breathAt(0, 1)).toEqual({ phase: 'in', count: 1 });
    expect(breathAt(4, 1)).toEqual({ phase: 'in', count: 5 });
    expect(breathAt(5, 1)).toEqual({ phase: 'out', count: 1 });
    expect(breathAt(9, 1)).toEqual({ phase: 'out', count: 5 });
    expect(breathAt(10, 1)).toEqual({ phase: 'in', count: 1 });
    expect(breathAt(60, 1)).toEqual({ phase: 'done', count: 0 });
    expect(breathAt(60, 3).phase).toBe('in');
  });
});
