import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../src/screens/main/HomeScreen';
import { COMPANION_COPY, FLOW_COPY, HOME_COPY, WORKOUT_COPY } from '../src/constants/copy';
import { localDayKey } from '../src/domain/garden/days';
import { dayFacts, dayPace, hasAnything, yesterdayRepeat } from '../src/domain/home/companion';
import { __resetDbCacheForTests, db } from '../src/services/db';
import { telemetry } from '../src/services/telemetry';
import { sanitizeProperties } from '../src/services/telemetryPrivacy';
import { useBodyStore } from '../src/store/bodyStore';
import { useGardenStore } from '../src/store/gardenStore';
import { useSettingsStore } from '../src/store/settingsStore';
import type { CalorieLog, MealLog, Workout } from '../src/types';

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

const garden = () => useGardenStore.getState();
const NOW = new Date(2026, 10, 11, 12);
const at = (daysAgo: number, hour = 9) => new Date(2026, 10, 11 - daysAgo, hour).toISOString();

describe("today's pace", () => {
  const pace = (sleepHours: number | null, mood: Parameters<typeof dayPace>[0]['mood'], pause: Parameters<typeof dayPace>[0]['pause'] = null) =>
    dayPace({ sleepHours, mood, pause });

  it('is unknown until something is noted: nothing is assumed', () => {
    expect(pace(null, null)).toBeNull();
  });

  it('a very short night or a tired mood settles on rest, whatever the other says', () => {
    expect(pace(4.5, 'buzzing')).toEqual({ pace: 'rest', reason: 'short-night' });
    expect(pace(8, 'tired')).toEqual({ pace: 'rest', reason: 'low-mood' });
    expect(pace(5, null)).toEqual({ pace: 'rest', reason: 'short-night' });
    expect(pace(null, 'tired')).toEqual({ pace: 'rest', reason: 'low-mood' });
  });

  it('mixed signals are taken gently, never talked up', () => {
    expect(pace(8, 'low')).toEqual({ pace: 'gentle', reason: 'mixed' });
    expect(pace(6, 'buzzing')).toEqual({ pace: 'gentle', reason: 'mixed' });
  });

  it('reads ordinary days', () => {
    expect(pace(6, 'low')).toEqual({ pace: 'gentle', reason: 'standard' });
    expect(pace(7, 'steady')).toEqual({ pace: 'steady', reason: 'standard' });
    expect(pace(8, 'steady')).toEqual({ pace: 'steady', reason: 'standard' });
    expect(pace(8, 'buzzing')).toEqual({ pace: 'bright', reason: 'standard' });
    expect(pace(7, 'buzzing')).toEqual({ pace: 'bright', reason: 'standard' });
    expect(pace(10, 'steady')).toEqual({ pace: 'steady', reason: 'standard' }); // a very long night is not "great"
  });

  it('works from one signal alone', () => {
    expect(pace(null, 'buzzing')!.pace).toBe('bright');
    expect(pace(null, 'frustrated')!.pace).toBe('gentle');
    expect(pace(8, null)!.pace).toBe('steady'); // sleep alone never claims a bright day
    expect(pace(6, null)!.pace).toBe('gentle');
  });

  it('a pause always means rest', () => {
    expect(pace(8, 'buzzing', 'travelling')).toEqual({ pace: 'rest', reason: 'pause' });
    expect(pace(null, null, 'unwell')).toEqual({ pace: 'rest', reason: 'pause' });
  });

  it('no pace line sets a target or tells anyone how to move or eat', () => {
    const lines = (['rest', 'gentle', 'steady', 'bright'] as const).flatMap((p) =>
      (['short-night', 'low-mood', 'mixed', 'standard'] as const).map((r) => COMPANION_COPY.line(p, r)),
    );
    for (const line of [...lines, ...Object.values(COMPANION_COPY.pauseLine)]) {
      expect(line).not.toMatch(/\b(goal|target|should|must|workout|stretch|run|calories?|kcal)\b|\d/i);
    }
  });
});

describe('same as yesterday', () => {
  const meal = (daysAgo: number, m: MealLog['meal']): MealLog => ({ id: `${daysAgo}${m}`, meal: m, created_at: at(daysAgo) });
  const move = (daysAgo: number, type: Workout['type'], minutes: number): Workout => ({ id: `${daysAgo}${type}${minutes}`, type, minutes, created_at: at(daysAgo, 18) });
  const kcal = (day: string, n: number): CalorieLog => ({ id: day, day, kcal: n, created_at: at(0) });

  it("offers yesterday's meals, movement and calories while today is empty", () => {
    const r = yesterdayRepeat(
      {
        meals: [meal(1, 'dinner'), meal(1, 'breakfast'), meal(2, 'snack')],
        workouts: [move(1, 'walk', 30), move(1, 'walk', 30), move(1, 'yoga', 20), move(3, 'run', 45)],
        calories: [kcal('2026-11-10', 1900)],
      },
      NOW,
    );
    expect(r.meals).toEqual(['breakfast', 'dinner']);
    expect(r.workouts).toEqual([{ type: 'walk', minutes: 30 }, { type: 'yoga', minutes: 20 }]);
    expect(r.kcal).toBe(1900);
  });

  it('never offers to overwrite what today already has', () => {
    const r = yesterdayRepeat(
      {
        meals: [meal(1, 'dinner'), meal(0, 'lunch')],
        workouts: [move(1, 'walk', 30), move(0, 'walk', 30)],
        calories: [kcal('2026-11-10', 1900), kcal('2026-11-11', 500)],
      },
      NOW,
    );
    expect(r).toEqual({ meals: [], workouts: [], kcal: null });
  });

  it('offers nothing when yesterday was empty', () => {
    expect(yesterdayRepeat({ meals: [], workouts: [], calories: [] }, NOW)).toEqual({ meals: [], workouts: [], kcal: null });
  });
});

describe('the facts of a day', () => {
  it('lists only what happened', () => {
    const empty = { checkIns: [], water: [], meals: [], workouts: [], sleep: [], goodThings: [] };
    expect(hasAnything(dayFacts(empty, NOW))).toBe(false);
    const f = dayFacts(
      {
        ...empty,
        water: [{ id: 'a', created_at: at(0) }, { id: 'b', created_at: at(0, 14) }, { id: 'c', created_at: at(1) }],
        workouts: [{ id: 'w', type: 'walk', minutes: 25, created_at: at(0, 18) }],
        goodThings: [{ id: 'g', day: '2026-11-11', text: 'Tea', created_at: at(0) }],
      },
      NOW,
    );
    expect(f).toEqual({ mood: null, glasses: 2, meals: [], moveMinutes: 25, sleepHours: null, goodThing: 'Tea' });
    expect(hasAnything(f)).toBe(true);
  });
});

describe('the day on the homepage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    __resetDbCacheForTests();
    useGardenStore.setState({
      checkIns: [], water: [], workouts: [], meals: [], sleep: [], goodThings: [], calories: [], dayStates: [],
      stepsToday: null, stepsByDay: {}, stepsStatus: 'unknown', loaded: false, error: null,
    });
    useBodyStore.getState().clear();
    await useSettingsStore.getState().reset();
    await useSettingsStore.getState().markFlowSeen(localDayKey(new Date()));
  });

  const openHome = async () => {
    render(<HomeScreen />);
    await waitFor(() => expect(garden().loaded).toBe(true));
  };
  const press = (label: string) => act(async () => fireEvent.press(screen.getByText(label)));
  const pressA11y = (label: string) => act(async () => fireEvent.press(screen.getByLabelText(label)));

  it('shows no pace until something is known, then reads sleep and mood together', async () => {
    await openHome();
    expect(screen.queryByText(/^Today's pace/)).toBeNull();
    await act(async () => garden().logSleep(4.5, null));
    expect(screen.getByText(COMPANION_COPY.paceLabel('Rest'))).toBeTruthy();
    expect(screen.getByText(COMPANION_COPY.line('rest', 'short-night'))).toBeTruthy();
    await act(async () => garden().logSleep(8, null));
    await act(async () => garden().logYardMood('buzzing'));
    expect(screen.getByText(COMPANION_COPY.paceLabel('Bright'))).toBeTruthy();
  });

  it('a pause can be set without a mood, keeps only water and rest in view, and stays private', async () => {
    await openHome();
    await pressA11y(HOME_COPY.editA11y(HOME_COPY.care.mood));
    await press(COMPANION_COPY.pauses.overwhelmed);
    await press(FLOW_COPY.done);
    await waitFor(() => expect(screen.getByText(COMPANION_COPY.pauseLine.overwhelmed)).toBeTruthy());
    expect(garden().checkIns).toHaveLength(0);
    expect(screen.getByText(COMPANION_COPY.paceLabel('Rest'))).toBeTruthy();
    expect(screen.getByLabelText(HOME_COPY.editA11y(HOME_COPY.care.water))).toBeTruthy();
    expect(screen.getByLabelText(HOME_COPY.editA11y(HOME_COPY.care.sleep))).toBeTruthy();
    expect(screen.queryByLabelText(HOME_COPY.editA11y(HOME_COPY.care.movement))).toBeNull();
    expect(screen.queryByLabelText(HOME_COPY.editA11y(HOME_COPY.care.food))).toBeNull();
    expect(telemetry.capture).not.toHaveBeenCalled();
    expect(sanitizeProperties({ pause: 'overwhelmed' })).toEqual({});

    await press(COMPANION_COPY.pausedShowAll);
    expect(screen.getByLabelText(HOME_COPY.editA11y(HOME_COPY.care.movement))).toBeTruthy();
    await press(COMPANION_COPY.pauseEnd);
    await waitFor(() => expect(garden().todayState()?.pause).toBeNull());
    expect(screen.queryByText(COMPANION_COPY.pauseLine.overwhelmed)).toBeNull();
  });

  it('closing the day lists only what happened and puts the numbers away', async () => {
    await db.water.add();
    await db.water.add();
    await db.calories.setDay(localDayKey(new Date()), 2400);
    await openHome();
    await act(async () => garden().addWorkout('walk', 30));
    await press(COMPANION_COPY.closeButton);
    await waitFor(() => expect(screen.getByText(COMPANION_COPY.closedTitle)).toBeTruthy());
    expect(screen.getByText(COMPANION_COPY.did.water(2))).toBeTruthy();
    expect(screen.getByText(COMPANION_COPY.did.movement(30))).toBeTruthy();
    expect(screen.getByText(COMPANION_COPY.closedLine)).toBeTruthy();
    // Nothing about what was not done, no calories, nothing left to fill in.
    expect(screen.queryByText(/2,400|kcal|not noted|mood|sleep/i)).toBeNull();
    expect(screen.queryByText(HOME_COPY.todayTitle)).toBeNull();
    expect(telemetry.capture).toHaveBeenCalledWith('day_closed');

    await press(COMPANION_COPY.reopen);
    await waitFor(() => expect(screen.getByText(HOME_COPY.todayTitle)).toBeTruthy());
    expect(garden().todayState()?.closed).toBe(false);
  });

  it('closing an empty day is still kind', async () => {
    await openHome();
    await press(COMPANION_COPY.closeButton);
    await waitFor(() => expect(screen.getByText(COMPANION_COPY.did.nothing)).toBeTruthy());
  });

  it("repeats yesterday's meals and movement in one tap", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    useGardenStore.setState({
      loaded: true,
      meals: [
        { id: 'm1', meal: 'breakfast', created_at: yesterday.toISOString() },
        { id: 'm2', meal: 'lunch', created_at: yesterday.toISOString() },
      ],
      workouts: [{ id: 'w1', type: 'yoga', minutes: 20, created_at: yesterday.toISOString() }],
    });
    render(<HomeScreen />);
    await pressA11y(HOME_COPY.editA11y(HOME_COPY.care.food));
    await pressA11y(COMPANION_COPY.sameMealsA11y);
    await waitFor(() => expect(garden().mealsToday()).toEqual(['breakfast', 'lunch']));
    expect(screen.queryByLabelText(COMPANION_COPY.sameMealsA11y)).toBeNull(); // offered once
    await press(FLOW_COPY.done);

    await pressA11y(HOME_COPY.editA11y(HOME_COPY.care.movement));
    await pressA11y(COMPANION_COPY.sameWorkoutA11y(WORKOUT_COPY.entry('yoga', 20)));
    await waitFor(() => expect(garden().workouts.filter((w) => w.id !== 'w1')).toHaveLength(1));
    expect(screen.queryByLabelText(COMPANION_COPY.sameWorkoutA11y(WORKOUT_COPY.entry('yoga', 20)))).toBeNull();
  });
});
