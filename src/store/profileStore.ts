import { create } from 'zustand';
import { db } from '@/services/db';
import { telemetry } from '@/services/telemetry';
import { useSettingsStore } from '@/store/settingsStore';
import type { Profile } from '@/types';

/**
 * The local profile. There are no accounts: the profile is created on first
 * launch and lives only on this phone. Its random id doubles as the anonymous
 * telemetry id.
 */
interface ProfileState {
  profile: Profile | null;
  hydrate: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  /** Deletes all data on this phone and returns the app to onboarding. */
  eraseAll: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,

  hydrate: async () => {
    const profile = await db.profile.get();
    set({ profile });
    telemetry.identify(profile.id);
  },

  setName: async (name) => {
    set({ profile: await db.profile.update({ name: name.trim() || null }) });
  },

  eraseAll: async () => {
    await db.eraseAll();
    await useSettingsStore.getState().reset();
    telemetry.reset();
    await get().hydrate();
  },
}));
