import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
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
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import YardScreen from '../src/screens/main/YardScreen';
import { useGardenStore } from '../src/store/gardenStore';
import { useProfileStore } from '../src/store/profileStore';
import { __resetDbCacheForTests } from '../src/services/db';
import { WATER_COPY, YARD_COPY } from '../src/constants/copy';

const store = () => useGardenStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({
    checkIns: [], water: [], workouts: [], meals: [], sleep: [],
    stepsToday: null, stepsByDay: {}, stepsStatus: 'needs-full-app', loaded: true, error: null,
  });
  useProfileStore.setState({ profile: { id: 'p1', name: 'Sam', created_at: new Date().toISOString() } });
});

/** Most tests start with today's mood already picked, so the mood sheet doesn't open on its own. */
async function withMood() {
  await act(() => store().logYardMood('steady'));
}

describe('<YardScreen />', () => {
  it('opening the water bowl shows the water sheet and logs a glass', async () => {
    await withMood();
    const { getByLabelText, getByText, findAllByTestId } = render(<YardScreen />);
    fireEvent.press(getByLabelText(YARD_COPY.objects.water.label));
    expect(getByText(WATER_COPY.title)).toBeTruthy();
    fireEvent.press(getByLabelText(WATER_COPY.add));
    expect(await findAllByTestId('drop')).toHaveLength(1);
  });

  it('tapping the food bowl wakes Pudding, and saving stores the meals', async () => {
    await withMood();
    const { getByLabelText, getByText, getByTestId } = render(<YardScreen />);
    fireEvent.press(getByLabelText(YARD_COPY.objects.food.label));
    expect(getByTestId('pudding-awake')).toBeTruthy();
    expect(getByText(YARD_COPY.foodSheet.title)).toBeTruthy();
    fireEvent.press(getByLabelText(YARD_COPY.foodSheet.meals.breakfast));
    fireEvent.press(getByLabelText(YARD_COPY.foodSheet.save));
    await waitFor(() => expect(store().mealsToday()).toEqual(['breakfast']));
  });

  it('tapping Pudding opens the sleep sheet and Pudding stays asleep', async () => {
    await withMood();
    const { getByLabelText, getByText, queryByTestId } = render(<YardScreen />);
    fireEvent.press(getByLabelText(YARD_COPY.objects.pudding.label));
    expect(getByText(YARD_COPY.sleepSheet.title)).toBeTruthy();
    expect(queryByTestId('pudding-awake')).toBeNull();
  });

  it('does not open the mood sheet when a mood is already picked today', async () => {
    await withMood();
    const { queryByText } = render(<YardScreen />);
    expect(queryByText(YARD_COPY.moods.buzzing.label)).toBeNull();
  });

  it('opens the mood sheet when no mood is picked today, and Not now saves nothing', () => {
    const { getByText, getByLabelText } = render(<YardScreen />);
    expect(getByText(YARD_COPY.moods.steady.label)).toBeTruthy();
    fireEvent.press(getByLabelText('Not now'));
    expect(store().todayYardMood()).toBeNull();
    expect(store().checkIns).toEqual([]);
  });

  it('picking a mood in the sheet saves it as a yard mood', async () => {
    const { getByLabelText } = render(<YardScreen />);
    fireEvent.press(getByLabelText(YARD_COPY.moods.frustrated.label));
    await waitFor(() => expect(store().todayYardMood()).toBe('frustrated'));
  });
});
