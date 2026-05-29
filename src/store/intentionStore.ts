import { create } from 'zustand';
import { addDays } from 'date-fns';
import {
  getIntention,
  upsertIntention,
  markIntentionMet,
  type Intention,
  type NewIntention,
} from '@/services/intentions';
import { weekStartIso } from '@/utils/date';

function lastWeekStartIso(): string {
  const thisWeek = new Date(weekStartIso());
  return addDays(thisWeek, -7).toISOString().slice(0, 10);
}

interface IntentionState {
  currentIntention: Intention | null;
  previousIntention: Intention | null;
  loading: boolean;
  load: (userId: string) => Promise<void>;
  save: (userId: string, input: NewIntention) => Promise<void>;
  markMet: (met: boolean) => Promise<void>;
  markPreviousMet: (met: boolean) => Promise<void>;
  reset: () => void;
}

export const useIntentionStore = create<IntentionState>((set, get) => ({
  currentIntention: null,
  previousIntention: null,
  loading: false,

  load: async (userId) => {
    set({ loading: true });
    try {
      const [current, previous] = await Promise.all([
        getIntention(userId, weekStartIso()),
        getIntention(userId, lastWeekStartIso()),
      ]);
      set({ currentIntention: current, previousIntention: previous, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  save: async (userId, input) => {
    const data = await upsertIntention(userId, input);
    if (data) set({ currentIntention: data });
  },

  markMet: async (met) => {
    const { currentIntention } = get();
    if (!currentIntention) return;
    await markIntentionMet(currentIntention.id, met);
    set({ currentIntention: { ...currentIntention, met } });
  },

  markPreviousMet: async (met) => {
    const { previousIntention } = get();
    if (!previousIntention) return;
    set({ previousIntention: { ...previousIntention, met } });
    try {
      await markIntentionMet(previousIntention.id, met);
    } catch {
      set({ previousIntention });
    }
  },

  reset: () => set({ currentIntention: null, previousIntention: null }),
}));
