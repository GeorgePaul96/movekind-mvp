import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
jest.mock('../src/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import ChangesScreen from '../src/screens/main/ChangesScreen';
import { useGardenStore } from '../src/store/gardenStore';
import { CHANGES_COPY } from '../src/constants/copy';

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

beforeEach(() => {
  useGardenStore.setState({
    checkIns: [
      { id: 'a', user_id: 'u', energy_score: 4, sleep_quality: null, intention: null, engine_version: 'garden-1', created_at: daysAgo(0) },
      { id: 'b', user_id: 'u', energy_score: 1, sleep_quality: null, intention: null, engine_version: 'garden-1', created_at: daysAgo(8) },
    ],
    water: [],
    workouts: [{ id: 'w', type: 'walk', minutes: 200, created_at: daysAgo(2) }],
    stepsToday: null,
    loaded: true,
    error: null,
  });
});

describe('<ChangesScreen />', () => {
  it("shows a month-ago garden and today's", () => {
    const { getByTestId, getByText } = render(<ChangesScreen />);
    expect(getByTestId('garden-then')).toBeTruthy();
    expect(getByTestId('garden-now')).toBeTruthy();
    expect(getByText(CHANGES_COPY.then)).toBeTruthy();
    expect(getByText(CHANGES_COPY.now)).toBeTruthy();
  });

  it('shows the flowerbed', () => {
    const { getByText, getAllByTestId } = render(<ChangesScreen />);
    expect(getByText(CHANGES_COPY.flowerbedTitle)).toBeTruthy();
    expect(getAllByTestId('bed-flower')).toHaveLength(2);
  });

  it('shows the change lines', () => {
    const { getAllByTestId } = render(<ChangesScreen />);
    expect(getAllByTestId('change-line').length).toBeGreaterThan(0);
  });
});
