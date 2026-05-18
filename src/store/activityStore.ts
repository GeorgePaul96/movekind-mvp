import { create } from 'zustand';
import type { Activity, NewActivity } from '@/types';
import {
  createActivity,
  deleteActivity,
  listActivities,
} from '@/services/activities';
import { cacheKeys, readCache, writeCache } from '@/services/cache';

interface ActivityState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  load: (userId: string) => Promise<void>;
  add: (userId: string, input: NewActivity) => Promise<Activity>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  loading: false,
  error: null,

  hydrate: async () => {
    const cached = await readCache<Activity[]>(cacheKeys.activities);
    if (cached) set({ activities: cached });
  },

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const items = await listActivities(userId);
      set({ activities: items, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load activities',
      });
    }
  },

  add: async (userId, input) => {
    const created = await createActivity(userId, input);
    const next = [created, ...get().activities];
    set({ activities: next });
    await writeCache(cacheKeys.activities, next);
    return created;
  },

  remove: async (id) => {
    await deleteActivity(id);
    const next = get().activities.filter((a) => a.id !== id);
    set({ activities: next });
    await writeCache(cacheKeys.activities, next);
  },

  reset: () => set({ activities: [], error: null }),
}));
