import React from 'react';
import { render } from '@testing-library/react-native';
import { BehavioralBanner } from '../src/components/BehavioralBanner';
import type { BehavioralProfile } from '../src/domain/behavioral';

const base: BehavioralProfile = {
  gaps: { hasHistory: true, lastGapDays: 2, avgGapDays: 3, gapHistory: [3, 2], trend: 'shrinking', observation: 'Your gaps between sessions are shrinking.' },
  rhythm: { weeklyVariance: 0, avgWeeklySessions: 2, trajectory: 'stable', observation: 'Your weekly rhythm is steady.' },
  recovery: { signal: 'stable', isMotivationalCollapse: false, isAvoidanceSpiral: false, isBurnoutRisk: false, reEntryReadiness: 'medium' },
  wins: [{ type: 'gap_shrinking', observation: 'The space between your sessions is shrinking — you\'re returning more easily.' }],
};

describe('BehavioralBanner', () => {
  test('renders the top win as the dominant message', () => {
    const { getByText } = render(<BehavioralBanner profile={base} />);
    expect(getByText(/space between your sessions is shrinking/i)).toBeTruthy();
  });

  test('falls back to recovery-signal copy when there are no wins', () => {
    const noWins: BehavioralProfile = { ...base, wins: [], recovery: { ...base.recovery, signal: 'returning' } };
    const { getByText } = render(<BehavioralBanner profile={noWins} />);
    expect(getByText(/Glad you're here/i)).toBeTruthy();
  });

  test('renders nothing when profile is null', () => {
    const { toJSON } = render(<BehavioralBanner profile={null} />);
    expect(toJSON()).toBeNull();
  });
});
