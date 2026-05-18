import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  hydrate: () => Promise<void>;
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  setReduceMotion: (v: boolean) => Promise<void>;
}

const KEY = '@movekind/settings';

interface PersistedSettings {
  notificationsEnabled: boolean;
  reduceMotion: boolean;
}

const DEFAULTS: PersistedSettings = {
  notificationsEnabled: true,
  reduceMotion: false,
};

async function read(): Promise<PersistedSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as PersistedSettings) };
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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,

  hydrate: async () => {
    const v = await read();
    set(v);
  },

  setNotificationsEnabled: async (v) => {
    set({ notificationsEnabled: v });
    await write({ ...get(), notificationsEnabled: v });
  },

  setReduceMotion: async (v) => {
    set({ reduceMotion: v });
    await write({ ...get(), reduceMotion: v });
  },
}));
