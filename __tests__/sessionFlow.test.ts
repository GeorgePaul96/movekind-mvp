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

jest.mock('../src/services/supabase', () => {
  // Defined inside the factory so jest's hoisting rules are satisfied.
  // `mockExercises` is allowed because it is `mock`-prefixed.
  const resolveResult = (state: any, single: boolean) => {
    const { table, op, payload } = state;
    switch (table) {
      case 'profiles':
        return { data: { is_premium: true }, error: null };
      case 'exercises':
        return { data: mockExercises, error: null };
      case 'check_ins':
        return op === 'insert'
          ? { data: { id: 'ci1', ...(payload || {}) }, error: null }
          : { data: [], error: null };
      case 'sessions':
        if (op === 'insert') return { data: { id: 'sess1', ...(payload || {}) }, error: null };
        return single ? { data: null, error: null } : { data: [], error: null };
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
      select: () => builder,
      insert: (p: unknown) => { state.op = 'insert'; state.payload = p; return builder; },
      update: (p: unknown) => { state.op = 'update'; state.payload = p; return builder; },
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
    useSessionStore.setState({
      currentCheckIn: null,
      currentSession: null,
      composedBlocks: [],
      activeBlockIndex: 0,
      userStats: [],
      loading: false,
      error: null,
      paywallVisible: false,
    });
  });

  it('composes a regulated session from a check-in', async () => {
    await useSessionStore.getState().checkIn(4, 'good');
    const s = useSessionStore.getState();

    expect(s.error).toBeNull();
    expect(s.currentCheckIn).toMatchObject({ id: 'ci1', energy_score: 4 });
    expect(s.currentSession).toMatchObject({ id: 'sess1', state: 'regulated' });
    // regulated → mobilize, strengthen, move, downshift
    expect(s.composedBlocks).toHaveLength(4);
    expect(s.composedBlocks.map((b) => b.exercise.category)).toEqual([
      'mobilize',
      'strengthen',
      'move',
      'downshift',
    ]);
  });

  it('completes the session and resets store state after rating', async () => {
    await useSessionStore.getState().checkIn(4, 'good');
    await useSessionStore.getState().completeSession(2, 'felt great');

    const s = useSessionStore.getState();
    expect(s.error).toBeNull();
    expect(s.currentSession).toBeNull();
    expect(s.composedBlocks).toEqual([]);
    expect(s.activeBlockIndex).toBe(0);
    expect(s.loading).toBe(false);
  });

  it('captures a trimmed intention on the check-in', async () => {
    await useSessionStore.getState().checkIn(4, 'good', '  move gently  ');
    expect(useSessionStore.getState().currentCheckIn?.intention).toBe('move gently');
  });

  it('stores null when no intention is given', async () => {
    await useSessionStore.getState().checkIn(4, 'good');
    expect(useSessionStore.getState().currentCheckIn?.intention).toBeNull();
  });
});
