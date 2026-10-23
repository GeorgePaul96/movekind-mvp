import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../global.css', () => ({}), { virtual: true });
jest.mock('../src/navigation/RootNavigator', () => () => null);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() } }));
const mockRequest = jest.fn();
const mockInit = jest.fn();
jest.mock('../src/services/notifications', () => ({
  initNotifications: () => mockInit(),
  enableDailyReminder: () => mockRequest(),
  disableDailyReminder: jest.fn(),
}));

import App from '../App';
import { telemetry } from '../src/services/telemetry';

describe('app launch', () => {
  it('launch never asks for notification permission', async () => {
    render(<App />);
    await waitFor(() => expect(telemetry.capture).toHaveBeenCalledWith('app_opened', expect.anything()));
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockInit).not.toHaveBeenCalled();
  });
});
