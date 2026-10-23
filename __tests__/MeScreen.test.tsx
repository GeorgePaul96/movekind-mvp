import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn(), reset: jest.fn(), identify: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
const mockEnable = jest.fn();
const mockDisable = jest.fn(async () => {});
jest.mock('../src/services/notifications', () => ({
  enableDailyReminder: () => mockEnable(),
  disableDailyReminder: () => mockDisable(),
}));

import ProfileScreen from '../src/screens/main/ProfileScreen';
import { useSettingsStore } from '../src/store/settingsStore';
import { useProfileStore } from '../src/store/profileStore';
import { ME_COPY } from '../src/constants/copy';

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({ notificationsEnabled: false });
  useProfileStore.setState({ profile: { id: 'p', name: 'Sam', created_at: new Date().toISOString() } as any });
});

describe('<Me />', () => {
  it('the reminder switch starts off', () => {
    const { getByLabelText } = render(<ProfileScreen />);
    expect(getByLabelText(ME_COPY.reminderLabel).props.value).toBe(false);
  });

  it('enabling the reminder turns the switch on', async () => {
    mockEnable.mockResolvedValueOnce(true);
    const { getByLabelText } = render(<ProfileScreen />);
    fireEvent(getByLabelText(ME_COPY.reminderLabel), 'valueChange', true);
    await waitFor(() => expect(useSettingsStore.getState().notificationsEnabled).toBe(true));
  });

  it('denied permission leaves the switch off', async () => {
    mockEnable.mockResolvedValueOnce(false);
    const { getByLabelText, findByText } = render(<ProfileScreen />);
    fireEvent(getByLabelText(ME_COPY.reminderLabel), 'valueChange', true);
    expect(await findByText(ME_COPY.reminderDenied)).toBeTruthy();
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
    expect(getByLabelText(ME_COPY.reminderLabel).props.value).toBe(false);
  });

  it('turning it off cancels the reminder', async () => {
    useSettingsStore.setState({ notificationsEnabled: true });
    const { getByLabelText } = render(<ProfileScreen />);
    fireEvent(getByLabelText(ME_COPY.reminderLabel), 'valueChange', false);
    await waitFor(() => expect(mockDisable).toHaveBeenCalled());
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
  });

  it('has no Premium card', () => {
    const { queryByText } = render(<ProfileScreen />);
    expect(queryByText(/Premium/)).toBeNull();
  });
});
