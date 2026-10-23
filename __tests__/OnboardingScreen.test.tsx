import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import OnboardingScreen from '../src/screens/onboarding/OnboardingScreen';
import { useSettingsStore } from '../src/store/settingsStore';
import { useProfileStore } from '../src/store/profileStore';
import { GARDEN_INTRO_COPY, ONBOARDING_COPY } from '../src/constants/copy';

describe('<OnboardingScreen />', () => {
  it('asks only for a name, explains the garden, then finishes', async () => {
    useSettingsStore.setState({ onboarded: false });
    const { getByLabelText, getByText } = render(<OnboardingScreen />);
    fireEvent.changeText(getByLabelText(ONBOARDING_COPY.nameTitle), 'Sam');
    fireEvent.press(getByText(GARDEN_INTRO_COPY.next));
    expect(getByText(GARDEN_INTRO_COPY.title)).toBeTruthy();
    fireEvent.press(getByText(GARDEN_INTRO_COPY.start));
    await waitFor(() => expect(useSettingsStore.getState().onboarded).toBe(true));
    expect(useProfileStore.getState().profile?.name).toBe('Sam');
  });
});
