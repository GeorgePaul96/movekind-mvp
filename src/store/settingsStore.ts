import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Units = 'metric' | 'imperial';

interface SettingsState {
  /** The optional 9am reminder. Off until the user turns it on in Me. */
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  onboarded: boolean;
  /** The first-visit park tour has been seen (or skipped). */
  parkTourSeen: boolean;
  /** The opt-in Body section and the other numbers. Off until switched on in Me. */
  bodyEnabled: boolean;
  /** The one-time "these are estimates" notice has been shown. */
  bodyNoticeSeen: boolean;
  /** How lengths and weights are shown and typed. Stored values are always metric. */
  units: Units;
  hydrate: () => Promise<void>;
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  setReduceMotion: (v: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  markParkTourSeen: () => Promise<void>;
  setBodyEnabled: (v: boolean) => Promise<void>;
  markBodyNoticeSeen: () => Promise<void>;
  setUnits: (v: Units) => Promise<void>;
  /** Back to first-launch defaults (used by "Erase all my data"). */
  reset: () => Promise<void>;
}

const KEY = '@movekind/settings';

interface PersistedSettings {
  notificationsEnabled: boolean;
  reduceMotion: boolean;
  onboarded: boolean;
  parkTourSeen: boolean;
  bodyEnabled: boolean;
  bodyNoticeSeen: boolean;
  units: Units;
}

const DEFAULTS: PersistedSettings = {
  notificationsEnabled: false,
  reduceMotion: false,
  onboarded: false,
  parkTourSeen: false,
  bodyEnabled: false,
  bodyNoticeSeen: false,
  units: 'metric',
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
      parkTourSeen: v.parkTourSeen ?? DEFAULTS.parkTourSeen,
      bodyEnabled: v.bodyEnabled ?? DEFAULTS.bodyEnabled,
      bodyNoticeSeen: v.bodyNoticeSeen ?? DEFAULTS.bodyNoticeSeen,
      units: v.units === 'imperial' ? 'imperial' : 'metric',
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
  parkTourSeen: s.parkTourSeen,
  bodyEnabled: s.bodyEnabled,
  bodyNoticeSeen: s.bodyNoticeSeen,
  units: s.units,
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

  markParkTourSeen: async () => {
    set({ parkTourSeen: true });
    await write(persisted(get()));
  },

  setBodyEnabled: async (v) => {
    set({ bodyEnabled: v });
    await write(persisted(get()));
  },

  markBodyNoticeSeen: async () => {
    set({ bodyNoticeSeen: true });
    await write(persisted(get()));
  },

  setUnits: async (v) => {
    set({ units: v });
    await write(persisted(get()));
  },

  reset: async () => {
    set(DEFAULTS);
    await write(DEFAULTS);
  },
}));
