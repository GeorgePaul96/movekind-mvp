import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import type { DailyCheckInInput, RecoveryStateOutput } from '@/domain/recovery/recoveryEngine';
import type { RecommendationOutput } from '@/domain/recovery/recommendationEngine';
import { generateRecoveryState } from '@/domain/recovery/recoveryEngine';
import { getRecommendation } from '@/domain/recovery/recommendationEngine';

export interface CheckInRecord extends DailyCheckInInput {
  id: string;
  user_id: string;
  generated_state: RecoveryStateOutput['state'];
  recommendation_title: string;
  stress_load: number;
  created_at: string;
}

interface CheckInState {
  latestCheckIn: CheckInRecord | null;
  loading: boolean;
  error: string | null;
  loadLatest: (userId: string) => Promise<void>;
  submitCheckIn: (userId: string, input: DailyCheckInInput) => Promise<void>;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  latestCheckIn: null,
  loading: false,
  error: null,

  loadLatest: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      set({ latestCheckIn: (data as CheckInRecord) || null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  submitCheckIn: async (userId: string, input: DailyCheckInInput) => {
    set({ loading: true, error: null });
    try {
      const stateOutput = generateRecoveryState(input);
      const recOutput = getRecommendation(stateOutput.state);

      const payload = {
        user_id: userId,
        energy: input.energy,
        stress_load: input.stress,
        body_state: input.bodyState,
        emotions: input.emotions,
        generated_state: stateOutput.state,
        recommendation: recOutput.title, // Storing title for simplicity
      };

      const { data, error } = await supabase
        .from('daily_check_ins')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      set({ latestCheckIn: data as CheckInRecord, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
