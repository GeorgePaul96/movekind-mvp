import { create } from 'zustand';
import { db, type BlockWithExercise } from '@/services/db';
import { telemetry } from '@/services/telemetry';
import { friendlyErrorMessage } from '@/services/network';
import { fetchBehavioralProfile } from '@/services/behavioralProfile';
import { composeSession } from '@/domain/sessions/composer';
import { visibleExercises } from '@/domain/premium/entitlements';
import { mapEnergyToState, moodToEnergy } from '@/domain/checkin/moods';
import { compareWeeks, isSameLocalDay, weekBounds, type WeekComparison } from '@/domain/insights/weekCompare';
export { mapEnergyToState } from '@/domain/checkin/moods';
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
  /** Which non-session Home view to show: mood tiles, the just-logged panel, or the week. */
  homeStep: 'pick' | 'logged' | 'done';
  week: WeekComparison | null;

  setPaywallVisible: (visible: boolean) => void;
  dismissPaywall: () => void;
  logCheckIn: (mood: UserState) => Promise<void>;
  updateCheckIn: (patch: {
    sleep_quality?: CheckIn['sleep_quality'];
    intention?: string | null;
    energy_score?: number;
  }) => Promise<void>;
  startTodaysSession: () => Promise<void>;
  dismissForToday: () => void;
  changeTodaysCheckIn: () => void;
  loadWeek: () => Promise<void>;
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

const toComposed = (blocks: BlockWithExercise[]): ComposedBlockWithExercise[] =>
  blocks.map((b) => ({
    dbBlockId: b.id,
    exercise: b.exercise,
    target_duration: b.target_duration,
    status: b.status,
  }));

const localMidnightIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

/** Saves a composed session and its blocks; returns what the store needs to play it. */
async function persistSession(
  composed: { exercise: Exercise; target_duration: number }[],
  input: Pick<Session, 'check_in_id' | 'state'>,
) {
  const session = await db.sessions.add({ ...input, engine_version: ENGINE_VERSION, status: 'generated' });
  const blocks = await db.blocks.addMany(
    session.id,
    composed.map((c, idx) => ({ exercise_id: c.exercise.id, block_order: idx, target_duration: c.target_duration })),
  );
  return { session, composedBlocks: toComposed(blocks) };
}

async function scheduleNudgeFromProfile(context: string) {
  try {
    const { scheduleAdaptiveNudge } = await import('@/services/notifications');
    const p = await fetchBehavioralProfile();
    await scheduleAdaptiveNudge(p?.recovery.signal ?? null);
  } catch (err) {
    console.warn(`Could not schedule notification on ${context}:`, err);
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentCheckIn: null,
  currentSession: null,
  composedBlocks: [],
  activeBlockIndex: 0,
  userStats: [],
  paywallVisible: false,
  paywallDismissedThisSession: false,
  homeStep: 'done',
  week: null,
  setPaywallVisible: (visible) => set({ paywallVisible: visible }),
  dismissForToday: () => set({ homeStep: 'done' }),
  changeTodaysCheckIn: () => set({ homeStep: 'pick' }),
  // One-tap, pressure-free dismissal. The paywall won't auto-reappear again this
  // session (anti-guilt); a fresh app launch resets the flag.
  dismissPaywall: () => set({ paywallVisible: false, paywallDismissedThisSession: true }),
  loading: false,
  error: null,

  loadStatsAndHistory: async () => {
    set({ loading: true, error: null });
    try {
      const [userStats, todays, active] = await Promise.all([
        db.stats.all(),
        db.checkIns.since(localMidnightIso()),
        db.sessions.latestActive(),
      ]);
      const composedBlocks = active ? toComposed(await db.blocks.forSession(active.id)) : [];

      set({
        userStats,
        currentCheckIn: todays[0] ?? null,
        currentSession: active,
        composedBlocks,
        loading: false,
      });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
    }
  },

  logCheckIn: async (mood) => {
    // Re-picking today's mood edits the existing row: a day is one check-in.
    const existing = get().currentCheckIn;
    if (existing && isSameLocalDay(new Date(existing.created_at), new Date())) {
      await get().updateCheckIn({ energy_score: moodToEnergy(mood) });
      set({ homeStep: 'logged' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // Logging is the free, always-available core action — no paywall here, ever.
      const checkIn = await db.checkIns.add({
        energy_score: moodToEnergy(mood),
        sleep_quality: null,
        intention: null,
        engine_version: ENGINE_VERSION,
      });
      set({ currentCheckIn: checkIn, homeStep: 'logged', loading: false });
      telemetry.capture('checkin_completed', { state: mood });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
      throw err;
    }
  },

  updateCheckIn: async (patch) => {
    const ci = get().currentCheckIn;
    if (!ci) return;
    const clean = { ...patch };
    if ('intention' in clean) clean.intention = clean.intention?.trim() || null;

    await db.checkIns.update(ci.id, clean);
    set({ currentCheckIn: { ...ci, ...clean } });
  },

  startTodaysSession: async () => {
    const checkIn = get().currentCheckIn;
    if (!checkIn) throw new Error('No check-in today');

    set({ loading: true, error: null });
    try {
      const isPremium = (await db.profile.get()).is_premium;
      if (!isPremium) {
        const freeCount = await get().getFreeSessionsCount();
        if (freeCount >= 5) {
          // Gate still holds, but only surface the paywall if the user hasn't
          // already waved it away this session — never nag.
          set({ paywallVisible: !get().paywallDismissedThisSession, loading: false });
          return;
        }
      }

      const exercises = visibleExercises(db.exercises.all(), isPremium);
      const recentExerciseIds = await db.blocks.recentCompletedExerciseIds(10);
      // Behavioral profile personalizes composition (Composer v3); null → baseline.
      const behavioralProfile = (await fetchBehavioralProfile()) ?? undefined;

      const state = mapEnergyToState(checkIn.energy_score);
      const composed = composeSession({
        state,
        exercises,
        recentExerciseIds,
        userStats: get().userStats,
        profile: behavioralProfile,
      });

      const { session, composedBlocks } = await persistSession(composed, { check_in_id: checkIn.id, state });
      set({ currentSession: session, composedBlocks, activeBlockIndex: 0, loading: false });

      telemetry.capture('session_generated', { sessionId: session.id, state, blockCount: composedBlocks.length });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
      throw err;
    }
  },

  safeHarborBypass: async () => {
    set({ loading: true, error: null });
    try {
      // The gentle reset always composes a short overloaded (recovery) session, no check-in.
      const state = 'overloaded';
      const composed = composeSession({ state, exercises: db.exercises.all(), recentExerciseIds: [] });
      const { session, composedBlocks } = await persistSession(composed, { check_in_id: null, state });
      set({ currentCheckIn: null, currentSession: session, composedBlocks, activeBlockIndex: 0, loading: false });

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
      await db.sessions.update(session.id, { status: 'started' });
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
      await db.blocks.update(dbBlockId, { status: 'completed', actual_duration: actualDuration });
      set({
        composedBlocks: composedBlocks.map((b) =>
          b.dbBlockId === dbBlockId ? { ...b, status: 'completed' as const } : b,
        ),
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
      await db.blocks.update(dbBlockId, { status: 'skipped' });
      set({
        composedBlocks: composedBlocks.map((b) =>
          b.dbBlockId === dbBlockId ? { ...b, status: 'skipped' as const } : b,
        ),
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
      // The rating also updates per-exercise stats (see db.ratings.add / applyRating).
      await db.ratings.add({ session_id: session.id, rating_delta: ratingDelta, notes });
      await db.sessions.update(session.id, { status: 'completed' });
      telemetry.capture('session_completed', { sessionId: session.id, ratingDelta });

      await scheduleNudgeFromProfile('completeSession');

      set({ userStats: await db.stats.all() });
      set({
        currentSession: null,
        composedBlocks: [],
        activeBlockIndex: 0,
        loading: false,
        homeStep: 'done',
      });

      // Refresh the week card the user lands on (never throws).
      await get().loadWeek();
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
      await db.sessions.update(session.id, { status: 'abandoned' });
      telemetry.capture('session_abandoned', { sessionId: session.id, blockIndex: get().activeBlockIndex });

      await scheduleNudgeFromProfile('abandonSession');

      set({ currentSession: null, composedBlocks: [], activeBlockIndex: 0, loading: false });
    } catch (err) {
      set({ error: friendlyErrorMessage(err), loading: false });
    }
  },

  loadWeek: async () => {
    try {
      const since = weekBounds(new Date()).lastStart.toISOString();
      const [checkIns, completed, seconds] = await Promise.all([
        db.checkIns.since(since),
        db.sessions.list({ since, statuses: ['completed'] }),
        db.blocks.secondsBySession(),
      ]);
      const sessions = completed.map((s) => ({
        created_at: s.created_at,
        status: s.status,
        seconds: seconds[s.id] ?? 0,
      }));
      set({ week: compareWeeks(checkIns, sessions, new Date()) });
    } catch (err) {
      console.warn('Could not load week:', err);
    }
  },

  getFreeSessionsCount: () => db.sessions.countCompleted(),
}));
