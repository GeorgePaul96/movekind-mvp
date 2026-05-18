import { create } from 'zustand';
import type { NewReflection, Reflection } from '@/types';
import { listReflections, upsertReflection } from '@/services/reflections';
import { cacheKeys, readCache, writeCache } from '@/services/cache';

interface ReflectionState {
  reflections: Reflection[];
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  load: (userId: string) => Promise<void>;
  save: (userId: string, input: NewReflection) => Promise<Reflection>;
  reset: () => void;
}

export const useReflectionStore = create<ReflectionState>((set, get) => ({
  reflections: [],
  loading: false,
  error: null,

  hydrate: async () => {
    const cached = await readCache<Reflection[]>(cacheKeys.reflections);
    if (cached) set({ reflections: cached });
  },

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const items = await listReflections(userId);
      set({ reflections: items, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load reflections',
      });
    }
  },

  save: async (userId, input) => {
    const saved = await upsertReflection(userId, input);
    const without = get().reflections.filter(
      (r) => r.week_start !== saved.week_start,
    );
    const next = [saved, ...without].sort((a, b) =>
      a.week_start < b.week_start ? 1 : -1,
    );
    set({ reflections: next });
    await writeCache(cacheKeys.reflections, next);
    return saved;
  },

  reset: () => set({ reflections: [], error: null }),
}));
