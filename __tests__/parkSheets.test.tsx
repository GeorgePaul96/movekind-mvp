import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
let mockStatus = 'ask';
const mockRequest = jest.fn(async () => true);
jest.mock('../src/services/steps', () => ({
  stepsStatus: async () => mockStatus,
  requestStepsAccess: async () => {
    mockStatus = 'granted';
    return mockRequest();
  },
  stepsByDay: async () => ({}),
}));

import { WaterSheet } from '../src/components/park/sheets/WaterSheet';
import { MoodSheet } from '../src/components/park/sheets/MoodSheet';
import { StepsSheet } from '../src/components/park/sheets/StepsSheet';
import { useGardenStore } from '../src/store/gardenStore';
import { __resetDbCacheForTests } from '../src/services/db';
import { MOOD_COPY, STEPS_COPY, UNWELL_COPY, WATER_COPY } from '../src/constants/copy';

beforeEach(async () => {
  mockStatus = 'ask';
  mockRequest.mockClear();
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useGardenStore.setState({ checkIns: [], water: [], workouts: [], stepsToday: null, stepsByDay: {}, stepsStatus: 'ask', loaded: true, error: null });
});

describe('park sheets', () => {
  it('water sheet adds a glass and draws one more drop', async () => {
    const { getByLabelText, queryAllByTestId, findAllByTestId } = render(<WaterSheet visible onClose={() => {}} />);
    expect(queryAllByTestId('drop')).toHaveLength(0);
    fireEvent.press(getByLabelText(WATER_COPY.add));
    expect(await findAllByTestId('drop')).toHaveLength(1);
    expect(useGardenStore.getState().water).toHaveLength(1);
  });

  it('water sheet never shows empty slots', () => {
    const { queryAllByTestId, getByText, queryByLabelText } = render(<WaterSheet visible onClose={() => {}} />);
    expect(queryAllByTestId('drop')).toHaveLength(0);
    expect(queryAllByTestId('drop-empty')).toHaveLength(0);
    expect(getByText(WATER_COPY.note)).toBeTruthy();
    expect(queryByLabelText(WATER_COPY.remove)).toBeNull(); // nothing to undo yet
  });

  it('mood sheet plants a flower and then offers feeling unwell', async () => {
    const { getByLabelText, findByLabelText } = render(<MoodSheet visible onClose={() => {}} />);
    fireEvent.press(getByLabelText(MOOD_COPY.regulated.label));
    expect(await findByLabelText(UNWELL_COPY.toggle)).toBeTruthy();
    expect(useGardenStore.getState().checkIns).toHaveLength(1);
  });

  it('steps sheet asks only on tap of Allow', async () => {
    const { getByLabelText } = render(<StepsSheet visible onClose={() => {}} />);
    expect(mockRequest).not.toHaveBeenCalled();
    fireEvent.press(getByLabelText(STEPS_COPY.allowButton));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});
