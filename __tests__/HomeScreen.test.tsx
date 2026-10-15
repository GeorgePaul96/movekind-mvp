import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));
jest.mock('../src/services/notifications', () => ({ scheduleAdaptiveNudge: jest.fn() }));
jest.mock('../src/hooks/useBehavioralProfile', () => ({ useBehavioralProfile: () => ({ profile: null }) }));
jest.mock('../src/components/SessionOverview', () => ({ SessionOverview: () => null }));
jest.mock('../src/components/SessionPlayer', () => ({ SessionPlayer: () => null }));
jest.mock('../src/components/SessionComplete', () => ({ SessionComplete: () => null }));
jest.mock('../src/components/Paywall', () => ({ Paywall: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import HomeScreen from '../src/screens/main/HomeScreen';
import { useSessionStore } from '../src/store/sessionStore';
import { useProfileStore } from '../src/store/profileStore';

const noop = async () => {};
const base = {
  currentSession: null,
  currentCheckIn: null,
  composedBlocks: [],
  activeBlockIndex: 0,
  paywallVisible: false,
  loading: false,
  error: null,
  week: null,
  loadStatsAndHistory: noop,
  loadWeek: noop,
};
const todayCheckIn = {
  id: 'ci1', user_id: 'u', energy_score: 1, sleep_quality: null, intention: null,
  engine_version: 'v3.0', created_at: new Date().toISOString(),
};

describe('<HomeScreen /> states', () => {
  beforeEach(() => {
    useProfileStore.setState({
      profile: { id: 'p1', name: 'Sam', is_premium: false, created_at: new Date().toISOString() },
    });
  });

  it('greets you by the name saved on this phone', () => {
    useSessionStore.setState({ ...base, homeStep: 'done' } as any);
    const { getByText } = render(<HomeScreen />);
    expect(getByText("How's your energy, Sam?")).toBeTruthy();
  });

  it('no check-in today → the four mood tiles', () => {
    useSessionStore.setState({ ...base, homeStep: 'done' } as any);
    const { getByText } = render(<HomeScreen />);
    for (const label of ['Running on empty', 'A bit low', 'Steady', 'Buzzing']) expect(getByText(label)).toBeTruthy();
  });

  it('just logged → reassurance plus Start / Not now', () => {
    useSessionStore.setState({ ...base, currentCheckIn: todayCheckIn, homeStep: 'logged' } as any);
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Running on empty. That's okay.")).toBeTruthy();
    expect(getByText('Start')).toBeTruthy();
    expect(getByText("Not now — I'm done for today")).toBeTruthy();
  });

  it('done for today → the week view', () => {
    useSessionStore.setState({ ...base, currentCheckIn: todayCheckIn, homeStep: 'done' } as any);
    const { getByText } = render(<HomeScreen />);
    expect(getByText('This week vs last')).toBeTruthy();
    expect(getByText("Change today's check-in")).toBeTruthy();
  });

  it('changing today → tiles again even with a check-in', () => {
    useSessionStore.setState({ ...base, currentCheckIn: todayCheckIn, homeStep: 'pick' } as any);
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Buzzing')).toBeTruthy();
  });
});
