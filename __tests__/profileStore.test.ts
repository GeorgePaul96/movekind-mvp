import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, __resetDbCacheForTests } from '../src/services/db';
import { useProfileStore } from '../src/store/profileStore';
import { useSettingsStore } from '../src/store/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDbCacheForTests();
  useProfileStore.setState({ profile: null });
});

describe('profileStore (no accounts)', () => {
  it('hydrate creates a local profile', async () => {
    await useProfileStore.getState().hydrate();
    expect(useProfileStore.getState().profile).toMatchObject({ name: null, is_premium: false });
  });

  it('setName trims and persists; blank becomes null', async () => {
    await useProfileStore.getState().hydrate();
    await useProfileStore.getState().setName('  Sam ');
    __resetDbCacheForTests();
    expect((await db.profile.get()).name).toBe('Sam');
    await useProfileStore.getState().setName('   ');
    expect(useProfileStore.getState().profile?.name).toBeNull();
  });

  it('setPremium persists', async () => {
    await useProfileStore.getState().hydrate();
    await useProfileStore.getState().setPremium(true);
    __resetDbCacheForTests();
    expect((await db.profile.get()).is_premium).toBe(true);
  });

  it('eraseAll wipes data, returns to onboarding and starts a new profile', async () => {
    await useProfileStore.getState().hydrate();
    const oldId = useProfileStore.getState().profile!.id;
    await useSettingsStore.getState().completeOnboarding({
      movementFeel: 'gentle', appFatigueReason: 'streaks', approachableMovements: ['walk'], averageEnergy: 5,
    });
    await db.checkIns.add({ energy_score: 4, sleep_quality: null, intention: null, engine_version: 'v3.0' });

    await useProfileStore.getState().eraseAll();

    expect(useSettingsStore.getState().onboarded).toBe(false);
    expect(await db.checkIns.all()).toEqual([]);
    expect(useProfileStore.getState().profile?.id).not.toBe(oldId);
  });
});
