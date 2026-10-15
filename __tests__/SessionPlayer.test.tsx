import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));

import { SessionPlayer } from '../src/components/SessionPlayer';
import { useSessionStore } from '../src/store/sessionStore';
import { exerciseById } from '../src/data/exercises';

function playing(exerciseId: string) {
  const exercise = exerciseById(exerciseId)!;
  useSessionStore.setState({
    currentSession: {
      id: 's1', user_id: 'u', check_in_id: null, state: 'overloaded',
      status: 'started', engine_version: 'v3.0', created_at: new Date().toISOString(),
    },
    composedBlocks: [{ dbBlockId: 'b1', exercise, target_duration: 180, status: 'pending' }],
    activeBlockIndex: 0,
  } as any);
}

describe('<SessionPlayer /> safety information', () => {
  afterEach(() => jest.clearAllTimers());

  it("shows the source's warning for the exercise", () => {
    playing('ex-downshift-4'); // knee-to-chest
    const { getByText } = render(<SessionPlayer />);
    expect(getByText('Skip this if you have osteoporosis.')).toBeTruthy();
  });

  it('links to the source the exercise is based on', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    playing('ex-downshift-4');
    const { getByText } = render(<SessionPlayer />);
    fireEvent.press(getByText('Source: Mayo Clinic'));
    expect(open).toHaveBeenCalledWith(exerciseById('ex-downshift-4')!.source!.url);
    open.mockRestore();
  });

  it('speaks the warning too, for people listening rather than looking', () => {
    const Speech = require('expo-speech');
    Speech.speak.mockClear();
    playing('ex-downshift-4');
    render(<SessionPlayer />);
    const spoken = Speech.speak.mock.calls.map((c: unknown[]) => c[0]).join(' ');
    expect(spoken).toMatch(/osteoporosis/i);
  });

  it('always reminds people to stop if something hurts', () => {
    playing('ex-move-1');
    const { getByText } = render(<SessionPlayer />);
    expect(getByText(/stop if anything hurts/i)).toBeTruthy();
  });

  it('shows the timer in minutes and seconds', () => {
    playing('ex-move-1');
    const { getByText } = render(<SessionPlayer />);
    expect(getByText('3:00')).toBeTruthy();
  });
});
