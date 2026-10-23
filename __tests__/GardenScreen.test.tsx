import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import GardenScreen from '../src/screens/main/GardenScreen';
import { useGardenStore } from '../src/store/gardenStore';
import { useProfileStore } from '../src/store/profileStore';
import { __resetDbCacheForTests } from '../src/services/db';
import { GARDEN_COPY, MOOD_COPY, WORKOUT_COPY } from '../src/constants/copy';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, loaded: true, error: null });
  useProfileStore.setState({
    profile: { id: 'p1', name: 'Sam', is_premium: false, created_at: new Date().toISOString() },
  });
});

describe('<GardenScreen />', () => {
  it('water tap adds a glass and updates the count', async () => {
    const { getByLabelText, findByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(GARDEN_COPY.waterA11y(0)));
    expect(await findByText(GARDEN_COPY.glasses(1))).toBeTruthy();
    expect(useGardenStore.getState().water).toHaveLength(1);
  });

  it('workout needs a type and a length before saving', () => {
    const { getByLabelText, getByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(GARDEN_COPY.workoutA11y));
    const save = getByLabelText(WORKOUT_COPY.save);
    expect(save.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(getByText(WORKOUT_COPY.types.walk));
    expect(getByLabelText(WORKOUT_COPY.save).props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(getByText(WORKOUT_COPY.minutes(20)));
    expect(getByLabelText(WORKOUT_COPY.save).props.accessibilityState?.disabled).toBe(false);
  });

  it('saving a workout closes the sheet and lists it under today', async () => {
    const { getByLabelText, getByText, findByText, queryByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(GARDEN_COPY.workoutA11y));
    fireEvent.press(getByText(WORKOUT_COPY.types.yoga));
    fireEvent.press(getByText(WORKOUT_COPY.minutes(30)));
    fireEvent.press(getByLabelText(WORKOUT_COPY.save));
    expect(await findByText(WORKOUT_COPY.entry('yoga', 30))).toBeTruthy();
    await waitFor(() => expect(queryByText(WORKOUT_COPY.title)).toBeNull());
  });

  it('deleting a workout removes it', async () => {
    await useGardenStore.getState().addWorkout('run', 20);
    const { getByLabelText, queryByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(WORKOUT_COPY.deleteA11y('run', 20)));
    await waitFor(() => expect(queryByText(WORKOUT_COPY.entry('run', 20))).toBeNull());
    expect(useGardenStore.getState().workouts).toEqual([]);
  });

  it("mood tiles show until today's mood is picked", async () => {
    const { getByLabelText, queryByLabelText, findByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(MOOD_COPY.regulated.label));
    expect(await findByText(GARDEN_COPY.todayMood(MOOD_COPY.regulated.label))).toBeTruthy();
    expect(queryByLabelText(MOOD_COPY.activated.label)).toBeNull();
  });

  it('steps shows the arrive-soon state', () => {
    const { getByText } = render(<GardenScreen />);
    expect(getByText(GARDEN_COPY.stepsSoon)).toBeTruthy();
  });

  it('shows the garden with a spoken summary', () => {
    const { getByLabelText } = render(<GardenScreen />);
    expect(getByLabelText(/trickle/)).toBeTruthy();
  });
});
