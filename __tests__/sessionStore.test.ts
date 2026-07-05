import { mapEnergyToState, useSessionStore } from '../src/store/sessionStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: null } })),
    },
  },
}));

jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

describe('mapEnergyToState', () => {
  it('maps every energy score to its capacity state', () => {
    expect(mapEnergyToState(1)).toBe('overloaded');
    expect(mapEnergyToState(2)).toBe('recovering');
    expect(mapEnergyToState(3)).toBe('recovering');
    expect(mapEnergyToState(4)).toBe('regulated');
    expect(mapEnergyToState(5)).toBe('activated');
  });
});

describe('useSessionStore', () => {
  it('starts with a clean slate', () => {
    const s = useSessionStore.getState();
    expect(s.currentSession).toBeNull();
    expect(s.currentCheckIn).toBeNull();
    expect(s.composedBlocks).toEqual([]);
    expect(s.activeBlockIndex).toBe(0);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
    expect(s.paywallVisible).toBe(false);
  });

  it('toggles paywall visibility', () => {
    useSessionStore.getState().setPaywallVisible(true);
    expect(useSessionStore.getState().paywallVisible).toBe(true);
    useSessionStore.getState().setPaywallVisible(false);
    expect(useSessionStore.getState().paywallVisible).toBe(false);
  });

  it('dismissPaywall hides it and marks it dismissed for the session', () => {
    useSessionStore.setState({ paywallVisible: true, paywallDismissedThisSession: false });
    useSessionStore.getState().dismissPaywall();
    const s = useSessionStore.getState();
    expect(s.paywallVisible).toBe(false);
    expect(s.paywallDismissedThisSession).toBe(true);
  });

  it('checkIn rejects when unauthenticated', async () => {
    await expect(useSessionStore.getState().checkIn(3, 'fair')).rejects.toThrow(
      'Unauthenticated',
    );
  });

  it('safeHarborBypass rejects when unauthenticated', async () => {
    await expect(useSessionStore.getState().safeHarborBypass()).rejects.toThrow(
      'Unauthenticated',
    );
  });
});
