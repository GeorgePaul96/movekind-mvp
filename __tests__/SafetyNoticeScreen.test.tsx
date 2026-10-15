import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import SafetyNoticeScreen from '../src/screens/onboarding/SafetyNoticeScreen';
import { useSettingsStore } from '../src/store/settingsStore';

describe('<SafetyNoticeScreen />', () => {
  it('says plainly that this is not medical advice and when to check with a doctor', () => {
    const { getByText, getAllByText } = render(<SafetyNoticeScreen />);
    expect(getByText(/isn't medical advice/i)).toBeTruthy();
    expect(getByText(/heart condition/i)).toBeTruthy();
    // once in 'check with a doctor first' and once in the emergency box
    expect(getAllByText(/chest pain/i)).toHaveLength(2);
  });

  it('records the acknowledgement when you tap "I understand"', async () => {
    useSettingsStore.setState({ safetyAcknowledged: false } as any);
    const { getByText } = render(<SafetyNoticeScreen />);
    fireEvent.press(getByText('I understand'));
    await waitFor(() => expect(useSettingsStore.getState().safetyAcknowledged).toBe(true));
  });
});
