jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { useSettingsStore } from '../src/store/settingsStore';

const AsyncStorage = require('@react-native-async-storage/async-storage');
const KEY = '@movekind/settings';

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettingsStore.setState({
      notificationsEnabled: true,
      reduceMotion: false,
      onboarded: false,
      onboardingAnswers: null,
    });
  });

  it('hydrates defaults when nothing is stored', async () => {
    await useSettingsStore.getState().hydrate();
    const s = useSettingsStore.getState();
    expect(s.notificationsEnabled).toBe(true);
    expect(s.reduceMotion).toBe(false);
    expect(s.onboarded).toBe(false);
  });

  it('persists and reflects a reduce-motion change', async () => {
    await useSettingsStore.getState().setReduceMotion(true);
    expect(useSettingsStore.getState().reduceMotion).toBe(true);

    const raw = await AsyncStorage.getItem(KEY);
    expect(JSON.parse(raw)).toMatchObject({ reduceMotion: true });
  });

  it('persists notification preference', async () => {
    await useSettingsStore.getState().setNotificationsEnabled(false);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
    const raw = await AsyncStorage.getItem(KEY);
    expect(JSON.parse(raw)).toMatchObject({ notificationsEnabled: false });
  });

  it('records onboarding completion and hydrates it back', async () => {
    const answers = {
      movementFeel: 'gentle',
      appFatigueReason: 'streaks',
      approachableMovements: ['walk', 'yoga'],
      averageEnergy: 6,
    };
    await useSettingsStore.getState().completeOnboarding(answers);
    expect(useSettingsStore.getState().onboarded).toBe(true);

    // Fresh store reading the same storage should see the persisted state.
    useSettingsStore.setState({ onboarded: false, onboardingAnswers: null });
    await useSettingsStore.getState().hydrate();
    const s = useSettingsStore.getState();
    expect(s.onboarded).toBe(true);
    expect(s.onboardingAnswers).toMatchObject(answers);
  });
});

describe('safety notice acknowledgement', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await useSettingsStore.getState().reset();
  });

  it('starts unacknowledged so the notice shows before any exercise', async () => {
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().safetyAcknowledged).toBe(false);
  });

  it('persists the acknowledgement', async () => {
    await useSettingsStore.getState().acknowledgeSafety();
    expect(useSettingsStore.getState().safetyAcknowledged).toBe(true);
    expect(JSON.parse(await AsyncStorage.getItem(KEY))).toMatchObject({ safetyAcknowledged: true });
  });

  it('"Erase all my data" brings the notice back', async () => {
    await useSettingsStore.getState().acknowledgeSafety();
    await useSettingsStore.getState().reset();
    expect(useSettingsStore.getState().safetyAcknowledged).toBe(false);
  });
});

describe('rootRoute (what the app shows first)', () => {
  const { rootRoute } = require('../src/navigation/rootRoute');
  it('onboarding → safety notice → app', () => {
    expect(rootRoute({ onboarded: false, safetyAcknowledged: false })).toBe('Onboarding');
    expect(rootRoute({ onboarded: true, safetyAcknowledged: false })).toBe('SafetyNotice');
    expect(rootRoute({ onboarded: true, safetyAcknowledged: true })).toBe('Main');
  });
});
