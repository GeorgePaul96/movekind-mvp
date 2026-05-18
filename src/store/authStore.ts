import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Keep store in sync with Supabase auth events.
  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, user: session?.user ?? null });
  });

  return {
    session: null,
    user: null,
    loading: false,
    error: null,

    setSession: (session) => set({ session, user: session?.user ?? null }),

    restoreSession: async () => {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session, user: data.session?.user ?? null });
    },

    signIn: async (email, password) => {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ loading: false, error: error.message });
        throw error;
      }
      set({
        session: data.session,
        user: data.user,
        loading: false,
        error: null,
      });
    },

    signUp: async (email, password, name) => {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        set({ loading: false, error: error.message });
        throw error;
      }
      set({
        session: data.session,
        user: data.user,
        loading: false,
        error: null,
      });
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set({ session: null, user: null });
    },
  };
});
