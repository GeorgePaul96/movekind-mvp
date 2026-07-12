import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { telemetry } from '@/services/telemetry';
import { friendlyErrorMessage, isNetworkError } from '@/services/network';
import { enqueueRating } from '@/services/outbox';
import { fetchBehavioralProfile } from '@/services/behavioralProfile';
import { composeSession } from '@/domain/sessions/composer';
import { visibleExercises } from '@/domain/premium/entitlements';
import type { CheckIn, Session, SessionBlock, Exercise, UserState, UserExerciseStats } from '@/types';

interface ComposedBlockWithExercise {
  dbBlockId: string;
  exercise: Exercise;
  target_duration: number;
  status: SessionBlock['status'];
}

interface SessionState {
  currentCheckIn: CheckIn | null;
  currentSession: Session | null;
  composedBlocks: ComposedBlockWithExercise[];
  activeBlockIndex: number;
  userStats: UserExerciseStats[];
  loading: boolean;
  error: string | null;
  paywallVisible: boolean;
  paywallDismissedThisSession: boolean;

  setPaywallVisible: (visible: boolean) => void;
  dismissPaywall: () => void;
  checkIn: (energyScore: number, sleepQuality: CheckIn['sleep_quality'], intention?: string | null) => Promise<void>;
  safeHarborBypass: () => Promise<void>;
  startSession: () => Promise<void>;
  completeBlock: (dbBlockId: string, actualDuration: number) => Promise<void>;
  skipBlock: (dbBlockId: string) => Promise<void>;
  completeSession: (ratingDelta: number, notes: string | null) => Promise<void>;
  abandonSession: () => Promise<void>;
  loadStatsAndHistory: () => Promise<void>;
  getFreeSessionsCount: () => Promise<number>;
}

const ENGINE_VERSION = 'v3.0';

export function mapEnergyToState(score: number): UserState {
  if (score === 1) return 'overloaded';
  if (score <= 3) return 'recovering';
  if (score === 4) return 'regulated';
  return 'activated';
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentCheckIn: null,
  currentSession: null,
  composedBlocks: [],
  activeBlockIndex: 0,
  userStats: [],
  paywallVisible: false,
  paywallDismissedThisSession: false,
  setPaywallVisible: (visible) => set({ paywallVisible: visible }),
  // One-tap, pressure-free dismissal. The paywall won't auto-reappear again this
  // session (anti-guilt); a fresh app launch resets the flag.
  dismissPaywall: () => set({ paywallVisible: false, paywallDismissedThisSession: true }),
  loading: false,
  error: null,

  loadStatsAndHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true, error: null });
    try {
      // 1. Fetch user exercise stats
      const { data: statsData } = await supabase
        .from('user_exercise_stats')
        .select('*')
        .eq('user_id', user.id);

      // 2. Fetch last completed check-in of today (if any)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: checkInData } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      // 3. Fetch current active session (if any in status generated/started)
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['generated', 'started'])
        .order('created_at', { ascending: false })
        .limit(1);

      let currentSession: Session | null = null;
      let composedBlocks: ComposedBlockWithExercise[] = [];

      if (sessionData && sessionData.length > 0) {
        const activeSess = sessionData[0];
        currentSession = activeSess;
        
        // Fetch session blocks
        const { data: blocksData } = await supabase
          .from('session_blocks')
          .select('*, exercise:exercises(*)')
          .eq('session_id', activeSess.id)
          .order('block_order', { ascending: true });

        if (blocksData) {
          composedBlocks = blocksData.map((b: any) => ({
            dbBlockId: b.id,
            exercise: b.exercise,
            target_duration: b.target_duration,
            status: b.status,
          }));
        }
      }

      set({
        userStats: statsData || [],
        currentCheckIn: checkInData && checkInData.length > 0 ? checkInData[0] : null,
        currentSession,
        composedBlocks,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  checkIn: async (energyScore, sleepQuality, intention) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    set({ loading: true, error: null });
    try {
      // Check for Premium status and Free Session Count limit
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      const isPremium = Boolean(profile?.is_premium);
      if (!isPremium) {
        const freeCount = await get().getFreeSessionsCount();
        if (freeCount >= 5) {
          // Gate still holds, but only surface the paywall if the user hasn't
          // already waved it away this session — never nag.
          set({
            paywallVisible: !get().paywallDismissedThisSession,
            loading: false,
          });
          return;
        }
      }
      // 1. Save check-in
      const { data: checkIn, error: ciErr } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          energy_score: energyScore,
          sleep_quality: sleepQuality,
          intention: intention?.trim() || null,
          engine_version: ENGINE_VERSION,
        })
        .select()
        .single();

      if (ciErr) throw ciErr;

      // 2. Fetch exercises the user is entitled to (free users skip premium packs)
      const { data: allExercises } = await supabase.from('exercises').select('*');
      if (!allExercises || allExercises.length === 0) throw new Error('No exercises found in library');
      const exercises = visibleExercises(allExercises, isPremium);

      // 3. Fetch recent exercise history (last 10 completed exercise IDs to prevent repetition)
      const { data: recentBlocks } = await supabase
        .from('session_blocks')
        .select('exercise_id')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentExerciseIds = (recentBlocks || []).map((b) => b.exercise_id);

      // 3b. Fetch behavioral profile to personalize composition (Composer v3).
      //     Returns null offline/on error — the composer then falls back to
      //     baseline composition, so this never blocks a check-in.
      const behavioralProfile = (await fetchBehavioralProfile()) ?? undefined;

      // 4. Compose session
      const state = mapEnergyToState(energyScore);
      const composed = composeSession({
        state,
        exercises,
        recentExerciseIds,
        userStats: get().userStats,
        profile: behavioralProfile,
      });

      // 5. Create Session
      const { data: session, error: sErr } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          check_in_id: checkIn.id,
          state,
          engine_version: ENGINE_VERSION,
          status: 'generated',
        })
        .select()
        .single();

      if (sErr) throw sErr;

      // 6. Insert blocks
      const blocksToInsert = composed.map((c, idx) => ({
        session_id: session.id,
        exercise_id: c.exercise.id,
        block_order: idx,
        target_duration: c.target_duration,
        status: 'pending',
      }));

      const { data: insertedBlocks, error: bErr } = await supabase
        .from('session_blocks')
        .insert(blocksToInsert)
        .select('*, exercise:exercises(*)');

      if (bErr) throw bErr;

      const mappedBlocks = (insertedBlocks || [])
        .sort((a, b) => a.block_order - b.block_order)
        .map((b: any) => ({
          dbBlockId: b.id,
          exercise: b.exercise,
          target_duration: b.target_duration,
          status: b.status,
        }));

      set({
        currentCheckIn: checkIn,
        currentSession: session,
        composedBlocks: mappedBlocks,
        activeBlockIndex: 0,
        loading: false,
      });

      telemetry.capture('checkin_completed', { energyScore, sleepQuality, state });
      telemetry.capture('session_generated', { sessionId: session.id, state, blockCount: mappedBlocks.length });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
      throw err;
    }
  },

  safeHarborBypass: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    set({ loading: true, error: null });
    try {
      const { data: exercises } = await supabase.from('exercises').select('*');
      if (!exercises || exercises.length === 0) throw new Error('No exercises found in library');

      // Safe Harbor always composes a short overloaded (recovery) session
      const state = 'overloaded';
      const composed = composeSession({
        state,
        exercises,
        recentExerciseIds: [],
      });

      // Create session without check_in_id
      const { data: session, error: sErr } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          check_in_id: null,
          state,
          engine_version: ENGINE_VERSION,
          status: 'generated',
        })
        .select()
        .single();

      if (sErr) throw sErr;

      const blocksToInsert = composed.map((c, idx) => ({
        session_id: session.id,
        exercise_id: c.exercise.id,
        block_order: idx,
        target_duration: c.target_duration,
        status: 'pending',
      }));

      const { data: insertedBlocks, error: bErr } = await supabase
        .from('session_blocks')
        .insert(blocksToInsert)
        .select('*, exercise:exercises(*)');

      if (bErr) throw bErr;

      const mappedBlocks = (insertedBlocks || [])
        .sort((a, b) => a.block_order - b.block_order)
        .map((b: any) => ({
          dbBlockId: b.id,
          exercise: b.exercise,
          target_duration: b.target_duration,
          status: b.status,
        }));

      set({
        currentCheckIn: null,
        currentSession: session,
        composedBlocks: mappedBlocks,
        activeBlockIndex: 0,
        loading: false,
      });

      telemetry.capture('safe_harbor_bypass', { sessionId: session.id });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
      throw err;
    }
  },

  startSession: async () => {
    const session = get().currentSession;
    if (!session) return;

    try {
      await supabase
        .from('sessions')
        .update({ status: 'started' })
        .eq('id', session.id);

      set((s) => ({
        currentSession: s.currentSession ? { ...s.currentSession, status: 'started' } : null,
      }));

      telemetry.capture('session_started', { sessionId: session.id, state: session.state });
    } catch (err) {
      console.warn('Could not start session:', err);
    }
  },

  completeBlock: async (dbBlockId, actualDuration) => {
    const { composedBlocks, activeBlockIndex } = get();
    try {
      await supabase
        .from('session_blocks')
        .update({ status: 'completed', actual_duration: actualDuration })
        .eq('id', dbBlockId);

      const updatedBlocks = composedBlocks.map((b) =>
        b.dbBlockId === dbBlockId ? { ...b, status: 'completed' as const } : b
      );

      set({
        composedBlocks: updatedBlocks,
        activeBlockIndex: activeBlockIndex + 1,
      });

      telemetry.capture('block_completed', { dbBlockId, actualDuration });
    } catch (err) {
      console.warn('Could not complete block:', err);
    }
  },

  skipBlock: async (dbBlockId) => {
    const { composedBlocks, activeBlockIndex } = get();
    try {
      await supabase
        .from('session_blocks')
        .update({ status: 'skipped' })
        .eq('id', dbBlockId);

      const updatedBlocks = composedBlocks.map((b) =>
        b.dbBlockId === dbBlockId ? { ...b, status: 'skipped' as const } : b
      );

      set({
        composedBlocks: updatedBlocks,
        activeBlockIndex: activeBlockIndex + 1,
      });

      telemetry.capture('block_skipped', { dbBlockId });
    } catch (err) {
      console.warn('Could not skip block:', err);
    }
  },

  completeSession: async (ratingDelta, notes) => {
    const session = get().currentSession;
    if (!session) return;

    set({ loading: true, error: null });
    try {
      // 1. Submit rating + mark complete. If the network is down, queue the
      //    rating to the offline outbox and finish optimistically — the rating
      //    replays on next launch, so the user is never blocked or blamed.
      try {
        await supabase.from('post_ratings').insert({
          session_id: session.id,
          rating_delta: ratingDelta,
          notes,
        });
        await supabase
          .from('sessions')
          .update({ status: 'completed' })
          .eq('id', session.id);
      } catch (writeErr) {
        if (isNetworkError(writeErr)) {
          await enqueueRating({ sessionId: session.id, ratingDelta, notes });
        } else {
          throw writeErr;
        }
      }

      telemetry.capture('session_completed', { sessionId: session.id, ratingDelta });

      // Schedule adaptive nudge based on behavioral profile (best-effort)
      try {
        const { scheduleAdaptiveNudge } = await import('@/services/notifications');
        const p = await fetchBehavioralProfile();
        await scheduleAdaptiveNudge(p?.recovery.signal ?? null);
      } catch (nErr) {
        console.warn('Could not schedule notification on completeSession:', nErr);
      }

      // Reload stats to pull trigger updates (best-effort; skipped when offline)
      try {
        await get().loadStatsAndHistory();
      } catch (statsErr) {
        console.warn('Could not reload stats on completeSession:', statsErr);
      }

      set({
        currentSession: null,
        composedBlocks: [],
        activeBlockIndex: 0,
        loading: false,
      });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
      throw err;
    }
  },

  abandonSession: async () => {
    const session = get().currentSession;
    if (!session) return;

    set({ loading: true, error: null });
    try {
      await supabase
        .from('sessions')
        .update({ status: 'abandoned' })
        .eq('id', session.id);

      telemetry.capture('session_abandoned', { sessionId: session.id, blockIndex: get().activeBlockIndex });

      // Schedule adaptive nudge based on behavioral profile
      try {
        const { fetchBehavioralProfile } = await import('@/services/behavioralProfile');
        const { scheduleAdaptiveNudge } = await import('@/services/notifications');
        const p = await fetchBehavioralProfile();
        await scheduleAdaptiveNudge(p?.recovery.signal ?? null);
      } catch (nErr) {
        console.warn('Could not schedule notification on abandonSession:', nErr);
      }

      set({
        currentSession: null,
        composedBlocks: [],
        activeBlockIndex: 0,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  getFreeSessionsCount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    return count || 0;
  },
}));
