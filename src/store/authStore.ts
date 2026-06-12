import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { telemetry } from '@/services/telemetry';

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
    if (session?.user) {
      telemetry.identify(
        session.user.id,
        session.user.email,
        session.user.user_metadata?.name
      );
    }
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
      if (data.session?.user) {
        telemetry.identify(
          data.session.user.id,
          data.session.user.email,
          data.session.user.user_metadata?.name
        );
      }
    },

    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('LOGIN DATA:', JSON.stringify(data));
      console.log('LOGIN ERROR:', JSON.stringify(error));
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
      if (data.user) {
        telemetry.identify(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.name
        );
      }
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
      if (data.user) {
        telemetry.identify(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.name
        );
      }
    },

    signOut: async () => {
      await supabase.auth.signOut();
      telemetry.reset();
      set({ session: null, user: null });
    },
  };
});
