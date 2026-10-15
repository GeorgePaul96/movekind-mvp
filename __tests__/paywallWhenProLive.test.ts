import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The paywall path for the day the Pro plan launches (PRO_PLAN_LIVE = true).
 * Today the switch is off (see entitlements.test.ts); this keeps the gate tested
 * so flipping it later is safe.
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));
jest.mock('../src/services/behavioralProfile', () => ({
  fetchBehavioralProfile: jest.fn(async () => null),
}));
jest.mock('../src/domain/premium/entitlements', () => {
  const actual = jest.requireActual('../src/domain/premium/entitlements');
  return { ...actual, PRO_PLAN_LIVE: true, effectivePremium: (p: boolean) => actual.effectivePremium(p, true) };
});

import { db, __resetDbCacheForTests } from '../src/services/db';
import { useSessionStore } from '../src/store/sessionStore';

describe('paywall once the Pro plan is live', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetDbCacheForTests();
    useSessionStore.setState({
      currentCheckIn: null,
      currentSession: null,
      composedBlocks: [],
      paywallVisible: false,
      paywallDismissedThisSession: false,
    });
    await db.profile.update({ is_premium: false });
    for (let i = 0; i < 5; i++) {
      await db.sessions.add({ check_in_id: null, state: 'regulated', engine_version: 'v3.0', status: 'completed' });
    }
  });

  it('logging stays free; starting a 6th session shows the paywall', async () => {
    await useSessionStore.getState().logCheckIn('recovering');
    expect(useSessionStore.getState().paywallVisible).toBe(false);
    await useSessionStore.getState().startTodaysSession();
    expect(useSessionStore.getState().paywallVisible).toBe(true);
    expect(useSessionStore.getState().currentSession).toBeNull();
  });

  it('Pro members are never stopped', async () => {
    await db.profile.update({ is_premium: true });
    await useSessionStore.getState().logCheckIn('recovering');
    await useSessionStore.getState().startTodaysSession();
    expect(useSessionStore.getState().paywallVisible).toBe(false);
    expect(useSessionStore.getState().currentSession).not.toBeNull();
  });
});
