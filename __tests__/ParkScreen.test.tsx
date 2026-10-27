import React from 'react';
import { fireEvent, render, waitForElementToBeRemoved } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => 'needs-full-app',
  requestStepsAccess: async () => false,
  stepsByDay: async () => ({}),
}));
jest.mock('../src/services/notifications', () => ({
  enableDailyReminder: jest.fn(async () => true),
  disableDailyReminder: jest.fn(async () => {}),
}));
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import ParkScreen from '../src/screens/main/ParkScreen';
import { useGardenStore } from '../src/store/gardenStore';
import { useProfileStore } from '../src/store/profileStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { __resetDbCacheForTests } from '../src/services/db';
import { BADGE_COPY, CHANGES_COPY, DRAWER_COPY, ME_COPY, MOOD_COPY, PARK_COPY, SHEET_COPY, UNWELL_COPY, WATER_COPY, WORKOUT_COPY } from '../src/constants/copy';

const obj = (o: keyof typeof PARK_COPY.objects) => ({ name: PARK_COPY.objects[o].label });

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, stepsByDay: {}, stepsStatus: 'needs-full-app', loaded: true, error: null });
  useProfileStore.setState({ profile: { id: 'p1', name: 'Sam', created_at: new Date().toISOString() } });
  useSettingsStore.setState({ parkTourSeen: true } as any);
});

describe('<ParkScreen />', () => {
  it('tapping the river opens water and logs a glass', async () => {
    const { getByRole, getByLabelText, findAllByTestId } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('river')));
    fireEvent.press(getByLabelText(WATER_COPY.add));
    expect(await findAllByTestId('drop')).toHaveLength(1);
  });

  it('tapping the tree opens the workout log', () => {
    const { getByRole, getByText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('tree')));
    expect(getByText(WORKOUT_COPY.title)).toBeTruthy();
  });

  it('tapping the flowerbed opens mood', () => {
    const { getByRole, getByText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('flowerbed')));
    expect(getByText(SHEET_COPY.moodTitle)).toBeTruthy();
  });

  it('only one sheet opens at a time', () => {
    const { getByRole, queryByText, getByText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('river')));
    expect(getByText(WATER_COPY.title)).toBeTruthy();
    fireEvent.press(getByRole('button', obj('tree')));
    expect(getByText(WORKOUT_COPY.title)).toBeTruthy();
    expect(queryByText(WATER_COPY.subtitle)).toBeNull();
  });

  it('the drawer shows today at a glance and opens on tap', () => {
    const { getByLabelText, getByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(getByText(DRAWER_COPY.todayTitle)).toBeTruthy();
  });

  it('closed, the drawer is only an arrow over the park', () => {
    const { getByLabelText, queryByText } = render(<ParkScreen />);
    expect(getByLabelText(DRAWER_COPY.openLabel)).toBeTruthy();
    expect(queryByText(WATER_COPY.count(0))).toBeNull();
    expect(queryByText('Today')).toBeNull();
  });

  it('every kind of care can be logged from the drawer', () => {
    const { getByLabelText, getAllByLabelText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(getAllByLabelText(DRAWER_COPY.rows.water.action).length).toBeGreaterThan(0);
    expect(getByLabelText(DRAWER_COPY.rows.workout.action)).toBeTruthy();
    expect(getByLabelText(DRAWER_COPY.rows.mood.action)).toBeTruthy();
    expect(getByLabelText(DRAWER_COPY.rows.steps.action)).toBeTruthy();
  });

  it('Changes and Me live in the drawer', () => {
    const { getByLabelText, getByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(getByText(CHANGES_COPY.linesTitle)).toBeTruthy();
    expect(getByLabelText(ME_COPY.reminderLabel)).toBeTruthy();
  });

  it("today's workouts are listed in the drawer and can be deleted", async () => {
    await useGardenStore.getState().addWorkout('run', 20);
    const { getByLabelText, queryByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    expect(queryByText(WORKOUT_COPY.entry('run', 20))).toBeTruthy();
    fireEvent.press(getByLabelText(WORKOUT_COPY.deleteA11y('run', 20)));
    await waitForElementToBeRemoved(() => queryByText(WORKOUT_COPY.entry('run', 20)));
    expect(useGardenStore.getState().workouts).toEqual([]);
  });

  it('editing a workout opens the log prefilled and saves changes', async () => {
    await useGardenStore.getState().addWorkout('run', 20);
    const { getByLabelText, findByText } = render(<ParkScreen />);
    fireEvent.press(getByLabelText(DRAWER_COPY.openLabel));
    fireEvent.press(getByLabelText(WORKOUT_COPY.editA11y('run', 20)));
    fireEvent.press(getByLabelText(WORKOUT_COPY.durationA11y(45)));
    fireEvent.press(getByLabelText(WORKOUT_COPY.update));
    expect(await findByText(WORKOUT_COPY.entry('run', 45))).toBeTruthy();
  });

  it('feeling unwell from the flowerbed brings gentle rain to the park', async () => {
    const { getByRole, getByLabelText, findByLabelText, findAllByTestId } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('flowerbed')));
    fireEvent.press(getByLabelText(MOOD_COPY.regulated.label));
    fireEvent.press(await findByLabelText(UNWELL_COPY.toggle));
    expect((await findAllByTestId('rain')).length).toBeGreaterThan(0);
  });

  it('the workout log says honestly what it will grow', () => {
    const { getByRole, getByText, getByLabelText } = render(<ParkScreen />);
    fireEvent.press(getByRole('button', obj('tree')));
    fireEvent.press(getByText(WORKOUT_COPY.types.walk));
    fireEvent.press(getByLabelText(WORKOUT_COPY.durationA11y(10)));
    expect(getByText(BADGE_COPY.growth[1])).toBeTruthy();
  });
});

describe('first visit', () => {
  it('the tour shows on the first visit only', () => {
    const { TOUR_COPY } = require('../src/constants/copy');
    useSettingsStore.setState({ parkTourSeen: false } as any);
    const first = render(<ParkScreen />);
    expect(first.getByLabelText(TOUR_COPY.skip)).toBeTruthy();
    first.unmount();
    useSettingsStore.setState({ parkTourSeen: true } as any);
    const later = render(<ParkScreen />);
    expect(later.queryByLabelText(TOUR_COPY.skip)).toBeNull();
  });
});
