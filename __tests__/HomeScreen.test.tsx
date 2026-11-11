import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../src/screens/main/HomeScreen';
import MeView from '../src/screens/main/MeView';
import {
  BODY_COPY,
  FLOW_COPY,
  HOME_COPY,
  INSIGHTS_COPY,
  ME_COPY,
  PROFILE_COPY,
  WATER_COPY,
  WORKOUT_COPY,
  YARD_COPY,
} from '../src/constants/copy';
import { localDayKey } from '../src/domain/garden/days';
import { breathAt, careToday } from '../src/domain/home/care';
import { __resetDbCacheForTests, db } from '../src/services/db';
import { telemetry } from '../src/services/telemetry';
import { sanitizeProperties } from '../src/services/telemetryPrivacy';
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

const garden = () => useGardenStore.getState();

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({
    checkIns: [], water: [], workouts: [], meals: [], sleep: [], goodThings: [], calories: [],
    stepsToday: null, stepsByDay: {}, stepsStatus: 'unknown', loaded: false, error: null,
  });
  useBodyStore.getState().clear();
  await useSettingsStore.getState().reset();
});

/** Opens home with the day's automatic check-in already seen, so the homepage shows. */
const openHome = async () => {
  await useSettingsStore.getState().markFlowSeen(localDayKey(new Date()));
  render(<HomeScreen />);
  await waitFor(() => expect(garden().loaded).toBe(true));
};
const press = (label: string) => act(async () => fireEvent.press(screen.getByText(label)));
const pressA11y = (label: string) => act(async () => fireEvent.press(screen.getByLabelText(label)));

describe('the paged check-in', () => {
  it('opens by itself on an empty day, once', async () => {
    render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText(FLOW_COPY.mood.title)).toBeTruthy());
    expect(screen.getByLabelText(FLOW_COPY.progress(1, 5))).toBeTruthy();
    expect(useSettingsStore.getState().flowSeenDay).toBe(localDayKey(new Date()));
    await pressA11y(FLOW_COPY.closeA11y);
    expect(screen.getByText(HOME_COPY.todayTitle)).toBeTruthy();
    expect(screen.queryByText(FLOW_COPY.mood.title)).toBeNull();
  });

  it('does not open by itself when the day already has something in it', async () => {
    await db.water.add();
    render(<HomeScreen />);
    await waitFor(() => expect(garden().loaded).toBe(true));
    expect(screen.getByText(HOME_COPY.todayTitle)).toBeTruthy();
    expect(screen.queryByText(FLOW_COPY.mood.title)).toBeNull();
  });

  it('walks mood, water, food, movement and sleep, then lands on a filled homepage', async () => {
    render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText(FLOW_COPY.mood.title)).toBeTruthy());

    await press(YARD_COPY.moods.steady.label);
    await waitFor(() => expect(garden().todayYardMood()).toBe('steady'));
    await press(FLOW_COPY.next);

    expect(screen.getByText(FLOW_COPY.water.title)).toBeTruthy();
    await pressA11y(FLOW_COPY.water.add);
    await pressA11y(FLOW_COPY.water.add);
    await pressA11y(FLOW_COPY.water.remove);
    await waitFor(() => expect(garden().water).toHaveLength(1));
    await press(FLOW_COPY.next);

    expect(screen.getByText(FLOW_COPY.food.title)).toBeTruthy();
    await press(YARD_COPY.foodSheet.meals.lunch);
    fireEvent.changeText(screen.getByLabelText(FLOW_COPY.food.caloriesLabel), '650');
    await press(FLOW_COPY.next);
    await waitFor(() => expect(garden().todayCalories()).toBe(650));

    expect(screen.getByText(FLOW_COPY.movement.title)).toBeTruthy();
    await press(WORKOUT_COPY.types.walk);
    await pressA11y(WORKOUT_COPY.durationA11y(20));
    await press(FLOW_COPY.movement.add);
    await waitFor(() => expect(screen.getByText(WORKOUT_COPY.entry('walk', 20))).toBeTruthy());
    await press(FLOW_COPY.next);

    expect(screen.getByText(FLOW_COPY.sleep.title)).toBeTruthy();
    await pressA11y(FLOW_COPY.sleep.more);
    await press(YARD_COPY.sleepSheet.feels.deep);
    await press(FLOW_COPY.finish);

    await waitFor(() => expect(screen.getByText(HOME_COPY.todayTitle)).toBeTruthy());
    expect(garden().lastNightSleep()).toMatchObject({ hours: 7.5, feel: 'deep' });
    expect(screen.getByText(YARD_COPY.moods.steady.label)).toBeTruthy();
    expect(screen.getByText(WATER_COPY.count(1))).toBeTruthy();
    expect(screen.getByText(`${YARD_COPY.foodSheet.meals.lunch}, ${HOME_COPY.summary.kcal(650)}`)).toBeTruthy();
    expect(screen.getByText(HOME_COPY.summary.movement(1, 20))).toBeTruthy();
    expect(screen.getByText(HOME_COPY.summary.sleep(7.5, 'Deep'))).toBeTruthy();
    for (const kind of ['mood', 'water', 'food', 'movement', 'sleep'] as const) {
      expect(screen.getByLabelText(HOME_COPY.careA11y(HOME_COPY.care[kind], true))).toBeTruthy();
    }
  });

  it('every page can be passed without noting anything, and sleep is not invented', async () => {
    render(<HomeScreen />);
    await waitFor(() => expect(screen.getByText(FLOW_COPY.mood.title)).toBeTruthy());
    for (let k = 0; k < 4; k++) await press(FLOW_COPY.next);
    await press(FLOW_COPY.finish);
    await waitFor(() => expect(screen.getByText(HOME_COPY.todayTitle)).toBeTruthy());
    expect(garden().lastNightSleep()).toBeNull();
    expect(garden().checkIns).toHaveLength(0);
    expect(screen.getAllByText(HOME_COPY.notYet)).toHaveLength(5);
  });

  it('calories are optional, checked kindly, and can be cleared', async () => {
    await openHome();
    await pressA11y(HOME_COPY.editA11y(HOME_COPY.care.food));
    expect(screen.getByText(FLOW_COPY.food.title)).toBeTruthy();
    expect(screen.queryByText(FLOW_COPY.next)).toBeNull(); // editing one page
    fireEvent.changeText(screen.getByLabelText(FLOW_COPY.food.caloriesLabel), '99999');
    await press(FLOW_COPY.done);
    expect(screen.getByText(FLOW_COPY.food.caloriesInvalid)).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText(FLOW_COPY.food.caloriesLabel), '1800');
    await press(FLOW_COPY.done);
    await waitFor(() => expect(garden().todayCalories()).toBe(1800));
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'calories' });
    expect(sanitizeProperties({ kind: 'calories', kcal: 1800 })).toEqual({ kind: 'calories' });

    await pressA11y(HOME_COPY.editA11y(HOME_COPY.care.food));
    fireEvent.changeText(screen.getByLabelText(FLOW_COPY.food.caloriesLabel), '');
    await press(FLOW_COPY.done);
    await waitFor(() => expect(garden().todayCalories()).toBeNull());
  });

  it('Back returns to the page before', async () => {
    await openHome();
    await press(HOME_COPY.startFlow);
    await press(FLOW_COPY.next);
    expect(screen.getByText(FLOW_COPY.water.title)).toBeTruthy();
    await press(FLOW_COPY.back);
    expect(screen.getByText(FLOW_COPY.mood.title)).toBeTruthy();
  });
});

describe('the homepage', () => {
  it('shows an empty day without targets, and opens a single page to add', async () => {
    await openHome();
    expect(screen.getByText(/^Good (morning|afternoon|evening)$/)).toBeTruthy();
    expect(screen.getAllByText(HOME_COPY.notYet)).toHaveLength(5);
    expect(screen.queryByText(/goal|target|streak|missed/i)).toBeNull();
    await pressA11y(HOME_COPY.editA11y(HOME_COPY.care.water));
    await pressA11y(FLOW_COPY.water.add);
    await press(FLOW_COPY.done);
    await waitFor(() => expect(screen.getByText(WATER_COPY.count(1))).toBeTruthy());
    expect(screen.getByLabelText(HOME_COPY.careA11y(HOME_COPY.care.water, true))).toBeTruthy();
  });

  it('one good thing is kept as text once saved, and can be changed or removed', async () => {
    await openHome();
    fireEvent.changeText(screen.getByLabelText(HOME_COPY.goodLabel), '  Tea in the sun  ');
    await press(HOME_COPY.goodSave);
    await waitFor(() => expect(screen.getByText('Tea in the sun')).toBeTruthy());
    // The entry box is gone: it is not sitting there waiting to be edited.
    expect(screen.queryByLabelText(HOME_COPY.goodLabel)).toBeNull();
    expect(screen.getByText(HOME_COPY.goodKept)).toBeTruthy();

    await press(HOME_COPY.goodEdit);
    fireEvent.changeText(screen.getByLabelText(HOME_COPY.goodLabel), 'A call with Mum');
    await press(HOME_COPY.goodSave);
    await waitFor(() => expect(screen.getByText('A call with Mum')).toBeTruthy());
    expect(await db.goodThings.all()).toHaveLength(1);
    expect(telemetry.capture).toHaveBeenCalledWith('logged', { kind: 'good_thing' });
    expect(JSON.stringify((telemetry.capture as jest.Mock).mock.calls)).not.toContain('Mum');

    await press(HOME_COPY.goodEdit);
    fireEvent.changeText(screen.getByLabelText(HOME_COPY.goodLabel), '');
    await press(HOME_COPY.goodSave);
    await waitFor(() => expect(garden().goodThings).toHaveLength(0));
    expect(screen.getByLabelText(HOME_COPY.goodLabel)).toBeTruthy();
  });

  it('paces a slow breath', async () => {
    await openHome();
    jest.useFakeTimers();
    try {
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

  it('Body and numbers is switched on where its entries are, after a notice', async () => {
    await openHome();
    await pressA11y(HOME_COPY.tabA11y(HOME_COPY.tabs.insights));
    expect(screen.getByText(INSIGHTS_COPY.patternsTitle)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.detailsTitle)).toBeNull();
    await act(async () => fireEvent(screen.getByLabelText(BODY_COPY.switchLabel), 'valueChange', true));
    expect(screen.getByText(BODY_COPY.noticeBody)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.detailsTitle)).toBeNull();
    await press(BODY_COPY.noticeOk);
    // Now there is something to fill in, right under the switch.
    await waitFor(() => expect(screen.getByText(BODY_COPY.detailsTitle)).toBeTruthy());
    expect(screen.getByLabelText(BODY_COPY.birthYear)).toBeTruthy();
    expect(screen.queryByText(BODY_COPY.noticeBody)).toBeNull();
  });

  it('looking back shows a past day when tapped', async () => {
    await db.water.add();
    await openHome();
    await pressA11y(HOME_COPY.tabA11y(HOME_COPY.tabs.changes));
    expect(screen.getByText(HOME_COPY.monthTitle)).toBeTruthy();
    const today = new Date();
    const noon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    await pressA11y(HOME_COPY.monthDayA11y(HOME_COPY.monthDay(noon), 1));
    expect(screen.getByText(`${HOME_COPY.care.water}: 1 glass`)).toBeTruthy();
  });

  it('You no longer asks for a name, and keeps the yard as an optional home', async () => {
    render(<MeView />);
    expect(screen.queryByText(ME_COPY.nameTitle)).toBeNull();
    expect(screen.queryByLabelText(PROFILE_COPY.nameLabel)).toBeNull();
    expect(screen.queryByLabelText(BODY_COPY.switchLabel)).toBeNull();
    expect(screen.getByLabelText(HOME_COPY.yardLabel).props.value).toBe(false);
    await act(async () => fireEvent(screen.getByLabelText(HOME_COPY.yardLabel), 'valueChange', true));
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
