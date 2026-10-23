import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  /** The optional 9am reminder. Off until the user turns it on in Me. */
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  onboarded: boolean;
  hydrate: () => Promise<void>;
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  setReduceMotion: (v: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  /** Back to first-launch defaults (used by "Erase all my data"). */
  reset: () => Promise<void>;
}

const KEY = '@movekind/settings';

interface PersistedSettings {
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  onboarded: boolean;
}

const DEFAULTS: PersistedSettings = {
  notificationsEnabled: false,
  reduceMotion: false,
  onboarded: false,
};

async function read(): Promise<PersistedSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const v = JSON.parse(raw) as Partial<PersistedSettings>;
    // Only known keys: older versions stored fields (safety notice, onboarding answers) we no longer use.
    return {
      notificationsEnabled: v.notificationsEnabled ?? DEFAULTS.notificationsEnabled,
      reduceMotion: v.reduceMotion ?? DEFAULTS.reduceMotion,
      onboarded: v.onboarded ?? DEFAULTS.onboarded,
    };
  } catch {
    return DEFAULTS;
  }
}

async function write(value: PersistedSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // swallow
  }
}

const persisted = (s: PersistedSettings): PersistedSettings => ({
  notificationsEnabled: s.notificationsEnabled,
  reduceMotion: s.reduceMotion,
  onboarded: s.onboarded,
});

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,

  hydrate: async () => {
    set(await read());
  },

  setNotificationsEnabled: async (v) => {
    set({ notificationsEnabled: v });
    await write(persisted(get()));
  },

  setReduceMotion: async (v) => {
    set({ reduceMotion: v });
    await write(persisted(get()));
  },

  completeOnboarding: async () => {
    set({ onboarded: true });
    await write(persisted(get()));
  },

  reset: async () => {
    set(DEFAULTS);
    await write(DEFAULTS);
  },
}));
