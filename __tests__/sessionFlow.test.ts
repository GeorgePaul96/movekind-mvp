import type { Exercise } from '../src/types';

/**
 * Integration-ish test of the session store's happy path:
 * check-in → composed session → rating. Supabase is replaced with a small
 * stateful query-builder mock; the composer and store logic run for real.
 */

const mockExercises: Exercise[] = [
  { id: '1', name: 'Box Breathing', category: 'regulate', base_difficulty: 1, cues: ['Inhale'], illustration_ref: '', created_at: '' },
  { id: '2', name: 'Somatic Shake', category: 'regulate', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '3', name: 'Hip 90/90', category: 'mobilize', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '4', name: 'Downward Dog', category: 'mobilize', base_difficulty: 2, cues: [], illustration_ref: '', created_at: '' },
  { id: '5', name: 'Air Squat', category: 'strengthen', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '6', name: 'Push-up', category: 'strengthen', base_difficulty: 2, cues: [], illustration_ref: '', created_at: '' },
  { id: '7', name: 'March in Place', category: 'move', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '8', name: 'Lateral Hops', category: 'move', base_difficulty: 2, cues: [], illustration_ref: '', created_at: '' },
  { id: '9', name: 'Childs Pose', category: 'downshift', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
  { id: '10', name: 'Legs up Wall', category: 'downshift', base_difficulty: 1, cues: [], illustration_ref: '', created_at: '' },
];

const mockCalls: { table: string; op: string; payload: any }[] = [];
const mockConfig = { premium: true, completedCount: 0, failCheckInInsert: false };

jest.mock('../src/services/supabase', () => {
  // Defined inside the factory so jest's hoisting rules are satisfied.
  // `mock`-prefixed names (mockExercises, mockCalls, mockConfig) are allowed.
  const resolveResult = (state: any, single: boolean) => {
    const { table, op, payload } = state;
    switch (table) {
      case 'profiles':
        return { data: { is_premium: mockConfig.premium }, error: null };
      case 'exercises':
        return { data: mockExercises, error: null };
      case 'check_ins':
        if (op === 'insert') {
          return mockConfig.failCheckInInsert
            ? { data: null, error: new Error('network down') }
            : { data: { id: 'ci1', created_at: new Date().toISOString(), ...(payload || {}) }, error: null };
        }
        if (op === 'update') return { data: { id: 'ci1', ...(payload || {}) }, error: null };
        return { data: [], error: null };
      case 'sessions':
        if (op === 'insert') return { data: { id: 'sess1', ...(payload || {}) }, error: null };
        return single ? { data: null, error: null } : { data: [], count: mockConfig.completedCount, error: null };
      case 'session_blocks':
        if (op === 'insert') {
          const rows = (payload || []).map((b: any, i: number) => ({
            id: `blk${i}`,
            block_order: b.block_order,
            target_duration: b.target_duration,
            status: b.status,
            exercise: mockExercises.find((e) => e.id === b.exercise_id),
          }));
          return { data: rows, error: null };
        }
        return { data: [], error: null };
      case 'user_exercise_stats':
      case 'post_ratings':
        return { data: [], error: null };
      default:
        return { data: [], error: null };
    }
  };

  const makeBuilder = (table: string) => {
    const state: any = { table, op: 'select', payload: null };
    const builder: any = {
      select: () => {
        if (table === 'profiles') mockCalls.push({ table, op: 'select', payload: null });
        return builder;
      },
      insert: (p: unknown) => {
        state.op = 'insert'; state.payload = p;
        mockCalls.push({ table, op: 'insert', payload: p });
        return builder;
      },
      update: (p: unknown) => {
        state.op = 'update'; state.payload = p;
        mockCalls.push({ table, op: 'update', payload: p });
        return builder;
      },
      upsert: (p: unknown) => { state.op = 'upsert'; state.payload = p; return builder; },
      eq: () => builder,
      in: () => builder,
      gte: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => Promise.resolve(resolveResult(state, true)),
      maybeSingle: () => Promise.resolve(resolveResult(state, true)),
      then: (onF: any, onR: any) => Promise.resolve(resolveResult(state, false)).then(onF, onR),
    };
    return builder;
  };

  return {
    supabase: {
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: 'user1' } } })),
        updateUser: jest.fn(async () => ({ data: {}, error: null })),
      },
      from: jest.fn((table: string) => makeBuilder(table)),
    },
  };
});

jest.mock('../src/services/telemetry', () => ({
  telemetry: { capture: jest.fn(), identify: jest.fn(), reset: jest.fn() },
}));

jest.mock('../src/services/notifications', () => ({
  scheduleAdaptiveNudge: jest.fn(async () => {}),
  initNotifications: jest.fn(async () => {}),
}));

// Return null → composer falls back to baseline composition, keeping this
// flow test focused on orchestration rather than the recovery heuristics.
jest.mock('../src/services/behavioralProfile', () => ({
  fetchBehavioralProfile: jest.fn(async () => null),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { useSessionStore } from '../src/store/sessionStore';

describe('session flow: check-in → session → rating', () => {
  // completeSession uses dynamic import() for the nudge, which Jest's VM can't
  // run; the store catches it. Silence the expected warn to keep output clean.
  let warnSpy: jest.SpyInstance;
  beforeAll(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterAll(() => warnSpy.mockRestore());

  beforeEach(() => {
    mockCalls.length = 0;
    Object.assign(mockConfig, { premium: true, completedCount: 0, failCheckInInsert: false });
    useSessionStore.setState({
      currentCheckIn: null,
      currentSession: null,
      composedBlocks: [],
      activeBlockIndex: 0,
      userStats: [],
      loading: false,
      error: null,
      paywallVisible: false,
      paywallDismissedThisSession: false,
      homeStep: 'done',
      week: null,
    });
  });

  it('logs a one-tap check-in without composing or touching the paywall', async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    const s = useSessionStore.getState();
    expect(s.currentCheckIn).toMatchObject({ id: 'ci1', energy_score: 4, sleep_quality: null, intention: null });
    expect(s.homeStep).toBe('logged');
    expect(s.currentSession).toBeNull();
    expect(s.paywallVisible).toBe(false);
    expect(mockCalls.some((c) => c.table === 'profiles')).toBe(false);
  });

  it("composes today's session from the logged mood", async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    const s = useSessionStore.getState();
    expect(s.error).toBeNull();
    expect(s.currentSession).toMatchObject({ id: 'sess1', state: 'regulated', check_in_id: 'ci1' });
    // regulated → mobilize, strengthen, move, downshift
    expect(s.composedBlocks.map((b) => b.exercise.category)).toEqual(['mobilize', 'strengthen', 'move', 'downshift']);
  });

  it('shows the paywall only when starting a session past the free limit', async () => {
    mockConfig.premium = false;
    mockConfig.completedCount = 5;
    await useSessionStore.getState().logCheckIn('recovering');
    expect(useSessionStore.getState().paywallVisible).toBe(false);
    await useSessionStore.getState().startTodaysSession();
    expect(useSessionStore.getState().paywallVisible).toBe(true);
    expect(useSessionStore.getState().currentSession).toBeNull();
  });

  it('completes the session, resets state and returns Home to the week view', async () => {
    await useSessionStore.getState().logCheckIn('regulated');
    await useSessionStore.getState().startTodaysSession();
    await useSessionStore.getState().completeSession(2, 'felt great');
    const s = useSessionStore.getState();
    expect(s.error).toBeNull();
    expect(s.currentSession).toBeNull();
    expect(s.composedBlocks).toEqual([]);
    expect(s.activeBlockIndex).toBe(0);
    expect(s.loading).toBe(false);
    expect(s.homeStep).toBe('done');
  });

  it("adds sleep and a trimmed note to today's check-in", async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    await useSessionStore.getState().updateCheckIn({ sleep_quality: 'poor', intention: '  move gently  ' });
    const ci = useSessionStore.getState().currentCheckIn;
    expect(ci).toMatchObject({ sleep_quality: 'poor', intention: 'move gently' });
    expect(mockCalls.filter((c) => c.table === 'check_ins' && c.op === 'update')).toHaveLength(1);
  });

  it('stores null for a blank note', async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    await useSessionStore.getState().updateCheckIn({ intention: '   ' });
    expect(useSessionStore.getState().currentCheckIn?.intention).toBeNull();
  });

  it("changing today's mood updates the existing row instead of inserting", async () => {
    await useSessionStore.getState().logCheckIn('overloaded');
    useSessionStore.getState().changeTodaysCheckIn();
    expect(useSessionStore.getState().homeStep).toBe('pick');
    await useSessionStore.getState().logCheckIn('activated');
    expect(mockCalls.filter((c) => c.table === 'check_ins' && c.op === 'insert')).toHaveLength(1);
    expect(useSessionStore.getState().currentCheckIn?.energy_score).toBe(5);
    expect(useSessionStore.getState().homeStep).toBe('logged');
  });

  it('keeps nothing and rethrows when the check-in cannot be saved', async () => {
    mockConfig.failCheckInInsert = true;
    await expect(useSessionStore.getState().logCheckIn('regulated')).rejects.toBeTruthy();
    expect(useSessionStore.getState().currentCheckIn).toBeNull();
    expect(useSessionStore.getState().homeStep).toBe('done');
  });

  it('dismissForToday moves Home to the week view', async () => {
    await useSessionStore.getState().logCheckIn('recovering');
    useSessionStore.getState().dismissForToday();
    expect(useSessionStore.getState().homeStep).toBe('done');
  });

  it('loadWeek never throws and yields a comparison', async () => {
    await useSessionStore.getState().loadWeek();
    expect(useSessionStore.getState().week).toEqual({
      thisWeek: { days: 0, minutes: 0 },
      lastWeek: { days: 0, minutes: 0 },
      daily: [null, null, null, null, null, null, null],
    });
  });
});
