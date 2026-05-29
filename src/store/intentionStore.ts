import { create } from 'zustand';
import {
  getIntention,
  upsertIntention,
  markIntentionMet,
  type Intention,
  type NewIntention,
} from '@/services/intentions';
import { weekStartIso } from '@/utils/date';

interface IntentionState {
  currentIntention: Intention | null;
  loading: boolean;
  load: (userId: string) => Promise<void>;
  save: (userId: string, input: NewIntention) => Promise<void>;
  markMet: (met: boolean) => Promise<void>;
  reset: () => void;
}

export const useIntentionStore = create<IntentionState>((set, get) => ({
  currentIntention: null,
  loading: false,

  load: async (userId) => {
    set({ loading: true });
    const data = await getIntention(userId, weekStartIso());
    set({ currentIntention: data, loading: false });
  },

  save: async (userId, input) => {
    const data = await upsertIntention(userId, input);
    set({ currentIntention: data });
  },

  markMet: async (met) => {
    const { currentIntention } = get();
    if (!currentIntention) return;
    await markIntentionMet(currentIntention.id, met);
    set({ currentIntention: { ...currentIntention, met } });
  },

  reset: () => set({ currentIntention: null }),
}));
