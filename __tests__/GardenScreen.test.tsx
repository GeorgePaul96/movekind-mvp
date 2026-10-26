import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
let mockStatus = 'needs-full-app';
const mockRequest = jest.fn(async () => true);
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => mockStatus,
  requestStepsAccess: async () => {
    mockStatus = 'granted';
    return mockRequest();
  },
  stepsByDay: async () => {
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { [key]: 4321 };
  },
}));
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import GardenScreen from '../src/screens/main/GardenScreen';
import { useGardenStore } from '../src/store/gardenStore';
import { useProfileStore } from '../src/store/profileStore';
import { __resetDbCacheForTests } from '../src/services/db';
import { BADGE_COPY, GARDEN_COPY, MOOD_COPY, STEPS_COPY, WORKOUT_COPY } from '../src/constants/copy';

beforeEach(async () => {
  mockStatus = 'needs-full-app';
  mockRequest.mockClear();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, stepsByDay: {}, stepsStatus: 'unknown', loaded: true, error: null });
  useProfileStore.setState({
    profile: { id: 'p1', name: 'Sam', created_at: new Date().toISOString() },
  });
});

describe('<GardenScreen />', () => {
  it('water tap adds a glass and updates the count', async () => {
    const { getByLabelText, findByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(GARDEN_COPY.waterA11y(0)));
    expect(await findByText(GARDEN_COPY.waterNote)).toBeTruthy();
    expect(getByLabelText(GARDEN_COPY.waterA11y(1))).toBeTruthy();
    expect(useGardenStore.getState().water).toHaveLength(1);
  });

  it('workout needs a type and a length before saving', () => {
    const { getByLabelText, getByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(GARDEN_COPY.workoutA11y));
    const save = getByLabelText(WORKOUT_COPY.save);
    expect(save.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(getByText(WORKOUT_COPY.types.walk));
    expect(getByLabelText(WORKOUT_COPY.save).props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(getByLabelText(WORKOUT_COPY.durationA11y(20)));
    expect(getByLabelText(WORKOUT_COPY.save).props.accessibilityState?.disabled).toBe(false);
  });

  it('saving a workout closes the sheet and lists it under today', async () => {
    const { getByLabelText, getByText, findByText, queryByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(GARDEN_COPY.workoutA11y));
    fireEvent.press(getByText(WORKOUT_COPY.types.yoga));
    fireEvent.press(getByLabelText(WORKOUT_COPY.durationA11y(30)));
    fireEvent.press(getByLabelText(WORKOUT_COPY.save));
    expect(await findByText(WORKOUT_COPY.entry('yoga', 30))).toBeTruthy();
    await waitFor(() => expect(queryByText(WORKOUT_COPY.title)).toBeNull());
  });

  it('the workout sheet says honestly what this workout will grow', () => {
    const { getByLabelText, getByText, queryByText } = render(<GardenScreen />);
    fireEvent.press(getByLabelText(GARDEN_COPY.workoutA11y));
    expect(getByText(WORKOUT_COPY.subtitle)).toBeTruthy();
    expect(queryByText(BADGE_COPY.growth[1])).toBeNull();
    fireEvent.press(getByText(WORKOUT_COPY.types.walk));
    fireEvent.press(getByLabelText(WORKOUT_COPY.durationA11y(10)));
    expect(getByText(BADGE_COPY.growth[1])).toBeTruthy();
  });

  it('a first-week garden shows the welcome card', () => {
    const { getByText } = render(<GardenScreen />);
    expect(getByText(GARDEN_COPY.welcomeTitle)).toBeTruthy();
    expect(getByText(GARDEN_COPY.welcomeNoStreaks)).toBeTruthy();
  });

  it('the garden card names what is growing', () => {
    const { getByText } = render(<GardenScreen />);
    expect(getByText(BADGE_COPY.tree[0])).toBeTruthy();
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

  it('steps shows the arrive-soon state where the phone cannot share them yet', async () => {
    const { findByText } = render(<GardenScreen />);
    expect(await findByText(GARDEN_COPY.stepsSoon)).toBeTruthy();
  });

  it('asks for step access only when Steps is tapped', async () => {
    mockStatus = 'ask';
    const { findByText, getByLabelText } = render(<GardenScreen />);
    expect(await findByText(STEPS_COPY.allow)).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalled();
    fireEvent.press(getByLabelText(GARDEN_COPY.steps));
    expect(await findByText((4321).toLocaleString())).toBeTruthy();
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("with access, Steps shows today's count and opens the week", async () => {
    mockStatus = 'granted';
    const { findByText, getByLabelText, getByText } = render(<GardenScreen />);
    expect(await findByText((4321).toLocaleString())).toBeTruthy();
    fireEvent.press(getByLabelText(GARDEN_COPY.steps));
    expect(getByText(STEPS_COPY.weekTitle)).toBeTruthy();
  });

  it('shows the garden with a spoken summary', () => {
    const { getByLabelText } = render(<GardenScreen />);
    expect(getByLabelText(/trickle/)).toBeTruthy();
  });
});
